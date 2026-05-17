import { headers } from "next/headers";
import { Prisma, type LogCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type LogInput = {
  category: LogCategory;
  /** Identificador curto e estável da ação, ex.: "auth.login". */
  action: string;
  /** Texto legível exibido na interface de logs. */
  description: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  targetEmail?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Registra uma entrada na trilha de auditoria.
 *
 * Nunca lança: uma falha de log não pode derrubar a operação principal.
 * Quando `ip` não é informado, tenta extraí-lo dos cabeçalhos da requisição.
 */
export async function logEvent(input: LogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        category: input.category,
        action: input.action,
        description: input.description,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorName: input.actorName ?? null,
        targetEmail: input.targetEmail ?? null,
        ip: input.ip ?? (await clientIp()),
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });
  } catch (err) {
    console.error("[audit] Falha ao registrar log:", err);
  }
}

/** Endereço de IP da requisição atual, quando disponível. */
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}
