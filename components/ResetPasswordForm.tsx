"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/30";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Não foi possível redefinir a senha");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-emerald-500/15 text-2xl text-emerald-400">
          ✓
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Senha redefinida!
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sua senha foi alterada. Redirecionando para o login…
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent hover:underline"
        >
          Ir para o login agora
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Nova senha</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Escolha uma nova senha para sua conta.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-400">
            Nova senha
          </span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-400">
            Confirmar nova senha
          </span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            placeholder="Repita a senha"
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Salvando…" : "Redefinir senha"}
        </button>
      </form>
    </>
  );
}
