import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { NumericMetric } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompactNumber(value: number) {
  return integerFormatter.format(value);
}

export function formatPercent(value: NumericMetric) {
  if (value === null) {
    return "—";
  }

  return `${decimalFormatter.format(value)}%`;
}

export function formatFactor(value: NumericMetric) {
  if (value === null) {
    return "—";
  }

  return `${decimalFormatter.format(value)}x`;
}

export function formatMetricCurrency(value: NumericMetric) {
  if (value === null) {
    return "—";
  }

  return formatCurrency(value);
}

export function formatShortDate(value: string) {
  return format(parseISO(value), "d MMM", { locale: es });
}

export function formatLongDate(value: string) {
  return format(parseISO(value), "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function getTodayInMexicoCity() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());
}
