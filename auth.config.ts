import type { NextAuthConfig } from "next-auth";

// Edge-safe portion of the Auth.js config (no database / bcrypt here),
// so it can be reused by the middleware.
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isProtected =
        path.startsWith("/dashboard") ||
        path.startsWith("/board") ||
        path.startsWith("/agenda") ||
        path.startsWith("/cola") ||
        path.startsWith("/admin");

      if (isProtected && !isLoggedIn) {
        return false; // redirected to the signIn page
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
