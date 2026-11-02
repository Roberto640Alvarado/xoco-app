import { CalendarRange, Package, Trophy, Warehouse, type LucideIcon } from "lucide-react";

// URL pública del conector (la que se pega en Claude/ChatGPT). Siempre la
// de producción, aunque el panel corra en local contra localhost.
export const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL ?? "https://xoco-api-production.up.railway.app/mcp";

export type AssistantKey = "claude" | "chatgpt";

export interface ConnectorStep {
  title: string;
  text: string;
}

export const CONNECT_STEPS: Record<AssistantKey, { plan: string; where: string; steps: ConnectorStep[] }> = {
  claude: {
    plan: "Funciona desde el plan gratis (1 conector). Pro o Max si lo usan seguido.",
    where: "claude.ai y la app de escritorio.",
    steps: [
      { title: "Abre los conectores", text: "En Claude: Ajustes → Conectores → Agregar conector personalizado." },
      { title: "Pega la URL", text: "Ponle de nombre \"Xocolatísimo\" y pega la URL del conector de arriba." },
      { title: "Inicia sesión", text: "Se abre \"Conectar con Xocolatísimo\": entra con tu correo y contraseña del panel." },
      { title: "Pregunta", text: "En un chat nuevo pregunta por Xoco: ventas, metas, inventario o kardex." },
    ],
  },
  chatgpt: {
    plan: "Necesita ChatGPT Plus, Pro, Business o Enterprise (no el gratis).",
    where: "chatgpt.com (web).",
    steps: [
      { title: "Activa el modo desarrollador", text: "En ChatGPT: Ajustes → Modo desarrollador (en Business lo activa un admin)." },
      { title: "Crea la app", text: "Ajustes → Apps / Conectores → Crear. Pega la URL del conector y elige OAuth." },
      { title: "Inicia sesión", text: "Entra con tu correo y contraseña del panel en \"Conectar con Xocolatísimo\"." },
      { title: "Actívalo en el chat", text: "Selecciónalo en las herramientas del chat. Si agregamos herramientas nuevas, dale \"Actualizar\"." },
    ],
  },
};

export const CHAT_SUGGESTIONS: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: CalendarRange, title: "Resumen del mes", detail: "Venta oficial por tienda y avance de metas" },
  { icon: Trophy, title: "Lo más vendido", detail: "Top productos de la semana en cada tienda" },
  { icon: Warehouse, title: "¿Qué me falta?", detail: "Productos con poca existencia en mi tienda" },
  { icon: Package, title: "Kardex rápido", detail: "Entradas y salidas de un producto" },
];
