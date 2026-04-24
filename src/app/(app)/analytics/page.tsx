import { PageHeader } from "@/components/app/page-header";
import { AnalyticsDashboard } from "@/components/charts/analytics-dashboard";
import { getPersistenceStatus } from "@/lib/db";
import { listDailyProcesses, listProducts } from "@/lib/db/repository";
import {
  buildAnalyticsSnapshot,
  enrichDailyProcesses,
} from "@/lib/domain/dropflow";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const persistenceStatus = await getPersistenceStatus();
  const records = enrichDailyProcesses(await listDailyProcesses());
  const products = await listProducts();
  const snapshot = buildAnalyticsSnapshot(records);
  const productSnapshots = Object.fromEntries(
    products.map((product) => [
      product.id,
      buildAnalyticsSnapshot(
        records.filter((record) => record.productId === product.id),
      ),
    ]),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics avanzados"
        title="Tendencias, comparativas y días clave"
        description="Aquí ves cómo cambian ventas, utilidad, ROAS, margen neto y acumulados por día, semana y mes para tomar mejores decisiones."
        persistenceStatus={persistenceStatus}
      />

      <AnalyticsDashboard
        snapshot={snapshot}
        products={products}
        productSnapshots={productSnapshots}
      />
    </div>
  );
}
