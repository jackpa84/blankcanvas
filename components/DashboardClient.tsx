"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

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
}: {
  initialBoards: BoardSummary[];
  userName: string;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState<ResendState>("idle");

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
      !window.confirm(
        "Excluir este quadro? Esta ação não pode ser desfeita.",
      )
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
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
            ✎
          </span>
          BlankCanvas
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
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        {!emailVerified && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
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

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Seus quadros
            </h1>
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
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
            className="mt-8 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-20 text-center transition hover:border-accent/60 hover:bg-surface"
          >
            <span className="text-3xl">✎</span>
            <span className="font-medium">Criar meu primeiro quadro</span>
            <span className="text-sm text-zinc-500">
              Comece com uma tela em branco
            </span>
          </button>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <li
                key={board.id}
                className="group relative rounded-xl border border-border bg-surface transition hover:border-accent/50"
              >
                <Link
                  href={`/board/${board.id}`}
                  className="block p-5 pb-12"
                >
                  <div className="mb-4 grid h-24 place-items-center rounded-lg bg-surface-2 text-2xl text-zinc-600">
                    ✎
                  </div>
                  <h2 className="truncate font-medium">{board.title}</h2>
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
