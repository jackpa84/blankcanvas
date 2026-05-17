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

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(160),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
});

export const eventUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(160),
  notes: z.string().trim().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.coerce.number().int().min(1).max(3).optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  priority: z.coerce.number().int().min(1).max(3).optional(),
  done: z.boolean().optional(),
});

export const roleUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

// Um bloco da página "Cola": texto digitado/colado ou imagem (data URL).
export const pasteBlockSchema = z.object({
  id: z.string().trim().min(1).max(64),
  kind: z.enum(["text", "image"]),
  // 6 MB cobre data URLs de imagens coladas sem precisar de upload externo.
  value: z.string().max(6_000_000),
});

export const pasteSchema = z.object({
  blocks: z.array(pasteBlockSchema).max(100),
});

export type PasteBlock = z.infer<typeof pasteBlockSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
