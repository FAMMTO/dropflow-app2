import type { ReactNode } from "react";
import { DemoModeBanner } from "@/components/app/demo-mode-banner";
import type { PersistenceStatus } from "@/lib/db";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  persistenceStatus: PersistenceStatus;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  persistenceStatus,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <DemoModeBanner status={persistenceStatus} />
        {actions}
      </div>
    </div>
  );
}
