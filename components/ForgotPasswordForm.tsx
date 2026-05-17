"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Não foi possível enviar o e-mail");
        return;
      }
      setSent(true);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-emerald-500/15 text-2xl text-emerald-400">
          ✓
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Verifique seu e-mail
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Se existir uma conta com <strong>{email}</strong>, enviamos um link
          para redefinir a senha. O link expira em 1 hora.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        Esqueceu a senha?
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-400">
            E-mail
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="voce@email.com"
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
          {loading ? "Enviando…" : "Enviar link de redefinição"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
