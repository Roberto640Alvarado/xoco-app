"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, Loader2, Lock, LogOut, type LucideIcon } from "lucide-react";
import { XocolatisimoMark } from "@/components/brand/xocolatisimo-mark";
import { useAuthStore } from "@/store/auth-store";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { usePermissionsRefresh } from "@/features/auth/hooks/use-permissions-refresh";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";

interface DashboardNavLeafBase {
  label: string;
  icon: LucideIcon;
  roles?: UserRole[]; // sin esto, visible para cualquier rol autenticado
  /** Llave del panel "Permisos" (Fase 3 de RBAC) — sin esto (ej.
   * Administración), el módulo no es configurable desde ese panel y solo
   * se filtra por `roles`. Con esto, además se oculta si
   * user.permissions[moduleKey] === false explícitamente (ausente o
   * true => visible, default-allow). */
  moduleKey?: string;
  /** Globo de aviso (ej. pendientes por confirmar) — solo se dibuja si es > 0. */
  badge?: number;
  /** Texto accesible/tooltip del globo (ej. "3 por confirmar"). */
  badgeLabel?: string;
}

export interface DashboardNavLeaf extends DashboardNavLeafBase {
  href: string;
}

type DashboardNavGroupItem = DashboardNavLeafBase & {
  group: string;
  /** Ítems relacionados agrupados bajo un submenú colapsable — ver
   * plan-history de la reorganización del sidebar para el criterio de
   * agrupación (por qué estos y no otros quedaron juntos). */
  children: DashboardNavLeaf[];
};

/** Un ítem del sidebar: o un enlace directo (`href`), o un submenú
 * colapsable que agrupa varios enlaces relacionados (`children`). */
export type DashboardNavItem = (DashboardNavLeaf & { group: string }) | DashboardNavGroupItem;

function hasChildren(item: DashboardNavItem): item is DashboardNavGroupItem {
  return "children" in item;
}

/** Aplana los submenús a una lista de enlaces — para resolver el item
 * activo (resaltado + título del header) sin importar si está anidado. */
function flattenLeaves(items: DashboardNavItem[]): DashboardNavLeaf[] {
  return items.flatMap((item) => (hasChildren(item) ? item.children : [item]));
}

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
  VENDEDOR: "Vendedor",
};

// Orden fijo de las secciones del sidebar, independiente del orden en que
// vengan los items en NAV_ITEMS. Un grupo sin ítems visibles (ej.
// "Sistema" para un usuario FINANZAS, que no tiene ningún item con ese
// group) simplemente no se renderiza — nunca aparece un título de sección
// vacío. El grupo "" es el bloque principal de reportes: se renderiza sin
// encabezado (el usuario pidió quitar los títulos "General"/"Reportes").
const GROUP_ORDER = ["", "Sistema"];

// Con más de una ruta bajo /dashboard/*, un match por prefijo simple puede
// activar "Ventas" (href "/dashboard") en /dashboard/visitas, porque esa
// ruta también empieza con "/dashboard/". En vez de tomar el primer item
// que matchea (dependiente del orden del arreglo), se toma el href más
// específico (el más largo) entre los que matchean.
function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveNavItem<T extends { href: string }>(
  items: T[],
  pathname: string,
): T | undefined {
  return [...items]
    .filter((item) => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function canSeeItem(item: DashboardNavLeafBase, user: AuthUser | null): boolean {
  const roleAllowed = !item.roles || (!!user && item.roles.includes(user.role));
  if (!roleAllowed) return false;

  // Sin moduleKey (ej. Administración), no pasa por el panel de Permisos.
  if (!item.moduleKey) return true;

  // Ausente o true => permitido (default-allow, mismo criterio que
  // ModuleAccessGuard en el backend) — solo `false` explícito oculta.
  return user?.permissions?.[item.moduleKey] !== false;
}

// Filtra por rol y por permisos (panel "Permisos", Fase 3 de RBAC) tanto
// los ítems directos como, dentro de cada submenú, sus hijos — un submenú
// que se queda sin ningún hijo visible para el usuario actual no se
// renderiza (igual que un grupo vacío).
function filterNavItemsByRole(
  items: DashboardNavItem[],
  user: AuthUser | null,
): DashboardNavItem[] {
  return items.reduce<DashboardNavItem[]>((visible, item) => {
    if (hasChildren(item)) {
      const children = item.children.filter((child) => canSeeItem(child, user));
      if (children.length > 0) {
        visible.push({ ...item, children });
      }
      return visible;
    }
    if (canSeeItem(item, user)) {
      visible.push(item);
    }
    return visible;
  }, []);
}

// Globo rojo con el conteo; con el sidebar colapsado a ícono se reduce a un
// punto en la esquina (el número no cabe en el carril de 3rem).
function NavBadge({ count, label }: { count?: number; label?: string }) {
  if (!count || count <= 0) return null;
  return (
    <>
      <span
        className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-white group-data-[collapsible=icon]:hidden"
        title={label}
        aria-label={label ?? `${count} avisos`}
      >
        {count > 99 ? "99+" : count}
      </span>
      <span
        className="absolute right-1.5 top-1.5 hidden size-2 rounded-full bg-destructive group-data-[collapsible=icon]:block"
        aria-hidden="true"
      />
    </>
  );
}

function NavLeafRow({
  item,
  isActive,
  index,
  shouldReduceMotion,
}: {
  item: DashboardNavLeaf;
  isActive: boolean;
  index: number;
  shouldReduceMotion: boolean | null;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={shouldReduceMotion ? undefined : { x: 3 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={item.label}
          render={<Link href={item.href} />}
          className="h-11 gap-3 rounded-xl px-3 text-[15px] [&_svg]:size-[18px]"
        >
          <Icon />
          <span>{item.label}</span>
          <NavBadge count={item.badge} label={item.badgeLabel} />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </motion.div>
  );
}

function NavSubLeafRow({ item, isActive }: { item: DashboardNavLeaf; isActive: boolean }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={isActive}
        render={<Link href={item.href} />}
        className="gap-2.5 text-[14px]"
      >
        <span>{item.label}</span>
        <NavBadge count={item.badge} label={item.badgeLabel} />
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function NavGroupRow({
  item,
  activeHref,
  index,
  shouldReduceMotion,
}: {
  item: DashboardNavGroupItem;
  activeHref: string | undefined;
  index: number;
  shouldReduceMotion: boolean | null;
}) {
  const Icon = item.icon;
  const hasActiveChild = item.children.some((child) => child.href === activeHref);
  const childrenBadge = item.children.reduce((sum, child) => sum + (child.badge ?? 0), 0);

  // Abierto de entrada si ya se cargó sobre una ruta hija. Después, solo se
  // vuelve a abrir automáticamente cuando la navegación ENTRA a este
  // submenú (transición false -> true) — no se fuerza a mantenerlo abierto
  // mientras el usuario sigue en esa ruta, para no pelear con un cierre
  // manual del propio submenú activo.
  const [open, setOpen] = useState(hasActiveChild);
  const wasActiveChild = useRef(hasActiveChild);
  useEffect(() => {
    if (hasActiveChild && !wasActiveChild.current) {
      setOpen(true);
    }
    wasActiveChild.current = hasActiveChild;
  }, [hasActiveChild]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={shouldReduceMotion ? undefined : { x: 3 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
    >
      <SidebarMenuItem>
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger
            render={
              <SidebarMenuButton
                tooltip={item.label}
                className="h-11 gap-3 rounded-xl px-3 text-[15px] [&_svg]:size-[18px]"
              />
            }
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
            <NavBadge count={childrenBadge} label={`${childrenBadge} avisos en ${item.label}`} />
            <ChevronDown className={cn("size-4! shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-[panel-open]/menu-button:rotate-180", childrenBadge > 0 ? "ml-2" : "ml-auto")} />
          </Collapsible.Trigger>
          {/* Base UI expone la altura medida del panel en la variable CSS
              --collapsible-panel-height — sin animar `height` a partir de
              ahí (y sin el overflow-hidden), el submenú aparecía/
              desaparecía de golpe en vez de deslizarse. */}
          <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:h-0 data-[starting-style]:opacity-0">
            <SidebarMenuSub>
              {item.children.map((child) => (
                <NavSubLeafRow key={child.href} item={child} isActive={child.href === activeHref} />
              ))}
            </SidebarMenuSub>
          </Collapsible.Panel>
        </Collapsible.Root>
      </SidebarMenuItem>
    </motion.div>
  );
}

// Mismo sidebar de shadcn/ui que usa ecoguide-app (components/ui/sidebar.tsx):
// en móvil se renderiza como <Sheet> (drawer deslizable), en escritorio
// como panel fijo colapsable a modo ícono. El estado lo maneja el propio
// SidebarProvider. El estilo (panel gris + pill blanco para el activo,
// secciones agrupadas, submenús colapsables dentro de "Reportes") sigue una
// referencia visual + feedback de reorganización que pidió el usuario —
// ver plan-history.
function NavList({ navItems }: { navItems: DashboardNavItem[] }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const activeHref = findActiveNavItem(flattenLeaves(navItems), pathname)?.href;

  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: navItems.filter((item) => item.group === group),
  })).filter(({ items }) => items.length > 0);

  return (
    <>
      {groups.map(({ group, items }) => (
        <SidebarGroup key={group}>
          {group && (
            <SidebarGroupLabel className="uppercase tracking-wide text-[11px]">
              {group}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) =>
                hasChildren(item) ? (
                  <NavGroupRow
                    key={item.label}
                    item={item}
                    activeHref={activeHref}
                    index={index}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ) : (
                  <NavLeafRow
                    key={item.href}
                    item={item}
                    isActive={item.href === activeHref}
                    index={index}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

interface DashboardShellProps {
  navItems: DashboardNavItem[];
  dashboardHref: string;
  children: React.ReactNode;
}

// Aviso cuando la pantalla pedida no está disponible para el rol del usuario.
function RouteBlockedNotice({ href }: { href: string }) {
  return (
    <div className="mx-auto mt-6 flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <p className="font-semibold text-foreground">Esta sección no está disponible para tu rol</p>
      <p className="text-sm text-muted-foreground">Si la necesitas, pídele al Admin que te dé acceso.</p>
      <Link href={href} className={buttonVariants({ variant: "outline" })}>
        Ir a una sección disponible
      </Link>
    </div>
  );
}

export function DashboardShell({ navItems, dashboardHref, children }: DashboardShellProps) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const pathname = usePathname();

  usePermissionsRefresh();

  const visibleNavItems = filterNavItemsByRole(navItems, user);
  const visibleLeaves = flattenLeaves(visibleNavItems);
  const activeItem = findActiveNavItem(visibleLeaves, pathname);
  // Pantalla pedida por URL que el rol no puede ver (por rol o porque el Admin
  // la quitó en Permisos): se muestra un aviso en vez de la pantalla.
  const requestedItem = findActiveNavItem(flattenLeaves(navItems), pathname);
  const isBlocked = !!requestedItem && !canSeeItem(requestedItem, user);
  const fallbackHref = visibleLeaves[0]?.href ?? dashboardHref;

  // Evita que las páginas hijas disparen requests (React Query) antes de
  // que useSessionHydration termine de rehidratar el accessToken desde la
  // cookie httpOnly — sin este gate, un refresh duro de una ruta protegida
  // puede salir sin el header Authorization y el interceptor de axios
  // fuerza un redirect a /login antes de que la hidratación alcance a
  // completarse.
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          {/* Mismos paddings que la versión anterior (px-2 py-1 en el link,
              sin padding extra en la fila) — el sidebar colapsado a modo
              ícono mide 3rem: cualquier padding de más hace que el
              logo-badge se desborde del carril angosto (ver SidebarHeader
              -> p-2 en components/ui/sidebar.tsx, ya deja solo 32px de
              ancho útil). */}
          <Link
            href={dashboardHref}
            className="flex min-w-0 items-center gap-2 px-2 py-1 font-semibold text-lg text-sidebar-foreground focus:outline-hidden focus:opacity-80 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-[#45382E] dark:text-[#E8DCC8]">
              <XocolatisimoMark className="h-5 w-5" />
            </span>
            <span className="truncate text-sidebar-primary group-data-[collapsible=icon]:hidden">
              Xocolatísimo
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <NavList navItems={visibleNavItems} />
        </SidebarContent>

        <SidebarFooter className="gap-2">
          <div className="flex flex-col gap-1">
            <ThemeToggle
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 text-sidebar-foreground transition-colors duration-150 ease-out hover:bg-sidebar-primary/8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              labelClassName="group-data-[collapsible=icon]:hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 text-sidebar-foreground transition-colors duration-150 ease-out hover:bg-sidebar-primary/8 hover:text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              onClick={() => void logout()}
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              <span className="group-data-[collapsible=icon]:hidden">Salir</span>
            </Button>
          </div>

          <SidebarSeparator className="mx-0" />

          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-background px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0">
            <UserAvatar name={user?.name} email={user?.email} size="sm" />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user?.email ?? "..."}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user ? ROLE_LABEL[user.role] : ""}
              </p>
            </div>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          {activeItem && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
                {activeItem.label}
              </h1>
            </>
          )}
        </header>
        <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3 lg:px-10 lg:pb-10 lg:pt-4">
          {isBlocked ? <RouteBlockedNotice href={fallbackHref} /> : children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
