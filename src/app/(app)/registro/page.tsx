import { PageHeader } from "@/components/app/page-header";
import { DailyProcessForm } from "@/components/forms/daily-process-form";
import { getPersistenceStatus } from "@/lib/db";
import { getDailyProcessById, listProducts } from "@/lib/db/repository";

type RegistroPageProps = {
  searchParams?: Promise<{
    edit?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  searchParams,
}: RegistroPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const editId = resolvedSearchParams.edit;
  const initialRecord = editId ? await getDailyProcessById(editId) : null;
  const persistenceStatus = await getPersistenceStatus();
  const products = await listProducts();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Registro diario"
        title={initialRecord ? "Editar proceso de cálculo" : "Nuevo proceso de cálculo"}
        description="Formulario pensado para capturar rápido desde operación diaria. El sistema recalcula utilidad, márgenes, ROAS y punto de equilibrio antes de guardar."
        persistenceStatus={persistenceStatus}
      />

      <DailyProcessForm
        initialRecord={initialRecord}
        products={products}
        isDemoMode={persistenceStatus !== "database" && persistenceStatus !== "supabase"}
      />
    </div>
  );
}
