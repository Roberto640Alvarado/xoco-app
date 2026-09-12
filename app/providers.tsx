"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSessionHydration } from "@/features/auth/hooks/use-session-hydration";
import { setModuleDisabledHandler, setUnauthorizedHandler } from "@/lib/api/client";

function AuthHydrator() {
  useSessionHydration();
  return null;
}

/**
 * Registra, al montar la app, la navegación que el interceptor de axios usa
 * cuando un request autenticado responde 401 (sesión vencida) — siempre un
 * router.push de cliente, para que nunca provoque un refresh completo del
 * navegador. Si el 401 llegó antes de este registro, el cliente lo dejó
 * pendiente y se despacha aquí mismo (ver lib/api/client.ts).
 */
function UnauthorizedRedirector() {
  const router = useRouter();

  useEffect(() => {
    setUnauthorizedHandler(() => router.push("/login"));
    return () => setUnauthorizedHandler(null);
  }, [router]);

  return null;
}

/**
 * Igual que UnauthorizedRedirector, pero para el 403 MODULE_DISABLED
 * (panel "Permisos", Fase 3 de RBAC) — la sesión sigue siendo válida, solo
 * se saca al usuario de la pantalla cuyo módulo fue apagado, de vuelta al
 * dashboard (no a /login).
 */
function ModuleDisabledRedirector() {
  const router = useRouter();

  useEffect(() => {
    setModuleDisabledHandler(() => router.push("/dashboard"));
    return () => setModuleDisabledHandler(null);
  }, [router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <AuthHydrator />
            <UnauthorizedRedirector />
            <ModuleDisabledRedirector />
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
