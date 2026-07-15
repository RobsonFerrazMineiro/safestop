import { z } from "zod";

const phonePattern = /^[\d\s()+.-]{8,20}$/;

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1, "Nome completo é obrigatório."),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value))
    .refine((value) => value === undefined || phonePattern.test(value), "Telefone inválido."),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
