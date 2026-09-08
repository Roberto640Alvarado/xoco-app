export const AUTH_COOKIE_NAME = "xoco_token";

export type Role = "SUPER_ADMIN" | "FINANZAS";

export interface DecodedToken {
  role?: Role;
  exp?: number;
}

/**
 * Decodifica el payload del JWT sin verificar la firma. Sirve únicamente
 * para decisiones de UX en el edge/servidor (a qué ruta redirigir); la
 * autorización real siempre la valida xoco-api con la firma completa vía
 * el header Authorization en cada request (JwtAuthGuard + RolesGuard).
 *
 * Compartido entre middleware.ts (edge runtime) y app/not-found.tsx (RSC) —
 * ambos necesitan saber "¿hay una sesión con pinta de válida?" antes de
 * decidir a dónde mandar al usuario.
 */
export function decodeToken(token: string): DecodedToken | null {
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
