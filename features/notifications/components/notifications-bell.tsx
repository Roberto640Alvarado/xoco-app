"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Bell, BellRing, CheckCircle2, ChevronRight, PackageMinus, PackagePlus, RefreshCw, Truck, XCircle, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/use-notifications";
import type { AppNotification, NotificationTone } from "../types/notifications.types";

const TONE: Record<NotificationTone, { icon: LucideIcon; className: string }> = {
  warning: { icon: AlertTriangle, className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  info: { icon: Truck, className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  success: { icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  danger: { icon: XCircle, className: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
};

const STORE_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" });
const SHORT = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function relative(iso: string, now: number): string {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return SHORT.format(new Date(iso));
}

function NotificationRow({ item, now, index, onOpen }: { item: AppNotification; now: number; index: number; onOpen: () => void }) {
  const reduce = useReducedMotion();
  const tone = TONE[item.tone];
  const KindIcon = item.kind === "request" ? PackagePlus : PackageMinus;
  return (
    <motion.li initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.035 }}>
      <button type="button" onClick={onOpen} className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60">
        <span className={cn("relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone.className)}>
          <tone.icon className="h-5 w-5" aria-hidden="true" />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-card text-muted-foreground">
            <KindIcon className="h-3 w-3" aria-hidden="true" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug text-foreground">{item.title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span>
          <span className="mt-1 block text-[11px] text-muted-foreground/80">{relative(item.at, now)}</span>
        </span>
        <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </motion.li>
  );
}

/**
 * Campana de notificaciones (arriba a la derecha, junto al tema): globo con
 * cuántas cosas piden atención y, al tocarla, un panel lateral con cada una
 * (solicitudes y movimientos según el rol). Tocar una lleva a su pantalla.
 */
export function NotificationsBell() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const { data, isLoading, isFetching, refetch } = useNotifications();
  const [now, setNow] = useState(() => Date.now());
  const items = useMemo(() => data?.items ?? [], [data]);
  const count = data?.total ?? 0;

  const groups = useMemo(() => {
    const today = STORE_DATE.format(new Date(now));
    const todayItems = items.filter((item) => STORE_DATE.format(new Date(item.at)) === today);
    const older = items.filter((item) => STORE_DATE.format(new Date(item.at)) !== today);
    return [
      { label: "Hoy", items: todayItems },
      { label: "Antes", items: older },
    ].filter((group) => group.items.length > 0);
  }, [items, now]);

  function openPanel(next: boolean) {
    if (next) setNow(Date.now());
    setOpen(next);
  }

  function go(item: AppNotification) {
    setOpen(false);
    router.push(item.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openPanel(true)}
        aria-label={count > 0 ? `Notificaciones: ${count} pendientes` : "Notificaciones"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
      >
        <motion.span
          animate={count > 0 && !reduce ? { rotate: [0, -14, 12, -8, 6, 0] } : undefined}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 6 }}
          className="inline-flex"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        </motion.span>
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={count}
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-background"
            >
              {count > 99 ? "99+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Sheet open={open} onOpenChange={openPanel}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-5">
            <div>
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                <BellRing className="h-5 w-5 text-[#7b4a30] dark:text-[#d0996c]" aria-hidden="true" />
                Notificaciones
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-sm text-muted-foreground">
                {count > 0 ? `${count} ${count === 1 ? "cosa pide" : "cosas piden"} tu atención` : "Lo que pide tu atención en el panel"}
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              aria-label="Actualizar notificaciones"
              className="mr-8 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {isLoading ? (
              <div className="flex flex-col gap-2 px-3" aria-busy="true">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex gap-3 py-2">
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <motion.span
                  initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </motion.span>
                <p className="text-base font-semibold text-foreground">¡Todo al día!</p>
                <p className="text-sm text-muted-foreground">No tienes nada pendiente por ahora.</p>
              </div>
            ) : (
              groups.map((group) => (
                <section key={group.label} className="mb-2">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                  <ul className="flex flex-col">
                    {group.items.map((item, index) => (
                      <NotificationRow key={item.id} item={item} now={now} index={index} onOpen={() => go(item)} />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
