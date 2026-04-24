import { sql } from "drizzle-orm";
import {
  date,
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id"),
    name: text("name").notNull(),
    sku: text("sku"),
    defaultSalePrice: numeric("default_sale_price", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .default(0)
      .notNull(),
    defaultProductCost: numeric("default_product_cost", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .default(0)
      .notNull(),
    defaultShippingCost: numeric("default_shipping_cost", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .default(0)
      .notNull(),
    defaultPaymentGatewayCost: numeric("default_payment_gateway_cost", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .default(0)
      .notNull(),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "string",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("products_single_tenant_name_idx")
      .on(table.name)
      .where(sql`${table.ownerId} is null`),
    uniqueIndex("products_owner_name_idx")
      .on(table.ownerId, table.name)
      .where(sql`${table.ownerId} is not null`),
  ],
);

export const dailyProcesses = pgTable(
  "daily_processes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id"),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "restrict" })
      .notNull(),
    processDate: date("process_date", { mode: "string" }).notNull(),
    adSpend: numeric("ad_spend", {
      mode: "number",
      precision: 12,
      scale: 2,
    }).notNull(),
    totalSales: numeric("total_sales", {
      mode: "number",
      precision: 12,
      scale: 2,
    }).notNull(),
    unitSalePrice: numeric("unit_sale_price", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .default(0)
      .notNull(),
    unitsSold: integer("units_sold").notNull(),
    productCost: numeric("product_cost", {
      mode: "number",
      precision: 12,
      scale: 2,
    }).notNull(),
    shippingCost: numeric("shipping_cost", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .default(0)
      .notNull(),
    paymentGatewayCost: numeric("payment_gateway_cost", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .default(0)
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "string",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("daily_processes_single_tenant_product_date_idx")
      .on(table.productId, table.processDate)
      .where(sql`${table.ownerId} is null`),
    uniqueIndex("daily_processes_owner_product_date_idx")
      .on(table.ownerId, table.productId, table.processDate)
      .where(sql`${table.ownerId} is not null`),
  ],
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type DailyProcessRow = typeof dailyProcesses.$inferSelect;
export type NewDailyProcessRow = typeof dailyProcesses.$inferInsert;
