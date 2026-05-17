"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";

const TOOL_LABELS: Record<string, string> = {
  "tool-listAgenda": "Consultando a agenda…",
  "tool-createEvent": "Criando evento…",
  "tool-updateEvent": "Atualizando evento…",
  "tool-deleteEvent": "Excluindo evento…",
  "tool-createTask": "Criando tarefa…",
  "tool-updateTask": "Atualizando tarefa…",
  "tool-deleteTask": "Excluindo tarefa…",
};

const SUGGESTIONS = [
  "O que tenho hoje?",
  "Reunião amanhã às 15h",
  "Tarefa: pagar contas até sexta",
];

export function AgendaChat({ onChanged }: { onChanged: () => void }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agenda/chat" }),
    onFinish: () => onChanged(),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(input);
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent">
          ✦
        </span>
        <div>
          <h2 className="text-sm font-semibold">Assistente IA</h2>
          <p className="text-xs text-zinc-500">
            Peça para criar, consultar ou organizar
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Converse com a IA para gerenciar sua agenda em linguagem natural.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-accent/50 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                message.role === "user"
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-zinc-200"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <span key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </span>
                  );
                }
                if (isToolUIPart(part)) {
                  return (
                    <div
                      key={i}
                      className="my-0.5 flex items-center gap-1.5 text-xs text-zinc-400"
                    >
                      <span className="size-1.5 rounded-full bg-accent" />
                      {TOOL_LABELS[part.type] ?? "Processando…"}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-surface-2 px-3.5 py-2 text-sm text-zinc-500">
              Pensando…
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            Erro ao falar com a IA. Verifique se o AI Gateway está ativo.
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva uma mensagem…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition placeholder:text-zinc-600 focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
