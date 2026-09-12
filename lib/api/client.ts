import axios, { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api";
import { useAuthStore } from "@/store/auth-store";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export interface ApiError {
  message: string;
  status: number;
}

// El interceptor de abajo no es un componente/hook — no puede usar
// `useRouter()` directamente. `Providers` registra aquí, al montar la app,
// un callback que hace una navegación de cliente (router.push) en vez de un
// window.location.href, para que un 401 nunca provoque un refresh completo
// del navegador (ver app/providers.tsx).
let unauthorizedHandler: (() => void) | null = null;

// Un 401 que llega mientras no hay handler registrado (antes de que monte
// `Providers`, o entre el cleanup y el re-registro de su efecto) no se
// pierde ni se resuelve con una navegación dura: queda pendiente y se
// despacha en cuanto el handler vuelve a estar disponible.
let hasPendingUnauthorized = false;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;

  if (handler && hasPendingUnauthorized) {
    hasPendingUnauthorized = false;
    handler();
  }
}

function extractMessage(data: ApiErrorResponse | undefined): string {
  if (!data?.message) {
    return "No se pudo conectar con el servidor. Intenta de nuevo.";
  }
  return Array.isArray(data.message) ? data.message[0] : data.message;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status ?? 0;
    const message = extractMessage(error.response?.data);

    // POST /auth/login puede devolver 401 por credenciales inválidas — eso
    // es un error de formulario que la propia página debe mostrar, no una
    // sesión expirada. GET /auth/me queda fuera de esta lista porque sí es
    // un request autenticado (con el JWT ya adjunto) y su 401 sí significa
    // sesión expirada/token inválido.
    const isLoginRequest = (error.config?.url ?? "").includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      useAuthStore.getState().clear();

      if (typeof window !== "undefined") {
        // Limpia también la cookie httpOnly: si no se borra, la próxima vez
        // que se monte la app (incluso ya parado en /login) el token vencido
        // vuelve a fallar contra /auth/me y dispara este mismo bloque otra
        // vez. El DELETE es "fire and forget" — no bloquea la redirección.
        fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      }

      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else {
        hasPendingUnauthorized = true;
      }
    }

    const apiError: ApiError = { message, status };
    return Promise.reject(apiError);
  },
);

export function apiGet<T>(
  url: string,
  config?: Parameters<typeof apiClient.get>[1],
): Promise<T> {
  return apiClient.get<T>(url, config).then((res) => res.data);
}

export function apiPost<T>(
  url: string,
  data?: unknown,
  config?: Parameters<typeof apiClient.post>[2],
): Promise<T> {
  return apiClient.post<T>(url, data, config).then((res) => res.data);
}

export function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: Parameters<typeof apiClient.patch>[2],
): Promise<T> {
  return apiClient.patch<T>(url, data, config).then((res) => res.data);
}
