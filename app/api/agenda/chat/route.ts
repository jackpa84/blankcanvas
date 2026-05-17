import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AGENDA_MODEL } from "@/lib/ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Não autenticado", { status: 401 });
  }
  const userId = session.user.id;

  const { messages }: { messages: UIMessage[] } = await req.json();
  const now = new Date();

  const result = streamText({
    model: AGENDA_MODEL,
    system: [
      "Você é o assistente da agenda do FreeDraw.",
      "Ajuda o usuário a gerenciar eventos (compromissos com data e hora) e tarefas (to-dos).",
      `Data e hora atuais: ${now.toISOString()} — ${now.toLocaleString("pt-BR")}.`,
      "Responda sempre em português do Brasil, de forma curta e objetiva.",
      "Use a ferramenta listAgenda para CONSULTAR antes de responder perguntas sobre a agenda.",
      "Use as ferramentas de criar/atualizar/excluir quando o usuário pedir mudanças.",
      "Datas devem estar em ISO 8601. Interprete 'amanhã', 'sexta', 'semana que vem' a partir da data atual.",
      "Após alterar algo, confirme em uma frase o que foi feito.",
    ].join(" "),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
    tools: {
      listAgenda: tool({
        description:
          "Lista os eventos e tarefas do usuário. Use antes de responder perguntas sobre a agenda.",
        inputSchema: z.object({}),
        execute: async () => {
          const [events, tasks] = await Promise.all([
            prisma.event.findMany({
              where: { userId },
              orderBy: { startsAt: "asc" },
              take: 100,
            }),
            prisma.task.findMany({
              where: { userId },
              orderBy: [{ done: "asc" }, { dueDate: "asc" }],
              take: 100,
            }),
          ]);
          return { events, tasks };
        },
      }),
      createEvent: tool({
        description: "Cria um evento/compromisso com data e hora.",
        inputSchema: z.object({
          title: z.string(),
          startsAt: z.string().describe("Início em ISO 8601, ex: 2026-05-20T15:00:00"),
          endsAt: z.string().optional().describe("Fim em ISO 8601 (opcional)"),
          description: z.string().optional(),
          location: z.string().optional(),
        }),
        execute: async (input) => {
          const event = await prisma.event.create({
            data: {
              userId,
              title: input.title,
              startsAt: new Date(input.startsAt),
              endsAt: input.endsAt ? new Date(input.endsAt) : null,
              description: input.description ?? null,
              location: input.location ?? null,
            },
          });
          return { ok: true, event };
        },
      }),
      updateEvent: tool({
        description: "Atualiza um evento existente pelo id.",
        inputSchema: z.object({
          id: z.string(),
          title: z.string().optional(),
          startsAt: z.string().optional(),
          endsAt: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
        }),
        execute: async (input) => {
          const data: Prisma.EventUpdateManyMutationInput = {};
          if (input.title !== undefined) data.title = input.title;
          if (input.startsAt !== undefined) data.startsAt = new Date(input.startsAt);
          if (input.endsAt !== undefined) data.endsAt = new Date(input.endsAt);
          if (input.description !== undefined) data.description = input.description;
          if (input.location !== undefined) data.location = input.location;
          const r = await prisma.event.updateMany({
            where: { id: input.id, userId },
            data,
          });
          return { ok: r.count > 0 };
        },
      }),
      deleteEvent: tool({
        description: "Exclui um evento pelo id.",
        inputSchema: z.object({ id: z.string() }),
        execute: async ({ id }) => {
          const r = await prisma.event.deleteMany({ where: { id, userId } });
          return { ok: r.count > 0 };
        },
      }),
      createTask: tool({
        description: "Cria uma tarefa (to-do).",
        inputSchema: z.object({
          title: z.string(),
          dueDate: z.string().optional().describe("Prazo em ISO 8601 (opcional)"),
          priority: z
            .number()
            .int()
            .min(1)
            .max(3)
            .optional()
            .describe("1 = alta, 2 = média, 3 = baixa"),
          notes: z.string().optional(),
        }),
        execute: async (input) => {
          const task = await prisma.task.create({
            data: {
              userId,
              title: input.title,
              dueDate: input.dueDate ? new Date(input.dueDate) : null,
              priority: input.priority ?? 2,
              notes: input.notes ?? null,
            },
          });
          return { ok: true, task };
        },
      }),
      updateTask: tool({
        description:
          "Atualiza uma tarefa pelo id (por exemplo, marcar como concluída com done=true).",
        inputSchema: z.object({
          id: z.string(),
          title: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.number().int().min(1).max(3).optional(),
          done: z.boolean().optional(),
          notes: z.string().optional(),
        }),
        execute: async (input) => {
          const data: Prisma.TaskUpdateManyMutationInput = {};
          if (input.title !== undefined) data.title = input.title;
          if (input.dueDate !== undefined) data.dueDate = new Date(input.dueDate);
          if (input.priority !== undefined) data.priority = input.priority;
          if (input.done !== undefined) data.done = input.done;
          if (input.notes !== undefined) data.notes = input.notes;
          const r = await prisma.task.updateMany({
            where: { id: input.id, userId },
            data,
          });
          return { ok: r.count > 0 };
        },
      }),
      deleteTask: tool({
        description: "Exclui uma tarefa pelo id.",
        inputSchema: z.object({ id: z.string() }),
        execute: async ({ id }) => {
          const r = await prisma.task.deleteMany({ where: { id, userId } });
          return { ok: r.count > 0 };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
