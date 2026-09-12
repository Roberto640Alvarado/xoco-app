"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreSelect } from "@/components/filters/store-select";
import { useStores } from "@/features/sales/hooks/use-stores";
import { useUpdateUser } from "../hooks/use-update-user";
import { updateUserSchema, type UpdateUserFormValues } from "../schemas/update-user.schema";
import type { AppUser } from "../types/users.types";
import type { ApiError } from "@/lib/api/client";

const ROLE_OPTIONS: Array<{ value: UpdateUserFormValues["role"]; label: string }> = [
  { value: "FINANZAS", label: "Finanzas" },
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "VENDEDOR", label: "Vendedor" },
];

interface EditUserModalProps {
  user: AppUser | null;
  isSelf: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal de "Editar usuario" (correo, nombre, rol) — mismo patrón que
// SetUserPasswordModal (Dialog controlado desde afuera, precarga al
// abrirse, estado de éxito que auto-cierra). El rol sale deshabilitado
// cuando `isSelf` — el backend rechaza (403) que un SUPER_ADMIN cambie su
// propio rol, así que ni se ofrece como opción acá.
export function EditUserModal({ user, isSelf, onOpenChange }: EditUserModalProps) {
  const updateUser = useUpdateUser();
  const [wasOpen, setWasOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { email: "", name: "", role: "FINANZAS", posConfigId: undefined },
  });

  const { data: stores, isLoading: storesLoading } = useStores();
  const role = watch("role");

  const open = user !== null;

  // Precarga con los datos ACTUALES del usuario justo al abrirse — mismo
  // criterio de "ajuste de estado durante el render" que los otros
  // modales de este proyecto (ver TicketGoalPercentModal).
  if (open && !wasOpen && user) {
    setWasOpen(true);
    reset({ email: user.email, name: user.name ?? "", role: user.role, posConfigId: user.posConfigId ?? undefined });
    updateUser.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) onOpenChange(false);
  }

  function onSubmit(values: UpdateUserFormValues) {
    if (!user) return;
    updateUser.mutate(
      { id: user.id, ...values, name: values.name?.trim() || undefined },
      { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) },
    );
  }

  const errorMessage = (updateUser.error as ApiError | null)?.message;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Pencil className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <DialogTitle className="text-lg font-bold text-foreground">Editar usuario</DialogTitle>
              {user && <p className="text-sm font-medium text-primary">{user.email}</p>}
            </div>
          </div>
          <DialogDescription className="pt-1 leading-relaxed">
            Cambia el correo, el nombre o el rol de esta cuenta.
          </DialogDescription>
        </DialogHeader>

        {updateUser.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Usuario actualizado correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Correo</Label>
              <Controller
                control={control}
                name="email"
                render={({ field }) => <Input {...field} id="edit-email" type="email" autoComplete="off" />}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Nombre (opcional)</Label>
              <Controller
                control={control}
                name="name"
                render={({ field }) => <Input {...field} id="edit-name" placeholder="María Pérez" />}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role">Rol</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                    <SelectTrigger id="edit-role" className="w-full">
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
              {isSelf && (
                <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol.</p>
              )}
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            {role === "VENDEDOR" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-posConfigId">Tienda</Label>
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

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateUser.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
