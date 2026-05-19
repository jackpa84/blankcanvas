// Consulta a API REST do Resend para listar e-mails enviados pela aplicação.
// A chave da API é a própria SMTP_PASSWORD quando o provedor é o Resend
// (começa com "re_"). Não criamos uma var separada para evitar duplicação.

const API = "https://api.resend.com";

function apiKey(): string | null {
  const pwd = process.env.SMTP_PASSWORD?.trim();
  if (pwd && pwd.startsWith("re_")) return pwd;
  return null;
}

export const resendAvailable = apiKey() !== null;

export type ResendEmail = {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  last_event: string;
  scheduled_at: string | null;
};

export type ResendDomain = {
  id: string;
  name: string;
  status: string;
  region: string;
};

async function call<T>(path: string): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error("Resend não configurado (SMTP_PASSWORD ausente).");

  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function listEmails(limit = 50): Promise<ResendEmail[]> {
  const data = await call<{ data: ResendEmail[] }>(
    `/emails?limit=${Math.min(Math.max(limit, 1), 100)}`,
  );
  return data.data ?? [];
}

export async function listDomains(): Promise<ResendDomain[]> {
  const data = await call<{ data: ResendDomain[] }>(`/domains`);
  return data.data ?? [];
}
