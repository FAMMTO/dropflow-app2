function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-muted via-muted/60 to-muted ${className}`}
    />
  );
}

export default function AppLoading() {
  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur dark:bg-card/70">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              Cargando vista
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-8 w-72 max-w-full" />
              <SkeletonBlock className="h-4 w-[520px] max-w-full" />
              <SkeletonBlock className="h-4 w-[390px] max-w-full" />
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-background/50 p-4 dark:bg-background/40">
            <div className="grid size-24 place-items-center rounded-2xl bg-primary/10 text-primary">
              <div className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur dark:bg-card/70"
          >
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="mt-4 h-8 w-40" />
            <SkeletonBlock className="mt-4 h-3 w-48 max-w-full" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-6 dark:bg-card/70">
          <SkeletonBlock className="h-5 w-56" />
          <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
          <div className="mt-6 h-[300px] rounded-2xl border border-border/60 bg-background/45 p-4 dark:bg-background/35">
            <div className="flex h-full items-end gap-3">
              {[42, 70, 58, 88, 64, 78, 52].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-2xl bg-primary/25"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/80 p-6 dark:bg-card/70">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="mt-3 h-4 w-64 max-w-full" />
          <div className="mt-6 space-y-3">
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
