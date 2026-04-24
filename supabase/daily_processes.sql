-- DropFlow Supabase setup
-- Ejecuta este archivo completo en Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  sku text,
  default_sale_price numeric(12, 2) not null default 0 check (default_sale_price >= 0),
  default_product_cost numeric(12, 2) not null default 0 check (default_product_cost >= 0),
  default_shipping_cost numeric(12, 2) not null default 0 check (default_shipping_cost >= 0),
  default_payment_gateway_cost numeric(12, 2) not null default 0 check (default_payment_gateway_cost >= 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists sku text,
  add column if not exists default_sale_price numeric(12, 2) not null default 0,
  add column if not exists default_product_cost numeric(12, 2) not null default 0,
  add column if not exists default_shipping_cost numeric(12, 2) not null default 0,
  add column if not exists default_payment_gateway_cost numeric(12, 2) not null default 0,
  add column if not exists notes text,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop index if exists public.products_name_idx;

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

drop trigger if exists set_products_updated_at on public.products;

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.daily_processes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  process_date date not null,
  ad_spend numeric(12, 2) not null default 0 check (ad_spend >= 0),
  unit_sale_price numeric(12, 2) not null default 0 check (unit_sale_price >= 0),
  total_sales numeric(12, 2) not null default 0 check (total_sales >= 0),
  units_sold integer not null check (units_sold >= 1),
  product_cost numeric(12, 2) not null default 0 check (product_cost >= 0),
  shipping_cost numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  payment_gateway_cost numeric(12, 2) not null default 0 check (payment_gateway_cost >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_processes
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists product_id uuid references public.products(id) on delete restrict,
  add column if not exists unit_sale_price numeric(12, 2) not null default 0;

insert into public.products (owner_id, name, sku, notes)
select distinct
  dp.owner_id,
  'Producto inicial',
  'DEFAULT',
  'Producto creado automaticamente para migrar registros diarios existentes.'
from public.daily_processes dp
where dp.product_id is null
  and not exists (
    select 1
    from public.products p
    where p.owner_id is not distinct from dp.owner_id
      and p.name = 'Producto inicial'
  );

update public.daily_processes dp
set product_id = p.id
from public.products p
where dp.product_id is null
  and p.owner_id is not distinct from dp.owner_id
  and p.name = 'Producto inicial';

update public.daily_processes
set unit_sale_price = round(total_sales / nullif(units_sold, 0), 2)
where unit_sale_price = 0
  and total_sales > 0
  and units_sold > 0;

alter table public.daily_processes
  alter column product_id set not null,
  alter column ad_spend set default 0,
  alter column unit_sale_price set default 0,
  alter column total_sales set default 0,
  alter column product_cost set default 0,
  alter column shipping_cost set default 0,
  alter column payment_gateway_cost set default 0;

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

drop trigger if exists set_daily_processes_updated_at on public.daily_processes;

create trigger set_daily_processes_updated_at
before update on public.daily_processes
for each row
execute function public.set_current_timestamp_updated_at();

create or replace view public.daily_processes_calculated
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

alter table public.products enable row level security;
alter table public.daily_processes enable row level security;

drop policy if exists "authenticated users read own products" on public.products;
drop policy if exists "authenticated users insert own products" on public.products;
drop policy if exists "authenticated users update own products" on public.products;
drop policy if exists "authenticated users delete own products" on public.products;

create policy "authenticated users read own products"
on public.products
for select
to authenticated
using (owner_id = auth.uid());

create policy "authenticated users insert own products"
on public.products
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "authenticated users update own products"
on public.products
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "authenticated users delete own products"
on public.products
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "authenticated users read own daily processes" on public.daily_processes;
drop policy if exists "authenticated users insert own daily processes" on public.daily_processes;
drop policy if exists "authenticated users update own daily processes" on public.daily_processes;
drop policy if exists "authenticated users delete own daily processes" on public.daily_processes;

create policy "authenticated users read own daily processes"
on public.daily_processes
for select
to authenticated
using (owner_id = auth.uid());

create policy "authenticated users insert own daily processes"
on public.daily_processes
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "authenticated users update own daily processes"
on public.daily_processes
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "authenticated users delete own daily processes"
on public.daily_processes
for delete
to authenticated
using (owner_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.daily_processes to authenticated;
grant select on public.daily_processes_calculated to authenticated;

comment on table public.products is
  'DropFlow: catalogo de productos con precios y costos predefinidos por unidad.';

comment on table public.daily_processes is
  'DropFlow: registros diarios por producto con ADS, unidades y costos totales.';

comment on view public.daily_processes_calculated is
  'DropFlow: vista de lectura con utilidad, margenes, ROAS, costo por venta, acumulado y punto de equilibrio.';

commit;
