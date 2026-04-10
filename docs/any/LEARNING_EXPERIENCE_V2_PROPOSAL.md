# LEARNING EXPERIENCE V2 — Proposta Completa de Redesign

> **Autor**: Principal Product Design Engineer + Staff Frontend UX Architect  
> **Data**: 2026-04-09  
> **Base**: Auditoria completa de 22 componentes + 3 módulos de infraestrutura  
> **Status**: Proposta aguardando aprovação para execução

---

# 1. Diagnóstico da Experiência Atual

## 1.1 Visão Geral

A implementação atual é **arquiteturalmente sólida** — context split, serial markViewed, rotas aninhadas, stepId determinístico. Mas a camada de apresentação está claramente abaixo do nível esperado para o core do produto. Parece um "módulo fullscreen em cima do que já existia" — funcional, mas sem refinamento.

## 1.2 Problemas Específicos por Componente

### Header (LearningHeader.tsx)
- **Altura inadequada**: `h-12 md:h-14` (48/56px) — muito apertado para a barra mais importante do learning
- **Breadcrumb feio**: usa `>` como separador de texto — parece placeholder, não produto
- **Progresso quase invisível**: `text-xs` (12px) escondido no canto direito — o usuário nunca nota
- **Botão de voltar sem personalidade**: `h-9` com texto genérico "Voltar ao dashboard" — não comunica hierarquia
- **Botão de outline genérico**: ícone Menu hamburger não contextualizado — o aluno não sabe o que faz

### Action Bar (LearningActionBar.tsx)
- **Pequena demais**: `h-14 md:h-16` (56/64px) para a área de navegação principal
- **Centro inútil**: `text-xs text-muted-foreground` mostrando "Step 3 de 10" — quase invisível e desperdiça o centro da barra
- **Botão "Anterior" fraco**: outline minúsculo, sem peso visual
- **Botão "Próximo" sem urgência**: `px-3` é pouco padding para o CTA principal do sistema
- **Sem progresso visual**: nenhum indicador de progresso na barra — o aluno não sabe onde está no todo
- **Sem transição**: estados disabled com `opacity-40` — parece quebrado, não desabilitado

### Outline (LearningOutline.tsx)
- **Status dots invisíveis**: `h-1.5 w-1.5` (6px) — falha em qualquer teste de acessibilidade
- **Largura fixa subutilizada**: `w-72` (288px) ocupados com informações esparsas
- **Sem indicador de step ativo**: só mostra a aula ativa, não o step dentro da aula
- **Nenhum indicador de tipo**: o aluno não distingue aulas com vídeo de aulas com atividade

### StepView (StepView.tsx)
- **Container de step genérico**: `rounded-2xl border bg-card p-5 md:p-6` — parece um card qualquer, não uma área de leitura
- **Título `text-xl` (20px)** pequeno para ser o foco principal da tela
- **Subtitle `text-sm text-muted-foreground`** — aula atual está em texto secundário e pequeno
- **Nenhum indicador de tipo de conteúdo**: o aluno não sabe se vai ver texto, vídeo, imagem ou atividade

### StepContentRenderers
- **Prose com `text-muted-foreground`**: texto de corpo em cor secundária — legibilidade ruim
- **PDF abre fora do fluxo**: `<a href={url} target="_blank">` — expulsa o usuário do learning
- **ActivityStepCard com ícone ExternalLink**: o botão diz "Iniciar atividade" com ícone de link externo — enganoso, a atividade abre inline
- **Sem skeleton para mídia**: imagens e vídeos mostram um quadrado preto/cinza até carregar

### CourseOverview
- **ContinueLearningCard com texto vago**: "Próximo destino: step da aula atual" — o aluno não sabe o que isso significa
- **Lesson rows apertadas**: `px-3 py-2` com ícones `h-4 w-4` — toque mínimo em mobile
- **"Bloqueada" sem explicação**: o aluno não entende por que não pode acessar
- **Sem ordem visual clara**: modules e lessons competem pelo mesmo nível de atenção

### ActivityFlow
- **Sem progresso de questões**: o aluno responde 5 questões sem nunca ver um progress bar
- **"Refazer atividade" sem confirmação**: um clique acidental apaga todas as respostas
- **Resultado com Trophy em amarelo para reprovação**: amarelo não comunica falha — comunica aviso
- **Review com cores muito sutis**: `bg-green-500/5` e `bg-red-500/5` — quase invisíveis

### CompletionCards
- **Sem celebração**: completar um curso é o momento mais importante — a tela é um card estático
- **Resumo com `text-xs`**: labels dos SummaryCards são 12px — diminui a importância
- **"Atualizar resumo" como botão outline**: confuso — parece secundário mas está no topo

### Problemas Sistêmicos
- **Diacríticos faltando**: "Nao" em vez de "Não", "concluida" em vez de "concluída" — pareçe não-polido
- **Sem atalhos de teclado**: nenhum suporte para navegação por teclado
- **ChatFloating visível durante learning**: distração durante atividades
- **Sem animação de transição entre steps**: conteúdo aparece instantaneamente
- **Dark mode não testado**: várias cores hardcoded para tema claro

## 1.3 Impacto por Prioridade

| Prioridade | Problema | Impacto no Aluno |
|---|---|---|
| P0 | PDF abre fora do fluxo | Perde contexto, não volta |
| P0 | Action bar quase invisível | Não sabe como avançar |
| P1 | Header sem personalidade | Sensação de produto barato |
| P1 | Nenhum progresso visível no fluxo | Não sabe onde está |
| P1 | Atrito excessivo no overview | Clica demais para começar |
| P2 | Diacríticos faltando | Parece descuidado |
| P2 | Review com cores invisíveis | Não percebe acertos/erros |
| P2 | States de erro sem ícone | Parece vazio, não erro |

---

# 2. Princípios da Learning Experience V2

## P1. O Conteúdo é o Heroi

**Por quê**: O aluno está aqui para aprender. Cada pixel que não é conteúdo é custo. A interface deve maximizar a área de conteúdo e minimizar cromagnência visual.

**Aplicação**:
- Header compacto mas com presença
- Action bar com propósito claro sem roubar espaço
- Sidebar que aparece quando precisa, some quando não precisa

## P2. Uma Ação Principal por Contexto

**Por quê**: Alunos com baixa familiaridade digital travam quando veem múltiplas opções com peso igual. Cada tela deve ter uma ação óbvia.

**Aplicação**:
- Step de leitura: "Próximo" é o CTA dominante
- Step de atividade: "Iniciar atividade" é o CTA dominante
- Resultado: "Continuar" é o CTA dominante
- Nunca dois CTAs primários simultâneos

## P3. Progresso Sempre Visível

**Por quê**: A sensação de avanço é o principal motor de engajamento em plataformas de aprendizagem. Sem feedback de progresso, o aluno abandona.

**Aplicação**:
- Progress bar na action bar (não no header)
- Step indicator claro: "Etapa 3 de 12"
- Progresso do curso sempre acessível com um olhar

## P4. Zero Ambiguidade de Navegação

**Por quê**: Se o aluno precisa pensar "onde estou?" ou "o que faço agora?", a interface falhou.

**Aplicação**:
- Breadcrumb semântico com ícones (não texto `>`)
- Labels de botão que descrevem a ação seguinte
- Nunca "Próximo" genérico quando podemos dizer "Próximo: Tipos de Order"

## P5. Continuidade Visual

**Por quê**: Transições abruptas quebram a sensação de fluxo. O aluno deve sentir que está se movendo através de um único espaço, não pulando entre telas.

**Aplicação**:
- Transição suave entre steps (fade + slide)
- Manter cores e proporções consistentes entre estados
- Entrada no learning com transição, não corte

## P6. Aparência Premium Não é Decoração

**Por quê**: A percepção de qualidade visual afeta diretamente a percepção de qualidade do conteúdo. Um curso de trading em uma interface que parece "beta" perde credibilidade.

**Aplicação**:
- Espaçamento generoso e consistente
- Tipografia com hierarquia clara
- Cores com contraste adequado
- Micro-interações sutis (hover, focus, transitions)

## P7. Menos Cliques, Mais Fluxo

**Por quê**: Cada clique é uma decisão. Cada decisão é custo cognitivo. O fluxo ideal é: entrar → consumir → avançar → concluir.

**Aplicação**:
- Auto-avanço quando apropriado (ex: após vídeo, ir para próximo step)
- Eliminar cliques de confirmação desnecessários
- Manter o aluno dentro do shell — nunca abrir aba externa

## P8. PDF é Conteúdo, Não Link

**Por quê**: PDFs são frequentemente o material mais denso do curso. Abrir fora do fluxo é a maior fonte de perda de contexto e abandono.

**Aplicação**:
- PDF embutido no shell com viewer interno
- Navegação entre páginas sem sair do contexto
- Retorno ao step com um único clique

---

# 3. Redesign Estrutural da Tela

## 3.1 Layout Geral — Antes vs Depois

### Antes (Atual)
```
┌─────────────────────────────────────────────────────────┐
│ Header (48px): ← Voltar | Course > Module > Lesson | % │
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│ Outline│  Content (max-w-6xl, px-4 py-4)               │
│ (w-72) │  ┌──────────────────────────────────┐         │
│        │  │ Card border bg-card p-5           │         │
│ mod 1  │  │  Title text-xl                    │         │
│  les 1 │  │  Subtitle text-sm muted           │         │
│  les 2 │  │  [content area]                   │         │
│ mod 2  │  │                                   │         │
│  les 3 │  └──────────────────────────────────┘         │
│        │                                                │
├────────┴────────────────────────────────────────────────┤
│ Footer (56px): [Anterior] Step 3 de 10 [Próximo]       │
└─────────────────────────────────────────────────────────┘
```

### Depois (V2)
```
┌─────────────────────────────────────────────────────────┐
│ Header (56px): [←] Course / Module / Lesson    [≡] 65% │
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│ Outline│  ┌──────────────────────────────────────────┐  │
│ (280px)│  │                                          │  │
│        │  │  TIPO: Artigo                           │  │
│ ▾ Mod 1│  │  Título do Step                         │  │
│   ● L1 │  │  Aula: Nome da Aula                     │  │
│   ○ L2 │  │                                          │  │
│ ▸ Mod 2│  │  [conteúdo em tela cheia,                │  │
│   ○ L3 │  │   sem card wrapper,                      │  │
│        │  │   com tipografia generosa]                │  │
│        │  │                                          │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
├────────┴────────────────────────────────────────────────┤
│ ████████░░░░░░░░░░░░░░░░░░░  Etapa 3/12                │
│ [← Anterior]                              [Próximo →]   │
└─────────────────────────────────────────────────────────┘
```

## 3.2 Mudanças Estruturais

### A. Remover card wrapper do conteúdo principal

**Antes**: StepView renderiza dentro de `rounded-2xl border bg-card p-5 shadow-sm` — um card dentro do shell.

**Depois**: Conteúdo renderiza diretamente na área principal, sem border/card. O shell já é o container. O card wrapper adiciona borda visual que diminui a área útil e cria uma sensação de "conteúdo encaixotado".

### B. Outline mais inteligente

**Antes**: Lista plana de módulos > aulas com dots de 6px.

**Depois**: Outline com indicadores visuais de tipo de conteúdo, progresso por aula, e destaque do step ativo (não só da aula). Manter largura similar mas com melhor uso do espaço.

### C. Action bar com progresso integrado

**Antes**: Barra com 3 seções — botão fraco, label invisível, botão primário.

**Depois**: Progress bar ocupa a largura total da barra. Abaixo: botão anterior, label central com step atual, botão próximo com label contextual.

---

# 4. Redesign do Header e Breadcrumb

## 4.1 Problemas Atuais

1. Altura `h-12` (48px) — apertado para conter breadcrumb, progresso e ações
2. Separador `>` em texto — parece placeholder
3. Progresso `text-xs` — invisível
4. Botão outline genérico (ícone Menu) — sem significado claro
5. Back button genérico "Voltar ao dashboard" — não contextual

## 4.2 Proposta V2

### Dimensões
- Desktop: `h-14` (56px) — espaço suficiente para breadcrumb legível
- Mobile: `h-12` (48px) — compacto mas funcional

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [←] Curso de Trading / Módulo 3 / Análise Técnica [≡]│
│                                    Progresso: 65%     │
└──────────────────────────────────────────────────────┘
```

### Mudanças Específicas

**A. Back button contextual e compacto**
- Apenas ícone `ChevronLeft` (16px) em um botão circular `h-8 w-8 rounded-full`
- Tooltip no hover com o destino real ("Voltar para Análise Técnica" ou "Voltar ao dashboard")
- No mobile: só ícone, sem texto

**B. Breadcrumb com ChevronIcons**
- Separadores: `ChevronRight` (14px) em `text-muted-foreground/50`
- Cada segmento truncatable individualmente
- Último segmento em `font-semibold text-foreground` (não muted)
- Course e Module são clicáveis (navegam para overview e scroll para module)
- Lesson é o segmento ativo (não clicável, é onde está)

**C. Progresso visível**
- Desktop: pill/badge compacto com percentage — `rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary`
- Mobile: escondido (progresso fica na action bar)
- Cor primária, não muted — o aluno precisa ver

**D. Botão de outline**
- Ícone `PanelLeftOpen` / `PanelLeftClose` (não Menu hamburger genérico)
- Tooltip: "Estrutura do curso"
- Toggle state visual (ícone muda quando outline está aberto)

**E. Frosted glass aprimorado**
- `bg-background/80 backdrop-blur-lg` — mais blur que o atual
- Border-bottom sutil: `border-b border-border/50`
- Sombra mínima: `shadow-sm` para criar profundidade

## 4.3 Tipografia do Breadcrumb

| Elemento | Tamanho | Peso | Cor |
|---|---|---|---|
| Course name | `text-sm` (14px) | `font-medium` | `text-muted-foreground` hover:text-foreground |
| Separator | 14px icon | — | `text-muted-foreground/40` |
| Module name | `text-sm` (14px) | `font-medium` | `text-muted-foreground` hover:text-foreground |
| Separator | 14px icon | — | `text-muted-foreground/40` |
| Lesson name | `text-sm` (14px) | `font-semibold` | `text-foreground` |

---

# 5. Redesign da Action Bar Inferior

## 5.1 Problemas Atuais

1. **Altura `h-14/h-16`**: pequena para a área de navegação principal
2. **Centro desperdiçado**: `text-xs` mostrando "Step 3 de 10" é quase invisível
3. **Botão anterior fraco**: outline sem peso visual
4. **CTA sem urgência**: `px-3` é pouco padding para o botão mais importante
5. **Sem progresso visual**: nenhum indicador de progresso na barra
6. **Labels genéricos**: "Próximo" em vez de "Próximo: Nome do Step"

## 5.2 Proposta V2

### Dimensões
- Desktop: `h-20` (80px) — espaço para progress bar + botões
- Mobile: `h-[72px]` — touch-friendly

### Layout V2
```
┌──────────────────────────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Etapa 3/12│
│                                                          │
│ [← Anterior]                              [Próximo step →]│
└──────────────────────────────────────────────────────────┘
```

### Mudanças Específicas

**A. Progress bar integrada na top-edge da barra**
- Ocupa largura total da action bar
- Altura: `h-1.5` — sutil mas visível
- Cor: `bg-primary` com transição suave na largura
- Label "Etapa 3 de 12" à direita da progress bar em `text-xs font-medium`

**B. Área de botões com mais espaço**
- Altura restante (após progress bar): `h-16` para botões
- Gap generoso entre botão anterior e próximo

**C. Botão "Anterior" aprimorado**
- `h-10 px-4 rounded-lg border text-sm font-medium`
- Ícone `ChevronLeft` (16px) + "Anterior"
- Hover: `bg-accent`
- Disabled: `opacity-50` (não 40) + `cursor-not-allowed`
- Focus ring visível

**D. CTA "Próximo" dominante e contextual**
- `h-10 px-5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground`
- Label dinâmica com contexto:
  - Steps: "Próximo step" ou "Próximo: Nome do Step"
  - Fim da aula: "Próxima aula" ou "Próxima: Nome da Aula"
  - Atividade: "Iniciar atividade"
  - Curso completo: "Concluir curso"
- Ícone `ChevronRight` (16px) à direita do texto
- Hover: `brightness-110` (não opacity — opacity sugere disabled)
- Active: `scale-[0.98]` — feedback de toque
- Focus ring visível
- Min-width: `160px` — nunca pequeno demais

**E. Label central**
- Em activities: "Questão 3 de 5" em `text-sm font-medium`
- Em steps: omitir (progress bar + label já comunicam posição)
- Em resultado: "Resultado" em `text-sm font-medium`

**F. Sombra superior sutil**
- `shadow-[0_-1px_3px_rgba(0,0,0,0.05)]` — separa visualmente do conteúdo
- Frosted glass: `bg-background/90 backdrop-blur-lg`

## 5.3 States Especiais da Action Bar

| Contexto | Esquerda | Centro | Direita (CTA) |
|---|---|---|---|
| Primeiro step | (disabled) | Etapa 1/12 | Próximo step |
| Step intermediário | ← Anterior | (via progress bar) | Próximo: Nome do step |
| Último step + tem next | ← Anterior | (via progress bar) | Próxima aula |
| Step de atividade | ← Voltar à aula | — | Iniciar atividade |
| Questão intermediária | ← Questão anterior | Questão 3/5 | Próxima questão |
| Última questão | ← Questão anterior | Questão 5/5 | Enviar respostas |
| Enviando | (disabled) | Enviando... | (disabled, spinner) |
| Resultado | ← Voltar à aula | Resultado | Continuar |
| Curso completo | ← Anterior | (via progress bar) | Concluir curso ✓ |

---

# 6. Estratégia de Visualização de PDF Dentro do Sistema

## 6.1 Problema Atual

```tsx
// StepContentRenderers.tsx — linha atual
<a href={articleAttachmentUrl} target="_blank" rel="noreferrer" ...>
  Abrir material em PDF
</a>
```

O PDF abre em uma nova aba. O aluno:
1. Perde o contexto do learning
2. Não tem como marcar como viewed
3. Precisa voltar manualmente à aba original
4. Pode esquecer de voltar

## 6.2 Abordagem Escolhida: Split View com Overlay Fallback

### Abordagem Principal: Split View (Desktop)

Em desktop/notebook (>1024px), o PDF abre ao lado do conteúdo:

```
┌──────────────────────────────────────────────────────────┐
│ Header com indicação "Visualizando PDF"                  │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│  Step content          │  PDF Viewer                     │
│  (texto do artigo,     │  ┌─────────────────────────┐   │
│   contextual info)     │  │ [<<] [1/12] [>>] [✕]    │   │
│                        │  │                          │   │
│                        │  │   [rendered PDF page]    │   │
│                        │  │                          │   │
│                        │  │                          │   │
│                        │  └─────────────────────────┘   │
│                        │                                 │
├────────────────────────┴─────────────────────────────────┤
│ Action Bar (com "Voltar ao step" como CTA)               │
└──────────────────────────────────────────────────────────┘
```

**Detalhes do Split View**:
- Step content colapsa para ~40% da largura
- PDF viewer ocupa ~60% da largura
- O outline sidebar é automaticamente escondido para maximizar espaço
- Controles do PDF: página anterior/próxima, número da página, zoom, e botão fechar
- O viewer usa `<canvas>` rendering (via react-pdf ou pdfjs-dist) — sem iframe de Google Docs

### Abordagem Fallback: Fullscreen Overlay (Mobile)

Em mobile (<1024px), o PDF abre como overlay fullscreen:

```
┌──────────────────────────────┐
│ [← Voltar ao step] PDF    [✕]│
├──────────────────────────────┤
│                              │
│   [rendered PDF page]        │
│                              │
│                              │
│                              │
├──────────────────────────────┤
│  [<] Página 3 de 12 [>] [✕] │
└──────────────────────────────┘
```

**Detalhes do Overlay Mobile**:
- Header minimal com botão de voltar e título do documento
- Footer com paginação
- Pinch-to-zoom nativo
- Swipe horizontal para trocar página (opcional)

### Implementação Técnica

**Biblioteca recomendada**: `react-pdf` (wrapper sobre `pdfjs-dist`)
- Renderiza em `<canvas>` — performance boa, sem dependência de iframe
- Suporta paginação, zoom, e lazy loading de páginas
- Bundle size aceitável (~200KB com worker)

**Componente**: `<PdfViewer>`
- Props: `url`, `onClose`, `mode: 'split' | 'overlay'`
- Renderiza páginas sob demanda (não carrega todas de uma vez)
- Persiste página atual em estado local (não perde ao trocar)
- Indicador de loading por página

### Integração com StepContentRenderers

**Antes** (link externo):
```tsx
<a href={url} target="_blank">Abrir material em PDF</a>
```

**Depois** (botão inline):
```tsx
<button onClick={() => openPdf(url)}>Ver material em PDF</button>
```

O PDF não substitui o conteúdo do step — é uma camada complementar. O step content permanece visível (em split view) ou acessível via botão "Voltar ao step" (em overlay).

### Quando usar cada modo

| Cenário | Modo | Por quê |
|---|---|---|
| Step tipo CONTENT_TEXT com PDF anexo | Split view (desktop) | O texto contextualiza o PDF; aluno consulta ambos |
| Step tipo CONTENT_TEXT com PDF anexo | Overlay (mobile) | Tela pequena não suporta split |
| PDF como material complementar de atividade | Overlay (ambos) | O foco deve ser a atividade, não o PDF |
| PDF como documento principal do step | Split view (desktop) | O PDF é o conteúdo; sidebar de texto apoia |

---

# 7. Redução de Cliques e Atrito

## 7.1 Fluxo Atual vs Proposto

### Entrada no Curso

**Atual** (5+ cliques):
1. Dashboard → Clica "Continue de onde parou" 
2. Vai para CourseOverview
3. Vê a overview completa do curso
4. Clica ContinueLearningCard
5. Vai para LessonRedirect
6. Redirect para StepView

**Proposto** (1-2 cliques):
1. Dashboard → Clica "Continue de onde parou" → Vai direto para o step correto
2. Se quiser overview, clica breadcrumb "Course name"

### Entrada em Atividade

**Atual** (3 cliques):
1. No step ACTIVITY → Vê card "Continue para a atividade deste step"
2. Clica "Iniciar atividade"
3. ActivityFlow carrega

**Proposto** (1 clique):
1. No step ACTIVITY → O card mostra preview da atividade + "Iniciar" como CTA único
2. Clica → entra direto

### Após Resultado de Atividade

**Atual** (2-3 cliques):
1. Vê resultado
2. Clica "Continuar" (label genérico)
3. Pode cair em overview se não houver next

**Proposto** (1 clique):
1. Vê resultado com feedback visual imediato
2. CTA "Próxima: Nome da Aula" (label contextual)
3. Ou CTA "Concluir curso" se for o último

## 7.2 Eliminações de Clique

| Clique Eliminado | Como | Impacto |
|---|---|---|
| Overview → ContinueCard → Lesson | Dashboard link direto ao step | -2 cliques por sessão |
| ActivityStepCard → Iniciar | Auto-transição quando step é só atividade | -1 clique |
| Voltar ao overview → Selecionar lesson | Breadcrumb clicável no header | -1 clique |
| Resultado → Dashboard → Voltar | CTA contextual no resultado | -1 clique |

## 7.3 Auto-comportamentos

| Comportamento | Gatilho | Ação |
|---|---|---|
| Auto-expandir módulo ativo | Ao entrar em step de um módulo | Outline já mostra o módulo aberto |
| Auto-rolagem para step ativo | Ao entrar em step | Outline scrolla para o item ativo |
| Fechar outline em mobile | Ao navegar | Drawer fecha automaticamente (já existe) |
| Esconder outline em split PDF | Ao abrir PDF em desktop | Sidebar esconde para dar espaço |

## 7.4 Confirmações Necessárias

| Ação | Confirma? | Por quê |
|---|---|---|
| Refazer atividade | SIM | Perde respostas atuais |
| Sair de atividade sem enviar | NÃO | Respostas ficam em estado local |
| Navegar para outro step | NÃO | markViewed é automático |
| Abrir PDF | NÃO | Viewer inline, não perde contexto |

---

# 8. Melhor Aproveitamento de Tela

## 8.1 Desktop (≥1280px)

### Antes
- Outline: `w-72` (288px) fixo
- Content: `max-w-6xl` (1152px) com `px-4` → ~1140px útil
- Na prática: se outline está aberto, content area ≈ 1140 - 288 = 852px
- Dentro do content: card wrapper com `p-5 md:p-6` → perde mais ~48px

### Depois
- Outline: `w-[280px]` com toggle suave — semelhante, mas com melhor uso interno
- Content: `max-w-none` — ocupa toda a largura restante (sem max-w artificial)
- Padding interno: `px-8 py-6` — generoso, mas sem card wrapper
- Resultado: content area ≈ 1280 - 280 - 64 (padding) = ~936px útil

### Ganho
- ~84px a mais de largura útil de conteúdo
- Remoção do card wrapper elimina bordas visuais desnecessárias
- Typography pode usar mais largura (melhor para texto corrido)

## 8.2 Notebook (1024-1279px)

### Antes
- Outline visível, mas `max-w-6xl` + outline compete por espaço
- Texto pode ficar apertado (~560px útil em 1024px)

### Depois
- Outline colapsa automaticamente em telas <1280px (não <1024px)
- Content ocupa largura total com `px-6`
- Toggle manual via botão no header

## 8.3 Mobile (<768px)

### Antes
- Outline em drawer lateral (bom)
- Content com `px-4 py-4` (16px padding) — ok mas podia ser mais
- Action bar `h-14` (56px) — pouco para toque

### Depois
- Content com `px-4 py-5` — mais breathing room vertical
- Action bar `h-[72px]` — touch targets maiores
- Botões: `min-h-[44px]` — Apple HIG minimum touch target
- PDF em overlay fullscreen — não compete com conteúdo

## 8.4 Proporções Recomendadas

| Viewport | Outline | Content Padding | Action Bar Height |
|---|---|---|---|
| ≥1440px | 280px, aberto | 32px horizontal | 80px |
| 1280-1439px | 280px, aberto | 24px horizontal | 80px |
| 1024-1279px | Colapsado, toggle | 24px horizontal | 72px |
| 768-1023px | Drawer | 20px horizontal | 72px |
| <768px | Drawer | 16px horizontal | 72px |

---

# 9. Pontos de Confusão e Como Resolver

## 9.1 "Onde estou?"

**Problema**: O breadcrumb usa texto `>` e o nome da aula pode truncar. O aluno não sabe em qual módulo/aula/step está.

**Solução V2**:
- Breadcrumb com `ChevronRight` icons e truncagem inteligente (trunca module, nunca lesson)
- Outline destaca aula E step ativo (não só aula)
- Header mostra progresso em badge visível

## 9.2 "O que faço agora?"

**Problema**: Após completar um step, o label "Próximo" é genérico. O aluno não sabe o que vem.

**Solução V2**:
- Label contextual no CTA: "Próximo: Análise de Candlestick" em vez de "Próximo"
- Se for atividade: "Iniciar: Quiz de Padrões" com ícone diferente
- Se for fim de aula: "Próxima aula: Gestão de Risco"

## 9.3 "Como voltar?"

**Problema**: O botão de voltar no header diz "Voltar ao dashboard" mas o aluno quer voltar ao step anterior, não sair do curso.

**Solução V2**:
- Header back button: contextual (volta para overview do curso, não dashboard)
- Action bar "Anterior": volta ao step anterior dentro da mesma aula
- Nunca "Voltar ao dashboard" como ação primária — dashboard é secondary

## 9.4 "Como abrir materiais?"

**Problema**: PDF abre em nova aba, sem indicador visual claro. Imagens são pequenas.

**Solução V2**:
- PDF: botão destacado "Ver material em PDF" com ícone de documento
- Abre no viewer interno (split view / overlay)
- Imagens: clique para expandir em lightbox (já existe via QuestionImage pattern)
- Vídeos: player embutido com aspect-video (já funciona bem)

## 9.5 "Quando a atividade começa?"

**Problema**: O step ACTIVITY mostra um card com "Continue para a atividade deste step sem sair do learning shell." — texto vago, ícone ExternalLink enganoso.

**Solução V2**:
- Card com preview: título da atividade, número de questões, tipo
- CTA claro: "Iniciar atividade (5 questões)"
- Ícone Play (não ExternalLink)
- Se o step é só a atividade (sem outro conteúdo), a atividade pode abrir automaticamente

## 9.6 "Como seguir após resultado?"

**Problema**: Após ver o resultado, o CTA "Continuar" é genérico. O aluno hesita.

**Solução V2**:
- CTA contextual: "Próxima: Nome da Próxima Aula" ou "Próximo step"
- Botão de retry visível mas secundário (outline, não primary)
- Resultado mostra score com feedback visual imediato (verde/vermelho, não verde/amarelo)

## 9.7 "O que já foi feito?"

**Problema**: Outline mostra dots de 6px. O aluno não consegue ver progresso.

**Solução V2**:
- Outline: barra de progresso mini por aula (não só dot)
- Aulas completas: `bg-emerald-500` com ícone Check
- Aula atual: `bg-primary` com indicador de progresso percentual
- Aulas não iniciadas: `bg-muted` (cinza neutro)

## 9.8 "O sistema carregou ou travou?"

**Problema**: Loading states usam skeleton bars genéricas. Erro states são texto sem ícone.

**Solução V2**:
- Loading: spinner com label "Carregando aula..." (não skeleton silencioso)
- Erro: ícone de alerta + mensagem + botão de retry
- Timeout: mensagem específica "Demorou mais que o esperado. Tente novamente."

---

# 10. Estados Importantes da Experiência

## 10.1 Overview do Curso

**Visual**: Header do curso com capa (se existir), título, descrição e progresso. Módulos como cards expansíveis com aulas dentro.

**Mudanças**:
- ContinueCard: label com nome da próxima aula (não "step da aula atual")
- Lesson rows: ícones maiores (`h-5 w-5`), mais padding (`py-3`)
- Module progress bar: `h-2` (não `h-1.5`)
- Lesson status: texto `text-sm` (não `text-xs`)

## 10.2 Leitura de Step

**Visual**: Área de leitura limpa, sem card wrapper, tipografia generosa.

**Mudanças**:
- Remover `rounded-2xl border bg-card p-5 shadow-sm`
- Conteúdo direto com `max-w-4xl mx-auto` (limitado para leitura confortável)
- Título do step: `text-2xl font-bold` (não `text-xl`)
- Nome da aula como label discreto acima do título
- Prose: `text-foreground` para parágrafos (não `text-muted-foreground`)
- Imagens: max-height 600px (não 500px), skeleton loading

## 10.3 Atividade

**Visual**: Card de questão centralizado, com header mostrando progresso.

**Mudanças**:
- Adicionar progress bar de questões no topo do activity header
- Question card: manter `p-6` mas adicionar indicação de questão obrigatória
- Labels: "Questão 3 de 5" em `text-sm font-medium` (não `text-xs`)
- Botão submit: verde (`bg-emerald-600`) para diferenciar de "próximo"

## 10.4 Resultado

**Visual**: Score hero com feedback visual forte.

**Mudanças**:
- Aprovado: fundo verde sutil (`bg-emerald-50 dark:bg-emerald-950/30`), ícone trophy verde
- Reprovado: fundo vermelho sutil (`bg-red-50 dark:bg-red-950/30`), ícone X vermelho (não amarelo)
- Score: manter `text-4xl font-extrabold`
- Review cards: aumentar opacidade — `bg-green-500/10` e `bg-red-500/10` (não /5)

## 10.5 PDF Aberto

**Visual**: Split view (desktop) ou overlay (mobile) com controls.

**Mudanças**: Novo componente `PdfViewer` — ver seção 6.

## 10.6 Conclusão de Aula

**Visual**: Não existe estado explícito. Hoje o aluno chega ao fim da aula e a action bar mostra "Próxima aula".

**Mudanças**: Adicionar indicador sutil de conclusão — badge "Aula concluída" no header quando todos os steps da aula foram viewed.

## 10.7 Conclusão de Curso

**Visual**: Tela de celebração.

**Mudanças**:
- Layout em coluna central, max-w-lg
- Ícone Award grande (64px) com animação sutil (scale pulse)
- Título: "Parabéns! Curso concluído"
- Progress: 100% com barra completa animada
- Summary cards: `text-sm` labels (não `text-xs`), mais padding
- CTAs: "Voltar ao dashboard" (primary) + "Revisar conteúdo" (outline)
- Animação de entrada: fade + scale (200ms)

## 10.8 Erro

**Visual**: Card de erro com ícone, mensagem e retry.

**Mudanças**:
- Ícone `AlertCircle` (24px) em `text-destructive`
- Título: `text-lg font-semibold` (não `text-base`)
- Mensagem: `text-sm text-muted-foreground`
- Botão retry: `bg-primary` com ícone `RotateCcw`

## 10.9 Conteúdo Vazio

**Visual**: Ilustração/ícone grande com mensagem.

**Mudanças**:
- Ícone `BookOpen` (48px) em `text-muted-foreground/50`
- Mensagem: `text-base font-medium` (não `text-sm`)
- Sub-mensagem: `text-sm text-muted-foreground`
- CTA: "Voltar para a aula" (se disponível)

## 10.10 Bloqueio (Lesson Locked)

**Visual**: Card com ícone de cadeado e explicação.

**Mudanças**:
- Ícone `Lock` (24px) em `text-muted-foreground`
- Mensagem: "Esta aula será liberada após concluir a aula anterior"
- Explicar o PORQUÊ do bloqueio (não apenas "Bloqueada")
- CTA: "Voltar para a aula atual"

---

# 11. Quick Wins vs V2 Maior

## A. Quick Wins (1-2 dias cada, implementáveis imediatamente)

### QW1. Corrigir diacríticos
**O quê**: Substituir "Nao" por "Não", "concluida" por "concluída", etc. em todos os componentes.
**Impacto**: Percepção de cuidado e qualidade.
**Arquivos**: ~15 componentes.
**Risco**: Zero.

### QW2. Aumentar dots de status no outline
**O quê**: `h-1.5 w-1.5` → `h-2.5 w-2.5` (10px).
**Impacto**: Status visível sem esforço.
**Risco**: Zero.

### QW3. Trocar separador `>` por ChevronRight no breadcrumb
**O quê**: Importar `ChevronRight` e usar como separador.
**Impacto**: Header imediatamente mais polido.
**Risco**: Zero.

### QW4. Melhorar labels da action bar
**O quê**: Labels contextuais (usar título do próximo step quando disponível), aumentar texto central para `text-sm`.
**Impacto**: Navegação mais clara.
**Risco**: Baixo.

### QW5. Trocar cor de reprovado de amarelo para vermelho
**O quê**: ActivityResult: `bg-yellow-100` → `bg-red-50`, ícone vermelho.
**Impacto**: Feedback visual correto.
**Risco**: Zero.

### QW6. Trocar ícone ExternalLink por Play no ActivityStepCard
**O quê**: Um import.
**Impacto**: Menos confusão.
**Risco**: Zero.

### QW7. Aumentar altura da action bar
**O quê**: `h-14 md:h-16` → `h-[72px] md:h-20`.
**Impacto**: Mais espaço para botões e progress bar.
**Risco**: Baixo (layout adjustment).

### QW8. Adicionar progress bar na action bar
**O quê**: Barra de progresso na top-edge da action bar.
**Impacto**: Progresso sempre visível.
**Risco**: Baixo.

### QW9. Remover card wrapper do StepView
**O quê**: Tirar `rounded-2xl border bg-card p-5 shadow-sm` e renderizar conteúdo diretamente.
**Impacto**: Mais área útil, aparência mais limpa.
**Risco**: Baixo (CSS only).

### QW10. Trocar prose `text-muted-foreground` para `text-foreground`
**O quê**: Uma classe CSS em StepContentRenderers.
**Impacto**: Legibilidade significativamente melhor.
**Risco**: Zero.

## B. V2 Maior (1-2 semanas cada)

### V2-1. PDF Viewer Interno
**O quê**: Implementar `PdfViewer` com react-pdf, split view em desktop, overlay em mobile.
**Dependência**: Instalar react-pdf + pdfjs-dist.
**Prioridade**: Alta — é o problema P0.

### V2-2. Redesign Completo da Action Bar
**O quê**: Progress bar integrada, CTAs contextuais com nomes de steps, labels maiores.
**Dependência**: Dados do próximo step disponíveis no context.
**Prioridade**: Alta.

### V2-3. Redesign do Header
**O quê**: Breadcrumb com ícones, progress badge, botão de outline contextual.
**Dependência**: Nenhuma.
**Prioridade**: Alta.

### V2-4. Outline Aprimorado
**O quê**: Progress bars por aula, indicador de step ativo, ícones de tipo de conteúdo.
**Dependência**: Dados de step ativo no context.
**Prioridade**: Média.

### V2-5. Animações de Transição
**O quê**: Fade/slide entre steps, entrada/saída do learning mode.
**Dependência**: AnimatePresence no LearningShell.
**Prioridade**: Média.

### V2-6. Auto-transição para Atividades
**O quê**: Steps que são só ACTIVITY pulam o card intermediário.
**Dependência**: Lógica em StepView.
**Prioridade**: Média.

### V2-7. Keyboard Shortcuts
**O quê**: ←/→ para navegar steps, Escape para sair de PDF/overlay.
**Dependência**: Nenhuma.
**Prioridade**: Baixa.

### V2-8. Dark Mode Audit
**O quê**: Revisar todas as cores hardcoded para suportar dark mode.
**Dependência**: Nenhuma.
**Prioridade**: Baixa.

---

# 12. Plano de Execução da V2

## 12.1 Fases

### Fase 0: Quick Wins (Semana 1)
**Objetivo**: Melhoria imediata sem risco.

| Ordem | Item | Tempo |
|---|---|---|
| 1 | QW1 — Diacríticos | 2h |
| 2 | QW3 — Breadcrumb icons | 30min |
| 3 | QW10 — Prose foreground | 15min |
| 4 | QW6 — Ícone Play no ActivityStepCard | 15min |
| 5 | QW5 — Cor de reprovado | 30min |
| 6 | QW2 — Dots de status | 15min |
| 7 | QW9 — Remover card wrapper | 1h |
| 8 | QW7 — Aumentar action bar | 1h |
| 9 | QW8 — Progress bar na action bar | 2h |
| 10 | QW4 — Labels contextuais | 2h |

**Total estimado**: ~10h (1-2 dias)

**Entregável**: Aparência significativamente melhorada sem mudanças arquiteturais.

### Fase 1: Header + Action Bar Redesign (Semana 2)
**Objetivo**: As duas áreas mais visíveis do learning.

| Ordem | Item | Tempo |
|---|---|---|
| 1 | V2-3 — Header redesign | 1 dia |
| 2 | V2-2 — Action bar redesign | 1 dia |

**Dependência**: Nenhuma.

**Entregável**: Header com breadcrumb profissional + Action bar com progresso e CTAs contextuais.

### Fase 2: PDF Viewer (Semana 3-4)
**Objetivo**: Eliminar a maior fonte de perda de contexto.

| Ordem | Item | Tempo |
|---|---|---|
| 1 | Instalar react-pdf + pdfjs-dist | 1h |
| 2 | Implementar PdfViewer base | 1 dia |
| 3 | Split view (desktop) | 1 dia |
| 4 | Overlay (mobile) | 1 dia |
| 5 | Integração com StepContentRenderers | 2h |
| 6 | Testes cross-browser | 4h |

**Total estimado**: ~4 dias

**Entregável**: PDFs nunca mais abrem fora do learning.

### Fase 3: Outline + Transitions (Semana 5)
**Objetivo**: Navegação lateral refinada e fluidez visual.

| Ordem | Item | Tempo |
|---|---|---|
| 1 | V2-4 — Outline aprimorado | 2 dias |
| 2 | V2-5 — Animações de transição | 1 dia |
| 3 | V2-6 — Auto-transição para atividades | 4h |

**Dependência**: Fase 1 (para integração com header).

**Entregável**: Outline profissional + fluxo visual suave.

### Fase 4: Polish (Semana 6)
**Objetivo**: Detalhes finais.

| Ordem | Item | Tempo |
|---|---|---|
| 1 | V2-7 — Keyboard shortcuts | 1 dia |
| 2 | V2-8 — Dark mode audit | 1 dia |
| 3 | Bug fixes + refinamentos | 2 dias |

**Entregável**: Experiência V2 completa.

## 12.2 O que NÃO mexer inicialmente

- **Context split (Data/Nav)**: Arquitetura está correta, não tocar
- **markViewed queue**: Funciona bem, não tocar
- **Route structure**: URLs estão corretas, não tocar
- **Server-driven navigation**: `next` do servidor é a fonte de verdade, não tocar
- **SimTrading integration**: Já está fullscreen e funcional, não tocar

## 12.3 Dependências

```
Fase 0 (Quick Wins)
  └→ Sem dependência

Fase 1 (Header + Action Bar)
  └→ Sem dependência (pode rodar em paralelo com Fase 0)

Fase 2 (PDF Viewer)
  └→ Depende de Fase 1 (split view precisa de action bar definida)

Fase 3 (Outline + Transitions)
  └→ Depende de Fase 1 (outline integra com header)

Fase 4 (Polish)
  └→ Depende de Fases 1-3
```

## 12.4 Critério de Sucesso

| Métrica | Como Medir | Meta |
|---|---|---|
| Nenhum PDF externo | Verificar todos os fluxos | 100% inline |
| Zero ambiguidade de navegação | Teste com 3 usuários leigos | 0 confusões |
| Progresso sempre visível | Audit visual | Em toda tela |
| Labels contextuais em CTAs | Verificar action bar | 100% contextuais |
| Diacríticos corretos | Grep por "Nao" sem til | 0 ocorrências |

---

# 13. Recomendação Final

A base arquitetural está sólida. O problema é exclusivamente de camada de apresentação. A V2 não exige reescrita — exige refinamento.

**Comece pela Fase 0**. Os 10 quick wins levam 1-2 dias e transformam a percepção visual do produto imediatamente. Diacríticos, breadcrumb com ícones, progress bar na action bar, e remoção do card wrapper são mudanças de alto impacto e risco zero.

**Priorize o PDF Viewer**. É o problema P0 — a maior fonte de perda de contexto e a reclamação mais provável de usuários reais.

**Não refatore a arquitetura**. O context split, a serial queue, e a navegação server-driven estão corretos. A V2 é sobre fazer a camada visual corresponder à qualidade da camada técnica.

O resultado final deve ser: um aluno que entra no learning e consegue consumir conteúdo, fazer atividades, consultar PDFs e completar o curso **sem nunca precisar pensar sobre a interface**.
