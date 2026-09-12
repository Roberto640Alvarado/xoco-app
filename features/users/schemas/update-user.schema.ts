import { z } from "zod";

export const updateUserSchema = z
  .object({
    email: z.string().email("El correo no es válido."),
    name: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "FINANZAS", "VENDEDOR"], { message: "Elige un rol." }),
    // Solo requerido cuando role === "VENDEDOR" (ver .refine abajo).
    posConfigId: z.number().int().positive().optional(),
  })
  .refine((data) => data.role !== "VENDEDOR" || data.posConfigId !== undefined, {
    message: "Elige la tienda del vendedor.",
    path: ["posConfigId"],
  });

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
