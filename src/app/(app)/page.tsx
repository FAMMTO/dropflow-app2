import { AlertList } from "@/components/app/alert-list";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { DashboardTrendChart } from "@/components/charts/dashboard-trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPersistenceStatus } from "@/lib/db";
import { listDailyProcesses } from "@/lib/db/repository";
import {
  buildArchitectureSummary,
  buildDashboardSnapshot,
  enrichDailyProcesses,
  explainBusinessRecommendations,
} from "@/lib/domain/dropflow";
import {
  formatCurrency,
  formatFactor,
  formatLongDate,
  formatMetricCurrency,
  formatPercent,
} from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const persistenceStatus = await getPersistenceStatus();
  const records = enrichDailyProcesses(await listDailyProcesses());
  const snapshot = buildDashboardSnapshot(records);
  const latest = snapshot.latestRecord;
  const architecture = buildArchitectureSummary();
  const recommendations = explainBusinessRecommendations();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard principal"
        title="Control diario del negocio"
        description="Resumen del último corte, alertas accionables y métricas clave para decidir si escalar, optimizar o frenar campañas."
        persistenceStatus={persistenceStatus}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {snapshot.metricCards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <DashboardTrendChart data={snapshot.recentTrend} />
        <AlertList alerts={snapshot.alerts} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Último proceso registrado</CardTitle>
            <CardDescription>
              La foto más reciente del negocio para actuar sin abrir Excel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="text-lg font-semibold">{formatLongDate(latest.processDate)}</p>
                  </div>
                  <Badge variant={latest.netProfit >= 0 ? "success" : "danger"}>
                    {latest.netProfit >= 0 ? "Rentable" : "En pérdida"}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Ventas", formatCurrency(latest.totalSales)],
                    ["ADS", formatCurrency(latest.adSpend)],
                    ["Utilidad bruta", formatCurrency(latest.grossProfit)],
                    ["Utilidad neta", formatCurrency(latest.netProfit)],
                    ["Margen neto", formatPercent(latest.netMargin)],
                    ["ROAS", formatFactor(latest.roas)],
                    ["Costo / unidad", formatMetricCurrency(latest.costPerUnit)],
                    [
                      "Punto de equilibrio",
                      formatMetricCurrency(latest.breakEvenSales),
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-border/80 bg-muted/40 p-4"
                    >
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos todavía. Registra el primer día para activar el dashboard.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Arquitectura del sistema</CardTitle>
            <CardDescription>
              Base elegida para crecer sin rehacer el proyecto en unos meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(architecture).map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-border/80 bg-muted/[0.35] p-4"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
                  {label}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Mejoras recomendadas</CardTitle>
            <CardDescription>
              Próximos pasos para administrar mejor el negocio conforme crezca.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation}
                className="rounded-2xl border border-border/80 bg-muted/[0.35] p-4 text-sm leading-6 text-muted-foreground"
              >
                {recommendation}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
