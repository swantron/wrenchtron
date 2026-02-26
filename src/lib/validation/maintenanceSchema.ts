import { z } from "zod";

export const maintenanceFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  cost: z.coerce.number().min(0, "Cost must be 0 or greater").optional(),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;
