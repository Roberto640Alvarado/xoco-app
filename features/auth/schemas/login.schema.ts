import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("El correo no es válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
