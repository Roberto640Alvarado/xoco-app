"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Store, type LucideIcon } from "lucide-react";
import { cn } from "cn";

export interface StoreTab {
  /** undefined = "Todas las tiendas". */
  id: number | undefined;
  name: string;
  total: number;
  /** Solicitudes que esperan algo de quien mira (por responder). */
  pending: number;
  /** Ícono propio (por defecto, el de tienda en las pestañas de una tienda). */
  icon?: LucideIcon;
}

interface StoreTabsProps {
  tabs: StoreTab[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
}

// Pestañas por tienda para Despacho: una pestaña por tienda con cuántas
// solicitudes tiene y, resaltado, cuántas esperan respuesta. Se desliza en
// horizontal en pantallas chicas. La pestaña activa lleva un subrayado que
// se mueve de una a otra.
export function StoreTabs({ tabs, value, onChange }: StoreTabsProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div role="tablist" aria-label="Tiendas" data-tour="req-store-tabs" className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id ?? "all"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex min-h-12 shrink-0 items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active ? "bg-card text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {tab.icon ? <tab.icon className="size-4 shrink-0" aria-hidden="true" /> : tab.id !== undefined && <Store className="size-4 shrink-0" aria-hidden="true" />}
            {tab.name}
            <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-muted text-foreground" : "bg-muted/60")}>{tab.total}</span>
            {tab.pending > 0 && (
              <span
                className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white"
                aria-label={`${tab.pending} esperan algo de ti`}
                title={`${tab.pending} esperan algo de ti`}
              >
                {tab.pending} {tab.pending === 1 ? "pendiente" : "pendientes"}
              </span>
            )}
            {active && (
              <motion.span
                layoutId={reduce ? undefined : "store-tab-underline"}
                className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-primary"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
