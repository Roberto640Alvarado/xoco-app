"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal de "Agregar usuario" — antes vivía como card siempre visible
// arriba de la tabla; se movió a modal (mismo patrón que EditUserModal:
// Dialog controlado desde afuera, estado de éxito que auto-cierra) para
// que la vista de Usuarios abra directo en la tabla, igual que el resto
// de módulos del panel. `max-h-[85vh] overflow-y-auto` porque este
// formulario es más largo que el de editar (suma las 2 contraseñas) y no
// debe cortarse en viewports bajos (celular en horizontal, ventana
// chica). No hay invitación por correo ni link de activación — el admin
// escribe la contraseña 2 veces (password + confirmPassword, ver
// createUserSchema) y se la comparte al usuario nuevo por su cuenta; la
// cuenta queda lista para usarse de inmediato.
export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const createUser = useCreateUser();
  const [wasOpen, setWasOpen] = useState(false);

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

  // Reinicia formulario + mutación cada vez que el modal pasa de cerrado
  // a abierto — mismo criterio de "ajuste de estado durante el render"
  // que EditUserModal, para no arrastrar el éxito/error de la última vez
  // que se usó (ej. reabrir para dar de alta a un segundo usuario).
  if (open && !wasOpen) {
    setWasOpen(true);
    reset(DEFAULT_VALUES);
    createUser.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) onOpenChange(false);
  }

  function onSubmit(values: CreateUserFormValues) {
    createUser.mutate(
      { ...values, name: values.name?.trim() || undefined },
      { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) },
    );
  }

  const errorMessage = (createUser.error as ApiError | null)?.message;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="pt-0.5">
              <DialogTitle className="text-lg font-bold text-foreground">Agregar usuario</DialogTitle>
              <DialogDescription className="pt-1 leading-relaxed">
                Crea la cuenta con la contraseña que definas aquí — el usuario ya puede iniciar sesión con ella
                de inmediato.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {createUser.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Usuario creado correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-email">Correo</Label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="create-email"
                      type="email"
                      autoComplete="off"
                      placeholder="usuario@xocolatisimo.com"
                    />
                  )}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-name">Nombre (opcional)</Label>
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => <Input {...field} id="create-name" placeholder="María Pérez" />}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-role">Rol</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="create-role" className="w-full">
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
                <Label htmlFor="create-posConfigId">Tienda</Label>
                <Controller
                  control={control}
                  name="posConfigId"
                  render={({ field }) => (
                    <StoreSelect
                      stores={stores}
                      isLoading={storesLoading}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.posConfigId && <p className="text-xs text-destructive">{errors.posConfigId.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-password">Contraseña</Label>
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <PasswordInput {...field} id="create-password" autoComplete="new-password" />
                  )}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="create-confirmPassword">Confirmar contraseña</Label>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <PasswordInput {...field} id="create-confirmPassword" autoComplete="new-password" />
                  )}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createUser.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Creando...
                  </>
                ) : (
                  "Crear usuario"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
