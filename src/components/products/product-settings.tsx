"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, PencilLine, Plus, Save, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteProductAction,
  saveProductAction,
} from "@/lib/actions/daily-process-actions";
import { formatCurrency } from "@/lib/formatters";
import type { ProductConfigInput, ProductConfigRecord } from "@/lib/types";

type ProductSettingsProps = {
  products: ProductConfigRecord[];
  isDemoMode: boolean;
};

const emptyProduct: ProductConfigInput = {
  name: "",
  sku: "",
  defaultSalePrice: 0,
  defaultProductCost: 0,
  defaultShippingCost: 0,
  defaultPaymentGatewayCost: 0,
  notes: "",
  isActive: true,
};

export function ProductSettings({
  products,
  isDemoMode,
}: ProductSettingsProps) {
  const [form, setForm] = useState<ProductConfigInput>(emptyProduct);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ProductConfigInput>(
    key: K,
    value: ProductConfigInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editProduct(product: ProductConfigRecord) {
    setForm({
      id: product.id,
      name: product.name,
      sku: product.sku ?? "",
      defaultSalePrice: product.defaultSalePrice,
      defaultProductCost: product.defaultProductCost,
      defaultShippingCost: product.defaultShippingCost,
      defaultPaymentGatewayCost: product.defaultPaymentGatewayCost,
      notes: product.notes ?? "",
      isActive: product.isActive,
    });
  }

  function submit() {
    if (isDemoMode) {
      toast.error("El modo demo no permite guardar productos.");
      return;
    }

    startTransition(async () => {
      const result = await saveProductAction(form);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setForm(emptyProduct);
    });
  }

  function removeProduct(id: string) {
    if (isDemoMode) {
      toast.error("El modo demo no permite eliminar productos.");
      return;
    }

    if (!window.confirm("Eliminar este producto?")) return;

    startTransition(async () => {
      const result = await deleteProductAction(id);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>Configuracion predefinida</CardTitle>
          <CardDescription>
            Estos valores se usan para rellenar el registro diario al elegir producto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ej. Faja moldeadora"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">SKU</label>
              <Input
                value={form.sku ?? ""}
                onChange={(event) => update("sku", event.target.value)}
                placeholder="Ej. DROP-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio venta unitario</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.defaultSalePrice}
                onChange={(event) =>
                  update("defaultSalePrice", Number(event.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Costo producto unitario</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.defaultProductCost}
                onChange={(event) =>
                  update("defaultProductCost", Number(event.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Envio unitario</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.defaultShippingCost}
                onChange={(event) =>
                  update("defaultShippingCost", Number(event.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pasarela unitaria</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.defaultPaymentGatewayCost}
                onChange={(event) =>
                  update("defaultPaymentGatewayCost", Number(event.target.value))
                }
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(event) => update("isActive", event.target.checked)}
              />
              Producto activo
            </label>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Proveedor, variantes, condiciones o detalles."
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={submit} disabled={isPending || isDemoMode}>
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar producto
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(emptyProduct)}>
              <Plus className="size-4" />
              Nuevo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos configurados</CardTitle>
          <CardDescription>
            La lista activa aparece en el formulario de registro diario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Venta</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Envio</TableHead>
                <TableHead>Pasarela</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku || "Sin SKU"} ·{" "}
                        {product.isActive ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(product.defaultSalePrice)}</TableCell>
                  <TableCell>{formatCurrency(product.defaultProductCost)}</TableCell>
                  <TableCell>{formatCurrency(product.defaultShippingCost)}</TableCell>
                  <TableCell>
                    {formatCurrency(product.defaultPaymentGatewayCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editProduct(product)}
                      >
                        <PencilLine className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduct(product.id)}
                        disabled={isPending || isDemoMode}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
