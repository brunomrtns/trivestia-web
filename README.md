# Trivestia Web

> Web app premium da plataforma de educação financeira **Trivestia** — interface completa para alunos estudarem cursos, responderem atividades interativas e acompanharem progresso, além de um painel administrativo para gerenciar todo o conteúdo e usuários da plataforma.

---

## Visão Geral do Produto

O Trivestia é uma plataforma de **educação financeira voltada para investidores**. Este web app é o espelho do app mobile (`trivestia-app`) no navegador, com a mesma hierarquia de conteúdo (**Curso → Módulo → Aula → Atividade → Questão**) e os mesmos seis tipos de atividade. A identidade visual usa um tema escuro premium com a paleta "Precision Learning".

O app tem **três camadas de acesso**:
- **Pública** (`/`, `/courses`, `/courses/:id`) — qualquer visitante
- **Aluno autenticado** (`/app/*`) — estudar, responder, ver progresso
- **Administrador** (`/admin/*`) — gerenciar cursos, aulas, questões e usuários

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 18.3 |
| Linguagem | TypeScript 5.7 |
| Build tool | Vite 6.2 |
| Estilo | TailwindCSS 3.4 (CSS variables + dark mode via `class`) |
| Componentes | Radix UI primitives (padrão shadcn/ui) |
| Roteamento | React Router v6 (`createBrowserRouter`, lazy loading) |
| Estado global | Zustand 4.5 |
| Cache e fetching | TanStack React Query 5 (`staleTime: 5 min`) |
| HTTP Client | Axios 1.7 (interceptor hardened com refresh queue) |
| Formulários | React Hook Form 7.54 + Zod 3.24 |
| Animações | Framer Motion 11.15 |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable (atividades de ordenação) |
| Ícones | Lucide React |
| Toasts | Sonner |
| Deploy | Vercel (SPA, rewrite `/*` → `index.html`) |

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
│       ├── storage.ts          # Única fonte de verdade para localStorage
│       └── auth.store.ts       # Zustand: user, token, setAuth, logout
├── services/
│   ├── api/
│   │   └── client.ts           # Axios hardened com interceptor de refresh
│   └── endpoints/              # Módulos de chamadas por domínio
│       ├── auth.endpoints.ts
│       ├── learning.endpoints.ts
│       ├── progress.endpoints.ts
│       ├── admin.endpoints.ts
│       └── admin.users.endpoints.ts
├── routes/
│   ├── index.tsx               # Router completo com lazy loading
│   └── guards/
│       ├── AuthGuard.tsx       # Redireciona para /login se não autenticado
│       └── AdminGuard.tsx      # Redireciona para /app/dashboard se não ADMIN
├── layouts/
│   ├── PublicLayout.tsx        # Header + Footer para rotas públicas
│   ├── AuthLayout.tsx          # Layout centralizado para Login/Register
│   └── AppLayout/
│       ├── AppLayout.tsx       # Container com Sidebar + Topbar
│       ├── Sidebar.tsx         # Navegação lateral responsiva
│       └── Topbar.tsx          # Header com perfil e notificações
├── pages/
│   ├── public/                 # Landing, Courses, CourseDetail
│   ├── auth/                   # Login, Register
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

/login, /register (AuthLayout)

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

### Gerenciamento de Estado e Sessão

- **`authStorage`** (`features/auth/storage.ts`): única interface para `localStorage` — armazena `@tm:token`, `@tm:refreshToken` e `@tm:user`. Usa `removeItem` individual (compatibilidade com a API do localStorage).
- **`useAuthStore`** (Zustand): estado em memória sincronizado com o storage. `loadSession()` é chamado em `main.tsx` **antes** do `ReactDOM.render` para hidratar o estado sem flash de redirecionamento.
- **React Query**: cache de dados remotos por 5 minutos, `retry: 1`. Desabilitado (`enabled: false`) em queries que dependem de dados não disponíveis.

### Axios Hardened

O cliente em `services/api/client.ts` implementa o padrão de refresh com fila:

1. **Request interceptor**: injeta `Authorization: Bearer <token>` em toda requisição.
2. **Response interceptor (401)**: 
   - Ignora erros em rotas `/auth/` para evitar loop.
   - Define flag `_retry` para evitar tentativa dupla.
   - Usa lock `isRefreshing` e `failedQueue` para serializar múltiplas requisições simultâneas que expiraram.
   - Se o refresh falhar: chama `authStorage.clearSession()` e redireciona para `/login`.
   - Se o refresh tiver sucesso: processa a fila com o novo token.

---

## Design System

O tema é uma extensão do Tailwind com CSS variables definidas em `globals.css`:

| Token CSS | Cor | Uso |
|---|---|---|
| `--color-bg` | `#0C0E14` | Fundo principal |
| `--color-surface` | `#141720` | Cards e painéis elevados |
| `--color-brand` | `#4361EE` | Primária (Indigo) — CTAs, foco |
| `--color-accent` | `#D4943A` | Secundária (Âmbar) — scores, destaques |
| `--color-success` | `#2DC653` | Feedback positivo |
| `--color-error` | `#E63946` | Feedback negativo |
| `--color-text-primary` | `#F0F2F8` | Texto principal |
| `--color-text-secondary` | `#8B8FA8` | Texto auxiliar e labels |

Dark mode configurado via estratégia `class` no `tailwind.config.js`. A classe `dark` é aplicada estaticamente na tag `<html>`.

---

## Tipos de Atividade

O `QuestionRenderer` despacha para o renderer correto com base em `activity.type`:

| `ActivityType` | Componente | Experiência |
|---|---|---|
| `MULTIPLE_CHOICE` | `MultipleChoiceRenderer` | Radio buttons — 1 opção correta |
| `TRUE_FALSE` | `MultipleChoiceRenderer` | 2 opções: Verdadeiro / Falso |
| `SCENARIO` | `MultipleChoiceRenderer` | Contexto narrativo + radio buttons |
| `MULTIPLE_SELECT` | `MultipleSelectRenderer` | Checkboxes — N opções corretas |
| `ORDERING` | `OrderingRenderer` | Drag-and-drop com `@dnd-kit` para reordenar |
| `TEXT_INPUT` | `TextInputRenderer` | Campo de texto livre |

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
