import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/audit";

// List the current user's boards.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const boards = await prisma.board.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ boards });
}

// Create a new empty board.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const board = await prisma.board.create({
    data: { userId: session.user.id },
    select: { id: true },
  });

  await logEvent({
    category: "CONTENT",
    action: "board.create",
    description: `${session.user.name ?? session.user.email} criou um quadro`,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    metadata: { boardId: board.id },
  });

  return NextResponse.json({ id: board.id }, { status: 201 });
}
