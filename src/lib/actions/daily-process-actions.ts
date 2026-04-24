"use server";

import { revalidatePath } from "next/cache";
import {
  deleteDailyProcess,
  deleteProduct,
  saveDailyProcess,
  saveProduct,
} from "@/lib/db/repository";
import type {
  DailyProcessActionResult,
  DailyProcessInput,
  ProductActionResult,
  ProductConfigInput,
} from "@/lib/types";
import {
  dailyProcessSchema,
  productConfigSchema,
} from "@/lib/validations/daily-process";

const APP_PATHS = ["/", "/registro", "/historial", "/analytics", "/productos"];

function revalidateApp() {
  APP_PATHS.forEach((path) => revalidatePath(path));
}

export async function saveDailyProcessAction(
  payload: DailyProcessInput,
): Promise<DailyProcessActionResult> {
  const parsed = dailyProcessSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      ok: false,
      message: "Revisa los campos marcados antes de guardar.",
      fieldErrors: {
        processDate: fieldErrors.processDate?.[0],
        productId: fieldErrors.productId?.[0],
        adSpend: fieldErrors.adSpend?.[0],
        salePrice: fieldErrors.salePrice?.[0],
        unitsSold: fieldErrors.unitsSold?.[0],
        productCost: fieldErrors.productCost?.[0],
        shippingCost: fieldErrors.shippingCost?.[0],
        paymentGatewayCost: fieldErrors.paymentGatewayCost?.[0],
        notes: fieldErrors.notes?.[0],
      },
    };
  }

  try {
    const recordId = await saveDailyProcess({
      ...parsed.data,
      totalSales:
        Math.round(parsed.data.salePrice * parsed.data.unitsSold * 100) / 100,
    });
    revalidateApp();

    return {
      ok: true,
      message: payload.id
        ? "Registro actualizado correctamente."
        : "Registro guardado correctamente.",
      recordId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No pude guardar el registro. Intenta nuevamente.",
    };
  }
}

export async function saveProductAction(
  payload: ProductConfigInput,
): Promise<ProductActionResult> {
  const parsed = productConfigSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      ok: false,
      message: "Revisa la configuracion del producto antes de guardar.",
      fieldErrors: {
        name: fieldErrors.name?.[0],
        sku: fieldErrors.sku?.[0],
        defaultSalePrice: fieldErrors.defaultSalePrice?.[0],
        defaultProductCost: fieldErrors.defaultProductCost?.[0],
        defaultShippingCost: fieldErrors.defaultShippingCost?.[0],
        defaultPaymentGatewayCost: fieldErrors.defaultPaymentGatewayCost?.[0],
        notes: fieldErrors.notes?.[0],
      },
    };
  }

  try {
    const recordId = await saveProduct(parsed.data);
    revalidateApp();

    return {
      ok: true,
      message: payload.id
        ? "Producto actualizado correctamente."
        : "Producto guardado correctamente.",
      recordId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No pude guardar el producto. Intenta nuevamente.",
    };
  }
}

export async function deleteProductAction(
  id: string,
): Promise<ProductActionResult> {
  try {
    await deleteProduct(id);
    revalidateApp();

    return {
      ok: true,
      message: "Producto eliminado correctamente.",
      recordId: id,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No pude eliminar el producto. Si ya tiene registros, desactivalo en vez de borrarlo.",
    };
  }
}

export async function deleteDailyProcessAction(
  id: string,
): Promise<DailyProcessActionResult> {
  try {
    await deleteDailyProcess(id);
    revalidateApp();

    return {
      ok: true,
      message: "Registro eliminado correctamente.",
      recordId: id,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No pude eliminar el registro. Intenta nuevamente.",
    };
  }
}
