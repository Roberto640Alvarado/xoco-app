"use client";

import { Suspense } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/hooks/use-login";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";
import type { ApiError } from "@/lib/api/client";

function LoginForm() {
  const login = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(values);
  }

  const errorMessage = (login.error as ApiError | null)?.message;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LogIn className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Xocolatísimo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicia sesión en el panel administrativo.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Correo</Label>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="tucorreo@xocolatisimo.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
            )}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                {...field}
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
              />
            )}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" disabled={login.isPending} className="mt-2 w-full">
          {login.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Iniciando sesión...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Iniciar sesión
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Acceso exclusivo para personal de Xocolatísimo (SUPER_ADMIN / FINANZAS).
        No hay registro público — tu cuenta la crea un administrador.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
