"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const visiblePendingHref = pendingHref === pathname ? null : pendingHref;

  return (
    <>
      <nav className="hidden h-full flex-col gap-1 md:flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const pending = visiblePendingHref === item.href && !active;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (pathname !== item.href) {
                  setPendingHref(item.href);
                }
              }}
              className={cn(
                "group rounded-2xl border border-transparent px-4 py-3 transition",
                active
                  ? "border-white/10 bg-white/[0.08] text-white shadow-lg"
                  : pending
                    ? "border-emerald-300/20 bg-emerald-400/10 text-white"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    active
                      ? "bg-emerald-500/20 text-emerald-300"
                      : pending
                        ? "bg-emerald-400/15 text-emerald-200"
                        : "bg-white/[0.05] text-slate-300 group-hover:bg-white/10",
                  )}
                >
                  {pending ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-emerald-200/30 border-t-emerald-200" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="truncate text-xs text-slate-400">
                    {pending ? "Cargando vista..." : item.description}
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
          const pending = visiblePendingHref === item.href && !active;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (pathname !== item.href) {
                  setPendingHref(item.href);
                }
              }}
              className={cn(
                "inline-flex min-w-max items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                active
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : pending
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground",
              )}
            >
              {pending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              ) : (
                <Icon className="size-4" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
