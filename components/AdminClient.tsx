"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Role = "USER" | "ADMIN";
type Category = "AUTH" | "USER_MGMT" | "CONTENT";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  verified: boolean;
  createdAt: string;
  boards: number;
  events: number;
  tasks: number;
};

export type AdminLog = {
  id: string;
  category: Category;
  action: string;
  description: string;
  actorEmail: string | null;
  actorName: string | null;
  targetEmail: string | null;
  ip: string | null;
  createdAt: string;
};

type Tab = "users" | "perms" | "logs" | "emails";

const TABS: { id: Tab; label: string }[] = [
  { id: "users", label: "Usuários" },
  { id: "perms", label: "Permissões" },
  { id: "logs", label: "Logs" },
  { id: "emails", label: "E-mails" },
];

type ResendEmail = {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  last_event: string;
};

type ResendDomain = {
  id: string;
  name: string;
  status: string;
  region: string;
};

type EmailsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "error"; message: string }
  | { status: "ready"; emails: ResendEmail[]; domains: ResendDomain[] };

const EVENT_BADGE: Record<string, string> = {
  delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  sent: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  bounced: "border-red-500/30 bg-red-500/10 text-red-300",
  complained: "border-red-500/30 bg-red-500/10 text-red-300",
  delivery_delayed: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  opened: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  clicked: "border-violet-500/30 bg-violet-500/10 text-violet-200",
};

function eventBadge(ev: string): string {
  return (
    EVENT_BADGE[ev] ?? "border-border bg-surface-2 text-zinc-300"
  );
}

const CATEGORY: Record<
  Category,
  { label: string; badge: string; dot: string }
> = {
  AUTH: {
    label: "Autenticação",
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    dot: "bg-cyan-400",
  },
  USER_MGMT: {
    label: "Gestão",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  CONTENT: {
    label: "Conteúdo",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
};

export function AdminClient({
  currentUserId,
  adminName,
  users: initialUsers,
  logs,
}: {
  currentUserId: string;
  adminName: string;
  users: AdminUser[];
  logs: AdminLog[];
}) {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<Category | "ALL">("ALL");
  const [emailsState, setEmailsState] = useState<EmailsState>({
    status: "idle",
  });

  const loadEmails = useCallback(async () => {
    setEmailsState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/emails", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | {
            available?: boolean;
            emails?: ResendEmail[];
            domains?: ResendDomain[];
            error?: string;
          }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? `Falha ao consultar (${res.status}).`);
      }
      if (!data?.available) {
        setEmailsState({ status: "unavailable" });
        return;
      }
      setEmailsState({
        status: "ready",
        emails: data.emails ?? [],
        domains: data.domains ?? [],
      });
    } catch (err) {
      setEmailsState({
        status: "error",
        message: err instanceof Error ? err.message : "Erro inesperado.",
      });
    }
  }, []);

  function openTab(next: Tab) {
    setTab(next);
    if (next === "emails" && emailsState.status === "idle") {
      void loadEmails();
    }
  }

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const filteredLogs = useMemo(
    () =>
      logFilter === "ALL"
        ? logs
        : logs.filter((l) => l.category === logFilter),
    [logs, logFilter],
  );

  async function changeRole(user: AdminUser) {
    const next: Role = user.role === "ADMIN" ? "USER" : "ADMIN";
    const verb = next === "ADMIN" ? "promover a administrador" : "rebaixar para usuário";
    if (!window.confirm(`Deseja ${verb} ${user.email}?`)) return;

    setError(null);
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Falha ao alterar o papel.");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: next } : u)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(user: AdminUser) {
    if (
      !window.confirm(
        `Excluir ${user.email}? Todos os quadros, eventos e tarefas dessa conta serão apagados. Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setError(null);
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Falha ao excluir o usuário.");
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setBusyId(null);
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
                className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-surface-2 hover:text-white"
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
              <Link
                href="/admin"
                className="rounded-lg bg-surface-2 px-3 py-1.5 font-medium text-white"
              >
                Admin
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-400 sm:inline">{adminName}</span>
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
        {/* ---------- Título ---------- */}
        <div className="fd-rise">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Administração
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie usuários, permissões e acompanhe a atividade do sistema.
          </p>
        </div>

        {/* ---------- Indicadores ---------- */}
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Stat label="Usuários" value={users.length} />
          <Stat label="Administradores" value={adminCount} />
          <Stat label="Eventos registrados" value={logs.length} />
        </div>

        {/* ---------- Abas ---------- */}
        <div className="mt-8 inline-flex rounded-xl border border-border bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => openTab(t.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-surface-2 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* ---------- Conteúdo ---------- */}
        <div className="mt-5">
          {tab === "users" && (
            <ul className="space-y-2.5">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface px-4 py-3.5"
                >
                  <Avatar user={u} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {u.name ?? "Sem nome"}
                      {u.id === currentUserId && (
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                          você
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                  <span
                    className={`text-xs ${
                      u.verified ? "text-emerald-400" : "text-zinc-500"
                    }`}
                  >
                    {u.verified ? "✓ verificado" : "não verificado"}
                  </span>
                  <span className="hidden text-xs text-zinc-500 md:inline">
                    {u.boards} quadros · {u.events} eventos · {u.tasks} tarefas
                  </span>
                  <span className="hidden text-xs text-zinc-500 lg:inline">
                    desde {formatDate(u.createdAt)}
                  </span>
                  <button
                    onClick={() => removeUser(u)}
                    disabled={u.id === currentUserId || busyId === u.id}
                    className="rounded-md px-2 py-1 text-xs text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busyId === u.id ? "…" : "Excluir"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === "perms" && (
            <>
              <p className="mb-3 text-sm text-zinc-400">
                Administradores acessam esta área e gerenciam contas.
                Usuários comuns têm acesso apenas aos próprios recursos.
              </p>
              <ul className="space-y-2.5">
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <li
                      key={u.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface px-4 py-3.5"
                    >
                      <Avatar user={u} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {u.name ?? "Sem nome"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {u.email}
                        </p>
                      </div>
                      <RoleBadge role={u.role} />
                      {isSelf ? (
                        <span className="text-xs text-zinc-500">
                          você não pode alterar o próprio papel
                        </span>
                      ) : (
                        <button
                          onClick={() => changeRole(u)}
                          disabled={busyId === u.id}
                          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-accent/50 hover:text-white disabled:opacity-50"
                        >
                          {busyId === u.id
                            ? "Salvando…"
                            : u.role === "ADMIN"
                              ? "Rebaixar para usuário"
                              : "Tornar administrador"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {tab === "emails" && (
            <EmailsPanel state={emailsState} onReload={loadEmails} />
          )}

          {tab === "logs" && (
            <>
              <div className="mb-4 flex flex-wrap gap-1.5">
                <FilterChip
                  active={logFilter === "ALL"}
                  onClick={() => setLogFilter("ALL")}
                >
                  Todos
                </FilterChip>
                {(Object.keys(CATEGORY) as Category[]).map((c) => (
                  <FilterChip
                    key={c}
                    active={logFilter === c}
                    onClick={() => setLogFilter(c)}
                  >
                    {CATEGORY[c].label}
                  </FilterChip>
                ))}
              </div>

              {filteredLogs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-12 text-center text-sm text-zinc-500">
                  Nenhum registro nesta categoria.
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredLogs.map((l) => (
                    <li
                      key={l.id}
                      className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${CATEGORY[l.category].dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${CATEGORY[l.category].badge}`}
                          >
                            {CATEGORY[l.category].label}
                          </span>
                          <p className="text-sm text-zinc-200">
                            {l.description}
                          </p>
                        </div>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {l.actorEmail ?? "sistema"}
                          {l.ip ? ` · ${l.ip}` : ""} ·{" "}
                          {formatDateTime(l.createdAt)} ·{" "}
                          <code className="text-zinc-600">{l.action}</code>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- Componentes auxiliares ---------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="fd-rise rounded-xl border border-border bg-surface px-4 py-3.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function Avatar({ user }: { user: AdminUser }) {
  const seed = (user.name ?? user.email).trim();
  const initials = seed
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
        user.role === "ADMIN"
          ? "bg-gradient-to-br from-violet-400 to-violet-700 text-white"
          : "bg-surface-2 text-zinc-300"
      }`}
    >
      {initials || "?"}
    </span>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return role === "ADMIN" ? (
    <span className="rounded border border-accent/40 bg-accent/15 px-2 py-0.5 text-xs font-medium text-violet-200">
      Administrador
    </span>
  ) : (
    <span className="rounded border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-zinc-400">
      Usuário
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-accent/50 bg-accent/15 text-white"
          : "border-border bg-surface text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Painel de e-mails (Resend) ---------- */

function EmailsPanel({
  state,
  onReload,
}: {
  state: EmailsState;
  onReload: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Últimos e-mails enviados via Resend (confirmação de cadastro e
          recuperação de senha).
        </p>
        <button
          onClick={onReload}
          disabled={state.status === "loading"}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-surface-2 disabled:opacity-50"
        >
          {state.status === "loading" ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {state.status === "loading" && (
        <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-12 text-center text-sm text-zinc-500">
          Carregando…
        </p>
      )}

      {state.status === "unavailable" && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Resend não está configurado nesta ambiente (SMTP_PASSWORD ausente ou
          não começa com <code>re_</code>).
        </p>
      )}

      {state.status === "error" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.message}
        </p>
      )}

      {state.status === "ready" && (
        <>
          {state.domains.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {state.domains.map((d) => (
                <span
                  key={d.id}
                  className={`rounded-lg border px-2.5 py-1 text-xs ${
                    d.status === "verified"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {d.name} · {d.status} · {d.region}
                </span>
              ))}
            </div>
          )}

          {state.emails.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface/50 px-4 py-12 text-center text-sm text-zinc-500">
              Nenhum e-mail enviado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {state.emails.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <span
                    className={`mt-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${eventBadge(e.last_event)}`}
                  >
                    {e.last_event}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">
                      {e.subject}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      para {e.to.join(", ")} · {formatDateTime(e.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Formatação ---------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
