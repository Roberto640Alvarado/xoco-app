// Contenido de la guía de Inventario: el flujo completo por rol, qué hace
// cada pantalla, qué puede (y qué no) hacer cada rol, los pasos del tour
// guiado y los textos de los ⓘ. Todo en un solo archivo para que el texto se
// pueda ajustar sin tocar componentes. Debe describir lo que el sistema HACE
// de verdad (ver plan-history de Inventario): si el flujo cambia, se
// actualiza acá.
//
// Cuatro roles: Admin (SUPER_ADMIN), Finanzas, Vendedor (la tienda) y Planta.
// Admin y Finanzas comparten casi todo; la diferencia es que solo el Admin
// habilita Inventario por tienda (Administración → Inventario por tienda).
// Planta solo ve Solicitudes.

export type GuideRole = "admin" | "finanzas" | "vendedor" | "planta";
export type GuidePage = "conteo" | "solicitudes" | "movimientos" | "registro" | "habilitacion";

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
  habilitacion: "Habilitación por tienda",
};

export const ROLE_LABEL: Record<GuideRole, string> = {
  admin: "Admin",
  finanzas: "Finanzas",
  vendedor: "Vendedor",
  planta: "Planta",
};

// ── Qué puede y qué no puede hacer cada rol ───────────────────────────────

export const PERMISSIONS: Record<GuideRole, { can: string[]; cannot: string[] }> = {
  admin: {
    can: [
      "Actualizar el inventario de cualquier tienda directamente (Conteo).",
      "Ver el seguimiento de todas las solicitudes de stock y cancelarlas si hace falta.",
      "Confirmar o rechazar mermas, regalías y degustaciones.",
      "Registrar movimientos directamente (quedan confirmados).",
      "Ver el Registro de todas las tiendas y exportar a Excel.",
      "Habilitar Inventario para los Vendedores de cada tienda (Administración → Inventario por tienda).",
    ],
    cannot: [],
  },
  finanzas: {
    can: [
      "Actualizar el inventario de cualquier tienda directamente (Conteo).",
      "Ver el seguimiento de todas las solicitudes de stock y cancelarlas si hace falta.",
      "Confirmar o rechazar mermas, regalías y degustaciones.",
      "Registrar movimientos directamente (quedan confirmados).",
      "Ver el Registro de todas las tiendas y exportar a Excel.",
    ],
    cannot: [
      "Habilitar Inventario por tienda: solo lo hace el Admin.",
      "Responder ni despachar solicitudes: eso lo hace Planta.",
    ],
  },
  planta: {
    can: [
      "Ver las solicitudes de stock de todas las tiendas.",
      "Marcar qué productos sí hay, cuáles no y cuánto envías de cada uno.",
      "Agregar productos que la tienda no pidió.",
      "Despachar el envío (completo o parcial) y descargar el formato en PDF.",
      "Cancelar una solicitud con motivo antes de despacharla.",
    ],
    cannot: [
      "Ver Conteo, Movimientos ni Registro: tu acceso es solo Solicitudes.",
      "Cambiar el inventario de las tiendas: se actualiza cuando la tienda confirma lo recibido.",
    ],
  },
  vendedor: {
    can: [
      "Ver la existencia de tu tienda (solo lectura).",
      "Solicitar stock a planta y confirmar lo que llega.",
      "Reportar mermas, regalías y degustaciones.",
      "Ver el Registro de tu tienda y exportar a Excel.",
    ],
    cannot: [
      "Capturar o cambiar el conteo físico: lo hace Finanzas o Admin.",
      "Confirmar o rechazar mermas, regalías y degustaciones: lo hace Finanzas o Admin.",
      "Cambiar lo que planta envía: solo confirmas lo que de verdad llegó.",
      "Ver otras tiendas.",
      "Entrar a Inventario antes de que el Admin habilite tu tienda.",
    ],
  },
};

// ── Flujo completo (modal "Cómo funciona") ────────────────────────────────

const ADMIN_FLOW: { intro: string; steps: GuideStep[] } = {
  intro:
    "Inventario lleva la existencia de cada producto por tienda. Tú cargas el punto de partida a mano, las ventas de Odoo la van descontando solas y los movimientos de las tiendas pasan por tu confirmación.",
  steps: [
    {
      title: "1. Carga el stock inicial",
      body: "En Conteo captura el conteo físico de cada producto de cada tienda y guarda. Es el punto de partida de todo. Se recomienda hacerlo en todas las tiendas antes de habilitarlas.",
    },
    {
      title: "2. Habilita las tiendas",
      body: "En Administración → Inventario por tienda activas cada tienda. Mientras una tienda no esté habilitada, sus Vendedores no ven la sección (tú sí).",
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
      title: "5. Solicitudes de stock (solo seguimiento)",
      body: "Las tiendas piden stock a Planta en Solicitudes. Tú no aceptas ni confirmas nada: ves en qué paso va cada solicitud de todas las tiendas (solicitada, en preparación, en camino, recibida) y puedes cancelarla con motivo si hace falta.",
    },
    {
      title: "6. Recepción y ajustes",
      body: "Cuando Planta despacha, la tienda recibe el aviso, confirma lo que llegó y recién ahí el inventario de la tienda sube. Si algo no cuadra, puedes corregir el inventario directamente en Conteo.",
    },
    {
      title: "7. Registro",
      body: "Registro es la línea de tiempo de cada tienda con fecha y hora: ventas, movimientos y conteos. Filtra por fechas, producto o tipo y exporta a Excel.",
    },
  ],
};

const FINANZAS_FLOW: { intro: string; steps: GuideStep[] } = {
  intro: ADMIN_FLOW.intro,
  steps: ADMIN_FLOW.steps.map((step) =>
    step.title.startsWith("2.")
      ? {
          title: "2. Pide habilitar las tiendas",
          body: "Solo el Admin puede habilitar Inventario por tienda (Administración → Inventario por tienda). Cuando termines de cargar el stock de una tienda, avísale. Mientras no esté habilitada, sus Vendedores no ven la sección (tú sí).",
        }
      : step,
  ),
};

const VENDEDOR_FLOW: { intro: string; steps: GuideStep[] } = {
  intro:
    "Inventario te muestra el stock de tu tienda, te deja reportar movimientos y pedir stock a planta. Planta prepara y despacha; tú solo confirmas lo que llega.",
  steps: [
    {
      title: "1. Consulta el stock",
      body: "En Conteo ves la existencia estimada de cada producto de tu tienda, solo para leer. Baja con las ventas y con las mermas y regalías confirmadas, y sube cuando confirmas un envío recibido.",
    },
    {
      title: "2. Reporta mermas, regalías y degustaciones",
      body: "En Movimientos registra lo que salió de la tienda sin venderse (con una nota si hace falta). Queda pendiente y se resta del stock cuando Admin o Finanzas lo confirma; si lo rechazan, verás el motivo.",
    },
    {
      title: "3. Pide stock a planta",
      body: "En Solicitudes usa \"Nueva solicitud\": eliges los productos por categoría (como en el formato de envío a sucursales) y la cantidad de cada uno. Planta la recibe al instante.",
    },
    {
      title: "4. Planta responde y despacha",
      body: "Planta marca qué productos sí hay y cuáles no, puede agregar otros y despacha. Tú ves el avance: Solicitada, En preparación, En camino. Cuando sale el envío recibes un aviso en el menú.",
    },
    {
      title: "5. Confirma lo que llegó",
      body: "Abre la solicitud en camino: cada producto viene con la cantidad que envió planta. Si todo llegó bien, confirma. Si algo no coincide, cambia la cantidad y anota qué pasó. Recién al confirmar se suma al stock de tu tienda.",
    },
    {
      title: "6. Registro",
      body: "En Registro ves todo lo que pasó en tu tienda con fecha y hora: ventas, movimientos y conteos.",
    },
  ],
};

const PLANTA_FLOW: { intro: string; steps: GuideStep[] } = {
  intro:
    "Aquí recibes lo que piden las tiendas, marcas qué hay y qué no, y despachas. La tienda confirma lo que llega y su inventario se actualiza solo.",
  steps: [
    {
      title: "1. Llega una solicitud",
      body: "Cuando una tienda pide stock ves un aviso en el menú y la solicitud aparece en Solicitudes, resaltada y primero en la lista.",
    },
    {
      title: "2. Respóndela",
      body: "Ábrela: los productos vienen por categoría. Para cada uno indica cuánto envías (\"Todo\", una cantidad menor o \"No hay\") y, si quieres, deja un comentario a la par (\"No hay\", \"Se acabó\"...). Si no hay un producto puedes \"Mandar otro en su lugar\" (ej. piden tiramisú y mandas brownie). A la derecha ves la vista previa de cómo le llega a la tienda. Con \"Guardar avance\" puedes seguir después.",
    },
    {
      title: "3. Despacha",
      body: "Cuando todos los productos estén respondidos, pulsa \"Despachar\". El envío puede ser completo o parcial. La tienda recibe el aviso de que viene en camino.",
    },
    {
      title: "Mira el inventario de la tienda",
      body: "En Inventario → Conteo eliges cualquier tienda y ves cuánto tiene de cada producto (solo lectura). Desde una solicitud, \"Ver inventario de la tienda\" te lleva directo.",
    },
    {
      title: "4. Descarga el formato",
      body: "En cualquier momento puedes bajar el formato de envío a sucursales en PDF, con lo pedido, enviado y recibido por categoría y espacio para firmas.",
    },
    {
      title: "5. La tienda confirma",
      body: "La tienda indica lo que de verdad recibió. Si hay diferencias, quedan anotadas en la solicitud. Tú no tienes que confirmar nada más.",
    },
    {
      title: "Si no puedes surtirla",
      body: "Si no tienes nada de lo pedido, cancela la solicitud indicando el motivo; la tienda lo verá.",
    },
  ],
};

export const FLOW: Record<GuideRole, { intro: string; steps: GuideStep[] }> = {
  admin: ADMIN_FLOW,
  finanzas: FINANZAS_FLOW,
  vendedor: VENDEDOR_FLOW,
  planta: PLANTA_FLOW,
};

// ── Qué hace cada pantalla ────────────────────────────────────────────────

const CONTEO_STAFF =
  "Captura el conteo físico de cada producto por tienda (columna \"Inventario nuevo\") y guarda en lote. La existencia estimada se calcula sola desde el último conteo.";
const SOLICITUDES_STAFF =
  "Seguimiento de las solicitudes de stock de todas las tiendas: quién pidió, qué respondió planta y si ya llegó. Solo observas (y puedes cancelar); planta despacha y la tienda confirma.";
const NOT_FOR_PLANTA = "Esta pantalla no está disponible para Planta: tu acceso es Solicitudes y el Conteo (solo lectura).";
const MOVIMIENTOS_STAFF =
  "Mermas, regalías y degustaciones. Elige una tienda o mira los pendientes de todas; confirma o rechaza (con motivo) lo que reportan los Vendedores, o registra uno tú directamente.";
const REGISTRO_STAFF =
  "Línea de tiempo de entradas y salidas de una tienda, con fecha y hora: ventas de Odoo, movimientos y conteos. Filtra y exporta a Excel.";

export const PAGE_INTRO: Record<GuidePage, Record<GuideRole, string>> = {
  conteo: {
    admin: CONTEO_STAFF,
    finanzas: CONTEO_STAFF,
    vendedor:
      "Aquí ves la existencia estimada de cada producto de tu tienda. Es solo lectura: el conteo físico lo captura Finanzas o Admin.",
    planta:
      "Aquí ves cuánto tiene cada tienda de cada producto, para saber qué mandar. Elige la tienda arriba. Es solo lectura.",
  },
  solicitudes: {
    admin: SOLICITUDES_STAFF,
    finanzas: SOLICITUDES_STAFF,
    vendedor:
      "Aquí pides stock a planta y sigues cada solicitud hasta que llega. Cuando llegue, confirmas lo que recibiste y el inventario de tu tienda se actualiza.",
    planta:
      "Aquí llegan las solicitudes de las tiendas. Marca qué productos hay y cuáles no, agrega los que falten y despacha. La tienda recibe el aviso y confirma lo que llegue.",
  },
  movimientos: {
    admin: MOVIMIENTOS_STAFF,
    finanzas: MOVIMIENTOS_STAFF,
    vendedor:
      "Registra mermas, regalías y degustaciones de tu tienda. Quedan pendientes hasta que Admin o Finanzas las confirme; tú no puedes confirmarlas.",
    planta: NOT_FOR_PLANTA,
  },
  registro: {
    admin: REGISTRO_STAFF,
    finanzas: REGISTRO_STAFF,
    vendedor:
      "Línea de tiempo de tu tienda con fecha y hora: ventas, movimientos y conteos. Puedes filtrar por fechas, producto o tipo, y exportar a Excel.",
    planta: NOT_FOR_PLANTA,
  },
  habilitacion: {
    admin:
      "Decide en qué tiendas los Vendedores ya pueden usar Inventario. Se recomienda cargar el stock de la tienda en Conteo antes de habilitarla.",
    finanzas: "Esta pantalla es solo del Admin.",
    vendedor: "Esta pantalla es solo del Admin.",
    planta: "Esta pantalla es solo del Admin.",
  },
};

// ── Tour guiado por pantalla ──────────────────────────────────────────────

const WELCOME = (page: GuidePage, role: GuideRole): TourStep => ({
  title: PAGE_LABEL[page],
  description: PAGE_INTRO[page][role],
});

const COUNT_FILTER_STEP: TourStep = {
  target: '[data-tour="inv-search"]',
  title: "Filtra la tabla",
  description:
    "Cada columna con filtro tiene un ícono junto a su título: púlsalo para buscar por nombre, unidad o si ya fue contado. Abajo eliges cuántas filas ver por página.",
  side: "bottom",
};

const LEDGER_TYPE_STEP: TourStep = {
  target: '[data-tour="ledger-type"]',
  title: "Tipos de registro",
  description:
    "Venta, Merma, Regalía, Degustación, Entrada y Conteo. Pulsa ⓘ para ver qué significa cada uno y cómo se lee el signo de la cantidad.",
  side: "bottom",
};

// Pasos de Admin y Finanzas (son los mismos).
function staffSteps(role: "admin" | "finanzas"): Record<GuidePage, TourStep[]> {
  return {
    conteo: [
      WELCOME("conteo", role),
      {
        target: '[data-tour="inv-store"]',
        title: "Elige la tienda",
        description: "El inventario se lleva por tienda. Los cambios sin guardar de la tienda anterior se descartan.",
        side: "bottom",
      },
      COUNT_FILTER_STEP,
      {
        target: '[data-tour="inv-estimated"]',
        title: "Existencia estimada",
        description:
          "Lo que debería haber hoy: último conteo − ventas − mermas y regalías confirmadas + entradas confirmadas. \"—\" significa que el producto aún no se ha contado.",
        side: "bottom",
      },
      {
        target: '[data-tour="inv-count"]',
        title: "Inventario nuevo",
        description:
          "Escribe lo que contaste físicamente. Es lo único que se guarda; desde ese momento la existencia estimada vuelve a empezar de tu conteo.",
        side: "bottom",
      },
      {
        target: '[data-tour="inv-save"]',
        title: "Guardar cambios",
        description: "Guarda en lote los conteos que modificaste. Antes de enviar te muestra un resumen para confirmar.",
        side: "left",
      },
      { target: '[data-tour="inv-export"]', title: "Exportar", description: "Descarga la tabla de esta tienda en Excel.", side: "bottom" },
    ],
    solicitudes: [
      WELCOME("solicitudes", role),
      {
        target: '[data-tour="req-filters"]',
        title: "Filtros",
        description: "Filtra por rango de fechas y por tienda. Por defecto ves lo que va del año.",
        side: "bottom",
      },
      {
        target: '[data-tour="req-status"]',
        title: "Estados",
        description: "Cada botón filtra por estado y muestra cuántas hay. Pulsa ⓘ para entender cada estado.",
        side: "bottom",
      },
      {
        target: '[data-tour="req-board"]',
        title: "Tablero de solicitudes",
        description:
          "Una tarjeta por solicitud con su avance (Solicitada, En preparación, En camino, Recibida). Ábrela para ver los productos por categoría, el seguimiento y descargar el PDF; ahí también puedes cancelarla con motivo.",
        side: "top",
      },
    ],
    movimientos: [
      WELCOME("movimientos", role),
      { target: '[data-tour="mov-store"]', title: "Elige la tienda", description: "Mira los movimientos de una tienda a la vez.", side: "bottom" },
      {
        target: '[data-tour="mov-pending"]',
        title: "Pendientes de todas las tiendas",
        description: "Cambia a la vista de todo lo que espera tu confirmación, sin importar la tienda.",
        side: "bottom",
      },
      {
        target: '[data-tour="mov-new"]',
        title: "Registrar movimiento",
        description: "Anota tú una merma, regalía o degustación. Al registrarla tú queda confirmada y se resta del stock de inmediato.",
        side: "bottom",
      },
      {
        target: '[data-tour="movements-table"]',
        title: "Historial",
        description: "Todos los movimientos con su estado. Pulsa una fila para ver quién lo registró y la nota.",
        side: "top",
      },
      {
        target: '[data-tour="actions"]',
        title: "Confirmar o rechazar",
        description:
          "Abre el detalle (\"Gestionar\"). Confirmar resta la cantidad del stock de la tienda. Rechazar pide un motivo y no afecta el stock; el Vendedor verá el motivo.",
        side: "left",
      },
    ],
    registro: [
      WELCOME("registro", role),
      {
        target: '[data-tour="ledger-toolbar"]',
        title: "Filtros",
        description: "Elige tienda, rango de fechas, producto y tipo. Exporta lo que ves a Excel.",
        side: "bottom",
      },
      {
        target: '[data-tour="ledger-table"]',
        title: "Línea de tiempo",
        description: "Cada venta (una línea por producto), movimiento y conteo con su fecha y hora exactas, más recientes primero.",
        side: "top",
      },
      LEDGER_TYPE_STEP,
    ],
    habilitacion: [],
  };
}

const ADMIN_STEPS = staffSteps("admin");
const FINANZAS_STEPS = staffSteps("finanzas");

const VENDEDOR_STEPS: Record<GuidePage, TourStep[]> = {
  conteo: [
    WELCOME("conteo", "vendedor"),
    { target: '[data-tour="inv-store"]', title: "Tu tienda", description: "Solo ves el inventario de tu propia tienda.", side: "bottom" },
    COUNT_FILTER_STEP,
    {
      target: '[data-tour="inv-estimated"]',
      title: "Existencia estimada",
      description:
        "Lo que debería haber hoy en tu tienda. Baja con cada venta y con las mermas y regalías confirmadas, y sube cuando se confirma un envío. \"—\" significa que el producto aún no se ha contado. Es solo lectura: el conteo físico lo captura Finanzas o Admin.",
      side: "bottom",
    },
    { target: '[data-tour="inv-export"]', title: "Exportar", description: "Descarga este listado en Excel.", side: "bottom" },
  ],
  solicitudes: [
    WELCOME("solicitudes", "vendedor"),
    {
      target: '[data-tour="req-filters"]',
      title: "Filtros",
      description: "Filtra tus solicitudes por rango de fechas. La tienda es la tuya. Por defecto ves lo que va del año.",
      side: "bottom",
    },
    {
      target: '[data-tour="req-new"]',
      title: "Nueva solicitud",
      description: "Elige los productos por categoría y la cantidad de cada uno. Planta la recibe de inmediato.",
      side: "bottom",
    },
    {
      target: '[data-tour="req-status"]',
      title: "Estados",
      description: "\"Por confirmar\" te muestra los envíos que ya van en camino y esperan tu confirmación. Pulsa ⓘ para entender cada estado.",
      side: "bottom",
    },
    {
      target: '[data-tour="req-board"]',
      title: "Tus solicitudes",
      description:
        "Cada tarjeta muestra su avance. Cuando una esté En camino, ábrela, revisa la cantidad de cada producto y confirma lo que llegó; si algo no coincide, cámbialo y anota qué pasó.",
      side: "top",
    },
  ],
  movimientos: [
    WELCOME("movimientos", "vendedor"),
    { target: '[data-tour="mov-store"]', title: "Tu tienda", description: "Solo registras y ves movimientos de tu propia tienda.", side: "bottom" },
    {
      target: '[data-tour="mov-new"]',
      title: "Registrar movimiento",
      description:
        "Reporta una merma (producto dañado o perdido), una regalía (a un cliente) o una degustación. Agrega una nota si ayuda a entender el caso.",
      side: "bottom",
    },
    {
      target: '[data-tour="movements-table"]',
      title: "Historial",
      description: "Lo que has reportado y su estado. Pulsa una fila para ver el detalle.",
      side: "top",
    },
    {
      target: '[data-tour="status"]',
      title: "Estado",
      description:
        "Pendiente hasta que Admin o Finanzas lo confirme (recién ahí se resta del stock). Tú no puedes confirmarlo. Si lo rechazan, verás el motivo.",
      side: "bottom",
    },
  ],
  registro: [
    WELCOME("registro", "vendedor"),
    {
      target: '[data-tour="ledger-toolbar"]',
      title: "Filtros",
      description: "Filtra por rango de fechas, producto y tipo. Puedes exportar a Excel.",
      side: "bottom",
    },
    {
      target: '[data-tour="ledger-table"]',
      title: "Línea de tiempo de tu tienda",
      description: "Ventas, movimientos y conteos con fecha y hora, más recientes primero.",
      side: "top",
    },
    LEDGER_TYPE_STEP,
  ],
  habilitacion: [],
};

const PLANTA_STEPS: Record<GuidePage, TourStep[]> = {
  conteo: [
    WELCOME("conteo", "planta"),
    { target: '[data-tour="inv-store"]', title: "Elige la tienda", description: "Cambia de tienda para ver su inventario.", side: "bottom" },
    COUNT_FILTER_STEP,
    {
      target: '[data-tour="inv-estimated"]',
      title: "Existencia estimada",
      description: "Lo que debería haber hoy en esa tienda. \"—\" significa que el producto aún no se ha contado.",
      side: "bottom",
    },
  ],
  solicitudes: [
    WELCOME("solicitudes", "planta"),
    {
      target: '[data-tour="req-filters"]',
      title: "Filtros",
      description: "Filtra por rango de fechas. Por defecto ves lo que va del año.",
      side: "bottom",
    },
    {
      target: '[data-tour="req-store-tabs"]',
      title: "Una pestaña por tienda",
      description: "Toca una tienda para ver solo sus solicitudes. El número amarillo dice cuántas tiene nuevas por responder.",
      side: "bottom",
    },
    {
      target: '[data-tour="req-status"]',
      title: "Por responder",
      description: "Este botón junta lo que espera tu respuesta o despacho. Las nuevas aparecen primero y resaltadas.",
      side: "bottom",
    },
    {
      target: '[data-tour="req-board"]',
      title: "Responder y despachar",
      description:
        "Abre una solicitud: marca para cada producto cuánto envías (Todo, menos o No hay), agrega productos que la tienda no pidió y despacha cuando todo esté respondido. También puedes descargar el PDF del formato.",
      side: "top",
    },
  ],
  movimientos: [],
  registro: [],
  habilitacion: [],
};

// La pantalla de habilitación es solo del Admin.
ADMIN_STEPS.habilitacion = [
  WELCOME("habilitacion", "admin"),
  {
    target: '[data-tour="access-note"]',
    title: "Antes de habilitar",
    description:
      "Carga el stock de la tienda en Conteo y recién después actívala. Al habilitarla, sus Vendedores ven el stock (solo lectura) y su Registro, y pueden pedir stock y reportar movimientos. Deshabilitar solo oculta la sección: no borra nada.",
    side: "bottom",
  },
  {
    target: '[data-tour="access-list"]',
    title: "Tiendas",
    description: "Cada tienda indica si Inventario está visible u oculto para sus Vendedores. Tú y Finanzas lo ven siempre.",
    side: "top",
  },
  {
    target: '[data-tour="access-bulk"]',
    title: "Todas a la vez",
    description: "Habilita u oculta Inventario en todas las tiendas con un solo clic. Pide confirmación antes de aplicar.",
    side: "bottom",
  },
  {
    target: '[data-tour="access-switch"]',
    title: "Habilitar u ocultar",
    description: "Usa el interruptor y confirma. El cambio es inmediato para los Vendedores de esa tienda.",
    side: "left",
  },
];

export const TOURS: Record<GuidePage, Record<GuideRole, TourStep[]>> = {
  conteo: { admin: ADMIN_STEPS.conteo, finanzas: FINANZAS_STEPS.conteo, vendedor: VENDEDOR_STEPS.conteo, planta: PLANTA_STEPS.conteo },
  solicitudes: {
    admin: ADMIN_STEPS.solicitudes,
    finanzas: FINANZAS_STEPS.solicitudes,
    vendedor: VENDEDOR_STEPS.solicitudes,
    planta: PLANTA_STEPS.solicitudes,
  },
  movimientos: {
    admin: ADMIN_STEPS.movimientos,
    finanzas: FINANZAS_STEPS.movimientos,
    vendedor: VENDEDOR_STEPS.movimientos,
    planta: PLANTA_STEPS.movimientos,
  },
  registro: { admin: ADMIN_STEPS.registro, finanzas: FINANZAS_STEPS.registro, vendedor: VENDEDOR_STEPS.registro, planta: PLANTA_STEPS.registro },
  habilitacion: { admin: ADMIN_STEPS.habilitacion, finanzas: [], vendedor: [], planta: [] },
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
      "Suma las entradas ya confirmadas (lo que la tienda recibió de planta).",
      "Si un producto aún no se ha contado, aparece \"—\": no hay de dónde partir.",
    ],
  },
  "estados-solicitud": {
    title: "Estados de una solicitud de stock",
    paragraphs: [
      "Cada solicitud avanza por estos pasos. El inventario de la tienda solo sube cuando la tienda confirma lo recibido.",
    ],
    bullets: [
      "Solicitada: la tienda la pidió; planta aún no la toma.",
      "En preparación: planta la está respondiendo (qué hay, qué no, qué agrega).",
      "En camino: planta despachó. Puede ser un envío completo o parcial, y la tienda recibe el aviso.",
      "Recibida: la tienda confirmó lo que llegó y su inventario ya se actualizó. Si hubo diferencias, quedan anotadas (columna DIF).",
      "Cancelada: se canceló con un motivo y el inventario no cambia.",
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
      "Entrada (+): lo que la tienda confirmó haber recibido de una solicitud a planta.",
      "Conteo (sin signo): un conteo físico; la cantidad es la contada y el detalle muestra cuánto había antes.",
      "Pendientes y rechazados aparecen, pero solo los confirmados afectan la existencia estimada.",
    ],
  },
};

/** Rol de la sesión (SUPER_ADMIN / FINANZAS / VENDEDOR / PLANTA) -> rol de las guías. */
export function guideRoleFor(role: string | undefined): GuideRole {
  if (role === "SUPER_ADMIN") return "admin";
  if (role === "FINANZAS") return "finanzas";
  if (role === "PLANTA") return "planta";
  return "vendedor";
}
