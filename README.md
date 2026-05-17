# BlankCanvas

Aplicação de **quadro branco online** estilo Excalidraw, em modo escuro.
Cadastre-se, crie quantos quadros quiser e tudo é salvo automaticamente na
sua conta.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — tema escuro
- **@excalidraw/excalidraw** — o editor de desenho
- **Auth.js v5** — cadastro/login com e-mail + senha
- **Prisma + Postgres (Neon)** — persistência dos quadros

## Como rodar localmente

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o banco e os segredos

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

- `DATABASE_URL` / `DIRECT_URL` — connection strings do Postgres.
  Recomendado: crie um banco **Neon** (Vercel → aba *Storage* →
  *Create Database* → *Neon*). O Neon te dá as duas strings.
  Em desenvolvimento local você pode usar a mesma string nas duas.
- `AUTH_SECRET` — gere com `npx auth secret` ou `openssl rand -base64 32`.

### 3. Crie as tabelas no banco

```bash
npm run db:push
```

### 4. Rode o servidor

```bash
npm run dev
```

Abra http://localhost:3000, clique em **Criar conta** e comece a desenhar.

## Deploy na Vercel

1. Suba o repositório para o GitHub e importe na Vercel.
2. Em *Storage*, crie um banco **Neon** e conecte ao projeto — as variáveis
   `DATABASE_URL` e `DIRECT_URL` são injetadas automaticamente.
3. Adicione a variável de ambiente `AUTH_SECRET`.
4. Faça o deploy. O script de build roda `prisma generate` automaticamente.

> Na primeira vez, rode `npm run db:push` apontando para o banco de produção
> (ou use `prisma migrate deploy` se preferir migrations versionadas).

## Estrutura

```
app/
  page.tsx              Landing page
  login, register/      Telas de autenticação
  dashboard/            Lista de quadros do usuário
  board/[id]/           Editor Excalidraw de um quadro
  api/
    register/           Cadastro de usuário
    boards/             CRUD de quadros
    auth/[...nextauth]/ Rotas do Auth.js
components/
  AuthForm.tsx          Formulário de login/cadastro
  DashboardClient.tsx   Painel de quadros
  BoardEditor.tsx       Editor com autosave
auth.ts, auth.config.ts Configuração do Auth.js
proxy.ts                Proteção de rotas (middleware)
prisma/schema.prisma    Modelos User e Board
```

## Como funciona o salvamento

No editor, cada alteração dispara um *autosave* com debounce de ~1,2s que
envia o estado da cena (`elements`, `appState`, `files`) para
`PATCH /api/boards/[id]`. O indicador no topo mostra *Salvando…* / *Salvo*.
