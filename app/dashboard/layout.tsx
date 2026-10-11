"use client";

import { Building2, CalendarCheck2, CalendarClock, ClipboardList, DollarSign, LayoutDashboard, ListOrdered, Package, PackageMinus, Receipt, Search, Settings, Store, Tags, TrendingUp, Users, Wallet, Warehouse } from "lucide-react";
import { useMemo } from "react";
import { DashboardShell, type DashboardNavItem } from "@/components/layout/dashboard-shell";
import { useMovementNotifications } from "@/features/inventory-movements/hooks/use-movement-notifications";
import { useAuthStore } from "@/store/auth-store";

// Todos los reportes viven en un solo bloque sin título (el usuario pidió
// quitar las secciones "General" y "Reportes"); solo "Sistema" conserva
// encabezado porque separa el panel de datos de la administración.
//
// Los ítems relacionados van agrupados en submenús colapsables (`children`)
// en vez de listarse sueltos: cada submenú es un "tipo" de dato — Productos
// (ranking + categorías), Tráfico (visitas = tráfico de la tienda), Ventas
// (mensual/diaria y su desglose por medio de pago), Mayoreo (venta a granel
// y quién compra) y Tickets. "Cierre del mes" queda como ítem directo porque
// no comparte tipo con ninguno.
const NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Productos",
    icon: Package,
    group: "",
    children: [
      { label: "Mejores productos", href: "/dashboard/productos", icon: Package, moduleKey: "dashboard.productos" },
      { label: "Categorías", href: "/dashboard/categorias", icon: Tags, moduleKey: "dashboard.categorias" },
    ],
  },
  {
    label: "Tráfico",
    icon: Users,
    group: "",
    children: [
      { label: "Visitas", href: "/dashboard/visitas", icon: Users, moduleKey: "dashboard.visitas" },
      { label: "Tráfico de tiendas", href: "/dashboard/trafico-tiendas", icon: Store, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.trafico-tiendas" },
      { label: "Tráfico diario", href: "/dashboard/trafico-diario", icon: TrendingUp, moduleKey: "dashboard.trafico-diario" },
    ],
  },
  {
    label: "Ventas",
    icon: DollarSign,
    group: "",
    children: [
      { label: "Resumen", href: "/dashboard", icon: LayoutDashboard, moduleKey: "dashboard.resumen" },
      { label: "Venta mensual", href: "/dashboard/venta-mensual", icon: DollarSign, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.venta-mensual" },
      { label: "Venta diaria", href: "/dashboard/venta-diaria", icon: CalendarClock, moduleKey: "dashboard.venta-diaria" },
      { label: "Formas de pago", href: "/dashboard/efectivo-otros-medios", icon: Wallet, moduleKey: "dashboard.efectivo-otros-medios" },
    ],
  },
  {
    label: "Mayoreo",
    icon: Building2,
    group: "",
    children: [
      { label: "Ventas mayoreo", href: "/dashboard/ventas-mayoreo", icon: Building2, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.ventas-mayoreo" },
      { label: "Buscar compradores", href: "/dashboard/buscar-compradores", icon: Search, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.buscar-compradores" },
    ],
  },
  {
    label: "Tickets",
    icon: Receipt,
    group: "",
    children: [
      { label: "Ticket promedio", href: "/dashboard/ticket-promedio", icon: Receipt, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.ticket-promedio" },
      { label: "Ticket detallado", href: "/dashboard/ticket-detallado", icon: ListOrdered, moduleKey: "dashboard.ticket-detallado" },
    ],
  },
  { label: "Cierre del mes", href: "/dashboard/cierre-mes", icon: CalendarCheck2, group: "", roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.cierre-mes" },

  // Submenú Inventario (ver plan-history): tres pantallas separadas.
  // - Conteo: captura centralizada de Finanzas del inventario físico —
  //   Vendedor no entra (roles es un techo real, el controller también usa
  //   @Roles(SUPER_ADMIN, FINANZAS)); moduleKey permite a SUPER_ADMIN
  //   apagárselo a Finanzas desde Permisos (mismo patrón que "Cierre del mes").
  // - Movimientos: merma, regalías, degustaciones y entradas planta→tienda.
  //   SÍ entra Vendedor: registra/recibe de su propia tienda (forzado en el
  //   servidor vía assertOwnStoreOrThrow); solo Admin/Finanzas confirma o
  //   rechaza.
  // - Registro: línea de tiempo de entradas y salidas con fecha y hora.
  //   Comparte moduleKey con Conteo (misma lectura de inventario, mismo
  //   techo de rol en el backend).
  {
    label: "Inventario",
    icon: Warehouse,
    group: "",
    children: [
      { label: "Conteo", href: "/dashboard/inventario", icon: Warehouse, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.inventario" },
      { label: "Movimientos", href: "/dashboard/inventario/movimientos", icon: PackageMinus, roles: ["SUPER_ADMIN", "FINANZAS", "VENDEDOR"], moduleKey: "dashboard.inventario-movimientos" },
      { label: "Registro", href: "/dashboard/inventario/registro", icon: ClipboardList, roles: ["SUPER_ADMIN", "FINANZAS"], moduleKey: "dashboard.inventario" },
    ],
  },

  { label: "Administración", href: "/dashboard/admin", icon: Settings, group: "Sistema", roles: ["SUPER_ADMIN"] },
];

// Texto del globo de Movimientos según el rol: Admin/Finanzas ven lo que
// falta por confirmar; el Vendedor, envíos por recibir y lo ya resuelto.
function movementsBadgeLabel(
  role: string | undefined,
  data: { toResolve: number; toReceive: number; resolvedUnseen: number },
): string {
  if (role === "VENDEDOR") {
    const parts: string[] = [];
    if (data.toReceive > 0) parts.push(`${data.toReceive} por recibir`);
    if (data.resolvedUnseen > 0) parts.push(`${data.resolvedUnseen} resuelto${data.resolvedUnseen === 1 ? "" : "s"}`);
    return parts.join(" · ");
  }
  return `${data.toResolve} por confirmar`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const { data: notifications } = useMovementNotifications();

  // Mismo NAV_ITEMS, solo con el globo de Movimientos inyectado — se
  // recalcula únicamente cuando cambian los contadores o el rol.
  const navItems = useMemo<DashboardNavItem[]>(() => {
    const total = notifications?.total ?? 0;
    if (!notifications || total === 0) return NAV_ITEMS;
    const label = movementsBadgeLabel(role, notifications);
    return NAV_ITEMS.map((item) =>
      "children" in item
        ? {
            ...item,
            children: item.children.map((child) =>
              child.moduleKey === "dashboard.inventario-movimientos" ? { ...child, badge: total, badgeLabel: label } : child,
            ),
          }
        : item,
    );
  }, [notifications, role]);

  return (
    <DashboardShell navItems={navItems} dashboardHref="/dashboard">
      {children}
    </DashboardShell>
  );
}
