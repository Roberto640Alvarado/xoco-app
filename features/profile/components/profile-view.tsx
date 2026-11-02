"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, CalendarDays, CheckCircle2, Clock, LayoutGrid, Lock, Mail, ShieldCheck, Store, Warehouse, XCircle, type LucideIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";
import { useStores } from "@/features/sales/hooks/use-stores";
import { MODULE_KEYS, MODULE_LABEL, type ModuleKey } from "@/features/permissions/types/permissions.types";

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
  PLANTA: "Planta",
};

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  SUPER_ADMIN: "Acceso a todo el panel, la administración y Xoco IA.",
  FINANZAS: "Ventas, reportes, metas y control de inventario de todas las tiendas.",
  VENDEDOR: "Ventas e inventario de tu tienda.",
  PLANTA: "Solicitudes de las tiendas y su inventario (solo ver).",
};

const ROLE_TONE: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-[#e6c77c]/20 text-[#f2d48f]",
  FINANZAS: "bg-sky-400/20 text-sky-200",
  VENDEDOR: "bg-emerald-400/20 text-emerald-200",
  PLANTA: "bg-violet-400/20 text-violet-200",
};

const LONG_DATE = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", day: "numeric", month: "long", year: "numeric" });
const TIME = new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", hour: "numeric", minute: "2-digit" });

function daysSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - Date.parse(iso)) / 86_400_000));
}

function sinceLabel(days: number): string {
  if (days === 0) return "Hoy mismo";
  if (days === 1) return "Hace 1 día";
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(days / 365);
  return `Hace ${years} ${years === 1 ? "año" : "años"}`;
}

/** Cuenta de 0 al valor al aparecer. */
function useCountUp(value: number, enabled: boolean): number {
  const [shown, setShown] = useState(enabled ? 0 : value);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, enabled]);
  return enabled ? shown : value;
}

function StoreName({ posConfigId }: { posConfigId: number }) {
  const { data } = useStores();
  return <>{data?.find((store) => store.id === posConfigId)?.name ?? `Tienda ${posConfigId}`}</>;
}

function Detail({ icon: Icon, label, children, index }: { icon: LucideIcon; label: string; children: React.ReactNode; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.06 }}
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b27a52]/12 text-[#7b4a30] dark:text-[#d0996c]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-0.5 break-words text-sm font-semibold text-foreground">{children}</div>
      </div>
    </motion.div>
  );
}

function modulesFor(user: AuthUser): { allowed: ModuleKey[]; blocked: ModuleKey[] } {
  const inCeiling = MODULE_KEYS.filter((key) => key in (user.permissions ?? {}));
  return {
    allowed: inCeiling.filter((key) => user.permissions[key] !== false),
    blocked: inCeiling.filter((key) => user.permissions[key] === false),
  };
}

// Mi perfil: datos de la cuenta, desde cuándo es parte del panel y qué
// pantallas puede usar (según su rol y lo que configuró el Admin en Permisos).
export function ProfileView() {
  const user = useAuthStore((state) => state.user);
  const reduce = useReducedMotion();
  const [now] = useState(() => Date.now());
  const modules = useMemo(() => (user ? modulesFor(user) : { allowed: [], blocked: [] }), [user]);
  const days = user?.createdAt ? daysSince(user.createdAt, now) : 0;
  const daysShown = useCountUp(days, !reduce);
  const modulesShown = useCountUp(modules.allowed.length, !reduce);

  if (!user) return null;
  const name = user.name ?? user.email;
  const created = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Portada */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[#5a3421]/30 bg-gradient-to-br from-[#2a170e] via-[#3b2216] to-[#5a3421] p-6 text-[#fff8f0] sm:p-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#e6c77c]/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#b27a52]/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="relative">
            <motion.span
              aria-hidden="true"
              className="absolute -inset-2 rounded-full bg-[conic-gradient(from_0deg,#e6c77c,#b27a52,#7b4a30,#e6c77c)] opacity-80"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative block rounded-full bg-[#2a170e] p-1">
              <UserAvatar name={user.name} email={user.email} size="lg" className="h-20! w-20! bg-[#f1dcc7]! text-2xl! text-[#3b2216]! sm:h-24! sm:w-24!" />
            </span>
            {user.isActive && (
              <motion.span
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 15 }}
                className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-[#2a170e]"
                title="Cuenta activa"
              >
                <CheckCircle2 className="h-4 w-4 text-white" aria-hidden="true" />
              </motion.span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", ROLE_TONE[user.role])}>{ROLE_LABEL[user.role]}</span>
            <h1 className="mt-2 truncate text-2xl font-bold sm:text-3xl">{name}</h1>
            <p className="truncate text-sm text-[#f1dcc7]/80">{user.email}</p>
            <p className="mt-2 text-sm text-[#f1dcc7]/85">{ROLE_DESCRIPTION[user.role]}</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
            <div className="rounded-2xl bg-black/20 px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{daysShown}</p>
              <p className="text-[11px] text-[#f1dcc7]/75">{days === 1 ? "día" : "días"} en Xoco</p>
            </div>
            <div className="rounded-2xl bg-black/20 px-4 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{modulesShown}</p>
              <p className="text-[11px] text-[#f1dcc7]/75">pantallas</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Datos de la cuenta */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Tu cuenta</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Detail icon={Mail} label="Correo" index={0}>
            {user.email}
          </Detail>
          <Detail icon={ShieldCheck} label="Rol" index={1}>
            {ROLE_LABEL[user.role]}
          </Detail>
          <Detail icon={CalendarDays} label="Miembro desde" index={2}>
            {created ? (
              <>
                {LONG_DATE.format(created)}
                <span className="block text-xs font-normal text-muted-foreground">
                  {sinceLabel(days)} · a las {TIME.format(created)}
                </span>
              </>
            ) : (
              "—"
            )}
          </Detail>
          <Detail icon={BadgeCheck} label="Estado" index={3}>
            <span className={cn("inline-flex items-center gap-1.5", user.isActive ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")}>
              {user.isActive ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
              {user.isActive ? "Activa" : "Desactivada"}
            </span>
          </Detail>
          {user.role === "VENDEDOR" && (
            <Detail icon={Store} label="Tienda" index={4}>
              {user.posConfigId != null ? <StoreName posConfigId={user.posConfigId} /> : "Sin tienda asignada"}
            </Detail>
          )}
          {user.role === "VENDEDOR" && (
            <Detail icon={Warehouse} label="Inventario" index={5}>
              {user.inventoryEnabled ? "Con acceso" : "Sin acceso (pídelo al Admin)"}
            </Detail>
          )}
          <Detail icon={Clock} label="Sesión" index={6}>
            Activa en este navegador
            <span className="block text-xs font-normal text-muted-foreground">Se cierra desde tu menú → Cerrar sesión</span>
          </Detail>
        </div>
      </section>

      {/* Pantallas */}
      {modules.allowed.length + modules.blocked.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <LayoutGrid className="h-4 w-4 text-[#b27a52]" aria-hidden="true" />
              Pantallas que puedes usar
            </h2>
            <p className="text-sm text-muted-foreground">Según tu rol y lo que el Admin configuró en Permisos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {modules.allowed.map((key, index) => (
              <motion.span
                key={key}
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.03 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {MODULE_LABEL[key]}
              </motion.span>
            ))}
            {modules.blocked.map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground" title="El Admin la desactivó para tu rol">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                {MODULE_LABEL[key]}
              </span>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
