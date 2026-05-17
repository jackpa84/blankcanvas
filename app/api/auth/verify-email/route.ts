import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { consumeToken } from "@/lib/tokens";

// Alvo do link enviado por e-mail. Valida o token, marca o e-mail como
// verificado e redireciona para uma página amigável com o resultado.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");

  const resultUrl = (status: string) =>
    NextResponse.redirect(new URL(`/verify-email?status=${status}`, req.url));

  if (!token) return resultUrl("invalid");

  const userId = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!userId) return resultUrl("invalid");

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return resultUrl("success");
}
