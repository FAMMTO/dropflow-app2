-- ============================================================
-- DropFlow: SQL para reparar tu Supabase
-- Ejecuta TODO este archivo en Supabase SQL Editor
-- Es seguro ejecutar varias veces (usa IF NOT EXISTS)
-- ============================================================

begin;

-- Extensión para gen_random_uuid()
create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────
-- 1. Función auxiliar para updated_at automático
-- ────────────────────────────────────────────────────────────
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 2. CREAR tabla products (NO EXISTE en tu Supabase)
-- ────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  name text not null,
  sku text,
  default_sale_price numeric(12, 2) not null default 0,
  default_product_cost numeric(12, 2) not null default 0,
  default_shipping_cost numeric(12, 2) not null default 0,
  default_payment_gateway_cost numeric(12, 2) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger de updated_at para products
drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_current_timestamp_updated_at();

-- Índices para products
create unique index if not exists products_single_tenant_name_idx
  on public.products (name)
  where owner_id is null;

create unique index if not exists products_owner_name_idx
  on public.products (owner_id, name)
  where owner_id is not null;

create index if not exists products_owner_id_idx
  on public.products (owner_id);

create index if not exists products_is_active_idx
  on public.products (is_active);

-- ────────────────────────────────────────────────────────────
-- 3. Agregar columnas faltantes a daily_processes
-- ────────────────────────────────────────────────────────────
-- product_id — referencia al producto
alter table public.daily_processes
  add column if not exists product_id uuid references public.products(id) on delete restrict;

-- unit_sale_price — precio de venta unitario
alter table public.daily_processes
  add column if not exists unit_sale_price numeric(12, 2) not null default 0;

-- ────────────────────────────────────────────────────────────
-- 4. Crear producto "por defecto" para registros sin product_id
-- ────────────────────────────────────────────────────────────
insert into public.products (name, sku, notes)
select
  'Producto general',
  'DEFAULT',
  'Producto creado automáticamente para registros existentes sin producto asignado.'
where not exists (
  select 1 from public.products where name = 'Producto general'
);

-- Asignar producto por defecto a registros que no tienen product_id
update public.daily_processes
set product_id = (select id from public.products where name = 'Producto general' limit 1)
where product_id is null;

-- Calcular unit_sale_price si no se ha llenado
update public.daily_processes
set unit_sale_price = round(total_sales / nullif(units_sold, 0), 2)
where unit_sale_price = 0
  and total_sales > 0
  and units_sold > 0;

-- Ahora sí hacer product_id NOT NULL
alter table public.daily_processes
  alter column product_id set not null;

-- ────────────────────────────────────────────────────────────
-- 5. Índices para daily_processes
-- ────────────────────────────────────────────────────────────
drop index if exists public.daily_processes_process_date_idx;
drop index if exists public.daily_processes_single_tenant_date_idx;
drop index if exists public.daily_processes_owner_process_date_idx;

create unique index if not exists daily_processes_single_tenant_product_date_idx
  on public.daily_processes (product_id, process_date)
  where owner_id is null;

create unique index if not exists daily_processes_owner_product_date_idx
  on public.daily_processes (owner_id, product_id, process_date)
  where owner_id is not null;

create index if not exists daily_processes_product_id_idx
  on public.daily_processes (product_id);

create index if not exists daily_processes_owner_id_idx
  on public.daily_processes (owner_id);

create index if not exists daily_processes_process_date_desc_idx
  on public.daily_processes (process_date desc);

-- Trigger de updated_at
drop trigger if exists set_daily_processes_updated_at on public.daily_processes;
create trigger set_daily_processes_updated_at
before update on public.daily_processes
for each row
execute function public.set_current_timestamp_updated_at();

-- ────────────────────────────────────────────────────────────
-- 6. Vista calculada (opcional pero útil)
-- ────────────────────────────────────────────────────────────
drop view if exists public.daily_processes_calculated;
create view public.daily_processes_calculated
with (security_invoker = true) as
with base as (
  select
    dp.id,
    dp.owner_id,
    dp.product_id,
    p.name as product_name,
    p.sku as product_sku,
    dp.process_date,
    dp.ad_spend,
    dp.unit_sale_price,
    round(dp.unit_sale_price * dp.units_sold, 2) as total_sales,
    dp.units_sold,
    dp.product_cost,
    dp.shipping_cost,
    dp.payment_gateway_cost,
    dp.notes,
    dp.created_at,
    dp.updated_at,
    round((dp.unit_sale_price * dp.units_sold) - dp.product_cost, 2) as gross_profit,
    round(
      (dp.unit_sale_price * dp.units_sold)
      - dp.product_cost
      - dp.shipping_cost
      - dp.ad_spend
      - dp.payment_gateway_cost,
      2
    ) as net_profit
  from public.daily_processes dp
  join public.products p on p.id = dp.product_id
)
select
  base.*,
  base.net_profit as net_day_profit,
  round(
    sum(base.net_profit) over (
      partition by base.owner_id
      order by base.process_date asc, base.id asc
      rows between unbounded preceding and current row
    ),
    2
  ) as accumulated_net,
  round((base.gross_profit / nullif(base.total_sales, 0)) * 100, 2) as gross_margin,
  round((base.net_profit / nullif(base.total_sales, 0)) * 100, 2) as net_margin,
  round(base.product_cost / nullif(base.units_sold, 0), 2) as cost_per_unit,
  round(base.total_sales / nullif(base.units_sold, 0), 2) as average_sale_per_unit,
  round(base.ad_spend / nullif(base.units_sold, 0), 2) as ad_spend_per_unit,
  round(base.ad_spend / nullif(base.units_sold, 0), 2) as acquisition_cost_per_sale,
  round(base.total_sales / nullif(base.ad_spend, 0), 2) as roas,
  round(
    (base.shipping_cost + base.ad_spend + base.payment_gateway_cost)
    / nullif(1 - (base.product_cost / nullif(base.total_sales, 0)), 0),
    2
  ) as break_even_sales
from base;

-- ────────────────────────────────────────────────────────────
-- 7. RLS (Row Level Security) — DESHABILITADO para service_role
--    Tu app usa service_role key, así que no necesitas policies
--    pero las dejamos preparadas por si agregas auth después
-- ────────────────────────────────────────────────────────────
alter table public.products enable row level security;
alter table public.daily_processes enable row level security;

-- Políticas para products
drop policy if exists "allow all for service role on products" on public.products;
create policy "allow all for service role on products"
on public.products
for all
using (true)
with check (true);

-- Políticas para daily_processes
drop policy if exists "allow all for service role on daily_processes" on public.daily_processes;
create policy "allow all for service role on daily_processes"
on public.daily_processes
for all
using (true)
with check (true);

-- ────────────────────────────────────────────────────────────
-- 8. Permisos
-- ────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated, anon;
grant select, insert, update, delete on public.daily_processes to authenticated, anon;
grant select on public.daily_processes_calculated to authenticated, anon;

commit;

-- ✅ ¡Listo! Recarga tu app y debería funcionar.
