import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventUpdateSchema } from "@/lib/validations";
import { logEvent } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

// Atualiza um evento (apenas do dono).
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

  const parsed = eventUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const data: Prisma.EventUpdateManyMutationInput = {};
  if (d.title !== undefined) data.title = d.title;
  if (d.description !== undefined) data.description = d.description;
  if (d.location !== undefined) data.location = d.location;
  if (d.startsAt !== undefined) data.startsAt = d.startsAt;
  if (d.endsAt !== undefined) data.endsAt = d.endsAt;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const { id } = await params;
  const result = await prisma.event.updateMany({
    where: { id, userId: session.user.id },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// Exclui um evento (apenas do dono).
export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await prisma.event.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  await logEvent({
    category: "CONTENT",
    action: "event.delete",
    description: `${session.user.name ?? session.user.email} excluiu um evento`,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    metadata: { eventId: id },
  });

  return NextResponse.json({ ok: true });
}
