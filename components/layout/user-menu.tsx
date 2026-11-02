"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronsUpDown, House, LogOut, Moon, Settings, Store, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";
import { useStores } from "@/features/sales/hooks/use-stores";

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
  PLANTA: "Planta",
};

const ROLE_TONE: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-[#7b4a30]/12 text-[#7b4a30] dark:bg-[#d0996c]/15 dark:text-[#e8b98f]",
  FINANZAS: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  VENDEDOR: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  PLANTA: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
};

function StoreLine({ posConfigId }: { posConfigId: number }) {
  const { data } = useStores();
  const store = data?.find((item) => item.id === posConfigId);
  if (!store) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Store className="h-3.5 w-3.5" aria-hidden="true" />
      {store.name}
    </span>
  );
}

const ITEM =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-foreground/85 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5";

interface UserMenuProps {
  user: AuthUser | null;
  homeHref: string;
  onLogout: () => void;
}

/**
 * Pie del menú lateral: la persona conectada (foto, nombre y rol). Al tocarla
 * se abre su menú con correo, tienda, accesos, modo oscuro y Cerrar sesión.
 */
export function UserMenu({ user, homeHref, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const collapsed = state === "collapsed" && !isMobile;
  const dark = resolvedTheme === "dark";
  const name = user?.name ?? user?.email ?? "…";

  function close() {
    setOpen(false);
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Menú de ${name}`}
            className={cn(
              "group/user flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-black/5 dark:hover:bg-white/5",
              open && "border-border bg-black/5 dark:bg-white/5",
              collapsed && "justify-center px-0",
            )}
          />
        }
      >
        <UserAvatar name={user?.name} email={user?.email} size="sm" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">{name}</span>
              {user && (
                <span className={cn("mt-1 inline-flex rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide", ROLE_TONE[user.role])}>
                  {ROLE_LABEL[user.role]}
                </span>
              )}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover/user:text-foreground/70" strokeWidth={1.5} aria-hidden="true" />
          </>
        )}
      </PopoverTrigger>

      <PopoverContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} sideOffset={8} className="w-64 p-1.5">
        <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
          <UserAvatar name={user?.name} email={user?.email} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        {user && (
          <div className="flex flex-wrap items-center gap-2 px-2.5 pb-2.5">
            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", ROLE_TONE[user.role])}>{ROLE_LABEL[user.role]}</span>
            {user.role === "VENDEDOR" && user.posConfigId != null && <StoreLine posConfigId={user.posConfigId} />}
          </div>
        )}

        <div className="my-1 h-px bg-border/70" />
        <Link href="/dashboard/perfil" onClick={close} className={ITEM}>
          <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Ver mi perfil
        </Link>
        <Link href={homeHref} onClick={close} className={ITEM}>
          <House className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Inicio
        </Link>
        {user?.role === "SUPER_ADMIN" && (
          <Link href="/dashboard/admin" onClick={close} className={ITEM}>
            <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Administración
          </Link>
        )}
        <button type="button" role="switch" aria-checked={dark} onClick={() => setTheme(dark ? "light" : "dark")} className={ITEM}>
          <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Modo oscuro
          <span className={cn("ml-auto flex h-5 w-9 items-center rounded-full p-0.5 transition-colors", dark ? "bg-foreground" : "bg-muted-foreground/30")}>
            <span className={cn("h-4 w-4 rounded-full bg-background shadow-sm transition-transform", dark && "translate-x-4")} />
          </span>
        </button>

        <div className="my-1 h-px bg-border/70" />
        <button
          type="button"
          onClick={() => {
            close();
            onLogout();
          }}
          className={cn(ITEM, "text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/15")}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </PopoverContent>
    </Popover>
  );
}
