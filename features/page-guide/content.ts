import {
  Building2,
  CalendarCheck2,
  CalendarClock,
  DollarSign,
  LayoutDashboard,
  ListOrdered,
  KeyRound,
  Package,
  Palette,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { GuideRole, TourStep } from "@/features/inventory-guide/content";

// Contenido de la guía de las secciones de reportes (Ventas, Tráfico,
// Productos, Tickets, Mayoreo y Cierre del mes): el texto breve de la card,
// qué puede y qué no puede hacer cada rol y los pasos del tour guiado.
// Admin y Finanzas comparten casi todo ("staff"); el Vendedor solo ve los
// datos de su tienda. Cada pantalla dice solo lo que le toca al rol.
//
// Los pasos apuntan a la card de encabezado (data-tour="report-header") y a
// los bloques que le siguen: `report-header + *` es el primero, y
// `report-header + * + *` el segundo.

export type ReportPageKey =
  | "resumen"
  | "venta-mensual"
  | "venta-diaria"
  | "formas-de-pago"
  | "visitas"
  | "trafico-tiendas"
  | "trafico-diario"
  | "productos"
  | "categorias"
  | "ventas-mayoreo"
  | "buscar-compradores"
  | "ticket-promedio"
  | "ticket-detallado"
  | "cierre-mes"
  | "admin-inicio"
  | "admin-odoo"
  | "admin-usuarios"
  | "admin-permisos"
  | "admin-diseno";

/** Texto para Admin y Finanzas (`staff`) y, si cambia, para el Vendedor. */
interface RoleText {
  staff: string;
  vendedor?: string;
}

interface RoleList {
  staff?: string[];
  vendedor?: string[];
}

interface ReportGuide {
  title: string;
  icon: LucideIcon;
  /** Quién puede abrir la pantalla (el Admin puede angostarlo en Permisos). */
  roles: GuideRole[];
  /** Frase corta de la card de encabezado. */
  brief: RoleText;
  /** Qué es la pantalla (primer paso del tour y modal). */
  intro: RoleText;
  /** Cómo se elige la tienda: "select" (selector, o todas), "all" (siempre
   * todas las tiendas) o "none" (la pantalla no es por tienda). */
  storeAccess?: "select" | "all" | "none";
  extraCan?: RoleList;
  extraCannot?: RoleList;
  /** Reemplaza por completo las listas Puedes / No puedes (pantallas de
   * Administración, que no son de reportes). */
  permissions?: { can: string[]; cannot: string[] };
  /** Pasos del tour después de la bienvenida. */
  steps: { staff: TourStep[]; vendedor?: TourStep[] };
}

const HEADER = '[data-tour="report-header"]';
const FIRST = `${HEADER} + *`;
const SECOND = `${HEADER} + * + *`;
const THIRD = `${HEADER} + * + * + *`;
const GOAL_CONFIG = '[data-tour="goal-config"]';

const ALL_ROLES: GuideRole[] = ["admin", "finanzas", "vendedor"];
const STAFF_ROLES: GuideRole[] = ["admin", "finanzas"];

const headerStep = (staff: string, vendedor?: string): { staff: TourStep; vendedor: TourStep } => ({
  staff: { target: HEADER, title: "Filtros y exportar", description: staff, side: "bottom" },
  vendedor: { target: HEADER, title: "Filtros y exportar", description: vendedor ?? staff, side: "bottom" },
});

const DATE_STORE_HEADER = headerStep(
  "Elige el rango de fechas y la tienda, o todas las tiendas. Exporta lo que ves a Excel.",
  "Elige el rango de fechas. La tienda es la tuya y no se puede cambiar. Exporta lo que ves a Excel.",
);

const MONTH_STORE_HEADER = headerStep(
  "Cambia de mes con las flechas, elige una tienda o todas, y exporta a Excel.",
  "Cambia de mes con las flechas. La tienda es la tuya y no se puede cambiar. Exporta a Excel.",
);

const GOAL_CONFIG_STEP: TourStep = {
  target: GOAL_CONFIG,
  title: "Configurar %",
  description:
    "Define el porcentaje de crecimiento que se suma al total real del mes anterior para calcular la meta de cada tienda.",
  side: "bottom",
};

const SET_GOAL_CAN = ["Configurar el % de crecimiento con el que se calcula la meta del mes."];
const SEE_GOAL_CANNOT = ["Cambiar las metas: las configuran Admin y Finanzas."];

export const REPORT_GUIDES: Record<ReportPageKey, ReportGuide> = {
  resumen: {
    title: "Resumen",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
    brief: { staff: "Ventas, impuestos y venta promedio del rango.", vendedor: "La venta de tu tienda en el rango elegido." },
    intro: {
      staff:
        "Resumen de la venta de Odoo en el rango de fechas: ingresos, impuestos, ingresos netos y venta promedio, más la venta día por día.",
      vendedor:
        "Resumen de la venta de tu tienda en el rango de fechas: ingresos, impuestos, ingresos netos y venta promedio, más la venta día por día.",
    },
    steps: {
      staff: [
        DATE_STORE_HEADER.staff,
        { target: FIRST, title: "Cifras del rango", description: "Ingresos totales, impuestos (IVA), ingresos netos y venta promedio por orden.", side: "bottom" },
        { target: SECOND, title: "Ventas por día", description: "Los ingresos brutos de cada día del rango. Pasa el cursor por un punto para ver el valor exacto.", side: "top" },
      ],
      vendedor: [
        DATE_STORE_HEADER.vendedor,
        { target: FIRST, title: "Cifras de tu tienda", description: "Ingresos totales, impuestos (IVA), ingresos netos y venta promedio por orden de tu tienda.", side: "bottom" },
        { target: SECOND, title: "Ventas por día", description: "Los ingresos brutos de cada día del rango. Pasa el cursor por un punto para ver el valor exacto.", side: "top" },
      ],
    },
  },

  "venta-mensual": {
    title: "Venta mensual",
    icon: DollarSign,
    roles: STAFF_ROLES,
    storeAccess: "all",
    brief: { staff: "Meta de venta del mes y avance por tienda." },
    intro: {
      staff:
        "Compara la venta real del mes contra su meta, tienda por tienda. La meta parte del total real del mes anterior más un porcentaje de crecimiento.",
    },
    extraCan: { staff: SET_GOAL_CAN },
    steps: {
      staff: [
        headerStep("Cambia de mes con las flechas, configura el porcentaje y exporta a Excel.").staff,
        GOAL_CONFIG_STEP,
        { target: FIRST, title: "Avance por tienda", description: "Venta real del mes, meta, alcance (%) y valor pendiente de cada tienda. La última fila es el total.", side: "top" },
      ],
    },
  },

  "venta-diaria": {
    title: "Venta diaria",
    icon: CalendarClock,
    roles: ALL_ROLES,
    brief: { staff: "Venta por día del mes y los dos anteriores.", vendedor: "Tu venta por día, mes contra mes." },
    intro: {
      staff: "Venta en dólares día por día: el mes elegido contra los dos meses anteriores, con su avance contra la meta del mes.",
      vendedor: "Venta en dólares de tu tienda día por día: el mes elegido contra los dos meses anteriores, con su avance contra la meta del mes.",
    },
    extraCannot: { vendedor: SEE_GOAL_CANNOT },
    steps: {
      staff: [
        MONTH_STORE_HEADER.staff,
        { target: FIRST, title: "Avance del mes", description: "Venta a la fecha, meta del mes y alcance de la meta, de la tienda elegida o de todas.", side: "bottom" },
        { target: SECOND, title: "Mes contra mes", description: "La venta de cada día del mes elegido junto a la de los dos meses anteriores.", side: "top" },
      ],
      vendedor: [
        MONTH_STORE_HEADER.vendedor,
        { target: FIRST, title: "Avance de tu tienda", description: "Venta a la fecha, meta del mes y alcance de la meta de tu tienda.", side: "bottom" },
        { target: SECOND, title: "Mes contra mes", description: "La venta de cada día del mes elegido junto a la de los dos meses anteriores.", side: "top" },
      ],
    },
  },

  "formas-de-pago": {
    title: "Formas de pago",
    icon: Wallet,
    roles: ALL_ROLES,
    brief: { staff: "Cómo pagan los clientes.", vendedor: "Cómo pagan los clientes de tu tienda." },
    intro: {
      staff: "Venta por forma de pago (efectivo y otros medios) en el rango de fechas, con el detalle por método.",
      vendedor: "Venta de tu tienda por forma de pago (efectivo y otros medios) en el rango de fechas, con el detalle por método.",
    },
    steps: {
      staff: [
        DATE_STORE_HEADER.staff,
        { target: FIRST, title: "Efectivo y otros medios", description: "Cuánto se cobró en efectivo, cuánto con otros medios y el total.", side: "bottom" },
        { target: SECOND, title: "Por método de pago", description: "Gráfica de la venta por cada método. Abajo, el detalle con montos.", side: "top" },
      ],
      vendedor: [
        DATE_STORE_HEADER.vendedor,
        { target: FIRST, title: "Efectivo y otros medios", description: "Cuánto se cobró en tu tienda en efectivo, cuánto con otros medios y el total.", side: "bottom" },
        { target: SECOND, title: "Por método de pago", description: "Gráfica de la venta por cada método. Abajo, el detalle con montos.", side: "top" },
      ],
    },
  },

  visitas: {
    title: "Visitas",
    icon: Users,
    roles: ALL_ROLES,
    brief: { staff: "Visitas (órdenes) por día.", vendedor: "Visitas a tu tienda por día." },
    intro: {
      staff: "Las visitas son las órdenes del día: sirven como medida del tráfico de la tienda en el rango de fechas.",
      vendedor: "Las visitas son las órdenes del día en tu tienda: sirven como medida de su tráfico en el rango de fechas.",
    },
    steps: {
      staff: [
        DATE_STORE_HEADER.staff,
        { target: FIRST, title: "Cifras del rango", description: "Visitas totales y órdenes promedio por día.", side: "bottom" },
        { target: SECOND, title: "Visitas por día", description: "La cantidad de órdenes de cada día del rango.", side: "top" },
      ],
      vendedor: [
        DATE_STORE_HEADER.vendedor,
        { target: FIRST, title: "Cifras de tu tienda", description: "Visitas totales y órdenes promedio por día de tu tienda.", side: "bottom" },
        { target: SECOND, title: "Visitas por día", description: "La cantidad de órdenes de cada día del rango.", side: "top" },
      ],
    },
  },

  "trafico-tiendas": {
    title: "Tráfico de tiendas",
    icon: Store,
    roles: STAFF_ROLES,
    storeAccess: "all",
    brief: { staff: "Meta de tráfico y avance por tienda." },
    intro: {
      staff:
        "Compara el tráfico (órdenes) real del mes contra su meta, tienda por tienda, con la proyección de cierre. La meta parte del total real del mes anterior más un porcentaje.",
    },
    extraCan: { staff: SET_GOAL_CAN },
    steps: {
      staff: [
        headerStep("Cambia de mes con las flechas, configura el porcentaje y exporta a Excel.").staff,
        GOAL_CONFIG_STEP,
        { target: FIRST, title: "Avance por tienda", description: "Órdenes reales del mes, meta, alcance (%) y proyección de cierre de cada tienda.", side: "top" },
      ],
    },
  },

  "trafico-diario": {
    title: "Tráfico diario",
    icon: TrendingUp,
    roles: ALL_ROLES,
    brief: { staff: "Órdenes por día del mes y los dos anteriores.", vendedor: "El tráfico de tu tienda por día." },
    intro: {
      staff: "Órdenes día por día: el mes elegido contra los dos meses anteriores, con su avance contra la meta de tráfico.",
      vendedor: "Órdenes de tu tienda día por día: el mes elegido contra los dos meses anteriores, con su avance contra la meta de tráfico.",
    },
    extraCannot: { vendedor: SEE_GOAL_CANNOT },
    steps: {
      staff: [
        MONTH_STORE_HEADER.staff,
        { target: FIRST, title: "Avance del mes", description: "Visitas a la fecha, meta del mes y alcance de la meta, de la tienda elegida o de todas.", side: "bottom" },
        { target: SECOND, title: "Mes contra mes", description: "Las órdenes de cada día del mes elegido junto a las de los dos meses anteriores.", side: "top" },
      ],
      vendedor: [
        MONTH_STORE_HEADER.vendedor,
        { target: FIRST, title: "Avance de tu tienda", description: "Visitas a la fecha, meta del mes y alcance de la meta de tu tienda.", side: "bottom" },
        { target: SECOND, title: "Mes contra mes", description: "Las órdenes de cada día del mes elegido junto a las de los dos meses anteriores.", side: "top" },
      ],
    },
  },

  productos: {
    title: "Mejores productos",
    icon: Package,
    roles: ALL_ROLES,
    brief: { staff: "Productos más y menos vendidos.", vendedor: "Los productos que más y menos se venden en tu tienda." },
    intro: {
      staff: "Rankings de productos por unidades y por Kg (a granel) en el rango de fechas, más la comparación del mes en curso contra el anterior.",
      vendedor: "Rankings de los productos de tu tienda por unidades y por Kg (a granel) en el rango de fechas, más la comparación del mes en curso contra el anterior.",
    },
    steps: {
      staff: [
        DATE_STORE_HEADER.staff,
        { target: FIRST, title: "Comparación mensual", description: "Cada producto del mes en curso contra el mes anterior.", side: "top" },
        { target: SECOND, title: "Cuántos productos ver", description: "Cada gráfica tiene su campo de cantidad: cámbialo para ver más o menos productos.", side: "top" },
        { target: THIRD, title: "Rankings", description: "Más y menos vendidos por unidades y, más abajo, los de a granel por Kg.", side: "top" },
      ],
      vendedor: [
        DATE_STORE_HEADER.vendedor,
        { target: FIRST, title: "Comparación mensual", description: "Cada producto de tu tienda en el mes en curso contra el mes anterior.", side: "top" },
        { target: SECOND, title: "Cuántos productos ver", description: "Cada gráfica tiene su campo de cantidad: cámbialo para ver más o menos productos.", side: "top" },
        { target: THIRD, title: "Rankings", description: "Más y menos vendidos por unidades y, más abajo, los de a granel por Kg.", side: "top" },
      ],
    },
  },

  categorias: {
    title: "Categorías",
    icon: Tags,
    roles: ALL_ROLES,
    brief: { staff: "Top de productos por categoría.", vendedor: "Top de productos por categoría en tu tienda." },
    intro: {
      staff: "Las categorías ordenadas por venta total y, dentro de cada una, sus productos más vendidos por dinero o por unidad.",
      vendedor: "Las categorías de tu tienda ordenadas por venta total y, dentro de cada una, sus productos más vendidos por dinero o por unidad.",
    },
    steps: {
      staff: [
        DATE_STORE_HEADER.staff,
        { target: FIRST, title: "Cómo ordenar", description: "Cambia entre \"Por dinero\" y \"Por unidad\", y cuántos productos mostrar por categoría.", side: "bottom" },
        { target: SECOND, title: "Una gráfica por categoría", description: "Los productos más vendidos de cada categoría, de la que más vende a la que menos.", side: "top" },
      ],
      vendedor: [
        DATE_STORE_HEADER.vendedor,
        { target: FIRST, title: "Cómo ordenar", description: "Cambia entre \"Por dinero\" y \"Por unidad\", y cuántos productos mostrar por categoría.", side: "bottom" },
        { target: SECOND, title: "Una gráfica por categoría", description: "Los productos más vendidos de cada categoría de tu tienda, de la que más vende a la que menos.", side: "top" },
      ],
    },
  },

  "ventas-mayoreo": {
    title: "Ventas mayoreo",
    icon: Building2,
    roles: STAFF_ROLES,
    storeAccess: "none",
    brief: { staff: "Meta de venta por cliente de mayoreo." },
    intro: {
      staff: "Compara la venta real del mes de cada cliente de mayoreo contra su meta. La meta parte del total real del mes anterior más un porcentaje.",
    },
    extraCan: { staff: SET_GOAL_CAN },
    steps: {
      staff: [
        headerStep("Cambia de mes con las flechas, configura el porcentaje y exporta a Excel.").staff,
        GOAL_CONFIG_STEP,
        { target: FIRST, title: "Avance por cliente", description: "Venta real del mes, meta, alcance (%) y valor pendiente de cada cliente de mayoreo.", side: "top" },
      ],
    },
  },

  "buscar-compradores": {
    title: "Buscar compradores",
    icon: Search,
    roles: STAFF_ROLES,
    storeAccess: "none",
    brief: { staff: "Encuentra a un cliente y lo que compró." },
    intro: {
      staff: "Busca por nombre a cualquier cliente con facturas en el rango de fechas, no solo a los de mayoreo fijos.",
    },
    steps: {
      staff: [
        headerStep("Escribe al menos 3 letras del nombre del cliente, elige el rango de fechas y exporta los resultados a Excel.").staff,
        { target: FIRST, title: "Resultados", description: "Comprador, cliente (empresa matriz), cantidad de facturas e ingresos del rango.", side: "top" },
      ],
    },
  },

  "ticket-promedio": {
    title: "Ticket promedio",
    icon: Receipt,
    roles: STAFF_ROLES,
    storeAccess: "all",
    brief: { staff: "Meta de ticket promedio por tienda." },
    intro: {
      staff: "Compara el ticket promedio real del mes contra su meta, tienda por tienda. La meta parte del mes anterior más un porcentaje de crecimiento.",
    },
    extraCan: { staff: SET_GOAL_CAN },
    steps: {
      staff: [
        headerStep("Cambia de mes con las flechas, configura el porcentaje y exporta a Excel.").staff,
        GOAL_CONFIG_STEP,
        { target: FIRST, title: "Avance por tienda", description: "Ticket promedio real del mes, meta y diferencia de cada tienda.", side: "top" },
      ],
    },
  },

  "ticket-detallado": {
    title: "Ticket detallado",
    icon: ListOrdered,
    roles: ALL_ROLES,
    brief: { staff: "Ticket promedio por día.", vendedor: "El ticket promedio de tu tienda por día." },
    intro: {
      staff: "Ticket promedio día por día: el mes elegido contra los dos meses anteriores, con su avance contra la meta del mes.",
      vendedor: "Ticket promedio de tu tienda día por día: el mes elegido contra los dos meses anteriores, con su avance contra la meta del mes.",
    },
    extraCannot: { vendedor: SEE_GOAL_CANNOT },
    steps: {
      staff: [
        MONTH_STORE_HEADER.staff,
        { target: FIRST, title: "Avance del mes", description: "Ticket promedio a la fecha, meta del mes y alcance de la meta, de la tienda elegida o de todas.", side: "bottom" },
        { target: SECOND, title: "Mes contra mes", description: "El ticket promedio de cada día del mes elegido junto al de los dos meses anteriores.", side: "top" },
      ],
      vendedor: [
        MONTH_STORE_HEADER.vendedor,
        { target: FIRST, title: "Avance de tu tienda", description: "Ticket promedio a la fecha, meta del mes y alcance de la meta de tu tienda.", side: "bottom" },
        { target: SECOND, title: "Mes contra mes", description: "El ticket promedio de cada día del mes elegido junto al de los dos meses anteriores.", side: "top" },
      ],
    },
  },

  "cierre-mes": {
    title: "Cierre del mes",
    icon: CalendarCheck2,
    roles: STAFF_ROLES,
    storeAccess: "all",
    brief: { staff: "El mes contra el anterior, con metas." },
    intro: {
      staff: "Cierre del mes contra el mes anterior, con la meta y el alcance de Tráfico de tiendas, Venta mensual y Ticket promedio.",
    },
    steps: {
      staff: [
        headerStep("Cambia de mes con las flechas y exporta el cierre a Excel.").staff,
        { target: FIRST, title: "Tráfico, venta y ticket", description: "Una tabla por tema: el mes anterior, el mes del cierre, el crecimiento, la meta y el alcance.", side: "top" },
      ],
    },
  },

  // ── Administración (solo Admin) ──

  "admin-inicio": {
    title: "Administración",
    icon: Settings,
    roles: ["admin"],
    brief: { staff: "Configuración exclusiva del Admin." },
    intro: {
      staff:
        "Desde aquí administras la conexión con Odoo, las cuentas del panel, los permisos de cada rol, la visibilidad de Inventario por tienda y el catálogo de diseño.",
    },
    permissions: {
      can: [
        "Entrar a cada configuración desde su tarjeta.",
        "Cambiar la conexión con Odoo, las cuentas y los permisos de todo el panel.",
      ],
      cannot: ["Delegar esta sección: Finanzas y Vendedor no la ven."],
    },
    steps: {
      staff: [
        { target: FIRST, title: "Configuraciones", description: "Cada tarjeta lleva a una configuración: Odoo, Usuarios, Permisos, Inventario por tienda y Sistema de diseño.", side: "top" },
      ],
    },
  },

  "admin-odoo": {
    title: "Integración con Odoo",
    icon: KeyRound,
    roles: ["admin"],
    brief: { staff: "API key y duración de la conexión." },
    intro: {
      staff:
        "Odoo es la fuente de las ventas del panel. Aquí ves el estado de la API key y la rotas cuando vence o cambia; sin una key vigente el panel no puede traer datos.",
    },
    permissions: {
      can: ["Ver el estado de la API key: enmascarada, uid, duración y fecha de expiración.", "Registrar o rotar la API key."],
      cannot: ["Ver la key completa: solo se muestra enmascarada."],
    },
    steps: {
      staff: [
        { target: FIRST, title: "Estado actual", description: "La key enmascarada, el uid de Odoo, la duración y cuándo expira. Si ya venció se marca como vencida.", side: "bottom" },
        { target: SECOND, title: "Rotar la API key", description: "Pega la key nueva, el uid del usuario de Odoo dueño de esa key y cuántos días dura. Reemplaza a la activa.", side: "top" },
      ],
    },
  },

  "admin-usuarios": {
    title: "Usuarios",
    icon: Users,
    roles: ["admin"],
    brief: { staff: "Quién tiene acceso al panel." },
    intro: {
      staff: "Crea cuentas, asigna su rol y actívalas o desactívalas. No hay registro público: toda cuenta se crea desde aquí.",
    },
    permissions: {
      can: [
        "Agregar usuarios y asignarles rol (Admin, Finanzas o Vendedor).",
        "Editar el rol de una cuenta y cambiar su contraseña.",
        "Activar o desactivar el acceso de una cuenta.",
      ],
      cannot: ["Desactivar tu propia cuenta."],
    },
    steps: {
      staff: [
        { target: HEADER, title: "Agregar usuario", description: "Crea una cuenta nueva con su correo, contraseña y rol. Un Vendedor queda atado a su tienda.", side: "bottom" },
        { target: FIRST, title: "Cuentas existentes", description: "Cada cuenta con su rol y estado. Edita, cambia la contraseña o usa el interruptor para activar o desactivar el acceso.", side: "top" },
      ],
    },
  },

  "admin-permisos": {
    title: "Permisos",
    icon: ShieldCheck,
    roles: ["admin"],
    brief: { staff: "Qué secciones ve cada rol." },
    intro: {
      staff: "Habilita o deshabilita, por rol, qué módulos del dashboard ve cada quien. El cambio aplica de inmediato en el menú y en la API.",
    },
    permissions: {
      can: ["Elegir un rol y encender o apagar sus módulos.", "Ver qué módulos comparten el mismo dato en el servidor."],
      cannot: ["Dar a un rol más de lo que le permite su techo original: solo se puede quitar, no ampliar."],
    },
    steps: {
      staff: [
        { target: HEADER, title: "Elige el rol", description: "Cada rol tiene su propia lista. Cambia de rol con el selector.", side: "bottom" },
        { target: FIRST, title: "Módulos del rol", description: "Los módulos están agrupados como el menú. Cada interruptor pide confirmación y aplica al instante.", side: "top" },
      ],
    },
  },

  "admin-diseno": {
    title: "Sistema de diseño",
    icon: Palette,
    roles: ["admin"],
    brief: { staff: "Botones, badges, cards y tablas del panel." },
    intro: {
      staff: "Catálogo en vivo de los componentes del panel, con ejemplos. Todo componente nuevo se agrega aquí.",
    },
    permissions: {
      can: ["Ver cada componente con su ejemplo."],
      cannot: ["Cambiar el diseño desde aquí: se cambia en el código (carpeta design-system)."],
    },
    steps: {
      staff: [
        { target: FIRST, title: "Botones", description: "Primary, secondary, outline, destructive y agregar: cuándo usar cada uno.", side: "top" },
        { target: SECOND, title: "Badges", description: "Estados, roles y tonos de información.", side: "top" },
      ],
    },
  },
};

// ── Resolución por rol ────────────────────────────────────────────────────

const isStaff = (role: GuideRole) => role === "admin" || role === "finanzas";

function pick<T>(role: GuideRole, value: { staff: T; vendedor?: T }): T {
  return role === "vendedor" ? (value.vendedor ?? value.staff) : value.staff;
}

/** Frase corta de la card de encabezado según el rol. */
export function briefFor(page: ReportPageKey, role: GuideRole): string {
  return pick(role, REPORT_GUIDES[page].brief);
}

/** ¿El rol puede abrir esta pantalla? Si no, no se le muestra guía. */
export function canOpen(page: ReportPageKey, role: GuideRole): boolean {
  return REPORT_GUIDES[page].roles.includes(role);
}

/** Pasos del tour del rol: bienvenida con la descripción de la pantalla y los
 * pasos de la pantalla (los que solo existen en la vista del Vendedor ya
 * vienen resueltos). */
export function tourStepsFor(page: ReportPageKey, role: GuideRole): TourStep[] {
  const guide = REPORT_GUIDES[page];
  return [{ title: guide.title, description: pick(role, guide.intro) }, ...pick(role, guide.steps)];
}

/** Lo que el rol puede y no puede hacer en la pantalla. */
export function permissionsFor(page: ReportPageKey, role: GuideRole): { can: string[]; cannot: string[] } {
  const guide = REPORT_GUIDES[page];
  if (guide.permissions) return guide.permissions;
  const extraCan = (isStaff(role) ? guide.extraCan?.staff : guide.extraCan?.vendedor) ?? [];
  const extraCannot = (isStaff(role) ? guide.extraCannot?.staff : guide.extraCannot?.vendedor) ?? [];

  if (role === "vendedor") {
    return {
      can: ["Ver los datos de tu tienda.", ...extraCan, "Exportar lo que ves a Excel."],
      cannot: ["Ver otras tiendas: tu tienda queda fija.", ...extraCannot],
    };
  }
  const storeCan =
    guide.storeAccess === "none"
      ? []
      : guide.storeAccess === "all"
        ? ["Ver todas las tiendas a la vez."]
        : ["Elegir una tienda o ver todas."];
  const can = [...storeCan, ...extraCan, "Exportar lo que ves a Excel."];
  if (role === "admin") {
    return { can: [...can, "Decidir qué roles ven esta sección (Administración → Permisos)."], cannot: extraCannot };
  }
  return { can, cannot: ["Cambiar qué roles ven cada sección: lo decide el Admin.", ...extraCannot] };
}

