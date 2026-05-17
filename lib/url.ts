// Resolve the public base URL of the app from an incoming request,
// so e-mail links point to the right host in dev and in production.
export function getBaseUrl(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const host = req.headers.get("host");
  if (host) {
    const protocol = host.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return process.env.APP_URL ?? "http://localhost:3000";
}
