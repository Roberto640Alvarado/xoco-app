import { z } from "zod";

export const updateUserSchema = z.object({
  email: z.string().email("El correo no es válido."),
  name: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "FINANZAS"], { message: "Elige un rol." }),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
