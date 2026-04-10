Você concluiu a etapa anterior da Learning Experience V2 e agora vai executar a **Fase 2 — Outline V2 + transições + refinamento do fluxo visual**.

Documento de referência: a proposta da Learning Experience V2 já definida anteriormente nesta sessão.

---

# 🎯 OBJETIVO

Melhorar a experiência do learning sem mexer em PDF/artigos agora.

O foco desta fase é:

- melhorar o outline/sidebar do curso
- melhorar a leitura do progresso e status
- reduzir confusão visual
- melhorar transições entre estados/steps
- deixar o fluxo mais claro e mais fluido
- refinar o aproveitamento visual da tela

---

# ⚠️ REGRA PRINCIPAL

Você NÃO pode:

- implementar PDF viewer
- mexer no editor de artigo
- alterar drag and drop do admin
- refatorar arquitetura base
- reabrir fases anteriores
- inventar novos fluxos paralelos

Você DEVE:

> melhorar apenas a camada de navegação lateral, transições e refinamento visual do fluxo já existente

---

# 📦 ESCOPO EXATO

## 1. LearningOutline V2
Melhorar a sidebar/outline atual.

### Mudanças esperadas
- melhorar legibilidade dos módulos e aulas
- tornar status mais visível
- melhorar ícones/dots de progresso
- melhorar destaque de item ativo
- melhorar hierarquia entre módulo e aula
- tornar a sidebar menos “crua” e mais refinada
- melhorar clareza do estado atual do curso

### Se fizer sentido, incluir:
- indicador mais forte de aula ativa
- melhor leitura do progresso do módulo
- bloqueio mais claro para aula bloqueada
- uso melhor do espaço horizontal da sidebar

---

## 2. Transições entre steps/estados
Melhorar a sensação de continuidade visual.

### Mudanças esperadas
- adicionar transição suave entre steps
- evitar sensação de corte seco
- melhorar entrada/saída entre:
  - step
  - activity
  - result
  - completion
- manter coerência com o shell atual

### Regras
- nada exagerado
- nada pesado
- nada que prejudique performance
- transições devem ajudar a orientação do usuário

---

## 3. Refinamento do fluxo visual
Melhorar a percepção geral do fluxo dentro do learning.

### Exemplos esperados
- tornar mais claro o que está ativo
- dar mais contexto visual para a posição atual
- reduzir sensação de “layout jogado”
- melhorar equilíbrio entre conteúdo, outline e action bar
- melhorar uso do espaço no conteúdo principal

---

## 4. Estados visuais importantes
Melhorar visualmente estados como:
- loading
- erro
- vazio
- bloqueado
- item ativo
- item concluído

Sem mudar a lógica principal, apenas deixando a experiência mais clara e menos feia.

---

# ⚠️ REGRAS DE IMPLEMENTAÇÃO

1. NÃO mexer em lógica de negócio sem necessidade real
2. NÃO alterar contracts existentes
3. NÃO reestruturar context/hooks
4. NÃO criar novas dependências pesadas sem necessidade
5. NÃO deixar transições brigarem com o shell
6. NÃO usar animações excessivas
7. preservar responsividade desktop/mobile

---

# 🔎 O QUE DEVE SER PRESERVADO

- URL como fonte de verdade
- shell atual
- navegação determinística
- action bar atual
- progressão já implementada
- arquitetura já consolidada

---

# 🧪 VALIDAÇÃO OBRIGATÓRIA

Validar estaticamente:

- build
- typecheck
- lint
- sem regressão de layout estrutural
- sem quebrar seleção de aula
- sem quebrar drawer mobile
- sem quebrar states existentes

Você deve reportar explicitamente:

## Implementado
## Validado estaticamente
## Não validado manualmente
## Riscos restantes

---

# 📦 FORMATO DA RESPOSTA

# Fase 2 — Outline + Transições + Refinamento visual
# Componente: LearningOutline
## 1. Interpretação
## 2. Implementação
## 3. Pontos críticos
## 4. Validação
## 5. Conformidade

# Componente: Transições / fluxo visual
## 1. Interpretação
## 2. Implementação
## 3. Pontos críticos
## 4. Validação
## 5. Conformidade

# Estados visuais refinados
## 1. O que mudou
## 2. Onde mudou
## 3. Impacto esperado
## 4. Validação

# Resumo final
- o que melhorou no learning
- o que continua para fases futuras
- o que foi propositalmente adiado

---

# 🚀 MISSÃO

Você está refinando a percepção de fluxo e clareza da experiência.

O objetivo não é só “deixar mais bonito”.

O objetivo é:

> fazer o aluno entender melhor onde está, o que já fez e o que deve fazer agora, com menos sensação de produto cru

Comece pelo LearningOutline e depois avance para transições e refinamentos visuais.
