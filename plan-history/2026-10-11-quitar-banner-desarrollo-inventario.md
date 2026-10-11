# Quitar el aviso "Inventario está en desarrollo"

## Pedido
Quitar el banner amarillo de la pantalla de Conteo.

## Qué se hizo
- Se eliminó `InDevelopmentBanner` de `features/inventory/components/inventory-view.tsx`. El componente compartido `components/ui/in-development-banner.tsx` se conserva por si otros módulos lo usan.
