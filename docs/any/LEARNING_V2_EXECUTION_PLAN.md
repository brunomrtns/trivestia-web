# LEARNING V2 — PACOTE DE EXECUÇÃO

> Decisões fechadas, contratos definidos, ordem exata de implementação.
> Pronto para codar. Zero ambiguidade.

---

# 1. Decisões Finais

**Layout**: AppLayout detecta rotas `/learn/` e entra em modo learning: esconde Sidebar, esconde Topbar, remove padding, remove scroll próprio. LearningShell preenche o espaço liberado. ChatFloating permanece.

**Rotas**: Nested routes com `<Outlet />`. LearningShell é layout route. stepId na URL é UUID, nunca índice numérico.

**Atividades**: Inline no shell. URL preserva stepId de origem: `/steps/:stepId/activities/:activityId`. Retorno determinístico via URL.

**Estado**: URL = fonte de verdade para posição. Dois contexts separados (data + nav). markViewed em fila serial, sem optimistic update.

**Feature flag**: Booleano no authStore. `?learning_v2=true` na URL ativa para teste. Default `false`. ContinueCard, CourseDetailPage e qualquer link para learning verificam a flag.

**Compatibilidade**: Rotas antigas mantidas. Redirect só se dados suficientes. Fallback para dashboard com toast quando não resolver.

**Fullstack**: Nenhuma mudança de backend é bloqueadora. Todas têm fallback. Mudanças de backend otimizam a experiência mas não impedem launch.

---

# 2. Rotas Finais

## Rotas novas (sob AppLayout, em `tenantAppRoutes`)

```
path: 'learn/:courseId'
  element: <LearningShell />
  children:
    index: true              → <CourseOverview />
    'lessons/:lessonId'      → <LessonRedirect />
    'lessons/:lessonId/steps/:stepId'            → <StepView />
    'lessons/:lessonId/steps/:stepId/activities/:activityId' → <ActivityFlow />
    'complete'               → <CourseCompletionCard />
```

## Rotas existentes (mantidas inalteradas)

```
dashboard                  → DashboardPage (inalterado)
courses                    → CoursesPage (inalterado)
courses/:courseId          → CourseDetailPage (inalterado)
courses/:courseId/interactive → CourseInteractivePage (inalterado)
lessons/:lessonId          → LessonPage (inalterado)
lessons/:lessonId/activities/:activityId → ActivityPlayerPage (inalterado)
activity/:activityId       → ActivityPlayerPage (inalterado)
lab                        → PracticeLabPage (inalterado)
lab/history                → PracticeHistoryPage (inalterado)
progress, announcements, settings, training (inalterados)
```

## Navegação condicional (feature flag)

ContinueCard e CourseDetailPage verificam `useLearningV2()`:
- `true` → link aponta para `/t/:slug/app/learn/:courseId`
- `false` → link aponta para `/t/:slug/app/courses/:courseId/interactive` (atual)

Rotas antigas NÃO recebem redirect. Coexistem permanentemente até remoção.

---

# 3. Contratos de Dados e Dependências de Backend

## Campos que já existem e serão usados diretamente

| Campo | Origem | Observação |
|-------|--------|------------|
| `CourseInteractiveDTO.course` | `getCourseInteractive` | `{ id, title, description }` |
| `CourseInteractiveDTO.modules[].lessons[]` | `getCourseInteractive` | Cada lesson tem `{ id, title, order, progress }` |
| `CourseInteractiveDTO.next` | `getCourseInteractive` | `{ moduleId, lessonId, stepId?, activityId?, kind }` — pode ser `null` |
| `CourseInteractiveDTO.progress` | `getCourseInteractive` | `{ percent, completedLessons, totalLessons }` |
| `LessonTimelineDTO.steps[]` | `getTimeline` | Cada step tem `{ id, type, title, content, order, isViewed, isVirtual }` |
| `LessonStepDTO.content` | step da timeline | `Record<string, unknown>`. Para ACTIVITY: `content.activityId` |
| `LessonTimelineDTO.lesson.moduleId` | `getTimeline` | Presente. `courseId` AUSENTE. |
| `DashboardContinueDTO.course?.id` | `getContinue` | Nullable. `next.stepId` é `string | null`, `next.activityId` é `string | null` |
| `LessonUnlockDTO` | `isLessonUnlocked` | `{ unlocked, reason, detail }` |

## Inconsistências resolvidas

**stepId optionality**: `CourseInteractiveNext.stepId` é `string | undefined` (opcional). `DashboardContinueNext.stepId` é `string | null` (nullable). Código trata ambos: `stepId ?? undefined ?? fallback`.

**Continue URL building**: `DashboardContinueDTO` não tem `courseId` direto. Acessar via `data.course?.id`. Guard: se `!data.course?.id || !data.lesson?.id`, não construir URL. Fallback: dashboard.

**Timeline duplicada**: `learning.endpoints.ts` e `steps.endpoints.ts` ambos têm `getTimeline`. Novos hooks usarão `steps.endpoints.getTimeline` (já é o usado em `CourseInlineLessonPlayer` e `LessonPage`).

## Dependências de backend (nenhuma bloqueadora)

| Desejável | Impacto | Fallback |
|-----------|---------|----------|
| `isUnlocked` + `lockReason` em cada `CourseInteractiveLesson` | Elimina N+1 queries de lock | Manter N+1 com `useQueries` e `staleTime: 5min` |
| `courseId` em `LessonTimelineDTO.lesson` | Permite redirect `/lessons/:id` → `/learn/:courseId/...` | Redirect para dashboard com toast |
| `stepId` em `DashboardContinueNext` para kind=ACTIVITY | Permite deep link direto em atividade via dashboard | Navegar até aula, LessonRedirect posiciona |

---

# 4. Fases de Implementação

## Fase 1 — Infraestrutura

**Objetivo**: AppLayout adaptativo + rotas registradas + hooks + contexts. Zero mudança visível para usuários.

**Arquivos afetados**:
- `src/layouts/AppLayout/AppLayout.tsx` (modificado: isLearning detection)
- `src/routes/index.tsx` (modificado: novas rotas learn/)
- `src/features/learning/learning.hooks.ts` (novo)
- `src/features/learning/learning.context.tsx` (novo)
- `src/features/learning/learning.utils.ts` (novo)
- `src/features/auth/auth.store.ts` (modificado: flag useLearningV2)

**Dependências**: Nenhuma externa.

**Critério de pronto**:
- Navegar para `/t/:slug/app/learn/:courseId` mostra AppLayout sem sidebar/topbar
- Feature flag `?learning_v2=true` funcional
- Todos os hooks retornam dados corretos (verificar via React Query DevTools)
- Rotas antigas funcionam 100% inalteradas

**Riscos**: AppLayout isLearning detection por pathname pode ter edge cases. Mitigação: detecção usa regex `/\/app\/learn\//` no pathname.

## Fase 2 — Shell + Outline

**Objetivo**: LearningShell renderiza header, outline e action bar. Navegação entre aulas funcional.

**Arquivos afetados**:
- `src/components/learning/LearningShell.tsx` (novo)
- `src/components/learning/LearningHeader.tsx` (novo)
- `src/components/learning/LearningOutline.tsx` (novo, refatora CourseOutlineSidebar)
- `src/components/learning/LearningActionBar.tsx` (novo)

**Dependências**: Fase 1.

**Critério de pronto**:
- `/t/:slug/app/learn/:courseId` mostra shell com header + outline
- Clicar em aula no outline navega para URL correta
- Breadcrumb dinâmico no header
- Action bar renderiza (vazia inicialmente)
- Mobile: outline como drawer

**Riscos**: Performance do outline com N+1 lock queries. Mitigação: `useQueries` com `staleTime: 5min`.

## Fase 3 — Step Consumption

**Objetivo**: Steps de aula (texto, vídeo, imagem) renderizam dentro do shell. markViewed funciona. Navegação prev/next via action bar.

**Arquivos afetados**:
- `src/components/learning/LessonRedirect.tsx` (novo)
- `src/components/learning/StepView.tsx` (novo, refatora StepPlayer)

**Dependências**: Fase 2.

**Critério de pronto**:
- Navegar para `/learn/:courseId/lessons/:lessonId` redireciona para step correto
- Steps de texto, vídeo e imagem renderizam
- Action bar mostra Anterior/Próximo com step indicator
- markViewed dispara em fila serial
- Refresh preserva posição via URL
- Step ACTIVITY mostra card "Iniciar Atividade"

**Riscos**: Conteúdo HTML de steps (dangerouslySetInnerHTML). Mitigação: adicionar DOMPurify.

## Fase 4 — Activity Flow

**Objetivo**: Atividades funcionam inline no shell. Submissão, resultado, Sim Trading.

**Arquivos afetados**:
- `src/components/learning/ActivityFlow.tsx` (novo)
- `src/components/learning/ActivityResult.tsx` (novo, refatora resultado de ActivityPlayerPage)

**Dependências**: Fase 3.

**Critério de pronto**:
- Clicar "Iniciar Atividade" abre atividade no shell (URL muda)
- Questões renderizam via QuestionRenderer (reutilizado)
- Navegação entre questões funciona
- Submissão funciona com resultado inline
- Review funciona com todas as políticas (IMMEDIATE, AFTER_DATE, NEVER)
- Sim Trading Challenge funciona em fullscreen mode
- "Voltar à aula" retorna ao step correto

**Riscos**: Sim Trading fullscreen pode ter conflito de layout. Mitigação: shell mode `fullscreen` esconde header+outline+actionbar.

## Fase 5 — Completion + Overview + Integration

**Objetivo**: Tela de conclusão de aula/curso. CourseOverview funcional. Dashboard integrado.

**Arquivos afetados**:
- `src/components/learning/CompletionCards.tsx` (novo)
- `src/components/learning/CourseOverview.tsx` (novo)
- `src/components/dashboard/ContinueCard.tsx` (modificado: links para /learn/)

**Dependências**: Fase 4.

**Critério de pronto**:
- Completar último step mostra LessonCompletionCard
- "Próxima aula" navega corretamente (via `courseInteractive.next`)
- Completar curso mostra CourseCompletionCard
- CourseOverview mostra progresso e "Começar/Continuar"
- ContinueCard no Dashboard navega para /learn/ (com flag)
- CourseDetailPage "Iniciar curso" navega para /learn/ (com flag)

**Riscos**: `courseInteractive.next` pode estar null ou desatualizado. Mitigação: invalidar query após cada conclusão.

## Fase 6 — Polish + Rollout

**Objetivo**: Edge cases, mobile, acessibilidade, feature flag para todos.

**Arquivos afetados**: Todos os componentes learning. Nenhum arquivo novo principal.

**Dependências**: Fase 5.

**Critério de pronto**:
- Mobile: drawer com swipe, touch targets 44px, action bar respeita teclado
- Acessibilidade: keyboard nav, aria-live, focus management
- Error boundary no content area
- Scroll restoration ao trocar step
- Feature flag habilitada para 10% → 50% → 100%
- Lighthouse performance > 90

---

# 5. Ordem Exata de Execução

O próximo agente implementa na seguinte ordem. Cada item é atômico e testável.

### Infraestrutura (Fase 1)

1. **Adicionar flag no authStore**: campo `useLearningV2: boolean`, default `false`. Ler de `localStorage` key `trivestia_learning_v2`. Se URL tem `?learning_v2=true`, setar `true`.

2. **Adaptar AppLayout**: Expandir detecção `isTerminal` para incluir learning. Quando `isLearning`, além de `p-0 overflow-hidden`, também esconder `<Sidebar>` e `<Topbar>`. O `<div>` wrapper perde `ml-64`/`ml-16` (margin da sidebar). `<ChatFloating>` permanece.

   ```tsx
   const isLearning = location.pathname.includes('/app/learn/');
   // Sidebar: {isLearning && <Sidebar .../>}  → não renderiza
   // Topbar: {isLearning && <Topbar .../>}    → não renderiza
   // wrapper: sem ml-64/ml-16 quando isLearning
   // content: p-0 overflow-hidden quando isLearning || isTerminal
   ```

3. **Criar `learning.utils.ts`**:
   - `getBackTarget(pathname, params, slug)` → `{ label, path }`
   - `resolveStepId(steps, targetStepId?, next?)` → `string | null` (encontra step correto)
   - `invalidateLearningCache(qc, slug, courseId, lessonId?)` → invalida queries relevantes
   - `buildContinueUrl(data: DashboardContinueDTO, slug: string)` → `string | null`

4. **Criar `learning.hooks.ts`**:
   - `useCourseInteractive(slug, courseId)` → query wrapper
   - `useLessonTimeline(slug, lessonId)` → query wrapper
   - `useActivity(slug, lessonId, activityId)` → query wrapper
   - `useActivitySubmission(slug)` → mutation + review query wrapper
   - `useLessonUnlock(slug, lessonId)` → query wrapper (com fallback batch)
   - `useStepViewTracker()` → fila serial de markViewed
   - `useLearningV2Flag()` → lê flag do store

5. **Criar `learning.context.tsx`**:
   - `LearningDataProvider` → carrega courseInteractive, fornece via context
   - `LearningNavProvider` → fornece navigation functions + ActionBarConfig
   - `useLearningData()` → hook consumidor
   - `useLearningNav()` → hook consumidor

6. **Registrar rotas** em `routes/index.tsx`: Adicionar lazy imports e nested route em `tenantAppRoutes`:

   ```tsx
   {
     path: 'learn/:courseId',
     element: <LearningShell />,
     children: [
       { index: true, element: <CourseOverview /> },
       { path: 'lessons/:lessonId', element: <LessonRedirect /> },
       { path: 'lessons/:lessonId/steps/:stepId', element: <StepView /> },
       { path: 'lessons/:lessonId/steps/:stepId/activities/:activityId', element: <ActivityFlow /> },
       { path: 'complete', element: <CourseCompletionCard /> },
     ]
   }
   ```

### Shell + Outline (Fase 2)

7. **Criar `LearningShell.tsx`**: Layout route com `<Outlet />`. Renderiza `<LearningDataProvider>` → `<LearningNavProvider>` → header + (outline + content area) + action bar. Height: `h-full` (AppLayout já cedeu espaço). Loading: skeleton. Error: error card.

8. **Criar `LearningHeader.tsx`**: Breadcrumb dinâmico construído de `useParams()` + dados do curso. Botão "Voltar" usa `getBackTarget()`. Toggle outline (hamburger/drawer). Mini progress indicator.

9. **Criar `LearningOutline.tsx`**: Refatora `CourseOutlineSidebar`. Desktop: sidebar fixa `w-72`. Mobile: drawer com backdrop. Usa `useQueries` para lock status se backend não fornecer batch. Estado de expansão em localStorage. Aula ativa destacada.

10. **Criar `LearningActionBar.tsx`**: Lê `ActionBarConfig` do nav context. Renderiza prev/next buttons + indicator. When config é null, oculta. Fixo bottom, `h-16` desktop, `h-14` mobile.

### Step Consumption (Fase 3)

11. **Criar `LessonRedirect.tsx`**: Carrega timeline via hook. Encontra step alvo: `courseInteractive.next?.stepId` se for esta aula, senão primeiro step `!isViewed && !isVirtual`, senão `steps[0].id`. `<Navigate replace>` para URL com stepId. Loading: skeleton. Empty: empty state. Error: error card.

12. **Criar `StepView.tsx`**: Carrega timeline (ou usa cache). Resolve stepId da URL para step object. Renderiza conteúdo baseado em `step.type`: texto (reutiliza lógica de `TextContent` do StepPlayer), vídeo (reutiliza `VideoContent`), imagem (reutiliza `ImageContent`), atividade (card "Iniciar Atividade" com navegação para `/steps/:stepId/activities/:activityId`). Configura ActionBar via `setActionBar()`. Dispara markViewed via `useStepViewTracker()`.

### Activity Flow (Fase 4)

13. **Criar `ActivityFlow.tsx`**: Carrega atividade e submission-review. Estados: (a) sem submissão → question flow, (b) com submissão → resultado. Question flow: `currentIndex` local, `answers` local, navegação via action bar. Se `activity.type === 'SIM_TRADING_CHALLENGE'`: shell entra em mode fullscreen, renderiza `SimTradingTerminal` (reutilizado). Configura ActionBar dinamicamente. Ao completar, invalida cache e configura ActionBar com "Voltar à aula" / "Próximo step".

14. **Criar `ActivityResult.tsx`**: Refatora tela de resultado de `ActivityPlayerPage`. Score, pass/fail, review por política. Usa `QuestionRenderer` com feedback para tipos especiais. Retry reseta estado do `ActivityFlow`. "Voltar à aula" navega para próximo step.

### Completion + Integration (Fase 5)

15. **Criar `CompletionCards.tsx`**: `LessonCompletionCard` (score, "Próxima aula" via `courseInteractive.next`, "Rever") + `CourseCompletionCard` (estatísticas, "Dashboard"). Invalidam cache de course-interactive.

16. **Criar `CourseOverview.tsx`**: Header com progresso (reutiliza lógica de `CourseInteractiveHeader`). "Continuar" navega para lesson correta via `courseInteractive.next`. Lista de módulos com progresso (reutiliza cards de módulo).

17. **Modificar `ContinueCard.tsx`**: Se `useLearningV2Flag()` é true, construir URL via `buildContinueUrl()`. Se false, manter comportamento atual.

### Polish (Fase 6)

18. **Error boundary** em LearningShell envolvendo content area.

19. **Mobile refinements**: drawer swipe, visual viewport resize para action bar com teclado, touch targets.

20. **Scroll restoration**: `useEffect` no StepView que faz `scrollTo(0, 0)` no content area ao trocar step.

21. **DOMPurify** em conteúdo HTML de steps texto.

22. **Analytics events** nos pontos de transição (step view, activity start, submission, lesson complete).

---

# 6. Estrutura Alvo

```
src/
  features/
    learning/
      learning.hooks.ts         ← todos os hooks (useCourseInteractive, useLessonTimeline, etc.)
      learning.context.tsx      ← LearningDataProvider + LearningNavProvider + hooks consumidores
      learning.utils.ts         ← getBackTarget, resolveStepId, invalidateLearningCache, buildContinueUrl
    auth/
      auth.store.ts             ← modificado: campo useLearningV2

  components/
    learning/
      LearningShell.tsx         ← layout route (header + outline + outlet + actionbar)
      LearningHeader.tsx        ← breadcrumb + voltar + toggle outline
      LearningOutline.tsx       ← sidebar/drawer com módulos/aulas
      LearningActionBar.tsx     ← barra fixa inferior, configurável via context
      LessonRedirect.tsx        ← redirect para step correto
      StepView.tsx              ← viewer de step (texto, vídeo, imagem, card atividade)
      ActivityFlow.tsx          ← fluxo de atividade inline (questões + submissão)
      ActivityResult.tsx        ← resultado + review inline
      CompletionCards.tsx       ← LessonCompletionCard + CourseCompletionCard
      CourseOverview.tsx        ← visão geral do curso

      # Existentes (inalterados, reutilizados):
      QuestionRenderer.tsx
      MultipleChoiceRenderer.tsx
      MultipleSelectRenderer.tsx
      OrderingRenderer.tsx
      TextInputRenderer.tsx
      ChartMarkupRenderer.tsx
      RiskCalculatorRenderer.tsx
      LessonLockBadge.tsx

    dashboard/
      ContinueCard.tsx          ← modificado: links condicionais para /learn/

  layouts/
    AppLayout/
      AppLayout.tsx             ← modificado: isLearning detection

  routes/
    index.tsx                   ← modificado: rotas /learn/* adicionadas

  # Inalterados (podem ser removidos após 100% rollout):
  pages/student/CourseInteractivePage.tsx
  pages/student/LessonPage.tsx
  pages/student/ActivityPlayerPage.tsx
  components/learning/CourseInlineLessonPlayer.tsx
  components/learning/CourseInteractiveHeader.tsx
  components/learning/CourseOutlineSidebar.tsx
  components/learning/ActivityPlayerContent.tsx
  components/learning/LessonTimeline.tsx
  hooks/useNavigateToActivity.ts
```

---

# 7. Checklist de Execução

### Fase 1
- [ ] Adicionar `useLearningV2: boolean` em `auth.store.ts`, ler de localStorage, ativar via query param
- [ ] Modificar `AppLayout.tsx`: detectar `isLearning`, esconder Sidebar/Topbar, remover margin, `p-0 overflow-hidden`
- [ ] Criar `src/features/learning/learning.utils.ts` com `getBackTarget`, `resolveStepId`, `invalidateLearningCache`, `buildContinueUrl`
- [ ] Criar `src/features/learning/learning.hooks.ts` com `useCourseInteractive`, `useLessonTimeline`, `useActivity`, `useActivitySubmission`, `useLessonUnlock`, `useStepViewTracker`
- [ ] Criar `src/features/learning/learning.context.tsx` com `LearningDataProvider`, `LearningNavProvider`, `useLearningData`, `useLearningNav`
- [ ] Adicionar rotas `/learn/:courseId/*` em `routes/index.tsx` com lazy imports apontando para placeholder div
- [ ] Verificar: AppLayout sem sidebar/topbar em `/t/:slug/app/learn/:courseId`
- [ ] Verificar: rotas antigas funcionam inalteradas

### Fase 2
- [ ] Criar `LearningShell.tsx`: providers + header + outline + outlet + actionbar. Skeleton loading.
- [ ] Criar `LearningHeader.tsx`: breadcrumb dinâmico, botão voltar via `getBackTarget`, toggle outline
- [ ] Criar `LearningOutline.tsx`: sidebar desktop, drawer mobile, módulos expandíveis, aula ativa destacada, lock status via `useQueries`
- [ ] Criar `LearningActionBar.tsx`: lê config do context, renderiza prev/next/indicator. Oculto quando config=null.
- [ ] Registrar rotas apontando para componentes reais (shell envolvendo placeholders)
- [ ] Verificar: outline navega entre aulas, breadcrumb atualiza, drawer funciona em mobile

### Fase 3
- [ ] Criar `LessonRedirect.tsx`: carrega timeline, resolve stepId, Navigate
- [ ] Criar `StepView.tsx`: renderiza conteúdo por tipo, configura ActionBar, dispara markViewed
- [ ] Implementar fila serial de markViewed no `useStepViewTracker`
- [ ] Verificar: steps renderizam, navegação funciona, markViewed dispara, refresh preserva posição

### Fase 4
- [ ] Criar `ActivityFlow.tsx`: questões, submissão, resultado, Sim Trading fullscreen
- [ ] Criar `ActivityResult.tsx`: score, review por política, retry, navegação de volta
- [ ] Implementar shell fullscreen mode (esconde header+outline+actionbar) para SIM_TRADING_CHALLENGE
- [ ] Verificar: atividades funcionam inline, submissão funciona, Sim Trading funciona, "Voltar à aula" funciona

### Fase 5
- [ ] Criar `CompletionCards.tsx`: lesson completion + course completion
- [ ] Criar `CourseOverview.tsx`: progresso, continue, módulos
- [ ] Modificar `ContinueCard.tsx`: links condicionais para `/learn/`
- [ ] Verificar: conclusão de aula mostra card, "Próxima aula" funciona, dashboard continue funciona

### Fase 6
- [ ] Error boundary no content area
- [ ] DOMPurify em conteúdo HTML
- [ ] Scroll restoration ao trocar step
- [ ] Mobile: drawer swipe, visual viewport resize, touch targets
- [ ] Acessibilidade: skip link, aria-live, focus management
- [ ] Analytics events
- [ ] Feature flag: ativar para porcentagem crescente de usuários

---

# 8. Checklist de Validação Manual

### Fluxos principais
- [ ] Dashboard "Continuar" navega para `/learn/:courseId/lessons/:lessonId/steps/:stepId` e renderiza step correto
- [ ] CourseDetailPage "Iniciar curso" navega para `/learn/:courseId` e mostra overview com "Começar"
- [ ] Clicar em aula no outline navega para step correto (primeiro não viewed)
- [ ] Navegar entre steps via Anterior/Próximo funciona. URL atualiza a cada step.
- [ ] Completar último step mostra LessonCompletionCard. "Próxima aula" navega para a aula seguinte.
- [ ] Completar última aula do curso mostra CourseCompletionCard.

### Atividades
- [ ] Step ACTIVITY mostra card "Iniciar Atividade". URL muda para `/steps/:stepId/activities/:activityId`.
- [ ] Responder questões e submeter funciona. Resultado aparece inline.
- [ ] Review funciona: IMMEDIATE mostra revisão, AFTER_DATE mostra data, NEVER mostra bloqueio.
- [ ] "Voltar à aula" retorna ao step seguinte ao step da atividade.
- [ ] Retry funciona: reseta estado, permite responder novamente.
- [ ] Sim Trading Challenge: shell entra em fullscreen, terminal funciona, saída volta ao fluxo.

### Resiliência
- [ ] Refresh da página no meio de um step: volta ao mesmo step via URL.
- [ ] Refresh no meio de uma atividade: volta ao step da atividade (respostas perdidas, aceitável).
- [ ] Refresh na tela de resultado: submission-review query serve resultado persistido.
- [ ] Deep link direto em `/steps/:stepId`: carrega dados e posiciona corretamente.
- [ ] Deep link em aula bloqueada: mostra card de bloqueio com motivo e CTA.
- [ ] Falha de rede no carregamento: mostra error card com retry. Outline funcional se carregou.
- [ ] Submissão com erro de rede: toast, estado preservado, botão ativo.
- [ ] Submissão com 409 (já submetido): redireciona para revisão.
- [ ] Curso sem aulas: overview mostra estado vazio.
- [ ] Aula sem steps: empty state com "Voltar ao curso".
- [ ] Atividade sem questões: empty state com "Voltar à aula".

### Navegação e retorno
- [ ] Botão "Voltar" no header: visão geral → dashboard, aula → curso, atividade → aula, resultado → aula.
- [ ] Browser back/forward funciona corretamente entre steps.
- [ ] Nenhum `navigate(-1)` em nenhum lugar do código.

### Mobile
- [ ] Outline vira drawer. Abre com hamburger, fecha com X ou swipe.
- [ ] Action bar compacta. Touch targets ≥ 44px.
- [ ] Vídeo em aspect-ratio 16:9 sem overflow.
- [ ] Teclado virtual não cobre action bar permanentemente (botão inline em TEXT_INPUT).

### Compatibilidade
- [ ] Feature flag `false`: todas as rotas antigas funcionam inalteradas.
- [ ] Feature flag `true`: ContinueCard e CourseDetailPage linkam para `/learn/`.
- [ ] Rotas antigas (`/courses/:id/interactive`, `/lessons/:id`, etc.) continuam funcionando.
- [ ] Admin routes inalteradas.

### Performance
- [ ] Lighthouse performance > 90 em `/learn/:courseId/lessons/:lessonId/steps/:stepId`.
- [ ] Navegação entre steps < 200ms percebido.
- [ ] Outline renderiza sem travar com 30+ aulas.

---

# 9. Riscos Residuais

**N+1 lock queries**: Persiste até backend adicionar `isUnlocked` em `CourseInteractiveLesson`. Mitigação ativa: `useQueries` com `staleTime: 5min`. Impacto: primeiros 2-3 segundos de loading do outline em cursos grandes. Resolução: sprint de backend pós-launch.

**Deep link de atividade via Dashboard**: `DashboardContinueNext` não tem `stepId` para `kind=ACTIVITY`. Navigate para lesson, LessonRedirect posiciona no step correto. Aluno precisa clicar "Iniciar Atividade" manualmente. Impacto: 1 clique extra. Resolução: backend adiciona `stepId` no continue response.

**Redirect `/lessons/:lessonId` para `/learn/`**: Sem `courseId` na timeline, não é possível resolver. Fallback: redirect para dashboard com toast. Impacto: bookmarks antigos quebram. Resolução: backend adiciona `courseId` em `LessonTimelineDTO.lesson`, ou criar endpoint `GET /lessons/:lessonId/course`.

**LearningContext re-renders**: Dois contexts reduzirão mas não eliminarão re-renders. `courseInteractive` object muda a cada invalidação. Mitigação: `useMemo` rigoroso nos valores de context. Monitorar com React DevTools. Se problema, extrair campos específicos em contexts menores.

**Mobile keyboard vs action bar**: Solução atual (botão inline em TEXT_INPUT) é workaround. Solução definitiva: `visualViewport` API para reposicionar action bar. Impacto: UX levemente degradada em Android com teclado aberto. Resolução: item de polish pós-launch.

**AppLayout `AnimatePresence` com `key={location.pathname}`**: Cada navegação entre steps dispara animação de page transition do AppLayout (slide horizontal). Isso pode conflitar com a transição interna do StepView. Mitigação: em modo `isLearning`, desabilitar animação do AppLayout (`variants: undefined` ou skip). Implementar na Fase 2.
