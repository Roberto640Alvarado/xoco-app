import { z } from "zod";

export const requestStockSchema = z.object({
  productId: z.number({ message: "Elige un producto." }).int().positive("Elige un producto."),
  quantity: z.number({ message: "Ingresa una cantidad." }).min(0.01, "La cantidad debe ser mayor a 0."),
  note: z.string().optional(),
});

export type RequestStockFormValues = z.infer<typeof requestStockSchema>;
