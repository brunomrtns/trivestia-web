# AUDITORIA TÉCNICA — LEARNING EXPERIENCE REFACTOR SPEC

> Auditoria executiva sobre a especificação de refatoração da experiência de aprendizagem.
> Foco: problemas que causam bugs em produção, não cosméticos.

---

# 1. Problemas Críticos Encontrados

## CRIT-01: Conflito estrutural entre LearningShell e AppLayout

**O que a spec diz**: O `LearningShell` é um layout imersivo com header fixo, sidebar, content area e action bar fixa, ocupando full viewport.

**O problema real**: Todas as rotas student em `/t/:tenantSlug/app/*` são children de `<AppLayout />`, que já renderiza seu próprio `Sidebar` (213 linhas) + `Topbar` (110 linhas) + `ChatFloating`. O `LearningShell` seria renderizado **dentro** do `AppLayout`, nunca em lugar dele.

O `AppLayout` aplica `p-6 overflow-y-auto` no content area (ou `p-0 overflow-hidden` quando `isTerminal` é true). O `LearningShell` propõe `h-[calc(100vh-4rem)]` fixo. Isso gera:

- scroll duplo (AppLayout scroll + LearningShell scroll interno)
- padding residual do AppLayout colado no LearningShell
- sidebar do AppLayout visível ao lado do outline do LearningShell
- topbar do AppLayout + header do LearningShell empilhados

**Como quebra em produção**: O aluno vê duas sidebars (AppLayout + LearningOutline) e dois headers (Topbar + LearningHeader), ou o layout quebra com overflow hidden cortando conteúdo.

**Correção**: A spec precisa definir **explicitamente** uma de três opções:

```
OPÇÃO A: LearningShell substitui AppLayout para rotas /learn/*
  - Rotas /learn/* ficam fora do children de AppLayout no router
  - LearningShell replica o que for necessário do AppLayout (AuthGuard, chat, logout)
  - AppLayout Sidebar e Topbar NÃO renderizam

OPÇÃO B: AppLayout entra em modo "learning" para rotas /learn/*
  - AppLayout detecta /learn/ no pathname e esconde Sidebar/Topbar
  - Remove padding, remove scroll próprio
  - LearningShell preenche o espaço livre
  -(isTerminal atual faz algo parecido, mas insuficiente)

OPÇÃO C: LearningShell coexiste dentro do AppLayout adaptado
  - AppLayout em modo learning: sidebar colapsa, topbar minimal
  - LearningShell não renderiza seu próprio header, usa o do AppLayout
```

A spec não escolhe nenhuma. Isso é um blocker para a Fase 1.

---

## CRIT-02: stepIndex na URL é numérico, mas a API usa stepId (string UUID)

**O que a spec diz**: Rota `/learn/:courseId/lessons/:lessonId/steps/:stepIndex` com índice numérico 0-based.

**O problema real**: 
- O endpoint `getTimeline` retorna `LessonStepDTO[]` onde cada step tem `id: string` (UUID) e `order: number`.
- `CourseInteractiveNext` retorna `stepId?: string` (UUID, opcional).
- `DashboardContinueNext` retorna `stepId: string | null` (UUID, nullable).
- O endpoint `markViewed` recebe `stepId` como UUID: `POST /lessons/:lessonId/steps/:stepId/view`.

O `stepIndex` numérico na URL é **derivado** e não existe na API. Isso significa:

1. Para retomar de onde parou (via `CourseInteractiveNext.stepId` ou `DashboardContinueNext.stepId`), o frontend precisa converter UUID para índice. Se a ordem dos steps mudou no backend entre o momento em que o progresso foi salvo e o momento em que a timeline é carregada, o índice aponta para o step errado.

2. Se o admin reordenar steps (endpoint `reorderSteps` existe), todos os bookmarks e deep links com stepIndex quebram.

3. A conversão stepId→stepIndex requer que a timeline esteja carregada antes de posicionar o aluno. Se a query falhar ou demorar, o stepIndex na URL é meaningless.

**Como quebra em produção**: Admin reordena steps. Aluno recarrega a página. URL diz step 3, mas step 3 agora é conteúdo diferente do que o aluno estava vendo. markViewed é chamado no step errado.

**Correção**: Usar `stepId` (UUID) na URL em vez de stepIndex:

```
/learn/:courseId/lessons/:lessonId/steps/:stepId
```

E criar uma função utilitária `resolveStepIndex(steps: LessonStepDTO[], stepId?: string): number` que converte o ID para índice após carregar a timeline. Se o stepId não for encontrado na timeline (step deletado), cair para o primeiro step não completado.

---

## CRIT-03: DashboardContinueDTO não tem courseId na resposta do endpoint "continue"

**O que a spec diz** (Seção 8, Fluxo 1): `dashboardEndpoints.getContinue()` retorna `{ courseId, lessonId, stepId, kind }`.

**O problema real**: `DashboardContinueDTO` tem esta estrutura:

```typescript
{
  hasContinuation: boolean;
  course: { id: string; title: string } | null;
  module: { id: string; title: string } | null;
  lesson: { id: string; title: string; progress: { ... } } | null;
  next: { kind: 'STEP' | 'ACTIVITY'; stepId: string | null; activityId: string | null; }
}
```

Não existe `courseId` como campo direto. O `courseId` está em `data.course?.id`. O `lessonId` está em `data.lesson?.id`. E `next` não tem nem lessonId nem courseId.

Isso significa que para navegar do Dashboard para `/learn/{courseId}/lessons/{lessonId}/steps/{stepId}`, o `ContinueCard` precisa montar a URL a partir de `data.course.id`, `data.lesson.id` e `data.next.stepId`. Todos podem ser null.

**Como quebra em produção**: Se `hasContinuation` for true mas `course` for null (backend inconsistency), o ContinueCard tenta acessar `data.course.id` e crasha com TypeError.

**Correção**: A spec deve definir explicitamente o contrato de dados do continue flow com guards:

```typescript
function buildContinueUrl(data: DashboardContinueDTO): string | null {
  if (!data.hasContinuation) return null;
  if (!data.course?.id || !data.lesson?.id) return null;
  
  const base = `/app/learn/${data.course.id}/lessons/${data.lesson.id}`;
  
  if (data.next?.kind === 'ACTIVITY' && data.next.activityId) {
    return `${base}/activities/${data.next.activityId}`;
  }
  if (data.next?.stepId) {
    return `${base}/steps/${data.next.stepId}`;
  }
  return base; // fallback: abre a aula no primeiro step
}
```

---

## CRIT-04: A spec propõe rota com lessonId opcional, mas React Router v6 não suporta optional params nativamente

**O que a spec diz**: `/learn/:courseId` (sem lessonId) mostra overview. `/learn/:courseId/lessons/:lessonId` mostra a aula.

**O problema real**: React Router v6 com `createBrowserRouter` exige rotas explícitas. Não dá para ter `lessonId` opcional na mesma rota. O que funciona é ter **duas rotas separadas**:

```tsx
{ path: 'learn/:courseId', element: <CourseOverview /> }
{ path: 'learn/:courseId/lessons/:lessonId', element: <LearningShell /> }
{ path: 'learn/:courseId/lessons/:lessonId/steps/:stepId', element: <LearningShell /> }
{ path: 'learn/:courseId/lessons/:lessonId/activities/:activityId', element: <LearningShell /> }
```

Mas a spec descreve `LearningShell` como o componente que gerencia o outline, header e action bar. Se `CourseOverview` é um componente diferente, ele não tem acesso ao outline. O aluno precisaria navegar do overview para uma aula para ver o outline pela primeira vez.

**Como quebra em produção**: Overview do curso fica sem outline, ou é necessário duplicar lógica do outline no overview.

**Correção**: Definir que `LearningShell` é o layout para TODAS as rotas `/learn/:courseId/**`:

```tsx
{
  path: 'learn/:courseId',
  element: <LearningShell />,
  children: [
    { index: true, element: <CourseOverview /> },
    { path: 'lessons/:lessonId', element: <LessonView /> },
    { path: 'lessons/:lessonId/steps/:stepId', element: <StepView /> },
    { path: 'lessons/:lessonId/activities/:activityId', element: <ActivityFlow /> },
    { path: 'complete', element: <CourseCompletionCard /> },
  ]
}
```

Isso faz do `LearningShell` um layout route (React Router outlet) e garante que outline e header estão sempre presentes.

---

## CRIT-05: Sim Trading Challenge fullscreen requer coordenação com AppLayout que não está especificada

**O que a spec diz**: "shell entra em fullscreen mode (esconde outline e header)".

**O problema real**: `SimTradingTerminal` é um componente de 27 arquivos que assume controle total do viewport. Hoje ele funciona porque `isTerminal` no AppLayout remove padding e overflow. No novo shell, o terminal seria renderizado dentro de `LearningContent`, que está dentro de `LearningShell`, que está dentro de `AppLayout`.

Para o terminal funcionar corretamente, precisaria:
1. Remover o header do LearningShell
2. Remover o outline
3. Remover a action bar
4. Remover o padding do AppLayout
5. Dar ao terminal `height: 100%` do viewport

Nada disso está especificado mecanicamente. "Fullscreen mode" é mencionado como conceito mas não há contrato de como o shell entra/sai desse modo.

**Como quebra em produção**: Sim Trading Challenge renderiza dentro de um container com header, outline e action bar visíveis, cortando o gráfico de candles e os controles de trading. O aluno não consegue operar o terminal.

**Correção**: Definir explicitamente:

```typescript
type ShellMode = 'default' | 'fullscreen';

// LearningShell recebe mode via context ou URL detection
// fullscreen: esconde header, outline, action bar
// content area ocupa 100vh - 0

// Gatilho para fullscreen:
// - URL contém /activities/{id} e activity.type === 'SIM_TRADING_CHALLENGE'
// - OU context.setShellMode('fullscreen') chamado pelo ActivityFlow
```

E garantir que o `isTerminal` do AppLayout também cubra rotas `/learn/**/activities/**` quando a atividade for SIM_TRADING_CHALLENGE.

---

## CRIT-06: Race condition entre markViewed e navegação de step

**O que a spec diz** (Fluxo 2, passo 8): "Em paralelo: markViewed é chamado para step[0] (fire-and-forget com optimistic)".

**O problema real**: markViewed é chamado como side effect quando o step muda. Se o aluno navega rapidamente (step 0 → step 1 → step 2), três chamadas markViewed são disparadas em paralelo. Se o backend processar fora de ordem (step 2 antes do step 0), ou se alguma falhar, o estado de "viewed" fica inconsistente.

Pior: a spec propõe optimistic update, que significa atualizar o cache local antes da confirmação do servidor. Se a chamada falhar, o rollback do optimistic update pode conflitar com a invalidação da query causada por outra chamada markViewed que teve sucesso.

**Como quebra em produção**: Steps ficam marcados como viewed no frontend mas não no backend. Ao recarregar, o aluno volta para um step que o sistema acha que ele não viu. Ou: marcação duplicada causa erro no backend.

**Correção**: markViewed deve ser:

1. **Sequencial, não paralela**: Ao navegar do step N para N+1, markViewed(N) é disparado. Se o aluno navega para N+2 antes de N+1 retornar, N+1 e N+2 são enfileirados, não paralelizados.
2. **Idempotente**: O backend deve aceitar múltiplas chamadas markViewed para o mesmo step sem erro.
3. **Sem optimistic update**: markViewed é info de progresso, não bloqueia navegação. Atualizar o cache local após confirmação do servidor é suficiente. A latência de uma chamada markViewed não justifica o risco de inconsistency do optimistic.

```typescript
// Usar TanStack Query mutation com queue
const viewedQueue = useRef<string[]>([]);
const isFlushing = useRef(false);

async function flushViewedQueue() {
  if (isFlushing.current || viewedQueue.current.length === 0) return;
  isFlushing.current = true;
  const stepId = viewedQueue.current.shift()!;
  try {
    await stepsEndpoints.markViewed(slug, lessonId, stepId);
  } finally {
    isFlushing.current = false;
    flushViewedQueue(); // processa próximo
  }
}
```

---

## CRIT-07: activityStepIndex necessário para "Voltar à aula" mas não está na URL nem na API

**O que a spec diz** (Seção 4, tabela de navegação): "Dentro de uma atividade → Voltar à aula → `/learn/:courseId/lessons/:lessonId/steps/{activityStepIndex}`"

**O problema real**: Quando o aluno entra em uma atividade (via `context.startActivity(activityId)`), a URL muda para `/activities/{activityId}`. Para voltar à aula após a atividade, o sistema precisa saber qual era o step que continha a atividade. 

Hoje, o step tipo `ACTIVITY` tem um `activityId` associado. Mas o `LessonStepDTO` na timeline não necessariamente inclui o `activityId` como campo pesquisável. E a URL da atividade não preserva o stepIndex de origem.

Se a timeline tem 7 steps e o step 3 é uma atividade, ao entrar na atividade e depois clicar "Voltar à aula", o sistema precisa saber que volta para o step 4 (próximo após o step da atividade). Mas esse stepIndex está implícito.

**Como quebra em produção**: "Voltar à aula" após atividade sempre volta para step 0 ou para o step errado.

**Correção**: Duas opções:

```
OPÇÃO A: Preservar stepIndex de origem na URL da atividade
  /learn/:courseId/lessons/:lessonId/steps/:stepId/activities/:activityId
  → Ao sair, navegar para /steps/{nextStepId}

OPÇÃO B: Buscar o stepIndex da atividade na timeline
  Quando activityId está na URL, iterar timeline.steps 
  para encontrar o step que referencia aquela atividade
  e calcular o próximo step.
```

A Opção A é mais robusta porque é stateless. A spec deve adotá-la e ajustar a estrutura de rotas:

```
/learn/:courseId/lessons/:lessonId/activities/:activityId
→ muda para
/learn/:courseId/lessons/:lessonId/steps/:stepId/activities/:activityId
```

Isso mantém o stepId na URL durante a atividade, permitindo retorno determinístico.

---

## CRIT-08: Redirect de `/lessons/:lessonId` para `/learn/:courseId/lessons/:lessonId` requer courseId que não está na URL

**O que a spec diz** (backward compat): `/t/:tenantSlug/app/lessons/:lessonId` → redirect para `/app/learn/:courseId/lessons/:lessonId` (courseId resolvido via API).

**O problema real**: Para resolver o courseId a partir do lessonId, é necessária uma chamada API. `LessonTimelineDTO.lesson` tem `moduleId` mas **não tem courseId**. Não existe endpoint direto `GET /lessons/:lessonId` que retorne o courseId.

Endpoints disponíveis:
- `getTimeline(slug, lessonId)` → retorna `LessonTimelineDTO` com `lesson.moduleId`
- `getCourseInteractive(slug, courseId)` → requer courseId conhecido

Para resolver courseId a partir de lessonId, seria necessário:
1. Chamar `getTimeline` para obter `moduleId`
2. Depois chamar algum endpoint para obter o courseId a partir do moduleId
3. Ou o backend precisaria expor `courseId` no `LessonTimelineDTO`

**Como quebra em produção**: Redirect falha com loading infinito ou erro 404. O aluno com bookmark antigo para `/lessons/:lessonId` não consegue acessar a aula.

**Correção**: Tratar como decisão de backend necessária:

```
REQUISITO: Adicionar campo courseId ao LessonTimelineDTO.lesson
  OU criar endpoint GET /lessons/:lessonId/course que retorna courseId
  
ENQUANTO ISSO: Redirect para /app/dashboard com toast "Use o menu para navegar"
em vez de tentar resolver o courseId via múltiplas chamadas.
```

---

# 2. Riscos de Produção

## RISK-01: N+1 queries de lock status no outline persiste na nova spec

A spec menciona "batch request" como mitigação, mas não exige que o backend crie esse endpoint. Se o backend não entregar o batch, o outline fará N chamadas `isLessonUnlocked` para N aulas. Com um curso de 20 aulas, são 20 requests paralelos ao entrar no curso.

**Cenário de falha**: Curso com 30 aulas. Aluno em conexão 3G. 30 requests HTTP disparados simultaneamente. Browser limita a 6 conexões paralelas. Primeiras 6 retornam em ~1s. Restantes enfileiram. Outline demora 5-10s para mostrar status de bloqueio de todas as aulas.

**Ação**: A spec deve incluir `isUnlocked` como campo do `CourseInteractiveLesson` retornado por `getCourseInteractive`, eliminando N+1. Se isso requer mudança no backend, deve ser listado como dependência da Fase 2.

## RISK-02: LearningContext causa re-render em cascata

O `LearningContext` proposto contém `course: CourseInteractiveDTO`, que é o DTO inteiro do curso com módulos, aulas, progresso e next. Qualquer mudança nesse objeto (invalidação de query, refetch em background) causa re-render de **todos os consumidores do context**.

Consumidores incluem: `LearningHeader`, `LearningOutline`, `LearningContent`, `LearningActionBar`, e todos os filhos. No desktop, isso pode ser 20+ componentes renderizando simultaneamente.

**Cenário de falha**: markViewed invalida a query `timeline`. Isso não deveria afetar o outline, mas se o context re-renderiza, o outline re-renderiza também, mesmo que os dados do outline não tenham mudado.

**Ação**: Separar o context em pelo menos duas fatias:

```typescript
// Dados do curso (muda raramente) - consumido pelo Outline e Header
LearningCourseContext = { course, modules, progress }

// Estado de navegação (muda a cada step) - consumido pelo Content e ActionBar
LearningNavContext = { 
  activeLessonId, activeStepId, activeActivityId,
  selectLesson, selectStep, startActivity, exitActivity 
}
```

Alternativamente, usar `useMemo` rigorosamente nos valores do context e garantir que objetos não são recriados a cada render.

## RISK-03: Múltiplas activities por step não tratadas

O `LessonStepDTO` tem `type: StepType` que pode ser `ACTIVITY`. Mas a spec assume que cada step de atividade tem exatamente UMA atividade. O `Activity` retornado por `getActivity` tem `questions[]`, não `activities[]`.

O que acontece se o admin criar dois steps tipo ACTIVITY na mesma aula, cada um apontando para uma atividade diferente? A spec não define como o step sabe qual atividade renderizar. O `LessonStepDTO` atual tem `content: string | null`, `videoUrl: string | null` etc., mas não tem `activityId: string`.

Olhando o StepPlayer atual, o step tipo ACTIVITY renderiza um link genérico para `/lessons/{lessonId}/activities/{activityId}`. Mas o `activityId` não vem do step — vem de onde?

**Cenário de falha**: Step tipo ACTIVITY sem activityId associado. Botão "Iniciar Atividade" aparece mas não tem para onde navegar.

**Ação**: Verificar se o backend garante que cada step ACTIVITY tem um activityId associado (via campo no LessonStepDTO ou via metadata). Se não tiver, a spec deve definir como resolver esse mapeamento. Provável que o campo exista mas não está tipado no frontend.

## RISK-04: Mobile keyboard abre sobre a action bar fixa

A spec propõe action bar fixa no bottom (`h-16`). Em mobile, quando o aluno responde uma questão TEXT_INPUT, o teclado virtual do dispositivo sobe e cobre a action bar. O aluno não consegue clicar "Próximo" sem fechar o teclado.

**Cenário de falha**: Aluno em Android responde questão de texto. Teclado sobre. Não vê o botão "Próximo". Fecha teclado. Vê o botão. Mas ao digitar novamente, problema se repete.

**Ação**: A spec deve definir comportamento da action bar com teclado visível:

```
- Detectar visual viewport resize (window.visualViewport)
- Quando teclado visível: action bar posiciona acima do teclado
  (position: sticky dentro de um container que respeita o visual viewport)
- Em TEXT_INPUT: botão "Próximo" aparece INLINE abaixo do textarea
  como alternativa à action bar
```

## RISK-05: dangerouslySetInnerHTML sem sanitização

A spec menciona "manter, mas sanitizar no backend" para conteúdo HTML dos steps. Hoje o `StepPlayer` usa `dangerouslySetInnerHTML` com `resolveStorageUrl()`. Se o admin inserir HTML malicioso (intencionalmente ou via CMS), esse HTML é renderizado como-is no browser do aluno.

**Cenário de falha**: XSS via conteúdo de step. Em ambiente multi-tenant, um admin malicioso de um tenant pode injetar scripts que roubam dados de alunos.

**Ação**: Sanitização DEVE ocorrer no frontend com DOMPurify (ou equivalente) antes do `dangerouslySetInnerHTML`. Não confiar apenas no backend. Adicionar `dompurify` como dependência obrigatória na Fase 3.

---

# 3. Melhorias Estruturais Obrigatórias

## OBR-01: Criar camada de hooks customizados antes dos componentes

A spec menciona que páginas importam endpoints diretamente (P23), mas a nova arquitetura de componentes não propõe uma camada de abstração. Os hooks devem ser criados **antes** dos componentes e usados por eles.

**Hooks obrigatórios**:

```typescript
useCourseInteractive(slug, courseId) 
  → { course, modules, progress, next, isLoading, error }

useLessonTimeline(slug, lessonId)
  → { lesson, steps, progress, activeStep, setActiveStep, markViewed, isLoading }

useActivity(slug, lessonId, activityId)
  → { activity, isLoading }

useActivitySubmission(slug, activityId)
  → { submit, result, review, isSubmitting }

useLessonUnlock(slug, lessonId)
  → { unlocked, reason, detail, isLoading }
```

**Por que antes dos componentes**: Os componentes dependem desses hooks. Se os hooks não estiverem prontos, os componentes vão importar endpoints diretamente e recriar o problema P23.

## OBR-02: Definir contrato de invalidação de cache como função centralizada

A spec lista "quando invalidar" na tabela de queries mas não define quem invalida. Componentes individuais não devem saber quais queries invalidar.

Criar:

```typescript
function invalidateAfterStepView(qc, slug, lessonId)
function invalidateAfterActivitySubmit(qc, slug, lessonId, activityId)
function invalidateAfterLessonComplete(qc, slug, courseId)
```

Cada função invalida todas as queries relevantes em cascata. Centralizado, testável, sem risco de esquecer uma.

## OBR-03: Definir estratégia de loading coordenado

A spec menciona skeleton screens mas não define o que acontece quando queries carregam em tempos diferentes:

- `course-interactive` carrega em 200ms
- `timeline` carrega em 800ms  
- `lesson-unlock` carrega em 300ms

O que o aluno vê nos primeiros 200ms? E entre 200-300ms? E entre 300-800ms?

**Contrato obrigatório**:

```
1. course-interactive é bloqueante: skeleton completo até carregar
2. timeline é bloqueante: skeleton no content area até carregar
3. lesson-unlock é non-bloqueante: mostra conteúdo, se bloqueado mostra overlay
4. activity é bloqueante: skeleton no content area até carregar
```

## OBR-04: Definir timeout máximo para queries

Nenhum query deve ficar em loading infinito. Se `timeline` demora mais de 10s, mostrar error state. A spec menciona "máximo 3 retries" mas não define timeout por query.

Adicionar:

```typescript
const QUERY_TIMEOUT = 15_000; // 15 segundos
const QUERY_RETRY = 2;

// Em cada query:
{ retry: QUERY_RETRY, ... }
```

---

# 4. Melhorias Recomendadas

## REC-01: Adicionar track de analytics desde a Fase 1

A spec define métricas de sucesso na Seção 12 mas não define quando/eventos de analytics disparar. Sem instrumentação desde o início, não é possível medir o progresso do rollout.

**Eventos mínimos**:

```
learning_session_start { courseId, lessonId, stepId, source: 'dashboard' | 'direct' | 'deep_link' }
learning_step_view { courseId, lessonId, stepId, stepIndex, stepType }
learning_step_complete { courseId, lessonId, stepId, timeSpentMs }
learning_activity_start { courseId, lessonId, activityId, activityType }
learning_activity_submit { courseId, lessonId, activityId, score, passed }
learning_lesson_complete { courseId, lessonId, totalTimeMs, activitiesCompleted }
learning_session_end { courseId, lastStepId, sessionDurationMs }
```

## REC-02: Definir comportamento de prefetch

Para eliminar latência entre steps, a spec pode definir prefetch:

- Ao carregar a timeline, prefetch dados da próxima aula
- Ao entrar na penúltima questão de uma atividade, prefetch resultado template
- Ao completar a penúltima aula de um módulo, prefetch dados da próxima aula

Isso é uma otimização, não um requisito, mas faz diferença na percepção de fluidez.

## REC-03: Definir estratégia de error boundary

A spec menciona `ChunkErrorBoundary` existente, mas não define error boundary específico para o learning flow. Se o `QuestionRenderer` crashar (por exemplo, ChartMarkupRenderer com dados inesperados), todo o shell crasha.

**Recomendação**: Error boundary envolvendo `LearningContent`:

```typescript
<LearningContent>
  <ErrorBoundary fallback={<ContentErrorCard onRetry={...} />}>
    <LearningRouter>
      ...
    </LearningRouter>
  </ErrorBoundary>
</LearningContent>
```

## REC-04: Considerar scroll restoration entre steps

Quando o aluno navega entre steps, o scroll position do content area deve resetar para o topo. Hoje, se o step anterior era longo e o aluno estava scrolled para baixo, ao navegar para o próximo step, o scroll position pode ser mantido.

**Ação**: `useEffect(() => { contentRef.current?.scrollTo(0, 0) }, [activeStepId])`

---

# 5. Versão Reforçada das Partes Críticas

## 5.1 Rotas Corrigidas

```
/t/:tenantSlug/app/learn/:courseId
  → CourseOverview (dentro de LearningShell)

/t/:tenantSlug/app/learn/:courseId/lessons/:lessonId
  → Primeiro step não completado (redirect para URL com stepId)

/t/:tenantSlug/app/learn/:courseId/lessons/:lessonId/steps/:stepId
  → Step específico (stepId = UUID, não índice)

/t/:tenantSlug/app/learn/:courseId/lessons/:lessonId/steps/:stepId/activities/:activityId
  → Atividade inline (stepId preservado para retorno)

/t/:tenantSlug/app/learn/:courseId/complete
  → Conclusão do curso

Redirects (backward compat):
/t/:tenantSlug/app/courses/:courseId/interactive
  → /t/:tenantSlug/app/learn/:courseId

/t/:tenantSlug/app/lessons/:lessonId
  → Requires courseId from API. Se falhar, redirect para dashboard com toast.

/t/:tenantSlug/app/lessons/:lessonId/activities/:activityId
  → Requires courseId from API. Se falhar, redirect para dashboard com toast.

/t/:tenantSlug/app/activity/:activityId
  → Mesmo tratamento acima.
```

## 5.2 Estrutura de Rotas no Router

```tsx
// Rotas /learn/*: FORA do children do AppLayout? Não.
// Solução: AppLayout com modo adaptativo.

{
  path: 'app',
  element: <AppLayout />,
  children: [
    // ... rotas existentes do dashboard, settings, etc.
    {
      path: 'learn/:courseId',
      element: <LearningShell />,
      children: [
        { index: true, element: <CourseOverview /> },
        { path: 'lessons/:lessonId', element: <LessonRedirect /> },
        { path: 'lessons/:lessonId/steps/:stepId', element: <StepView /> },
        { path: 'lessons/:lessonId/steps/:stepId/activities/:activityId', 
          element: <ActivityFlow /> },
        { path: 'complete', element: <CourseCompletionCard /> },
      ]
    }
  ]
}
```

`LessonRedirect`: componente que carrega a timeline e redireciona para o primeiro step não completado (ou para o stepId do `courseInteractive.next`).

`AppLayout` adaptativo:

```typescript
const isLearning = location.pathname.includes('/learn/');
// isTerminal expande para incluir /learn/
const isTerminal = isLearning || /* lógica atual */;
```

`LearningShell` detecta `isLearning` no AppLayout e assume que o AppLayout já removeu padding/scroll. LearningShell gerencia seu próprio header/outline/content/actionbar dentro do espaço cedido pelo AppLayout.

## 5.3 LearningContext Reforçado

```typescript
// Context separado em fatias para evitar re-render cascata

interface LearningNavContextValue {
  activeLessonId: string | null;
  activeStepId: string | null;
  activeActivityId: string | null;
  selectLesson: (lessonId: string) => void;
  selectStep: (stepId: string) => void;
  startActivity: (activityId: string) => void;
  exitActivity: () => void;
  shellMode: 'default' | 'fullscreen';
  setShellMode: (mode: 'default' | 'fullscreen') => void;
  outlineOpen: boolean;
  setOutlineOpen: (open: boolean) => void;
}

interface LearningDataContextValue {
  course: CourseInteractiveDTO;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Uso:
const { selectStep, activeStepId } = useContext(LearningNavContext);
const { course, isLoading } = useContext(LearningDataContext);
```

## 5.4 Fluxo de Navegação "Voltar" Reforçado

```typescript
type BackTarget = {
  label: string;
  path: string;
};

function getBackTarget(
  pathname: string,
  params: { courseId: string; lessonId?: string; stepId?: string; activityId?: string }
): BackTarget {
  // Curso completo
  if (pathname.endsWith('/complete')) {
    return { label: 'Voltar ao Dashboard', path: `/t/${slug}/app/dashboard` };
  }
  
  // Visão geral do curso
  if (!params.lessonId) {
    return { label: 'Voltar ao Dashboard', path: `/t/${slug}/app/dashboard` };
  }
  
  // Dentro de atividade
  if (params.activityId && params.stepId) {
    // Voltar para o step que contém a atividade
    return { 
      label: 'Voltar à aula', 
      path: `/t/${slug}/app/learn/${params.courseId}/lessons/${params.lessonId}/steps/${params.stepId}` 
    };
  }
  
  // Dentro de uma aula (step)
  if (params.stepId) {
    return { 
      label: 'Voltar ao curso', 
      path: `/t/${slug}/app/learn/${params.courseId}` 
    };
  }
  
  // Dentro de uma aula sem step (redirect happening)
  return { 
    label: 'Voltar ao curso', 
    path: `/t/${slug}/app/learn/${params.courseId}` 
  };
}
```

## 5.5 Fluxo de markViewed Reforçado

```typescript
// Queue serial, não paralelo, sem optimistic

function useStepViewTracker(
  slug: string, 
  lessonId: string, 
  steps: LessonStepDTO[]
) {
  const qc = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);

  const markViewed = useCallback(async (stepId: string) => {
    if (pendingRef.current.has(stepId)) return;
    pendingRef.current.add(stepId);
    
    if (processingRef.current) return; // será processado pelo loop
    
    processingRef.current = true;
    while (pendingRef.current.size > 0) {
      const nextId = pendingRef.current.values().next().value!;
      pendingRef.current.delete(nextId);
      try {
        await stepsEndpoints.markViewed(slug, lessonId, nextId);
      } catch {
        // Falha silenciosa: próximo refetch atualizará estado
        break;
      }
    }
    processingRef.current = false;
    
    // Invalidar cache após processar fila
    qc.invalidateQueries({ queryKey: ['timeline', slug, lessonId] });
  }, [slug, lessonId, qc]);

  return { markViewed };
}
```

## 5.6 Checklist de Dependências de Backend

A spec assume que endpoints existentes bastam, mas várias funcionalidades propostas exigem mudanças no backend:

| Requisito | Endpoint afetado | Mudança necessária |
|-----------|-----------------|-------------------|
| Eliminar N+1 de lock status | `GET /courses/:id/interactive` | Adicionar `isUnlocked` e `lockReason` em cada `CourseInteractiveLesson` |
| Redirect de `/lessons/:lessonId` | `GET /lessons/:lessonId/timeline` | Adicionar `courseId` em `LessonTimelineDTO.lesson` |
| Batch lock status (alternativa) | Novo endpoint `GET /progress/lessons/unlock-status?courseId=` | Criar endpoint |
| stepId como UUID na URL | Nenhuma mudança | Frontend resolve stepId→index via timeline |
| `courseInteractive.next` confiável | `GET /courses/:id/interactive` | Garantir que `next` é sempre preciso após qualquer mudança de progresso |

**Se nenhuma dessas mudanças for possível no backend**, a spec deve definir workarounds explícitos (fallbacks, dados derivados no frontend com invalidação frequente, ou experiências degradadas documentadas).

---

# RESUMO EXECUTIVO

A spec identifica corretamente os problemas estruturais e propõe uma direção arquitetural sólida. No entanto, **8 problemas críticos** precisam ser resolvidos antes da implementação:

1. **CRIT-01** (Blocker): Conflito AppLayout vs LearningShell sem resolução definida
2. **CRIT-02** (Blocker): stepIndex numérico na URL é frágil; deve ser UUID
3. **CRIT-03**: Contrato do DashboardContinueDTO não corresponde ao que a spec assume
4. **CRIT-04**: Estrutura de rotas React Router v6 precisa ser explícita com layout routes
5. **CRIT-05**: Sim Trading fullscreen sem mecanismo definido
6. **CRIT-06**: Race condition em markViewed
7. **CRIT-07**: activityStepIndex perdido ao navegar para atividade
8. **CRIT-08**: Redirect de rotas antigas requer dados que não existem na API

**4 melhorias estruturais** são obrigatórias (camada de hooks, invalidação centralizada, loading coordenado, timeouts) e **4 riscos de produção** adicionais precisam de atenção (N+1 queries, context re-render, mobile keyboard, XSS).

A spec precisa de uma revisão focada nestes 8 pontos críticos antes de ser considerada implementável.
