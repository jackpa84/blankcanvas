import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * E-mail que recebe o papel de ADMIN automaticamente — define o primeiro
 * administrador sem precisar mexer no banco. Os demais são geridos pela
 * própria interface de Permissões.
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;

/** True quando o usuário deve ser tratado como administrador. */
export function isAdminUser(user: {
  role: string;
  email: string;
}): boolean {
  if (user.role === "ADMIN") return true;
  return ADMIN_EMAIL !== null && user.email.toLowerCase() === ADMIN_EMAIL;
}

/**
 * Retorna o usuário logado caso seja admin, ou `null`.
 * Promove o e-mail definido em ADMIN_EMAIL na primeira visita.
 */
export async function getAdminUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return null;

  // Bootstrap: garante que a conta de ADMIN_EMAIL tenha o papel no banco.
  if (
    user.role !== "ADMIN" &&
    ADMIN_EMAIL !== null &&
    user.email.toLowerCase() === ADMIN_EMAIL
  ) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

  return user.role === "ADMIN" ? user : null;
}

/**
 * Exige um administrador autenticado num Server Component ou rota.
 * Redireciona para /login (não autenticado) ou /dashboard (sem permissão).
 */
export async function requireAdmin(): Promise<User> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getAdminUser();
  if (!user) redirect("/dashboard");

  return user;
}
