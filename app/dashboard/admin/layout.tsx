"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

/**
 * Guarda de ruta para /dashboard/admin/**. Antes de esto, el único control
 * de rol era ocultar el link "Administración" del nav (ver
 * DashboardShell.visibleNavItems) — nada impedía que una sesión FINANZAS
 * entrara directamente por URL. El backend ya protege cada endpoint de
 * administración con @Roles(Role.SUPER_ADMIN) (UsersController,
 * OdooConfigController), así que esto es defensa en profundidad del lado
 * del cliente: evita que la UI llegue a renderizarse para quien no debería
 * verla, aunque los datos ya estén protegidos igual.
 *
 * Mismo patrón "esperar hidratación" que DashboardShell / app/not-found.tsx:
 * se revisa el store de cliente (rehidratado desde la cookie httpOnly)
 * recién cuando isHydrated es true, para no expulsar a un SUPER_ADMIN real
 * durante el parpadeo inicial del primer render.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, router]);

  if (!isHydrated || !user || user.role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return <>{children}</>;
}
