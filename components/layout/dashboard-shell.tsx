"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, LogOut, Store, type LucideIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
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
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/features/auth/types/auth.types";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Sección del sidebar donde cae el ítem — ver GROUP_ORDER más abajo. */
  group: string;
  roles?: UserRole[]; // sin esto, visible para cualquier rol autenticado
}

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
};

// Orden fijo de las secciones del sidebar, independiente del orden en que
// vengan los items en NAV_ITEMS. Un grupo sin ítems visibles (ej.
// "Sistema" para un usuario FINANZAS, que no tiene ningún item con ese
// group) simplemente no se renderiza — nunca aparece un título de sección
// vacío.
const GROUP_ORDER = ["General", "Reportes", "Sistema"];

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

// Mismo sidebar de shadcn/ui que usa ecoguide-app (components/ui/sidebar.tsx):
// en móvil se renderiza como <Sheet> (drawer deslizable), en escritorio
// como panel fijo colapsable a modo ícono. El estado lo maneja el propio
// SidebarProvider. El estilo (panel gris + pill blanco/teal para el activo,
// secciones agrupadas) sigue una referencia visual que pidió el usuario —
// ver plan-history.
function NavList({ navItems }: { navItems: DashboardNavItem[] }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const activeHref = findActiveNavItem(navItems, pathname)?.href;

  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: navItems.filter((item) => item.group === group),
  })).filter(({ items }) => items.length > 0);

  return (
    <>
      {groups.map(({ group, items }) => (
        <SidebarGroup key={group}>
          <SidebarGroupLabel className="uppercase tracking-wide text-[11px]">
            {group}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === activeHref;
                const globalIndex = navItems.indexOf(item);

                return (
                  <motion.div
                    key={item.href}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: globalIndex * 0.03, ease: "easeOut" }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                        className="h-11 gap-3 rounded-xl px-3 text-[15px] [&_svg]:size-[18px] data-active:shadow-xs"
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}
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

export function DashboardShell({ navItems, dashboardHref, children }: DashboardShellProps) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const pathname = usePathname();

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );
  const activeItem = findActiveNavItem(visibleNavItems, pathname);

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
          <div className="flex items-center justify-between gap-2">
            <Link
              href={dashboardHref}
              className="flex min-w-0 items-center gap-2 px-2 py-1 font-semibold text-lg text-sidebar-foreground focus:outline-hidden focus:opacity-80 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
                <Store className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate text-sidebar-primary group-data-[collapsible=icon]:hidden">
                Xocolatísimo
              </span>
            </Link>
            {/* Colapsa a modo ícono desde dentro del propio sidebar (estilo
                de la referencia). Solo en escritorio: en móvil el drawer se
                cierra tocando el fondo, y este botón no cabría en modo
                ícono (3rem de ancho) — para volver a expandir ahí está el
                trigger del topbar, siempre visible. */}
            <SidebarTrigger className="mr-1 hidden shrink-0 rounded-lg border border-sidebar-border bg-background shadow-xs hover:bg-sidebar-accent md:flex group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <NavList navItems={visibleNavItems} />
        </SidebarContent>

        <SidebarFooter className="gap-2">
          <div className="flex flex-col gap-1">
            <ThemeToggle
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              labelClassName="group-data-[collapsible=icon]:hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
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
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
