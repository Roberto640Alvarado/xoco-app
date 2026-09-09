"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useSetUserPassword } from "../hooks/use-set-user-password";
import { setUserPasswordSchema, type SetUserPasswordFormValues } from "../schemas/set-user-password.schema";
import type { AppUser } from "../types/users.types";
import type { ApiError } from "@/lib/api/client";

const DEFAULT_VALUES: SetUserPasswordFormValues = { password: "", confirmPassword: "" };

interface SetUserPasswordModalProps {
  user: AppUser | null;
  onOpenChange: (open: boolean) => void;
}

// Modal de "Cambiar contraseña" por usuario — mismo patrón que
// TicketGoalPercentModal (Dialog controlado desde afuera, estado de éxito
// que auto-cierra). `user` es null cuando está cerrado; se abre pasando el
// usuario objetivo (ver UsersTable).
export function SetUserPasswordModal({ user, onOpenChange }: SetUserPasswordModalProps) {
  const setPassword = useSetUserPassword();
  const [wasOpen, setWasOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SetUserPasswordFormValues>({
    resolver: zodResolver(setUserPasswordSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const open = user !== null;

  // Reset del form/mutación justo al ABRIRSE — mismo criterio de "ajuste
  // de estado durante el render" que TicketGoalPercentModal.
  if (open && !wasOpen) {
    setWasOpen(true);
    reset(DEFAULT_VALUES);
    setPassword.reset();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) onOpenChange(false);
  }

  function onSubmit(values: SetUserPasswordFormValues) {
    if (!user) return;
    setPassword.mutate(
      { id: user.id, ...values },
      { onSuccess: () => setTimeout(() => onOpenChange(false), 1200) },
    );
  }

  const errorMessage = (setPassword.error as ApiError | null)?.message;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <DialogTitle className="text-lg font-bold text-foreground">Cambiar contraseña</DialogTitle>
              {user && <p className="text-sm font-medium text-primary">{user.email}</p>}
            </div>
          </div>
          <DialogDescription className="pt-1 leading-relaxed">
            Define la nueva contraseña de esta cuenta. Queda activa de inmediato — comparte el usuario y la
            nueva contraseña con la persona por tu cuenta.
          </DialogDescription>
        </DialogHeader>

        {setPassword.isSuccess ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-medium text-primary">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Contraseña actualizada correctamente.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <PasswordInput {...field} id="new-password" autoComplete="new-password" autoFocus />
                )}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-new-password">Confirmar contraseña</Label>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <PasswordInput {...field} id="confirm-new-password" autoComplete="new-password" />
                )}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={setPassword.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={setPassword.isPending}>
                {setPassword.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  "Guardar contraseña"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
