"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ServicesSection } from "@/components/ServicesSection";
import { SERVICES } from "@/lib/services";

const ACTIVE_COUNT = SERVICES.filter((s) => s.status === "active").length;
const SOON_COUNT = SERVICES.filter((s) => s.status === "soon").length;

export type BoardSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type ResendState = "idle" | "sending" | "sent" | "error";

export function DashboardClient({
  initialBoards,
  userName,
  emailVerified,
  isAdmin,
}: {
  initialBoards: BoardSummary[];
  userName: string;
  emailVerified: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState<ResendState>("idle");

  const firstName = userName.split(" ")[0];

  async function resendVerification() {
    setResend("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      setResend(res.ok ? "sent" : "error");
    } catch {
      setResend("error");
    }
  }

  async function createBoard() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/boards", { method: "POST" });
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: string };
      router.push(`/board/${id}`);
    } catch {
      setError("Não foi possível criar o quadro.");
      setCreating(false);
    }
  }

  async function deleteBoard(id: string) {
    if (
      !window.confirm("Excluir este quadro? Esta ação não pode ser desfeita.")
    ) {
      return;
    }
    setError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("Não foi possível excluir o quadro.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-dvh">
      {/* ---------- Cabeçalho ---------- */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 font-display font-bold tracking-tight">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-700 text-white shadow-lg shadow-violet-950/60">
                ✎
              </span>
              FreeDraw
            </div>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="rounded-lg bg-surface-2 px-3 py-1.5 font-medium text-white"
              >
                Quadros
              </Link>
              <Link
                href="/agenda"
                className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-surface-2 hover:text-white"
              >
                Agenda
              </Link>
              <Link
                href="/cola"
                className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-surface-2 hover:text-white"
              >
                Cola
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-surface-2 hover:text-white"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-400 sm:inline">{userName}</span>
            <button
              onClick={() => signOut({ redirectTo: "/" })}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-zinc-300 transition hover:bg-surface-2"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {!emailVerified && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200">
              <strong>Confirme seu e-mail.</strong> Enviamos um link de
              confirmação para a sua caixa de entrada.
            </p>
            {resend === "sent" ? (
              <span className="text-sm text-emerald-400">
                E-mail reenviado ✓
              </span>
            ) : (
              <button
                onClick={resendVerification}
                disabled={resend === "sending"}
                className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-sm text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60"
              >
                {resend === "sending"
                  ? "Enviando…"
                  : resend === "error"
                    ? "Erro — tentar de novo"
                    : "Reenviar e-mail"}
              </button>
            )}
          </div>
        )}

        {/* ---------- Saudação ---------- */}
        <div className="fd-rise">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Olá, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Escolha um recurso para começar a criar.
          </p>
        </div>

        {/* ---------- Serviços ---------- */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Recursos do FreeDraw
            </h2>
            <span className="text-xs text-zinc-500">
              {ACTIVE_COUNT} ativos · {SOON_COUNT} em breve
            </span>
          </div>
          <ServicesSection className="mt-4" />
        </section>

        {/* ---------- Quadros ---------- */}
        <section id="boards" className="mt-14 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Seus quadros
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {boards.length === 0
                  ? "Você ainda não tem quadros."
                  : `${boards.length} ${
                      boards.length === 1 ? "quadro" : "quadros"
                    } salvos.`}
              </p>
            </div>
            <button
              onClick={createBoard}
              disabled={creating}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Criando…" : "+ Novo quadro"}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {boards.length === 0 ? (
            <button
              onClick={createBoard}
              disabled={creating}
              className="mt-6 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-20 text-center transition hover:border-accent/60 hover:bg-surface"
            >
              <span className="text-3xl">✎</span>
              <span className="font-medium">Criar meu primeiro quadro</span>
              <span className="text-sm text-zinc-500">
                Comece com uma tela em branco
              </span>
            </button>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((board, i) => (
                <li
                  key={board.id}
                  className="fd-rise group relative overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/10"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Link href={`/board/${board.id}`} className="block p-5 pb-12">
                    <div className="fd-grid mb-4 grid h-24 place-items-center rounded-lg bg-surface-2 text-2xl text-zinc-600 transition group-hover:text-accent">
                      ✎
                    </div>
                    <h3 className="truncate font-medium">{board.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Editado em {formatDate(board.updatedAt)}
                    </p>
                  </Link>
                  <button
                    onClick={() => deleteBoard(board.id)}
                    disabled={deletingId === board.id}
                    className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === board.id ? "Excluindo…" : "Excluir"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
