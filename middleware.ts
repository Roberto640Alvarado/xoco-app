import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, decodeToken } from "@/lib/auth/decode-token";

const AUTH_ROUTES = ["/login"];

// Módulos permitidos para VENDEDOR — exactamente los 8 que tienen
// selector de tienda (ver StoreSelect / sales-filters.tsx y los 3
// daily-*-view.tsx), la misma lista que ya filtra el sidebar en
// dashboard-shell.tsx (filterNavItemsByRole). Esto es refuerzo de
// UX/seguridad-en-profundidad a nivel de RUTA (no solo ocultar el link) —
// el backend igual rechaza los datos con 403 si alguien fuerza la URL.
const VENDEDOR_ALLOWED_PATHS = [
  "/dashboard",
  "/dashboard/productos",
  "/dashboard/categorias",
  "/dashboard/visitas",
  "/dashboard/efectivo-otros-medios",
  "/dashboard/venta-diaria",
  "/dashboard/trafico-diario",
  "/dashboard/ticket-detallado",
];

function isVendedorAllowedRoute(pathname: string): boolean {
  return VENDEDOR_ALLOWED_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`),
  );
}

// Rutas reales de la app (fuera de /dashboard, que ya se cubre por
// prefijo). Cualquier otra ruta que no matchee ni esto ni /dashboard/* se
// considera "URL errónea" para efectos de a dónde mandar al usuario: sin
// sesión, a login (nunca ve el 404 — no hay nada que "no encontrar" si ni
// siquiera puede entrar); con sesión, sí se le muestra app/not-found.tsx.
const KNOWN_ROUTES = ["/", "/login"];

function isKnownRoute(pathname: string): boolean {
  return KNOWN_ROUTES.includes(pathname) || pathname.startsWith("/dashboard");
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const decoded = token ? decodeToken(token) : null;
  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isDashboardRoute = pathname.startsWith("/dashboard");
  // SUPER_ADMIN es el único rol con acceso a administración (usuarios,
  // configuración de Odoo) — FINANZAS solo ve ventas/reportes dentro de
  // /dashboard (ver CLAUDE.md, "Autorización").
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  // Sin sesión y la URL ni siquiera es una ruta conocida: a login
  // directamente, nunca al 404 — no hay registro público, así que no tiene
  // sentido dejarle "explorar" URLs sueltas antes de autenticarse.
  if (!decoded?.role && !isKnownRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Ya con sesión activa: no tiene sentido ver login de nuevo.
  if (isAuthRoute && decoded?.role) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDashboardRoute) {
    // Sin sesión (o token expirado/corrupto): a login.
    if (!decoded?.role) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // FINANZAS con sesión válida pero intentando entrar a una zona de
    // administración exclusiva de SUPER_ADMIN: lo regresamos a su panel.
    if (isAdminRoute && decoded.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // VENDEDOR solo puede entrar a sus 8 módulos con selector de tienda —
    // cualquier otra ruta de /dashboard/* (incluida /dashboard/admin, ya
    // cubierta arriba) lo regresa a su panel.
    if (decoded.role === "VENDEDOR" && !isVendedorAllowedRoute(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Antes solo cubría /login y /dashboard/:path* — ahora cubre todo menos
  // assets estáticos y las rutas internas de Next/API, para poder
  // interceptar URLs desconocidas antes de que lleguen al 404 (ver
  // isKnownRoute arriba). api/ queda afuera a propósito: incluye
  // /api/auth/session, la ruta que la propia app usa para leer/escribir la
  // cookie de sesión. También se excluyen extensiones de archivo estático
  // (svg, png, css, js, ...) — sin esto, un asset público (ej. un ícono
  // referenciado desde una página pública) quedaría atrapado por el
  // redirect a /login cuando no hay sesión, rompiendo su carga.
  matcher: [
    "/((?!_next/static|_next/image|favicon\.ico|api/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|json|map|woff|woff2)$).*)",
  ],
};
