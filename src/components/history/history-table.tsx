"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle, PencilLine, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteDailyProcessAction } from "@/lib/actions/daily-process-actions";
import { buildMonthlySummary } from "@/lib/domain/dropflow";
import {
  formatCurrency,
  formatFactor,
  formatLongDate,
  formatPercent,
} from "@/lib/formatters";
import type { EnrichedDailyProcess } from "@/lib/types";

type SortKey =
  | "processDate"
  | "totalSales"
  | "netProfit"
  | "netMargin"
  | "roas"
  | "accumulatedNet";

function compareNullable(left: number | null, right: number | null) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
}

export function HistoryTable({
  records,
  isDemoMode,
}: {
  records: EnrichedDailyProcess[];
  isDemoMode: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("processDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredRecords = records
    .filter((record) => {
      const matchesQuery =
        !normalizedQuery ||
        record.processDate.toLowerCase().includes(normalizedQuery) ||
        record.productName?.toLowerCase().includes(normalizedQuery) ||
        record.productSku?.toLowerCase().includes(normalizedQuery) ||
        record.notes?.toLowerCase().includes(normalizedQuery);
      const matchesFrom = !fromDate || record.processDate >= fromDate;
      const matchesTo = !toDate || record.processDate <= toDate;

      return matchesQuery && matchesFrom && matchesTo;
    })
    .sort((left, right) => {
      let comparison = 0;

      if (sortKey === "processDate") {
        comparison = left.processDate.localeCompare(right.processDate);
      } else if (sortKey === "totalSales") {
        comparison = left.totalSales - right.totalSales;
      } else if (sortKey === "netProfit") {
        comparison = left.netProfit - right.netProfit;
      } else if (sortKey === "netMargin") {
        comparison = compareNullable(left.netMargin, right.netMargin);
      } else if (sortKey === "roas") {
        comparison = compareNullable(left.roas, right.roas);
      } else {
        comparison = left.accumulatedNet - right.accumulatedNet;
      }

      return sortDirection === "asc" ? comparison : comparison * -1;
    });

  const summaryCards = buildMonthlySummary(filteredRecords);

  function exportCsv() {
    const header = [
      "Fecha",
      "Producto",
      "PrecioUnitario",
      "Ventas",
      "ADS",
      "Unidades",
      "CostoProducto",
      "Envio",
      "Pasarela",
      "UtilidadBruta",
      "UtilidadNeta",
      "MargenBruto",
      "MargenNeto",
      "ROAS",
      "Acumulado",
      "Notas",
    ];

    const lines = filteredRecords.map((record) =>
      [
        record.processDate,
        record.productName ?? "",
        record.salePrice,
        record.totalSales,
        record.adSpend,
        record.unitsSold,
        record.productCost,
        record.shippingCost,
        record.paymentGatewayCost,
        record.grossProfit,
        record.netProfit,
        record.grossMargin ?? "",
        record.netMargin ?? "",
        record.roas ?? "",
        record.accumulatedNet,
        `"${(record.notes ?? "").replace(/"/g, '""')}"`,
      ].join(","),
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dropflow-historial.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function deleteRecord(id: string) {
    if (isDemoMode) {
      toast.error("El modo demo no permite eliminar registros.");
      return;
    }

    if (!window.confirm("¿Eliminar este registro?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteDailyProcessAction(id);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {summaryCards.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{metric.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial operativo</CardTitle>
          <CardDescription>
            Busca por fecha o notas, filtra por rango y exporta el corte actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_0.5fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar por fecha o notas"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <Select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              <option value="processDate">Ordenar por fecha</option>
              <option value="totalSales">Ordenar por ventas</option>
              <option value="netProfit">Ordenar por utilidad neta</option>
              <option value="netMargin">Ordenar por margen neto</option>
              <option value="roas">Ordenar por ROAS</option>
              <option value="accumulatedNet">Ordenar por acumulado</option>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
                }
                type="button"
              >
                {sortDirection === "asc" ? "Asc" : "Desc"}
              </Button>
              <Button variant="secondary" onClick={exportCsv} type="button">
                <Download className="size-4" />
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Precio unit.</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>ADS</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Utilidad neta</TableHead>
                <TableHead>Margen neto</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>Acumulado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                    No hay registros para ese filtro.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{formatLongDate(record.processDate)}</p>
                        {record.notes ? (
                          <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                            {record.notes}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.productName ?? "Sin producto"}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.productSku ?? record.productId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(record.salePrice)}</TableCell>
                    <TableCell>{formatCurrency(record.totalSales)}</TableCell>
                    <TableCell>{formatCurrency(record.adSpend)}</TableCell>
                    <TableCell>{record.unitsSold}</TableCell>
                    <TableCell>
                      <Badge variant={record.netProfit >= 0 ? "success" : "danger"}>
                        {formatCurrency(record.netProfit)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPercent(record.netMargin)}</TableCell>
                    <TableCell>{formatFactor(record.roas)}</TableCell>
                    <TableCell>{formatCurrency(record.accumulatedNet)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/registro?edit=${record.id}`}>
                            <PencilLine className="size-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRecord(record.id)}
                          type="button"
                          disabled={isPending}
                        >
                          {isPending ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
