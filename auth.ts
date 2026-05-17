import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import { loginSchema } from "./lib/validations";
import { logEvent } from "./lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await logEvent({
            category: "AUTH",
            action: "auth.login_failed",
            description: `Tentativa de login com e-mail inexistente: ${email}`,
            targetEmail: email,
          });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await logEvent({
            category: "AUTH",
            action: "auth.login_failed",
            description: `Senha incorreta para ${email}`,
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            targetEmail: email,
          });
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await logEvent({
        category: "AUTH",
        action: "auth.login",
        description: `${user.name ?? user.email ?? "Usuário"} entrou no sistema`,
        actorId: user.id ?? null,
        actorEmail: user.email ?? null,
        actorName: user.name ?? null,
      });
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      await logEvent({
        category: "AUTH",
        action: "auth.logout",
        description: `${token?.name ?? token?.email ?? "Usuário"} saiu do sistema`,
        actorId: typeof token?.id === "string" ? token.id : (token?.sub ?? null),
        actorEmail: token?.email ?? null,
        actorName: token?.name ?? null,
      });
    },
  },
});
