// Contenido de la guía de Inventario: el flujo completo por rol, qué hace
// cada pantalla, los pasos del tour guiado y los textos de los ⓘ. Todo en
// un solo archivo para que el texto se pueda ajustar sin tocar componentes.
// Debe describir lo que el sistema HACE de verdad (ver plan-history de
// Inventario): si el flujo cambia, se actualiza acá.

export type GuideRole = "admin" | "vendedor";
export type GuidePage = "conteo" | "solicitudes" | "movimientos" | "registro";

export interface GuideStep {
  title: string;
  body: string;
}

/** Un paso del tour: `target` es un selector CSS (data-tour); sin target, el
 * paso se muestra centrado (bienvenida). Los pasos cuyo elemento no exista o
 * no sea visible en pantalla se omiten al iniciar el tour. */
export interface TourStep {
  target?: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
}

export const PAGE_LABEL: Record<GuidePage, string> = {
  conteo: "Conteo",
  solicitudes: "Solicitudes",
  movimientos: "Movimientos",
  registro: "Registro",
};

// ── Flujo completo (modal "Cómo funciona") ────────────────────────────────

export const FLOW: Record<GuideRole, { intro: string; steps: GuideStep[] }> = {
  admin: {
    intro:
      "Inventario lleva la existencia de cada producto por tienda. Tú cargas el punto de partida a mano, las ventas de Odoo la van descontando solas y los movimientos de las tiendas pasan por tu confirmación.",
    steps: [
      {
        title: "1. Carga el stock inicial",
        body: "En Conteo captura el conteo físico de cada producto de cada tienda y guarda. Es el punto de partida de todo. Se recomienda hacerlo en todas las tiendas antes de habilitarlas.",
      },
      {
        title: "2. Habilita las tiendas",
        body: "El Super admin lo hace en Administración → Inventario por tienda, tienda por tienda. Mientras una tienda no esté habilitada, sus Vendedores no ven la sección (tú sí).",
      },
      {
        title: "3. Las ventas descuentan solas",
        body: "La existencia estimada es: último conteo − ventas de Odoo (efectivo y tarjeta, sin canceladas) − mermas, regalías y degustaciones confirmadas + entradas confirmadas. Cada vez que guardas un conteo nuevo, vuelve a empezar desde ahí.",
      },
      {
        title: "4. Mermas, regalías y degustaciones",
        body: "El Vendedor las reporta en Movimientos y quedan pendientes. Tú las confirmas (se restan del stock) o las rechazas con un motivo. Si las registras tú, quedan confirmadas de una vez.",
      },
      {
        title: "5. Solicitudes de stock",
        body: "Cuando una tienda pide más stock, te llega a Solicitudes (y ves un globo en el menú). Acepta la solicitud: queda \"en camino\" y tú gestionas el envío por tu proceso manual. O recházala indicando el motivo; el Vendedor lo verá.",
      },
      {
        title: "6. Recepción y confirmación",
        body: "Cuando el pedido llega, el Vendedor lo marca como recibido con la cantidad real. Tú lo confirmas y recién ahí se suma al stock. Si llegó una cantidad distinta a la pedida, verás la diferencia en rojo.",
      },
      {
        title: "7. Registro",
        body: "Registro es la línea de tiempo de cada tienda con fecha y hora: ventas, movimientos y conteos. Filtra por fechas, producto o tipo y exporta a Excel.",
      },
    ],
  },
  vendedor: {
    intro:
      "Inventario te muestra el stock de tu tienda y te deja reportar movimientos y pedir más stock. Lo que cambia el stock siempre lo confirma Admin o Finanzas.",
    steps: [
      {
        title: "1. Consulta el stock",
        body: "En Conteo ves la existencia estimada de cada producto de tu tienda, solo para leer. Baja con las ventas y con las mermas y regalías confirmadas, y sube cuando se confirma un envío.",
      },
      {
        title: "2. Reporta mermas, regalías y degustaciones",
        body: "En Movimientos registra lo que salió de la tienda sin venderse (con una nota si hace falta). Queda pendiente y se resta del stock cuando Admin o Finanzas lo confirma; si lo rechazan, verás el motivo.",
      },
      {
        title: "3. Solicita más stock",
        body: "En Solicitudes usa \"Solicitar stock\": elige el producto y la cantidad que necesitas. Admin o Finanzas la recibe en su bandeja.",
      },
      {
        title: "4. Sigue tu solicitud",
        body: "Pendiente: esperando respuesta. En camino: la aceptaron y viene el envío. Rechazada: verás el motivo. Cada fila te dice qué sigue.",
      },
      {
        title: "5. Marca como recibido",
        body: "Cuando llegue el pedido, pulsa \"Marcar recibido\" e ingresa la cantidad real que llegó. Queda en proceso de aprobación y se sumará al stock cuando Admin o Finanzas confirme — no antes.",
      },
      {
        title: "6. Registro",
        body: "En Registro ves todo lo que pasó en tu tienda con fecha y hora: ventas, movimientos y conteos.",
      },
    ],
  },
};

// ── Qué hace cada pantalla ────────────────────────────────────────────────

export const PAGE_INTRO: Record<GuidePage, Record<GuideRole, string>> = {
  conteo: {
    admin:
      "Aquí capturas el conteo físico de cada producto por tienda (columna \"Inventario nuevo\") y guardas en lote. La existencia estimada se calcula sola a partir del último conteo.",
    vendedor:
      "Aquí ves la existencia estimada de cada producto de tu tienda. Es solo lectura: el conteo físico lo captura Finanzas.",
  },
  solicitudes: {
    admin:
      "Bandeja de solicitudes de stock de todas las tiendas. Acepta (en camino), rechaza con motivo o, cuando la tienda ya la recibió, confirma para sumarla al stock.",
    vendedor:
      "Aquí pides más stock y sigues cada solicitud hasta que llega. Cuando llegue, márcala como recibida con la cantidad real.",
  },
  movimientos: {
    admin:
      "Mermas, regalías y degustaciones. Elige una tienda o mira los pendientes de todas; confirma o rechaza (con motivo) lo que reportan los Vendedores, o registra uno tú directamente.",
    vendedor:
      "Registra mermas, regalías y degustaciones de tu tienda. Quedan pendientes hasta que Admin o Finanzas las confirme.",
  },
  registro: {
    admin:
      "Línea de tiempo de entradas y salidas de una tienda, con fecha y hora: ventas de Odoo, movimientos y conteos. Filtra y exporta a Excel.",
    vendedor:
      "Línea de tiempo de tu tienda con fecha y hora: ventas, movimientos y conteos. Puedes filtrar por fechas, producto o tipo.",
  },
};

// ── Tour guiado por pantalla ──────────────────────────────────────────────

const WELCOME = (page: GuidePage, role: GuideRole): TourStep => ({
  title: `${PAGE_LABEL[page]}`,
  description: PAGE_INTRO[page][role],
});

export const TOURS: Record<GuidePage, Record<GuideRole, TourStep[]>> = {
  conteo: {
    admin: [
      WELCOME("conteo", "admin"),
      { target: '[data-tour="inv-store"]', title: "Elige la tienda", description: "El inventario se lleva por tienda. Cambia de tienda aquí; los cambios sin guardar de la anterior se descartan.", side: "bottom" },
      { target: '[data-tour="inv-search"]', title: "Busca un producto", description: "El catálogo viene de Odoo y puede ser largo: filtra por nombre.", side: "bottom" },
      { target: '[data-tour="inv-estimated"]', title: "Existencia estimada", description: "Lo que debería haber hoy: último conteo − ventas − mermas/regalías confirmadas + entradas confirmadas. \"—\" significa que ese producto aún no se ha contado.", side: "bottom" },
      { target: '[data-tour="inv-count"]', title: "Inventario nuevo", description: "Escribe aquí lo que contaste físicamente. Es lo único que se guarda; a partir de ese momento la existencia estimada vuelve a empezar desde tu conteo.", side: "bottom" },
      { target: '[data-tour="inv-save"]', title: "Guardar cambios", description: "Guarda en lote todos los conteos que modificaste. Antes de enviar te muestra un resumen para confirmar.", side: "left" },
      { target: '[data-tour="inv-export"]', title: "Exportar", description: "Descarga la tabla de esta tienda en Excel.", side: "bottom" },
    ],
    vendedor: [
      WELCOME("conteo", "vendedor"),
      { target: '[data-tour="inv-store"]', title: "Tu tienda", description: "Solo ves el inventario de tu propia tienda.", side: "bottom" },
      { target: '[data-tour="inv-search"]', title: "Busca un producto", description: "Filtra el listado por nombre.", side: "bottom" },
      { target: '[data-tour="inv-estimated"]', title: "Existencia estimada", description: "Lo que debería haber hoy en tu tienda. Baja con cada venta y con las mermas y regalías confirmadas, y sube cuando se confirma un envío. \"—\" significa que ese producto aún no se ha contado.", side: "bottom" },
      { target: '[data-tour="inv-export"]', title: "Exportar", description: "Descarga este listado en Excel.", side: "bottom" },
    ],
  },
  solicitudes: {
    admin: [
      WELCOME("solicitudes", "admin"),
      { target: '[data-tour="movements-table"]', title: "Bandeja de solicitudes", description: "Todas las solicitudes abiertas de todas las tiendas, las más recientes primero.", side: "top" },
      { target: '[data-tour="status"]', title: "Estado y qué sigue", description: "Pendiente → En camino → Recibido → Confirmado. Debajo de cada estado verás qué toca hacer. Pulsa ⓘ para ver el detalle.", side: "bottom" },
      { target: '[data-tour="actions"]', title: "Tus acciones", description: "Aceptar (queda en camino), Rechazar (con motivo) y, cuando la tienda ya la recibió, Confirmar: recién ahí se suma al stock.", side: "left" },
    ],
    vendedor: [
      WELCOME("solicitudes", "vendedor"),
      { target: '[data-tour="req-new"]', title: "Solicitar stock", description: "Pide más de un producto: elige cuál y cuánto necesitas. Admin o Finanzas la recibe de inmediato.", side: "bottom" },
      { target: '[data-tour="movements-table"]', title: "Tus solicitudes", description: "Aquí queda el historial de lo que has pedido, con su estado actual.", side: "top" },
      { target: '[data-tour="status"]', title: "Estado y qué sigue", description: "Pendiente: esperando respuesta. En camino: aceptada. Recibido: en proceso de aprobación — se suma al stock cuando Admin o Finanzas confirme. Pulsa ⓘ para el detalle.", side: "bottom" },
      { target: '[data-tour="actions"]', title: "Marcar recibido", description: "Cuando llegue un pedido en camino, aparece aquí \"Marcar recibido\": ingresa la cantidad real que llegó.", side: "left" },
    ],
  },
  movimientos: {
    admin: [
      WELCOME("movimientos", "admin"),
      { target: '[data-tour="mov-store"]', title: "Elige la tienda", description: "Mira los movimientos de una tienda a la vez.", side: "bottom" },
      { target: '[data-tour="mov-pending"]', title: "Pendientes de todas las tiendas", description: "Cambia a la vista de todo lo que está esperando tu confirmación, sin importar la tienda.", side: "bottom" },
      { target: '[data-tour="mov-new"]', title: "Registrar movimiento", description: "Anota tú una merma, regalía o degustación. Al registrarla tú queda confirmada y se resta del stock de inmediato.", side: "bottom" },
      { target: '[data-tour="movements-table"]', title: "Historial", description: "Todos los movimientos con quién los registró y su estado.", side: "top" },
      { target: '[data-tour="actions"]', title: "Confirmar o rechazar", description: "Confirmar resta la cantidad del stock de la tienda. Rechazar pide un motivo y no afecta el stock; el Vendedor verá el motivo.", side: "left" },
    ],
    vendedor: [
      WELCOME("movimientos", "vendedor"),
      { target: '[data-tour="mov-store"]', title: "Tu tienda", description: "Solo registras y ves movimientos de tu propia tienda.", side: "bottom" },
      { target: '[data-tour="mov-new"]', title: "Registrar movimiento", description: "Reporta una merma (producto dañado o perdido), una regalía (a un cliente) o una degustación. Agrega una nota si ayuda a entender el caso.", side: "bottom" },
      { target: '[data-tour="movements-table"]', title: "Historial", description: "Lo que has reportado y su estado.", side: "top" },
      { target: '[data-tour="status"]', title: "Estado", description: "Pendiente hasta que Admin o Finanzas lo confirme (recién ahí se resta del stock). Si lo rechazan, verás el motivo.", side: "bottom" },
    ],
  },
  registro: {
    admin: [
      WELCOME("registro", "admin"),
      { target: '[data-tour="ledger-toolbar"]', title: "Filtros", description: "Elige tienda, rango de fechas, producto y tipo. Exporta lo que ves a Excel.", side: "bottom" },
      { target: '[data-tour="ledger-table"]', title: "Línea de tiempo", description: "Cada venta (una línea por producto), movimiento y conteo con su fecha y hora exactas, más recientes primero.", side: "top" },
      { target: '[data-tour="ledger-type"]', title: "Tipos de registro", description: "Venta, Merma, Regalía, Degustación, Entrada y Conteo. Pulsa ⓘ para ver qué significa cada uno y cómo se lee el signo de la cantidad.", side: "bottom" },
    ],
    vendedor: [
      WELCOME("registro", "vendedor"),
      { target: '[data-tour="ledger-toolbar"]', title: "Filtros", description: "Filtra por rango de fechas, producto y tipo. Puedes exportar a Excel.", side: "bottom" },
      { target: '[data-tour="ledger-table"]', title: "Línea de tiempo de tu tienda", description: "Ventas, movimientos y conteos con fecha y hora, más recientes primero.", side: "top" },
      { target: '[data-tour="ledger-type"]', title: "Tipos de registro", description: "Pulsa ⓘ para ver qué significa cada tipo y cómo se lee el signo de la cantidad.", side: "bottom" },
    ],
  },
};

// ── Textos de los ⓘ ───────────────────────────────────────────────────────

export interface InfoContent {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export type InfoTopic =
  | "existencia-estimada"
  | "estados-solicitud"
  | "estados-movimiento"
  | "registro-tipos";

export const INFO: Record<InfoTopic, InfoContent> = {
  "existencia-estimada": {
    title: "Existencia estimada",
    paragraphs: [
      "Es lo que debería haber hoy de ese producto en la tienda. No es un conteo nuevo: se calcula a partir del último conteo físico.",
    ],
    bullets: [
      "Parte del último conteo guardado.",
      "Resta las ventas de Odoo desde ese conteo (efectivo y tarjeta, sin órdenes canceladas).",
      "Resta las mermas, regalías y degustaciones ya confirmadas.",
      "Suma las entradas (envíos de planta) ya confirmadas.",
      "Si un producto aún no se ha contado, aparece \"—\": no hay de dónde partir.",
    ],
  },
  "estados-solicitud": {
    title: "Estados de una solicitud de stock",
    paragraphs: ["Cada solicitud avanza por estos pasos. Solo al llegar a Confirmado se suma al stock."],
    bullets: [
      "Pendiente: la tienda la pidió; espera respuesta de Admin o Finanzas.",
      "En camino: Admin o Finanzas la aceptó y el envío va hacia la tienda.",
      "Recibido: la tienda marcó que llegó, con la cantidad real. Está en proceso de aprobación: todavía no suma al stock.",
      "Confirmado: Admin o Finanzas lo dio por bueno y la cantidad se sumó al stock.",
      "Rechazado: no se aprobó. El motivo aparece en la fila y el stock no cambia.",
      "Si la cantidad recibida es distinta a la pedida, se muestra en rojo para que se note la diferencia.",
    ],
  },
  "estados-movimiento": {
    title: "Estados de un movimiento",
    paragraphs: [
      "Las mermas, regalías y degustaciones reportadas por un Vendedor necesitan confirmación antes de afectar el stock.",
    ],
    bullets: [
      "Pendiente: reportado, esperando que Admin o Finanzas lo confirme o rechace.",
      "Confirmado: ya se restó del stock de la tienda.",
      "Rechazado: no se aprobó; el motivo aparece en la fila y el stock no cambia.",
      "Lo que registra Admin o Finanzas nace Confirmado.",
    ],
  },
  "registro-tipos": {
    title: "Tipos del Registro",
    paragraphs: ["El Registro junta tres fuentes en una sola línea de tiempo. La cantidad se lee con signo:"],
    bullets: [
      "Venta (−): una línea por producto vendido en el POS de Odoo.",
      "Merma, Regalía, Degustación (−): salidas reportadas a mano; muestran su estado (pendiente, confirmado, rechazado).",
      "Entrada (+): un envío de planta a la tienda; muestra la cantidad recibida cuando ya llegó.",
      "Conteo (sin signo): un conteo físico; la cantidad es la contada y el detalle muestra cuánto había antes.",
      "Pendientes y rechazados aparecen, pero solo los confirmados afectan la existencia estimada.",
    ],
  },
};
