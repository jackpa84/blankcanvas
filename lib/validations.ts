import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(60, "Nome muito longo"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha precisa de no mínimo 8 caracteres")
    .max(100, "Senha muito longa"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token ausente"),
  password: z
    .string()
    .min(8, "A senha precisa de no mínimo 8 caracteres")
    .max(100, "Senha muito longa"),
});

export const boardUpdateSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(120).optional(),
  data: z.unknown().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
