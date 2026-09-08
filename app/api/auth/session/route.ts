import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "xoco_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días, en línea con JWT_EXPIRATION del backend

const JWT_SHAPE_REGEX = /^[\w-]+\.[\w-]+\.[\w-]+$/;

/**
 * Guarda el JWT recibido tras login en una cookie httpOnly. El middleware
 * la lee (sin verificar firma) para proteger rutas por rol.
 */
export async function POST(request: NextRequest) {
  const { accessToken } = (await request.json()) as { accessToken?: string };

  // Validación de forma (3 segmentos base64url): la firma la valida siempre
  // xoco-api en cada request, pero rechazamos aquí cualquier valor que ni
  // siquiera tenga forma de JWT antes de guardarlo en la cookie.
  if (!accessToken || !JWT_SHAPE_REGEX.test(accessToken)) {
    return NextResponse.json({ message: "accessToken inválido." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

/**
 * Rehidrata el store de cliente al cargar la app leyendo la cookie httpOnly
 * desde el servidor (JS del navegador no puede leerla directamente).
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(COOKIE_NAME)?.value ?? null;

  return NextResponse.json({ data: { accessToken } });
}

/** Cierra sesión: limpia la cookie httpOnly. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
