# Solicitudes guiadas: vista previa, sustitutos y animaciones de envío

## Objetivo
Para personas que casi no usan laptop: formularios de Vendedor (pedir) y Despacho (responder) súper intuitivos, con vista previa en vivo de cómo va quedando, sustitutos "en lugar de", comentarios a la par, Despacho viendo el inventario de cada tienda y animaciones cuando el envío va en camino.

## Cambios realizados
- Sistema de diseño (README + showcase "Formularios guiados"): `HelpSteps`, `PreviewSheet`, `SuccessCelebration`, `DeliveryTruck` (road / depart) y `QuantityStepper size="lg"`. Todo respeta `prefers-reduced-motion`.
- Nueva solicitud (Vendedor): guía de 3 pasos que avanza sola, picker con botones grandes, vista previa "Así va tu pedido" con listón "Solo es una vista previa...", chips de nota rápida, botón "Enviar a planta" y pantalla "¡Pedido enviado!".
- Respuesta de Planta: guía de 3 pasos, "Hay todo / No hay / cantidad" grandes, comentario a la par con chips (No hay, Se acabó, No sé, Llega mañana, Solo hay esto), "Mandar otro en su lugar" (sustituto anidado bajo el original, abre en su categoría), "Agregar producto extra", link "Ver inventario de <tienda>", vista previa en vivo "Así le llega a la tienda" y, al despachar, animación del camión saliendo "¡Va en camino!".
- EN_CAMINO: camión rodando en la tarjeta y en el detalle (con hora de salida). Tablero con entrada escalonada de tarjetas. "¡Recibido!" al confirmar recepción.
- Sustitutos visibles en el detalle, la recepción y el PDF (`lib/substitution.ts`).
- Despacho: pestañas por tienda en Solicitudes (`StoreTabs`, con contador de nuevas por responder); la tienda elegida vive en la URL (`?tienda=`).
- Planta ve Conteo (solo lectura, cualquier tienda): middleware, menú, `InventoryView` con `?tienda=` (nuqs), textos y tour del Conteo para Planta.

## Razones del cambio
Pedido de Don Mario y del usuario: menos fricción para usuarios poco técnicos y trazabilidad de los sustitutos.

## Resultado final
`tsc` y ESLint sin errores en los archivos tocados. Pendiente: revisión visual con sesión iniciada y `npm run build`.

## Ajuste: el Admin también pide stock
- `NewRequestDialog` con `chooseStore`: el Super admin elige la tienda (primer paso de la guía, select resaltado hasta elegirla); envía `posConfigId`. El botón "Nueva solicitud" aparece para Vendedor y Super admin. La tienda confirma la recepción como siempre.
