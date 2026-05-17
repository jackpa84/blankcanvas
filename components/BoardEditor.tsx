"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

// Excalidraw touches browser-only APIs, so it must never render on the server.
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-sm text-zinc-500">
        Carregando editor…
      </div>
    ),
  },
);

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function BoardEditor({
  board,
}: {
  board: { id: string; title: string; data: unknown };
}) {
  const [title, setTitle] = useState(board.title);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Excalidraw fires onChange once right after mounting — skip that one.
  const skipNextChange = useRef(true);

  const initialData = useMemo(() => {
    const d = board.data as {
      elements?: unknown;
      appState?: unknown;
      files?: unknown;
    } | null;
    return {
      elements: d?.elements ?? [],
      appState: d?.appState ?? {},
      files: d?.files ?? {},
      scrollToContent: true,
    } as ExcalidrawInitialDataState;
  }, [board.data]);

  const persist = useCallback(
    async (body: Record<string, unknown>) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/boards/${board.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setStatus(res.ok ? "saved" : "error");
      } catch {
        setStatus("error");
      }
    },
    [board.id],
  );

  const saveTitle = useCallback(async () => {
    const next = title.trim() || "Quadro sem título";
    if (next !== title) setTitle(next);
    if (next === board.title) return;
    await persist({ title: next });
  }, [title, board.title, persist]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
        <Link
          href="/dashboard"
          className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-surface-2 hover:text-white"
        >
          ← Quadros
        </Link>
        <div className="h-5 w-px bg-border" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm font-medium outline-none transition hover:bg-surface-2 focus:bg-surface-2"
          placeholder="Nome do quadro"
        />
        <SaveBadge status={status} />
      </header>

      <div className="min-h-0 flex-1">
        <Excalidraw
          theme="dark"
          langCode="pt-BR"
          name={title}
          initialData={initialData}
          onChange={(elements, appState, files) => {
            if (skipNextChange.current) {
              skipNextChange.current = false;
              return;
            }
            if (saveTimer.current) clearTimeout(saveTimer.current);
            setStatus("saving");
            const snapshot = { data: { elements, appState, files } };
            saveTimer.current = setTimeout(() => {
              void persist(snapshot);
            }, 1200);
          }}
        />
      </div>
    </div>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { label: string; className: string }> = {
    idle: { label: "Pronto", className: "text-zinc-500" },
    saving: { label: "Salvando…", className: "text-amber-400" },
    saved: { label: "Salvo", className: "text-emerald-400" },
    error: { label: "Erro ao salvar", className: "text-red-400" },
  };
  const { label, className } = map[status];
  return <span className={`shrink-0 text-xs ${className}`}>{label}</span>;
}
