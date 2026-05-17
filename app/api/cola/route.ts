import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pasteSchema } from "@/lib/validations";

// Substitui o conteúdo da "Cola" do usuário (salvamento automático).
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = pasteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const blocks = parsed.data.blocks;
  await prisma.paste.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, blocks },
    update: { blocks },
  });

  return NextResponse.json({ ok: true });
}
