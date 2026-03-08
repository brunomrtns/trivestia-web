# i18n Inventory — Trivestia Web

> Inventário incremental de strings visíveis ao usuário. Gerado via auditoria de lotes.  
> **NÃO alterar código nesta etapa.** Use este arquivo como referência para a migração futura.

## Convenções

| Campo | Valores possíveis |
|-------|------------------|
| **Categoria** | `ui` · `form` · `validation` · `toast` · `aria` · `error` · `empty` · `loading` · `misc` |
| **Domínios** | `common` · `public` · `auth` · `app` · `learning` · `progress` · `admin` · `error` |
| **Chave** | `dominio.grupo.componente.nome` |

### Interpolações
- Variáveis usam `{{variavel}}` (padrão react-i18next futuro).

---

## Lote 1 — Layouts globais + Auth + Dashboard

**Arquivos cobertos:**
- `src/layouts/AppLayout/AppLayout.tsx` (sem strings visíveis)
- `src/layouts/AppLayout/Sidebar.tsx`
- `src/layouts/AppLayout/Topbar.tsx`
- `src/layouts/AuthLayout.tsx`
- `src/layouts/PublicLayout.tsx`
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/pages/student/DashboardPage.tsx`
- `src/components/WrongTenantGate.tsx`

| # | Categoria | Arquivo | Texto PT-BR | Chave | Notas |
|---|-----------|---------|-------------|-------|-------|
| 1 | ui | Sidebar.tsx | Dashboard | `common.nav.dashboard` | Nav label — estudante |
| 2 | ui | Sidebar.tsx | Cursos | `common.nav.courses` | Nav label — estudante |
| 3 | ui | Sidebar.tsx | Laboratório | `common.nav.lab` | Nav label — estudante |
| 4 | ui | Sidebar.tsx | Progresso | `common.nav.progress` | Nav label — estudante |
| 5 | ui | Sidebar.tsx | Avisos | `common.nav.announcements` | Nav label — estudante e admin |
| 6 | ui | Sidebar.tsx | Gerenciar Cursos | `admin.nav.manageCourses` | Nav label — admin only |
| 7 | ui | Sidebar.tsx | Usuários | `admin.nav.users` | Nav label — admin only |
| 8 | ui | Sidebar.tsx | Plataforma | `admin.nav.platform` | Nav label — admin only |
| 9 | ui | Sidebar.tsx | Super Admin | `common.roles.superAdmin` | Badge de role |
| 10 | ui | Sidebar.tsx | Owner | `common.roles.owner` | Badge de role |
| 11 | ui | Sidebar.tsx | Admin | `common.roles.admin` | Badge de role |
| 12 | aria | Sidebar.tsx | Expandir sidebar | `common.aria.expandSidebar` | aria-label do botão toggle |
| 13 | aria | Sidebar.tsx | Colapsar sidebar | `common.aria.collapseSidebar` | aria-label do botão toggle |
| 14 | aria | Topbar.tsx | Menu | `common.aria.menu` | aria-label botão hamburger |
| 15 | aria | Topbar.tsx | Sair | `common.aria.logout` | aria-label/title botão logout |
| 16 | misc | AuthLayout.tsx | "O investimento em conhecimento sempre paga os melhores dividendos." | `auth.layout.quote` | Blockquote painel esquerdo |
| 17 | misc | AuthLayout.tsx | — Benjamin Franklin | `auth.layout.quoteAuthor` | Atribuição da citação |
| 18 | ui | PublicLayout.tsx | Cursos | `common.nav.courses` | Reusa #2 |
| 19 | ui | PublicLayout.tsx | Dashboard | `common.nav.dashboard` | Reusa #1 |
| 20 | ui | PublicLayout.tsx | Entrar | `common.actions.login` | Botão/link de login no nav |
| 21 | aria | PublicLayout.tsx | Sair | `common.aria.logout` | Reusa #15 |
| 22 | ui | PublicLayout.tsx | © {{year}} Trivestia. Todos os direitos reservados. | `public.footer.copyright` | Footer — plataforma |
| 23 | validation | LoginPage.tsx | E-mail inválido | `common.validation.emailInvalid` | Zod message |
| 24 | validation | LoginPage.tsx | Senha obrigatória | `common.validation.passwordRequired` | Zod message |
| 25 | ui | LoginPage.tsx | Entrar | `auth.login.title` | h1 da página |
| 26 | ui | LoginPage.tsx | Novo por aqui? | `auth.login.newHere` | Texto lead antes do link |
| 27 | ui | LoginPage.tsx | Criar conta | `common.actions.register` | Link → RegisterPage |
| 28 | form | LoginPage.tsx | E-mail | `common.fields.email` | Label de campo |
| 29 | form | LoginPage.tsx | Senha | `common.fields.password` | Label de campo |
| 30 | ui | LoginPage.tsx | Trocar | `auth.login.changeEmail` | Link para limpar e-mail pré-preenchido |
| 31 | form | LoginPage.tsx | voce@email.com | `common.placeholders.email` | Placeholder input e-mail |
| 32 | ui | LoginPage.tsx | Entrar | `common.actions.login` | Botão submit — reusa #20 |
| 33 | toast | LoginPage.tsx | Bem-vindo, {{name}}! | `auth.login.toast.success` | `${res.user.name}` → `{{name}}` |
| 34 | toast | LoginPage.tsx | E-mail ou senha inválidos. | `auth.login.toast.error` | toast.error |
| 35 | validation | RegisterPage.tsx | Nome deve ter no mínimo 2 caracteres | `common.validation.nameMinLength` | Zod message |
| 36 | validation | RegisterPage.tsx | E-mail inválido | `common.validation.emailInvalid` | Reusa #23 |
| 37 | validation | RegisterPage.tsx | Mínimo de 8 caracteres | `common.validation.passwordMinLength` | Zod message |
| 38 | validation | RegisterPage.tsx | Precisa de pelo menos uma letra maiúscula | `common.validation.passwordUppercase` | Zod message |
| 39 | validation | RegisterPage.tsx | Precisa de pelo menos um número | `common.validation.passwordNumber` | Zod message |
| 40 | ui | RegisterPage.tsx | Criar conta | `auth.register.title` | h1 da página |
| 41 | ui | RegisterPage.tsx | Já tem conta? | `auth.register.hasAccount` | Texto lead antes do link |
| 42 | ui | RegisterPage.tsx | Entrar | `common.actions.login` | Link → LoginPage — reusa #20 |
| 43 | form | RegisterPage.tsx | Nome completo | `common.fields.fullName` | Label de campo |
| 44 | form | RegisterPage.tsx | E-mail | `common.fields.email` | Reusa #28 |
| 45 | form | RegisterPage.tsx | Senha | `common.fields.password` | Reusa #29 |
| 46 | form | RegisterPage.tsx | Seu nome | `common.placeholders.name` | Placeholder input nome |
| 47 | form | RegisterPage.tsx | voce@email.com | `common.placeholders.email` | Reusa #31 |
| 48 | form | RegisterPage.tsx | Mín. 8 caracteres | `common.placeholders.passwordMin` | Placeholder input senha |
| 49 | ui | RegisterPage.tsx | Criar conta | `common.actions.register` | Botão submit — reusa #27 |
| 50 | toast | RegisterPage.tsx | Conta criada com sucesso! | `auth.register.toast.success` | toast.success |
| 51 | toast | RegisterPage.tsx | Não foi possível criar a conta. Tente outro e-mail. | `auth.register.toast.error` | toast.error |
| 52 | ui | DashboardPage.tsx | Olá, {{firstName}} | `app.dashboard.greeting` | h1 — `${firstName}` → `{{firstName}}` |
| 53 | ui | DashboardPage.tsx | Continue de onde parou. | `app.dashboard.subtitle` | Subtítulo da página |
| 54 | ui | DashboardPage.tsx | Cursos disponíveis | `app.dashboard.availableCourses` | Heading de seção |
| 55 | ui | DashboardPage.tsx | Ver todos | `common.actions.viewAll` | Link masculino plural |
| 56 | ui | DashboardPage.tsx | Atividade recente | `app.dashboard.recentActivity` | Heading de seção |
| 57 | ui | DashboardPage.tsx | Ver tudo | `common.actions.seeAll` | Link neutro |
| 58 | ui | DashboardPage.tsx | Aulas concluídas | `app.dashboard.stats.completedLessons` | Label de stat card |
| 59 | ui | DashboardPage.tsx | Em andamento | `app.dashboard.stats.inProgress` | Label de stat card |
| 60 | ui | DashboardPage.tsx | Total de aulas | `app.dashboard.stats.totalLessons` | Label de stat card |
| 61 | ui | DashboardPage.tsx | Pontuação média | `app.dashboard.stats.avgScore` | Label de stat card |
| 62 | error | WrongTenantGate.tsx | Acesso negado | `error.wrongTenant.title` | h1 da tela de erro |
| 63 | error | WrongTenantGate.tsx | Você está autenticado na escola {{correctSlug}} e não tem permissão para acessar esta escola. | `error.wrongTenant.message` | `{correctSlug}` → `{{correctSlug}}` |
| 64 | ui | WrongTenantGate.tsx | Ir para minha escola | `error.wrongTenant.goToMySchool` | Botão principal |
| 65 | ui | WrongTenantGate.tsx | Voltar | `common.actions.back` | Botão secundário |

---

## Lote 2 — Páginas de aluno + Landing + ContinueCard + WeeklyGoal

**Arquivos cobertos:**
- `src/components/dashboard/ContinueCard.tsx`
- `src/components/dashboard/WeeklyGoalWidget.tsx`
- `src/pages/student/AnnouncementsPage.tsx`
- `src/pages/student/ProgressPage.tsx`
- `src/pages/student/PracticeLabPage.tsx`
- `src/pages/student/PracticeHistoryPage.tsx`
- `src/pages/student/LessonPage.tsx`
- `src/pages/public/CoursesPage.tsx`
- `src/pages/public/CourseDetailPage.tsx`
- `src/pages/public/LandingPage.tsx`

| # | Categoria | Arquivo | Texto PT-BR | Chave | Notas |
|---|-----------|---------|-------------|-------|-------|
| 66 | ui | ContinueCard.tsx | Continue de onde parou | `app.dashboard.continueCard.label` | Label da seção de continuação |
| 67 | ui | ContinueCard.tsx | Continuar | `common.actions.continue` | Botão de ação |
| 68 | ui | ContinueCard.tsx | Ver cursos | `app.dashboard.continueCard.viewCourses` | Link quando sem progresso |
| 69 | ui | ContinueCard.tsx | Parabéns! Você completou tudo. | `app.dashboard.continueCard.allDone` | Estado "tudo concluído" |
| 70 | ui | ContinueCard.tsx | Continue explorando os cursos disponíveis. | `app.dashboard.continueCard.allDoneSubtitle` | Subtítulo do estado |
| 71 | ui | ContinueCard.tsx | Comece seu primeiro curso | `app.dashboard.continueCard.startFirst` | Estado sem progresso |
| 72 | ui | ContinueCard.tsx | Explore os cursos disponíveis e dê o primeiro passo. | `app.dashboard.continueCard.startFirstSubtitle` | Subtítulo sem progresso |
| 73 | ui | WeeklyGoalWidget.tsx | Meta semanal | `app.dashboard.weeklyGoal.title` | Heading do widget |
| 74 | ui | WeeklyGoalWidget.tsx | {{weeklyCompleted}} de {{weeklyTarget}} atividades | `app.dashboard.weeklyGoal.progress` | Contagem semanal |
| 75 | aria | WeeklyGoalWidget.tsx | Configurar meta | `app.dashboard.weeklyGoal.aria.configure` | aria-label botão config |
| 76 | ui | WeeklyGoalWidget.tsx | Meta! | `app.dashboard.weeklyGoal.achieved` | Badge quando meta atingida |
| 77 | ui | WeeklyGoalWidget.tsx | dia seguido | `app.dashboard.weeklyGoal.streakDay_one` | Singular de streak |
| 78 | ui | WeeklyGoalWidget.tsx | dias seguidos | `app.dashboard.weeklyGoal.streakDay_other` | Plural de streak (regra PT-BR) |
| 79 | ui | WeeklyGoalWidget.tsx | recorde | `app.dashboard.weeklyGoal.record` | Label do recorde |
| 80 | ui | WeeklyGoalWidget.tsx | {{date}}: {{count}} atividade(s) | `app.dashboard.weeklyGoal.activityTooltip` | title do dia no mini-calendário |
| 81 | misc | WeeklyGoalWidget.tsx | S, T, Q, Q, S, S, D | `app.dashboard.weeklyGoal.days` | Array abreviações Seg→Dom |
| 82 | ui | AnnouncementsPage.tsx | Informação | `common.priority.info` | Label prioridade INFO |
| 83 | ui | AnnouncementsPage.tsx | Atenção | `common.priority.warning` | Label prioridade WARNING |
| 84 | ui | AnnouncementsPage.tsx | Urgente | `common.priority.critical` | Label prioridade CRITICAL |
| 85 | ui | AnnouncementsPage.tsx | Avisos | `common.nav.announcements` | Reusa #5 — h1 da página |
| 86 | ui | AnnouncementsPage.tsx | {{count}} não lido | `app.announcements.unreadCount_one` | Singular |
| 87 | ui | AnnouncementsPage.tsx | {{count}} não lidos | `app.announcements.unreadCount_other` | Plural |
| 88 | ui | AnnouncementsPage.tsx | Marcar todos como lidos | `app.announcements.markAllRead` | Botão ação em massa |
| 89 | empty | AnnouncementsPage.tsx | Nenhum aviso disponível no momento. | `app.announcements.empty` | Estado vazio |
| 90 | ui | AnnouncementsPage.tsx | · expira em {{date}} | `app.announcements.expiresAt` | Rótulo de expiração |
| 91 | aria | AnnouncementsPage.tsx | Marcar como lido | `app.announcements.markAsRead` | title do botão individual |
| 92 | ui | AnnouncementsPage.tsx | Anterior | `common.pagination.previous` | Paginação — reutilizado |
| 93 | ui | AnnouncementsPage.tsx | Próximo | `common.pagination.next` | Paginação — reutilizado |
| 94 | toast | AnnouncementsPage.tsx | {{count}} aviso(s) marcado(s) como lido(s). | `app.announcements.toast.markAllSuccess` | toast.success |
| 95 | ui | ProgressPage.tsx | Meu progresso | `app.progress.title` | h1 da página |
| 96 | ui | ProgressPage.tsx | Acompanhe sua evolução em todas as aulas. | `app.progress.subtitle` | Subtítulo |
| 97 | ui | ProgressPage.tsx | Concluídas | `app.progress.stats.completed` | Label stat card |
| 98 | ui | ProgressPage.tsx | Média de pontuação | `app.progress.stats.avgScore` | Label stat card |
| 99 | ui | ProgressPage.tsx | Total de aulas | `app.progress.stats.totalLessons` | Mesmo texto de `app.dashboard.stats.totalLessons` |
| 100 | empty | ProgressPage.tsx | Nenhuma aula iniciada ainda. | `app.progress.empty` | Estado vazio |
| 101 | ui | PracticeLabPage.tsx | Laboratório de Trading | `app.lab.title` | h1 da página |
| 102 | ui | PracticeLabPage.tsx | Pratique sem pressão. Configure o cenário e treine sua estratégia. | `app.lab.subtitle` | Subtítulo |
| 103 | ui | PracticeLabPage.tsx | Histórico | `app.lab.historyLink` | Link para histórico |
| 104 | form | PracticeLabPage.tsx | Configuração do Cenário | `app.lab.form.title` | Header do formulário |
| 105 | form | PracticeLabPage.tsx | Candles (50–500) | `app.lab.form.candles` | Label campo |
| 106 | form | PracticeLabPage.tsx | Timeframe | `app.lab.form.timeframe` | Label campo |
| 107 | form | PracticeLabPage.tsx | Volatilidade (0.0001–0.1) | `app.lab.form.volatility` | Label campo |
| 108 | form | PracticeLabPage.tsx | Tendência (–1 a +1) | `app.lab.form.trend` | Label campo |
| 109 | form | PracticeLabPage.tsx | Spread (bps) | `app.lab.form.spread` | Label campo |
| 110 | form | PracticeLabPage.tsx | Saldo Inicial ($) | `app.lab.form.balance` | Label campo |
| 111 | ui | PracticeLabPage.tsx | 1 min | `common.timeframe.1min` | Opção de timeframe — compartilhada |
| 112 | ui | PracticeLabPage.tsx | 5 min | `common.timeframe.5min` | Opção de timeframe |
| 113 | ui | PracticeLabPage.tsx | 15 min | `common.timeframe.15min` | Opção de timeframe |
| 114 | ui | PracticeLabPage.tsx | 1 hora | `common.timeframe.1h` | Opção de timeframe |
| 115 | ui | PracticeLabPage.tsx | Iniciar Simulação | `app.lab.form.submit` | Botão submit |
| 116 | loading | PracticeLabPage.tsx | Criando cenário... | `app.lab.form.submitLoading` | Estado loading |
| 117 | toast | PracticeLabPage.tsx | Erro ao criar sessão de prática | `app.lab.toast.error` | toast.error |
| 118 | ui | PracticeHistoryPage.tsx | Histórico de Prática | `app.practiceHistory.title` | h1 da página |
| 119 | ui | PracticeHistoryPage.tsx | Laboratório | `app.practiceHistory.backToLab` | Breadcrumb |
| 120 | empty | PracticeHistoryPage.tsx | Nenhuma sessão de prática ainda. | `app.practiceHistory.empty` | Estado vazio |
| 121 | ui | PracticeHistoryPage.tsx | Começar agora | `common.actions.startNow` | Link no estado vazio |
| 122 | empty | PracticeHistoryPage.tsx | Sessão sem resultado | `app.practiceHistory.noResult` | Item sem dados |
| 123 | ui | LessonPage.tsx | Voltar ao curso | `app.lesson.backToCourse` | Breadcrumb |
| 124 | ui | LessonPage.tsx | Etapa {{n}} de {{total}} · {{viewed}}/{{total}} concluídas | `app.lesson.stepProgress` | Indicador de progresso |
| 125 | ui | LessonPage.tsx | Anterior | `common.pagination.previous` | Reusa #92 |
| 126 | ui | LessonPage.tsx | Próxima | `app.lesson.nav.next` | Feminino — nav entre aulas |
| 127 | empty | LessonPage.tsx | Nenhuma atividade disponível nesta aula ainda. | `app.lesson.empty` | Estado vazio |
| 128 | ui | CoursesPage.tsx | Cursos disponíveis | `public.courses.title` | h1 da página |
| 129 | ui | CoursesPage.tsx | Explore nossa grade e encontre o curso ideal para você. | `public.courses.subtitle` | Subtítulo |
| 130 | error | CoursesPage.tsx | Não foi possível carregar os cursos. Tente novamente. | `public.courses.error` | Mensagem de erro |
| 131 | ui | CoursesPage.tsx | {{n}} módulos | `public.courses.card.modules` | Contador de módulos no card |
| 132 | ui | CoursesPage.tsx | Ver curso | `public.courses.card.viewCourse` | Botão do card |
| 133 | empty | CoursesPage.tsx | Nenhum curso disponível ainda. | `public.courses.empty` | Estado vazio |
| 134 | ui | CourseDetailPage.tsx | Começar curso | `public.courseDetail.startCourse` | Botão para não-autenticado |
| 135 | ui | CourseDetailPage.tsx | Continuar curso | `public.courseDetail.continueCourse` | Botão para autenticado |
| 136 | ui | CourseDetailPage.tsx | Conteúdo do curso | `public.courseDetail.contentTitle` | h2 seção de conteúdo |
| 137 | ui | CourseDetailPage.tsx | {{n}} aulas | `public.courseDetail.lessonCount` | Contador de aulas |
| 138 | ui | LandingPage.tsx | Plataforma de educação financeira | `public.landing.badge` | Badge hero |
| 139 | ui | LandingPage.tsx | Invista no seu conhecimento | `public.landing.title` | h1 hero |
| 140 | ui | LandingPage.tsx | Aprenda análise de investimentos, gestão de risco e finanças pessoais com conteúdo prático, interativo e no seu ritmo. | `public.landing.subtitle` | Parágrafo hero |
| 141 | ui | LandingPage.tsx | Criar escola | `public.landing.createSchool` | Botão hero secundário |
| 142 | ui | LandingPage.tsx | Tudo que você precisa para aprender | `public.landing.featuresSection.title` | h2 seção features |
| 143 | ui | LandingPage.tsx | Uma plataforma completa pensada para quem quer ir além | `public.landing.featuresSection.subtitle` | Subtítulo seção |
| 144 | ui | LandingPage.tsx | Conteúdo estruturado | `public.landing.features.structured.title` | Feature card |
| 145 | ui | LandingPage.tsx | Cursos organizados em módulos e aulas progressivas para uma aprendizagem eficiente. | `public.landing.features.structured.description` | Feature descrição |
| 146 | ui | LandingPage.tsx | 6 tipos de atividade | `public.landing.features.activities.title` | Feature card |
| 147 | ui | LandingPage.tsx | Múltipla escolha, V/F, ordenação, texto livre e cenários para fixar o conhecimento. | `public.landing.features.activities.description` | Feature descrição |
| 148 | ui | LandingPage.tsx | Progresso detalhado | `public.landing.features.progress.title` | Feature card |
| 149 | ui | LandingPage.tsx | Acompanhe sua evolução com métricas claras de desempenho em cada aula. | `public.landing.features.progress.description` | Feature descrição |
| 150 | ui | LandingPage.tsx | Aprenda investindo | `public.landing.features.trading.title` | Feature card |
| 151 | ui | LandingPage.tsx | Domine análise fundamentalista, técnica e gestão de risco com didática premium. | `public.landing.features.trading.description` | Feature descrição |
| 152 | ui | LandingPage.tsx | Alunos ativos | `public.landing.stats.activeStudents` | Stat label |
| 153 | ui | LandingPage.tsx | Horas de conteúdo | `public.landing.stats.contentHours` | Stat label |
| 154 | ui | LandingPage.tsx | Taxa de conclusão | `public.landing.stats.completionRate` | Stat label |
| 155 | ui | LandingPage.tsx | Nota média | `public.landing.stats.avgScore` | Stat label |
| 156 | ui | LandingPage.tsx | Comece sua jornada hoje | `public.landing.cta.title` | h2 CTA |
| 157 | ui | LandingPage.tsx | Acesse gratuitamente e descubra como investir com inteligência. | `public.landing.cta.subtitle` | Parágrafo CTA |
| 158 | ui | LandingPage.tsx | Criar conta grátis | `public.landing.cta.button` | Botão CTA principal |

---

## Lote 3 — Student pages + Platform pages + Dashboard components

**Arquivos cobertos:**
- `src/pages/student/ActivityPlayerPage.tsx`
- `src/pages/student/CourseInteractivePage.tsx`
- `src/pages/platform/GlobalLoginPage.tsx`
- `src/pages/platform/ProfessorRegisterPage.tsx`
- `src/pages/public/CreateSchoolPage.tsx`
- `src/components/announcements/AnnouncementBell.tsx`
- `src/components/announcements/AnnouncementFormModal.tsx`
- `src/components/dashboard/GoalConfigModal.tsx`
- `src/components/dashboard/LabSummaryCard.tsx`
- `src/layouts/TenantAuthLayout.tsx` (sem novas chaves — reusa `auth.layout.*`)

| # | Categoria | Arquivo | Texto PT-BR | Chave | Notas |
|---|-----------|---------|-------------|-------|-------|
| 159 | toast | ActivityPlayerPage.tsx | Atividade concluída! | `app.activity.toast.submitSuccess` | toast.success |
| 160 | toast | ActivityPlayerPage.tsx | Erro ao enviar respostas. Tente novamente. | `app.activity.toast.submitError` | toast.error |
| 161 | empty | ActivityPlayerPage.tsx | Nenhuma questão cadastrada | `app.activity.empty.title` | Estado vazio — sem questões |
| 162 | empty | ActivityPlayerPage.tsx | Esta atividade ainda não possui questões. Peça ao administrador para adicioná-las. | `app.activity.empty.subtitle` | |
| 163 | ui | ActivityPlayerPage.tsx | Parabéns! Você passou. | `app.activity.result.passed` | Resultado aprovado |
| 164 | ui | ActivityPlayerPage.tsx | Continue praticando! | `app.activity.result.failed` | Resultado reprovado |
| 165 | ui | ActivityPlayerPage.tsx | {{score}} de {{maxScore}} pontos | `app.activity.result.scoreLabel` | Subtítulo do resultado |
| 166 | ui | ActivityPlayerPage.tsx | Revisão das questões | `app.activity.result.reviewTitle` | h2 seção de revisão |
| 167 | ui | ActivityPlayerPage.tsx | O professor optou por não liberar o gabarito desta atividade. | `app.activity.result.policyNever` | Política NEVER |
| 168 | ui | ActivityPlayerPage.tsx | O gabarito será liberado em {{date}}. | `app.activity.result.policyAfterDate` | Política AFTER_DATE bloqueada |
| 169 | misc | ActivityPlayerPage.tsx | data a definir | `app.activity.result.policyDateFallback` | Fallback quando reviewAvailableAt é null |
| 170 | ui | ActivityPlayerPage.tsx | Questão {{n}} | `app.activity.result.questionN` | Cabeçalho de cada questão na revisão |
| 171 | ui | ActivityPlayerPage.tsx | Correta | `app.activity.result.correct` | Badge de acerto |
| 172 | ui | ActivityPlayerPage.tsx | Incorreta | `app.activity.result.incorrect` | Badge de erro |
| 173 | ui | ActivityPlayerPage.tsx | +{{earned}}/{{weight}} pts | `app.activity.result.questionScore` | Pontuação por questão |
| 174 | ui | ActivityPlayerPage.tsx | Explicação: | `app.activity.result.explanationLabel` | Prefixo da explicação |
| 175 | aria | ActivityPlayerPage.tsx | Imagem da questão | `app.activity.result.questionImageAlt` | alt da imagem do enunciado |
| 176 | ui | ActivityPlayerPage.tsx | O prazo deste curso foi encerrado. Novas submissões não são permitidas. | `app.activity.expiredBanner` | Banner prazo encerrado |
| 177 | ui | ActivityPlayerPage.tsx | Tentar novamente | `app.activity.result.retry` | Botão reiniciar |
| 178 | ui | ActivityPlayerPage.tsx | Ir ao Dashboard | `app.activity.result.goToDashboard` | Botão pós-resultado |
| 179 | ui | ActivityPlayerPage.tsx | Anterior | `common.pagination.previous` | Reusa #92 |
| 180 | ui | ActivityPlayerPage.tsx | Próxima | `app.lesson.nav.next` | Reusa #126 |
| 181 | ui | ActivityPlayerPage.tsx | Enviar atividade | `app.activity.nav.submit` | Botão submit na última questão |
| 182 | toast | ActivityPlayerPage.tsx | Responda todas as questões antes de enviar. | `app.activity.toast.incomplete` | toast.warning |
| 183 | error | ActivityPlayerPage.tsx | Você já foi aprovado neste desafio. | `app.activity.challenge.alreadyApproved` | Erro 409 |
| 184 | error | ActivityPlayerPage.tsx | Erro ao carregar o desafio. | `app.activity.challenge.loadError` | Erro genérico |
| 185 | ui | ActivityPlayerPage.tsx | Voltar | `common.actions.back` | Reusa — challenge back button |
| 186 | error | CourseInteractivePage.tsx | Curso não encontrado. | `app.course.notFound` | Estado de erro |
| 187 | ui | CourseInteractivePage.tsx | Voltar aos cursos | `app.course.backToCourses` | Link no estado de erro |
| 188 | ui | CourseInteractivePage.tsx | Voltar | `common.actions.back` | Reusa — breadcrumb topbar |
| 189 | ui | CourseInteractivePage.tsx | {{percent}}% concluído | `app.course.progressPercent` | Progresso na topbar |
| 190 | ui | CourseInteractivePage.tsx | {{completed}}/{{total}} aulas | `app.course.moduleProgress` | Progresso por módulo |
| 191 | validation | GlobalLoginPage.tsx | E-mail inválido | `common.validation.emailInvalid` | Reusa |
| 192 | validation | GlobalLoginPage.tsx | Senha obrigatória | `common.validation.passwordRequired` | Reusa |
| 193 | ui | GlobalLoginPage.tsx | Entrar | `platform.login.email.title` | h1 fase EMAIL |
| 194 | ui | GlobalLoginPage.tsx | Informe seu e-mail para continuar. | `platform.login.email.subtitle` | Subtítulo fase EMAIL |
| 195 | form | GlobalLoginPage.tsx | E-mail | `common.fields.email` | Reusa |
| 196 | ui | GlobalLoginPage.tsx | Continuar | `platform.login.email.continueButton` | Botão fase EMAIL |
| 197 | ui | GlobalLoginPage.tsx | Trocar e-mail | `platform.login.choice.changeEmail` | Botão voltar fase CHOICE |
| 198 | ui | GlobalLoginPage.tsx | Nenhuma conta encontrada | `platform.login.choice.notFound.title` | h1 — e-mail sem conta |
| 199 | ui | GlobalLoginPage.tsx | Este e-mail nao esta associado a nenhuma conta existente. | `platform.login.choice.notFound.subtitle` | Falta acento (TODO no código) |
| 200 | ui | GlobalLoginPage.tsx | Criar conta de professor | `platform.login.choice.notFound.createProfessor` | Link primário |
| 201 | misc | GlobalLoginPage.tsx | ou | `common.misc.or` | Divisor |
| 202 | ui | GlobalLoginPage.tsx | Tenho uma escola | `platform.login.choice.notFound.hasSchool` | Label seção aluno |
| 203 | ui | GlobalLoginPage.tsx | Informe o identificador da escola para criar uma conta como aluno. | `platform.login.choice.notFound.hasSchoolSubtitle` | |
| 204 | ui | GlobalLoginPage.tsx | slug-da-escola | `platform.login.choice.notFound.slugPlaceholder` | Placeholder input slug |
| 205 | ui | GlobalLoginPage.tsx | Acessar | `common.actions.access` | Nova chave comum |
| 206 | ui | GlobalLoginPage.tsx | Selecionar escola | `platform.login.choice.multiTenant.title` | h1 — múltiplos tenants |
| 207 | ui | GlobalLoginPage.tsx | Este e-mail está associado a mais de uma escola. Escolha em qual deseja entrar. | `platform.login.choice.multiTenant.subtitle` | |
| 208 | ui | GlobalLoginPage.tsx | Voltar | `common.actions.back` | Reusa — fase PASSWORD |
| 209 | ui | GlobalLoginPage.tsx | Acesso professor | `platform.login.password.platformTitle` | h1 tipo platform |
| 210 | ui | GlobalLoginPage.tsx | Entrar | `common.actions.login` | Reusa — h1 tipo tenant |
| 211 | ui | GlobalLoginPage.tsx | Escola: {{name}} | `platform.login.password.schoolBadge` | Badge de contexto |
| 212 | ui | GlobalLoginPage.tsx | Conta da plataforma | `platform.login.password.platformBadge` | Badge de contexto |
| 213 | form | GlobalLoginPage.tsx | Senha | `common.fields.password` | Reusa |
| 214 | toast | GlobalLoginPage.tsx | Bem-vindo, {{name}}! | `platform.login.toast.success` | toast.success |
| 215 | toast | GlobalLoginPage.tsx | Erro ao verificar e-mail. Tente novamente. | `platform.login.toast.resolveError` | toast.error |
| 216 | toast | GlobalLoginPage.tsx | Conta nao existe nesta escola ou senha incorreta. | `platform.login.toast.tenantLoginError` | toast.error — falta acento (TODO) |
| 217 | toast | GlobalLoginPage.tsx | Credenciais invalidas. | `platform.login.toast.platformLoginError` | toast.error — falta acento (TODO) |
| 218 | validation | ProfessorRegisterPage.tsx | Nome deve ter no minimo 2 caracteres | `common.validation.nameMinLength` | Reusa — falta acento no código (TODO) |
| 219 | validation | ProfessorRegisterPage.tsx | E-mail invalido | `common.validation.emailInvalid` | Reusa — falta acento (TODO) |
| 220 | validation | ProfessorRegisterPage.tsx | Minimo de 8 caracteres | `common.validation.passwordMinLength` | Reusa — falta acento (TODO) |
| 221 | validation | ProfessorRegisterPage.tsx | Precisa de pelo menos uma letra maiuscula | `common.validation.passwordUppercase` | Reusa — falta acento (TODO) |
| 222 | validation | ProfessorRegisterPage.tsx | Precisa de pelo menos um numero | `common.validation.passwordNumber` | Reusa — falta acento (TODO) |
| 223 | validation | ProfessorRegisterPage.tsx | As senhas nao conferem | `common.validation.passwordMatch` | Nova chave (TODO: acento) |
| 224 | ui | ProfessorRegisterPage.tsx | Criar conta de professor | `platform.professorRegister.title` | h1 |
| 225 | ui | ProfessorRegisterPage.tsx | Crie sua conta para comecar a publicar cursos. Voce podera criar sua escola no passo seguinte. | `platform.professorRegister.subtitle` | Subtítulo |
| 226 | form | ProfessorRegisterPage.tsx | Nome completo | `common.fields.fullName` | Reusa |
| 227 | form | ProfessorRegisterPage.tsx | E-mail | `common.fields.email` | Reusa |
| 228 | form | ProfessorRegisterPage.tsx | Seu nome | `common.placeholders.name` | Reusa |
| 229 | form | ProfessorRegisterPage.tsx | Senha | `common.fields.password` | Reusa |
| 230 | form | ProfessorRegisterPage.tsx | Confirmar senha | `common.fields.confirmPassword` | Nova chave |
| 231 | form | ProfessorRegisterPage.tsx | Repita a senha | `common.placeholders.repeatPassword` | Nova chave |
| 232 | ui | ProfessorRegisterPage.tsx | Criar conta | `platform.professorRegister.submitButton` | Botão submit |
| 233 | ui | ProfessorRegisterPage.tsx | Ja tem conta? | `platform.professorRegister.hasAccount` | Footer link |
| 234 | toast | ProfessorRegisterPage.tsx | Conta criada com sucesso! | `platform.professorRegister.toast.success` | toast.success |
| 235 | toast | ProfessorRegisterPage.tsx | Erro ao criar conta. Tente novamente. | `platform.professorRegister.toast.error` | toast.error |
| 236 | validation | CreateSchoolPage.tsx | Nome deve ter no mínimo 2 caracteres | `common.validation.nameMinLength` | Reusa |
| 237 | validation | CreateSchoolPage.tsx | Mínimo de 3 caracteres | `common.validation.slugMinLength` | Nova chave |
| 238 | validation | CreateSchoolPage.tsx | Máximo de 40 caracteres | `common.validation.slugMaxLength` | Nova chave |
| 239 | validation | CreateSchoolPage.tsx | Apenas letras minúsculas, números e hifens | `common.validation.slugPattern` | Nova chave |
| 240 | validation | CreateSchoolPage.tsx | Máximo de 300 caracteres | `common.validation.bioMaxLength` | Nova chave |
| 241 | ui | CreateSchoolPage.tsx | Criar sua escola | `public.createSchool.title` | h1 |
| 242 | ui | CreateSchoolPage.tsx | Crie seu espaço de ensino e comece a compartilhar conhecimento. | `public.createSchool.subtitle` | Subtítulo |
| 243 | form | CreateSchoolPage.tsx | Nome da escola | `public.createSchool.form.schoolName` | Label |
| 244 | form | CreateSchoolPage.tsx | Ex: Escola de Trading | `public.createSchool.form.schoolNamePlaceholder` | Placeholder |
| 245 | form | CreateSchoolPage.tsx | URL da escola | `public.createSchool.form.schoolUrl` | Label |
| 246 | form | CreateSchoolPage.tsx | minha-escola | `public.createSchool.form.slugPlaceholder` | Placeholder |
| 247 | error | CreateSchoolPage.tsx | Este slug já está em uso. | `public.createSchool.form.slugTaken` | Mensagem inline |
| 248 | form | CreateSchoolPage.tsx | Descrição | `public.createSchool.form.description` | Label |
| 249 | misc | CreateSchoolPage.tsx | (opcional) | `common.misc.optional` | Nova chave comum |
| 250 | form | CreateSchoolPage.tsx | Uma breve descrição da sua escola... | `public.createSchool.form.bioPlaceholder` | Placeholder |
| 251 | ui | CreateSchoolPage.tsx | Dados do proprietário (OWNER) | `public.createSchool.form.ownerSection` | Separador de seção |
| 252 | form | CreateSchoolPage.tsx | Seu nome | `public.createSchool.form.ownerName` | Label ownerName |
| 253 | form | CreateSchoolPage.tsx | Seu nome completo | `public.createSchool.form.ownerNamePlaceholder` | Placeholder ownerName |
| 254 | form | CreateSchoolPage.tsx | Mín. 8 caracteres | `common.placeholders.passwordMin` | Reusa |
| 255 | ui | CreateSchoolPage.tsx | Criar escola | `public.createSchool.form.submit` | Botão submit |
| 256 | ui | CreateSchoolPage.tsx | Já tem uma escola? | `public.createSchool.hasSchool` | Footer link |
| 257 | toast | CreateSchoolPage.tsx | Este slug já está em uso. Escolha outro. | `public.createSchool.toast.slugTaken` | toast.error |
| 258 | toast | CreateSchoolPage.tsx | Escola "{{name}}" criada com sucesso! | `public.createSchool.toast.success` | toast.success |
| 259 | toast | CreateSchoolPage.tsx | Não foi possível criar a escola. Tente novamente. | `public.createSchool.toast.error` | toast.error |
| 260 | ui | AnnouncementBell.tsx | Info | `app.announcements.priority.info` | Badge curto — diferente de `common.priority.info` = "Informação" |
| 261 | ui | AnnouncementBell.tsx | Atenção | `common.priority.warning` | Reusa |
| 262 | ui | AnnouncementBell.tsx | Urgente | `common.priority.critical` | Reusa |
| 263 | ui | AnnouncementBell.tsx | agora | `app.announcements.time.now` | Tempo relativo |
| 264 | ui | AnnouncementBell.tsx | {{n}}min | `app.announcements.time.minutes` | Tempo relativo |
| 265 | ui | AnnouncementBell.tsx | {{n}}h | `app.announcements.time.hours` | Tempo relativo |
| 266 | ui | AnnouncementBell.tsx | {{n}}d | `app.announcements.time.days` | Tempo relativo |
| 267 | aria | AnnouncementBell.tsx | Avisos | `app.announcements.title` | aria-label do botão |
| 268 | ui | AnnouncementBell.tsx | Avisos | `app.announcements.title` | Header do dropdown — mesmo de #267 |
| 269 | ui | AnnouncementBell.tsx | {{count}} não lido | `app.announcements.unreadCount_one` | Reusa #86 |
| 270 | ui | AnnouncementBell.tsx | {{count}} não lidos | `app.announcements.unreadCount_other` | Reusa #87 |
| 271 | empty | AnnouncementBell.tsx | Nenhum aviso no momento. | `app.announcements.bell.empty` | Diferente do empty da página |
| 272 | ui | AnnouncementBell.tsx | Ver todos os avisos | `app.announcements.bell.viewAll` | Footer do dropdown |
| 273 | validation | AnnouncementFormModal.tsx | Mínimo 3 caracteres | `admin.announcements.form.validation.titleMin` | Zod — título |
| 274 | validation | AnnouncementFormModal.tsx | Máximo 200 caracteres | `admin.announcements.form.validation.titleMax` | Zod — título |
| 275 | validation | AnnouncementFormModal.tsx | Obrigatório | `common.validation.required` | Nova chave comum |
| 276 | validation | AnnouncementFormModal.tsx | Máximo 5000 caracteres | `admin.announcements.form.validation.bodyMax` | Zod — corpo |
| 277 | ui | AnnouncementFormModal.tsx | Editar Aviso | `admin.announcements.form.editTitle` | Título modal edição |
| 278 | ui | AnnouncementFormModal.tsx | Novo Aviso | `admin.announcements.form.newTitle` | Título modal criação |
| 279 | form | AnnouncementFormModal.tsx | Título * | `admin.announcements.form.titleLabel` | Label campo |
| 280 | form | AnnouncementFormModal.tsx | Título do aviso... | `admin.announcements.form.titlePlaceholder` | Placeholder |
| 281 | form | AnnouncementFormModal.tsx | Prioridade * | `admin.announcements.form.priorityLabel` | Label campo |
| 282 | ui | AnnouncementFormModal.tsx | Informação | `common.priority.info` | Reusa — opção select INFO |
| 283 | ui | AnnouncementFormModal.tsx | Atenção | `common.priority.warning` | Reusa — opção select WARNING |
| 284 | ui | AnnouncementFormModal.tsx | Urgente | `common.priority.critical` | Reusa — opção select CRITICAL |
| 285 | form | AnnouncementFormModal.tsx | Mensagem * | `admin.announcements.form.bodyLabel` | Label campo |
| 286 | form | AnnouncementFormModal.tsx | Texto do aviso (suporta quebras de linha)... | `admin.announcements.form.bodyPlaceholder` | Placeholder |
| 287 | form | AnnouncementFormModal.tsx | Expira em | `admin.announcements.form.expiresLabel` | Label campo |
| 288 | misc | AnnouncementFormModal.tsx | (opcional) | `common.misc.optional` | Reusa #249 |
| 289 | ui | AnnouncementFormModal.tsx | Cancelar | `common.actions.cancel` | Nova chave comum |
| 290 | loading | AnnouncementFormModal.tsx | Salvando... | `common.actions.saving` | Nova chave comum |
| 291 | ui | AnnouncementFormModal.tsx | Salvar alterações | `common.actions.saveChanges` | Nova chave comum |
| 292 | ui | AnnouncementFormModal.tsx | Publicar aviso | `admin.announcements.form.publishButton` | Botão criação |
| 293 | ui | GoalConfigModal.tsx | Configurar meta semanal | `app.weeklyGoal.modal.title` | h2 do modal |
| 294 | ui | GoalConfigModal.tsx | Quantas atividades você quer completar por semana? | `app.weeklyGoal.modal.question` | Parágrafo descritivo |
| 295 | form | GoalConfigModal.tsx | Ou defina um valor personalizado | `app.weeklyGoal.modal.customLabel` | Label input custom |
| 296 | ui | GoalConfigModal.tsx | Entre 1 e 20 | `app.weeklyGoal.modal.rangeHint` | Hint abaixo do input |
| 297 | ui | GoalConfigModal.tsx | Cancelar | `common.actions.cancel` | Reusa #289 |
| 298 | ui | GoalConfigModal.tsx | Salvar meta | `app.weeklyGoal.modal.saveButton` | Botão submit |
| 299 | loading | GoalConfigModal.tsx | Salvando... | `common.actions.saving` | Reusa #290 |
| 300 | toast | GoalConfigModal.tsx | Meta atualizada: {{weeklyTarget}} atividades/semana | `app.weeklyGoal.modal.toast.success` | toast.success |
| 301 | toast | GoalConfigModal.tsx | Erro ao atualizar meta. | `app.weeklyGoal.modal.toast.error` | toast.error |
| 302 | empty | LabSummaryCard.tsx | Ainda sem sessões no laboratório | `app.labSummary.empty.title` | Estado vazio — título |
| 303 | empty | LabSummaryCard.tsx | Pratique no simulador e acompanhe sua evolução aqui. | `app.labSummary.empty.subtitle` | Estado vazio — subtítulo |
| 304 | ui | LabSummaryCard.tsx | Praticar | `app.labSummary.empty.button` | Botão CTA vazio |
| 305 | ui | LabSummaryCard.tsx | Laboratório de Prática | `app.labSummary.title` | h2 do card |
| 306 | ui | LabSummaryCard.tsx | Ver histórico completo | `app.labSummary.viewHistory` | Link no header |
| 307 | ui | LabSummaryCard.tsx | Sessões totais | `app.labSummary.stats.totalSessions` | Stat label |
| 308 | ui | LabSummaryCard.tsx | Completadas | `app.labSummary.stats.completed` | Stat label |
| 309 | ui | LabSummaryCard.tsx | PnL médio | `app.labSummary.stats.avgPnl` | Stat label |
| 310 | ui | LabSummaryCard.tsx | Melhor PnL | `app.labSummary.stats.bestPnl` | Stat label |
| 311 | ui | LabSummaryCard.tsx | Drawdown médio | `app.labSummary.stats.avgDrawdown` | Stat label |
| 312 | ui | LabSummaryCard.tsx | Última sessão | `app.labSummary.stats.lastSession` | Stat label |
| 313 | ui | LabSummaryCard.tsx | Taxa de acerto média | `app.labSummary.stats.avgWinRate` | Barra de win rate |
| 314 | misc | TenantAuthLayout.tsx | "O investimento em conhecimento sempre paga os melhores dividendos." | `auth.layout.quote` | Reusa #16 — fallback quando tenant sem bio |
| 315 | misc | TenantAuthLayout.tsx | — Benjamin Franklin | `auth.layout.quoteAuthor` | Reusa #17 |

---

## Lote 4 — Admin Pages + Learning Components (10 arquivos)

**Arquivos:** AdminQuestionsPage.tsx · AdminCoursesPage.tsx · AdminLessonsPage.tsx · AdminUsersPage.tsx · AdminAnnouncementsPage.tsx · AdminPeriodsPage.tsx · PeriodFormModal.tsx · CourseInteractiveHeader.tsx · CourseOutlineSidebar.tsx · LessonLockBadge.tsx

| # | Categoria | Arquivo | Texto | Chave | Observações |
|---|-----------|---------|-------|-------|------------|
| 316 | ui | AdminQuestionsPage.tsx | Obrigatório | `common.validation.required` | Validação form |
| 317 | validation | AdminQuestionsPage.tsx | Mínimo 5 caracteres | `admin.questions.validation.statement` | Zod schema |
| 318 | validation | AdminQuestionsPage.tsx | Mínimo 3 caracteres | `admin.questions.validation.title` | Zod schema |
| 319 | validation | AdminQuestionsPage.tsx | Mínimo 1 | `admin.questions.validation.weight` | Zod schema |
| 320 | ui | AdminQuestionsPage.tsx | Candles | `admin.questions.simConfig.candles` | SimConfigSummary |
| 321 | ui | AdminQuestionsPage.tsx | Preço inicial | `admin.questions.simConfig.startPrice` | SimConfigSummary |
| 322 | ui | AdminQuestionsPage.tsx | Volatilidade | `admin.questions.simConfig.volatility` | SimConfigSummary |
| 323 | ui | AdminQuestionsPage.tsx | Saldo inicial | `admin.questions.simConfig.initialBalance` | SimConfigSummary |
| 324 | ui | AdminQuestionsPage.tsx | Taxa | `admin.questions.simConfig.fee` | SimConfigSummary |
| 325 | ui | AdminQuestionsPage.tsx | PnL mín. | `admin.questions.simConfig.minPnL` | SimConfigSummary |
| 326 | ui | AdminQuestionsPage.tsx | DD máx. | `admin.questions.simConfig.maxDD` | SimConfigSummary |
| 327 | ui | AdminQuestionsPage.tsx | Trades mín. | `admin.questions.simConfig.minTrades` | SimConfigSummary |
| 328 | form | AdminQuestionsPage.tsx | Verdadeiro | `admin.questions.options.true` | Opção TRUE_FALSE |
| 329 | form | AdminQuestionsPage.tsx | Falso | `admin.questions.options.false` | Opção TRUE_FALSE |
| 330 | validation | AdminCoursesPage.tsx | Mínimo 3 caracteres | `admin.courses.validation.title` | Zod schema |
| 331 | validation | AdminCoursesPage.tsx | Mínimo 10 caracteres | `admin.courses.validation.description` | Zod schema |
| 332 | form | AdminCoursesPage.tsx | Título | `admin.courses.form.title` | Label input |
| 333 | form | AdminCoursesPage.tsx | Descrição | `admin.courses.form.description` | Label textarea |
| 334 | form | AdminCoursesPage.tsx | Prazo final (opcional) | `admin.courses.form.deadline` | Label input datetime |
| 335 | form | AdminCoursesPage.tsx | Após esta data, alunos não poderão enviar respostas. | `admin.courses.form.deadlineHint` | Hint text |
| 336 | form | AdminCoursesPage.tsx | Ex: Análise Fundamentalista | `admin.courses.form.titlePlaceholder` | Placeholder |
| 337 | form | AdminCoursesPage.tsx | Descreva o conteúdo do curso... | `admin.courses.form.descriptionPlaceholder` | Placeholder |
| 338 | toast | AdminCoursesPage.tsx | Curso criado! | `admin.courses.toast.created` | Success toast |
| 339 | toast | AdminCoursesPage.tsx | Erro ao criar curso. | `admin.courses.toast.error` | Error toast |
| 340 | validation | AdminLessonsPage.tsx | Mínimo 2 caracteres | `admin.lessons.validation.title` | Zod schema |
| 341 | validation | AdminLessonsPage.tsx | Mínimo 1 | `admin.lessons.validation.order` | Zod schema |
| 342 | ui | AdminLessonsPage.tsx | Atividade | `admin.lessons.stepType.activity` | Badge step type |
| 343 | ui | AdminLessonsPage.tsx | Texto | `admin.lessons.stepType.text` | Badge step type |
| 344 | ui | AdminLessonsPage.tsx | Vídeo | `admin.lessons.stepType.video` | Badge step type |
| 345 | ui | AdminLessonsPage.tsx | Imagem | `admin.lessons.stepType.image` | Badge step type |
| 346 | ui | AdminLessonsPage.tsx | Múltipla Escolha | `admin.lessons.activityType.multipleChoice` | Select option |
| 347 | ui | AdminLessonsPage.tsx | Múltipla Seleção | `admin.lessons.activityType.multipleSelect` | Select option |
| 348 | ui | AdminLessonsPage.tsx | Verdadeiro/Falso | `admin.lessons.activityType.trueFalse` | Select option |
| 349 | ui | AdminLessonsPage.tsx | Ordenação | `admin.lessons.activityType.ordering` | Select option |
| 350 | ui | AdminLessonsPage.tsx | Resposta Aberta | `admin.lessons.activityType.textInput` | Select option |
| 351 | ui | AdminLessonsPage.tsx | Cenário | `admin.lessons.activityType.scenario` | Select option |
| 352 | ui | AdminLessonsPage.tsx | Marcação de Gráfico | `admin.lessons.activityType.chartMarkup` | Select option |
| 353 | ui | AdminLessonsPage.tsx | Calculadora de Risco | `admin.lessons.activityType.riskCalculator` | Select option |
| 354 | ui | AdminLessonsPage.tsx | Simulação de Trading | `admin.lessons.activityType.simTrading` | Select option |
| 355 | ui | AdminLessonsPage.tsx | Imediata | `admin.lessons.reviewPolicy.immediate` | Policy label |
| 356 | ui | AdminLessonsPage.tsx | Aluno vê gabarito logo após responder | `admin.lessons.reviewPolicy.immediateDesc` | Policy description |
| 357 | ui | AdminLessonsPage.tsx | Após data | `admin.lessons.reviewPolicy.afterDate` | Policy label |
| 358 | ui | AdminLessonsPage.tsx | Gabarito liberado após data específica | `admin.lessons.reviewPolicy.afterDateDesc` | Policy description |
| 359 | ui | AdminLessonsPage.tsx | Nunca | `admin.lessons.reviewPolicy.never` | Policy label |
| 360 | ui | AdminLessonsPage.tsx | Gabarito nunca é exibido | `admin.lessons.reviewPolicy.neverDesc` | Policy description |
| 361 | ui | AdminUsersPage.tsx | Detalhes do Usuário | `admin.users.detail.title` | Modal title |
| 362 | dialog | AdminUsersPage.tsx | Promover a Administrador? | `admin.users.role.promoteTitle` | Dialog title |
| 363 | dialog | AdminUsersPage.tsx | "{{name}}" terá acesso total ao painel administrativo, incluindo gerenciamento de conteúdo e usuários. | `admin.users.role.promoteMessage` | Dialog message com interpolação |
| 364 | dialog | AdminUsersPage.tsx | Revogar Acesso Admin? | `admin.users.role.revokeTitle` | Dialog title |
| 365 | dialog | AdminUsersPage.tsx | "{{name}}" perderá o acesso administrativo e voltará a ser um estudante comum. | `admin.users.role.revokeMessage` | Dialog message com interpolação |
| 366 | ui | AdminUsersPage.tsx | Sim, promover | `admin.users.role.promoteConfirm` | Button label |
| 367 | ui | AdminUsersPage.tsx | Sim, revogar | `admin.users.role.revokeConfirm` | Button label |
| 368 | ui | AdminAnnouncementsPage.tsx | Gerenciar Avisos | `admin.announcements.page.title` | Page title |
| 369 | ui | AdminAnnouncementsPage.tsx | Novo Aviso | `admin.announcements.page.newButton` | Button label |
| 370 | ui | AdminAnnouncementsPage.tsx | Info | `admin.announcements.priority.info` | Priority label |
| 371 | ui | AdminAnnouncementsPage.tsx | Atenção | `admin.announcements.priority.warning` | Priority label |
| 372 | ui | AdminAnnouncementsPage.tsx | Urgente | `admin.announcements.priority.critical` | Priority label |
| 373 | toast | AdminAnnouncementsPage.tsx | Aviso publicado com sucesso! | `admin.announcements.toast.created` | Success toast |
| 374 | toast | AdminAnnouncementsPage.tsx | Erro ao publicar aviso. | `admin.announcements.toast.createError` | Error toast |
| 375 | toast | AdminAnnouncementsPage.tsx | Aviso atualizado! | `admin.announcements.toast.updated` | Success toast |
| 376 | toast | AdminAnnouncementsPage.tsx | Erro ao atualizar aviso. | `admin.announcements.toast.updateError` | Error toast |
| 377 | toast | AdminAnnouncementsPage.tsx | Aviso removido. | `admin.announcements.toast.deleted` | Success toast |
| 378 | toast | AdminAnnouncementsPage.tsx | Erro ao remover aviso. | `admin.announcements.toast.deleteError` | Error toast |
| 379 | ui | AdminPeriodsPage.tsx | Períodos Avaliativos | `admin.periods.title` | Page title |
| 380 | ui | AdminPeriodsPage.tsx | Defina janelas de tempo para grupos de módulos. | `admin.periods.subtitle` | Page subtitle |
| 381 | ui | AdminPeriodsPage.tsx | Novo período | `admin.periods.newButton` | Button label |
| 382 | ui | AdminPeriodsPage.tsx | Voltar aos cursos | `admin.periods.backButton` | Link label |
| 383 | ui | AdminPeriodsPage.tsx | Ativo | `admin.periods.status.active` | Status badge |
| 384 | toast | AdminPeriodsPage.tsx | Período excluído. | `admin.periods.toast.deleted` | Success toast |
| 385 | toast | AdminPeriodsPage.tsx | Erro ao excluir período. | `admin.periods.toast.deleteError` | Error toast |
| 386 | aria | AdminPeriodsPage.tsx | Editar período | `admin.periods.aria.edit` | aria-label |
| 387 | aria | AdminPeriodsPage.tsx | Excluir período | `admin.periods.aria.delete` | aria-label |
| 388 | ui | PeriodFormModal.tsx | Editar Período | `admin.periodForm.editTitle` | Modal title |
| 389 | ui | PeriodFormModal.tsx | Novo Período | `admin.periodForm.createTitle` | Modal title |
| 390 | form | PeriodFormModal.tsx | Título | `admin.periodForm.title` | Form label |
| 391 | form | PeriodFormModal.tsx | Início | `admin.periodForm.startDate` | Form label |
| 392 | form | PeriodFormModal.tsx | Fim | `admin.periodForm.endDate` | Form label |
| 393 | validation | PeriodFormModal.tsx | Data final deve ser posterior à inicial | `admin.periodForm.validation.dateRange` | Zod refine |
| 394 | validation | PeriodFormModal.tsx | Mínimo 3 caracteres | `admin.periodForm.validation.title` | Zod schema |
| 395 | validation | PeriodFormModal.tsx | Obrigatório | `admin.periodForm.validation.date` | Zod schema |
| 396 | validation | PeriodFormModal.tsx | Selecione ao menos um módulo | `admin.periodForm.validation.modules` | Zod schema |
| 397 | form | PeriodFormModal.tsx | Ex: Semestre 1 - 2025 | `admin.periodForm.titlePlaceholder` | Placeholder |
| 398 | toast | PeriodFormModal.tsx | Período criado! | `admin.periodForm.toast.created` | Success toast |
| 399 | toast | PeriodFormModal.tsx | Erro ao criar período. | `admin.periodForm.toast.createError` | Error toast |
| 400 | toast | PeriodFormModal.tsx | Período atualizado! | `admin.periodForm.toast.updated` | Success toast |
| 401 | toast | PeriodFormModal.tsx | Erro ao atualizar período. | `admin.periodForm.toast.updateError` | Error toast |
| 402 | ui | CourseInteractiveHeader.tsx | {{completedLessons}}/{{totalLessons}} aulas concluídas | `app.courseInteractive.lessonsCount` | Progress label com interpolação |
| 403 | ui | CourseInteractiveHeader.tsx | Revisar | `app.courseInteractive.review` | Button label |
| 404 | ui | CourseInteractiveHeader.tsx | Continuar | `app.courseInteractive.continue` | Button label |
| 405 | aria | CourseOutlineSidebar.tsx | Estrutura do curso | `app.courseOutline.aria` | nav aria-label |
| 406 | ui | CourseOutlineSidebar.tsx | {{completed}}/{{total}} | `app.courseOutline.moduleProgress` | Progress indicator |
| 407 | ui | LessonLockBadge.tsx | O prazo deste curso foi encerrado. | `app.lessonLock.courseExpired` | Tooltip |
| 408 | ui | LessonLockBadge.tsx | Prazo encerrado | `app.lessonLock.courseExpiredBadge` | Badge text |
| 409 | ui | LessonLockBadge.tsx | Ainda não disponível | `app.lessonLock.notAvailableYet` | Badge text (fallback) |
| 410 | ui | LessonLockBadge.tsx | Disponível em {{date}} | `app.lessonLock.availableFrom` | Badge text com interpolação |
| 411 | ui | LessonLockBadge.tsx | Complete a aula anterior para continuar. | `app.lessonLock.previousIncomplete` | Tooltip |
| 412 | ui | LessonLockBadge.tsx | Complete a aula anterior | `app.lessonLock.previousIncompleteBadge` | Badge text |
| 413 | ui | LessonLockBadge.tsx | Complete "{{lessonTitle}}" primeiro | `app.lessonLock.prerequisiteNotMet` | Badge text com interpolação |
| 414 | ui | LessonLockBadge.tsx | Pré-requisito pendente | `app.lessonLock.prerequisiteBadge` | Badge text (fallback) |

---

## Lote 5 — Learning Components (10 arquivos)

**Arquivos cobertos:**
- `src/components/learning/ActivityPlayerContent.tsx` (strings já cobertas via ActivityPlayerPage.tsx no Lote 3)
- `src/components/learning/StepPlayer.tsx`
- `src/components/learning/MultipleChoiceRenderer.tsx` *(sem strings — letras computadas via `String.fromCharCode`)*
- `src/components/learning/MultipleSelectRenderer.tsx`
- `src/components/learning/OrderingRenderer.tsx`
- `src/components/learning/TextInputRenderer.tsx`
- `src/components/learning/ChartMarkupRenderer.tsx`
- `src/components/learning/RiskCalculatorRenderer.tsx`
- `src/components/learning/LessonTimeline.tsx`
- `src/components/learning/CourseInlineLessonPlayer.tsx`

| # | Categoria | Arquivo | Texto PT-BR | Chave | Notas |
|---|-----------|---------|-------------|-------|-------|
| 415 | toast | ActivityPlayerContent.tsx | Atividade concluída! | `app.activity.toast.submitSuccess` | Reusa #159 |
| 416 | toast | ActivityPlayerContent.tsx | Erro ao enviar respostas. Tente novamente. | `app.activity.toast.submitError` | Reusa #160 |
| 417 | empty | ActivityPlayerContent.tsx | Nenhuma questão cadastrada | `app.activity.empty.title` | Reusa #161 |
| 418 | empty | ActivityPlayerContent.tsx | Esta atividade ainda não possui questões. Peça ao administrador para adicioná-las. | `app.activity.empty.subtitle` | Reusa #162 |
| 419 | ui | ActivityPlayerContent.tsx | Parabéns! Você passou. | `app.activity.result.passed` | Reusa #163 |
| 420 | ui | ActivityPlayerContent.tsx | Continue praticando! | `app.activity.result.failed` | Reusa #164 |
| 421 | ui | ActivityPlayerContent.tsx | {{score}} de {{maxScore}} pontos | `app.activity.result.scoreLabel` | Reusa #165 |
| 422 | ui | ActivityPlayerContent.tsx | Revisão das questões | `app.activity.result.reviewTitle` | Reusa #166 |
| 423 | ui | ActivityPlayerContent.tsx | Questão {{n}} | `app.activity.result.questionN` | Reusa #170 |
| 424 | ui | ActivityPlayerContent.tsx | Tentar novamente | `app.activity.result.retry` | Reusa #177 |
| 425 | ui | ActivityPlayerContent.tsx | Anterior | `common.pagination.previous` | Reusa #179 |
| 426 | ui | ActivityPlayerContent.tsx | Próxima | `app.lesson.nav.next` | Reusa #180 |
| 427 | ui | ActivityPlayerContent.tsx | Enviar atividade | `app.activity.nav.submit` | Reusa #181 |
| 428 | toast | ActivityPlayerContent.tsx | Responda todas as questões antes de enviar. | `app.activity.toast.incomplete` | Reusa #182 |
| 429 | ui | StepPlayer.tsx | Clique para iniciar esta atividade interativa | `app.stepPlayer.activityDescription` | Reusa JSON |
| 430 | ui | StepPlayer.tsx | Iniciar atividade | `app.stepPlayer.activityButton` | Reusa JSON |
| 431 | ui | MultipleSelectRenderer.tsx | Selecione todas que se aplicam | `app.multipleSelect.instruction` | Reusa JSON |
| 432 | aria | OrderingRenderer.tsx | Arrastar para reordenar | `app.ordering.dragAriaLabel` | Reusa JSON |
| 433 | ui | OrderingRenderer.tsx | Arraste para ordenar (ou use teclado: Espaço + Setas) | `app.ordering.instruction` | Reusa JSON |
| 434 | form | TextInputRenderer.tsx | Escreva sua resposta aqui... | `app.textInput.placeholder` | Reusa JSON |
| 435 | ui | ChartMarkupRenderer.tsx | ✅ Correto | `app.chartMarkup.labels.correct` | LABEL_TEXT CORRECT — Reusa JSON |
| 436 | ui | ChartMarkupRenderer.tsx | ⚠️ Quase | `app.chartMarkup.labels.partial` | LABEL_TEXT PARTIAL — Reusa JSON |
| 437 | ui | ChartMarkupRenderer.tsx | ❌ Fora | `app.chartMarkup.labels.wrong` | LABEL_TEXT WRONG — Reusa JSON |
| 438 | empty | ChartMarkupRenderer.tsx | Imagem não disponível | `app.chartMarkup.imageUnavailable` | Reusa JSON |
| 439 | ui | ChartMarkupRenderer.tsx | % de sobreposição | `app.chartMarkup.overlapSuffix` | Sufixo % — Reusa JSON |
| 440 | ui | ChartMarkupRenderer.tsx | Desenhando... | `app.chartMarkup.drawing` | Estado toggle — Reusa JSON |
| 441 | ui | ChartMarkupRenderer.tsx | Desenhar zona | `app.chartMarkup.drawButton` | Botão toggle — Reusa JSON |
| 442 | ui | ChartMarkupRenderer.tsx | Limpar | `app.chartMarkup.clearButton` | Reusa JSON |
| 443 | ui | RiskCalculatorRenderer.tsx | Saldo | `app.riskCalc.scenario.balance` | ScenarioCard — Reusa JSON |
| 444 | ui | RiskCalculatorRenderer.tsx | Risco | `app.riskCalc.scenario.risk` | ScenarioCard — Reusa JSON |
| 445 | ui | RiskCalculatorRenderer.tsx | Entrada | `app.riskCalc.scenario.entry` | ScenarioCard — Reusa JSON |
| 446 | ui | RiskCalculatorRenderer.tsx | Stop | `app.riskCalc.scenario.stop` | ScenarioCard — Reusa JSON |
| 447 | ui | RiskCalculatorRenderer.tsx | Valor por contrato | `app.riskCalc.scenario.contractValue` | ScenarioCard condicional — Reusa JSON |
| 448 | ui | RiskCalculatorRenderer.tsx | Passo a passo | `app.riskCalc.stepByStep.title` | Heading — Reusa JSON |
| 449 | ui | RiskCalculatorRenderer.tsx | Risco em $: | `app.riskCalc.stepByStep.riskAmount` | Step label — Reusa JSON |
| 450 | ui | RiskCalculatorRenderer.tsx | Distância do stop: | `app.riskCalc.stepByStep.stopDistance` | Step label — Reusa JSON |
| 451 | ui | RiskCalculatorRenderer.tsx | Valor por contrato: | `app.riskCalc.stepByStep.contractValueStep` | Step condicional — Reusa JSON |
| 452 | ui | RiskCalculatorRenderer.tsx | Tamanho da posição: | `app.riskCalc.stepByStep.positionSize` | Step label — Reusa JSON |
| 453 | ui | RiskCalculatorRenderer.tsx | Sua resposta | `app.riskCalc.stepByStep.yourAnswer` | Comparação — Reusa JSON |
| 454 | ui | RiskCalculatorRenderer.tsx | Esperado | `app.riskCalc.stepByStep.expected` | Comparação — Reusa JSON |
| 455 | ui | RiskCalculatorRenderer.tsx | Diferença | `app.riskCalc.stepByStep.difference` | Comparação — Reusa JSON |
| 456 | empty | RiskCalculatorRenderer.tsx | Dados do cenário não disponíveis | `app.riskCalc.noData` | Sem metadata — Reusa JSON |
| 457 | form | RiskCalculatorRenderer.tsx | Qual o tamanho da posição? | `app.riskCalc.input.label` | Label input — Reusa JSON |
| 458 | form | RiskCalculatorRenderer.tsx | Ex: 2.50 | `app.riskCalc.input.placeholder` | Placeholder — Reusa JSON |
| 459 | ui | RiskCalculatorRenderer.tsx | % de acerto | `app.riskCalc.feedback.accuracySuffix` | Badge feedback — Reusa JSON |
| 460 | ui | RiskCalculatorRenderer.tsx | ✅ Correto | `app.riskCalc.feedback.labels.correct` | LABEL_CONFIG CORRECT — Reusa JSON |
| 461 | ui | RiskCalculatorRenderer.tsx | ⚠️ Quase | `app.riskCalc.feedback.labels.partial` | LABEL_CONFIG PARTIAL — Reusa JSON |
| 462 | ui | RiskCalculatorRenderer.tsx | ❌ Incorreto | `app.riskCalc.feedback.labels.wrong` | LABEL_CONFIG WRONG — Reusa JSON |
| 463 | aria | LessonTimeline.tsx | Etapas da aula | `app.timeline.ariaLabel` | nav aria-label — Reusa JSON |
| 464 | ui | LessonTimeline.tsx | Texto | `app.timeline.stepTypes.text` | STEP_LABELS — Reusa JSON |
| 465 | ui | LessonTimeline.tsx | Vídeo | `app.timeline.stepTypes.video` | STEP_LABELS — Reusa JSON |
| 466 | ui | LessonTimeline.tsx | Imagem | `app.timeline.stepTypes.image` | STEP_LABELS — Reusa JSON |
| 467 | ui | LessonTimeline.tsx | Atividade | `app.timeline.stepTypes.activity` | STEP_LABELS — Reusa JSON |
| 468 | ui | LessonTimeline.tsx | {{n}} min | `app.timeline.minutes` | Duração estimada — Reusa JSON |
| 469 | misc | LessonTimeline.tsx | Opcional | `app.timeline.optional` | Etapa opcional — Reusa JSON |
| 470 | empty | CourseInlineLessonPlayer.tsx | Esta aula ainda não possui conteúdo. | `app.lessonPlayer.noContent` | **NOVA** — estado vazio inline |
| 471 | ui | CourseInlineLessonPlayer.tsx | Etapa {{n}} de {{total}} | `app.lessonPlayer.stepOf` | **NOVA** — parte 1 do progresso |
| 472 | ui | CourseInlineLessonPlayer.tsx | · {{viewed}}/{{total}} concluídas | `app.lessonPlayer.completedSuffix` | **NOVA** — sufixo condicional do progresso |
| 473 | ui | CourseInlineLessonPlayer.tsx | Anterior | `common.pagination.previous` | Reusa #92 |
| 474 | ui | CourseInlineLessonPlayer.tsx | Concluir aula | `app.lessonPlayer.completeLesson` | **NOVA** — botão finalizar última etapa |
| 475 | ui | CourseInlineLessonPlayer.tsx | Próxima | `app.lesson.nav.next` | Reusa #126 |

---

## Lote 6 — Admin Components + Super Admin Pages (7 arquivos)

**Arquivos cobertos:**
- `src/pages/admin/AdminLessonStepsPage.tsx`
- `src/components/admin/StepFormModal.tsx`
- `src/components/admin/QuestionPreviewCard.tsx`
- `src/pages/super/SuperDashboardPage.tsx`
- `src/pages/super/SuperTenantsPage.tsx`
- `src/pages/super/SuperTenantEditPage.tsx`
- `src/pages/super/SuperUsersPage.tsx`

| # | Categoria | Arquivo | Texto PT-BR | Chave | Notas |
|---|-----------|---------|-------------|-------|-------|
| 476 | aria | AdminLessonStepsPage.tsx | Editar etapa | `admin.lessonSteps.aria.edit` | aria-label |
| 477 | aria | AdminLessonStepsPage.tsx | Excluir etapa | `admin.lessonSteps.aria.delete` | aria-label |
| 478 | ui | AdminLessonStepsPage.tsx | Voltar às aulas | `admin.lessonSteps.backToLessons` | Breadcrumb com courseId |
| 479 | ui | AdminLessonStepsPage.tsx | Cursos | `common.nav.courses` | Reusa — breadcrumb sem courseId |
| 480 | ui | AdminLessonStepsPage.tsx | Etapas da aula | `admin.lessonSteps.title` | h1 |
| 481 | ui | AdminLessonStepsPage.tsx | Gerar das atividades | `admin.lessonSteps.generateButton` | Botão geração automática |
| 482 | ui | AdminLessonStepsPage.tsx | Nova etapa | `admin.lessonSteps.newButton` | Botão criação |
| 483 | ui | AdminLessonStepsPage.tsx | Etapas virtuais: | `admin.lessonSteps.virtualBanner.title` | Banner warning — título |
| 484 | ui | AdminLessonStepsPage.tsx | Esta aula ainda não possui etapas persistidas. As etapas abaixo são geradas automaticamente a partir das atividades. Clique em "Gerar das atividades" para persistir. | `admin.lessonSteps.virtualBanner.body` | Banner warning — body |
| 485 | empty | AdminLessonStepsPage.tsx | Nenhuma etapa nesta aula. | `admin.lessonSteps.empty.title` | Estado vazio |
| 486 | empty | AdminLessonStepsPage.tsx | Crie etapas manualmente ou gere a partir das atividades. | `admin.lessonSteps.empty.subtitle` | Estado vazio |
| 487 | toast | AdminLessonStepsPage.tsx | Etapa excluída. | `admin.lessonSteps.toast.deleted` | toast.success |
| 488 | toast | AdminLessonStepsPage.tsx | Erro ao excluir etapa. | `admin.lessonSteps.toast.deleteError` | toast.error |
| 489 | toast | AdminLessonStepsPage.tsx | Ordem atualizada! | `admin.lessonSteps.toast.reordered` | toast.success |
| 490 | toast | AdminLessonStepsPage.tsx | Erro ao reordenar. | `admin.lessonSteps.toast.reorderError` | toast.error |
| 491 | toast | AdminLessonStepsPage.tsx | Etapas geradas a partir das atividades! | `admin.lessonSteps.toast.generated` | toast.success |
| 492 | toast | AdminLessonStepsPage.tsx | Erro ao gerar etapas. | `admin.lessonSteps.toast.generateError` | toast.error |
| 493 | ui | StepFormModal.tsx | Editar etapa | `admin.stepForm.editTitle` | Título modal — modo edição |
| 494 | ui | StepFormModal.tsx | Nova etapa de conteúdo | `admin.stepForm.createTitle` | Título modal — modo criação |
| 495 | form | StepFormModal.tsx | Tipo | `admin.stepForm.typeLabel` | Label seletor de tipo |
| 496 | form | StepFormModal.tsx | Título | `admin.stepForm.titleLabel` | Label campo título |
| 497 | form | StepFormModal.tsx | Ex.: Introdução ao tema | `admin.stepForm.titlePlaceholder` | Placeholder |
| 498 | validation | StepFormModal.tsx | Mínimo 2 caracteres | `admin.stepForm.validation.titleMin` | Zod schema |
| 499 | form | StepFormModal.tsx | Conteúdo | `admin.stepForm.contentLabel` | Label textarea — tipo TEXT |
| 500 | form | StepFormModal.tsx | Escreva aqui ou cole HTML... | `admin.stepForm.contentPlaceholder` | Placeholder textarea |
| 501 | ui | StepFormModal.tsx | Aceita HTML simples: <p>, <b>, <ul>, <li>, etc. | `admin.stepForm.htmlHint` | Hint abaixo textarea |
| 502 | form | StepFormModal.tsx | URL do vídeo | `admin.stepForm.videoUrlLabel` | Label — tipo VIDEO |
| 503 | ui | StepFormModal.tsx | YouTube, Vimeo ou qualquer URL de vídeo. | `admin.stepForm.videoHint` | Hint |
| 504 | form | StepFormModal.tsx | Imagem | `admin.stepForm.imageLabel` | Label — tipo IMAGE |
| 505 | ui | StepFormModal.tsx | Clique para selecionar uma imagem | `admin.stepForm.imageUploadButton` | Drop zone button |
| 506 | form | StepFormModal.tsx | Ou cole uma URL de imagem | `admin.stepForm.imageUrlLabel` | Label alternativo URL |
| 507 | form | StepFormModal.tsx | Texto alternativo | `admin.stepForm.altLabel` | Label campo alt |
| 508 | form | StepFormModal.tsx | Descrição da imagem (para acessibilidade) | `admin.stepForm.altPlaceholder` | Placeholder |
| 509 | form | StepFormModal.tsx | Legenda | `admin.stepForm.captionLabel` | Label campo legenda |
| 510 | misc | StepFormModal.tsx | (opcional) | `common.misc.optional` | Reusa |
| 511 | form | StepFormModal.tsx | Legenda exibida abaixo da imagem | `admin.stepForm.captionPlaceholder` | Placeholder legenda |
| 512 | form | StepFormModal.tsx | Duração estimada | `admin.stepForm.durationLabel` | Label campo duração |
| 513 | misc | StepFormModal.tsx | Opcional | `app.timeline.optional` | Reusa — label checkbox isOptional |
| 514 | ui | StepFormModal.tsx | Cancelar | `common.actions.cancel` | Reusa |
| 515 | loading | StepFormModal.tsx | Enviando imagem… | `admin.stepForm.uploadingImage` | Estado upload |
| 516 | ui | StepFormModal.tsx | Salvar | `admin.stepForm.saveButton` | Botão submit edição |
| 517 | ui | StepFormModal.tsx | Criar | `admin.stepForm.createButton` | Botão submit criação |
| 518 | toast | StepFormModal.tsx | Etapa criada! | `admin.stepForm.toast.created` | toast.success |
| 519 | toast | StepFormModal.tsx | Erro ao criar etapa. | `admin.stepForm.toast.createError` | toast.error |
| 520 | toast | StepFormModal.tsx | Etapa atualizada! | `admin.stepForm.toast.updated` | toast.success |
| 521 | toast | StepFormModal.tsx | Erro ao atualizar etapa. | `admin.stepForm.toast.updateError` | toast.error |
| 522 | toast | StepFormModal.tsx | Erro ao enviar imagem. | `admin.stepForm.toast.uploadError` | toast.error |
| 523 | empty | QuestionPreviewCard.tsx | Sem imagem | `admin.questionPreview.noImage` | Estado vazio ChartMarkup |
| 524 | aria | QuestionPreviewCard.tsx | Gráfico gabarito | `admin.questionPreview.chartAlt` | alt da imagem |
| 525 | ui | QuestionPreviewCard.tsx | Zonas: | `admin.questionPreview.zones` | Label metadado |
| 526 | ui | QuestionPreviewCard.tsx | Threshold IoU: | `admin.questionPreview.threshold` | Label metadado |
| 527 | ui | QuestionPreviewCard.tsx | Tolerância | `admin.questionPreview.tolerance` | RiskCalc row label |
| 528 | ui | QuestionPreviewCard.tsx | Contrato | `admin.questionPreview.contract` | RiskCalc row label |
| 529 | ui | QuestionPreviewCard.tsx | Resposta esperada: | `admin.questionPreview.expectedAnswer` | Label resultado esperado |
| 530 | ui | QuestionPreviewCard.tsx | contratos | `admin.questionPreview.contracts` | Unidade após o valor |
| 531 | ui | SuperDashboardPage.tsx | Visão Geral da Plataforma | `super.dashboard.title` | h1 |
| 532 | ui | SuperDashboardPage.tsx | Painel de controle do Super Admin — todas as escolas e usuários. | `super.dashboard.subtitle` | Subtítulo |
| 533 | ui | SuperDashboardPage.tsx | Total de Escolas | `super.dashboard.stats.totalTenants` | StatCard label |
| 534 | ui | SuperDashboardPage.tsx | Escolas Ativas | `super.dashboard.stats.activeTenants` | StatCard label |
| 535 | ui | SuperDashboardPage.tsx | Usuários | `super.dashboard.stats.users` | StatCard label |
| 536 | ui | SuperDashboardPage.tsx | Cursos | `super.dashboard.stats.courses` | StatCard label |
| 537 | ui | SuperTenantsPage.tsx | Escolas | `super.tenants.title` | h1 |
| 538 | ui | SuperTenantsPage.tsx | Gerencie todos os tenants da plataforma. | `super.tenants.subtitle` | Subtítulo |
| 539 | ui | SuperTenantsPage.tsx | Nova Escola | `super.tenants.newButton` | Botão abrir modal |
| 540 | form | SuperTenantsPage.tsx | Buscar por nome ou slug... | `super.tenants.searchPlaceholder` | Placeholder busca |
| 541 | ui | SuperTenantsPage.tsx | Todas | `super.tenants.filter.all` | Option select filtro |
| 542 | ui | SuperTenantsPage.tsx | Ativas | `super.tenants.filter.active` | Option select filtro |
| 543 | ui | SuperTenantsPage.tsx | Desativadas | `super.tenants.filter.disabled` | Option select filtro |
| 544 | ui | SuperTenantsPage.tsx | Escola | `super.tenants.table.school` | Cabeçalho tabela |
| 545 | ui | SuperTenantsPage.tsx | Usuários | `super.tenants.table.users` | Cabeçalho tabela |
| 546 | ui | SuperTenantsPage.tsx | Cursos | `super.tenants.table.courses` | Cabeçalho tabela |
| 547 | ui | SuperTenantsPage.tsx | Status | `super.tenants.table.status` | Cabeçalho tabela |
| 548 | ui | SuperTenantsPage.tsx | Ações | `super.tenants.table.actions` | Cabeçalho tabela |
| 549 | ui | SuperTenantsPage.tsx | Ativa | `super.tenants.status.active` | Badge status habilitado |
| 550 | ui | SuperTenantsPage.tsx | Desativada | `super.tenants.status.disabled` | Badge status desabilitado |
| 551 | ui | SuperTenantsPage.tsx | Clique para desativar | `super.tenants.status.clickToDisable` | title tooltip |
| 552 | ui | SuperTenantsPage.tsx | Clique para ativar | `super.tenants.status.clickToEnable` | title tooltip |
| 553 | ui | SuperTenantsPage.tsx | Editar | `super.tenants.editButton` | Botão ação |
| 554 | empty | SuperTenantsPage.tsx | Nenhuma escola encontrada. | `super.tenants.empty` | Estado vazio tabela |
| 555 | ui | SuperTenantsPage.tsx | {{total}} escola(s) • Página {{page}} de {{totalPages}} | `super.tenants.pagination` | Info paginação |
| 556 | ui | SuperTenantsPage.tsx | Anterior | `common.pagination.previous` | Reusa |
| 557 | ui | SuperTenantsPage.tsx | Próxima | `common.pagination.next` | Reusa — JSON tem "Próximo" |
| 558 | toast | SuperTenantsPage.tsx | Status atualizado | `super.tenants.toast.statusUpdated` | toast.success |
| 559 | ui | SuperTenantsPage.tsx | Nova Escola | `super.tenants.modal.title` | Título modal criação |
| 560 | form | SuperTenantsPage.tsx | Nome | `super.tenants.modal.nameLabel` | Label campo |
| 561 | form | SuperTenantsPage.tsx | Bio (opcional) | `super.tenants.modal.bioLabel` | Label campo |
| 562 | form | SuperTenantsPage.tsx | Descrição breve da escola | `super.tenants.modal.bioPlaceholder` | Placeholder |
| 563 | form | SuperTenantsPage.tsx | Habilitada | `super.tenants.modal.enabledLabel` | Label checkbox |
| 564 | ui | SuperTenantsPage.tsx | Owner (opcional) — se preenchido, cria o owner junto. | `super.tenants.modal.ownerHint` | Hint seção owner |
| 565 | form | SuperTenantsPage.tsx | Nome do Owner | `super.tenants.modal.ownerNameLabel` | Label campo |
| 566 | form | SuperTenantsPage.tsx | Email do Owner | `super.tenants.modal.ownerEmailLabel` | Label campo |
| 567 | form | SuperTenantsPage.tsx | Senha do Owner | `super.tenants.modal.ownerPasswordLabel` | Label campo |
| 568 | ui | SuperTenantsPage.tsx | Cancelar | `common.actions.cancel` | Reusa |
| 569 | loading | SuperTenantsPage.tsx | Criando... | `super.tenants.modal.creating` | Estado loading botão |
| 570 | ui | SuperTenantsPage.tsx | Criar Escola | `super.tenants.modal.createButton` | Botão submit |
| 571 | toast | SuperTenantsPage.tsx | Escola criada com sucesso! | `super.tenants.toast.created` | toast.success |
| 572 | toast | SuperTenantsPage.tsx | Erro ao criar escola | `super.tenants.toast.createError` | toast.error |
| 573 | ui | SuperTenantEditPage.tsx | Editar Escola | `super.tenantEdit.title` | h1 |
| 574 | form | SuperTenantEditPage.tsx | Nome | `super.tenantEdit.form.nameLabel` | Label campo |
| 575 | form | SuperTenantEditPage.tsx | Bio | `super.tenantEdit.form.bioLabel` | Label campo |
| 576 | form | SuperTenantEditPage.tsx | Logo URL | `super.tenantEdit.form.logoLabel` | Label campo |
| 577 | form | SuperTenantEditPage.tsx | Escola habilitada | `super.tenantEdit.form.enabledLabel` | Label checkbox |
| 578 | ui | SuperTenantEditPage.tsx | Salvar | `super.tenantEdit.saveButton` | Botão submit |
| 579 | ui | SuperTenantEditPage.tsx | Acessar Escola | `super.tenantEdit.accessButton` | Link externo |
| 580 | error | SuperTenantEditPage.tsx | Tenant não encontrado. | `super.tenantEdit.notFound` | Estado de erro |
| 581 | ui | SuperTenantEditPage.tsx | Estatísticas | `super.tenantEdit.statsTitle` | Título painel lateral |
| 582 | ui | SuperTenantEditPage.tsx | Usuários | `super.tenantEdit.stats.users` | Label stat |
| 583 | ui | SuperTenantEditPage.tsx | Cursos | `super.tenantEdit.stats.courses` | Label stat |
| 584 | ui | SuperTenantEditPage.tsx | Criado em | `super.tenantEdit.stats.createdAt` | Label stat |
| 585 | ui | SuperTenantEditPage.tsx | Owners / Super Admins | `super.tenantEdit.ownersTitle` | Título painel lateral |
| 586 | toast | SuperTenantEditPage.tsx | Escola atualizada com sucesso! | `super.tenantEdit.toast.updated` | toast.success |
| 587 | toast | SuperTenantEditPage.tsx | Erro ao atualizar | `super.tenantEdit.toast.updateError` | toast.error |
| 588 | ui | SuperUsersPage.tsx | Usuários da Plataforma | `super.users.title` | h1 |
| 589 | ui | SuperUsersPage.tsx | Visualize e gerencie todos os usuários de todas as escolas. | `super.users.subtitle` | Subtítulo |
| 590 | form | SuperUsersPage.tsx | Buscar por nome ou email... | `super.users.searchPlaceholder` | Placeholder busca |
| 591 | ui | SuperUsersPage.tsx | Todos os roles | `super.users.filter.allRoles` | Option select vazio |
| 592 | ui | SuperUsersPage.tsx | Aluno | `common.roles.student` | **NOVA** chave em common.roles |
| 593 | ui | SuperUsersPage.tsx | Nome | `super.users.table.name` | Cabeçalho tabela |
| 594 | ui | SuperUsersPage.tsx | Email | `super.users.table.email` | Cabeçalho tabela |
| 595 | ui | SuperUsersPage.tsx | Escola | `super.users.table.school` | Cabeçalho tabela |
| 596 | ui | SuperUsersPage.tsx | Role | `super.users.table.role` | Cabeçalho tabela |
| 597 | ui | SuperUsersPage.tsx | Ações | `super.users.table.actions` | Cabeçalho tabela |
| 598 | ui | SuperUsersPage.tsx | Alterar Role | `super.users.changeRoleButton` | Botão ação |
| 599 | empty | SuperUsersPage.tsx | Nenhum usuário encontrado. | `super.users.empty` | Estado vazio tabela |
| 600 | ui | SuperUsersPage.tsx | {{total}} usuário(s) • Página {{page}} de {{totalPages}} | `super.users.pagination` | Info paginação |
| 601 | ui | SuperUsersPage.tsx | Anterior | `common.pagination.previous` | Reusa |
| 602 | ui | SuperUsersPage.tsx | Próxima | `common.pagination.next` | Reusa |
| 603 | ui | SuperUsersPage.tsx | Alterar Role | `super.users.modal.title` | Título modal |
| 604 | ui | SuperUsersPage.tsx | Escola: {{slug}} | `super.users.modal.schoolBadge` | Contexto do usuário no modal |
| 605 | ui | SuperUsersPage.tsx | Cancelar | `common.actions.cancel` | Reusa |
| 606 | loading | SuperUsersPage.tsx | Salvando... | `common.actions.saving` | Reusa |
| 607 | ui | SuperUsersPage.tsx | Confirmar | `super.users.modal.confirmButton` | Botão submit modal |
| 608 | toast | SuperUsersPage.tsx | Role atualizado com sucesso! | `super.users.toast.roleUpdated` | toast.success |
| 609 | toast | SuperUsersPage.tsx | Erro ao atualizar role | `super.users.toast.updateError` | toast.error |

---

## Lote 7 — ChartMarkupQuestionForm, RiskCalculatorQuestionForm, SimTradingQuestionForm, SuperAdminLayout

### Arquivos analisados
| # | Arquivo | Strings encontradas |
|---|---------|---------------------|
| 1 | `src/components/admin/ChartMarkupQuestionForm.tsx` | 23 |
| 2 | `src/components/admin/RiskCalculatorQuestionForm.tsx` | 22 |
| 3 | `src/components/admin/SimTradingQuestionForm.tsx` | 22 |
| 4 | `src/layouts/SuperAdminLayout/SuperAdminLayout.tsx` | 0 (nenhuma string visível) |
| 5 | `src/layouts/SuperAdminLayout/SuperSidebar.tsx` | 5 |
| 6 | `src/layouts/SuperAdminLayout/SuperTopbar.tsx` | 2 (reuses) |

### Novas entradas

| # | Categoria | Arquivo | Texto original | Chave i18n sugerida | Observações |
|---|-----------|---------|----------------|---------------------|-------------|
| 610 | form | ChartMarkupQuestionForm.tsx | Enunciado | `admin.chartMarkupForm.statementLabel` | Label do campo |
| 611 | form | ChartMarkupQuestionForm.tsx | Ex: Marque a zona de suporte principal neste gráfico | `admin.chartMarkupForm.statementPlaceholder` | Placeholder |
| 612 | form | ChartMarkupQuestionForm.tsx | Explicação (pós-resposta) | `admin.chartMarkupForm.explanationLabel` | Label do campo |
| 613 | form | ChartMarkupQuestionForm.tsx | Dificuldade (1-5) | `admin.chartMarkupForm.difficultyLabel` | Label do campo |
| 614 | form | ChartMarkupQuestionForm.tsx | Peso | `admin.chartMarkupForm.weightLabel` | Label do campo |
| 615 | form | ChartMarkupQuestionForm.tsx | URL da imagem do gráfico | `admin.chartMarkupForm.imageUrlLabel` | Label do campo |
| 616 | form | ChartMarkupQuestionForm.tsx | https://exemplo.com/chart.png | `admin.chartMarkupForm.imageUrlPlaceholder` | Placeholder |
| 617 | form | ChartMarkupQuestionForm.tsx | Tipo de zona | `admin.chartMarkupForm.zoneTypeLabel` | Label do select |
| 618 | form | ChartMarkupQuestionForm.tsx | Suporte | `admin.chartMarkupForm.zoneTypes.support` | Opção do select |
| 619 | form | ChartMarkupQuestionForm.tsx | Resistência | `admin.chartMarkupForm.zoneTypes.resistance` | Opção do select |
| 620 | form | ChartMarkupQuestionForm.tsx | Zona de Oferta | `admin.chartMarkupForm.zoneTypes.supply` | Opção do select |
| 621 | form | ChartMarkupQuestionForm.tsx | Zona de Demanda | `admin.chartMarkupForm.zoneTypes.demand` | Opção do select |
| 622 | form | ChartMarkupQuestionForm.tsx | Threshold IoU (0.1 – 1.0) | `admin.chartMarkupForm.thresholdLabel` | Label do campo |
| 623 | form | ChartMarkupQuestionForm.tsx | Gabarito — desenhe a zona esperada | `admin.chartMarkupForm.answerZoneLabel` | Label do canvas |
| 624 | form | ChartMarkupQuestionForm.tsx | Cole a URL acima para carregar a imagem | `admin.chartMarkupForm.imagePrompt` | Hint no canvas vazio |
| 625 | ui | ChartMarkupQuestionForm.tsx | Desenhar gabarito | `admin.chartMarkupForm.drawButton` | Botão toggle |
| 626 | ui | ChartMarkupQuestionForm.tsx | Desenhando... | `admin.chartMarkupForm.drawing` | Estado ativo do botão |
| 627 | ui | ChartMarkupQuestionForm.tsx | Limpar | `admin.chartMarkupForm.clearButton` | Botão limpar canvas |
| 628 | validation | ChartMarkupQuestionForm.tsx | Desenhe a zona esperada no gráfico | `admin.chartMarkupForm.zoneError` | Erro de validação |
| 629 | validation | ChartMarkupQuestionForm.tsx | Mínimo 5 caracteres | `admin.chartMarkupForm.validation.statement` | Erro zod statement |
| 630 | validation | ChartMarkupQuestionForm.tsx | URL inválida | `admin.chartMarkupForm.validation.imageUrl` | Erro zod imageUrl |
| 631 | ui | ChartMarkupQuestionForm.tsx | Salvar questão | `admin.chartMarkupForm.saveButton` | Botão submit |
| 632 | ui | ChartMarkupQuestionForm.tsx | Cancelar | `common.actions.cancel` | Reusa |
| 633 | form | RiskCalculatorQuestionForm.tsx | Enunciado | `admin.riskCalcForm.statementLabel` | Label do campo |
| 634 | form | RiskCalculatorQuestionForm.tsx | Ex: Calcule o tamanho da posição para este cenário | `admin.riskCalcForm.statementPlaceholder` | Placeholder |
| 635 | form | RiskCalculatorQuestionForm.tsx | Explicação (pós-resposta) | `admin.riskCalcForm.explanationLabel` | Label do campo |
| 636 | form | RiskCalculatorQuestionForm.tsx | Dificuldade (1-5) | `admin.riskCalcForm.difficultyLabel` | Label do campo |
| 637 | form | RiskCalculatorQuestionForm.tsx | Peso | `admin.riskCalcForm.weightLabel` | Label do campo |
| 638 | form | RiskCalculatorQuestionForm.tsx | Dados do cenário | `admin.riskCalcForm.scenarioTitle` | Título da seção |
| 639 | form | RiskCalculatorQuestionForm.tsx | Saldo da conta | `admin.riskCalcForm.balanceLabel` | Label do campo |
| 640 | form | RiskCalculatorQuestionForm.tsx | Risco (%) | `admin.riskCalcForm.riskPercentLabel` | Label do campo |
| 641 | form | RiskCalculatorQuestionForm.tsx | Preço de entrada | `admin.riskCalcForm.entryPriceLabel` | Label do campo |
| 642 | form | RiskCalculatorQuestionForm.tsx | Preço do stop | `admin.riskCalcForm.stopPriceLabel` | Label do campo |
| 643 | form | RiskCalculatorQuestionForm.tsx | Valor/contrato | `admin.riskCalcForm.contractValueLabel` | Label do campo |
| 644 | form | RiskCalculatorQuestionForm.tsx | Casas decimais | `admin.riskCalcForm.roundingLabel` | Label do campo |
| 645 | form | RiskCalculatorQuestionForm.tsx | Tolerância (%) | `admin.riskCalcForm.toleranceLabel` | Label do campo |
| 646 | ui | RiskCalculatorQuestionForm.tsx | Preview — resposta esperada | `admin.riskCalcForm.previewTitle` | Título do preview |
| 647 | ui | RiskCalculatorQuestionForm.tsx | contratos / lotes | `admin.riskCalcForm.previewContracts` | Unidade no preview |
| 648 | validation | RiskCalculatorQuestionForm.tsx | Mínimo 5 caracteres | `admin.riskCalcForm.validation.statement` | Erro zod statement |
| 649 | validation | RiskCalculatorQuestionForm.tsx | Deve ser positivo | `admin.riskCalcForm.validation.positive` | Erro zod numéricos |
| 650 | validation | RiskCalculatorQuestionForm.tsx | Máximo 100% | `admin.riskCalcForm.validation.maxRisk` | Erro zod risco |
| 651 | ui | RiskCalculatorQuestionForm.tsx | Salvar questão | `admin.riskCalcForm.saveButton` | Botão submit |
| 652 | ui | RiskCalculatorQuestionForm.tsx | Cancelar | `common.actions.cancel` | Reusa |
| 653 | ui | SimTradingQuestionForm.tsx | Configuração do Cenário de Trading | `admin.simForm.sectionTitle` | Título da seção |
| 654 | ui | SimTradingQuestionForm.tsx | Define os parâmetros de candles, execução e pontuação | `admin.simForm.sectionSubtitle` | Subtítulo da seção |
| 655 | ui | SimTradingQuestionForm.tsx | Candles | `admin.simForm.candlesSection` | Título do grupo |
| 656 | ui | SimTradingQuestionForm.tsx | Execução | `admin.simForm.executionSection` | Título do grupo |
| 657 | ui | SimTradingQuestionForm.tsx | Critérios de Aprovação | `admin.simForm.scoringSection` | Título do grupo |
| 658 | ui | SimTradingQuestionForm.tsx | Pesos da Pontuação | `admin.simForm.weightsSection` | Título do grupo |
| 659 | ui | SimTradingQuestionForm.tsx | (serão normalizados automaticamente) | `admin.simForm.weightsNormalized` | Hint dos pesos |
| 660 | form | SimTradingQuestionForm.tsx | Qtd. Candles | `admin.simForm.fields.numCandles` | Label do campo |
| 661 | form | SimTradingQuestionForm.tsx | Preço Inicial | `admin.simForm.fields.startPrice` | Label do campo |
| 662 | form | SimTradingQuestionForm.tsx | Volatilidade (ex: 0.015) | `admin.simForm.fields.volatility` | Label do campo |
| 663 | form | SimTradingQuestionForm.tsx | Tendência (-1 a 1) | `admin.simForm.fields.trend` | Label do campo |
| 664 | form | SimTradingQuestionForm.tsx | Spread (bps) | `admin.simForm.fields.spreadBps` | Label do campo |
| 665 | form | SimTradingQuestionForm.tsx | Saldo Inicial ($) | `admin.simForm.fields.initialBalance` | Label do campo |
| 666 | form | SimTradingQuestionForm.tsx | Taxa (bps) | `admin.simForm.fields.feeBps` | Label do campo |
| 667 | form | SimTradingQuestionForm.tsx | Alavancagem máx. | `admin.simForm.fields.maxLeverage` | Label do campo |
| 668 | form | SimTradingQuestionForm.tsx | Tamanho máx. posição (%) | `admin.simForm.fields.maxPositionSize` | Label do campo |
| 669 | form | SimTradingQuestionForm.tsx | Permitir short | `admin.simForm.fields.allowShort` | Label do toggle |
| 670 | form | SimTradingQuestionForm.tsx | PnL mínimo para aprovação (%) | `admin.simForm.fields.passingPnl` | Label do campo |
| 671 | form | SimTradingQuestionForm.tsx | Drawdown máx. permitido (%) | `admin.simForm.fields.maxDrawdown` | Label do campo |
| 672 | form | SimTradingQuestionForm.tsx | Trades mínimos | `admin.simForm.fields.minTrades` | Label do campo |
| 673 | form | SimTradingQuestionForm.tsx | Peso PnL | `admin.simForm.fields.weightPnl` | Label do campo |
| 674 | form | SimTradingQuestionForm.tsx | Peso Drawdown | `admin.simForm.fields.weightDrawdown` | Label do campo |
| 675 | form | SimTradingQuestionForm.tsx | Peso Sharpe | `admin.simForm.fields.weightSharpe` | Label do campo |
| 676 | form | SimTradingQuestionForm.tsx | Peso Win Rate | `admin.simForm.fields.weightWinRate` | Label do campo |
| 677 | form | SimTradingQuestionForm.tsx | 1 min | `admin.simForm.timeframeOptions.1min` | Opção timeframe |
| 678 | form | SimTradingQuestionForm.tsx | 5 min | `admin.simForm.timeframeOptions.5min` | Opção timeframe |
| 679 | form | SimTradingQuestionForm.tsx | 15 min | `admin.simForm.timeframeOptions.15min` | Opção timeframe |
| 680 | form | SimTradingQuestionForm.tsx | 1 hora | `admin.simForm.timeframeOptions.1h` | Opção timeframe |
| 681 | form | SimTradingQuestionForm.tsx | 4 horas | `admin.simForm.timeframeOptions.4h` | Opção timeframe — nova |
| 682 | validation | SimTradingQuestionForm.tsx | Use 1, 5, 15, 60 ou 240 min | `admin.simForm.validation.timeframe` | Erro zod timeframe |
| 683 | ui | SimTradingQuestionForm.tsx | Salvar configuração | `admin.simForm.saveButton` | Botão submit |
| 684 | ui | SimTradingQuestionForm.tsx | Cancelar | `common.actions.cancel` | Reusa |
| 685 | ui | SuperSidebar.tsx | Visão Geral | `super.layout.nav.overview` | Item de navegação |
| 686 | ui | SuperSidebar.tsx | Escolas | `super.layout.nav.schools` | Item de navegação |
| 687 | ui | SuperSidebar.tsx | Usuários | `super.layout.nav.users` | Item de navegação |
| 688 | ui | SuperSidebar.tsx | Super Admin | `super.layout.brand` | Nome da marca na sidebar |
| 689 | ui | SuperSidebar.tsx | Super Admin | `super.layout.roleBadge` | Badge de role |
| 690 | aria | SuperSidebar.tsx | Expandir sidebar | `super.layout.aria.expand` | aria-label |
| 691 | aria | SuperSidebar.tsx | Colapsar sidebar | `super.layout.aria.collapse` | aria-label |
| 692 | aria | SuperTopbar.tsx | Menu | `super.layout.aria.menu` | aria-label — reusa padrão |
| 693 | aria | SuperTopbar.tsx | Sair | `super.layout.aria.logout` | aria-label — reusa padrão |

### Novas chaves adicionadas ao pt-BR.json
- `admin.chartMarkupForm` — 21 novas chaves
- `admin.riskCalcForm` — 17 novas chaves
- `admin.simForm` — 24 novas chaves (incluindo `timeframeOptions` e `fields`)
- `super.layout` — 7 novas chaves (brand, roleBadge, nav.*, aria.*)
- **Total Lote 7: 69 novas chaves**

---

## Lote 8 — WorkspaceLayout, TenantPublicLayout, WorkspacePage, sim-trading (6 componentes)

### Arquivos analisados
| # | Arquivo | Strings encontradas |
|---|---------|---------------------|
| 1 | `src/layouts/WorkspaceLayout/WorkspaceLayout.tsx` | 4 |
| 2 | `src/layouts/TenantPublicLayout.tsx` | 5 |
| 3 | `src/pages/workspace/WorkspacePage.tsx` | 5 |
| 4 | `src/components/sim-trading/ChallengeBriefingScreen.tsx` | 26 |
| 5 | `src/components/sim-trading/ResultScreen.tsx` | 11 |
| 6 | `src/components/sim-trading/OrderTicket.tsx` | 7 |
| 7 | `src/components/sim-trading/HelpDrawer.tsx` | 43 |
| 8 | `src/components/sim-trading/AccountSummary.tsx` | 2 |
| 9 | `src/components/sim-trading/MetricsPanel.tsx` | 6 |
| 10 | `src/components/sim-trading/OnboardingTour.tsx` | 16 |

### Novas entradas

| # | Categoria | Arquivo | Texto original | Chave i18n sugerida | Observações |
|---|-----------|---------|----------------|---------------------|-------------|
| 694 | ui | WorkspaceLayout.tsx | Workspace | `workspace.layout.badge` | Badge da marca |
| 695 | ui | WorkspaceLayout.tsx | Painel | `workspace.layout.nav.panel` | Link de navegação |
| 696 | ui | WorkspaceLayout.tsx | Escola | `workspace.layout.nav.school` | Link de navegação |
| 697 | aria | WorkspaceLayout.tsx | Sair | `common.actions.back` | Reusa common.aria.logout |
| 698 | ui | TenantPublicLayout.tsx | Cursos | `workspace.tenantPublic.nav.courses` | Link de navegação |
| 699 | ui | TenantPublicLayout.tsx | Dashboard | `workspace.tenantPublic.nav.dashboard` | Botão autenticado |
| 700 | ui | TenantPublicLayout.tsx | Entrar | `workspace.tenantPublic.nav.login` | Botão não autenticado |
| 701 | aria | TenantPublicLayout.tsx | Sair | `common.aria.logout` | Reusa |
| 702 | ui | TenantPublicLayout.tsx | Todos os direitos reservados. | `workspace.tenantPublic.footer` | Rodapé (dinâmico: ano + nome) |
| 703 | toast | WorkspacePage.tsx | Erro ao carregar dados. | `workspace.page.toast.loadError` | toast.error |
| 704 | ui | WorkspacePage.tsx | Bem-vindo, {{name}} | `workspace.page.welcome` | Interpolação com nome do usuário |
| 705 | ui | WorkspacePage.tsx | Gerencie sua escola a partir do painel administrativo. | `workspace.page.subtitle` | Subtítulo da página |
| 706 | ui | WorkspacePage.tsx | Gerenciar escola | `workspace.page.manageButton` | Botão primário |
| 707 | ui | WorkspacePage.tsx | Ver como aluno | `workspace.page.viewAsStudent` | Botão secundário |
| 708 | ui | ChallengeBriefingScreen.tsx | Desafio Concluído! | `sim.briefing.alreadyPassed.title` | Estado aprovado |
| 709 | ui | ChallengeBriefingScreen.tsx | Você já foi aprovado neste desafio com {{score}}/100 pontos em {{count}} tentativa(s). | `sim.briefing.alreadyPassed.description` | Interpolação score + count |
| 710 | ui | ChallengeBriefingScreen.tsx | Ver Resultado | `sim.briefing.alreadyPassed.viewResultButton` | Botão |
| 711 | ui | ChallengeBriefingScreen.tsx | Voltar | `common.actions.back` | Reusa |
| 712 | ui | ChallengeBriefingScreen.tsx | Simulação de Trading | `sim.briefing.badge` | Badge do tipo |
| 713 | ui | ChallengeBriefingScreen.tsx | Ajuda | `sim.briefing.helpButton` | Botão de ajuda |
| 714 | ui | ChallengeBriefingScreen.tsx | Tentativa anterior: | `sim.briefing.prevAttempt.label` | Label da pill |
| 715 | ui | ChallengeBriefingScreen.tsx | {{score}}/100 pontos — {{attempt}}ª tentativa | `sim.briefing.prevAttempt.value` | Valor da pill |
| 716 | ui | ChallengeBriefingScreen.tsx | Seus Objetivos | `sim.briefing.objectives.title` | Título da seção |
| 717 | ui | ChallengeBriefingScreen.tsx | Meta de Lucro | `sim.briefing.objectives.profitTarget` | Label do card |
| 718 | ui | ChallengeBriefingScreen.tsx | Lucro mínimo sobre o saldo inicial | `sim.briefing.objectives.profitDesc` | Descrição do card |
| 719 | ui | ChallengeBriefingScreen.tsx | Drawdown Máximo | `sim.briefing.objectives.maxDrawdown` | Label do card |
| 720 | ui | ChallengeBriefingScreen.tsx | Queda máxima permitida no patrimônio | `sim.briefing.objectives.drawdownDesc` | Descrição do card |
| 721 | ui | ChallengeBriefingScreen.tsx | Trades Mínimos | `sim.briefing.objectives.minTrades` | Label do card |
| 722 | ui | ChallengeBriefingScreen.tsx | Operações mínimas para validar | `sim.briefing.objectives.minTradesDesc` | Descrição do card |
| 723 | ui | ChallengeBriefingScreen.tsx | Regras do Desafio | `sim.briefing.rules.title` | Título da seção |
| 724 | ui | ChallengeBriefingScreen.tsx | Saldo Inicial | `sim.briefing.rules.initialBalance` | Regra |
| 725 | ui | ChallengeBriefingScreen.tsx | Eventos Máximos | `sim.briefing.rules.maxEvents` | Regra |
| 726 | ui | ChallengeBriefingScreen.tsx | Alavancagem Máx. | `sim.briefing.rules.maxLeverage` | Regra |
| 727 | ui | ChallengeBriefingScreen.tsx | Taxa por operação | `sim.briefing.rules.feeBps` | Regra |
| 728 | ui | ChallengeBriefingScreen.tsx | Venda a descoberto | `sim.briefing.rules.shortSelling` | Regra |
| 729 | ui | ChallengeBriefingScreen.tsx | Permitida | `sim.briefing.rules.allowed` | Valor da regra |
| 730 | ui | ChallengeBriefingScreen.tsx | Como Funciona | `sim.briefing.howItWorks.title` | Título da seção |
| 731 | ui | ChallengeBriefingScreen.tsx | (step 1) Você receberá um gráfico de velas... | `sim.briefing.howItWorks.step1` | Passo 1 |
| 732 | ui | ChallengeBriefingScreen.tsx | (step 2) Use os controles de playback... | `sim.briefing.howItWorks.step2` | Passo 2 |
| 733 | ui | ChallengeBriefingScreen.tsx | (step 3) Abra ordens de compra (BUY)... | `sim.briefing.howItWorks.step3` | Passo 3 |
| 734 | ui | ChallengeBriefingScreen.tsx | (step 4) Acompanhe seu PnL... | `sim.briefing.howItWorks.step4` | Passo 4 |
| 735 | ui | ChallengeBriefingScreen.tsx | (step 5) Ao chegar na última vela... | `sim.briefing.howItWorks.step5` | Passo 5 |
| 736 | ui | ChallengeBriefingScreen.tsx | (step 6) O servidor valida sua simulação... | `sim.briefing.howItWorks.step6` | Passo 6 |
| 737 | loading | ChallengeBriefingScreen.tsx | Carregando cenário... | `sim.briefing.loadingScenario` | Estado loading do botão |
| 738 | ui | ChallengeBriefingScreen.tsx | Iniciar Simulação | `sim.briefing.startButton` | Botão principal |
| 739 | ui | ResultScreen.tsx | Sessão Concluída! | `sim.result.practice.title` | Título modo PRACTICE |
| 740 | ui | ResultScreen.tsx | Desafio Aprovado! | `sim.result.challenge.approvedTitle` | Título aprovado |
| 741 | ui | ResultScreen.tsx | Desafio Não Aprovado | `sim.result.challenge.failedTitle` | Título reprovado |
| 742 | ui | ResultScreen.tsx | Parabéns! Você atingiu os critérios de aprovação. | `sim.result.challenge.approvedSubtitle` | Subtítulo aprovado |
| 743 | ui | ResultScreen.tsx | Continue praticando e tente novamente. | `sim.result.challenge.failedSubtitle` | Subtítulo reprovado |
| 744 | ui | ResultScreen.tsx | pontos | `sim.result.scoreUnit` | Unidade da pontuação |
| 745 | ui | ResultScreen.tsx | Saldo Final | `sim.result.metrics.finalBalance` | Label da métrica |
| 746 | ui | ResultScreen.tsx | Divergência detectada — resultado calculado pelo servidor | `sim.result.tamperWarning` | Aviso de tamper |
| 747 | ui | ResultScreen.tsx | Tentar Novamente | `sim.result.retryButton` | Botão retry |
| 748 | ui | ResultScreen.tsx | Nova Sessão | `sim.result.practice.newSessionButton` | Botão modo PRACTICE |
| 749 | ui | ResultScreen.tsx | Voltar | `common.actions.back` | Reusa |
| 750 | ui | OrderTicket.tsx | Nova Ordem | `sim.orderTicket.title` | Título do painel |
| 751 | form | OrderTicket.tsx | Quantidade | `sim.orderTicket.quantityLabel` | Label do campo |
| 752 | form | OrderTicket.tsx | Preço | `sim.orderTicket.priceLabel` | Label do campo LIMIT/STOP |
| 753 | ui | OrderTicket.tsx | Comprar | `sim.orderTicket.buyButton` | Botão submit BUY |
| 754 | ui | OrderTicket.tsx | Vender | `sim.orderTicket.sellButton` | Botão submit SELL |
| 755 | validation | OrderTicket.tsx | Quantidade deve ser positiva | `sim.orderTicket.validation.quantity` | Erro zod |
| 756 | validation | OrderTicket.tsx | Preço obrigatório para LIMIT/STOP | `sim.orderTicket.validation.price` | Erro zod |
| 757 | ui | HelpDrawer.tsx | Central de Ajuda | `sim.help.title` | Título do drawer |
| 758 | ui | HelpDrawer.tsx | Dicas Rápidas | `sim.help.quickTipsTitle` | Título da seção |
| 759 | ui | HelpDrawer.tsx | Glossário | `sim.help.glossaryTitle` | Título da seção |
| 760 | ui | HelpDrawer.tsx | Reiniciar Tutorial | `sim.help.restartTutorialButton` | Botão no footer |
| 761 | ui | HelpDrawer.tsx | Tipos de Ordem | `sim.help.categories.orders` | Categoria do glossário |
| 762 | ui | HelpDrawer.tsx | Conceitos | `sim.help.categories.concepts` | Categoria do glossário |
| 763 | ui | HelpDrawer.tsx | Indicadores | `sim.help.categories.indicators` | Categoria do glossário |
| 764 | ui | HelpDrawer.tsx | Use Play/Pause para controlar o avanço das velas | `sim.help.quickTips.tip1` | Dica rápida 1 |
| 765 | ui | HelpDrawer.tsx | O gráfico mostra candles — cada vela = 1 período | `sim.help.quickTips.tip2` | Dica rápida 2 |
| 766 | ui | HelpDrawer.tsx | Comece com ordens MARKET pequenas para entender o fluxo | `sim.help.quickTips.tip3` | Dica rápida 3 |
| 767 | ui | HelpDrawer.tsx | Sempre defina Stop-Loss para limitar perdas | `sim.help.quickTips.tip4` | Dica rápida 4 |
| 768 | ui | HelpDrawer.tsx | Acompanhe seu Equity e Drawdown em tempo real | `sim.help.quickTips.tip5` | Dica rápida 5 |
| 769 | ui | HelpDrawer.tsx | Clique 'Enviar Resultado' quando as velas acabarem | `sim.help.quickTips.tip6` | Dica rápida 6 |
| 770 | misc | HelpDrawer.tsx | BUY (Compra) + descrição | `sim.help.glossary.buy.*` | Termo + descrição |
| 771 | misc | HelpDrawer.tsx | SELL (Venda) + descrição | `sim.help.glossary.sell.*` | Termo + descrição |
| 772 | misc | HelpDrawer.tsx | MARKET (A Mercado) + descrição | `sim.help.glossary.market.*` | Termo + descrição |
| 773 | misc | HelpDrawer.tsx | LIMIT (Limitada) + descrição | `sim.help.glossary.limit.*` | Termo + descrição |
| 774 | misc | HelpDrawer.tsx | STOP + descrição | `sim.help.glossary.stop.*` | Termo + descrição |
| 775 | misc | HelpDrawer.tsx | Stop-Loss (SL) + descrição | `sim.help.glossary.sl.*` | Termo + descrição |
| 776 | misc | HelpDrawer.tsx | Take-Profit (TP) + descrição | `sim.help.glossary.tp.*` | Termo + descrição |
| 777 | misc | HelpDrawer.tsx | PnL (Profit & Loss) + descrição | `sim.help.glossary.pnl.*` | Termo + descrição |
| 778 | misc | HelpDrawer.tsx | Equity (Patrimônio) + descrição | `sim.help.glossary.equity.*` | Termo + descrição |
| 779 | misc | HelpDrawer.tsx | Posição + descrição | `sim.help.glossary.position.*` | Termo + descrição |
| 780 | misc | HelpDrawer.tsx | Fee / Taxa + descrição | `sim.help.glossary.fee.*` | Termo + descrição |
| 781 | misc | HelpDrawer.tsx | Slippage + descrição | `sim.help.glossary.slippage.*` | Termo + descrição |
| 782 | misc | HelpDrawer.tsx | Spread + descrição | `sim.help.glossary.spread.*` | Termo + descrição |
| 783 | misc | HelpDrawer.tsx | Drawdown + descrição | `sim.help.glossary.drawdown.*` | Termo + descrição |
| 784 | misc | HelpDrawer.tsx | Win Rate + descrição | `sim.help.glossary.winrate.*` | Termo + descrição |
| 785 | misc | HelpDrawer.tsx | Sharpe Ratio + descrição | `sim.help.glossary.sharpe.*` | Termo + descrição |
| 786 | misc | HelpDrawer.tsx | Profit Factor + descrição | `sim.help.glossary.profitfactor.*` | Termo + descrição |
| 787 | ui | AccountSummary.tsx | Saldo | `sim.accountSummary.balance` | Label de métrica |
| 788 | ui | AccountSummary.tsx | DD Máx | `sim.accountSummary.maxDD` | Label de métrica |
| 789 | empty | MetricsPanel.tsx | Métricas disponíveis ao finalizar | `sim.metrics.empty` | Estado vazio |
| 790 | ui | MetricsPanel.tsx | Ganhos | `sim.metrics.wins` | Label de métrica |
| 791 | ui | MetricsPanel.tsx | Perdas | `sim.metrics.losses` | Label de métrica |
| 792 | ui | MetricsPanel.tsx | Max DD | `sim.metrics.maxDD` | Label de métrica |
| 793 | ui | MetricsPanel.tsx | Fees Total | `sim.metrics.feesTotal` | Label de métrica |
| 794 | ui | MetricsPanel.tsx | Eventos | `sim.metrics.events` | Label de métrica |
| 795 | ui | OnboardingTour.tsx | Entenda o Gráfico | `sim.tutorial.steps.chart.title` | Título do passo 1 |
| 796 | ui | OnboardingTour.tsx | (descrição passo 1) Este é o gráfico de velas... | `sim.tutorial.steps.chart.description` | Descrição do passo 1 |
| 797 | ui | OnboardingTour.tsx | Controles de Playback | `sim.tutorial.steps.playback.title` | Título do passo 2 |
| 798 | ui | OnboardingTour.tsx | (descrição passo 2) Use os botões de Play/Pause... | `sim.tutorial.steps.playback.description` | Descrição do passo 2 |
| 799 | ui | OnboardingTour.tsx | Abra sua Primeira Ordem | `sim.tutorial.steps.order.title` | Título do passo 3 |
| 800 | ui | OnboardingTour.tsx | (descrição passo 3) No painel "Nova Ordem"... | `sim.tutorial.steps.order.description` | Descrição do passo 3 |
| 801 | ui | OnboardingTour.tsx | Acompanhe sua Posição | `sim.tutorial.steps.position.title` | Título do passo 4 |
| 802 | ui | OnboardingTour.tsx | (descrição passo 4) Após uma ordem ser executada... | `sim.tutorial.steps.position.description` | Descrição do passo 4 |
| 803 | ui | OnboardingTour.tsx | Ordens, Fills e Métricas | `sim.tutorial.steps.tabs.title` | Título do passo 5 |
| 804 | ui | OnboardingTour.tsx | (descrição passo 5) Na parte inferior... | `sim.tutorial.steps.tabs.description` | Descrição do passo 5 |
| 805 | ui | OnboardingTour.tsx | Finalize e Envie | `sim.tutorial.steps.submit.title` | Título do passo 6 |
| 806 | ui | OnboardingTour.tsx | (descrição passo 6) Quando todas as velas forem exibidas... | `sim.tutorial.steps.submit.description` | Descrição do passo 6 |
| 807 | ui | OnboardingTour.tsx | Passo {{current}} de {{total}} | `sim.tutorial.stepOf` | Progresso do passo |
| 808 | aria | OnboardingTour.tsx | Fechar tutorial | `sim.tutorial.closeTitle` | title do botão fechar |
| 809 | ui | OnboardingTour.tsx | Pular | `sim.tutorial.skipButton` | Botão pular |
| 810 | ui | OnboardingTour.tsx | Anterior | `common.actions.previous` | Reusa |
| 811 | ui | OnboardingTour.tsx | Próximo | `common.actions.next` | Reusa |
| 812 | ui | OnboardingTour.tsx | Concluir | `sim.tutorial.finishButton` | Botão finalizar |

### Novas chaves adicionadas ao pt-BR.json
- `workspace.layout` — 3 novas chaves (badge, nav.panel, nav.school)
- `workspace.tenantPublic` — 4 novas chaves (nav.courses, nav.dashboard, nav.login, footer)
- `workspace.page` — 5 novas chaves (welcome, subtitle, manageButton, viewAsStudent, toast.loadError)
- `sim.briefing` — 26 novas chaves
- `sim.result` — 11 novas chaves
- `sim.orderTicket` — 7 novas chaves
- `sim.help` — 43 novas chaves (título, categorias, dicas, 17 entradas de glossário × 2)
- `sim.accountSummary` — 2 novas chaves
- `sim.metrics` — 6 novas chaves
- `sim.tutorial` — 16 novas chaves (stepOf, closeTitle, skipButton, finishButton, 6 passos × 2)
- **Total Lote 8: 123 novas chaves** | 2 novos top-level keys (`workspace`, `sim`)

---

<!-- PRÓXIMOS LOTES SERÃO ADICIONADOS ABAIXO -->
