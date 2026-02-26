import { z } from "zod";

export const vehicleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  year: z.coerce.number({ error: "Year is required" }).int().min(1900, "Year must be 1900 or later").max(2100, "Year must be 2100 or earlier"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  currentMileage: z.coerce.number().int().min(0, "Mileage must be 0 or greater").optional(),
  estimatedAnnualMileage: z.coerce.number().int().min(0).optional(),
  engine: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/, "VIN must be exactly 17 characters (letters and numbers, no I, O, or Q)").optional().or(z.literal("")),
  licensePlate: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
