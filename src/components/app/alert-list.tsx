import { AlertCircle, CheckCircle2, Info, Siren } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightAlert } from "@/lib/types";
import { cn } from "@/lib/utils";

const toneStyles = {
  success:
    "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  info: "border-sky-500/15 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  danger: Siren,
  info: Info,
};

export function AlertList({ alerts }: { alerts: InsightAlert[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Alertas inteligentes</CardTitle>
        <CardDescription>
          Señales rápidas para detectar cuándo escalar, ajustar o corregir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = icons[alert.tone];

          return (
            <div
              key={`${alert.title}-${alert.message}`}
              className={cn(
                "rounded-2xl border p-4",
                toneStyles[alert.tone],
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-sm leading-6 opacity-90">{alert.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
