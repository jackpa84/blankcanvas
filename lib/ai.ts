import { createAnthropic } from "@ai-sdk/anthropic";

// Usa o Anthropic direto (sem o Vercel AI Gateway) para evitar a
// exigência de cartão de crédito do Gateway. A chave precisa estar em
// ANTHROPIC_API_KEY nas env vars da Vercel (console.anthropic.com).
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AGENDA_MODEL = anthropic("claude-sonnet-4-6");
