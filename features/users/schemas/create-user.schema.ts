import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().email("El correo no es válido."),
    name: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "FINANZAS", "VENDEDOR"], { message: "Elige un rol." }),
    // Solo requerido cuando role === "VENDEDOR" (ver .refine abajo) — un
    // Vendedor se crea asignado a exactamente una tienda.
    posConfigId: z.number().int().positive().optional(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "VENDEDOR" || data.posConfigId !== undefined, {
    message: "Elige la tienda del vendedor.",
    path: ["posConfigId"],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
