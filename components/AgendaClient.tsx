"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AgendaChat } from "@/components/AgendaChat";

export type EventDTO = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
};

export type TaskDTO = {
  id: string;
  title: string;
  notes: string | null;
  done: boolean;
  priority: number;
  dueDate: string | null;
};

const PRIORITY = {
  1: { label: "Alta", className: "bg-red-500/15 text-red-300" },
  2: { label: "Média", className: "bg-amber-500/15 text-amber-300" },
  3: { label: "Baixa", className: "bg-zinc-500/15 text-zinc-400" },
} as const;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (dd.getTime() - startOfToday().getTime()) / 86_400_000,
  );
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function AgendaClient({
  initialEvents,
  initialTasks,
  userName,
  isAdmin,
}: {
  initialEvents: EventDTO[];
  initialTasks: TaskDTO[];
  userName: string;
  isAdmin: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [tasks, setTasks] = useState(initialTasks);

  const [evTitle, setEvTitle] = useState("");
  const [evStart, setEvStart] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState(2);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Recarrega eventos e tarefas — usado após ações do assistente de IA.
  const refresh = useCallback(async () => {
    try {
      const [er, tr] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/tasks"),
      ]);
      if (er.ok) setEvents((await er.json()).events as EventDTO[]);
      if (tr.ok) setTasks((await tr.json()).tasks as TaskDTO[]);
    } catch {
      /* silencioso — a próxima ação tenta de novo */
    }
  }, []);

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (!evTitle.trim() || !evStart) return;
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: evTitle, startsAt: evStart }),
    });
    if (res.ok) {
      const { event } = (await res.json()) as { event: EventDTO };
      setEvents((prev) =>
        [...prev, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      );
      setEvTitle("");
      setEvStart("");
    }
  }

  async function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/events/${id}`, { method: "DELETE" });
  }

  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskTitle,
        priority: taskPriority,
        ...(taskDue ? { dueDate: taskDue } : {}),
      }),
    });
    if (res.ok) {
      const { task } = (await res.json()) as { task: TaskDTO };
      setTasks((prev) => [task, ...prev]);
      setTaskTitle("");
      setTaskDue("");
      setTaskPriority(2);
    }
  }

  async function toggleTask(task: TaskDTO) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
    );
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  async function generateSummary() {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/agenda/summary");
      const data = (await res.json()) as { summary?: string; error?: string };
      setSummary(
        res.ok
          ? (data.summary ?? "Sem resumo.")
          : (data.error ?? "Não foi possível gerar o resumo."),
      );
    } catch {
      setSummary("Não foi possível gerar o resumo agora.");
    } finally {
      setSummaryLoading(false);
    }
  }

  // Eventos futuros agrupados por dia.
  const eventGroups = useMemo(() => {
    const today = startOfToday().getTime();
    const upcoming = events
      .filter((e) => new Date(e.startsAt).getTime() >= today)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const groups: { label: string; items: EventDTO[] }[] = [];
    for (const ev of upcoming) {
      const label = dayLabel(ev.startsAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(ev);
      else groups.push({ label, items: [ev] });
    }
    return groups;
  }, [events]);

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
              ✎
            </span>
            FreeDraw
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-surface hover:text-white"
            >
              Quadros
            </Link>
            <Link
              href="/agenda"
              className="rounded-lg bg-surface px-3 py-1.5 font-medium text-white"
            >
              Agenda
            </Link>
            <Link
              href="/cola"
              className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-surface hover:text-white"
            >
              Cola
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-surface hover:text-white"
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
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:px-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h1 className="text-2xl font-semibold tracking-tight">Sua agenda</h1>

          {/* Resumo IA */}
          <section className="rounded-2xl border border-border bg-gradient-to-br from-accent/10 to-transparent p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span className="text-accent">✦</span> Resumo inteligente
              </h2>
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
              >
                {summaryLoading ? "Gerando…" : "Gerar resumo do dia"}
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              {summary ??
                "Clique em “Gerar resumo” para a IA destacar o que é mais importante nos próximos 7 dias."}
            </p>
          </section>

          {/* Eventos */}
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Eventos</h2>
            <form onSubmit={addEvent} className="mt-3 flex flex-wrap gap-2">
              <input
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="Novo compromisso"
                className="min-w-[10rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-accent"
              />
              <input
                type="datetime-local"
                value={evStart}
                onChange={(e) => setEvStart(e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                Adicionar
              </button>
            </form>

            <div className="mt-4 space-y-4">
              {eventGroups.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhum evento futuro. Adicione um acima ou peça à IA.
                </p>
              )}
              {eventGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {group.label}
                  </h3>
                  <ul className="space-y-1.5">
                    {group.items.map((ev) => (
                      <li
                        key={ev.id}
                        className="group flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
                      >
                        <span className="w-12 shrink-0 text-sm font-medium text-accent">
                          {formatTime(ev.startsAt)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{ev.title}</p>
                          {ev.location && (
                            <p className="truncate text-xs text-zinc-500">
                              {ev.location}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="shrink-0 text-xs text-zinc-600 opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                        >
                          Excluir
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Tarefas */}
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Tarefas</h2>
            <form onSubmit={addTask} className="mt-3 flex flex-wrap gap-2">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Nova tarefa"
                className="min-w-[10rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-accent"
              />
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-accent"
              />
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(Number(e.target.value))}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-accent"
              >
                <option value={1}>Alta</option>
                <option value={2}>Média</option>
                <option value={3}>Baixa</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                Adicionar
              </button>
            </form>

            <ul className="mt-4 space-y-1.5">
              {pendingTasks.length === 0 && doneTasks.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhuma tarefa. Adicione uma acima ou peça à IA.
                </p>
              )}
              {[...pendingTasks, ...doneTasks].map((task) => {
                const prio =
                  PRIORITY[task.priority as 1 | 2 | 3] ?? PRIORITY[2];
                const overdue =
                  !task.done &&
                  task.dueDate !== null &&
                  new Date(task.dueDate).getTime() < Date.now();
                return (
                  <li
                    key={task.id}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task)}
                      className="size-4 shrink-0 accent-[var(--color-accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          task.done
                            ? "text-zinc-600 line-through"
                            : "text-zinc-200"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p
                          className={`text-xs ${
                            overdue ? "text-red-300" : "text-zinc-500"
                          }`}
                        >
                          {overdue ? "Atrasada · " : "Prazo · "}
                          {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    {!task.done && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${prio.className}`}
                      >
                        {prio.label}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="shrink-0 text-xs text-zinc-600 opacity-0 transition hover:text-red-300 group-hover:opacity-100"
                    >
                      Excluir
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Assistente IA */}
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100dvh-7rem)]">
          <div className="h-[70vh] lg:h-full">
            <AgendaChat onChanged={refresh} />
          </div>
        </aside>
      </main>
    </div>
  );
}
