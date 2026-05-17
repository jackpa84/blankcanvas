import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";

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

      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 text-center shadow-2xl shadow-black/40">
        <div
          className={`mx-auto mb-4 grid size-12 place-items-center rounded-full text-2xl ${
            success
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {success ? "✓" : "!"}
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {success ? "E-mail confirmado!" : "Link inválido"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {success
            ? "Sua conta foi verificada com sucesso. Agora você pode usar o FreeDraw normalmente."
            : "Este link de confirmação é inválido ou já expirou. Faça login e reenvie o e-mail de confirmação pelo painel."}
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-block w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Ir para meus quadros
        </Link>
      </div>
    </main>
  );
}
