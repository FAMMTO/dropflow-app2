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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/formatters";
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
  const [view, setView] = useState<"sales" | "profit">("sales");
  const profitRows = [...data].reverse();

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas y ganancia neta diaria</CardTitle>
          <CardDescription>
            Ultimos 7 registros para detectar dias fuertes y dias de fuga.
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
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Ventas y ganancia neta diaria</CardTitle>
          <CardDescription>
            Cambia entre cuanto vendiste y cuanto ganaste exacto cada dia.
          </CardDescription>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-muted/40 p-1">
          <Button
            type="button"
            size="sm"
            variant={view === "sales" ? "default" : "ghost"}
            onClick={() => setView("sales")}
          >
            Ventas
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "profit" ? "default" : "ghost"}
            onClick={() => setView("profit")}
          >
            Ganancia neta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {view === "sales" ? (
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
                    name === "sales" ? "Ventas" : "Ganancia neta",
                  ]}
                />
                <Bar
                  dataKey="sales"
                  fill="rgba(59,130,246,0.72)"
                  radius={[10, 10, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-primary)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 5 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Costos</TableHead>
                  <TableHead className="text-right">Ganancia neta</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitRows.length ? (
                  profitRows.map((row) => {
                    const totalCosts = row.sales - row.netProfit;

                    return (
                      <TableRow key={`${row.date}-${row.productId}`}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground">
                          {row.productName ?? "Producto"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.sales)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totalCosts)}
                        </TableCell>
                        <TableCell
                          className={
                            row.netProfit >= 0
                              ? "text-right font-semibold text-emerald-600"
                              : "text-right font-semibold text-destructive"
                          }
                        >
                          {formatCurrency(row.netProfit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercent(row.netMargin)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Registra ventas para ver tus ganancias netas por dia.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
