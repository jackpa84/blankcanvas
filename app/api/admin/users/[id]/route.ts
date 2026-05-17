import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin";
import { roleUpdateSchema } from "@/lib/validations";
import { logEvent } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  USER: "Usuário",
};

// Altera o papel (permissão) de um usuário — somente administradores.
export async function PATCH(req: Request, { params }: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = roleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Você não pode alterar o seu próprio papel" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }

  const { role } = parsed.data;
  if (target.role !== role) {
    await prisma.user.update({ where: { id }, data: { role } });
    await logEvent({
      category: "USER_MGMT",
      action: "user.role_change",
      description: `${admin.name ?? admin.email} definiu ${target.email} como ${ROLE_LABEL[role]}`,
      actorId: admin.id,
      actorEmail: admin.email,
      actorName: admin.name,
      targetEmail: target.email,
      metadata: { from: target.role, to: role },
    });
  }

  return NextResponse.json({ ok: true, role });
}

// Exclui um usuário e todo o seu conteúdo — somente administradores.
export async function DELETE(_req: Request, { params }: RouteContext) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Você não pode excluir a sua própria conta" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }

  await prisma.user.delete({ where: { id } });
  await logEvent({
    category: "USER_MGMT",
    action: "user.delete",
    description: `${admin.name ?? admin.email} excluiu a conta de ${target.email}`,
    actorId: admin.id,
    actorEmail: admin.email,
    actorName: admin.name,
    targetEmail: target.email,
  });

  return NextResponse.json({ ok: true });
}
