import type { ModuleKey } from "../types/permissions.types";

export type PreviewKind = "kpis" | "chart" | "table" | "ranking";

export interface ModuleInfo {
  /** Ruta real de la pantalla (para abrirla en otra pestaña). */
  href: string;
  /** Grupo del menú donde aparece. */
  group: string;
  /** Qué es la pantalla, en una frase. */
  summary: string;
  /** Lo que verá quien tenga acceso. */
  contents: string[];
  /** Forma de la vista previa ilustrativa. */
  preview: PreviewKind;
  /** Pantallas del menú que controla este interruptor, cuando son varias. */
  includes?: string[];
  /** Aclaración propia del módulo (por qué van juntas, requisitos). */
  note?: string;
  /** Aclaración solo para el Vendedor. */
  vendedorNote?: string;
}

// Información de cada módulo para el panel de Permisos: sirve para que el
// Super admin sepa qué pantalla está dando o quitando. El texto es una guía
// corta; la pantalla real se abre con el botón "Ver pantalla real".
export const MODULE_INFO: Record<ModuleKey, ModuleInfo> = {
  "dashboard.resumen": {
    href: "/dashboard",
    group: "Ventas",
    summary: "El panorama del período: venta, visitas y ticket de las tiendas.",
    contents: ["Venta, visitas y ticket del período.", "Comparación con el período anterior.", "Filtros de fecha y tienda, y exportar a Excel."],
    preview: "kpis",
  },
  "dashboard.visitas": {
    href: "/dashboard/visitas",
    group: "Tráfico",
    summary: "Cuántas personas visitaron las tiendas, por día y por tienda.",
    contents: ["Visitas por día y por tienda.", "Gráfica del período elegido.", "Filtros de fecha y tienda, y exportar a Excel."],
    preview: "chart",
  },
  "dashboard.trafico-diario": {
    href: "/dashboard/trafico-diario",
    group: "Tráfico",
    summary: "Las visitas día a día contra la meta del mes.",
    contents: ["Visitas de cada día del mes.", "Comparación contra la meta mensual.", "Exportar a Excel."],
    preview: "chart",
  },
  "dashboard.trafico-tiendas": {
    href: "/dashboard/trafico-tiendas",
    group: "Tráfico",
    summary: "Visitas por tienda y su crecimiento contra el mes anterior.",
    contents: ["Visitas por tienda y por mes.", "Meta del mes y cuánto falta.", "Configurar el % de crecimiento (solo Admin y Finanzas)."],
    preview: "table",
  },
  "dashboard.venta-diaria": {
    href: "/dashboard/venta-diaria",
    group: "Ventas",
    summary: "La venta de cada día contra la meta del mes.",
    contents: ["Venta de cada día del mes.", "Comparación contra la meta mensual.", "Exportar a Excel."],
    preview: "chart",
  },
  "dashboard.venta-mensual": {
    href: "/dashboard/venta-mensual",
    group: "Ventas",
    summary: "La venta por mes y por tienda, con sus metas.",
    contents: ["Venta mensual por tienda.", "Meta del mes, lo que falta y el alcance.", "Configurar el % de crecimiento."],
    preview: "table",
  },
  "dashboard.efectivo-otros-medios": {
    href: "/dashboard/efectivo-otros-medios",
    group: "Ventas",
    summary: "La venta por forma de pago: efectivo, tarjeta y otros medios.",
    contents: ["Total por forma de pago.", "Gráfica de la proporción de cada una.", "Filtros de fecha y tienda, y exportar a Excel."],
    preview: "kpis",
  },
  "dashboard.ventas-mayoreo": {
    href: "/dashboard/ventas-mayoreo",
    group: "Mayoreo",
    summary: "Las ventas y metas de los clientes mayoristas.",
    contents: ["Venta por cliente y por mes.", "Desglose por comprador y sucursal.", "Metas y valor pendiente."],
    preview: "table",
  },
  "dashboard.buscar-compradores": {
    href: "/dashboard/buscar-compradores",
    group: "Mayoreo",
    summary: "Busca las compras de un comprador o cliente en particular.",
    contents: ["Buscador de compradores.", "Sus compras con fecha y monto.", "Exportar a Excel."],
    preview: "table",
  },
  "dashboard.ticket-promedio": {
    href: "/dashboard/ticket-promedio",
    group: "Tickets",
    summary: "El ticket promedio por tienda y por mes contra su meta.",
    contents: ["Ticket promedio por tienda y mes.", "Meta y diferencia.", "Configurar el % de crecimiento."],
    preview: "table",
  },
  "dashboard.ticket-detallado": {
    href: "/dashboard/ticket-detallado",
    group: "Tickets",
    summary: "Los tickets del período, uno por uno.",
    contents: ["Ticket promedio de cada día.", "Gráfica contra la meta.", "Exportar a Excel."],
    preview: "chart",
  },
  "dashboard.ordenes": {
    href: "/dashboard/ordenes",
    group: "Tickets",
    summary: "Cada orden de caja con lo que se compró y cómo se pagó.",
    contents: ["Órdenes por fecha y tienda, con búsqueda.", "Detalle de cada orden: productos, impuestos y pagos.", "Totales del período y exportar a Excel."],
    preview: "table",
    vendedorNote: "El Vendedor solo ve las órdenes de su propia tienda.",
  },
  "dashboard.productos": {
    href: "/dashboard/productos",
    group: "Productos",
    summary: "Los productos más vendidos, por unidades y por Kg.",
    contents: ["Ranking de productos por unidades.", "Productos que se venden por Kg.", "Filtros de fecha y tienda, y exportar a Excel."],
    preview: "ranking",
  },
  "dashboard.categorias": {
    href: "/dashboard/categorias",
    group: "Productos",
    summary: "La venta agrupada por categoría de producto.",
    contents: ["Venta por categoría.", "Gráfica de la proporción de cada una.", "Filtros de fecha y tienda, y exportar a Excel."],
    preview: "ranking",
  },
  "dashboard.comparacion-productos": {
    href: "/dashboard/comparacion-productos",
    group: "Productos",
    summary: "Compara la venta de cada producto entre dos períodos.",
    contents: ["Mes actual contra el anterior, dos meses o rangos personalizados.", "Totales, gráfica y tabla con el cambio de cada producto.", "Filtro de tienda y exportar a Excel."],
    preview: "ranking",
    vendedorNote: "El Vendedor solo compara su propia tienda.",
  },
  "dashboard.cierre-mes": {
    href: "/dashboard/cierre-mes",
    group: "Otros",
    summary: "El cierre del mes: tráfico, venta y ticket contra la meta.",
    contents: ["Mes anterior, mes del cierre y crecimiento.", "Meta y alcance de cada indicador.", "Exportar el cierre a Excel."],
    preview: "table",
  },
  "dashboard.inventario": {
    href: "/dashboard/inventario",
    group: "Inventario",
    summary: "El conteo de stock por producto y el registro de lo que pasó en la tienda.",
    contents: ["Stock estimado por producto.", "Conteo físico (solo Admin y Finanzas).", "Registro de ventas, mermas y entradas."],
    preview: "table",
    includes: ["Conteo", "Registro"],
    note: "Conteo y Registro van juntas: comparten los mismos datos y no se pueden separar.",
    vendedorNote: "El Vendedor solo ve el stock y el Registro de su tienda, y además Admin debe habilitar su tienda en Inventario por tienda.",
  },
  "dashboard.inventario-movimientos": {
    href: "/dashboard/inventario/movimientos",
    group: "Inventario",
    summary: "Mermas, regalías y degustaciones: lo que sale del inventario sin ser una venta.",
    contents: ["Registrar mermas, regalías y degustaciones.", "Ver su estado: pendiente, confirmado o rechazado.", "Confirmar o rechazar (solo Admin y Finanzas)."],
    preview: "table",
    vendedorNote: "El Vendedor registra solo las de su tienda, y además Admin debe habilitar su tienda en Inventario por tienda.",
  },
  "dashboard.inventario-solicitudes": {
    href: "/dashboard/inventario/solicitudes",
    group: "Inventario",
    summary: "Los pedidos de stock entre las tiendas y planta, con su seguimiento.",
    contents: [
      "La tienda pide productos a planta y confirma lo que recibe.",
      "Planta responde qué sí y qué no tiene, agrega productos y despacha.",
      "Admin y Finanzas ven todo el seguimiento y pueden cancelar.",
      "PDF del formato de envío a sucursales.",
    ],
    preview: "table",
    note: "Es la única sección que ve el rol Planta.",
    vendedorNote: "El Vendedor pide y confirma solo para su tienda, y además Admin debe habilitar su tienda en Inventario por tienda.",
  },
};
