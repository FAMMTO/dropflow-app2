"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden h-full flex-col gap-1 md:flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group rounded-2xl border border-transparent px-4 py-3 transition",
                active
                  ? "border-white/10 bg-white/[0.08] text-white shadow-lg"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    active
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/[0.05] text-slate-300 group-hover:bg-white/10",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="truncate text-xs text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-w-max items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                active
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
