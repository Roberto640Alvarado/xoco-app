import type { AiAttachmentKind, PendingAttachment } from "../types/ai-chat.types";

// Archivos que Xoco IA puede leer (mismos tipos y límites que xoco-api,
// src/ai-chat/utils/ai-attachments.util.ts). Las imágenes grandes se
// reducen aquí antes de subirlas y los Excel se convierten a CSV (una
// sección por hoja) para que la IA vea las celdas.

export const MAX_ATTACHMENTS = 5;
const MB = 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * MB;
const MAX_PDF_BYTES = 10 * MB;
const MAX_TEXT_BYTES = 2 * MB;
export const MAX_TOTAL_BYTES = 20 * MB;
/** Lado máximo de una imagen al subirla: suficiente para leer tickets y capturas. */
const MAX_IMAGE_SIDE = 2000;

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const TEXT_TYPES: Record<string, string> = {
  txt: "text/plain",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  md: "text/markdown",
  json: "application/json",
};
const EXCEL_EXTENSIONS = ["xlsx", "xls", "xlsm", "ods"];

/** Para el `accept` del input de archivos. */
export const ATTACHMENT_ACCEPT = [
  ...IMAGE_TYPES,
  "application/pdf",
  ...Object.keys(TEXT_TYPES).map((ext) => `.${ext}`),
  ...EXCEL_EXTENSIONS.map((ext) => `.${ext}`),
].join(",");

export class AttachmentError extends Error {}

const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

const textToBase64 = (text: string) => bytesToBase64(new TextEncoder().encode(text));

let counter = 0;
const localId = () => `a${Date.now()}-${(counter += 1)}`;

function pending(file: File, kind: AiAttachmentKind, mimeType: string, bytes: Uint8Array, extra: Partial<PendingAttachment> = {}): PendingAttachment {
  return { localId: localId(), name: file.name || "archivo", mimeType, kind, size: bytes.length, data: bytesToBase64(bytes), ...extra };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AttachmentError(`"${file.name}" no es una imagen válida.`));
    };
    image.src = url;
  });
}

/** Reduce la imagen si es muy grande o pesada (JPEG; PNG si trae transparencia y queda chica). */
async function prepareImage(file: File): Promise<PendingAttachment> {
  const original = new Uint8Array(await file.arrayBuffer());
  // Los GIF se dejan tal cual (podrían ser animados).
  if (file.type === "image/gif") {
    if (original.length > MAX_IMAGE_BYTES) throw new AttachmentError(`"${file.name}" pesa más de 5 MB.`);
    return pending(file, "image", file.type, original, { previewUrl: URL.createObjectURL(file) });
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  if (scale === 1 && original.length <= 1.5 * MB) {
    return pending(file, "image", file.type, original, { previewUrl: URL.createObjectURL(file) });
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new AttachmentError(`No se pudo preparar "${file.name}".`);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new AttachmentError(`No se pudo preparar "${file.name}".`);
  if (blob.size > MAX_IMAGE_BYTES) throw new AttachmentError(`"${file.name}" sigue pesando más de 5 MB aun reducida.`);

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return {
    localId: localId(),
    name,
    mimeType: "image/jpeg",
    kind: "image",
    size: blob.size,
    data: bytesToBase64(new Uint8Array(await blob.arrayBuffer())),
    previewUrl: URL.createObjectURL(blob),
    note: "Reducida para enviarla",
  };
}

/** Excel → CSV por hoja (la IA lee texto, no el binario del .xlsx). */
async function prepareExcel(file: File): Promise<PendingAttachment> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sections = workbook.SheetNames.map((sheetName) => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { blankrows: false, dateNF: "yyyy-mm-dd" }).trim();
    return csv ? `### Hoja: ${sheetName}\n${csv}` : "";
  }).filter(Boolean);
  if (sections.length === 0) throw new AttachmentError(`"${file.name}" no tiene datos.`);

  const text = sections.join("\n\n");
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > MAX_TEXT_BYTES) throw new AttachmentError(`"${file.name}" tiene demasiados datos (más de 2 MB en texto). Recórtalo a las hojas o filas que necesitas.`);
  return { localId: localId(), name: file.name, mimeType: "text/csv", kind: "text", size: bytes.length, data: textToBase64(text), note: "Excel leído como tabla" };
}

/** Valida y prepara un archivo para mandarlo a Xoco IA; lanza AttachmentError con un mensaje para el usuario. */
export async function prepareAttachment(file: File): Promise<PendingAttachment> {
  const extension = extensionOf(file.name);
  if (file.size === 0) throw new AttachmentError(`"${file.name}" está vacío.`);

  if (IMAGE_TYPES.includes(file.type)) return prepareImage(file);

  if (file.type === "application/pdf" || extension === "pdf") {
    if (file.size > MAX_PDF_BYTES) throw new AttachmentError(`"${file.name}" pesa más de 10 MB.`);
    return pending(file, "pdf", "application/pdf", new Uint8Array(await file.arrayBuffer()));
  }

  if (EXCEL_EXTENSIONS.includes(extension)) return prepareExcel(file);

  const textType = TEXT_TYPES[extension];
  if (textType) {
    if (file.size > MAX_TEXT_BYTES) throw new AttachmentError(`"${file.name}" pesa más de 2 MB.`);
    return pending(file, "text", textType, new Uint8Array(await file.arrayBuffer()));
  }

  if (extension === "docx" || extension === "doc") {
    throw new AttachmentError(`"${file.name}": los Word todavía no se pueden leer. Guárdalo como PDF y súbelo.`);
  }
  throw new AttachmentError(`"${file.name}": ese tipo de archivo no se puede leer. Sube imágenes, PDF, Excel, CSV o texto.`);
}

export function releasePreview(attachment: { previewUrl?: string }) {
  if (attachment.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(attachment.previewUrl);
}
