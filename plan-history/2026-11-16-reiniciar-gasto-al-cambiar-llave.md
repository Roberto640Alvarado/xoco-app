# Reiniciar el contador de Gasto al ingresar una llave de IA

## Objetivo

Al guardar una llave de API (Xoco IA → Llaves de API), preguntar si se reinicia el contador del Gasto de esa IA.

## Cambios realizados

### xoco-app
- `features/ai-xoco/components/ai-keys-view.tsx`: el modal de la llave tiene dos pasos. 1) Escribir la llave ("Continuar"). 2) "¿Reiniciar el contador del gasto de {IA}?" con "No, seguir sumando" / "Sí, reiniciar" (y "Atrás"). Recién ahí se prueba y guarda. Si la llave falla, vuelve al paso 1 con el error. Al terminar avisa si se reinició.
- `features/ai-xoco/api/ai-admin.api.ts`, `hooks/use-ai-admin.ts`: `resetUsage` en el PUT; con reinicio se vuelve a pedir el Gasto.
- `features/ai-xoco/types/ai-admin.types.ts`: `resets` en la respuesta de Gasto.
- `features/ai-xoco/components/ai-usage-view.tsx`: en "Por IA", "Contador reiniciado el …" bajo la IA reiniciada.

### xoco-api
- `prisma/schema.prisma`: modelo `AiUsageReset` (colección `ai_usage_resets`, uno por proveedor: `resetAt`, `resetByEmail`).
- `repositories/ai-usage-resets.repository.ts` (nuevo) y registro en `ai-chat.module.ts`.
- `dto/save-ai-key.dto.ts`: `resetUsage?: boolean`.
- `AiKeysService.save`: si se pidió y la llave se guardó, llama a `AiUsageService.resetCounter`.
- `AiUsageService.find`: excluye las consultas de un proveedor anteriores a su reinicio (resumen y listado) y devuelve `resets`.
- Tests: reinicio solo con llave guardada y pedida; exclusión por reinicio en el resumen y el listado.

## Razones del cambio

Al cambiar de cuenta o recargar crédito, el Gasto acumulado de la llave anterior ya no sirve para saber cuánto se ha gastado de la nueva.

## Resultado final

No se borra nada de `ai_usage_logs`: el reinicio solo mueve desde cuándo cuenta el Gasto de esa IA. Vive aparte de la llave, así que quitar la llave no lo deshace. Hay que correr `npx prisma generate` en xoco-api.
