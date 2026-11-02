# Sección IA: Conector MCP y Xoco IA (próximamente)

## Objetivo
Una sección del panel, solo para Super admin, que explique cómo conectar Claude o ChatGPT al conector MCP de Xoco y muestre un adelanto del chat propio "Xoco IA" con diseño tipo ChatGPT y un agente de chocolate animado.

## Cambios realizados
- `features/ai-xoco`: `XocoAgent` (robot-bombón de chocolate con visor, ojos de luz que parpadean/escanean, ecualizador al hablar, antena con señal, anillo orbital y gota), `McpConnectorView`, `ChatComingSoonView`, `CopyButton`, contenido en `lib/connector-content.ts`.
- Rutas `/dashboard/ia-xoco` (Conector MCP) y `/dashboard/ia-xoco/chat` (Xoco IA, próximamente).
- Menú: grupo "IA" con "Conector MCP" y "Xoco IA (pronto)", solo SUPER_ADMIN; middleware bloquea `/dashboard/ia-xoco` a otros roles.
- La URL del conector es siempre la de producción (`NEXT_PUBLIC_MCP_URL` o Railway), no la de la API local.
- Responsive: portada, pasos, herramientas y el chat (barra lateral solo en escritorio, 2 sugerencias en celular).

## Razones
Pedido del usuario: un lugar en el panel para el conector y para el futuro chat, con identidad propia.

## Resultado final
Super admin ve la sección IA; los demás roles no la ven ni pueden entrar por URL.
