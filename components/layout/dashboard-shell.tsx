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
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/features/auth/types/auth.types";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[]; // sin esto, visible para cualquier rol autenticado
}

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super admin",
  FINANZAS: "Finanzas",
};

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
// SidebarProvider.
function NavList({ navItems }: { navItems: DashboardNavItem[] }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const activeHref = findActiveNavItem(navItems, pathname)?.href;

  return (
    <SidebarMenu>
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = item.href === activeHref;

        return (
          <motion.div
            key={item.href}
            initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03, ease: "easeOut" }}
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.label}
                render={<Link href={item.href} />}
              >
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </motion.div>
        );
      })}
    </SidebarMenu>
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
          <Link
            href={dashboardHref}
            className="flex items-center gap-2 px-2 py-1 font-semibold text-lg text-sidebar-foreground focus:outline-hidden focus:opacity-80 group-data-[collapsible=icon]:justify-center"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Store className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="group-data-[collapsible=icon]:hidden">Xocolatísimo</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavList navItems={visibleNavItems} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
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

          <ThemeToggle className="w-full" labelClassName="group-data-[collapsible=icon]:hidden" />

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void logout()}
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span className="group-data-[collapsible=icon]:hidden">Salir</span>
          </Button>
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
