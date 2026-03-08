# i18n Migration — Handoff Document

> **Para o próximo agente:** Este arquivo descreve exatamente o que foi feito, as regras do processo e o que falta para completar a migração i18n do projeto `trivestia-web`. Leia tudo antes de começar.

---

## 1. Objetivo

Mapear **todas as strings hard-coded visíveis ao usuário** do projeto `trivestia-web` (React + TypeScript) em dois arquivos:

| Arquivo | Propósito |
|---------|-----------|
| `src/i18n/locales/pt-BR.json` | Traduções pt-BR aninhadas em JSON — serão consumidas pelo `react-i18next` |
| `docs/i18n-inventory.md` | Inventário tabular de cada string encontrada, com categoria, arquivo de origem e chave sugerida |

**Nenhum código-fonte deve ser alterado nesta etapa.** Apenas os dois arquivos acima são modificados.

---

## 2. Regras do Processo

### 2.1 Lotes (máximo 10 arquivos por lote)
- Ler os arquivos em paralelo
- Extrair todas as strings visíveis ao usuário
- Escrever no JSON e no inventário **no mesmo lote**, antes de avançar
- Validar o JSON com `python3 -c "import json; json.load(open('src/i18n/locales/pt-BR.json'))"` após cada lote

### 2.2 Categorias de string

| Categoria | Quando usar |
|-----------|-------------|
| `ui` | Labels, títulos, textos de interface |
| `form` | Labels de campos de formulário, placeholders |
| `validation` | Mensagens de erro de validação (zod, react-hook-form) |
| `toast` | Mensagens de `toast.success` / `toast.error` |
| `aria` | Atributos `aria-label`, `title` em botões de ícone |
| `error` | Mensagens de erro de API/estado de erro |
| `empty` | Estados vazios ("Nenhum item encontrado", etc.) |
| `loading` | Estados de carregamento |
| `misc` | Termos de glossário, textos de tutorial multi-linha |

### 2.3 Padrão de chaves

```
domain.screen.component.name
```

Exemplos:
- `admin.courses.emptyState` → página admin, tabela de cursos, estado vazio
- `sim.briefing.objectives.title` → sim-trading, briefing screen, seção objetivos, título
- `common.actions.cancel` → ação global reutilizável

### 2.4 Reutilização de common.*

Antes de criar uma nova chave, verificar se já existe em `common`:
- `common.actions.cancel` — "Cancelar"
- `common.actions.back` — "Voltar"
- `common.actions.previous` — "Anterior"
- `common.actions.next` — "Próximo"
- `common.actions.saving` — "Salvando..."
- `common.aria.logout` — aria-label "Sair"
- `common.aria.menu` — aria-label "Menu"
- `common.aria.expandSidebar` / `collapseSidebar`

### 2.5 Strings a IGNORAR (não são candidatas i18n)
- Constantes técnicas: `"BUY"`, `"SELL"`, `"MARKET"`, `"LIMIT"`, `"STOP"` (valores de enum)
- Slugs de URL, IDs, nomes de classe CSS
- Valores de `console.log`, comentários de código
- Dados dinâmicos vindos da API (nomes de usuário, nomes de escola, etc. — estes usam interpolação `{{variavel}}`)

### 2.6 Formato da tabela de inventário

```markdown
| # | Categoria | Arquivo | Texto original | Chave i18n sugerida | Observações |
```

### 2.7 Estrutura de cada lote no inventário

```markdown
## Lote N — Descrição dos arquivos

### Arquivos analisados
| # | Arquivo | Strings encontradas |

### Novas entradas
| # | Categoria | Arquivo | Texto original | Chave i18n sugerida | Observações |

### Novas chaves adicionadas ao pt-BR.json
- `dominio.bloco` — N novas chaves — descrição
- **Total Lote N: X novas chaves**
```

---

## 3. Estado Atual dos Arquivos

### `src/i18n/locales/pt-BR.json`
- **Linhas:** 1160
- **JSON válido:** ✅ (validado com Python após cada lote)
- **Top-level keys (11):** `common`, `admin`, `auth`, `platform`, `public`, `app`, `error`, `learning`, `super`, `workspace`, `sim`

#### Estrutura detalhada

```
common
  ├── actions: back, cancel, save, saveChanges, saving, confirm, delete, edit, create, previous, next
  ├── nav: (nav labels globais)
  ├── fields: name, email, password, etc.
  ├── placeholders
  ├── roles: superAdmin, owner, admin, student
  ├── aria: expandSidebar, collapseSidebar, menu, logout
  ├── validation
  ├── pagination
  ├── priority
  ├── timeframe
  └── misc

admin
  ├── nav
  ├── questions
  ├── courses
  ├── lessons
  ├── users
  ├── announcements (com form, priority, toast, page)
  ├── periods
  ├── periodForm
  ├── lessonSteps
  ├── stepForm
  ├── questionPreview
  ├── chartMarkupForm  ← Lote 7
  ├── riskCalcForm     ← Lote 7
  └── simForm          ← Lote 7

auth
  ├── layout
  ├── login
  └── register

platform
  ├── login
  └── professorRegister

public
  ├── footer
  ├── courses
  ├── courseDetail
  ├── landing
  └── createSchool

app
  ├── dashboard
  ├── announcements
  ├── progress
  ├── lab
  ├── practiceHistory
  ├── lesson
  ├── lessonPlayer
  ├── activity
  ├── course
  ├── weeklyGoal
  └── labSummary

error
  └── wrongTenant

learning
  ├── lock
  ├── timeline
  ├── stepPlayer
  ├── multipleSelect
  ├── textInput
  ├── ordering
  ├── chartMarkup
  ├── riskCalc
  ├── courseInteractive
  ├── courseOutline
  └── lessonLock

super
  ├── layout   ← Lote 7
  ├── dashboard
  ├── tenants
  ├── tenantEdit
  └── users

workspace                ← Lote 8 (TOP-LEVEL NOVO)
  ├── layout
  ├── tenantPublic
  └── page

sim                      ← Lote 8 (TOP-LEVEL NOVO)
  ├── briefing
  ├── result
  ├── orderTicket
  ├── help
  ├── accountSummary
  ├── metrics
  └── tutorial
```

### `docs/i18n-inventory.md`
- **Linhas:** 993
- **Entradas totais:** 828 (entradas #1 a #812)
- **Última entrada:** `#812 | ui | OnboardingTour.tsx | Concluir | sim.tutorial.finishButton`
- **Marcador de continuação:** `<!-- PRÓXIMOS LOTES SERÃO ADICIONADOS ABAIXO -->` no final do arquivo
- **Inserir novas entradas ACIMA do marcador**

---

## 4. Lotes Concluídos

| Lote | Entradas | Arquivos cobertos |
|------|----------|-------------------|
| 1 | #1–#65 | AppLayout (Sidebar, Topbar), AuthLayout, PublicLayout, LoginPage, RegisterPage, DashboardPage, WrongTenantGate |
| 2 | #66–#158 | ContinueCard, WeeklyGoalWidget, AnnouncementsPage (student), ProgressPage, PracticeLabPage, PracticeHistoryPage, LessonPage, CoursesPage, CourseDetailPage, LandingPage |
| 3 | #159–#315 | ActivityPlayerPage, CourseInteractivePage, GlobalLoginPage, ProfessorRegisterPage, CreateSchoolPage (public), AnnouncementBell, AnnouncementFormModal, GoalConfigModal, LabSummaryCard, TenantAuthLayout |
| 4 | #316–#414 | AdminQuestionsPage, AdminCoursesPage, AdminLessonsPage, AdminUsersPage, AdminAnnouncementsPage, AdminPeriodsPage, PeriodFormModal, CourseInteractiveHeader, CourseOutlineSidebar, LessonLockBadge |
| 5 | #415–#475 | ActivityPlayerContent, StepPlayer, MultipleChoiceRenderer, MultipleSelectRenderer, OrderingRenderer, TextInputRenderer, ChartMarkupRenderer, RiskCalculatorRenderer, LessonTimeline, CourseInlineLessonPlayer |
| 6 | #476–#609 | AdminLessonStepsPage, StepFormModal, QuestionPreviewCard, SuperDashboardPage, SuperTenantsPage, SuperTenantEditPage, SuperUsersPage |
| 7 | #610–#693 | ChartMarkupQuestionForm, RiskCalculatorQuestionForm, SimTradingQuestionForm, SuperAdminLayout (SuperSidebar + SuperTopbar) |
| 8 | #694–#812 | WorkspaceLayout, TenantPublicLayout, WorkspacePage, ChallengeBriefingScreen, ResultScreen, OrderTicket, HelpDrawer, AccountSummary, MetricsPanel, OnboardingTour |

---

## 5. O Que Falta — Lotes Pendentes

### Lote 9 — sim-trading (componentes restantes)

Arquivos em `src/components/sim-trading/` ainda não cobertos:

| Arquivo | Descrição esperada |
|---------|-------------------|
| `PlaybackControls.tsx` | Botões play/pause/step-forward, seletor de velocidade, "Enviar Resultado" |
| `PositionPanel.tsx` | Painel de posição aberta (PnL, botão Fechar) |
| `FillsPanel.tsx` | Tabela de preenchimentos/execuções |
| `OrdersPanel.tsx` | Tabela de ordens pendentes |
| `ScenarioLoader.tsx` | Tela de loading/erro ao carregar cenário |
| `SimTradingTerminal.tsx` | Terminal principal — agrupa os painéis, provavelmente tem abas e botão de submit |

> **Atenção:** `CandlesChart.tsx` provavelmente não tem strings visíveis (é só gráfico). Verificar antes de pular.

### Lote 10 — Verificação final + páginas que podem ter ficado de fora

Após Lote 9, verificar:

| Arquivo | Status |
|---------|--------|
| `src/pages/workspace/CreateSchoolPage.tsx` | ⚠️ Coberto em Lote 3 como `src/pages/public/CreateSchoolPage.tsx` — verificar se o arquivo em `workspace/` é diferente |
| `src/routes/` | Verificar se há strings em guards/wrappers de rota |
| `src/hooks/` | Verificar se algum hook tem strings de erro/toast |
| `src/services/` | Verificar se há mensagens de erro visíveis nos services |
| `src/features/` | Verificar se há stores com mensagens visíveis |
| `src/components/ui/Portal.tsx` | Provavelmente sem strings (wrapper técnico) |

---

## 6. Como Continuar em uma Nova Sessão

### Passo 1 — Verificar estado atual

```bash
# Validar JSON
python3 -c "import json; json.load(open('src/i18n/locales/pt-BR.json')); print('✅ OK')"

# Contar entradas no inventário
grep -c "^| [0-9]" docs/i18n-inventory.md

# Ver última entrada
grep "^| [0-9]" docs/i18n-inventory.md | tail -3
```

### Passo 2 — Pedir ao Copilot para continuar

Prompt sugerido:
```
Leia o arquivo docs/i18n-handoff.md do projeto trivestia-web e continue a 
migração i18n a partir do Lote 9 conforme documentado. As regras, convenções 
e estado atual estão no handoff.
```

### Passo 3 — Conferir as convenções

Antes de escrever qualquer chave nova, confirmar:
1. Verificar se a chave não existe já em `common.*`
2. Inserir novas entradas do JSON **dentro do bloco correto** (não criar novo top-level desnecessariamente)
3. Adicionar entradas no inventário **antes do marcador** `<!-- PRÓXIMOS LOTES SERÃO ADICIONADOS ABAIXO -->`
4. Validar JSON após cada lote

---

## 7. Convenções de Interpolação e Pluralização

```json
// Interpolação simples
"welcome": "Bem-vindo, {{name}}"

// Pluralização (react-i18next)
"count_one": "{{count}} item",
"count_other": "{{count}} itens"

// Interpolação com formatação
"pagination": "{{total}} item(s) • Página {{page}} de {{totalPages}}"
```

---

## 8. Tecnologias do Projeto

| Item | Versão/Lib |
|------|-----------|
| Framework | React + TypeScript (TSX) |
| i18n | react-i18next |
| Forms | react-hook-form + zod (`zodResolver`) |
| Toast | Sonner (`toast.success`, `toast.error`) |
| Routing | React Router v6 (`/t/:tenantSlug/` para rotas de tenant) |
| State | Zustand (`useAuthStore`, `usePlatformAuthStore`) |
| Estilos | Tailwind CSS |

---

## 9. Localização dos Arquivos

```
trivestia-web/
├── src/
│   ├── i18n/
│   │   └── locales/
│   │       └── pt-BR.json          ← ARQUIVO DE TRADUÇÃO (1160 linhas)
│   └── components/
│       └── sim-trading/            ← PRÓXIMOS LOTES AQUI
│           ├── PlaybackControls.tsx  ✗ pendente
│           ├── PositionPanel.tsx     ✗ pendente
│           ├── FillsPanel.tsx        ✗ pendente
│           ├── OrdersPanel.tsx       ✗ pendente
│           ├── ScenarioLoader.tsx    ✗ pendente
│           ├── SimTradingTerminal.tsx ✗ pendente
│           └── CandlesChart.tsx      ? verificar
└── docs/
    ├── i18n-inventory.md           ← INVENTÁRIO (993 linhas, 828 entradas)
    └── i18n-handoff.md             ← ESTE ARQUIVO
```

---

*Documento gerado em 07/03/2026 — após conclusão do Lote 8 (entradas #1–#812).*
