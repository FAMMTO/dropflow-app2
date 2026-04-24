# DropFlow

Sistema web para administrar un negocio de dropshipping con foco en control diario, utilidad neta, ROAS, margenes y acumulado historico.

Stack principal:

- Next.js 16 con App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Componentes estilo shadcn/ui
- Supabase Postgres
- Supabase service role para acceso servidor inmediato
- Drizzle ORM
- Deploy listo para Vercel

## Arquitectura

- `Next.js App Router`: paginas server-first y componentes cliente solo donde hay filtros, formularios o graficas.
- `Supabase service role`: permite que la app ya pueda leer y escribir por API desde el servidor sin exponer secretos al navegador.
- `Supabase Postgres + Drizzle`: queda preparado para evolucionar a conexion directa por `DATABASE_URL` cuando quieras usar migraciones Drizzle desde tu entorno.
- `Capa de dominio centralizada`: todas las formulas viven en `src/lib/domain/dropflow.ts` para evitar inconsistencias entre registro, dashboard, historial y analytics.
- `Modo demo`: si no existe una conexion valida (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` o `DATABASE_URL`), la app usa datos de ejemplo para mostrar la UI sin bloquear el desarrollo.

## Modelo de datos

Tabla principal: `daily_processes`

- `id`
- `process_date`
- `ad_spend`
- `total_sales`
- `units_sold`
- `product_cost`
- `shipping_cost`
- `payment_gateway_cost`
- `notes`
- `created_at`
- `updated_at`

Regla de negocio:

- Un solo proceso por fecha. La fecha es unica para evitar duplicados diarios.

## Formulas del sistema

- `Utilidad bruta = Ventas totales - Costo de producto`
- `Utilidad neta = Utilidad bruta - Envio - ADS - Pasarela`
- `Ganancia neta del dia = Utilidad neta`
- `Utilidad / deficit acumulado = suma cronologica de utilidad neta`
- `Margen bruto = Utilidad bruta / Ventas totales * 100`
- `Margen neto = Utilidad neta / Ventas totales * 100`
- `Costo por unidad = Costo de producto / Unidades vendidas`
- `Venta promedio por unidad = Ventas totales / Unidades vendidas`
- `Gasto ADS por unidad = ADS / Unidades vendidas`
- `ROAS = Ventas totales / ADS`
- `Punto de equilibrio aproximado = (Envio + ADS + Pasarela) / (1 - CostoProducto / Ventas)`

Notas:

- Cuando el denominador es cero, la UI muestra `—` para no falsear metricas.
- El acumulado se calcula por fecha ascendente.

## Estructura base

```text
src/
  app/
    (app)/
      analytics/
      historial/
      registro/
      page.tsx
  components/
    app/
    charts/
    forms/
    history/
    providers/
    ui/
  hooks/
  lib/
    actions/
    db/
    domain/
    supabase/
    validations/
supabase/
  daily_processes.sql
```

## Variables de entorno

Copia `.env.example` a `.env.local` y agrega tus credenciales de Supabase:

```bash
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."
```

Sugerencia:

- Usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para que la app funcione desde ya en el servidor.
- Usa `DATABASE_URL` para la app en runtime si despues quieres conexion Postgres directa.
- Usa `DIRECT_DATABASE_URL` para `drizzle-kit push` y `drizzle-kit generate`.

## Crear la tabla en Supabase

Si tu proyecto esta vacio, ejecuta el SQL de `supabase/daily_processes.sql` dentro del SQL Editor de Supabase.

Ese paso sigue siendo necesario cuando solo tienes `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, porque esa llave permite CRUD sobre tablas existentes pero no crea el esquema por si sola.

## Comandos

```bash
npm install --legacy-peer-deps
npm run dev
npm run lint
npm run typecheck
npm run build
```

Comandos de base de datos:

```bash
npm run db:generate
npm run db:push
npm run db:studio
```

## Flujo del usuario

1. Registrar el proceso del dia desde `/registro`
2. Ver el resumen inmediato en `/`
3. Revisar historico y exportar CSV en `/historial`
4. Analizar tendencias y dias mas rentables en `/analytics`

## Deploy en Vercel

1. Crea un proyecto en Supabase.
2. En Vercel, importa este proyecto.
3. Agrega `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en las variables del proyecto.
4. Si vas a usar Drizzle directo por Postgres, agrega tambien `DATABASE_URL` y `DIRECT_DATABASE_URL`.
5. Si la tabla no existe, ejecuta `supabase/daily_processes.sql` en Supabase.
6. Haz deploy.

## Mejoras recomendadas

- Catalogo de productos y campañas para medir utilidad por producto.
- Configuracion editable de umbrales de margen y ROAS.
- Autenticacion y roles cuando opere mas de una persona.
- Conciliacion de pagos y panel de proveedores.
