import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";
import { AgendaClient } from "@/components/AgendaClient";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [events, tasks, user] = await Promise.all([
    prisma.event.findMany({
      where: { userId: session.user.id },
      orderBy: { startsAt: "asc" },
    }),
    prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    }),
  ]);

  return (
    <AgendaClient
      initialEvents={events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt ? e.endsAt.toISOString() : null,
      }))}
      initialTasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        done: t.done,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      }))}
      userName={session.user.name ?? session.user.email ?? "Você"}
      isAdmin={user ? isAdminUser(user) : false}
    />
  );
}
