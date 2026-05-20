// Traduz erros do AI Gateway / AI SDK em mensagens curtas e acionáveis
// para mostrar ao usuário. Os erros do Gateway vêm como JSON aninhado no
// `responseBody` da APICallError do AI SDK, por isso a busca por substring.

const ADD_CARD_URL =
  "https://vercel.com/dashboard/jackpa84s-projects/~/ai?modal=add-credit-card";

export function describeAiError(error: unknown): string {
  const haystack =
    (error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : "") +
    "\n" +
    (() => {
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    })();

  if (haystack.includes("customer_verification_required")) {
    return `O AI Gateway da Vercel exige um cartão de crédito antes de responder (continua com créditos grátis). Adicione em ${ADD_CARD_URL} e tente de novo — não precisa redeploy.`;
  }

  if (haystack.includes("insufficient_quota") || haystack.includes("quota")) {
    return "Cota do AI Gateway esgotada. Verifique limites no painel da Vercel.";
  }

  if (haystack.includes("rate_limit") || haystack.includes("Too Many Requests")) {
    return "Muitas requisições em pouco tempo. Aguarde alguns segundos e tente de novo.";
  }

  if (haystack.includes("AI_GATEWAY_API_KEY") || haystack.includes("Unauthorized")) {
    return "Falha de autenticação no AI Gateway. Verifique a chave/OIDC do projeto na Vercel.";
  }

  return "Erro ao falar com a IA. Tente novamente em alguns segundos.";
}
