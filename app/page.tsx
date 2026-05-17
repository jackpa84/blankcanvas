import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ServicesSection } from "@/components/ServicesSection";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col">
      {/* ---------- Cabeçalho ---------- */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-700 text-white shadow-lg shadow-violet-950/60">
              ✎
            </span>
            FreeDraw
          </Link>
          <nav className="flex items-center gap-1.5 text-sm">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-zinc-300 transition hover:bg-surface hover:text-white"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2 font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent-hover"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="fd-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_55%_at_50%_35%,#000,transparent)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-10 pt-20 text-center sm:px-10 sm:pt-28">
          <span className="fd-rise mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Quadro branco online · grátis · modo escuro
          </span>

          <h1
            className="fd-rise max-w-4xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl"
            style={{ animationDelay: "60ms" }}
          >
            Esboce, desenhe e{" "}
            <span className="bg-gradient-to-br from-violet-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              dê vida às ideias
            </span>
          </h1>

          <p
            className="fd-rise mt-6 max-w-xl text-balance text-base text-zinc-400 sm:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            Um quadro de desenho estilo Excalidraw com agenda integrada e
            assistente de IA. Crie sua conta, monte quantos quadros quiser e
            acesse de qualquer lugar — tudo salvo automaticamente.
          </p>

          <div
            className="fd-rise mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            <Link
              href="/register"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-accent/30 transition hover:bg-accent-hover hover:shadow-accent/40"
            >
              Começar grátis
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-surface-2"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Mockup decorativo do quadro */}
        <div
          className="fd-rise relative mx-auto mt-4 w-full max-w-4xl px-6 pb-20 sm:px-10"
          style={{ animationDelay: "240ms" }}
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60">
            <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-3">
              <span className="size-3 rounded-full bg-rose-400/80" />
              <span className="size-3 rounded-full bg-amber-400/80" />
              <span className="size-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 text-xs text-zinc-500">
                meu-quadro · FreeDraw
              </span>
            </div>
            <div className="fd-grid relative h-64 bg-canvas sm:h-80">
              <BoardDoodle />
            </div>
          </div>
          {/* halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -bottom-8 -z-10 h-40 bg-violet-600/20 blur-3xl"
          />
        </div>
      </section>

      {/* ---------- Recursos ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Recursos
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo num só espaço criativo
          </h2>
          <p className="mt-3 text-zinc-400">
            Mais do que um quadro branco — uma central de ideias com agenda,
            inteligência artificial e recursos chegando em breve.
          </p>
        </div>

        <ServicesSection marketing className="mt-10" />
      </section>

      {/* ---------- Chamada final ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-8 py-14 text-center sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-violet-600/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-16 size-64 rounded-full bg-cyan-500/15 blur-3xl"
          />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Sua próxima ideia começa numa tela em branco
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-zinc-400">
            Leva menos de um minuto para criar sua conta. Sem cartão, sem
            complicação.
          </p>
          <Link
            href="/register"
            className="relative mt-7 inline-block rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-accent/30 transition hover:bg-accent-hover"
          >
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      {/* ---------- Rodapé ---------- */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-zinc-500 sm:flex-row sm:px-10">
          <div className="flex items-center gap-2 font-display font-semibold text-zinc-400">
            <span className="grid size-6 place-items-center rounded-md bg-surface-2 text-[11px]">
              ✎
            </span>
            FreeDraw
          </div>
          <p>Seu quadro branco online · feito com Next.js</p>
        </div>
      </footer>
    </main>
  );
}

/* Rabiscos decorativos do mockup — puro SVG, leve e estático. */
function BoardDoodle() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 800 360"
      fill="none"
      aria-hidden
    >
      {/* retângulo */}
      <rect
        x="70"
        y="70"
        width="180"
        height="110"
        rx="14"
        stroke="#7c5cff"
        strokeWidth="3"
      />
      <text x="100" y="135" fill="#a78bfa" fontSize="22" fontFamily="sans-serif">
        Ideia
      </text>

      {/* seta */}
      <path
        d="M260 125 C 320 125, 320 200, 380 200"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
      <path
        d="M372 192 L384 200 L372 208"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* círculo */}
      <circle cx="455" cy="200" r="58" stroke="#34d399" strokeWidth="3" />
      <text x="423" y="207" fill="#6ee7b7" fontSize="20" fontFamily="sans-serif">
        Plano
      </text>

      {/* nota adesiva */}
      <g className="fd-float">
        <rect x="560" y="80" width="140" height="120" rx="6" fill="#fbbf24" />
        <rect x="560" y="80" width="140" height="22" rx="6" fill="#f59e0b" />
        <line x1="578" y1="128" x2="682" y2="128" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
        <line x1="578" y1="148" x2="660" y2="148" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
        <line x1="578" y1="168" x2="672" y2="168" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* traço livre */}
      <path
        d="M120 280 q 30 -40 60 0 t 60 0 t 60 0 t 60 0"
        stroke="#f472b6"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
