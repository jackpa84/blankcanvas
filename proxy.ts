import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "./auth.config";

// Next.js 16 renamed the "middleware" convention to "proxy" and requires a
// statically-detectable function export, so we wrap Auth.js's handler.
const { auth } = NextAuth(authConfig);
const authHandler = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent,
) => Promise<Response>;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return authHandler(request, event);
}

export const config = {
  // Run on all routes except Next internals, the API and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
