# Trivestia Web

> Web app premium da plataforma de educação financeira **Trivestia** — interface completa para alunos estudarem cursos, responderem atividades interativas e acompanharem progresso, além de um painel administrativo para gerenciar todo o conteúdo e usuários da plataforma.

---

## Visão Geral do Produto

O Trivestia é uma plataforma de **educação financeira voltada para investidores**. Este web app é o espelho do app mobile (`trivestia-app`) no navegador, com a mesma hierarquia de conteúdo (**Curso → Módulo → Aula → Atividade → Questão**) e os mesmos seis tipos de atividade. A identidade visual usa um tema escuro premium com a paleta "Precision Learning".

O app tem **três camadas de acesso**:

- **Pública** (`/`, `/courses`, `/courses/:id`) — qualquer visitante
- **Aluno autenticado** (`/app/*`) — estudar, responder, ver progresso (autenticação via BI Identity SSO)
- **Administrador** (`/admin/*`) — gerenciar cursos, aulas, questões e usuários

> A autenticação não é local: o Trivestia usa **BI Identity SSO** (cookie-based). Veja a seção [Autenticação: BI Identity SSO](#autenticação-bi-identity-sso) para detalhes.

---

## Stack Técnica

| Camada           | Tecnologia                                                  |
| ---------------- | ----------------------------------------------------------- |
| Framework        | React 18.3                                                  |
| Linguagem        | TypeScript 5.7                                              |
| Build tool       | Vite 6.2                                                    |
| Estilo           | TailwindCSS 3.4 (CSS variables + dark mode via `class`)     |
| Componentes      | Radix UI primitives (padrão shadcn/ui)                      |
| Roteamento       | React Router v6 (`createBrowserRouter`, lazy loading)       |
| Estado global    | Zustand 4.5                                                 |
| Cache e fetching | TanStack React Query 5 (`staleTime: 5 min`)                 |
| HTTP Client      | Axios 1.7 (cookies SSO + redirect para BI Identity)         |
| Formulários      | React Hook Form 7.54 + Zod 3.24                             |
| Animações        | Framer Motion 11.15                                         |
| Drag-and-drop    | @dnd-kit/core + @dnd-kit/sortable (atividades de ordenação) |
| Ícones           | Lucide React                                                |
| Toasts           | Sonner                                                      |
| Deploy           | Vercel (SPA, rewrite `/*` → `index.html`)                   |

---

## Arquitetura

### Estrutura de Pastas

```
src/
├── types/
│   └── api.ts                  # Todos os DTOs alinhados ao backend
├── lib/
│   └── utils.ts                # cn(), formatDate(), helpers
├── features/
│   └── auth/
│       ├── storage.ts          # Cache de sessão no localStorage (user + tenant slug)
│       └── auth.store.ts       # Zustand: user, isAuthenticated, logout (SSO)
├── services/
│   ├── api/
│   │   └── client.ts           # Axios com withCredentials (cookies SSO) + redirect 401
│   └── endpoints/              # Módulos de chamadas por domínio
│       ├── auth.endpoints.ts   # Apenas /auth/me (login é no BI Identity)
│       ├── learning.endpoints.ts
│       ├── progress.endpoints.ts
│       ├── admin.endpoints.ts
│       └── admin.users.endpoints.ts
├── routes/
│   ├── index.tsx               # Router completo com lazy loading
│   └── guards/
│       ├── AuthGuard.tsx       # Redireciona para /id/login se não autenticado
│       └── AdminGuard.tsx      # Redireciona para /app/dashboard se não ADMIN
├── layouts/
│   ├── PublicLayout.tsx        # Header + Footer para rotas públicas
│   ├── AuthLayout.tsx          # Layout centralizado para telas de redirecionamento SSO
│   └── AppLayout/
│       ├── AppLayout.tsx       # Container com Sidebar + Topbar
│       ├── Sidebar.tsx         # Navegação lateral responsiva
│       └── Topbar.tsx          # Header com perfil e notificações
├── pages/
│   ├── public/                 # Landing, Courses, CourseDetail
│   ├── auth/                   # Páginas de redirecionamento SSO (não há login local)
│   ├── student/                # Dashboard, ActivityPlayer, Lesson, Progress
│   └── admin/                  # AdminCourses, AdminLessons, AdminQuestions, AdminUsers
├── components/
│   └── learning/               # Renderers de questão
│       ├── QuestionRenderer.tsx        # Dispatcher por ActivityType
│       ├── MultipleChoiceRenderer.tsx
│       ├── MultipleSelectRenderer.tsx
│       ├── OrderingRenderer.tsx        # Drag-and-drop com @dnd-kit
│       └── TextInputRenderer.tsx
└── styles/
    └── globals.css             # CSS variables do design system + Tailwind layers
```

### Políticas de Roteamento

```
/ (PublicLayout)
├── /                 — Landing page
├── /courses          — Catálogo de cursos
└── /courses/:id      — Detalhe de curso

/id/login, /id/logout (BI Identity SSO — fora do Trivestia)

/app/* (AuthGuard → AppLayout)
├── /app/dashboard    — Resumo do progresso, cursos em andamento
├── /app/courses      — Catálogo dentro do AppLayout (sem sair da sidebar)
├── /app/courses/:id  — Detalhe de curso dentro do AppLayout
├── /app/lessons/:id  — Player de aula
├── /app/activity/:id — Player de atividade
└── /app/progress     — Progresso detalhado por curso

/admin/* (AdminGuard → AppLayout)
├── /admin/courses    — CRUD de cursos
├── /admin/lessons    — CRUD de aulas e módulos
├── /admin/questions  — CRUD de questões por atividade
└── /admin/users      — Gestão de usuários + promoção/revogação de ADMIN
```

> **Detalhe de implementação:** as páginas `CoursesPage` e `CourseDetailPage` são reutilizadas tanto nas rotas públicas (`/courses`) quanto nas autenticadas (`/app/courses`). O componente detecta o contexto via `useLocation` e ajusta os links internos com um prefixo `base = location.pathname.startsWith('/app') ? '/app' : ''`.

### Autenticação: BI Identity SSO

O Trivestia não possui sistema de autenticação próprio. A autenticação é delegada ao **BI Identity**, o serviço de SSO (Single Sign-On) da Brunointegrations, hospedado em `brunointegrations.com/id`. O fluxo é **cookie-based**:

- O BI Identity define o cookie `bi_auth` (e `bi_refresh`) no domínio `.brunointegrations.com`, compartilhado entre todos os subdomínios.
- Não há rotas locais de login/registro no Trivestia. O login acontece em `/id/login` (BI Identity).
- O frontend, ao detectar um usuário não autenticado, redireciona para `/id/login?redirect=/trivestia/app`.
- O backend valida o cookie `bi_auth` no middleware de auth (`trademaster-api/src/shared/middlewares/auth.middleware.ts`), chamando `http://bi-api:3300/api/auth/check`. O usuário local é find-or-created por e-mail.

#### Componentes no Frontend

- **`authStorage`** (`features/auth/storage.ts`): cache de sessão no `localStorage` — armazena apenas o `@tm:user` (perfil em cache) e `@tm:authSlug`/`@tm:lastTenantSlug` (slug do tenant). **Não armazena tokens** — a autenticação vive nos cookies de domínio.
- **`useAuthStore`** (Zustand): estado em memória sincronizado com o storage. `loadSession()` é chamado em `main.tsx` **antes** do `ReactDOM.render` para hidratar o estado sem flash de redirecionamento. `logout()` limpa o cache local e redireciona para `/id/logout` para invalidar os cookies SSO.
- **`AuthGuard`**: se `isAuthenticated` for falso, redireciona para `/id/login?redirect=...` (via BI Identity).
- **React Query**: cache de dados remotos por 5 minutos, `retry: 1`. Desabilitado (`enabled: false`) em queries que dependem de dados não disponíveis.

#### Axios com Cookies SSO

O cliente em `services/api/client.ts` é configurado com `withCredentials: true`, garantindo que os cookies `bi_auth`/`bi_refresh` sejam enviados em toda requisição. O interceptor de resposta trata o caso de sessão expirada:

1. **Request**: cookies SSO são enviados automaticamente (sem header `Authorization` manual).
2. **Response interceptor (401)**: a sessão SSO está inválida/expirada → chama `authStorage.clearSession()` e redireciona para `/id/login?redirect=/trivestia/`.

> Não há mais fila de refresh, lock `isRefreshing` nem `Authorization: Bearer <token>`. O renovo da sessão é responsabilidade do BI Identity, que gerencia o cookie `bi_refresh` de forma transparente.

---

## Design System

O tema é uma extensão do Tailwind com CSS variables definidas em `globals.css`:

| Token CSS                | Cor       | Uso                                    |
| ------------------------ | --------- | -------------------------------------- |
| `--color-bg`             | `#0C0E14` | Fundo principal                        |
| `--color-surface`        | `#141720` | Cards e painéis elevados               |
| `--color-brand`          | `#4361EE` | Primária (Indigo) — CTAs, foco         |
| `--color-accent`         | `#D4943A` | Secundária (Âmbar) — scores, destaques |
| `--color-success`        | `#2DC653` | Feedback positivo                      |
| `--color-error`          | `#E63946` | Feedback negativo                      |
| `--color-text-primary`   | `#F0F2F8` | Texto principal                        |
| `--color-text-secondary` | `#8B8FA8` | Texto auxiliar e labels                |

Dark mode configurado via estratégia `class` no `tailwind.config.js`. A classe `dark` é aplicada estaticamente na tag `<html>`.

---

## Tipos de Atividade

O `QuestionRenderer` despacha para o renderer correto com base em `activity.type`:

| `ActivityType`    | Componente               | Experiência                                 |
| ----------------- | ------------------------ | ------------------------------------------- |
| `MULTIPLE_CHOICE` | `MultipleChoiceRenderer` | Radio buttons — 1 opção correta             |
| `TRUE_FALSE`      | `MultipleChoiceRenderer` | 2 opções: Verdadeiro / Falso                |
| `SCENARIO`        | `MultipleChoiceRenderer` | Contexto narrativo + radio buttons          |
| `MULTIPLE_SELECT` | `MultipleSelectRenderer` | Checkboxes — N opções corretas              |
| `ORDERING`        | `OrderingRenderer`       | Drag-and-drop com `@dnd-kit` para reordenar |
| `TEXT_INPUT`      | `TextInputRenderer`      | Campo de texto livre                        |

---

## Segurança

O `vercel.json` aplica headers de segurança em todas as respostas:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Dependência Local: `@trivestia/sim-core`

A engine de simulação de trading (`@trivestia/sim-core`) **não está publicada no npm** — ela é uma biblioteca interna compartilhada entre o backend e o frontend. Para que o deploy na Vercel funcione, o pacote precisa estar presente **dentro do repositório**, em `packages/sim-core/`.

```
trivestia-web/
└── packages/
    └── sim-core/
        ├── package.json
        └── dist/          ← arquivos compilados (commitados no repositório)
```

O `package.json` aponta para ele com `"file:./packages/sim-core"`. O `.gitignore` tem uma exceção explícita (`!packages/sim-core/dist`) para que o `dist/` seja rastreado pelo git e esteja disponível na Vercel. Se você clonar o repositório do zero e a pasta `packages/sim-core` não existir (ou o `dist/` estiver vazio), siga os passos:

```bash
# 1. Compilar o sim-core (repositório irmão)
cd ../sim-core
npm run build

# 2. Copiar o pacote compilado para dentro deste repositório
mkdir -p ../trivestia-web/packages/sim-core
cp package.json ../trivestia-web/packages/sim-core/
cp -r dist/ ../trivestia-web/packages/sim-core/dist/

# 3. Reinstalar dependências
cd ../trivestia-web
yarn install
```

> ⚠️ Sempre que o `sim-core` for atualizado, repita os passos acima e commite o `packages/sim-core/dist/` atualizado para manter o deploy da Vercel sincronizado.

---

## Desenvolvimento Local

### Pré-requisitos

- Node.js ≥ 22 (via `nvm use 22`)
- Yarn

### Instalação

```bash
yarn install
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:3333
# BI Identity SSO (backend). O frontend usa caminhos relativos /id/login e /id/logout.
BI_IDENTITY_URL=https://brunointegrations.com/id
```

### Rodando

```bash
yarn dev      # Servidor de desenvolvimento em http://localhost:5173
yarn build    # Build de produção em dist/
yarn preview  # Servir o build localmente
```

### Alias de Path

O alias `@/` aponta para `./src/`, configurado tanto no `vite.config.ts` quanto no `tsconfig.app.json`. Use `@/` em todos os imports internos.

---

## Deploy (Vercel)

O `vercel.json` configura um SPA clássico: todas as rotas são reescritas para `index.html`, deixando o React Router tratar o roteamento no lado do cliente. Os headers de segurança são aplicados globalmente via bloco `headers`.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{ "source": "/(.*)", "headers": [...] }]
}
```
