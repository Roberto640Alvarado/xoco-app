"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { getDashboardPath } from "@/features/auth/utils/get-dashboard-path";

/**
 * 404 de la app. El middleware (ver middleware.ts) ya redirige a /login
 * cualquier URL desconocida cuando no hay sesión, así que en el flujo
 * normal esta página solo se alcanza con sesión activa. Se repite la
 * verificación acá (contra el store de cliente, ya hidratado desde la
 * cookie httpOnly por AuthHydrator en app/providers.tsx) como segunda capa
 * — nunca debe quedar expuesta a alguien sin sesión, ni siquiera en una
 * navegación de cliente que el middleware no vuelva a interceptar.
 *
 * Se hace client-side (en vez de leer la cookie con `cookies()` en un
 * Server Component) a propósito: `cookies()` es una API dinámica y, al
 * usarse en el 404 raíz (potencial fallback de cualquier ruta), forzaba a
 * Next a renderizar TODA la app dinámicamente en vez de solo esta página.
 * Mismo patrón de "esperar hidratación" que ya usa DashboardShell.
 */
export default function NotFound() {
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="text-2xl font-semibold text-foreground">Página no encontrada</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          La página que buscas no existe o se movió de lugar.
        </p>
      </div>

      <Button render={<Link href={getDashboardPath()} />}>
        <Home className="h-4 w-4" aria-hidden="true" />
        Ir al inicio
      </Button>
    </div>
  );
}
