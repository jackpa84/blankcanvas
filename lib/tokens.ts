import { randomBytes } from "crypto";
import { TokenType } from "@prisma/client";
import { prisma } from "./prisma";

// How long each kind of token stays valid.
const TTL_MS: Record<TokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 horas
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hora
};

// Create a fresh single-use token for a user, invalidating older ones
// of the same type.
export async function createToken(
  userId: string,
  type: TokenType,
): Promise<string> {
  await prisma.verificationToken.deleteMany({ where: { userId, type } });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      token,
      type,
      userId,
      expiresAt: new Date(Date.now() + TTL_MS[type]),
    },
  });

  return token;
}

// Validate and consume a token. Returns the userId on success, or null
// if the token is unknown, of the wrong type, or expired.
export async function consumeToken(
  token: string,
  type: TokenType,
): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || record.type !== type) return null;

  // Single use: remove it regardless of whether it is still valid.
  await prisma.verificationToken.delete({ where: { id: record.id } });

  if (record.expiresAt.getTime() < Date.now()) return null;

  return record.userId;
}
