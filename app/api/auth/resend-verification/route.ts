import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { getBaseUrl } from "@/lib/url";

// Reenvia o e-mail de confirmação para o usuário logado.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  try {
    const token = await createToken(user.id, "EMAIL_VERIFICATION");
    const link = `${getBaseUrl(req)}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, link);
  } catch (err) {
    console.error("[resend-verification] Falha ao enviar e-mail:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail agora" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
