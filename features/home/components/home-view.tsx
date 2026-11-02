"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bell, CloudSun, MoonStar, Sparkles, Sun, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XocolatisimoMark } from "@/components/brand/xocolatisimo-mark";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useCanUseInventory } from "@/features/inventory-access/hooks/use-inventory-access";
import { useMovementNotifications } from "@/features/inventory-movements/hooks/use-movement-notifications";
import { useStockRequestNotifications } from "@/features/stock-requests/hooks/use-stock-requests";
import { XocoAgent } from "@/features/ai-xoco/components/xoco-agent";
import { SHORTCUTS, type HomeShortcut } from "../lib/home-content";
import { GREETING, dayPart, todayLabel, type DayPart } from "../lib/greeting";
import { TodaySalesAllStores, TodaySalesMyStore } from "./today-sales";
import { PlantOrders } from "./plant-orders";

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
  PLANTA: "Planta",
};

const PART_ICON = { manana: Sun, tarde: CloudSun, noche: MoonStar } as const;

const SUBTITLE: Record<UserRole, string> = {
  SUPER_ADMIN: "Esto es lo que pasa hoy en Xocolatísimo.",
  FINANZAS: "Aquí tienes las cifras y lo que falta por revisar.",
  VENDEDOR: "Que tengas una excelente jornada en la tienda.",
  PLANTA: "Estas son las solicitudes de las tiendas.",
};

function allowed(item: { moduleKey?: string; inventory?: boolean }, user: AuthUser, canUseInventory: boolean): boolean {
  if (item.inventory && !canUseInventory) return false;
  return !item.moduleKey || user.permissions?.[item.moduleKey] !== false;
}

/** Parte del día que se actualiza sola (si dejan la pantalla abierta). */
function useDayPart(): DayPart {
  const [part, setPart] = useState<DayPart>(() => dayPart());
  useEffect(() => {
    const timer = setInterval(() => setPart(dayPart()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return part;
}

function StoreName({ posConfigId }: { posConfigId: number }) {
  const { data } = useStores();
  const store = data?.find((item) => item.id === posConfigId);
  return store ? <> · {store.name}</> : null;
}

function Greeting({ user }: { user: AuthUser }) {
  const reduce = useReducedMotion();
  const part = useDayPart();
  const Icon = PART_ICON[part];
  const firstName = (user.name ?? user.email).split(/[\s@]/)[0];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#5a3421]/30 bg-gradient-to-br from-[#2a170e] via-[#3b2216] to-[#5a3421] p-5 text-[#fff8f0] sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#e6c77c]/10 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <motion.span
          initial={reduce ? false : { rotate: -20, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e6c77c]/15 text-[#e6c77c] sm:h-14 sm:w-14"
        >
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
        </motion.span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#f1dcc7]/75 sm:text-sm">
            {todayLabel()} · {ROLE_LABEL[user.role]}
            {user.role === "VENDEDOR" && user.posConfigId != null && <StoreName posConfigId={user.posConfigId} />}
          </p>
          <h1 className="truncate text-2xl font-bold leading-tight sm:text-3xl">
            {GREETING[part]}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-[#f1dcc7]/85">{SUBTITLE[user.role]}</p>
        </div>
        <XocolatisimoMark className="ml-auto hidden h-16 w-16 shrink-0 text-[#f1dcc7]/25 md:block" />
      </div>
    </section>
  );
}

function XocoIaAnnouncement() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#e6c77c]/40 bg-gradient-to-r from-[#fff8f0] to-[#f6e7d2] p-5 dark:from-[#2a170e] dark:to-[#3b2216]">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <XocoAgent size={110} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-[#5a3421] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#fff8f0] sm:mx-0">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Nuevo
          </span>
          <h2 className="text-xl font-bold text-[#3b2216] dark:text-[#fff8f0] sm:text-2xl">Xoco IA llegó a Xocolatísimo</h2>
          <p className="text-sm leading-relaxed text-[#5a3421]/85 dark:text-[#f1dcc7]/85">
            Pregúntale en tus palabras por ventas, metas, inventario o cualquier dato de Odoo, y te responde con las cifras del panel, gráficas y
            tablas. Elige entre Claude y ChatGPT.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link href="/dashboard/ia-xoco/chat" className={cn(buttonVariants({ size: "sm" }), "bg-[#3b2216] text-[#fff8f0] hover:bg-[#5a3421] dark:bg-[#e6c77c] dark:text-[#2a170e] dark:hover:bg-[#f2d48f]")}>
              Hablar con Xoco
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/dashboard/ia-xoco/llaves" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Configurar llaves
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PendingCard({ icon: Icon, count, title, href, tone }: { icon: typeof Bell; count: number; title: string; href: string; tone: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-semibold tabular-nums text-foreground">{count}</span>
        <span className="block truncate text-sm text-muted-foreground">{title}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

function Pending({ role, canUseInventory }: { role: UserRole; canUseInventory: boolean }) {
  const { data: movements } = useMovementNotifications();
  const { data: requests } = useStockRequestNotifications();
  if (!canUseInventory) return null;

  const movementCount = movements?.movements ?? 0;
  const requestCount = requests?.pending ?? 0;
  const cards: { icon: typeof Bell; count: number; title: string; href: string; tone: string }[] = [];

  if ((role === "SUPER_ADMIN" || role === "FINANZAS") && movementCount > 0) {
    cards.push({ icon: Bell, count: movementCount, title: "Movimientos por confirmar", href: "/dashboard/inventario/movimientos", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" });
  }
  if (role === "VENDEDOR" && movementCount > 0) {
    cards.push({ icon: Bell, count: movementCount, title: "Movimientos resueltos", href: "/dashboard/inventario/movimientos", tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" });
  }
  if (role === "VENDEDOR" && requestCount > 0) {
    cards.push({ icon: Truck, count: requestCount, title: "Envíos por recibir", href: "/dashboard/inventario/solicitudes", tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300" });
  }
  if (cards.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-foreground">Para atender</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <PendingCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}

function Shortcuts({ items }: { items: HomeShortcut[] }) {
  const reduce = useReducedMotion();
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-foreground">Ir a</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item, index) => (
          <motion.div key={item.href} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Link
              href={item.href}
              className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-[#b27a52]/50 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b27a52]/12 text-[#7b4a30] dark:text-[#d0996c]">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                {item.title}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{item.description}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Inicio del panel: saludo según la hora, lo que falta por atender, las ventas
// de hoy (todas las tiendas o la propia) y accesos rápidos, según el rol. El Super admin siempre ve el
// anuncio de Xoco IA.
export function HomeView() {
  const user = useAuthStore((state) => state.user);
  const { canUse: canUseInventory } = useCanUseInventory();
  if (!user) return null;

  // Ventas de hoy: mismo permiso que el Resumen de ventas.
  const canSeeSales = user.permissions?.["dashboard.resumen"] !== false;
  const shortcuts = SHORTCUTS[user.role].filter((item) => allowed(item, user, canUseInventory));

  return (
    <div className="flex flex-col gap-5">
      <Greeting user={user} />
      <Pending role={user.role} canUseInventory={canUseInventory} />
      {canSeeSales && (user.role === "SUPER_ADMIN" || user.role === "FINANZAS") && <TodaySalesAllStores />}
      {canSeeSales && user.role === "VENDEDOR" && <TodaySalesMyStore />}
      {user.role === "PLANTA" && <PlantOrders />}
      {user.role === "SUPER_ADMIN" && <XocoIaAnnouncement />}
      <Shortcuts items={shortcuts} />
    </div>
  );
}
