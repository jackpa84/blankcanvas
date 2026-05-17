"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Não foi possível criar a conta");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          isRegister
            ? "Conta criada, mas o login automático falhou. Tente entrar."
            : "E-mail ou senha incorretos",
        );
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

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
        <h1 className="text-xl font-semibold tracking-tight">
          {isRegister ? "Criar sua conta" : "Entrar"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {isRegister
            ? "Comece a criar e salvar seus quadros."
            : "Bem-vindo de volta ao seu espaço criativo."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <Field label="Nome">
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Seu nome"
              />
            </Field>
          )}

          <Field label="E-mail">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="voce@email.com"
            />
          </Field>

          <Field label="Senha">
            <input
              type="password"
              required
              minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={isRegister ? "Mínimo 8 caracteres" : "••••••••"}
            />
          </Field>

          {!isRegister && (
            <div className="-mt-1 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-400 hover:text-accent"
              >
                Esqueceu a senha?
              </Link>
            </div>
          )}

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
            {loading
              ? "Aguarde…"
              : isRegister
                ? "Criar conta"
                : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {isRegister ? (
            <>
              Já tem conta?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Entrar
              </Link>
            </>
          ) : (
            <>
              Ainda não tem conta?{" "}
              <Link href="/register" className="text-accent hover:underline">
                Criar conta
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
