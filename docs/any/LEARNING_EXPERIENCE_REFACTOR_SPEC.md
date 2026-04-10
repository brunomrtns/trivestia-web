# TRIVESTIA — Especificação de Refatoração Estratégica da Experiência de Aprendizagem

> Documento técnico-produto para orientar squad sênior de frontend.
> Área: Student Learning Experience (core do produto)
> Versão: 1.0 — Abril 2026

---

# 1. Diagnóstico da Situação Atual

## 1.1 Visão Geral

A experiência de aprendizagem atual é fragmentada entre quatro páginas principais (`CourseInteractivePage`, `LessonPage`, `ActivityPlayerPage`, `DashboardPage`) que operam como silos independentes, com navegação inconsistente, estado disperso em `useState` local, e layouts que competem entre si pela coerência visual. O resultado é um fluxo onde o aluno perde contexto constante sobre onde está, para onde vai, e como voltar.

## 1.2 Problemas Estruturais por Categoria

### Problemas de Navegação

**P1 — Duas experiências de aula duplicadas e conflitantes**

`CourseInteractivePage` possui um `CourseInlineLessonPlayer` que replica quase toda a lógica de `LessonPage`. O aluno pode consumir uma aula dentro do curso interativo (inline) ou numa página dedicada, com comportamentos diferentes. Isso gera:

- navegação ambígua (para onde o "voltar" leva depende de como se chegou)
- manutenção dobrada de lógica de timeline, step navigation e mark-as-viewed
- `CourseInlineLessonPlayer` (155 linhas) e `LessonPage` (186 linhas) fazem as mesmas coisas de formas ligeiramente diferentes

**P2 — Link de retorno quebra contexto**

Em `CourseInteractivePage:131`, o link "Voltar" aponta para `/t/{slug}/app/courses/{courseId}` (página de detalhe do curso). Em `LessonPage:69-83`, o breadcrumb condicionalmente aponta para `/t/{slug}/courses/{courseId}` (SEM o prefixo `/app`). Essa inconsistência significa que o botão "voltar ao curso" pode levar a rotas diferentes dependendo da página, e uma delas é uma rota pública (sem `/app`), possivelmente quebrando o fluxo.

**P3 — Navegação pós-atividade descuidada**

Em `ActivityPlayerPage:358`, o botão "Ir para Dashboard" no resultado da atividade sempre navega para `/t/{slug}/app/dashboard`, abandonando completamente o contexto do curso. O aluno que estava num curso, fez uma atividade, e quer continuar estudando é jogado para fora. O botão "Tentar novamente" (retry) reseta o estado local mas não oferece caminho de volta ao curso.

**P4 — `navigate(-1)` como fallback perigoso**

Em `ActivityPlayerPage:128`, o `SimTradingChallengeFlow` usa `onGoBack={() => navigate(-1)}`. Isso depende inteiramente do histórico do browser. Se o aluno entrou por deep link, `navigate(-1)` pode sair do site.

**P5 — Sidebar não reflete progresso em tempo real**

`CourseOutlineSidebar` (204 linhas) faz queries individuais de `isLessonUnlocked` para cada aula listada. Isso é N+1 queries. Além disso, o progresso mostrado na sidebar não atualiza quando o aluno completa um step ou uma atividade inline — só atualiza se a query for manualmente invalidada.

### Problemas de Layout

**P6 — Shell conflitante com AppLayout**

`CourseInteractivePage:126` declara `h-[calc(100vh-4rem)]` assumindo que o topbar tem exatamente 4rem. Mas o `AppLayout` já possui um sidebar (213 linhas) e topbar (110 linhas) que consomem espaço real. O layout tenta ser full-height dentro de um container que já tem chrome, gerando scroll duplo ou overflow escondido.

**P7 — Content area pequena e subutilizada**

Em `LessonPage:63`, o container usa `max-w-5xl` com `py-12`. Em `CourseInteractivePage:192`, usa `max-w-4xl`. Em `ActivityPlayerPage:389`, usa `max-w-2xl`. A área útil de conteúdo muda drasticamente entre páginas, e todas são relativamente estreitas para conteúdo educacional. A sidebar de timeline em `LessonPage:119` é `w-64` fixo e escondida abaixo de `lg`, mas o conteúdo principal não expande para preencher o espaço.

**P8 — Layout não é imersivo**

Não existe um modo foco/imersivo. O sidebar do `AppLayout` (213 linhas) permanece visível durante todo o consumo de aulas, roubando espaço horizontal e atenção. O aluno que está estudando não precisa ver links de "Admin", "Billing" ou "Super Admin" — mas eles estão lá.

**P9 — Mobile tratado como afterthought**

`CourseInteractivePage:163-167` usa uma sidebar fixa com `translate-x` para mobile. Não há drawer com swipe-to-close. Não há gesture navigation. O overlay é um `div` com `bg-black/30` sem animação. Em `LessonPage`, a timeline sidebar simplesmente desaparece em mobile sem alternativa.

### Problemas de Arquitetura de Estado

**P10 — Estado fragmentado sem fonte de verdade**

Cada página mantém seu próprio estado local:
- `CourseInteractivePage`: `activeLessonId`, `activeModuleId`, `initialStepId`, `sidebarOpen`
- `LessonPage`: `currentStep`
- `ActivityPlayerPage`: `currentIndex`, `answers`, `result`
- `CourseInlineLessonPlayer`: `currentStep` (duplicado)

Não há comunicação entre esses estados. Quando o aluno completa uma aula em `CourseInlineLessonPlayer`, ele chama `handleLessonComplete` que faz um loop linear pelos módulos para encontrar a próxima aula (CourseInteractivePage:69-83). Se o backend tiver reordenado aulas, esse loop encontra a aula errada.

**P11 — Estado perdido em navegação**

O `currentStep` em `LessonPage` e `CourseInlineLessonPlayer` vive em `useState(0)`. Se o aluno navega para uma atividade e volta, recomeça do step 0. O `initialStepId` em `CourseInteractivePage` tenta resolver isso, mas só funciona na primeira seleção de aula — não sobrevive a navegação interna.

**P12 — Queries com staleTimes inconsistentes**

- `course-interactive`: `staleTime: 5 min` (CourseInteractivePage:33)
- `timeline`: default staleTime, ou seja, 0 (LessonPage:42)
- `activity`: `staleTime: 0` (ActivityPlayerPage:55)
- `lesson-unlock`: `staleTime: 60s` (ActivityPlayerPage:101)
- `dashboard-continue`: `staleTime: 2 min` (DashboardPage:53)

Essa inconsistência significa que progresso pode estar desatualizado em algumas telas mas não em outras. O aluno completa uma atividade, volta ao curso, e o progresso ainda mostra o valor antigo.

**P13 — Mutação de markViewed sem optimistic update**

Em `LessonPage:47-55` e `CourseInlineLessonPlayer`, `markViewed` é chamado como efeito colateral assíncrono sem optimistic update. O step pode ser marcado como viewed no servidor mas a UI ainda mostra como não-viewed até a query ser invalidada.

### Problemas de UX Pedagógica

**P14 — Sem indicação clara de próximo passo**

Quando o aluno termina uma aula (CourseInteractivePage:63-87), `handleLessonComplete` faz o loop e seleciona a próxima aula. Mas não há confirmação visual, não há "Parabéns, você completou essa aula", não há transição clara. O conteúdo simplesmente muda.

**P15 — Progresso visível mas não significativo**

O progresso é mostrado como porcentagem (CourseInteractivePage:155) mas sem contexto. "45%" não diz ao aluno quantas aulas faltam, quanto tempo estimado resta, ou qual é o próximo marco.

**P16 — Atividade desconectada do fluxo pedagógico**

Em `StepPlayer`, quando um step é do tipo `ACTIVITY`, renderiza um card com botão que navega para `/t/{slug}/app/lessons/{lessonId}/activities/{activityId}`. Isso abre uma página completamente nova, fora do shell do curso, sem sidebar, sem contexto de módulo. O aluno perde a noção de que está dentro de uma aula que está dentro de um módulo.

**P17 — Feedback de conclusão genérico**

A tela de resultado de atividade (ActivityPlayerPage:168-366) mostra score, pass/fail, e revisão. Mas não conecta com o progresso da aula. Não diz "Você completou 3 de 5 atividades desta aula". Não orienta o próximo passo.

### Problemas de Consistência entre Telas

**P18 — Padrões visuais inconsistentes**

- Cards: `rounded-xl` em alguns lugares, `rounded-2xl` em outros
- Padding: `p-4`, `p-5`, `p-6`, `px-4 py-3` sem padrão
- Typography: `text-sm`, `text-xs`, `text-base` sem escala definida
- Botões: `rounded-xl`, `rounded-lg`, `rounded-md` misturados
- Shadows: `shadow-sm` universal, sem hierarquia de elevação

**P19 — Header/topbar duplicado e inconsistente**

`CourseInteractivePage` tem seu próprio topbar (128-158) dentro do shell que já tem o `Topbar` do `AppLayout`. Resultado: duas barras no topo. `LessonPage` usa breadcrumb. `ActivityPlayerPage` não tem header nenhum — só o progresso da questão.

**P20 — Animações inconsistentes**

- CourseInteractivePage: `motion.div` com `opacity: 0, y: 8`
- LessonPage: `AnimatePresence mode="wait"` no StepPlayer
- ActivityPlayerPage: `motion.div` com `opacity: 0, x: 20` para questões
- DashboardPage: `motion.div` com `opacity: 0, y: 16` e delay escalonado

Cada página inventa sua própria animação de entrada sem coerência.

### Problemas de Manutenibilidade

**P21 — Componentes monolíticos**

`ActivityPlayerPage` tem 587 linhas incluindo o sub-componente `SimTradingChallengeFlow`. `CourseOutlineSidebar` tem 204 linhas com lógica de expansão de módulos, fetch de lock status, e render inline. Esses componentes fazem demais e são difíceis de testar isoladamente.

**P22 — Lógica de negócio em componentes de página**

A lógica de "encontrar próxima aula" (CourseInteractivePage:69-83) vive no handler de evento do componente de página. Não é testável unitariamente, não é reutilizável, e duplica conhecimento que o backend já possui via `data.next`.

**P23 — Acoplamento forte entre páginas e endpoints**

Cada página importa diretamente os endpoints que precisa. Não há camada de service/hooks que abstraia a lógica de aprendizagem. Mudar a API significa mudar N componentes de página.

---

# 2. Decisão Estratégica Recomendada

## 2.1 Recomendação: Rebuild Profundo por Camadas (Híbrido)

**Não** refactor incremental cosmético. **Não** big-bang rewrite total. **Sim** rebuild estrutural progressivo, camada por camada, com migração por feature flag.

### Justificativa

O refactor incremental (patchar componentes existentes) falha porque:

1. Os problemas são **estruturais**, não superficiais. O layout shell, o modelo de navegação e a arquitetura de estado estão intrinsecamente acoplados. Trocar um sem trocar os outros cria inconsistência pior que a atual.
2. A duplicação entre `CourseInlineLessonPlayer` e `LessonPage` + `LessonTimeline` + `StepPlayer` significa que qualquer fix precisa ser aplicado em dois lugares.
3. O modelo de navegação (duas experiências de aula, atividade em página separada, navegação por `navigate(-1)`) é fundamentalmente quebrado. Não dá para patchar isso.

O big-bang rewrite total falha porque:

1. O backend está em produção. Não podemos quebrar contratos.
2. O `SimTradingTerminal` (27 arquivos em `components/sim-trading/`) é um subsistema complexo e funcional que não precisa ser reescrito.
3. O risco de regressão em produção é inaceitável para o core do produto.

A abordagem híbrida funciona porque:

1. Permite criar um **novo shell** (`LearningExperienceShell`) que coexiste com o atual.
2. Permite migrar **uma página por vez** via feature flag de rota.
3. Permite reutilizar componentes existentes que estão bons (`QuestionRenderer`, `ChartMarkupRenderer`, `RiskCalculatorRenderer`, `SimTradingTerminal`).
4. Permite validar com usuários reais progressivamente.

### Trade-offs

| Abordagem | Tempo | Risco de Regressão | Qualidade Final | Custo |
|-----------|-------|-------------------|-----------------|-------|
| Incremental (patches) | 2-3 semanas | Baixo-médio | Baixa — mesma estrutura | Baixo |
| Rebuild por camadas | 6-8 semanas | Médio (controlável) | Alta — nova fundação | Médio |
| Big-bang rewrite | 10-14 semanas | Alto | Alta (se terminar) | Alto |

### Princípio Diretor

Construir uma nova experiência de aprendizagem **ao lado** da atual, migrando via feature flag. O novo fluxo é um "learning mode" que o aluno pode acessar. Quando estável, torna-se o default e o antigo é removido.

---

# 3. Visão da Nova Experiência Ideal do Aluno

## 3.1 Jornada Completa Ponta a Ponta

### Entrada no Curso

O aluno clica em "Continuar estudando" no Dashboard ou seleciona um curso na lista. É levado diretamente para a **tela de aprendizagem imersiva** — não para uma página de "detalhes do curso". A primeira coisa que vê é o conteúdo que precisa consumir, com o contexto mínimo necessário: o nome do curso num breadcrumb discreto no topo e o título da aula atual.

### Retomada Automática

Se o aluno já tinha progresso, o sistema o posiciona **exatamente** onde parou: na aula, no step, na questão. A URL reflete isso (`/learn/{courseId}/lessons/{lessonId}/steps/{stepId}`). Não há tela intermediária de "escolha onde continuar". O sistema já sabe.

### Visualização da Estrutura do Curso

No lado esquerdo (desktop) ou num drawer deslizante (mobile), existe um **outline** colapsável mostrando módulos e aulas. A aula atual está destacada. Aulas completadas têm um ícone de check. Aulas bloqueadas têm um ícone de cadeado com tooltip explicando o motivo. O aluno pode clicar em qualquer aula desbloqueada para navegar, mas o fluxo natural é linear.

### Consumo de Aula

A aula é uma sequência de steps (texto, vídeo, imagem, atividade). Cada step ocupa a área principal. A navegação entre steps é por botões claros no rodapé (Anterior / Próximo) e por um mini-timeline na lateral. Vídeos são embedados inline com aspect-ratio correto. Texto tem largura de leitura confortável (65-75ch). O progresso da aula é visível (3 de 7 steps).

### Atividade Integrada

Quando um step é do tipo "Atividade", o player de atividade aparece **no mesmo shell**, sem abrir uma nova página. A área de conteúdo transiciona suavemente para o modo atividade. O breadcrumb continua visível. A barra de progresso muda para mostrar "Questão 2 de 5". Ao completar, o resultado aparece inline com feedback, e o aluno pode avançar para o próximo step.

### Avanço para Próxima Etapa

Ao completar o último step de uma aula, aparece uma tela de conclusão: "Aula concluída!" com ícone, tempo gasto, score de atividades. Um botão primário "Próxima aula" leva para a próxima aula do módulo. Se for a última aula do módulo, "Concluir módulo" aparece. Se for a última do curso, "Curso concluído!" celebra.

### Percepção Constante de Onde Está

Em todo momento, o aluno vê:
- **Breadcrumb**: Curso > Módulo 2 > Aula 5 > Step 3
- **Progresso**: Barra de progresso do curso no topo do outline
- **Indicador de step**: "3/7" na área de navegação
- **Título da aula**: Sempre visível no header

### Retorno ao Curso

Um único botão "Voltar ao curso" no header sempre leva para a visão geral do curso com outline expandido no módulo atual. Não há ambiguidade. Não há múltiplos "voltar".

### Conclusão de Aula

Após completar todos os steps (incluindo atividades), uma tela de conclusão aparece com:
- Feedback visual (animação de check, confetti discreto)
- Score consolidado das atividades da aula
- Botão primário para próxima aula
- Opção de rever a aula

### Fluxo em Mobile

Em mobile, o outline vira um drawer que desliza da esquerda com gesto de swipe. A área de conteúdo ocupa toda a largura. Os botões de navegação ficam fixos no rodapé. O header é compacto (breadcrumb + botão de menu). Não há sidebar permanente. O conteúdo é escrolável com área touch-friendly.

---

# 4. Nova Arquitetura de Informação e Navegação

## 4.1 Rotas Propostas

A experiência de aprendizagem vive sob um prefixo dedicado `/learn/` que ativa o Learning Shell imersivo:

```
/t/:tenantSlug/app/learn/:courseId
  → Visão geral do curso (outline + continue card)

/t/:tenantSlug/app/learn/:courseId/lessons/:lessonId
  → Aula, no primeiro step não completado ou no step passado na URL

/t/:tenantSlug/app/learn/:courseId/lessons/:lessonId/steps/:stepIndex
  → Step específico da aula (índice numérico, 0-based)

/t/:tenantSlug/app/learn/:courseId/lessons/:lessonId/activities/:activityId
  → Atividade específica, dentro do shell do curso

/t/:tenantSlug/app/learn/:courseId/complete
  → Tela de conclusão do curso
```

### Rotas existentes mantidas (backward compat)

```
/t/:tenantSlug/app/courses/:courseId/interactive
  → Redirect 301 para /app/learn/:courseId

/t/:tenantSlug/app/lessons/:lessonId
  → Redirect para /app/learn/:courseId/lessons/:lessonId (courseId resolvido via API)

/t/:tenantSlug/app/lessons/:lessonId/activities/:activityId
  → Redirect para /app/learn/:courseId/lessons/:lessonId/activities/:activityId
```

### Navegação Inline vs Página Dedicada

| Conteúdo | Modo | Razo |
|----------|------|------|
| Steps de aula (texto, vídeo, imagem) | Inline no shell | Conteúdo é passivo, não precisa de tela cheia |
| Atividade comum (múltipla escolha, ordering, text) | Inline no shell | Atividade curta, fluxo contínuo |
| Sim Trading Challenge | Full-screen dentro do shell | Precisa de tela cheia, mas mantém o shell wrapper |
| Resultado de atividade | Inline no shell | Feedback deve ser consumido no contexto |

### Como o Usuário Volta sem se Perder

**Regra**: Existe **um único botão de retorno** no header, cujo comportamento é determinado pelo contexto:

| Contexto atual | "Voltar" leva para |
|----------------|-------------------|
| Visão geral do curso | Dashboard (`/app/dashboard`) |
| Dentro de uma aula | Visão geral do curso (`/app/learn/:courseId`) |
| Dentro de uma atividade | Aula que contém a atividade (`/app/learn/:courseId/lessons/:lessonId`) |
| Tela de resultado | Aula da atividade (step seguinte ao da atividade) |
| Tela de conclusão do curso | Dashboard |

**Nunca** usar `navigate(-1)`. **Nunca** usar browser history. A navegação é sempre determinística via URL.

### Deep Linking

Qualquer URL sob `/learn/` funciona como deep link. Ao acessar diretamente:
1. O shell carrega os dados do curso
2. Verifica se o aluno tem acesso (se não, mostra bloqueio com motivo)
3. Posiciona no step/atividade indicado pela URL
4. O outline é carregado em paralelo (não bloqueia a exibição do conteúdo)

### "Continuar de Onde Parei"

O endpoint `GET /dashboard/continue` retorna `{ courseId, lessonId, stepId, activityId?, kind }`. O Dashboard "Continue" button navega para `/app/learn/{courseId}/lessons/{lessonId}/steps/{stepId}` (ou `/activities/{activityId}` se `kind === 'ACTIVITY'`).

Dentro do `/learn/:courseId`, ao entrar sem lessonId na URL, o shell consulta o mesmo endpoint e redireciona para a URL canônica com step/lesson corretos.

### Preservação de Contexto

O estado de "qual aula está aberta" e "qual step está ativo" vive **na URL**. Isso garante:
- Refresh funciona (o estado sobrevive)
- Deep link funciona
- Back/forward do browser funciona corretamente
- Compartilhamento de link funciona

---

# 5. Nova Arquitetura de Interface

## 5.1 Layout Desktop (>1024px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (h-14, fixed top)                                           │
│ [← Voltar]  Curso: Trading Avançado  ·  Módulo 2 > Aula 5  [☰]   │
├──────────┬──────────────────────────────────────────────────────────┤
│ OUTLINE  │  CONTENT AREA                                           │
│ (w-72)   │  (flex-1, max-w-4xl, centered)                          │
│          │                                                          │
│ ▸ Mod 1  │  [Step Content / Activity / Result]                     │
│   ✓ Aula │                                                          │
│   ✓ Aula │                                                          │
│ ▾ Mod 2  │                                                          │
│   ✓ Aula │                                                          │
│  ●Aula 5 │  ← active lesson                                        │
│   ○ Aula │                                                          │
│   🔒Aula │                                                          │
│          │                                                          │
│ Progress │                                                          │
│ ████░░ 45│                                                          │
│          │                                                          │
├──────────┴──────────────────────────────────────────────────────────┤
│ ACTION BAR (h-16, fixed bottom)                                    │
│                    [← Anterior]   Step 3 de 7   [Próximo →]        │
└─────────────────────────────────────────────────────────────────────┘
```

### Regiões

**Header (fixo, h-14)**
- Botão "Voltar" com ícone (comportamento contextual conforme seção 4)
- Breadcrumb: `Curso > Módulo > Aula` (truncado em mobile)
- Botão toggle do outline (hamburger no desktop para fechar, no mobile para abrir drawer)
- Indicador de progresso compacto (mini barra circular ou percentual)

**Outline (sidebar left, w-72, colapsável)**
- Lista de módulos expandíveis/colapsáveis
- Cada aula mostra: ícone de status (✓/●/🔒), título, percentual
- Aula ativa destacada com background accent e border-left primary
- Progresso do curso no rodapé do outline
- Scroll independente do conteúdo

**Content Area (flex-1, max-w-4xl, centered com px-6 lg:px-12)**
- Área principal de renderização do step/atividade
- Scroll independente
- Padding vertical generoso (py-8)
- Conteúdo nunca colado nas bordas

**Action Bar (fixo, h-16, bottom)**
- Botão "Anterior" (outline, desabilitado no primeiro step)
- Indicador de posição: "Step 3 de 7" ou "Questão 2 de 5"
- Botão "Próximo" (primário) ou "Completar Aula" (verde, no último step)
- Botão "Enviar" (verde) quando em modo atividade na última questão

## 5.2 Layout Mobile (<1024px)

```
┌─────────────────────────┐
│ HEADER (h-12)           │
│ [←]  Aula 5   [☰]      │
├─────────────────────────┤
│                         │
│  Content Area           │
│  (full width, px-4)     │
│                         │
│                         │
│                         │
├─────────────────────────┤
│ ACTION BAR (h-14)       │
│ [←]  3/7  [Próximo →]  │
└─────────────────────────┘

Drawer (swipe from left):
┌─────────────────────────┐
│ ✕  Estrutura do Curso   │
│                         │
│ ▸ Módulo 1              │
│   ✓ Aula 1              │
│   ✓ Aula 2              │
│ ▾ Módulo 2              │
│  ●Aula 5  (ativo)       │
│   ○ Aula 6              │
│                         │
│ Progresso ████░░ 45%    │
└─────────────────────────┘
```

### Diferenças mobile:

- Outline vira drawer com backdrop blur, swipe-to-close
- Header compacto (h-12), breadcrumb truncado para apenas nome da aula
- Action bar compacta (h-14), indicador minimalista "3/7"
- Content area full-width com px-4
- Touch targets mínimos de 44px
- Vídeos em aspect-ratio 16:9 sem scroll lateral

## 5.3 Estados do Shell

### Loading

Skeleton screen com layout preservado: outline skeleton (retângulos pulsantes) + content skeleton (card com retângulo de título e 3 linhas de texto). Nunca spinner centralizado em tela vazia.

### Erro de Rede

Card de erro inline na content area com:
- Ícone de alerta
- Mensagem clara: "Não foi possível carregar esta aula"
- Botão "Tentar novamente" que refaz a query
- Se o outline já carregou, o aluno pode navegar para outra aula

### Aula/Step Bloqueado

Card de bloqueio na content area com:
- Ícone de cadeado
- Motivo claro (prazo expirado, prerequisite não concluído, etc.)
- CTA para resolver (ir para a prerequisite, ver detalhes do prazo)
- Outline mostra a aula com ícone de cadeado e tooltip

### Aula Vazia (sem steps)

Card de estado vazio com:
- Ícone informativo
- "Esta aula ainda não possui conteúdo"
- Botão "Próxima aula" se houver

### Conclusão de Aula

Transição animada (fade + scale):
- Ícone de check grande com animação
- Título: "Aula concluída!"
- Score das atividades (se houver)
- Botão primário: "Próxima aula"
- Botão secundário: "Rever aula"

### Conclusão de Curso

Tela de celebração:
- Ícone de troféu com animação
- Título: "Curso concluído!"
- Estatísticas: aulas completadas, score médio, tempo total
- Botão: "Voltar ao Dashboard"
- Botão secundário: "Rever curso"

---

# 6. Arquitetura de Componentes Proposta

## 6.1 Árvore de Componentes

```
<LearningRoute>                          // Route handler com data loading
  <LearningShell>                        // Layout imersivo (sem AppLayout sidebar)
    <LearningHeader>                     // Header fixo com breadcrumb contextual
    <LearningOutline                     // Sidebar desktop / Drawer mobile
      <CourseProgressBar />             // Barra de progresso do curso
      <ModuleAccordion>                 // Módulo expandível
        <LessonRow />                   // Linha de aula com status
        <LessonLockIndicator />         // Badge de bloqueio
      </ModuleAccordion>
    </LearningOutline>
    <LearningContent>                   // Área de conteúdo principal
      <LearningRouter>                  // Roteamento interno por tipo de conteúdo
        <StepView>                      // Viewer de step individual
          <TextStepContent />           // Texto + HTML
          <VideoStepContent />          // Vídeo embed
          <ImageStepContent />          // Imagem + caption
          <ActivityStepContent />       // Card de atividade (inline launcher)
        </StepView>
        <ActivityFlow>                  // Fluxo de atividade inline
          <ActivityQuestionCard />      // Card de questão
          <QuestionRenderer />          // Dispatcher de tipo (reutilizado)
          <ActivityResult />            // Tela de resultado inline
        </ActivityFlow>
        <LessonCompletionCard />        // Tela de conclusão de aula
        <CourseCompletionCard />        // Tela de conclusão de curso
        <CourseOverview />              // Visão geral com continue card
      </LearningRouter>
    </LearningContent>
    <LearningActionBar>                 // Barra de ações fixa inferior
      <PreviousButton />
      <StepIndicator />
      <NextButton />
    </LearningActionBar>
  </LearningShell>
</LearningRoute>
```

## 6.2 Responsabilidades por Componente

### `LearningRoute`
- **Tipo**: Route component (React Router `loader` ou wrapper)
- **Responsabilidade**: Carregar dados iniciais do curso via TanStack Query, verificar acesso, redirecionar se bloqueado. Passa dados para o shell via context.
- **Props**: Parâmetros de URL (`courseId`, `lessonId`, `stepIndex`, `activityId`)
- **Não renderiza UI**: Só orquestra data loading e access control

### `LearningShell`
- **Tipo**: Layout component
- **Responsabilidade**: Renderizar o shell imersivo (header + outline + content + action bar). Gerencia estado do outline (aberto/fechado). Fornece o LearningContext para filhos.
- **State**: `outlineOpen: boolean`, `isMobile: boolean`
- **Não conhece**: Conteúdo específico sendo exibido

### `LearningHeader`
- **Tipo**: UI component
- **Responsabilidade**: Renderizar breadcrumb contextual, botão voltar, toggle do outline, indicador de progresso compacto.
- **Props**: `courseTitle`, `moduleTitle?`, `lessonTitle?`, `onToggleOutline`, `backTarget`
- **Comportamento**: Breadcrumb monta dinamicamente com base na URL atual

### `LearningOutline`
- **Tipo**: Compound component (sidebar + drawer)
- **Responsabilidade**: Renderizar outline do curso com módulos/aulas. Desktop: sidebar fixa. Mobile: drawer com overlay.
- **Props**: `modules`, `activeLessonId`, `courseProgress`, `onSelectLesson`
- **Comportamento**: Auto-expande módulo da aula ativa. Persiste estado de expansão em localStorage.

### `LearningContent`
- **Tipo**: Container component
- **Responsabilidade**: Área scrollável para conteúdo. Gerencia transições entre tipos de conteúdo (step, atividade, resultado, conclusão).
- **Não contém lógica**: Só fornece container estilizado com AnimatePresence

### `LearningRouter`
- **Tipo**: Router component (não React Router, roteamento interno)
- **Responsabilidade**: Dado o contexto atual (curso sem aula selecionada = overview, aula+step = stepView, aula+atividade = activityFlow, aula completada = completion), renderizar o componente correto.
- **Baseado em**: URL params + dados do curso

### `StepView`
- **Tipo**: Renderer component
- **Responsabilidade**: Renderizar um step individual baseado no tipo. Orquestra a chamada de mark-as-viewed.
- **Props**: `step: LessonStepDTO`
- **Sub-componentes**: `TextStepContent`, `VideoStepContent`, `ImageStepContent` (refatorados do atual `StepPlayer`)

### `ActivityFlow`
- **Tipo**: Flow component (stateful)
- **Responsabilidade**: Gerenciar o fluxo completo de atividade (questões → submissão → resultado) dentro do shell do curso. Substitui `ActivityPlayerPage` e `ActivityPlayerContent`.
- **State interno**: `currentIndex`, `answers`, `result`
- **Callbacks**: `onComplete()` — notifica o shell que a atividade foi completada

### `LearningActionBar`
- **Tipo**: UI component
- **Responsabilidade**: Barra fixa inferior com navegação contextual.
- **Props**: `canGoBack`, `canGoForward`, `currentLabel`, `onPrevious`, `onNext`, `nextLabel`
- **Comportamento**: Muda labels e ações baseado no contexto (step vs atividade vs conclusão)

### `LessonCompletionCard`
- **Tipo**: UI component
- **Responsabilidade**: Tela de conclusão de aula com score e CTA para próxima.
- **Props**: `lessonTitle`, `score?`, `nextLesson?`, `onNextLesson`, `onReview`

### `CourseOverview`
- **Tipo**: UI component
- **Responsabilidade**: Visão geral do curso quando nenhuma aula está selecionada. Mostra header com progresso, continue card, e lista de módulos.
- **Substitui**: `CourseInteractiveHeader` + cards de módulos de `CourseInteractivePage`

## 6.3 Componentes Reutilizados (sem modificação)

- `QuestionRenderer` e todos seus sub-renderers (MultipleChoice, MultipleSelect, Ordering, TextInput, ChartMarkup, RiskCalculator)
- `SimTradingTerminal` e `ChallengeBriefingScreen`
- `LessonLockBadge` (adaptado para `LessonLockIndicator`)

## 6.4 Componentes a Remover (após migração)

- `CourseInlineLessonPlayer` (absorvido por `StepView` + `LearningRouter`)
- `LessonPage` inteiro (substituído pelo shell)
- `ActivityPlayerPage` inteiro (substituído por `ActivityFlow` no shell)
- `ActivityPlayerContent` (absorvido por `ActivityFlow`)
- `CourseInteractiveHeader` (absorvido por `CourseOverview`)
- `useNavigateToActivity` hook (navegação agora é por URL)

---

# 7. Arquitetura de Estado Proposta

## 7.1 Princípios

1. **URL é a fonte de verdade para posição**: `courseId`, `lessonId`, `stepIndex`, `activityId` vivem na URL
2. **Server state é cache**: TanStack Query com staleTime consistente
3. **UI transitório é local**: sidebar aberta, drawer, hover states
4. **Progresso é server-derived**: nunca calcular localmente

## 7.2 Onde Cada Tipo de Estado Vive

### Na URL (React Router params)

```
/t/:tenantSlug/app/learn/:courseId/lessons/:lessonId/steps/:stepIndex
```

- `courseId`: qual curso
- `lessonId`: qual aula (null = visão geral do curso)
- `stepIndex`: qual step (null = primeiro não completado)
- `activityId`: qual atividade (null = não está em atividade)

**Regras**:
- Navegar para próxima aula = `navigate(../{nextLessonId})`
- Navegar para próximo step = `navigate(../steps/{nextIndex})`
- Entrar em atividade = `navigate(activities/{activityId})`
- Sair da atividade = `navigate(../../steps/{nextStepIndex})`

### Em TanStack Query (cache/server state)

| Query Key | Dados | staleTime | Quando invalidar |
|-----------|-------|-----------|-----------------|
| `['course-interactive', slug, courseId]` | Curso completo com módulos, aulas, progresso, next pointer | 2 min | Após completar aula, após submissão |
| `['timeline', slug, lessonId]` | Steps da aula + progresso | 1 min | Após mark-viewed, após completar step |
| `['activity', slug, lessonId, activityId]` | Questões da atividade | 0 (sempre fresh) | Nunca (dados imutáveis) |
| `['submission-review', slug, activityId]` | Resultado + revisão | 30 min | Após nova submissão |
| `['lesson-unlock', slug, lessonId]` | Status de bloqueio | 60s | Após completar prerequisite |

### Em Context (LearningContext)

Um React Context fornecido pelo `LearningShell`:

```
LearningContext = {
  course: CourseInteractiveDTO       // dados do curso carregados
  activeLessonId: string | null       // da URL
  activeStepIndex: number | null      // da URL
  activeActivityId: string | null     // da URL
  outlineOpen: boolean                // estado da sidebar
  setOutlineOpen: (open: boolean) => void
  selectLesson: (lessonId: string) => void    // navega via URL
  selectStep: (index: number) => void         // navega via URL
  startActivity: (activityId: string) => void // navega via URL
  exitActivity: () => void                    // navega de volta
}
```

**Por que Context e não prop drilling**: A árvore tem 4-5 níveis de profundidade. O `QuestionRenderer` não precisa saber sobre o outline. O `LearningActionBar` precisa saber o step index mas não os dados do curso. Context resolve isso limpo.

### Em Estado Local (useState/useReducer)

| Componente | Estado | Tipo |
|------------|--------|------|
| `ActivityFlow` | `currentIndex` | `useState<number>` |
| `ActivityFlow` | `answers` | `useState<Record<string, Answer>>` |
| `ActivityFlow` | `result` | `useState<SubmissionResult \| null>` |
| `LearningShell` | `outlineOpen` | `useState<boolean>` |
| `SimTradingTerminal` | estado do terminal | interno (não muda) |

**Regra**: Se o estado precisa sobreviver a um refresh, ele não pode ser local. Se o estado é temporário da interação atual (qual questão está visível, respostas antes de submeter), é local.

### Em Zustand (global)

Apenas o `authStore` existente (para user info e role). Nenhum estado de aprendizagem novo no Zustand.

### Estado Derivado

| Derivação | De | Como |
|-----------|-----|------|
| Aula ativa | URL param `lessonId` + `courseInteractive.modules` | `useMemo` no context |
| Step ativo | URL param `stepIndex` + `timeline.steps` | `useMemo` no StepView |
| Progresso do curso | `courseInteractive.progress` | Direto da query |
| Próximo step | `timeline.steps[currentIndex + 1]` | Derivado local |
| Próxima aula | `courseInteractive.next` (do server) | Direto da query, **não** calculado no frontend |

---

# 8. Fluxos Críticos Detalhados

## Fluxo 1: Aluno entra no curso e quer continuar de onde parou

```
1. Aluno clica "Continuar" no Dashboard (ContinueCard)
2. ContinueCard consulta dashboardEndpoints.getContinue() → { courseId, lessonId, stepId, kind }
3. Navega para /app/learn/{courseId}/lessons/{lessonId}/steps/{stepIndex}
   (se kind=ACTIVITY, navega para /activities/{activityId})
4. LearningRoute carrega:
   a. Query: course-interactive → módulos, aulas, progresso, next
   b. Query: timeline → steps da aula
   c. Query: lesson-unlock → verifica se aula está desbloqueada
5. Se desbloqueada: LearningShell renderiza, StepView mostra o step
6. Se bloqueada: LearningShell renderiza, conteúdo mostra card de bloqueio
```

**Se não houver progresso anterior** (primeira vez no curso):
```
1. Navigate para /app/learn/{courseId} (sem lessonId)
2. LearningRoute carrega course-interactive
3. courseInteractive.next indica primeira aula/step
4. CourseOverview renderiza com "Começar" button
5. Clicar em "Começar" navega para /lessons/{firstLessonId}/steps/0
```

## Fluxo 2: Aluno abre uma aula e consome steps sequencialmente

```
1. Aluno está em /learn/{courseId}/lessons/{lessonId}/steps/0
2. LearningShell renderiza outline (aula ativa destacada) + StepView(step[0])
3. Aluno consome o conteúdo do step
4. Clica "Próximo" na Action Bar
5. LearningActionBar chama context.selectStep(1)
6. Context navega para /learn/{courseId}/lessons/{lessonId}/steps/1
7. URL muda, StepView re-renderiza com step[1], AnimatePresence transition
8. Em paralelo: markViewed é chamado para step[0] (fire-and-forget com optimistic)
9. Steps repetem até o último step
10. No último step, Action Bar mostra "Concluir Aula" (botão verde)
11. Clicar "Concluir Aula":
    a. Chama endpoint de complete (se existir) ou marca último step como viewed
    b. Invalida query timeline e course-interactive
    c. Navega para /learn/{courseId}/lessons/{lessonId}/complete (estado de conclusão)
12. LessonCompletionCard renderiza com "Próxima Aula" button
13. courseInteractive.next (agora atualizado) indica próxima aula
14. Clicar "Próxima Aula" navega para /learn/{courseId}/lessons/{nextLessonId}/steps/0
```

## Fluxo 3: Aluno realiza uma atividade e volta ao fluxo da aula

```
1. Aluno está no step N da aula, step tipo ACTIVITY
2. StepView renderiza ActivityStepContent: card com "Iniciar Atividade"
3. Aluno clica "Iniciar Atividade"
4. context.startActivity(activityId) navega para /activities/{activityId}
5. LearningRouter detecta activityId na URL → renderiza ActivityFlow
6. ActivityFlow carrega query activity → questões
7. Aluno responde questão por questão:
   a. currentIndex incrementa localmente
   b. Action Bar mostra "Questão 2 de 5"
   c. Navegação entre questões é local (não muda URL)
8. Na última questão, Action Bar mostra "Enviar"
9. Aluno clica "Enviar":
   a. submitMutation.mutate(...)
   b. Loading state no botão
   c. Em sucesso: result é setado, ActivityResult renderiza inline
10. ActivityResult mostra score, feedback, revisão
11. Action Bar muda para: [← Voltar à aula] [Próximo Step →]
12. Clicar "Próximo Step":
    a. context.exitActivity() navega de volta para /steps/{stepAfterActivity}
    b. StepView renderiza o próximo step
    c. Progresso do outline atualiza (invalidateQueries)
```

## Fluxo 4: Aluno conclui uma aula e é levado ao melhor próximo passo

```
1. Último step completado (ou última atividade da aula concluída)
2. LessonCompletionCard renderiza
3. Lógica do próximo passo:
   a. Se courseInteractive.next existe → botão "Próxima Aula: {title}"
   b. Se não há next mas há módulo incompleto → "Módulo concluído! Próximo módulo"
   c. Se curso completo → CourseCompletionCard com celebração
4. Nenhum cálculo no frontend. Tudo vem de courseInteractive.next (server)
```

## Fluxo 5: Aluno usa mobile

```
1. LearningShell detecta viewport < 1024px → isMobile = true
2. Outline renderiza como drawer (closed por default)
3. Header mostra ícone hamburger (☰) que abre drawer
4. Drawer:
   a. Slide da esquerda com spring animation
   b. Backdrop blur escuro
   c. Swipe-to-close (framer-motion drag)
   d. Focus trap para acessibilidade
5. Content area: full width, px-4, py-6
6. Action Bar: compacta (h-14), touch targets 44px mínimo
7. Vídeos: aspect-ratio 16:9, sem overflow
8. Texto: font-size mínimo 16px para legibilidade
9. Step indicator: minimalista "3/7"
```

## Fluxo 6: Aluno recarrega a página no meio do consumo

```
1. URL preserva: /learn/{courseId}/lessons/{lessonId}/steps/5
2. LearningRoute re-executa queries (cache pode servir se dentro de staleTime)
3. Se cache hit: renderização instantânea, refetch em background
4. Se cache miss: skeleton screen, depois conteúdo
5. O step index vem da URL → posicionamento correto
6. As respostas de atividade em andamento são PERDIDAS (estado local)
   - Aceitável: o aluno não tinha submetido, não havia persistido
   - Se estava em revisão de resultado: submission-review query serve o resultado
```

## Fluxo 7: Aluno entra por link direto em aula/atividade

```
1. Link recebido: /learn/{courseId}/lessons/{lessonId}/activities/{activityId}
2. LearningRoute:
   a. Carrega course-interactive (verifica acesso ao curso)
   b. Carrega lesson-unlock (verifica se aula está desbloqueada)
   c. Se bloqueada: redireciona para /learn/{courseId} com toast "Esta aula ainda não está disponível"
   d. Se desbloqueada: carrega activity e renderiza ActivityFlow
3. Outline carrega em paralelo e posiciona na aula correta
4. Header mostra breadcrumb completo para contexto
```

## Fluxo 8: Falha de rede durante carregamento

```
1. Query falha (TanStack Query isError = true)
2. LearningContent renderiza ErrorCard:
   a. Ícone de alerta
   b. "Não foi possível carregar. Verifique sua conexão."
   c. Botão "Tentar novamente" → refetch()
3. Se outline já carregou: aluno pode navegar para outra aula
4. Se nada carregou: skeleton + error card centralizado
5. Não há retry automático infinito. Máximo 3 retries, depois error state manual.
```

## Fluxo 9: Submissão com erro

```
1. submitMutation.onError é acionado
2. Toast de erro: "Não foi possível enviar suas respostas"
3. O estado local (answers, currentIndex) é PRESERVADO
4. O botão "Enviar" volta ao estado ativo (não fica em loading)
5. O aluno pode tentar enviar novamente
6. Se o erro for 403 (curso expirado): banner de expiração aparece
7. Se o erro for 409 (já submetido): redireciona para revisão
```

## Fluxo 10: Curso/aula bloqueada

```
1. lesson-unlock query retorna { unlocked: false, reason: "PREREQUISITE_NOT_MET" }
2. LearningContent renderiza LockCard:
   a. Ícone de cadeado
   b. "Esta aula exige conclusão de: {prerequisite title}"
   c. Botão "Ir para a prerequisite" → navega para a prerequisite lesson
   d. Se COURSE_EXPIRED: mensagem de prazo + data
   e. Se NOT_AVAILABLE_YET: data de liberação + countdown
3. Outline mostra ícone de cadeado na aula
4. O aluno pode navegar livremente pelo outline para aulas desbloqueadas
```

## Fluxo 11: Conteúdo vazio ou inconsistente

```
1. timeline.steps retorna array vazio
2. LearningContent renderiza EmptyState:
   a. Ícone informativo (book)
   b. "Esta aula ainda não possui conteúdo"
   c. Se houver próxima aula: botão "Ir para próxima aula"
   d. Se não: botão "Voltar ao curso"
3. Se activity.questions retorna vazio:
   a. Mensagem: "Esta atividade não possui questões no momento"
   b. Botão "Voltar à aula"
```

## Fluxo 12: Botão voltar em diferentes níveis de contexto

```
Visão geral do curso (/learn/{courseId}):
  ← "Voltar ao Dashboard" → /app/dashboard

Dentro de uma aula (/learn/{courseId}/lessons/{lessonId}/steps/{n}):
  ← "Voltar ao curso" → /learn/{courseId}
  (header breadcrumb mostra: Curso > Módulo > Aula, clicável)

Dentro de uma atividade (/learn/{courseId}/lessons/{lessonId}/activities/{activityId}):
  ← "Voltar à aula" → /learn/{courseId}/lessons/{lessonId}/steps/{activityStepIndex}

Tela de resultado de atividade:
  ← "Voltar à aula" → próximo step após a atividade

Tela de conclusão de aula:
  ← "Voltar ao curso" → /learn/{courseId}

Tela de conclusão de curso:
  ← "Voltar ao Dashboard" → /app/dashboard
```

**Implementação**: Uma função `getBackTarget(currentPath)` que retorna `{ label, path }`. Chamada pelo `LearningHeader` baseada na rota atual. Nunca `navigate(-1)`.

---

# 9. Diretrizes de UX/UI

## 9.1 Densidade Visual

- **Outline**: Compacto. Cada item de aula ocupa 40-44px de altura. Tipografia `text-sm`. Ícones `h-4 w-4`.
- **Content area**: Generoso. Padding `py-8 px-6 lg:px-12`. Tipografia base `text-base` (16px). Espaçamento entre parágrafos: `mb-4`.
- **Action bar**: Equilibrado. `h-16` desktop, `h-14` mobile. Botões com `py-2.5 px-5`.
- **Regra**: O conteúdo é rei. Nav e chrome são discretos.

## 9.2 Largura Máxima de Leitura

- Texto: `max-w-prose` (65ch) — ideal para leitura prolongada
- Vídeo: `max-w-4xl` com aspect-ratio 16:9
- Atividades: `max-w-2xl` — questões precisam ser focadas
- Imagens: `max-w-3xl` — visuais podem ser maiores
- Cards de módulo (overview): `max-w-4xl`

## 9.3 Escala Tipográfica

```
Curso título (overview):     text-3xl font-extrabold  (30px)
Módulo título (outline):     text-sm font-semibold    (14px)
Aula título (header):        text-base font-semibold  (16px)
Step título:                 text-xl font-bold        (20px)
Body texto:                  text-base leading-relaxed (16px, 1.625)
Question statement:          text-base font-semibold  (16px)
Option label:                text-sm                  (14px)
Action bar labels:           text-sm font-medium      (14px)
Breadcrumb:                  text-xs text-muted       (12px)
Progress label:              text-xs text-muted       (12px)
```

## 9.4 Prioridade do Conteúdo Educacional

- O step/atividade ocupa 100% da atenção vertical entre header e action bar
- Nunca sidebar direita durante consumo (sugestões, chat, etc.)
- Vídeos autoplay com mute, som habilitado pelo aluno
- Texto com scroll suave, sem paginação artificial
- Imagens com zoom-on-click (lightbox)

## 9.5 Posição das Ações Principais

- **CTA primário** ("Próximo", "Enviar", "Concluir"): Action bar, **direita**, cor primary/verde
- **CTA secundário** ("Anterior", "Retry", "Rever"): Action bar, **esquerda**, outline/ghost
- **Navegação contextual** (outline, breadcrumb): Header e sidebar
- **Ações destrutivas** (sair do curso, abandonar atividade): Nunca prominentes

## 9.6 Visibilidade do Progresso

- **Outline**: Progresso do curso como número e barra no rodapé ("12 de 20 aulas · 60%")
- **Header**: Mini indicador (ícone circular com percentual)
- **Action bar**: Posição atual ("Step 3 de 7")
- **Timeline lateral** (dentro do outline, quando aula expandida): Steps com ✓/●/○
- **Resultado de atividade**: Score como percentual grande e colorido

## 9.7 Hierarquia entre Conteúdo, Navegação e Ações

```
1° CONTEÚDO (60%+ da atenção) — área central, maior, mais contraste
2° AÇÕES (20%) — action bar fixa, sempre acessível, não compete com conteúdo
3° NAVEGAÇÃO (20%) — outline colapsável, breadcrumb discreto, nunca obstrui
```

## 9.8 Feedback Visual de Conclusão

- Step completado: transição suave para próximo, check no mini-timeline
- Aula completada: card de conclusão com ícone animado (scale + fade), cor verde
- Atividade aprovada: ícone verde, "Aprovado!" em bold, fundo subtle verde
- Atividade reprovada: ícone amarelo, "Continue estudando", sem tom punitivo
- Módulo completado: badge no outline, animação de unlock do próximo
- Curso completado: tela de celebração com troféu animado, estatísticas

## 9.9 Comportamento Mobile-First sem Degradar Desktop

- **Não** é um app mobile encapsulado. É uma experiência responsiva.
- Mobile: drawer, full-width, touch targets, compact header
- Desktop: sidebar persistente, mais espaço, breadcrumb completo, hover states
- Tablet (768-1024px): sidebar colapsa automaticamente, content area expande
- Transições desktop: hover states em outline items, focus rings
- Vídeos: mesmo aspect-ratio, diferente sizing

## 9.10 Acessibilidade

- Navegação por teclado: Tab através de outline → conteúdo → action bar
- Skip link: "Pular para conteúdo" no topo
- Focus visible: ring em todos os interativos
- ARIA labels: outline é `navigation`, content é `main`, action bar é `toolbar`
- Screen reader: anunciar step changes com `aria-live="polite"`
- Contraste: mínimo WCAG AA (4.5:1 para texto, 3:1 para UI)
- Motion: respeitar `prefers-reduced-motion` (desabilitar animações)

## 9.11 Prevenção de Cliques Errados

- Botões "Enviar" desabilitados até todas as questões respondidas
- Botões desabilitados visualmente distintos (opacity + cursor-not-allowed)
- Não há botões ambiguamente posicionados (ex: "Voltar" e "Próximo" nunca adjacentes sem separação clara)
- Ações destrutivas (abandonar atividade com respostas) pedem confirmação
- Touch targets: mínimo 44x44px em mobile

## 9.12 Redução de Ambiguidade

- Uma única ação primária por tela (sempre no mesmo lugar: action bar, direita)
- Labels descritivos: não "OK" ou "Continuar", mas "Próximo Step" ou "Iniciar Atividade"
- Estado atual sempre visível: breadcrumb + step indicator + outline highlight
- Nunca dois caminhos para a mesma ação

---

# 10. Plano de Implementação por Fases

## Fase 1: Fundação e Infraestrutura (Semana 1)

### Objetivo
Criar a base técnica que permite o novo fluxo coexistir com o atual.

### Escopo
- Definir as novas rotas `/learn/*` no `routes/index.tsx`
- Criar `LearningContext` (React Context)
- Criar `LearningShell` (layout vazio, sem conteúdo real)
- Criar `LearningHeader` (breadcrumb básico)
- Feature flag: `useLearningV2` hook que alterna entre rotas antigas e novas
- Configurar redirects das rotas antigas para as novas (inicialmente apontando para velhas com flag)

### Entregáveis
- Novas rotas registradas (acessíveis mas não default)
- `LearningContext` com interface definida
- `LearningShell` renderizando header + outline placeholder + content placeholder
- Feature flag funcional

### Riscos
- Rotas conflitantes com as existentes → mitigação: prefixo `/learn/` dedicado
- Feature flag complexa → mitigação: simples boolean no authStore

### Critérios de Aceitação
- Navegar para `/t/{slug}/app/learn/{courseId}` renderiza o shell vazio sem crash
- Shell renderiza dentro do AppLayout existente sem layout quebrado
- Feature flag desligado mantém fluxo atual 100% funcional

---

## Fase 2: Outline e Navegação (Semana 2)

### Objetivo
Implementar o outline (sidebar + drawer) e a navegação entre aulas via URL.

### Escopo
- `LearningOutline` (refatorar de `CourseOutlineSidebar`)
- `ModuleAccordion` com estado de expansão
- `LessonRow` com status visual
- `CourseProgressBar`
- Navegação: clicar em aula muda a URL
- Drawer mobile com backdrop e swipe
- `LearningHeader` com breadcrumb dinâmico baseado na URL

### Dependências
- Fase 1 completa
- Endpoint `course-interactive` existente (não muda)

### Entregáveis
- Outline funcional com módulos/aulas
- Navegação por URL funcionando
- Drawer mobile com animação

### Riscos
- N+1 queries de lock status → mitigação: batch endpoint ou cache agressivo
- Performance do outline com cursos grandes → mitigação: virtualização se >50 aulas

### Critérios de Aceitação
- Clicar em aula no outline muda a URL e atualiza breadcrumb
- Drawer abre/fecha com swipe no mobile
- Aula ativa destacada no outline
- Aulas bloqueadas mostram ícone de cadeado

---

## Fase 3: Step Player e Consumo de Aula (Semana 3-4)

### Objetivo
Implementar o consumo de steps dentro do novo shell.

### Escopo
- `StepView` com sub-componentes (`TextStepContent`, `VideoStepContent`, `ImageStepContent`, `ActivityStepContent`)
- `LearningActionBar` com navegação prev/next
- `LessonCompletionCard`
- Lógica de mark-as-viewed com optimistic update
- Animações de transição entre steps
- Suporte a `initialStepId` (retomada de progresso)

### Dependências
- Fase 2 completa
- Endpoint `timeline` existente (não muda)
- Endpoint `markViewed` existente (não muda)

### Entregáveis
- Steps renderizam corretamente (texto, vídeo, imagem, card de atividade)
- Navegação prev/next funciona
- Mark-as-viewed funciona com optimistic update
- Conclusão de aula funciona com transição para próxima

### Riscos
- Divergência com StepPlayer atual → mitigação: reutilizar lógica, não reescrever
- Vídeos não renderizam corretamente → mitigação: testar YouTube, Vimeo, direto
- `dangerouslySetInnerHTML` em texto → manter, mas sanitizar no backend

### Critérios de Aceitação
- Aluno pode consumir todos os tipos de step
- Step é marcado como viewed automaticamente
- Navegação entre steps é fluida
- Conclusão de aula mostra card de conclusão
- URL reflete o step atual (refresh funciona)

---

## Fase 4: Activity Flow Inline (Semana 4-5)

### Objetivo
Implementar o fluxo de atividades dentro do shell, sem abrir página separada.

### Escopo
- `ActivityFlow` component
- Integração com `QuestionRenderer` existente
- Submissão e resultado inline
- `ActivityResult` dentro do shell
- Navegação: entrar na atividade e sair da atividade via URL
- Tratamento de Sim Trading Challenge (full-screen dentro do shell)
- Todos os fluxos de erro e edge cases (bloqueio, expirado, vazio)

### Dependências
- Fase 3 completa
- Endpoints `activity`, `submit`, `submission-review` existentes (não mudam)
- `QuestionRenderer` e sub-renderers existentes (reutilizados)

### Entregáveis
- Atividades funcionam dentro do shell
- Submissão funciona com feedback inline
- Sim Trading Challenge funciona em tela cheia dentro do shell
- Edge cases tratados (bloqueio, erro, vazio)

### Riscos
- `ActivityFlow` herda complexidade de `ActivityPlayerPage` (587 linhas) → mitigação: decompor em sub-componentes menores
- Sim Trading precisa de tela cheia → mitigação: shell entra em "fullscreen mode" (esconde outline e header)
- Estado de respostas perdido ao navegar fora → mitigação: warning antes de sair se há respostas não submetidas

### Critérios de Aceitação
- Aluno pode responder todas as questões de uma atividade
- Submissão funciona e resultado aparece inline
- Review funciona com todas as políticas (IMMEDIATE, AFTER_DATE, NEVER)
- Sim Trading Challenge funciona
- Após atividade, aluno volta ao step correto da aula
- Progresso atualiza no outline após completar atividade

---

## Fase 5: Course Overview e Dashboard Integration (Semana 5-6)

### Objetivo
Implementar a visão geral do curso e integrar com o Dashboard.

### Escopo
- `CourseOverview` (visão geral quando nenhuma aula selecionada)
- Atualizar `ContinueCard` no Dashboard para navegar para `/learn/` URLs
- Redirects das rotas antigas (`/courses/:courseId/interactive`, `/lessons/:lessonId`, etc.)
- `CourseCompletionCard`

### Dependências
- Fase 4 completa
- Dashboard existente

### Entregáveis
- Visão geral do curso funciona no novo shell
- Dashboard "Continue" navega para o novo fluxo
- Rotas antigas redirecionam para as novas

### Riscos
- Dashboard ContinueCard assume rotas antigas → mitigação: atualizar paths
- Redirects podem quebrar bookmarks → mitigação: 301 permanente

### Critérios de Aceitação
- Entrar no curso pela primeira vez mostra overview
- "Continuar" no Dashboard navega para `/learn/` com step correto
- Rotas antigas redirecionam corretamente
- Conclusão do curso mostra tela de celebração

---

## Fase 6: Polish, QA e Rollout (Semana 6-8)

### Objetivo
Polimento final, QA extensivo, e rollout controlado.

### Escopo
- Teste manual de todos os fluxos em desktop e mobile
- Teste de acessibilidade (keyboard nav, screen reader)
- Performance audit (Lighthouse, bundle size)
- Ajustes de animação e transição
- Correção de bugs encontrados
- Feature flag: habilitar para 10% → 50% → 100%
- Remover código antigo (sprint seguinte ao 100%)

### Entregáveis
- Novo fluxo em produção para todos os usuários
- Bugs críticos corrigidos
- Performance aceitável (LCP < 2.5s, CLS < 0.1)

### Riscos
- Bugs em produção → mitigação: feature flag permite rollback instantâneo
- Performance regression → mitigação: lazy loading de componentes pesados
- Resistência de usuários → mitigação: novo fluxo é objetivamente superior

### Critérios de Aceitação
- Zero bugs críticos em qualquer fluxo
- Lighthouse score > 90 em performance
- Keyboard navigation funciona em todo o fluxo
- Feature flag em 100% sem incidentes

---

# 11. Riscos e Mitigação

## Risco 1: Quebra de experiência existente durante migração

**Probabilidade**: Média | **Impacto**: Alto

**Mitigação**: Feature flag garante que o fluxo antigo permanece 100% funcional até que o novo esteja validado. As rotas `/learn/` são aditivas, não substitutivas. Rollback é instantâneo.

## Risco 2: Regressão no Sim Trading Terminal

**Probabilidade**: Baixa | **Impacto**: Alto

**Mitigação**: O `SimTradingTerminal` (27 arquivos) não é tocado. Apenas o wrapper muda (de `ActivityPlayerPage` para `ActivityFlow` dentro do shell). O componente é integrado como-is. Testes manuais extensivos em todos os modos (PRACTICE, CHALLENGE).

## Risco 3: N+1 queries no outline (lock status)

**Probabilidade**: Alta (já existe hoje) | **Impacto**: Médio

**Mitigação**: Batch request para lock status (uma query que retorna status de todas as aulas de um curso). Se não for viível no backend imediato, usar staleTime agressivo (5 min) e cache compartilhado.

## Risco 4: Perda de estado em respostas de atividade

**Probabilidade**: Média | **Impacto**: Médio

**Mitigação**: Warning modal se o aluno tentar navegar para fora da atividade com respostas não submetidas. "Suas respostas serão perdidas. Deseja sair?" Futuramente: persistência local (localStorage ou IndexedDB) como rascunho.

## Risco 5: Performance com cursos grandes (50+ aulas)

**Probabilidade**: Baixa | **Impacto**: Médio

**Mitigação**: Outline renderiza módulos colapsados por default (só o ativo expandido). Virtualização com `react-window` se necessário. Lazy loading de dados de aula (só carrega timeline quando a aula é aberta).

## Risco 6: Complexidade do LearningContext crescer

**Probabilidade**: Média | **Impacto**: Baixo

**Mitigação**: Context é read-only para componentes filhos. Só o `LearningShell` e `LearningRoute` escrevem. Interface bem definida e documentada. Se crescer, decompor em sub-contexts (navigation context, course data context).

## Risco 7: Discrepância entre dados do outline e dados da aula

**Probabilidade**: Baixa | **Impacto**: Médio

**Mitigação**: `course-interactive` é a fonte de verdade para estrutura. `timeline` é a fonte para steps. Queries invalidadas juntas quando há mudança de progresso. Se dados divergem, o servidor é a verdade (nunca calcular localmente).

## Risco 8: Mobile browser inconsistências (Safari, Chrome Android)

**Probabilidade**: Média | **Impacto**: Médio

**Mitigação**: Testar em Safari iOS e Chrome Android desde a Fase 2. Usar `dvh` (dynamic viewport height) para action bar fixa. Respeitar safe areas (notch). Swipe drawer com `touch-action: pan-y`.

---

# 12. Critérios de Aceitação e Sucesso

## Critérios Qualitativos

### Clareza de Progresso
- [ ] O aluno sempre sabe quantas aulas completou e quantas faltam
- [ ] O progresso é visível em pelo menos 2 pontos da tela (outline + header/action bar)
- [ ] Não há momento onde o aluno pensa "onde estou?"

### Continuidade de Aprendizado
- [ ] Após completar uma aula, o próximo passo é óbvio e requer 1 clique
- [ ] O "Continuar de onde parei" posiciona no step correto em 100% dos casos
- [ ] Não há tela intermediária desnecessária entre o aluno e o conteúdo

### Navegação Previsível
- [ ] O botão "Voltar" sempre leva para um lugar lógico, documentado na seção 8
- [ ] Refresh não perde contexto (URL reflete estado)
- [ ] Deep link funciona para qualquer aula/step/atividade

### Experiência Mobile
- [ ] Todas as funcionalidades estão acessíveis em mobile
- [ ] Touch targets são ≥ 44px
- [ ] Drawer abre/fecha sem lag
- [ ] Vídeos reproduzem corretamente

### Acessibilidade
- [ ] Navegação completa por teclado (Tab, Enter, Escape)
- [ ] Screen reader anuncia mudanças de step/atividade
- [ ] Contraste mínimo WCAG AA em todo o fluxo

## Critérios Quantitativos

| Métrica | Baseline (atual) | Meta (novo) | Medição |
|---------|-----------------|-------------|---------|
| Taxa de abandono no primeiro acesso ao curso | (medir) | -30% vs baseline | Analytics |
| Tempo médio para retomar estudo (do Dashboard ao conteúdo) | (medir) | < 5 segundos | Analytics |
| Taxa de conclusão de aulas | (medir) | +15% vs baseline | Backend |
| Bugs de navegação reportados por mês | (medir) | -80% vs baseline | Suporte |
| Tickets de suporte relacionados ao player | (medir) | -70% vs baseline | Suporte |
| Lighthouse Performance Score | (medir) | > 90 | Lighthouse |
| Cumulative Layout Shift (CLS) | (medir) | < 0.1 | Web Vitals |
| Largest Contentful Paint (LCP) | (medir) | < 2.5s | Web Vitals |
| First Input Delay (FID) / INP | (medir) | < 200ms | Web Vitals |

### Métricas de Confirmação de Sucesso (8 semanas pós-rollout)

- [ ] Zero bugs críticos relacionados a navegação no learning flow
- [ ] Taxa de conclusão de cursos aumentou em pelo menos 10%
- [ ] Tempo médio de sessão de estudo aumentou
- [ ] NPS do produto aumentou ou manteve
- [ ] Zero reclamações de "não sei onde estou" ou "botão voltar não funciona"

---

# 13. Recomendação Final

A experiência de aprendizagem atual da Trivestia sofre de problemas estruturais profundos que não são resolvidos com patches incrementais: duplicação de componentes de aula, navegação ambígua, estado fragmentado, layout não imersivo, e desconexão entre atividade e fluxo do curso.

A recomendação é **rebuild por camadas com coexistência via feature flag**. Isso permite construir uma fundação nova e sólida sem quebrar o que está em produção, migrando progressivamente ao longo de 6 a 8 semanas.

As decisões arquiteturais mais importantes são:

1. **Single Shell**: Um único `LearningShell` imersivo que substitui a fragmentação atual entre CourseInteractivePage, LessonPage e ActivityPlayerPage.

2. **URL como estado**: O step, a aula, e a atividade ativos vivem na URL. Isso resolve refresh, deep link, back/forward, e elimina `navigate(-1)`.

3. **Atividade inline**: Atividades são consumidas dentro do shell, não em páginas separadas. Isso mantém o contexto pedagógico e elimina a desconexão.

4. **Server-driven navigation**: O `courseInteractive.next` do backend determina o próximo passo. O frontend nunca calcula isso localmente.

5. **Componentes reutilizados**: QuestionRenderer, ChartMarkupRenderer, RiskCalculatorRenderer, SimTradingTerminal não são reescritos. A camada de renderização é boa; a camada de orquestração é o que precisa ser reconstruída.

Esta especificação está pronta para orientar a execução. A fase 1 pode começar imediatamente, e cada fase subsequente tem dependências claras e critérios de aceitação verificáveis.

O core do produto da Trivestia é o learning experience. Ele precisa ser impecável. Esta é a especificação para chegar lá.
