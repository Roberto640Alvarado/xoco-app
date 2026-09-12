# Rediseño del sidebar (referencia visual "Sequence")

## Objetivo

El usuario pidió que el sidebar del panel siguiera el diseño de una captura
de referencia (un dashboard fintech llamado "Sequence": panel gris con
secciones agrupadas "GENERAL"/"SUPPORT", ítem activo como pill blanco con
texto/ícono teal, botón de colapsar arriba a la derecha del logo, y una
tarjeta de usuario al fondo) — "mejoralo" y confirmar que quede responsive.

## Cambios realizados

- `app/globals.css`: tokens `--sidebar*` (claro y oscuro) rediseñados —
  panel gris suave (antes casi blanco), acento teal (`#0f6e64` claro /
  `#34d0b8` oscuro) para el ítem activo, pill activo en blanco/`--card`
  sobre el panel gris. El resto de los tokens (`--primary`, etc., usados en
  el resto de la app) NO se tocó — el teal queda acotado al sidebar, igual
  que `--chart-1` es un acento acotado a las gráficas.
- `components/layout/dashboard-shell.tsx`:
  - `DashboardNavItem` gana un campo `group` (sección del sidebar).
  - El nav ahora se agrupa en secciones con label en mayúsculas
    (`SidebarGroupLabel`), orden fijo `GROUP_ORDER = ["General",
    "Reportes", "Sistema"]` — un grupo sin ítems visibles para el rol
    actual (ej. "Sistema" para FINANZAS) no se renderiza.
  - Ítem activo: pill más alto y redondeado (`h-11 rounded-xl`, antes
    `h-8 rounded-md`) con sombra sutil — mismo mecanismo de
    `data-active:bg-sidebar-accent` que ya traía el bloque de shadcn, solo
    cambian los tokens y el tamaño/radio.
  - Header: botón para colapsar a modo ícono movido DENTRO del propio
    sidebar (junto al logo, como en la referencia), estilizado como caja
    con borde — visible solo en escritorio (`hidden md:flex`); el trigger
    del topbar se mantiene intacto porque es el único que sirve para
    reabrir en móvil / desde modo ícono.
  - Footer: `ThemeToggle` y "Salir" pasan de botones sueltos a filas
    ghost de ícono + texto (mismo lenguaje visual que "Settings"/"Help" de
    la referencia), separador, y la tarjeta de usuario ahora con borde y
    fondo propio (antes flotaba sin tarjeta).
- `app/dashboard/layout.tsx`: cada item de `NAV_ITEMS` declara su `group`
  y se reordenó el arreglo (Ventas/Productos/Visitas primero, luego los 7
  reportes, luego Administración) para que coincida con el orden visual.

## Razones del cambio

- No se copiaron ítems del panel de referencia que no existen en este
  producto ("Payment", "Cards", "Capital", "Vaults", "Pro Mode" — son
  específicos de un fintech). Se adaptó el PATRÓN VISUAL (agrupado, pill
  activo, tarjeta de usuario, botón de colapso junto al logo) al contenido
  real del panel, no el contenido literal de la captura.
- Se descartó un chevron decorativo en la tarjeta de usuario (la
  referencia sugiere un selector de cuenta): agregarlo sin funcionalidad
  real sería un affordance falso. Si más adelante se quiere un menú ahí
  (tema + cerrar sesión), es un cambio aparte que instala
  `dropdown-menu` de shadcn.
- El teal se acotó a los tokens `--sidebar*` en vez de cambiar `--primary`
  global — cambiar el color de marca de toda la app (botones, links, etc.)
  es una decisión mayor que no se pidió.

## Resultado final

`npx tsc --noEmit` y `npm run lint` sin errores (mismo warning preexistente
de siempre en `lib/api/client.ts`, ajeno a este cambio). Repaso manual de
las clases `group-data-[collapsible=icon]:*` contra el ancho real del modo
ícono (3rem) para que el logo-badge y la tarjeta de usuario no se
desborden.

**No se pudo verificar visualmente** (mismo límite que el resto de este
plan-history: el puente remoto no sostiene un `npm run dev` vivo para
apuntarle un navegador aparte). Vale la pena que el usuario lo abra con
`npm run dev` y confirme sobre todo: el colapso a modo ícono, el drawer en
una ventana angosta (móvil) y el contraste del teal en modo oscuro.
