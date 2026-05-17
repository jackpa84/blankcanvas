// Catálogo de recursos do FreeDraw — usado na dashboard e na landing page.
// Itens "soon" são funcionalidades planejadas, exibidas como vitrine.

export type ServiceStatus = "active" | "soon";

export type ServiceAccent = "violet" | "cyan" | "amber" | "emerald" | "rose";

export type Service = {
  id: string;
  name: string;
  /** Categoria curta exibida como eyebrow acima do nome. */
  tagline: string;
  description: string;
  /** Glifo unicode usado como ícone. */
  icon: string;
  /** Destino quando o recurso está ativo (dentro do app). */
  href: string;
  status: ServiceStatus;
  accent: ServiceAccent;
};

export const SERVICES: Service[] = [
  {
    id: "boards",
    name: "Quadros",
    tagline: "Desenho",
    description:
      "Esboce ideias numa tela infinita com formas, setas, texto e traço livre — cada detalhe salvo automaticamente.",
    icon: "✎",
    href: "#boards",
    status: "active",
    accent: "violet",
  },
  {
    id: "agenda",
    name: "Agenda",
    tagline: "Organização",
    description:
      "Reúna compromissos e tarefas num só painel, com prazos, prioridades e uma visão clara da sua semana.",
    icon: "◷",
    href: "/agenda",
    status: "active",
    accent: "cyan",
  },
  {
    id: "assistant",
    name: "Assistente IA",
    tagline: "Inteligência",
    description:
      "Peça em português comum e a IA cria eventos, organiza tarefas e resume sua agenda por você.",
    icon: "✦",
    href: "/agenda",
    status: "active",
    accent: "amber",
  },
  {
    id: "cola",
    name: "Cola",
    tagline: "Anotações",
    description:
      "Cole texto e imagens num espaço só seu — um rascunho rápido que guarda tudo automaticamente.",
    icon: "❏",
    href: "/cola",
    status: "active",
    accent: "rose",
  },
  {
    id: "collab",
    name: "Colaboração ao vivo",
    tagline: "Tempo real",
    description:
      "Desenhe no mesmo quadro que seu time, ao vivo, com cursores compartilhados e edição simultânea.",
    icon: "⇄",
    href: "#",
    status: "soon",
    accent: "emerald",
  },
  {
    id: "templates",
    name: "Modelos prontos",
    tagline: "Produtividade",
    description:
      "Comece de fluxogramas, wireframes e mapas mentais já montados em vez de encarar a tela vazia.",
    icon: "▦",
    href: "#",
    status: "soon",
    accent: "rose",
  },
  {
    id: "export",
    name: "Exportar & publicar",
    tagline: "Compartilhar",
    description:
      "Baixe seus quadros em PNG, SVG ou PDF e gere links públicos para compartilhar com qualquer pessoa.",
    icon: "↗",
    href: "#",
    status: "soon",
    accent: "violet",
  },
];
