import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "xoco_token";
const AUTH_ROUTES = ["/login"];

type Role = "SUPER_ADMIN" | "FINANZAS";

interface DecodedToken {
  role?: Role;
  exp?: number;
}

/**
 * Decodifica el payload del JWT sin verificar la firma. Sirve únicamente
 * para decisiones de UX en el edge (a qué ruta redirigir); la autorización
 * real siempre la valida xoco-api con la firma completa vía el header
 * Authorization en cada request (JwtAuthGuard + RolesGuard).
 */
function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf-8");
    const decoded = JSON.parse(json) as DecodedToken;

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const decoded = token ? decodeToken(token) : null;
  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isDashboardRoute = pathname.startsWith("/dashboard");
  // SUPER_ADMIN es el único rol con acceso a administración (usuarios,
  // configuración de Odoo) — FINANZAS solo ve ventas/reportes dentro de
  // /dashboard (ver CLAUDE.md, "Autorización").
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
