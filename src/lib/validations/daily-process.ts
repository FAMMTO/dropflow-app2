import { z } from "zod";

const moneyField = z
  .coerce.number()
  .finite("Ingresa un número válido.")
  .min(0, "El monto no puede ser negativo.");

export const dailyProcessSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid("Selecciona un producto."),
  processDate: z.string().min(1, "Selecciona una fecha."),
  adSpend: moneyField,
  salePrice: moneyField.min(0.01, "El precio de venta debe ser mayor a cero."),
  totalSales: moneyField.optional(),
  unitsSold: z
    .coerce.number()
    .int("Ingresa unidades enteras.")
    .min(1, "Debe existir al menos una unidad vendida."),
  productCost: moneyField,
  shippingCost: moneyField.default(0),
  paymentGatewayCost: moneyField.default(0),
  notes: z
    .string()
    .max(500, "Mantén las notas por debajo de 500 caracteres.")
    .optional()
    .transform((value) => value?.trim() || ""),
});

export type DailyProcessFormValues = z.infer<typeof dailyProcessSchema>;

export const productConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Ingresa el nombre del producto."),
  sku: z.string().trim().optional().transform((value) => value || ""),
  defaultSalePrice: moneyField.min(0.01, "El precio de venta debe ser mayor a cero."),
  defaultProductCost: moneyField,
  defaultShippingCost: moneyField.default(0),
  defaultPaymentGatewayCost: moneyField.default(0),
  notes: z
    .string()
    .max(500, "Mantén las notas por debajo de 500 caracteres.")
    .optional()
    .transform((value) => value?.trim() || ""),
  isActive: z.boolean().optional().default(true),
});

export type ProductConfigFormValues = z.infer<typeof productConfigSchema>;
