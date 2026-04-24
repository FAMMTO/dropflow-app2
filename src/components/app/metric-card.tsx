import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MetricCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MetricCard({ metric }: { metric: MetricCardData }) {
  const tone =
    metric.tone === "positive"
      ? "text-emerald-600 dark:text-emerald-300"
      : metric.tone === "negative"
        ? "text-rose-600 dark:text-rose-300"
        : "text-foreground";

  const ToneIcon =
    metric.tone === "positive"
      ? ArrowUpRight
      : metric.tone === "negative"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className="border-border/70 bg-card/95 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {metric.label}
            </p>
            <p className={cn("text-2xl font-semibold tracking-tight", tone)}>
              {metric.value}
            </p>
            {metric.hint ? (
              <p className="text-sm leading-5 text-muted-foreground">
                {metric.hint}
              </p>
            ) : null}
          </div>

          <div className="rounded-full border border-border bg-muted/70 p-2 text-muted-foreground">
            <ToneIcon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
