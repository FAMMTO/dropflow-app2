"use client";

import { useState } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { TrendPoint } from "@/lib/types";

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

export function DashboardTrendChart({ data }: { data: TrendPoint[] }) {
  const isClient = useIsClient();
  const [view, setView] = useState<"sales" | "net">("sales");

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas y utilidad neta</CardTitle>
          <CardDescription>
            Últimos 7 registros para detectar días fuertes y días de fuga.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded-2xl bg-muted/60" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>Ventas y utilidad neta</CardTitle>
          <CardDescription>
            {view === "sales"
              ? "Comparativa de ingresos totales vs utilidad."
              : "Análisis profundo de la utilidad neta real."}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-1">
          <Button
            variant={view === "sales" ? "default" : "ghost"}
            size="sm"
            className="h-8 rounded-lg px-3"
            onClick={() => setView("sales")}
          >
            Ventas
          </Button>
          <Button
            variant={view === "net" ? "default" : "ghost"}
            size="sm"
            className="h-8 rounded-lg px-3"
            onClick={() => setView("net")}
          >
            Utilidad
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={10}>
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
                tickFormatter={(value) => `$${Number(value) / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.08)" }}
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
              <Bar
                dataKey={view === "sales" ? "sales" : "netProfit"}
                fill={view === "sales" ? "rgba(59,130,246,0.72)" : "var(--color-primary)"}
                radius={[10, 10, 0, 0]}
              />
              {view === "sales" && (
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-primary)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
