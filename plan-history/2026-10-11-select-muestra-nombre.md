# Selects de producto y motivo muestran el nombre, no el id

## Contexto
En "Solicitar stock" y "Registrar movimiento", al elegir un producto el campo mostraba el id (ej. "260") en vez del nombre; el motivo mostraba el valor interno (ej. "MERMA").

## Cambios
- `request-stock-dialog.tsx` y `create-movement-dialog.tsx`: `SelectValue` con función que busca el nombre en la lista (mismo patrón que `StoreSelect` y el Registro), con el placeholder cuando no hay selección.
