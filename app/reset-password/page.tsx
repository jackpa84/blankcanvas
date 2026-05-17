import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
          ✎
        </span>
        FreeDraw
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 shadow-2xl shadow-black/40">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-red-500/15 text-2xl text-red-400">
              !
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Link inválido
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Este link de redefinição está incompleto ou expirou. Solicite um
              novo.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-block text-sm text-accent hover:underline"
            >
              Pedir novo link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
