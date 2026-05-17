import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";
import { pasteBlockSchema } from "@/lib/validations";
import { ColaClient } from "@/components/ColaClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cola",
  description: "Cole texto e imagens num espaço só seu, salvo automaticamente.",
};

export default async function ColaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [paste, user] = await Promise.all([
    prisma.paste.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    }),
  ]);

  // O JSON do banco é validado aqui — blocos malformados são descartados.
  const parsed = z.array(pasteBlockSchema).safeParse(paste?.blocks ?? []);

  return (
    <ColaClient
      initialBlocks={parsed.success ? parsed.data : []}
      userName={session.user.name ?? session.user.email ?? "Você"}
      isAdmin={user ? isAdminUser(user) : false}
    />
  );
}
