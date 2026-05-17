import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
            ✎
          </span>
          BlankCanvas
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-zinc-300 transition hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-hover"
          >
            Criar conta
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-6 rounded-full border border-border bg-surface px-3 py-1 text-xs text-zinc-400">
          Quadro branco online · modo escuro
        </span>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Esboce, desenhe e{" "}
          <span className="text-accent">salve suas ideias</span>
        </h1>
        <p className="mt-5 max-w-xl text-balance text-zinc-400 sm:text-lg">
          Um quadro de desenho estilo Excalidraw. Crie uma conta, monte
          quantos quadros quiser e acesse de qualquer lugar — tudo salvo
          automaticamente.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Começar grátis
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-zinc-200 transition hover:bg-surface-2"
          >
            Já tenho conta
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            {
              title: "Editor completo",
              desc: "Formas, texto, setas e desenho livre — igual ao Excalidraw.",
            },
            {
              title: "Salvamento automático",
              desc: "Cada traço é guardado na sua conta enquanto você desenha.",
            },
            {
              title: "Seus quadros, organizados",
              desc: "Crie e gerencie vários quadros em um painel só seu.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface p-5 text-left"
            >
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-zinc-600">
        BlankCanvas — feito com Next.js
      </footer>
    </main>
  );
}
