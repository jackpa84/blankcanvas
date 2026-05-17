import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
          ✎
        </span>
        BlankCanvas
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 shadow-2xl shadow-black/40">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
