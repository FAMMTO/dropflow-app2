import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:flex-row md:px-6 lg:gap-6 lg:px-8">
        <aside className="md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:w-[290px]">
          <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(29,158,117,0.16),_transparent_38%),linear-gradient(180deg,#0f172a_0%,#111827_56%,#0b1120_100%)] p-4 text-white shadow-[0_35px_60px_-30px_rgba(15,23,42,0.65)]">
            <div className="flex items-start justify-between gap-4">
              <Link href="/" className="space-y-2">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{APP_NAME}</h2>
                  <p className="text-sm leading-6 text-slate-400">
                    Panel financiero para dropshipping
                  </p>
                </div>
              </Link>
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-6 text-slate-300">{APP_DESCRIPTION}</p>
            </div>

            <div className="mt-6 flex-1">
              <SidebarNav />
            </div>

            <div className="mt-6 hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 md:block">
              Centraliza cálculos, alertas y análisis sin depender de Excel.
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-[24px] border border-border/70 bg-card/90 px-4 py-3 backdrop-blur md:hidden">
            <div>
              <p className="text-sm font-semibold">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">Dropshipping OS</p>
            </div>
            <ThemeToggle />
          </div>

          <main className="flex-1 rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top,_rgba(29,158,117,0.08),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(245,247,251,0.96))] p-4 shadow-[0_25px_65px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-[radial-gradient(circle_at_top,_rgba(29,158,117,0.12),_transparent_30%),linear-gradient(180deg,rgba(10,18,28,0.95),rgba(5,12,18,0.98))] md:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
