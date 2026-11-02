# Xoco IA: chat funcional en el panel

## Objetivo
Pasar el adelanto "próximamente" a un chat real con Claude u OpenAI, con gráficas y tablas.

## Cambios realizados
- `features/ai-xoco`: API (`fetchAiChatConfig`, `streamAiChat` con fetch + lectura del stream), hook `useXocoChat` (conversación en memoria, detener, nuevo chat), `AssistantMessage` (pasos "Consultando…", texto, gráficas, tablas, errores), `ChatChart` (recharts: barras, líneas, área, pastel), `ChatTable`, `RichText` (markdown mínimo sin HTML crudo).
- `XocoChatView` reemplaza a la vista "próximamente": selector Claude / ChatGPT (deshabilitado si falta la llave), sugerencias que preguntan de una, Enter envía y Shift+Enter hace salto de línea.
- Menú: "Xoco IA" (sin "pronto").

## Razones
Pedido del usuario: usar Claude y OpenAI por detrás, con capacidad de gráficas y tablas.

## Resultado final
El Super admin pregunta en el panel y Xoco IA responde con cifras del panel, gráficas y tablas.

## Actualización: Llaves de API y Gasto de IA
- `IA → Llaves de API` (`AiKeysView`): tarjeta por proveedor con estado (Conectada, Sin crédito, Inválida, Con problema, Desde el servidor), llave enmascarada (últimos 4), última prueba y quién la guardó; agregar/cambiar con prueba previa, "Probar ahora" y quitar.
- `IA → Gasto de IA` (`AiUsageView`): períodos (hoy, 7 días, este mes, mes pasado) y filtro por IA; totales, gasto por día (Claude vs ChatGPT), por usuario (filtra la tabla) y por modelo; tabla de consultas con fecha y hora, usuario, IA, pregunta, tokens, costo y estado, paginada.

## Actualización: historial de chats por usuario
- Los chats se guardan en el servidor (cada usuario ve solo los suyos). La URL lleva el chat abierto (`?c=`), así un chat se puede recargar o compartir el enlace contigo mismo.
- `ChatHistory`: "Nuevo chat", buscador (nombre y contenido), chats agrupados (Hoy, Ayer, Últimos 7 días, Últimos 30 días, Anteriores), renombrar en línea y eliminar con confirmación. En celular se abre como panel lateral.
- Copiar: cada respuesta (texto y tablas), cada pregunta y cada tabla (como texto con tabulaciones para pegar en Excel).

## Actualización: íconos de Claude y OpenAI
- `ProviderIcon` con los íconos `claude.svg` y `openai.svg` de Bootstrap Icons v1.13.2 (MIT, con su aviso de copyright) en línea como SVG: toman el color del texto. La primera versión los importaba como archivo y no se mostraban.
- Se usan en Llaves de API (tarjetas y diálogo), el selector del chat, la barra de escribir, el pie de cada respuesta, Gasto de IA (filtro, por IA y tabla) y el Conector MCP (título y selector Claude/ChatGPT). `SegmentedControl` acepta un `icon` por opción.

## Actualización: animación mientras responde
- `ThinkingIndicator` al final de la respuesta mientras la IA trabaja: puntos que laten, texto con brillo que cambia ("Revisando los datos del panel…", o lo que está consultando ahora), barra de chocolate que avanza y segundos transcurridos. Clases `xoco-shimmer` y `xoco-progress` en globals.css (quietas con prefers-reduced-motion).
- Anillo que pulsa alrededor de Xoco y anillo que gira en el botón de detener, con "Xoco está respondiendo…".
- Corrección: el chat ya no se queda en "Abriendo chat…" (la carga ya no depende de un efecto que el modo estricto corre dos veces).

## Actualización: estilo ChatGPT al responder y escuchar respuesta
- `ThinkingIndicator` ahora como ChatGPT: punto que late + texto con brillo ("Pensando…", "Consultando …"); sin tarjeta, barra ni segundos.
- `TypingText`: el texto nuevo se escribe poco a poco con el punto al final; los chats abiertos del historial aparecen completos (`fresh` solo en lo recibido en la sesión).
- Pasos de consulta: solo los terminados ("✓ Consultó …"); el que está en curso lo dice el indicador.
- Quitados: el modelo bajo cada respuesta, el anillo alrededor de Xoco y el del botón de detener.
- `SpeakButton`: "Escuchar respuesta" con la voz del navegador (Web Speech API, voz en español; gratis y sin mandar el texto a otro servicio). Una respuesta a la vez; se lee sin formato y con "dólares".

## Actualización: Gasto de IA reordenado y sin el texto de las preguntas
- Filtros en una fila: período, IA (con íconos) y usuario ("Todos los usuarios" o uno).
- Números clave propios (sin textos cortados): Gasto, Consultas (con errores), Promedio por consulta, Tokens en formato corto.
- Gráfica por día con leyenda e información al pasar el mouse con los íconos de Claude y ChatGPT; al lado "Por IA" con barra de proporción.
- "Por usuario" como ranking con avatar y barra; tocar uno filtra todo.
- Registro de consultas sin la pregunta: fecha y hora, usuario, IA, consultas a datos, duración, tokens, costo y estado; tarjetas en celular, tabla con encabezado fijo en escritorio.
- Quitadas las notas al pie de Llaves de API y Gasto de IA.
- Menú: "IA" y "Xoco IA" usan a Xoco (`XocoNavIcon`) como ícono; `DashboardNavItem.icon` acepta un componente propio además de lucide.
- Título automático: al llegar el evento `title`, la barra lateral escribe el nuevo nombre letra por letra (`AnimatedTitle`), como ChatGPT.
- Menú reorganizado: grupo "Xoco IA" (Xoco a 24px, alineado con margen negativo) con Chat, Conectar MCP, Llaves de API y Gasto.
