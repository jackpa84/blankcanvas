import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AdminClient } from "@/components/AdminClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [users, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { boards: true, events: true, tasks: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  ]);

  return (
    <AdminClient
      currentUserId={admin.id}
      adminName={admin.name ?? admin.email}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        verified: Boolean(u.emailVerified),
        createdAt: u.createdAt.toISOString(),
        boards: u._count.boards,
        events: u._count.events,
        tasks: u._count.tasks,
      }))}
      logs={logs.map((l) => ({
        id: l.id,
        category: l.category,
        action: l.action,
        description: l.description,
        actorEmail: l.actorEmail,
        actorName: l.actorName,
        targetEmail: l.targetEmail,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
