// Mismo contrato que xoco-api (src/ai-chat): eventos del stream y config.

export type AiProviderKey = "claude" | "openai";

export interface AiProviderInfo {
  key: AiProviderKey;
  label: string;
  model: string;
  available: boolean;
}

export interface AiChatConfig {
  providers: AiProviderInfo[];
  maxSteps: number;
}

export type AiValueFormat = "moneda" | "numero" | "porcentaje" | "texto";

export interface AiChart {
  titulo: string;
  tipo: "barras" | "lineas" | "area" | "pastel";
  etiquetas: string[];
  series: { nombre: string; valores: number[] }[];
  formato?: Exclude<AiValueFormat, "texto">;
  nota?: string;
}

export interface AiTable {
  titulo: string;
  columnas: { titulo: string; formato?: AiValueFormat }[];
  filas: (string | number | null)[][];
  nota?: string;
}

/** Tipo de archivo que Xoco IA sabe leer. */
export type AiAttachmentKind = "image" | "pdf" | "text";

/** Archivo adjunto ya guardado en el servidor (sin contenido). */
export interface AiAttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  kind: AiAttachmentKind;
  size: number;
}

/** Archivo listo para subirse (base64) con su vista previa local. */
export interface PendingAttachment {
  localId: string;
  name: string;
  mimeType: string;
  kind: AiAttachmentKind;
  size: number;
  data: string;
  /** URL local (object URL) para ver la imagen antes de que el servidor la guarde. */
  previewUrl?: string;
  /** Nota corta para el usuario (ej. "Excel convertido a CSV"). */
  note?: string;
}

/** Adjunto que se dibuja en una pregunta: puede venir del servidor (`id`) o ser local todavía. */
export interface ChatAttachment {
  key: string;
  id?: string;
  name: string;
  mimeType: string;
  kind: AiAttachmentKind;
  size: number;
  previewUrl?: string;
}

export type AiChatEvent =
  | { type: "conversation"; id: string; title: string }
  | { type: "attachments"; messageId: string; attachments: AiAttachmentMeta[] }
  | { type: "title"; id: string; title: string }
  | { type: "start"; provider: AiProviderKey; label: string; model: string }
  | { type: "tool"; name: string; title: string }
  | { type: "text"; text: string }
  | { type: "chart"; chart: AiChart }
  | { type: "table"; table: AiTable }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number }; steps: number }
  | { type: "error"; message: string };

/** Pedazos de una respuesta de Xoco IA, en el orden en que llegaron. */
export type AssistantBlock =
  | { kind: "tool"; title: string }
  /** `fresh`: llegó en esta sesión y se escribe con animación (no al abrir un chat viejo). */
  | { kind: "text"; text: string; fresh?: boolean }
  | { kind: "chart"; chart: AiChart }
  | { kind: "table"; table: AiTable }
  | { kind: "error"; message: string };

export type ChatEntry =
  | { id: string; role: "user"; text: string; attachments?: ChatAttachment[] }
  | { id: string; role: "assistant"; provider: AiProviderKey; label: string; model?: string; blocks: AssistantBlock[]; status: "streaming" | "done" | "error" | "stopped" };

export interface AiConversationSummary {
  id: string;
  title: string;
  provider: AiProviderKey;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationDetail extends AiConversationSummary {
  messages: {
    id: string;
    role: "user" | "assistant";
    text: string;
    blocks: AssistantBlock[] | null;
    attachments: AiAttachmentMeta[] | null;
    provider: AiProviderKey | null;
    model: string | null;
    status: "done" | "error" | "stopped" | null;
    createdAt: string;
  }[];
}
