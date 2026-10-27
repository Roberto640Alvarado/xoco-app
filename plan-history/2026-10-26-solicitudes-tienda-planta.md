# Solicitudes de stock tienda → planta → tienda (rol Planta)

## Objetivo

Reemplazar el flujo viejo de Inventario → Solicitudes (una solicitud por producto, aceptada y confirmada por Admin/Finanzas) por el flujo real de despacho del "Formato envío a sucursales":

1. La tienda arma un pedido con varios productos, por categoría.
2. Planta (rol nuevo) marca qué sí y qué no hay, puede agregar productos y despacha; la tienda recibe el aviso.
3. La tienda solo confirma lo recibido (con observación si hay diferencia) y recién ahí sube su inventario.
4. Admin/Finanzas solo hacen seguimiento (y cancelan); Admin sigue actualizando el inventario directo en Conteo.
5. Planta solo ve Inventario → Solicitudes.

## Cambios realizados

- Rol `PLANTA` en auth, usuarios (crear/editar/tabla) y Permisos (pestaña y módulo `dashboard.inventario-solicitudes`).
- Middleware y menú: Planta entra directo a `/dashboard/inventario/solicitudes`, cualquier otra ruta la regresa ahí; los ítems del menú sin `roles` se ocultan para Planta. `getDashboardPath(role)` decide el inicio.
- Nuevo `features/stock-requests/`: tipos, API, hooks (listado con refresco cada 30 s, catálogo, avisos) y acciones. Pantalla en tablero de tarjetas con avance, chips de estado (Por responder/Por confirmar según rol), detalle por categoría con seguimiento, editor de planta (Todo / cantidad / No hay, agregar productos, guardar avance, despachar), recepción de la tienda (parte de lo enviado y exige observación si difiere) y cancelar con motivo.
- PDF del formato (jsPDF + jspdf-autotable, carga bajo demanda): por categoría, con Pedido/Enviado/Recibido/DIF, observaciones y firmas de planta y tienda.
- Avisos: el menú suma el globo de Solicitudes (planta: por responder; tienda: envíos por confirmar) y el de Movimientos queda solo para merma/regalía/degustación.
- Conteo: columna y orden por categoría; el Excel incluye Categoría.
- Se elimina el flujo viejo: vista/diálogo de solicitud por producto, hooks de aceptar y recibir, y toda la lógica ENTRADA de la tabla de Movimientos.
- Guías/tour de Inventario reescritas para Admin, Finanzas, Vendedor y Planta; nuevo ⓘ de estados de solicitud.
- Design system: `QuantityStepper` y `ProgressSteps` (README + showcase).

## Razones del cambio

El flujo de una solicitud por producto con aprobación de Admin no reflejaba cómo trabaja planta con las tiendas. Ahora cada parte hace solo lo suyo y Admin/Finanzas dejan de ser cuello de botella.

## Resultado final

`tsc` y `eslint` sin errores nuevos (los avisos `incompatible-library` de los modales de usuarios ya existían). `next build` no se pudo completar en el entorno de trabajo porque no alcanza Google Fonts; conviene correrlo en local. Requiere el backend `xoco-api` con el mismo plan.
