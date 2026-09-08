import { z } from "zod";

export const rotateOdooConfigSchema = z.object({
  apiKey: z.string().min(8, "El API key no parece válido (muy corto)."),
  uid: z.coerce.number().int().min(1, "El uid debe ser un número entero positivo."),
  durationDays: z.coerce.number().int().min(1, "La duración debe ser de al menos 1 día."),
});

export type RotateOdooConfigFormValues = z.infer<typeof rotateOdooConfigSchema>;
