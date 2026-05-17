import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM =
  process.env.SMTP_FROM ?? "FreeDraw <ajuda@helpaste.com>";

const smtpReady = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

const transporter = smtpReady
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    })
  : null;

async function deliver(
  to: string,
  subject: string,
  html: string,
  fallbackLink: string,
) {
  if (!transporter) {
    // Sem SMTP configurado: não quebra o fluxo, apenas registra o link
    // para que o desenvolvedor consiga testar localmente.
    console.warn(
      `[mail] SMTP não configurado — e-mail "${subject}" NÃO enviado para ${to}.`,
    );
    console.warn(`[mail] Link para teste: ${fallbackLink}`);
    return;
  }

  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
  } catch (err) {
    // Mesmo com SMTP falhando, registra o link para que nada se perca.
    console.error(
      `[mail] Falha ao enviar "${subject}" para ${to}:`,
      err instanceof Error ? err.message : err,
    );
    console.warn(`[mail] Link (fallback): ${fallbackLink}`);
    throw err;
  }
}

// Whether real e-mail delivery is available (used to adjust UI copy).
export const mailEnabled = smtpReady;

function layout(opts: {
  heading: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}): string {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="font-size:20px;font-weight:bold;margin-bottom:24px;">✎ FreeDraw</div>
    <div style="background:#ffffff;border-radius:12px;padding:28px;">
      <h1 style="margin:0 0 12px;font-size:18px;">${opts.heading}</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">${opts.intro}</p>
      <a href="${opts.buttonUrl}" style="display:inline-block;background:#7c5cff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 22px;border-radius:8px;">${opts.buttonLabel}</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">${opts.footer}</p>
      <p style="margin:12px 0 0;font-size:12px;word-break:break-all;color:#a1a1aa;">${opts.buttonUrl}</p>
    </div>
    <p style="margin:20px 0 0;font-size:11px;color:#a1a1aa;text-align:center;">FreeDraw — seu quadro branco online</p>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(to: string, link: string) {
  const html = layout({
    heading: "Confirme seu e-mail",
    intro:
      "Bem-vindo ao FreeDraw! Clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta.",
    buttonLabel: "Confirmar e-mail",
    buttonUrl: link,
    footer:
      "Este link expira em 24 horas. Se você não criou esta conta, ignore este e-mail.",
  });
  await deliver(to, "Confirme seu e-mail — FreeDraw", html, link);
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const html = layout({
    heading: "Redefinir sua senha",
    intro:
      "Recebemos um pedido para redefinir a senha da sua conta FreeDraw. Clique no botão abaixo para escolher uma nova senha.",
    buttonLabel: "Redefinir senha",
    buttonUrl: link,
    footer:
      "Este link expira em 1 hora. Se você não pediu a redefinição, ignore este e-mail — sua senha continua a mesma.",
  });
  await deliver(to, "Redefinir sua senha — FreeDraw", html, link);
}
