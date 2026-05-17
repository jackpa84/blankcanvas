import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventCreateSchema } from "@/lib/validations";
import { logEvent } from "@/lib/audit";

// Lista os eventos do usuário.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ events });
}

// Cria um novo evento.
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

  const parsed = eventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const event = await prisma.event.create({
    data: {
      userId: session.user.id,
      title: d.title,
      description: d.description ?? null,
      location: d.location ?? null,
      startsAt: d.startsAt,
      endsAt: d.endsAt ?? null,
    },
  });
  await logEvent({
    category: "CONTENT",
    action: "event.create",
    description: `${session.user.name ?? session.user.email} criou o evento "${event.title}"`,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    metadata: { eventId: event.id },
  });

  return NextResponse.json({ event }, { status: 201 });
}
