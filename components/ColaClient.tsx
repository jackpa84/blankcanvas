"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

import type { PasteBlock } from "@/lib/validations";

type SaveState = "idle" | "saving" | "saved" | "error";

// Limite por imagem colada — guardamos como data URL no banco, sem upload.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function ColaClient({
  initialBlocks,
  userName,
  isAdmin,
}: {
  initialBlocks: PasteBlock[];
  userName: string;
  isAdmin: boolean;
}) {
  const [blocks, setBlocks] = useState<PasteBlock[]>(initialBlocks);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const firstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  /* ---------- Salvamento automático (debounce) ---------- */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSave("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/cola", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks }),
        });
        setSave(res.ok ? "saved" : "error");
        if (!res.ok) setError("Não foi possível salvar.");
      } catch {
        setSave("error");
        setError("Não foi possível salvar.");
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [blocks]);

  /* ---------- Ações sobre os blocos ---------- */
  const addText = useCallback((value = "") => {
    const id = newId();
    setBlocks((prev) => [...prev, { id, kind: "text", value }]);
    requestAnimationFrame(() => {
      document.getElementById(`block-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      (document.getElementById(`ta-${id}`) as HTMLTextAreaElement | null)?.focus();
    });
  }, []);

  const addImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Imagem muito grande (máx. 4 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      if (!value) return;
      const id = newId();
      setBlocks((prev) => [...prev, { id, kind: "image", value }]);
      requestAnimationFrame(() =>
        document
          .getElementById(`block-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    };
    reader.readAsDataURL(file);
  }, []);

  const updateText = useCallback((id: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, value } : b)),
    );
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  function clearAll() {
    if (blocks.length === 0) return;
    if (!window.confirm("Apagar tudo que você colou aqui?")) return;
    setBlocks([]);
  }

  /* ---------- Captura de Ctrl+V em qualquer lugar da página ---------- */
  useEffect(() => {
    function isEditing() {
      const el = document.activeElement as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === "TEXTAREA" ||
          el.tagName === "INPUT" ||
          el.isContentEditable)
      );
    }

    function onPaste(e: ClipboardEvent) {
      const data = e.clipboardData;
      if (!data) return;

      const images = Array.from(data.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (images.length > 0) {
        e.preventDefault();
        setError(null);
        images.forEach(addImage);
        return;
      }

      // Texto: só vira bloco novo quando NÃO se está editando um campo,
      // assim colar dentro de um bloco de texto funciona normalmente.
      const text = data.getData("text/plain");
      if (text && !isEditing()) {
        e.preventDefault();
        setError(null);
        addText(text);
      }
    }

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addImage, addText]);

  /* ---------- Arrastar imagens para a página ---------- */
  const [dragging, setDragging] = useState(false);
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const images = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (images.length > 0) {
      setError(null);
      images.forEach(addImage);
    }
  }

  return (
    <div
      className="min-h-dvh"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={onDrop}
    >
      {/* ---------- Cabeçalho ---------- */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5 sm:px-10">
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
                className="rounded-lg bg-surface-2 px-3 py-1.5 font-medium text-white"
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

      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10">
        {/* ---------- Título + status ---------- */}
        <div className="fd-rise flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Cola
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Cole (Ctrl+V) texto ou imagens em qualquer lugar — tudo é salvo
              automaticamente.
            </p>
          </div>
          <SaveBadge state={save} />
        </div>

        {/* ---------- Barra de ações ---------- */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => addText()}
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent-hover"
          >
            + Texto
          </button>
          <label className="cursor-pointer rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-zinc-300 transition hover:bg-surface-2">
            + Imagem
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                setError(null);
                Array.from(e.target.files ?? []).forEach(addImage);
                e.target.value = "";
              }}
            />
          </label>
          {blocks.length > 0 && (
            <button
              onClick={clearAll}
              className="ml-auto rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* ---------- Blocos ---------- */}
        {blocks.length === 0 ? (
          <button
            onClick={() => addText()}
            className="fd-grid mt-6 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-24 text-center transition hover:border-accent/60 hover:bg-surface"
          >
            <span className="text-3xl">📋</span>
            <span className="font-medium">Cole qualquer coisa aqui</span>
            <span className="text-sm text-zinc-500">
              Aperte Ctrl+V para texto ou imagens, ou clique para escrever
            </span>
          </button>
        ) : (
          <ul className="mt-6 space-y-3">
            {blocks.map((b) => (
              <li
                key={b.id}
                id={`block-${b.id}`}
                className="fd-rise group relative rounded-xl border border-border bg-surface p-3"
              >
                <button
                  onClick={() => removeBlock(b.id)}
                  aria-label="Remover"
                  className="absolute right-2 top-2 z-10 rounded-md bg-canvas/80 px-2 py-1 text-xs text-zinc-500 opacity-0 transition hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                >
                  Remover
                </button>
                {b.kind === "text" ? (
                  <AutoTextarea
                    id={`ta-${b.id}`}
                    value={b.value}
                    onChange={(v) => updateText(b.id, v)}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.value}
                    alt="Imagem colada"
                    className="mx-auto max-h-[70vh] rounded-lg"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* ---------- Sobreposição de arrastar ---------- */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-accent/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-accent/60 bg-canvas/90 px-10 py-8 text-center">
            <p className="text-2xl">📥</p>
            <p className="mt-1 font-medium">Solte as imagens para colar</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Auxiliares ---------- */

function SaveBadge({ state }: { state: SaveState }) {
  const map: Record<SaveState, { label: string; cls: string }> = {
    idle: { label: "Tudo salvo", cls: "text-zinc-500" },
    saving: { label: "Salvando…", cls: "text-amber-400" },
    saved: { label: "Salvo ✓", cls: "text-emerald-400" },
    error: { label: "Erro ao salvar", cls: "text-red-400" },
  };
  const { label, cls } = map[state];
  return <span className={`text-xs ${cls}`}>{label}</span>;
}

function AutoTextarea({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(resize, [value, resize]);

  return (
    <textarea
      id={id}
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Escreva ou cole texto aqui…"
      rows={1}
      className="block w-full resize-none bg-transparent px-1 py-0.5 pr-20 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600"
    />
  );
}
