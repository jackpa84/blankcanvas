import Link from "next/link";
import { SERVICES, type Service, type ServiceAccent } from "@/lib/services";

// Conjuntos de classes por cor de destaque. Strings literais completas
// para que o Tailwind detecte cada utilitário na compilação.
const ACCENT: Record<
  ServiceAccent,
  {
    wash: string;
    icon: string;
    iconShadow: string;
    border: string;
    glow: string;
    text: string;
  }
> = {
  violet: {
    wash: "from-violet-500/45 to-fuchsia-500/15",
    icon: "from-violet-400 to-violet-700",
    iconShadow: "shadow-violet-950/60",
    border: "hover:border-violet-400/55",
    glow: "hover:shadow-violet-500/20",
    text: "text-violet-300",
  },
  cyan: {
    wash: "from-cyan-400/45 to-sky-500/15",
    icon: "from-cyan-400 to-sky-600",
    iconShadow: "shadow-cyan-950/60",
    border: "hover:border-cyan-400/55",
    glow: "hover:shadow-cyan-500/20",
    text: "text-cyan-300",
  },
  amber: {
    wash: "from-amber-400/45 to-orange-500/15",
    icon: "from-amber-400 to-orange-600",
    iconShadow: "shadow-amber-950/60",
    border: "hover:border-amber-400/55",
    glow: "hover:shadow-amber-500/20",
    text: "text-amber-300",
  },
  emerald: {
    wash: "from-emerald-400/45 to-teal-500/15",
    icon: "from-emerald-400 to-teal-600",
    iconShadow: "shadow-emerald-950/60",
    border: "hover:border-emerald-400/55",
    glow: "hover:shadow-emerald-500/20",
    text: "text-emerald-300",
  },
  rose: {
    wash: "from-rose-400/45 to-pink-500/15",
    icon: "from-rose-400 to-pink-600",
    iconShadow: "shadow-rose-950/60",
    border: "hover:border-rose-400/55",
    glow: "hover:shadow-rose-500/20",
    text: "text-rose-300",
  },
};

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const a = ACCENT[service.accent];
  const active = service.status === "active";

  const card = (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-300 ${
        active
          ? `${a.border} ${a.glow} hover:-translate-y-1 hover:shadow-2xl`
          : "opacity-75"
      }`}
    >
      {/* Brilho difuso no canto, intensifica no hover */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-gradient-to-br ${a.wash} blur-2xl transition-opacity duration-300 ${
          active ? "opacity-55 group-hover:opacity-100" : "opacity-25"
        }`}
      />

      <div className="relative flex items-start justify-between">
        <span
          className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${a.icon} text-xl text-white shadow-lg ${a.iconShadow}`}
        >
          {service.icon}
        </span>
        {!active && (
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Em breve
          </span>
        )}
      </div>

      <p
        className={`relative mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] ${a.text}`}
      >
        {service.tagline}
      </p>
      <h3 className="relative mt-1 font-display text-lg font-semibold text-white">
        {service.name}
      </h3>
      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
        {service.description}
      </p>

      {active && (
        <span
          className={`relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${a.text}`}
        >
          Abrir
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      )}
    </article>
  );

  const wrapClass = "fd-rise";
  const style = { animationDelay: `${index * 70}ms` };

  if (!active) {
    return (
      <div className={wrapClass} style={style}>
        {card}
      </div>
    );
  }

  return (
    <Link
      href={service.href}
      className={`${wrapClass} rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/60`}
      style={style}
    >
      {card}
    </Link>
  );
}

/**
 * Grade de recursos do FreeDraw.
 * - `marketing`: na landing page, recursos ativos levam ao cadastro.
 */
export function ServicesSection({
  marketing = false,
  className = "",
}: {
  marketing?: boolean;
  className?: string;
}) {
  const services = marketing
    ? SERVICES.map((s) =>
        s.status === "active" ? { ...s, href: "/register" } : s,
      )
    : SERVICES;

  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {services.map((service, i) => (
        <ServiceCard key={service.id} service={service} index={i} />
      ))}
    </div>
  );
}
