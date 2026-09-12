"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSessionHydration } from "@/features/auth/hooks/use-session-hydration";
import { setUnauthorizedHandler } from "@/lib/api/client";

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
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
