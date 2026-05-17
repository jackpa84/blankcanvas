import { generateText } from "ai";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AGENDA_MODEL } from "@/lib/ai";

export const maxDuration = 30;

// Gera, com IA, um resumo dos próximos 7 dias do usuário.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Não autenticado", { status: 401 });
  }
  const userId = session.user.id;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [events, tasks] = await Promise.all([
    prisma.event.findMany({
      where: { userId, startsAt: { gte: todayStart, lte: weekAhead } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.task.findMany({
      where: { userId, done: false },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  if (events.length === 0 && tasks.length === 0) {
    return Response.json({
      summary:
        "Você não tem eventos nos próximos 7 dias nem tarefas pendentes. Aproveite para planejar algo novo! ✨",
    });
  }

  const fmt = (d: Date) =>
    d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const prioLabel = ["", "alta", "média", "baixa"];

  const eventsText = events.length
    ? events
        .map(
          (e) =>
            `- ${e.title} em ${fmt(e.startsAt)}${e.location ? ` (${e.location})` : ""}`,
        )
        .join("\n")
    : "(nenhum)";

  const tasksText = tasks.length
    ? tasks
        .map(
          (t) =>
            `- ${t.title}${t.dueDate ? ` — prazo ${fmt(t.dueDate)}` : ""} [prioridade ${prioLabel[t.priority] ?? "média"}]`,
        )
        .join("\n")
    : "(nenhuma)";

  try {
    const { text } = await generateText({
      model: AGENDA_MODEL,
      system:
        "Você resume agendas de forma breve, amigável e motivadora, em português do Brasil. Nunca invente itens que não estejam na lista.",
      prompt: `Hoje é ${now.toLocaleString("pt-BR")}.

EVENTOS DOS PRÓXIMOS 7 DIAS:
${eventsText}

TAREFAS PENDENTES:
${tasksText}

Escreva um resumo curto (3 a 5 frases) destacando o que é mais urgente e qual deve ser o foco de hoje. Não use markdown nem listas.`,
    });

    return Response.json({ summary: text });
  } catch (err) {
    console.error("[agenda/summary] Falha na IA:", err);
    return Response.json(
      { error: "Não foi possível gerar o resumo agora." },
      { status: 502 },
    );
  }
}
