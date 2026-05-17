import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validations";
import { logEvent } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

// Atualiza uma tarefa (apenas do dono).
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

  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const data: Prisma.TaskUpdateManyMutationInput = {};
  if (d.title !== undefined) data.title = d.title;
  if (d.notes !== undefined) data.notes = d.notes;
  if (d.dueDate !== undefined) data.dueDate = d.dueDate;
  if (d.priority !== undefined) data.priority = d.priority;
  if (d.done !== undefined) data.done = d.done;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const { id } = await params;
  const result = await prisma.task.updateMany({
    where: { id, userId: session.user.id },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// Exclui uma tarefa (apenas do dono).
export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await prisma.task.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  await logEvent({
    category: "CONTENT",
    action: "task.delete",
    description: `${session.user.name ?? session.user.email} excluiu uma tarefa`,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    metadata: { taskId: id },
  });

  return NextResponse.json({ ok: true });
}
