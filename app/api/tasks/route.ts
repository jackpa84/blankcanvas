import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { taskCreateSchema } from "@/lib/validations";
import { logEvent } from "@/lib/audit";

// Lista as tarefas do usuário.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ tasks });
}

// Cria uma nova tarefa.
export async function POST(req: Request) {
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

  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      title: d.title,
      notes: d.notes ?? null,
      dueDate: d.dueDate ?? null,
      priority: d.priority ?? 2,
    },
  });
  await logEvent({
    category: "CONTENT",
    action: "task.create",
    description: `${session.user.name ?? session.user.email} criou a tarefa "${task.title}"`,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    metadata: { taskId: task.id },
  });

  return NextResponse.json({ task }, { status: 201 });
}
