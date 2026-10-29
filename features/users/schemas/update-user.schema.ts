import { z } from "zod";

export const updateUserSchema = z
  .object({
    email: z.string().email("El correo no es válido."),
    name: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "FINANZAS", "VENDEDOR", "PLANTA"], { message: "Elige un rol." }),
    // Solo requerido cuando role === "VENDEDOR" (ver .refine abajo).
    posConfigId: z.number().int().positive().optional(),
    // Acceso individual a Inventario — solo se envía/guarda para VENDEDOR
    // (mismo criterio que UpdateUserDto en la API).
    inventoryEnabled: z.boolean(),
  })
  .refine((data) => data.role !== "VENDEDOR" || data.posConfigId !== undefined, {
    message: "Elige la tienda del vendedor.",
    path: ["posConfigId"],
  });

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
