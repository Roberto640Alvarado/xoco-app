# Inicio por rol

## Objetivo
Una pantalla de Inicio que dé la bienvenida, muestre lo que falta por atender, accesos rápidos y lo nuevo del panel, distinta para cada rol. El Super admin siempre ve el anuncio de Xoco IA.

## Cambios realizados
- Ruta `/dashboard/inicio` (`features/home`): saludo según la hora de El Salvador (Buenos días 5–11, Buenas tardes 12–17, Buenas noches 18–4) con fecha, rol y tienda del Vendedor; anuncio "Xoco IA llegó a Xocolatísimo" (solo Super admin); "Para atender" con los avisos de Movimientos y Solicitudes según el rol; "Ir a" con accesos rápidos por rol; "Lo nuevo en el panel" con el apartado de cada novedad.
- Accesos y novedades respetan Permisos (moduleKey) y el acceso a Inventario del Vendedor.
- Todos los roles aterrizan en Inicio (`getDashboardPath`); "Inicio" es el primer ítem del menú; el middleware deja pasar `/dashboard/inicio` a Vendedor y Planta.
- Novedades y accesos se editan en `features/home/lib/home-content.ts`.

## Razones
Pedido del usuario: bienvenida, secciones por rol, novedades por apartado y redireccionamientos.

## Resultado final
Cada usuario entra a un Inicio hecho para su rol.
- Novedades: quitada la de menú/buscador; ahora en tarjetas (franja de color, ícono, apartado, título, descripción, fecha y "Ver") a todo el ancho, debajo de los accesos.
- Quitada la sección "Lo nuevo en el panel" de Inicio (a pedido del usuario); el anuncio de Xoco IA para el Super admin se queda.
- Ventas de hoy en Inicio (`GET /sales/today` en xoco-api): Admin y Finanzas ven todas las tiendas (vendido, órdenes, ticket, hora más fuerte, variación contra el mismo día de la semana pasada a la misma hora, tarjeta por tienda con mini barras por hora y gráfica por hora de todas); el Vendedor ve su tienda hora por hora contra la semana pasada. Se actualiza cada 2 minutos; mismo permiso que el Resumen (`dashboard.resumen`).
- Gráfica por hora del Admin: selector "Todas las tiendas" o una; tocar la tarjeta de una tienda también la elige (y otra vez vuelve a todas).
- Inicio de Planta (`GET /inventory/requests/summary`): pedidos de hoy, por preparar, en camino y recibidos hoy; tarjeta por tienda (se toca para filtrar) y gráfica de pedidos por día de los últimos 14 días con selector de tienda. Se actualiza cada minuto.
