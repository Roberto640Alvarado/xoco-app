"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreSelect } from "@/components/filters/store-select";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useCreateUser } from "../hooks/use-create-user";
import { createUserSchema, type CreateUserFormValues } from "../schemas/create-user.schema";
import type { ApiError } from "@/lib/api/client";

const ROLE_OPTIONS: Array<{ value: CreateUserFormValues["role"]; label: string }> = [
  { value: "FINANZAS", label: "Finanzas" },
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "VENDEDOR", label: "Vendedor" },
];

const DEFAULT_VALUES: CreateUserFormValues = {
  email: "",
  name: "",
  role: "FINANZAS",
  posConfigId: undefined,
  password: "",
  confirmPassword: "",
};

// Formulario para dar de alta un usuario nuevo. No hay invitación por
// correo ni link de activación (ver plan-history "gestion-usuarios") — el
// admin escribe la contraseña 2 veces (password + confirmPassword, ver
// createUserSchema) y se la comparte al usuario nuevo por su cuenta; la
// cuenta queda lista para usarse de inmediato.
export function CreateUserForm() {
  const createUser = useCreateUser();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { data: stores, isLoading: storesLoading } = useStores();
  const role = watch("role");

  function onSubmit(values: CreateUserFormValues) {
    createUser.mutate(
      { ...values, name: values.name?.trim() || undefined },
      { onSuccess: () => reset(DEFAULT_VALUES) },
    );
  }

  const errorMessage = (createUser.error as ApiError | null)?.message;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="pt-0.5">
          <h2 className="text-sm font-medium text-foreground">Agregar usuario</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Crea la cuenta con la contraseña que definas aquí — el usuario ya puede iniciar sesión con ella de
            inmediato.
          </p>
        </div>
      </div>

      {createUser.isSuccess && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Usuario creado correctamente.
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo</Label>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input {...field} id="email" type="email" autoComplete="off" placeholder="usuario@xocolatisimo.com" />
              )}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => <Input {...field} id="name" placeholder="María Pérez" />}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role">Rol</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="role" className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
        </div>

        {role === "VENDEDOR" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="posConfigId">Tienda</Label>
            <Controller
              control={control}
              name="posConfigId"
              render={({ field }) => (
                <StoreSelect
                  stores={stores}
                  isLoading={storesLoading}
                  value={field.value}
                  onChange={field.onChange}
                  className="sm:w-56"
                />
              )}
            />
            {errors.posConfigId && <p className="text-xs text-destructive">{errors.posConfigId.message}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Controller
              control={control}
              name="password"
              render={({ field }) => <PasswordInput {...field} id="password" autoComplete="new-password" />}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <PasswordInput {...field} id="confirmPassword" autoComplete="new-password" />
              )}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={createUser.isPending} className="w-fit">
          {createUser.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creando...
            </>
          ) : (
            "Crear usuario"
          )}
        </Button>
      </form>
    </div>
  );
}
