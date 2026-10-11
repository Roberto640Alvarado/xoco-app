import { z } from "zod";

export const createMovementSchema = z.object({
  productId: z.number({ message: "Elige un producto." }).int().positive("Elige un producto."),
  type: z.enum(["MERMA", "REGALIA", "DEGUSTACION", "ENTRADA"], { message: "Elige un motivo." }),
  quantity: z
    .number({ message: "Ingresa una cantidad." })
    .min(0.01, "La cantidad debe ser mayor a 0."),
  note: z.string().optional(),
});

export type CreateMovementFormValues = z.infer<typeof createMovementSchema>;
