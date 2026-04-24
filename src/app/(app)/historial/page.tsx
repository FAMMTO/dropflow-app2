import { PageHeader } from "@/components/app/page-header";
import { HistoryTable } from "@/components/history/history-table";
import { getPersistenceStatus } from "@/lib/db";
import { listDailyProcesses } from "@/lib/db/repository";
import { enrichDailyProcesses } from "@/lib/domain/dropflow";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const persistenceStatus = await getPersistenceStatus();
  const records = enrichDailyProcesses(await listDailyProcesses());

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Historial"
        title="Todos los registros diarios"
        description="Revisa el histórico completo, filtra por rango de fechas, busca observaciones y exporta tu corte a CSV."
        persistenceStatus={persistenceStatus}
      />

      <HistoryTable
        records={records}
        isDemoMode={persistenceStatus !== "database" && persistenceStatus !== "supabase"}
      />
    </div>
  );
}
