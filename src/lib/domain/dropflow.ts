import {
  differenceInCalendarWeeks,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ALERT_THRESHOLDS } from "@/lib/constants";
import {
  formatCurrency,
  formatFactor,
  formatMetricCurrency,
  formatPercent,
  formatShortDate,
} from "@/lib/formatters";
import type {
  AggregatePoint,
  AnalyticsSnapshot,
  DailyProcessInput,
  DailyProcessMetrics,
  DashboardSnapshot,
  EnrichedDailyProcess,
  InsightAlert,
  MetricCardData,
  NumericMetric,
  TrendPoint,
} from "@/lib/types";

const round = (value: number) => Math.round(value * 100) / 100;

function divide(numerator: number, denominator: number): NumericMetric {
  if (!denominator) {
    return null;
  }

  return round(numerator / denominator);
}

function average(values: NumericMetric[]) {
  const validValues = values.filter((value): value is number => value !== null);

  if (!validValues.length) {
    return null;
  }

  return round(
    validValues.reduce((total, current) => total + current, 0) /
      validValues.length,
  );
}

export function calculateDailyMetrics(
  input: Pick<
    DailyProcessInput,
    | "adSpend"
    | "paymentGatewayCost"
    | "processDate"
    | "productCost"
    | "salePrice"
    | "shippingCost"
    | "unitsSold"
  >,
  accumulatedNet = 0,
): DailyProcessMetrics {
  const totalSales = round(input.salePrice * input.unitsSold);
  const grossProfit = round(totalSales - input.productCost);
  const netProfit = round(
    grossProfit -
      input.shippingCost -
      input.adSpend -
      input.paymentGatewayCost,
  );
  const grossMargin =
    totalSales > 0 ? round((grossProfit / totalSales) * 100) : null;
  const netMargin =
    totalSales > 0 ? round((netProfit / totalSales) * 100) : null;
  const costPerUnit =
    input.unitsSold > 0 ? round(input.productCost / input.unitsSold) : null;
  const averageSalePerUnit =
    input.unitsSold > 0 ? round(totalSales / input.unitsSold) : null;
  const adSpendPerUnit =
    input.unitsSold > 0 ? round(input.adSpend / input.unitsSold) : null;
  const acquisitionCostPerSale = adSpendPerUnit;
  const roas =
    input.adSpend > 0 ? round(totalSales / input.adSpend) : null;
  const grossMarginRatio =
    totalSales > 0 ? input.productCost / totalSales : null;
  const breakEvenSales =
    grossMarginRatio !== null && grossMarginRatio < 1
      ? round(
          (input.shippingCost + input.adSpend + input.paymentGatewayCost) /
            (1 - grossMarginRatio),
        )
      : null;

  return {
    grossProfit,
    netProfit,
    netDayProfit: netProfit,
    accumulatedNet: round(accumulatedNet),
    grossMargin,
    netMargin,
    costPerUnit,
    averageSalePerUnit,
    adSpendPerUnit,
    acquisitionCostPerSale,
    roas,
    breakEvenSales,
  };
}

export function enrichDailyProcesses(records: readonly DailyProcessInput[]) {
  const sortedRecords = [...records].sort((left, right) =>
    left.processDate.localeCompare(right.processDate),
  );

  let accumulatedNet = 0;

  return sortedRecords.map((record) => {
    const partialMetrics = calculateDailyMetrics(record);
    accumulatedNet = round(accumulatedNet + partialMetrics.netProfit);

    return {
      ...record,
      totalSales: round(record.salePrice * record.unitsSold),
      ...partialMetrics,
      accumulatedNet,
    } as EnrichedDailyProcess;
  });
}

function buildMetricCards(records: EnrichedDailyProcess[]): MetricCardData[] {
  const latestRecord = records.at(-1) ?? null;
  const totalSales = round(
    records.reduce((total, current) => total + current.totalSales, 0),
  );
  const totalNetProfit = round(
    records.reduce((total, current) => total + current.netProfit, 0),
  );
  const totalUnits = records.reduce(
    (total, current) => total + current.unitsSold,
    0,
  );
  const accumulatedNet = latestRecord?.accumulatedNet ?? 0;
  const averageRoas = average(records.map((record) => record.roas));
  const averageNetMargin = average(records.map((record) => record.netMargin));

  return [
    {
      label: "Ventas totales",
      value: formatCurrency(totalSales),
      hint: "Periodo visible",
    },
    {
      label: "Utilidad neta",
      value: formatCurrency(totalNetProfit),
      hint: totalNetProfit >= 0 ? "Negocio positivo" : "Hay pérdida acumulada",
      tone: totalNetProfit >= 0 ? "positive" : "negative",
    },
    {
      label: "Acumulado actual",
      value: formatCurrency(accumulatedNet),
      hint: "Suma histórica de utilidad neta",
      tone: accumulatedNet >= 0 ? "positive" : "negative",
    },
    {
      label: "ROAS promedio",
      value: formatFactor(averageRoas),
      hint: "Ventas / ADS",
      tone:
        averageRoas !== null && averageRoas >= ALERT_THRESHOLDS.lowRoas
          ? "positive"
          : "negative",
    },
    {
      label: "Margen neto promedio",
      value: formatPercent(averageNetMargin),
      hint: "Utilidad neta / ventas",
      tone:
        averageNetMargin !== null &&
        averageNetMargin >= ALERT_THRESHOLDS.lowNetMargin
          ? "positive"
          : "negative",
    },
    {
      label: "Unidades vendidas",
      value: String(totalUnits),
      hint: latestRecord ? `Último registro: ${latestRecord.unitsSold}` : "—",
    },
  ];
}

export function buildAlerts(records: EnrichedDailyProcess[]): InsightAlert[] {
  if (!records.length) {
    return [
      {
        title: "Comienza el tracking",
        message:
          "Aún no hay registros. Captura tu primer proceso diario para activar métricas y alertas.",
        tone: "info",
      },
    ];
  }

  const latestRecord = records.at(-1)!;
  const averageRoas = average(records.map((record) => record.roas));
  const alerts: InsightAlert[] = [];

  if (
    latestRecord.netMargin !== null &&
    latestRecord.netMargin < ALERT_THRESHOLDS.lowNetMargin
  ) {
    alerts.push({
      title: "Margen neto bajo",
      message: `El último día cerró en ${formatPercent(
        latestRecord.netMargin,
      )}. Conviene revisar precio, creativo o costos de fulfillment.`,
      tone: "warning",
    });
  }

  if (
    latestRecord.roas !== null &&
    latestRecord.roas < ALERT_THRESHOLDS.lowRoas
  ) {
    alerts.push({
      title: "ROAS por debajo del objetivo",
      message: `Estás en ${formatFactor(
        latestRecord.roas,
      )}. Recomiendo revisar segmentación, oferta y calidad del tráfico.`,
      tone: "danger",
    });
  }

  if (latestRecord.accumulatedNet < 0) {
    alerts.push({
      title: "Déficit acumulado",
      message: `El negocio lleva ${formatCurrency(
        latestRecord.accumulatedNet,
      )}. Vale la pena pausar inversión y depurar la unidad económica.`,
      tone: "danger",
    });
  }

  if (
    latestRecord.adSpendPerUnit !== null &&
    latestRecord.averageSalePerUnit !== null &&
    latestRecord.adSpendPerUnit >
      latestRecord.averageSalePerUnit *
        ALERT_THRESHOLDS.highAdsPerUnitRatio
  ) {
    alerts.push({
      title: "ADS por unidad demasiado alto",
      message: `Cada venta está absorbiendo ${formatMetricCurrency(
        latestRecord.adSpendPerUnit,
      )} de publicidad. Revisa costo por adquisición o ticket promedio.`,
      tone: "warning",
    });
  }

  if (
    averageRoas !== null &&
    averageRoas >= ALERT_THRESHOLDS.lowRoas &&
    latestRecord.accumulatedNet >= 0
  ) {
    alerts.push({
      title: "Momento de escalar",
      message:
        "ROAS y acumulado se mantienen sanos. Puedes aumentar presupuesto de forma gradual y medir retorno.",
      tone: "success",
    });
  }

  if (
    latestRecord.netMargin !== null &&
    latestRecord.netMargin >= ALERT_THRESHOLDS.healthyNetMargin
  ) {
    alerts.push({
      title: "Día rentable",
      message: `El margen neto del último corte quedó en ${formatPercent(
        latestRecord.netMargin,
      )}. Ese producto merece más presupuesto y seguimiento.`,
      tone: "success",
    });
  }

  return alerts.slice(0, 5);
}

export function buildDashboardSnapshot(
  records: EnrichedDailyProcess[],
): DashboardSnapshot {
  const totalSales = round(
    records.reduce((total, current) => total + current.totalSales, 0),
  );
  const totalNetProfit = round(
    records.reduce((total, current) => total + current.netProfit, 0),
  );
  const totalUnits = records.reduce(
    (total, current) => total + current.unitsSold,
    0,
  );
  const latestRecord = records.at(-1) ?? null;
  const accumulatedNet = latestRecord?.accumulatedNet ?? 0;
  const averageRoas = average(records.map((record) => record.roas));
  const averageNetMargin = average(records.map((record) => record.netMargin));

  return {
    totalSales,
    totalNetProfit,
    totalUnits,
    latestRecord,
    accumulatedNet,
    averageRoas,
    averageNetMargin,
    metricCards: buildMetricCards(records),
    alerts: buildAlerts(records),
    recentTrend: records.slice(-7).map((record) => ({
      label: formatShortDate(record.processDate),
      date: record.processDate,
      sales: record.totalSales,
      netProfit: record.netProfit,
      adSpend: record.adSpend,
      roas: record.roas,
      netMargin: record.netMargin,
      accumulatedNet: record.accumulatedNet,
      unitsSold: record.unitsSold,
      productId: record.productId,
      productName: record.productName,
      acquisitionCostPerSale: record.acquisitionCostPerSale,
    })),
  };
}

function toTrendPoint(record: EnrichedDailyProcess): TrendPoint {
  return {
    label: formatShortDate(record.processDate),
    date: record.processDate,
    sales: record.totalSales,
    netProfit: record.netProfit,
    adSpend: record.adSpend,
    roas: record.roas,
    netMargin: record.netMargin,
    accumulatedNet: record.accumulatedNet,
    unitsSold: record.unitsSold,
    productId: record.productId,
    productName: record.productName,
    acquisitionCostPerSale: record.acquisitionCostPerSale,
  };
}

function accumulateByKey(
  records: EnrichedDailyProcess[],
  getKey: (record: EnrichedDailyProcess) => string,
): AggregatePoint[] {
  const map = new Map<string, AggregatePoint>();

  for (const record of records) {
    const key = getKey(record);
    const current = map.get(key) ?? {
      label: key,
      sales: 0,
      netProfit: 0,
      adSpend: 0,
      unitsSold: 0,
    };

    current.sales = round(current.sales + record.totalSales);
    current.netProfit = round(current.netProfit + record.netProfit);
    current.adSpend = round(current.adSpend + record.adSpend);
    current.unitsSold += record.unitsSold;

    map.set(key, current);
  }

  return [...map.values()];
}

export function buildAnalyticsSnapshot(
  records: EnrichedDailyProcess[],
): AnalyticsSnapshot {
  const dailyTrend = records.map(toTrendPoint);
  const weeklyTrend = accumulateByKey(records, (record) => {
    const date = parseISO(record.processDate);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekNumber =
      differenceInCalendarWeeks(date, startOfMonth(date), {
        weekStartsOn: 1,
      }) + 1;

    return `${format(weekStart, "d MMM", { locale: es })} · Semana ${weekNumber}`;
  });
  const monthlyTrend = accumulateByKey(records, (record) =>
    format(parseISO(record.processDate), "MMM yyyy", { locale: es }),
  );

  const totalSales = round(
    records.reduce((total, current) => total + current.totalSales, 0),
  );
  const totalNetProfit = round(
    records.reduce((total, current) => total + current.netProfit, 0),
  );
  const averageNetMargin = average(records.map((record) => record.netMargin));
  const averageRoas = average(records.map((record) => record.roas));
  const profitableDays = records.filter((record) => record.netProfit >= 0).length;
  const averageTicket = average(
    records.map((record) => divide(record.totalSales, record.unitsSold)),
  );

  return {
    summaryCards: [
      {
        label: "Ventas acumuladas",
        value: formatCurrency(totalSales),
        hint: "Suma histórica",
      },
      {
        label: "Utilidad neta total",
        value: formatCurrency(totalNetProfit),
        hint: totalNetProfit >= 0 ? "Resultado positivo" : "Resultado negativo",
        tone: totalNetProfit >= 0 ? "positive" : "negative",
      },
      {
        label: "Margen neto promedio",
        value: formatPercent(averageNetMargin),
        hint: "Promedio del periodo",
        tone:
          averageNetMargin !== null &&
          averageNetMargin >= ALERT_THRESHOLDS.lowNetMargin
            ? "positive"
            : "negative",
      },
      {
        label: "ROAS promedio",
        value: formatFactor(averageRoas),
        hint: "Ventas por cada peso en ADS",
        tone:
          averageRoas !== null && averageRoas >= ALERT_THRESHOLDS.lowRoas
            ? "positive"
            : "negative",
      },
      {
        label: "Días rentables",
        value: `${profitableDays}/${records.length}`,
        hint: "Días con utilidad neta positiva",
      },
      {
        label: "Costo por venta promedio",
        value: formatMetricCurrency(
          average(records.map((record) => record.acquisitionCostPerSale)),
        ),
        hint: "ADS / unidades vendidas",
      },
      {
        label: "Ticket promedio por unidad",
        value: formatMetricCurrency(averageTicket),
        hint: "Referencia para pricing",
      },
    ],
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    topDays: [...records].sort((left, right) => right.netProfit - left.netProfit).slice(0, 3),
    lossDays: [...records].sort((left, right) => left.netProfit - right.netProfit).slice(0, 3),
  };
}

export function buildMonthlySummary(records: EnrichedDailyProcess[]) {
  const totalSales = round(
    records.reduce((total, current) => total + current.totalSales, 0),
  );
  const totalNet = round(
    records.reduce((total, current) => total + current.netProfit, 0),
  );
  const averageMargin = average(records.map((record) => record.netMargin));
  const averageRoas = average(records.map((record) => record.roas));
  const totalUnits = records.reduce(
    (total, current) => total + current.unitsSold,
    0,
  );

  return [
    {
      label: "Ventas del filtro",
      value: formatCurrency(totalSales),
      hint: `Unidades: ${totalUnits}`,
    },
    {
      label: "Utilidad del filtro",
      value: formatCurrency(totalNet),
      hint: totalNet >= 0 ? "Resultado sano" : "Revisar costos",
      tone: totalNet >= 0 ? "positive" : "negative",
    },
    {
      label: "Margen neto promedio",
      value: formatPercent(averageMargin),
      hint: "Promedio de los días visibles",
      tone:
        averageMargin !== null && averageMargin >= ALERT_THRESHOLDS.lowNetMargin
          ? "positive"
          : "negative",
    },
    {
      label: "ROAS promedio",
      value: formatFactor(averageRoas),
      hint: "Promedio del filtro",
      tone:
        averageRoas !== null && averageRoas >= ALERT_THRESHOLDS.lowRoas
          ? "positive"
          : "negative",
    },
  ] as MetricCardData[];
}

export function explainBreakEvenFormula() {
  return "Punto de equilibrio aproximado = (Envío + ADS + Pasarela) / (1 - CostoProducto / Ventas).";
}

export function explainBusinessRecommendations() {
  return [
    "Agregar un catálogo de productos y campañas para separar rentabilidad por producto.",
    "Crear metas configurables de margen neto y ROAS para personalizar alertas.",
    "Integrar conciliación de pagos y estados de proveedor para cerrar el flujo financiero completo.",
    "Agregar autenticación y roles cuando el negocio tenga más de una persona operando.",
  ];
}

export function buildArchitectureSummary() {
  return {
    database: "Supabase Postgres con Drizzle ORM y esquema tipado.",
    runtime:
      "Next.js App Router con páginas server-first y componentes cliente solo para interacción, filtros y gráficas.",
    domain:
      "Cálculos financieros centralizados en una sola capa para evitar diferencias entre formulario, dashboard e historial.",
    deployment:
      "Preparado para Vercel con variables de entorno y clientes de base de datos con inicialización perezosa.",
  };
}

export function buildDateRangeLabel(records: EnrichedDailyProcess[]) {
  if (!records.length) {
    return "Sin registros";
  }

  const firstRecord = parseISO(records[0].processDate);
  const lastRecord = parseISO(records[records.length - 1].processDate);

  return `${format(firstRecord, "d MMM", { locale: es })} - ${format(
    endOfMonth(lastRecord) < lastRecord ? endOfMonth(lastRecord) : lastRecord,
    "d MMM yyyy",
    { locale: es },
  )}`;
}
