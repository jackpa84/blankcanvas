import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { createToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getBaseUrl } from "@/lib/url";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Só envia o e-mail se a conta existir, mas a resposta é sempre a mesma
  // para não revelar quais e-mails estão cadastrados.
  if (user) {
    try {
      const token = await createToken(user.id, "PASSWORD_RESET");
      const link = `${getBaseUrl(req)}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, link);
    } catch (err) {
      console.error("[forgot-password] Falha ao enviar e-mail:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
