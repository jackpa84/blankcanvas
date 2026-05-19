import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { listEmails, listDomains, resendAvailable } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (!resendAvailable) {
    return NextResponse.json(
      { available: false, emails: [], domains: [] },
      { status: 200 },
    );
  }

  try {
    const [emails, domains] = await Promise.all([
      listEmails(50),
      listDomains(),
    ]);
    return NextResponse.json({ available: true, emails, domains });
  } catch (err) {
    return NextResponse.json(
      {
        available: true,
        error: err instanceof Error ? err.message : "Erro ao consultar Resend",
      },
      { status: 502 },
    );
  }
}
