# Xoco IA: archivos adjuntos en el chat

## Objetivo
Poder adjuntar imágenes y archivos en el chat de Xoco IA para que la IA los lea.

## Cambios realizados
- Botón de clip en el cuadro de mensaje, arrastrar y soltar sobre el chat y pegar imágenes (Ctrl/Cmd + V).
- `lib/attachments.ts`: valida tipo y tamaño (mismos límites que la API), reduce imágenes grandes (máx. 2000 px, JPEG) y convierte Excel (.xlsx/.xls/.ods) a CSV por hoja con `xlsx`. Word muestra un aviso para subirlo como PDF.
- `ComposerAttachments`: miniaturas/tarjetas con botón para quitar y spinner mientras se preparan.
- `MessageAttachments`: los archivos se ven en la burbuja de la pregunta; clic para abrirlos. Los de chats guardados se piden con `useAttachmentUrl` (fetch con token → object URL).
- `useXocoChat.send` recibe los adjuntos y procesa el evento `attachments` del stream.
- Se puede enviar solo archivos, sin texto.

## Razones del cambio
El chat solo aceptaba texto; ahora se pueden revisar capturas, tickets, PDFs y Excel junto con los datos del panel.

## Resultado final
TypeScript y ESLint sin errores en `features/ai-xoco`.
