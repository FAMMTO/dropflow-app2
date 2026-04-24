"use client";

import { useState } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/app/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  formatCurrency,
  formatFactor,
  formatLongDate,
  formatPercent,
} from "@/lib/formatters";
import type { AnalyticsSnapshot, ProductConfigRecord } from "@/lib/types";

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function ChartShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({
  snapshot,
  products,
  productSnapshots,
}: {
  snapshot: AnalyticsSnapshot;
  products: ProductConfigRecord[];
  productSnapshots: Record<string, AnalyticsSnapshot>;
}) {
  const isClient = useIsClient();
  const [selectedProductId, setSelectedProductId] = useState("all");
  const activeSnapshot =
    selectedProductId === "all"
      ? snapshot
      : productSnapshots[selectedProductId] ?? snapshot;
  const profitabilitySplit = [
    {
      label: "Rentables",
      value: activeSnapshot.dailyTrend.filter((day) => day.netProfit >= 0).length,
      color: "rgba(29,158,117,0.82)",
    },
    {
      label: "En pérdida",
      value: activeSnapshot.dailyTrend.filter((day) => day.netProfit < 0).length,
      color: "rgba(226,75,74,0.82)",
    },
  ];

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics avanzados</CardTitle>
          <CardDescription>Preparando gráficas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[420px] animate-pulse rounded-2xl bg-muted/60" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-3">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Filtro por producto
              </p>
              <p className="text-sm text-muted-foreground">
                Analiza ventas, utilidad, ROAS y costo por venta por producto.
              </p>
            </div>
            <Select
              className="max-w-sm"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
            >
              <option value="all">Todos los productos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {activeSnapshot.summaryCards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell
          title="Ventas, utilidad y acumulado"
          description="Lectura diaria de la salud financiera del negocio."
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSnapshot.dailyTrend}>
                <defs>
                  <linearGradient id="netFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                  formatter={(value, name) => {
                    const numericValue = toNumber(value);

                    if (name === "accumulatedNet") {
                      return [formatCurrency(numericValue), "Acumulado"];
                    }

                    return [
                      formatCurrency(numericValue),
                      name === "sales" ? "Ventas" : "Utilidad neta",
                    ];
                  }}
                />
                <Bar dataKey="sales" fill="rgba(59,130,246,0.58)" radius={[10, 10, 0, 0]} />
                <Area
                  dataKey="netProfit"
                  fill="url(#netFill)"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="ROAS y margen neto"
          description="Si ambos caen al mismo tiempo, revisa oferta, precio y adquisición."
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeSnapshot.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                  formatter={(value, name) => [
                    name === "roas"
                      ? formatFactor(toNumber(value))
                      : formatPercent(toNumber(value)),
                    name === "roas" ? "ROAS" : "Margen neto",
                  ]}
                />
                <Bar
                  dataKey="roas"
                  fill="rgba(29,158,117,0.72)"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="netMargin"
                  fill="rgba(250,199,117,0.82)"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="Comparativa semanal"
          description="Te ayuda a ver si la ejecución mejora o empeora semana contra semana."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeSnapshot.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                  formatter={(value, name) => [
                    formatCurrency(toNumber(value)),
                    name === "sales" ? "Ventas" : "Utilidad neta",
                  ]}
                />
                <Bar dataKey="sales" fill="rgba(59,130,246,0.68)" radius={[10, 10, 0, 0]} />
                <Bar dataKey="netProfit" fill="rgba(29,158,117,0.76)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="Comparativa mensual"
          description="Escala cuando el mes mantiene utilidades y no solo picos aislados."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeSnapshot.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                  formatter={(value, name) => [
                    formatCurrency(toNumber(value)),
                    name === "sales" ? "Ventas" : "Utilidad neta",
                  ]}
                />
                <Bar dataKey="sales" fill="rgba(59,130,246,0.68)" radius={[10, 10, 0, 0]} />
                <Bar dataKey="netProfit" fill="rgba(29,158,117,0.76)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="Días rentables vs días con pérdida"
          description="Balance rápido de consistencia operativa."
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={profitabilitySplit}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {profitabilitySplit.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [toNumber(value), "Días"]}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {profitabilitySplit.map((item) => (
              <Badge
                key={item.label}
                variant={item.label === "Rentables" ? "success" : "danger"}
              >
                {item.label}: {item.value}
              </Badge>
            ))}
          </div>
        </ChartShell>

        <ChartShell
          title="Top días y días con pérdida"
          description="Usa estos casos como referencia para repetir o corregir patrones."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Días más rentables</p>
              {activeSnapshot.topDays.map((day) => (
                <div
                  key={day.id}
                  className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.08] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{formatLongDate(day.processDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        Ventas {formatCurrency(day.totalSales)} · ROAS {formatFactor(day.roas)}
                      </p>
                    </div>
                    <Badge variant="success">{formatCurrency(day.netProfit)}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Días con más pérdida</p>
              {activeSnapshot.lossDays.map((day) => (
                <div
                  key={day.id}
                  className="rounded-2xl border border-rose-500/15 bg-rose-500/[0.08] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{formatLongDate(day.processDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        ADS {formatCurrency(day.adSpend)} · Margen {formatPercent(day.netMargin)}
                      </p>
                    </div>
                    <Badge variant="danger">{formatCurrency(day.netProfit)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartShell>
      </div>
    </div>
  );
}
