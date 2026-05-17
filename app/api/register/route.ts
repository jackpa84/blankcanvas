import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { createToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getBaseUrl } from "@/lib/url";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta com esse e-mail" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Envia o link de confirmação. Uma falha no e-mail não deve impedir
  // o cadastro — o usuário pode reenviar depois pelo painel.
  try {
    const token = await createToken(user.id, "EMAIL_VERIFICATION");
    const link = `${getBaseUrl(req)}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, link);
  } catch (err) {
    console.error("[register] Falha ao enviar e-mail de verificação:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
