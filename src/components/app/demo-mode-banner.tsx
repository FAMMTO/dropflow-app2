import { DatabaseZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PersistenceStatus } from "@/lib/db";

export function DemoModeBanner({ status }: { status: PersistenceStatus }) {
  if (status === "database" || status === "supabase") {
    return (
      <Badge variant="success" className="gap-1.5">
        <DatabaseZap className="size-3.5" />
        Supabase listo
      </Badge>
    );
  }

  if (status === "supabase-missing-table") {
    return (
      <Badge variant="warning" className="gap-1.5">
        <DatabaseZap className="size-3.5" />
        Supabase sin tabla · ejecuta daily_processes.sql
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="gap-1.5">
      <DatabaseZap className="size-3.5" />
      Modo demo · configura Supabase
    </Badge>
  );
}
