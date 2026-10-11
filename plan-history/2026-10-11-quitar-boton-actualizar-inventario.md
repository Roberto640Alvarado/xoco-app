# Quitar el botón "Actualizar inventario"

## Contexto
Con el índice de Odoo eliminado, el botón solo hacía un refetch manual de la lista, que ya carga sola al elegir tienda y se refresca al volver a la ventana.

## Cambios
- `features/inventory/components/inventory-view.tsx`: se elimina el botón "Actualizar inventario" y los imports `Loader2` / `RefreshCw`.
