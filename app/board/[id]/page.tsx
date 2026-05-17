import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BoardEditor } from "@/components/BoardEditor";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board || board.userId !== session.user.id) notFound();

  return (
    <BoardEditor
      board={{ id: board.id, title: board.title, data: board.data }}
    />
  );
}
