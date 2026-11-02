"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight, ChevronsUpDown, Lock, type LucideIcon } from "lucide-react";
import { XocolatisimoMark } from "@/components/brand/xocolatisimo-mark";
import { useAuthStore } from "@/store/auth-store";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { usePermissionsRefresh } from "@/features/auth/hooks/use-permissions-refresh";
import { buttonVariants } from "@/components/ui/button";
import { NavSearch } from "@/components/layout/nav-search";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsBell } from "@/features/notifications/components/notifications-bell";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";
import { ChocolateLoader } from "@/design-system/components/chocolate-loader";

/** Ícono de lucide o un componente propio que acepte className (ej. Xoco). */
export type NavIcon = LucideIcon | React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

interface DashboardNavLeafBase {
  label: string;
  icon: NavIcon;
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
  PLANTA: "Planta",
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
  // "/dashboard" (Resumen) solo cuenta exacto: si no, cualquier pantalla sin
  // ítem propio en el menú (ej. Mi perfil) se tomaba como el Resumen y Planta
  // veía "no disponible para tu rol".
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Pantallas fuera del menú lateral que igual llevan título en la barra de arriba.
const EXTRA_TITLES: Record<string, string> = {
  "/dashboard/perfil": "Mi perfil",
};

function findActiveNavItem<T extends { href: string }>(
  items: T[],
  pathname: string,
): T | undefined {
  return [...items]
    .filter((item) => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function canSeeItem(item: DashboardNavLeafBase, user: AuthUser | null): boolean {
  // Un ítem sin `roles` lo ven Admin, Finanzas y Vendedor; PLANTA (despacho)
  // solo ve lo que la nombra explícitamente en `roles`.
  const roleAllowed = item.roles ? !!user && item.roles.includes(user.role) : user?.role !== "PLANTA";
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

// Estilo de las filas (referencia que pidió el usuario: filas compactas de
// 13px, íconos finos, activo con fondo tenue en vez de pill con sombra).
const ROW_CLASS =
  "h-8 gap-2.5 rounded-md px-2.5 text-[13px] font-medium tracking-wide text-foreground/80 transition-colors duration-200 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 data-active:bg-black/5 data-active:font-semibold data-active:text-foreground data-active:shadow-none data-active:hover:bg-black/5 dark:data-active:bg-white/10 dark:data-active:hover:bg-white/10 data-open:bg-transparent data-open:shadow-none [&_svg]:size-4 [&_svg]:stroke-[1.75] [&_svg]:text-foreground/70 data-active:[&_svg]:text-foreground";

const SUB_ROW_CLASS =
  "h-8 gap-2.5 rounded-md px-2.5 text-[13px] font-medium tracking-wide text-foreground/80 transition-colors duration-200 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 data-active:bg-black/5 data-active:font-semibold data-active:text-foreground data-active:hover:bg-black/5 dark:data-active:bg-white/10 dark:data-active:hover:bg-white/10 [&>svg]:size-4 [&>svg]:stroke-[1.75] [&>svg]:text-foreground/70 data-active:[&>svg]:text-foreground";

// Globo con el conteo; con el sidebar colapsado a ícono se reduce a un
// punto en la esquina (el número no cabe en el carril de 3rem).
function NavBadge({ count, label }: { count?: number; label?: string }) {
  if (!count || count <= 0) return null;
  return (
    <>
      <span
        className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/12 px-1.5 text-[10px] font-semibold leading-none text-destructive group-data-[collapsible=icon]:hidden"
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

// En móvil el sidebar es un panel encima de la pantalla: al elegir una opción
// se cierra para mostrar la pantalla elegida.
function useCloseMobileSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  return () => {
    if (isMobile) setOpenMobile(false);
  };
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
  const closeMobile = useCloseMobileSidebar();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.025, ease: "easeOut" }}
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={item.label}
          render={<Link href={item.href} onClick={closeMobile} />}
          className={ROW_CLASS}
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
  const Icon = item.icon;
  const closeMobile = useCloseMobileSidebar();
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={isActive}
        render={<Link href={item.href} onClick={closeMobile} />}
        className={SUB_ROW_CLASS}
      >
        <Icon aria-hidden="true" />
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
      initial={shouldReduceMotion ? false : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.025, ease: "easeOut" }}
    >
      <SidebarMenuItem>
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger
            render={
              <SidebarMenuButton
                tooltip={item.label}
                className={cn(ROW_CLASS, hasActiveChild && "font-semibold text-foreground")}
              />
            }
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
            <NavBadge count={childrenBadge} label={`${childrenBadge} avisos en ${item.label}`} />
            <ChevronRight className={cn("size-3.5! shrink-0 stroke-2! text-foreground/50 transition-transform duration-200 ease-out group-data-[panel-open]/menu-button:rotate-90", childrenBadge > 0 ? "ml-2" : "ml-auto")} />
          </Collapsible.Trigger>
          {/* Base UI expone la altura medida del panel en la variable CSS
              --collapsible-panel-height — sin animar `height` a partir de
              ahí (y sin el overflow-hidden), el submenú aparecía/
              desaparecía de golpe en vez de deslizarse. */}
          <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:h-0 data-[starting-style]:opacity-0">
            <SidebarMenuSub className="mx-0 ml-[17px] mt-0.5 gap-0.5 border-black/5 px-0 pl-1.5 dark:border-white/5">
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
            <SidebarGroupLabel className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
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
  // Submenú al que pertenece la pantalla actual (para la ruta "Inventario / Kardex").
  const activeParent = activeItem
    ? visibleNavItems.find((item) => hasChildren(item) && item.children.some((child) => child.href === activeItem.href))?.label
    : undefined;
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
        <ChocolateLoader size="lg" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-1 p-3 pb-1 group-data-[collapsible=icon]:p-2">
          {/* Bloque de marca, como el "workspace" de la referencia. Con el
              sidebar colapsado a ícono (3rem) solo queda el logo. */}
          <Link
            href={dashboardHref}
            className="group/brand flex min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-black/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring dark:hover:bg-white/5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#3b2216] text-[#f1dcc7] shadow-sm dark:bg-[#E8DCC8] dark:text-[#3b2216]">
                <XocolatisimoMark className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="mb-1 truncate text-[13px] font-medium leading-none text-foreground">Xocolatísimo</span>
                <span className="truncate text-[11px] leading-none text-muted-foreground">
                  {user ? ROLE_LABEL[user.role] : "Panel"}
                </span>
              </span>
            </span>
            <ChevronsUpDown
              className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover/brand:text-foreground/70 group-data-[collapsible=icon]:hidden"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Link>
          <NavSearch items={visibleLeaves} className={ROW_CLASS} />
        </SidebarHeader>

        <SidebarContent className="gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavList navItems={visibleNavItems} />
        </SidebarContent>

        <SidebarFooter className="border-t border-border/50 p-2">
          <UserMenu user={user} homeHref={dashboardHref} onLogout={() => void logout()} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* min-w-0: sin esto, cualquier fila ancha con scroll horizontal (pestañas,
          chips de categorías) estira toda la página y la corta por la derecha. */}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          {(activeItem || EXTRA_TITLES[pathname]) && (
            <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden truncate sm:inline">{activeParent ?? "Xocolatísimo"}</span>
              <span aria-hidden="true" className="hidden sm:inline">/</span>
              <h1 className="truncate font-medium text-foreground">{activeItem?.label ?? EXTRA_TITLES[pathname]}</h1>
            </nav>
          )}
          {/* Tema claro/oscuro: esquina superior derecha. */}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <NotificationsBell />
            <ThemeToggle />
          </div>
        </header>
        <div className="min-w-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3 lg:px-10 lg:pb-10 lg:pt-4">
          {isBlocked ? <RouteBlockedNotice href={fallbackHref} /> : children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
