# Recetas por tienda

## Objetivo
Administración → Recetas: el Super admin elige la tienda, el producto vendido y lo que gasta cada uno (ej. Americano → 1 cápsula Pacamara).

## Cambios realizados
- Feature `features/recipes` (api, hooks, tipos, `RecipesView`, `RecipeEditorDialog`, `ProductSearch`) y página `app/dashboard/admin/recetas`. Tarjeta en el inicio de Administración y guía `admin-recetas`.
- Vista: tienda, "Copiar de otra tienda", "Nueva receta"; tarjetas por receta con lo que descuenta, Editar/Quitar (con confirmación); estado vacío que explica con un ejemplo.
- Editor: guía de 3 pasos, buscador del producto vendido y de ingredientes, cantidades con stepper grande y vista previa en palabras ("Cada vez que se venda 1 Americano: − 1 Cápsula Pacamara") con ejemplo de 3 ventas.
- Conteo: los productos por receta muestran "Por receta" y no piden cantidad (tampoco entran en el "vacío = 0").
- `ConfirmDialog` acepta `children` (selector de la tienda de origen al copiar).

## Razones del cambio
Ver plan-history de xoco-api del mismo día.

## Resultado final
`tsc` y ESLint sin errores.

## Ajuste: Recetas pasa a Inventario
- Ruta `app/dashboard/inventario/recetas` (antes `admin/recetas`), en el submenú Inventario solo para SUPER_ADMIN. Fuera la tarjeta de Administración y la guía `admin-recetas`; ahora es la página `recetas` de la guía de Inventario (con su tour). El encabezado es un `SectionCard` con los controles en una línea.
