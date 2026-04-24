"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Calculator, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateDailyMetrics,
  explainBreakEvenFormula,
} from "@/lib/domain/dropflow";
import {
  formatFactor,
  formatMetricCurrency,
  formatPercent,
  getTodayInMexicoCity,
} from "@/lib/formatters";
import { saveDailyProcessAction } from "@/lib/actions/daily-process-actions";
import type { DailyProcessRecord, ProductConfigRecord } from "@/lib/types";
import type { DailyProcessFormValues } from "@/lib/validations/daily-process";

type DailyProcessFormProps = {
  initialRecord: DailyProcessRecord | null;
  products: ProductConfigRecord[];
  isDemoMode: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function DailyProcessForm({
  initialRecord,
  products,
  isDemoMode,
}: DailyProcessFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(initialRecord);
  const fallbackProduct = products.find((product) => product.isActive) ?? products[0];

  const defaultValues: DailyProcessFormValues = {
    id: initialRecord?.id,
    productId: initialRecord?.productId ?? fallbackProduct?.id ?? "",
    processDate: initialRecord?.processDate ?? getTodayInMexicoCity(),
    adSpend: initialRecord?.adSpend ?? 0,
    salePrice: initialRecord?.salePrice ?? fallbackProduct?.defaultSalePrice ?? 0,
    totalSales: initialRecord?.totalSales ?? 0,
    unitsSold: initialRecord?.unitsSold ?? 1,
    productCost:
      initialRecord?.productCost ?? fallbackProduct?.defaultProductCost ?? 0,
    shippingCost:
      initialRecord?.shippingCost ?? fallbackProduct?.defaultShippingCost ?? 0,
    paymentGatewayCost:
      initialRecord?.paymentGatewayCost ??
      fallbackProduct?.defaultPaymentGatewayCost ??
      0,
    notes: initialRecord?.notes ?? "",
  };

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<DailyProcessFormValues>({
    defaultValues,
  });

  const watchedValues = useWatch({ control });
  const currentUnits = Number(watchedValues.unitsSold ?? 1);
  const totalSales = Number(watchedValues.salePrice ?? 0) * currentUnits;
  const preview = calculateDailyMetrics({
    processDate: watchedValues.processDate || getTodayInMexicoCity(),
    adSpend: Number(watchedValues.adSpend ?? 0),
    salePrice: Number(watchedValues.salePrice ?? 0),
    unitsSold: Number(watchedValues.unitsSold ?? 0),
    productCost: Number(watchedValues.productCost ?? 0),
    shippingCost: Number(watchedValues.shippingCost ?? 0),
    paymentGatewayCost: Number(watchedValues.paymentGatewayCost ?? 0),
  });

  function applyProductDefaults(productId: string, units = currentUnits) {
    const product = products.find((item) => item.id === productId);

    if (!product) return;

    setValue("productId", product.id, { shouldValidate: true });
    setValue("salePrice", product.defaultSalePrice, { shouldValidate: true });
    setValue("productCost", product.defaultProductCost * units, {
      shouldValidate: true,
    });
    setValue("shippingCost", product.defaultShippingCost * units, {
      shouldValidate: true,
    });
    setValue("paymentGatewayCost", product.defaultPaymentGatewayCost * units, {
      shouldValidate: true,
    });
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveDailyProcessAction({
        ...values,
        totalSales: Math.round(values.salePrice * values.unitsSold * 100) / 100,
      });

      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            if (message) {
              setError(field as keyof DailyProcessFormValues, { message });
            }
          });
        }

        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/historial");
      router.refresh();
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/historial">
            <ArrowLeft className="size-4" />
            Volver al historial
          </Link>
        </Button>
        {isEditing ? (
          <p className="text-sm text-muted-foreground">
            Editando registro del {initialRecord?.processDate}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? "Actualizar registro" : "Registrar venta por producto"}
            </CardTitle>
            <CardDescription>
              Selecciona producto, precio unitario y unidades. Las ventas totales
              se calculan automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input
                    type="date"
                    {...register("processDate", {
                      required: "Selecciona una fecha.",
                    })}
                  />
                  <FieldError message={errors.processDate?.message} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Producto</label>
                  <Select
                    {...register("productId", {
                      required: "Selecciona un producto.",
                      onChange: (event) =>
                        applyProductDefaults(event.target.value, currentUnits),
                    })}
                  >
                    <option value="">Selecciona producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.sku ? ` - ${product.sku}` : ""}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={errors.productId?.message} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Unidades vendidas</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    {...register("unitsSold", {
                      valueAsNumber: true,
                      onChange: (event) => {
                        const units = Number(event.target.value || 1);
                        if (watchedValues.productId) {
                          applyProductDefaults(watchedValues.productId, units);
                        }
                      },
                      required: "Ingresa unidades vendidas.",
                      min: {
                        value: 1,
                        message: "Debe existir al menos una unidad vendida.",
                      },
                    })}
                  />
                  <FieldError message={errors.unitsSold?.message} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Precio de venta unitario (MXN)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("salePrice", {
                      valueAsNumber: true,
                      required: "Ingresa el precio de venta.",
                      min: { value: 0.01, message: "Debe ser mayor a cero." },
                    })}
                  />
                  <FieldError message={errors.salePrice?.message} />
                  <p className="text-xs text-muted-foreground">
                    Ventas calculadas: {formatMetricCurrency(totalSales)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Gasto total en ADS (MXN)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("adSpend", {
                      valueAsNumber: true,
                      required: "Ingresa el gasto en ADS.",
                      min: { value: 0, message: "No puede ser negativo." },
                    })}
                  />
                  <FieldError message={errors.adSpend?.message} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Costo de producto total (MXN)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("productCost", {
                      valueAsNumber: true,
                      required: "Ingresa el costo del producto.",
                      min: { value: 0, message: "No puede ser negativo." },
                    })}
                  />
                  <FieldError message={errors.productCost?.message} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Envio total (MXN)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("shippingCost", {
                      valueAsNumber: true,
                      min: { value: 0, message: "No puede ser negativo." },
                    })}
                  />
                  <FieldError message={errors.shippingCost?.message} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pasarela total (MXN)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("paymentGatewayCost", {
                      valueAsNumber: true,
                      min: { value: 0, message: "No puede ser negativo." },
                    })}
                  />
                  <FieldError message={errors.paymentGatewayCost?.message} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Notas</label>
                  <Textarea
                    placeholder="Observaciones del dia, campanas o hallazgos..."
                    {...register("notes")}
                  />
                  <FieldError message={errors.notes?.message} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isPending || isDemoMode}>
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isEditing ? "Guardar cambios" : "Guardar registro"}
                </Button>
                {isDemoMode ? (
                  <p className="text-sm text-muted-foreground">
                    En modo demo puedes revisar la UI, pero no se persiste
                    informacion hasta conectar Supabase.
                  </p>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="size-4 text-primary" />
                Vista previa del calculo
              </CardTitle>
              <CardDescription>
                Todo se recalcula al momento antes de guardar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Ventas calculadas", formatMetricCurrency(totalSales)],
                  ["Utilidad bruta", formatMetricCurrency(preview.grossProfit)],
                  ["Utilidad neta", formatMetricCurrency(preview.netProfit)],
                  ["Margen bruto", formatPercent(preview.grossMargin)],
                  ["Margen neto", formatPercent(preview.netMargin)],
                  ["ROAS", formatFactor(preview.roas)],
                  ["Costo por unidad", formatMetricCurrency(preview.costPerUnit)],
                  [
                    "Venta promedio / unidad",
                    formatMetricCurrency(preview.averageSalePerUnit),
                  ],
                  ["ADS por unidad", formatMetricCurrency(preview.adSpendPerUnit)],
                  [
                    "Costo por venta",
                    formatMetricCurrency(preview.acquisitionCostPerSale),
                  ],
                  [
                    "Punto de equilibrio",
                    formatMetricCurrency(preview.breakEvenSales),
                  ],
                  [
                    "Ganancia neta del dia",
                    formatMetricCurrency(preview.netDayProfit),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-border/80 bg-muted/40 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reglas del motor financiero</CardTitle>
              <CardDescription>
                Formulas aplicadas en servidor y cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>Ventas calculadas = Precio unitario * Unidades vendidas</p>
              <p>Utilidad bruta = Ventas calculadas - Costo de producto</p>
              <p>Utilidad neta = Utilidad bruta - Envio - ADS - Pasarela</p>
              <p>Costo por venta = ADS / Unidades vendidas</p>
              <p>{explainBreakEvenFormula()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
