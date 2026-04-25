import { and, asc, eq } from "drizzle-orm";
import {
  getDb,
  isDatabaseConfigured,
  isPersistenceConfigured,
  isSupabaseTableMissing,
} from "@/lib/db";
import { dailyProcesses, products } from "@/lib/db/schema";
import { mockDailyProcesses, mockProducts } from "@/lib/mock-data";
import { createClient, getUser, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  DailyProcessInput,
  DailyProcessRecord,
  ProductConfigInput,
  ProductConfigRecord,
} from "@/lib/types";

function normalizeRecord(record: DailyProcessRecord) {
  return {
    ...record,
    totalSales: roundMoney(record.salePrice * record.unitsSold),
    notes: record.notes?.trim() || "",
  };
}

function normalizeProduct(product: ProductConfigRecord) {
  return {
    ...product,
    sku: product.sku?.trim() || "",
    notes: product.notes?.trim() || "",
  };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function demoGuard() {
  throw new Error(
    "La app esta en modo demo. Configura Supabase o DATABASE_URL para habilitar guardado, edicion y eliminacion.",
  );
}

function tableMissingMessage() {
  return "Supabase esta configurado, pero faltan las tablas public.products o public.daily_processes. Ejecuta el archivo supabase/daily_processes.sql en el SQL Editor de Supabase.";
}

export async function listProducts(): Promise<ProductConfigRecord[]> {
  if (!isPersistenceConfigured()) {
    return mockProducts.map(normalizeProduct);
  }

  if (isSupabaseConfigured() && !isDatabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      if (isSupabaseTableMissing(error)) {
        return mockProducts.map(normalizeProduct);
      }

      throw new Error(error.message);
    }

    return (data ?? []).map((row) =>
      normalizeProduct({
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        sku: row.sku ?? "",
        defaultSalePrice: Number(row.default_sale_price),
        defaultProductCost: Number(row.default_product_cost),
        defaultShippingCost: Number(row.default_shipping_cost),
        defaultPaymentGatewayCost: Number(row.default_payment_gateway_cost),
        notes: row.notes ?? "",
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }),
    );
  }

  const db = getDb();
  const user = await getUser();
  
  if (!user) {
    throw new Error("No estas autenticado.");
  }
  
  const rows = await db.select().from(products).where(eq(products.ownerId, user.id)).orderBy(asc(products.name));

  return rows.map((row) =>
    normalizeProduct({
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      sku: row.sku ?? "",
      defaultSalePrice: row.defaultSalePrice,
      defaultProductCost: row.defaultProductCost,
      defaultShippingCost: row.defaultShippingCost,
      defaultPaymentGatewayCost: row.defaultPaymentGatewayCost,
      notes: row.notes ?? "",
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
  );
}

export async function saveProduct(payload: ProductConfigInput) {
  if (!isPersistenceConfigured()) {
    demoGuard();
  }

  const notes = payload.notes?.trim() || null;
  const sku = payload.sku?.trim() || null;

  const user = await getUser();
  if (!user) throw new Error("No estas autenticado.");

  if (isSupabaseConfigured() && !isDatabaseConfigured()) {
    const supabase = await createClient();

    if (payload.id) {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: payload.name,
          sku,
          default_sale_price: payload.defaultSalePrice,
          default_product_cost: payload.defaultProductCost,
          default_shipping_cost: payload.defaultShippingCost,
          default_payment_gateway_cost: payload.defaultPaymentGatewayCost,
          notes,
          is_active: payload.isActive ?? true,
        })
        .eq("id", payload.id)
        .select("id")
        .single();

      if (error) {
        if (isSupabaseTableMissing(error)) {
          throw new Error(tableMissingMessage());
        }

        throw new Error(error.message);
      }

      return data.id;
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        owner_id: user.id,
        name: payload.name,
        sku,
        default_sale_price: payload.defaultSalePrice,
        default_product_cost: payload.defaultProductCost,
        default_shipping_cost: payload.defaultShippingCost,
        default_payment_gateway_cost: payload.defaultPaymentGatewayCost,
        notes,
        is_active: payload.isActive ?? true,
      })
      .select("id")
      .single();

    if (error) {
      if (isSupabaseTableMissing(error)) {
        throw new Error(tableMissingMessage());
      }

      throw new Error(error.message);
    }

    return data.id;
  }

  const db = getDb();
  const now = new Date().toISOString();

  if (payload.id) {
    const [updatedProduct] = await db
      .update(products)
      .set({
        name: payload.name,
        sku,
        defaultSalePrice: payload.defaultSalePrice,
        defaultProductCost: payload.defaultProductCost,
        defaultShippingCost: payload.defaultShippingCost,
        defaultPaymentGatewayCost: payload.defaultPaymentGatewayCost,
        notes,
        isActive: payload.isActive ?? true,
        updatedAt: now,
      })
      .where(and(eq(products.id, payload.id), eq(products.ownerId, user.id)))
      .returning({ id: products.id });

    if (!updatedProduct) {
      throw new Error("No encontre el producto que intentas actualizar.");
    }

    return updatedProduct.id;
  }

  const [createdProduct] = await db
    .insert(products)
    .values({
      ownerId: user.id,
      name: payload.name,
      sku,
      defaultSalePrice: payload.defaultSalePrice,
      defaultProductCost: payload.defaultProductCost,
      defaultShippingCost: payload.defaultShippingCost,
      defaultPaymentGatewayCost: payload.defaultPaymentGatewayCost,
      notes,
      isActive: payload.isActive ?? true,
    })
    .returning({ id: products.id });

  return createdProduct.id;
}

export async function deleteProduct(id: string) {
  if (!isPersistenceConfigured()) {
    demoGuard();
  }

  if (isSupabaseConfigured() && !isDatabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      if (isSupabaseTableMissing(error)) {
        throw new Error(tableMissingMessage());
      }

      throw new Error(error.message);
    }

    return data.id;
  }

  const db = getDb();
  const user = await getUser();
  if (!user) throw new Error("No estas autenticado.");
  
  const [deletedProduct] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.ownerId, user.id)))
    .returning({ id: products.id });

  if (!deletedProduct) {
    throw new Error("No encontre el producto que intentas eliminar.");
  }

  return deletedProduct.id;
}

export async function listDailyProcesses(): Promise<DailyProcessRecord[]> {
  if (!isPersistenceConfigured()) {
    return mockDailyProcesses.map(normalizeRecord);
  }

  const productMap = new Map(
    (await listProducts()).map((product) => [product.id, product]),
  );

  if (isSupabaseConfigured() && !isDatabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_processes")
      .select("*")
      .order("process_date", { ascending: true });

    if (error) {
      if (isSupabaseTableMissing(error)) {
        return mockDailyProcesses.map(normalizeRecord);
      }

      throw new Error(error.message);
    }

    return (data ?? []).map((row) => {
      const unitsSold = Number(row.units_sold) || 0;
      const totalSales = Number(row.total_sales) || 0;
      // unit_sale_price may not exist in older tables; derive from total_sales / units_sold
      const salePrice =
        row.unit_sale_price != null
          ? Number(row.unit_sale_price)
          : unitsSold > 0
            ? roundMoney(totalSales / unitsSold)
            : 0;
      // product_id may not exist in older tables
      const productId = row.product_id ?? "";

      return normalizeRecord({
        id: row.id,
        productId,
        productName: productId ? (productMap.get(productId)?.name ?? null) : null,
        productSku: productId ? (productMap.get(productId)?.sku ?? null) : null,
        processDate: row.process_date,
        adSpend: Number(row.ad_spend) || 0,
        salePrice,
        totalSales: salePrice > 0 && unitsSold > 0 ? roundMoney(salePrice * unitsSold) : totalSales,
        unitsSold,
        productCost: Number(row.product_cost) || 0,
        shippingCost: Number(row.shipping_cost) || 0,
        paymentGatewayCost: Number(row.payment_gateway_cost) || 0,
        notes: row.notes ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    });
  }

  const db = getDb();
  const user = await getUser();
  if (!user) throw new Error("No estas autenticado.");
  
  const rows = await db
    .select()
    .from(dailyProcesses)
    .where(eq(dailyProcesses.ownerId, user.id))
    .orderBy(asc(dailyProcesses.processDate));

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    productName: productMap.get(row.productId)?.name ?? null,
    productSku: productMap.get(row.productId)?.sku ?? null,
    processDate: row.processDate,
    adSpend: row.adSpend,
    salePrice: row.unitSalePrice,
    totalSales: roundMoney(row.unitSalePrice * row.unitsSold),
    unitsSold: row.unitsSold,
    productCost: row.productCost,
    shippingCost: row.shippingCost,
    paymentGatewayCost: row.paymentGatewayCost,
    notes: row.notes ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getDailyProcessById(id: string) {
  const records = await listDailyProcesses();
  return records.find((record) => record.id === id) ?? null;
}

export async function saveDailyProcess(payload: DailyProcessInput) {
  console.log("Iniciando saveDailyProcess con payload:", JSON.stringify(payload, null, 2));
  if (!isPersistenceConfigured()) {
    console.log("Persistencia no configurada, activando demoGuard");
    demoGuard();
  }

  const user = await getUser();
  if (!user) throw new Error("No estas autenticado.");

  if (isSupabaseConfigured() && !isDatabaseConfigured()) {
    console.log("Usando Supabase para guardar...");
    const supabase = await createClient();
    const notes = payload.notes?.trim() || null;
    const totalSales = roundMoney(payload.salePrice * payload.unitsSold);

    // Build lookup query — product_id column might not exist in older tables
    let lookupQuery = supabase
      .from("daily_processes")
      .select("id")
      .eq("process_date", payload.processDate);

    if (payload.productId) {
      lookupQuery = lookupQuery.eq("product_id", payload.productId);
    }

    const { data: existingByDate, error: lookupError } = await lookupQuery;

    if (lookupError) {
      // If product_id column doesn't exist, retry without it
      if (lookupError.message?.includes("product_id")) {
        const { data: fallback, error: fallbackError } = await supabase
          .from("daily_processes")
          .select("id")
          .eq("process_date", payload.processDate);

        if (fallbackError) {
          if (isSupabaseTableMissing(fallbackError)) {
            throw new Error(tableMissingMessage());
          }
          throw new Error(fallbackError.message);
        }

        if (fallback && fallback.length > 0 && fallback[0].id !== payload.id) {
          throw new Error(
            "Ya existe un proceso diario para esa fecha. Edita el registro existente o elige otra fecha.",
          );
        }
      } else {
        if (isSupabaseTableMissing(lookupError)) {
          throw new Error(tableMissingMessage());
        }
        throw new Error(lookupError.message);
      }
    } else if (existingByDate && existingByDate.length > 0 && existingByDate[0].id !== payload.id) {
      throw new Error(
        "Ya existe un proceso diario para ese producto y fecha. Edita el registro existente o elige otra fecha.",
      );
    }

    // Build the data payload with all columns — nullable ones are optional
    const basePayload = {
      owner_id: user.id,
      process_date: payload.processDate,
      ad_spend: payload.adSpend,
      total_sales: totalSales,
      units_sold: payload.unitsSold,
      product_cost: payload.productCost,
      shipping_cost: payload.shippingCost,
      payment_gateway_cost: payload.paymentGatewayCost,
      notes,
      product_id: payload.productId || null,
      unit_sale_price: payload.salePrice,
    };

    if (payload.id) {
      const { data: updatedRecord, error: updateError } = await supabase
        .from("daily_processes")
        .update(basePayload)
        .eq("id", payload.id)
        .select("id")
        .single();

      if (updateError) {
        // If unit_sale_price or product_id column doesn't exist, retry without them
        if (updateError.message?.includes("unit_sale_price") || updateError.message?.includes("product_id")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fallbackPayload: any = { ...basePayload };
          if (updateError.message?.includes("unit_sale_price")) delete fallbackPayload.unit_sale_price;
          if (updateError.message?.includes("product_id")) delete fallbackPayload.product_id;

          const { data: retryData, error: retryError } = await supabase
            .from("daily_processes")
            .update(fallbackPayload)
            .eq("id", payload.id)
            .select("id")
            .single();

          if (retryError) {
            if (isSupabaseTableMissing(retryError)) {
              throw new Error(tableMissingMessage());
            }
            throw new Error(retryError.message);
          }
          return retryData.id;
        }

        if (isSupabaseTableMissing(updateError)) {
          throw new Error(tableMissingMessage());
        }

        throw new Error(updateError.message);
      }

      return updatedRecord.id;
    }

    const { data: createdRecord, error: insertError } = await supabase
      .from("daily_processes")
      .insert(basePayload)
      .select("id")
      .single();

    if (insertError) {
      console.error("Error de inserción en Supabase:", JSON.stringify(insertError, null, 2));

      // If unit_sale_price or product_id column doesn't exist, retry without them
      if (insertError.message?.includes("unit_sale_price") || insertError.message?.includes("product_id")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallbackPayload: any = { ...basePayload };
        if (insertError.message?.includes("unit_sale_price")) delete fallbackPayload.unit_sale_price;
        if (insertError.message?.includes("product_id")) delete fallbackPayload.product_id;

        const { data: retryData, error: retryError } = await supabase
          .from("daily_processes")
          .insert(fallbackPayload)
          .select("id")
          .single();

        if (retryError) {
          if (isSupabaseTableMissing(retryError)) {
            throw new Error(tableMissingMessage());
          }
          throw new Error(retryError.message);
        }

        console.log("Inserción exitosa (fallback), ID:", retryData.id);
        return retryData.id;
      }

      if (isSupabaseTableMissing(insertError)) {
        throw new Error(tableMissingMessage());
      }

      throw new Error(insertError.message);
    }

    console.log("Inserción exitosa, ID:", createdRecord.id);
    return createdRecord.id;
  }

  const db = getDb();
  const notes = payload.notes?.trim() || null;
  const now = new Date().toISOString();
  const totalSales = roundMoney(payload.salePrice * payload.unitsSold);

  const existingByDate = await db
    .select({
      id: dailyProcesses.id,
    })
    .from(dailyProcesses)
    .where(
      and(
        eq(dailyProcesses.processDate, payload.processDate),
        eq(dailyProcesses.productId, payload.productId),
        eq(dailyProcesses.ownerId, user.id)
      ),
    );

  if (
    existingByDate.length > 0 &&
    existingByDate[0].id !== payload.id
  ) {
    throw new Error(
      "Ya existe un proceso diario para ese producto y fecha. Edita el registro existente o elige otra fecha.",
    );
  }

  if (payload.id) {
    const [updatedRecord] = await db
      .update(dailyProcesses)
      .set({
        productId: payload.productId,
        processDate: payload.processDate,
        adSpend: payload.adSpend,
        totalSales,
        unitSalePrice: payload.salePrice,
        unitsSold: payload.unitsSold,
        productCost: payload.productCost,
        shippingCost: payload.shippingCost,
        paymentGatewayCost: payload.paymentGatewayCost,
        notes,
        updatedAt: now,
      })
      .where(and(eq(dailyProcesses.id, payload.id), eq(dailyProcesses.ownerId, user.id)))
      .returning();

    if (!updatedRecord) {
      throw new Error("No encontre el registro que intentas actualizar.");
    }

    return updatedRecord.id;
  }

  const [createdRecord] = await db
    .insert(dailyProcesses)
    .values({
      ownerId: user.id,
      productId: payload.productId,
      processDate: payload.processDate,
      adSpend: payload.adSpend,
      totalSales,
      unitSalePrice: payload.salePrice,
      unitsSold: payload.unitsSold,
      productCost: payload.productCost,
      shippingCost: payload.shippingCost,
      paymentGatewayCost: payload.paymentGatewayCost,
      notes,
    })
    .returning();

  return createdRecord.id;
}

export async function deleteDailyProcess(id: string) {
  if (!isPersistenceConfigured()) {
    demoGuard();
  }

  if (isSupabaseConfigured() && !isDatabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_processes")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      if (isSupabaseTableMissing(error)) {
        throw new Error(tableMissingMessage());
      }

      throw new Error(error.message);
    }

    return data.id;
  }

  const db = getDb();
  const user = await getUser();
  if (!user) throw new Error("No estas autenticado.");
  
  const [deletedRecord] = await db
    .delete(dailyProcesses)
    .where(and(eq(dailyProcesses.id, id), eq(dailyProcesses.ownerId, user.id)))
    .returning({
      id: dailyProcesses.id,
    });

  if (!deletedRecord) {
    throw new Error("No encontre el registro que intentas eliminar.");
  }

  return deletedRecord.id;
}
