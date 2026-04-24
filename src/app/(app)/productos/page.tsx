import { PageHeader } from "@/components/app/page-header";
import { ProductSettings } from "@/components/products/product-settings";
import { getPersistenceStatus } from "@/lib/db";
import { listProducts } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const persistenceStatus = await getPersistenceStatus();
  const products = await listProducts();
  const isDemoMode =
    persistenceStatus !== "database" && persistenceStatus !== "supabase";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Productos"
        title="Configuracion de productos"
        description="Define precios, costos, envio y pasarela por unidad para reutilizarlos en cada registro."
        persistenceStatus={persistenceStatus}
      />

      <ProductSettings products={products} isDemoMode={isDemoMode} />
    </div>
  );
}
