import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { boardUpdateSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

// Fetch a single board (owner only).
export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || board.userId !== session.user.id) {
    return NextResponse.json({ error: "Quadro não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ board });
}

// Update a board's title and/or canvas data (owner only).
export async function PATCH(req: Request, { params }: RouteContext) {
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

  const parsed = boardUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const updateData: { title?: string; data?: Prisma.InputJsonValue } = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.data !== undefined) {
    updateData.data = parsed.data.data as Prisma.InputJsonValue;
  }
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const { id } = await params;
  const result = await prisma.board.updateMany({
    where: { id, userId: session.user.id },
    data: updateData,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Quadro não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// Delete a board (owner only).
export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await prisma.board.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Quadro não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
