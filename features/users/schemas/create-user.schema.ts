import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().email("El correo no es válido."),
    name: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "FINANZAS"], { message: "Elige un rol." }),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
