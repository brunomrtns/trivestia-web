# CONTEXTO ESTRATÉGICO — LEARNING EXPERIENCE TRIVESTIA

> Documento de intenções. Não é um plano. É o que o plano protege.
> Leia antes de tocar em qualquer arquivo do /learn/.

---

# 1. Filosofia do Sistema

O aluno da Trivestia não está aqui por entretenimento. Está aqui para aprender a tomar decisões com dinheiro real. O custo de um erro de UX não é frustração — é um aluno que não aprendeu algo que poderia ter evitado uma perda financeira.

O modelo mental do sistema é um **túnel com luzes de posição**. O aluno sempre está dentro de um fluxo contínuo. Nunca numa "página". Nunca escolhendo onde ir. O sistema já sabe onde ele precisa estar. O túnel tem luzes indicando progresso, portas visíveis para onde ir, e nenhum beco sem saída.

Plataformas comuns (Udemy, Hotmart) tratam o learning como catálogo de conteúdo. O aluno escolhe, navega, consome. A Trivestia trata learning como **progressão guiada**. O sistema conduz. O aluno avança. A diferença: no catálogo, o aluno pode se perder. Na progressão guiada, o sistema não permite que isso aconteça.

A experiência deve ser invisível. Quando o aluno percebe a interface, algo falhou. O step deve parecer o conteúdo. A navegação deve parecer respirar. A conclusão deve parecer o que ele fez, não o que o sistema mostrou.

O inimigo número um é **atrito cognitivo**. Cada milissegundo que o aluno gasta pensando "onde estou", "para onde vou", "como volto" é um milissegundo roubado do aprendizado. A interface deve exigir zero decisões operacionais. A única decisão do aluno é sobre o conteúdo.

---

# 2. Princípios Não Negociáveis

**Navegação determinística.** O botão "Voltar" sempre leva ao mesmo lugar para o mesmo contexto. Nunca depende de histórico do browser. Nunca depende de como o aluno chegou. Isso existe porque o aluno está aprendendo, não mapeando. Se ele precisa lembrar "como cheguei aqui" para saber "como volto", o sistema falhou.

**URL como fonte de verdade posicional.** Qual step, qual aula, qual atividade. Tudo na URL. Isso existe porque a URL é o único estado que sobrevive a refresh, deep link, compartilhamento, back/forward do browser. Se o estado posicional vive em useState, ele é frágil por definição. Se vive na URL, é robusto por construção.

**Atividade dentro do fluxo, nunca fora.** Uma atividade não é uma página separada. É um momento dentro da aula. Isso existe porque a cognição do aluno está no contexto da aula. Abrir uma página nova é pedir ao cérebro que re-construa contexto. Em educação, contexto é tudo. O aluno estava lendo sobre suporte/resistência, fez uma atividade de chart markup, voltou para o texto. Se a atividade abriu em página separada, o cérebro processou como "saí da aula". Se ficou inline, processou como "pratiquei o que estudei".

**Server decide próximo passo.** O frontend nunca calcula qual é a próxima aula. Nunca faz loop em módulos para encontrar a próxima. Isso existe porque o backend tem a lógica de progression com unlocking, prerequisites, scoring. O frontend não tem. Se o frontend calcula, vai divergir do backend eventualmente. Divergência = aluno vê aula bloqueada, ou pula aula que deveria fazer, ou fica preso.

**Estado de progresso vem do servidor, nunca é derivado localmente.** O frontend mostra o que o servidor diz. Não soma steps viewed para calcular percentual. Não deduz conclusão de aula pelo step final. Isso existe porque o servidor é a verdade. O frontend é uma projeção. Projeções podem estar desatualizadas, mas nunca devem contradizer a verdade.

**Single shell.** Uma moldura. Uma hierarquia visual. Um contexto espacial. Isso existe porque o cérebro humano usa memória espacial para navegação. Se o layout muda entre "páginas", o aluno perde o senso de lugar. Header no mesmo lugar. Outline no mesmo lugar. Conteúdo no mesmo lugar. O que muda é o conteúdo, não o container.

**Zero navegação ambígua.** Nunca dois caminhos para a mesma ação. Nunca dois botões "voltar" com destinos diferentes. Nunca uma ação cujo resultado dependa do passado. Isso existe porque ambiguidade gera hesitação. Hesitação gera atrito. Atrito gera abandono.

---

# 3. Decisões Críticas Explicadas

**stepId (UUID) na URL, não stepIndex (numérico).**

O admin pode reordenar steps. O stepIndex muda quando a ordem muda. Se a URL tem `/steps/3` e o admin move o step 3 para posição 5, o aluno que recarrega vê o step errado. O markViewed marca o step errado. O progresso calcula errado. O UUID é imune a reordenação. Custa uma resolução stepId→index ao carregar a timeline, mas elimina uma classe inteira de bugs de desalinhamento.

**Atividade preserva stepId de origem na URL.**

A URL é `/steps/:stepId/activities/:activityId`. O stepId fica lá durante toda a atividade. Isso existe porque quando a atividade termina, o sistema precisa saber qual era o step que continha a atividade para navegar ao próximo. Se o stepId não está na URL, ele precisa estar em estado local. Estado local morre no refresh. Com stepId na URL, o retorno funciona sempre.

**Activity inline, não página separada.**

Página separada = novo contexto espacial. Novo contexto = cérebro reinicia mapeamento. Inline = continuidade. A diferença parece cosmética mas é cognitiva. O aluno que faz uma atividade inline sente que "praticou dentro da aula". O aluno que vai para página separada sente que "saiu para fazer um teste". O primeiro mantém foco. O segundo quebra foco.

**Context separado em dados e navegação.**

`LearningDataContext` muda raramente (dados do curso). `LearningNavContext` muda a cada step. Se estão juntos, cada navegação re-renderiza o outline inteiro. Separados, só o content area e action bar re-renderizam. Isso não é otimização prematura — é evitar que 30+ componentes re-renderizem a cada clique de "Próximo".

**markViewed em fila serial, sem optimistic update.**

Se três markViewed disparam em paralelo e o backend processa fora de ordem, o estado de viewed fica inconsistente. Se optimistic update falha e rollback conflita com outro markViewed que teve sucesso, o cache fica em estado impossível. A fila serial é mais lenta (milissegundos) mas garantida. Progresso de visualização não é urgente — não precisa ser instantâneo, precisa ser correto.

**AppLayout adaptativo, não layout novo.**

Criar um layout paralelo ao AppLayout significaria duplicar AuthGuard, ChatFloating, lógica de role, logout. Significaria duas fontes de verdade para o que o aluno vê. Significaria bugs que só acontecem num dos layouts. Adaptar o AppLayout existente mantém uma fonte, um guard, um chat. O trade-off é que AppLayout fica mais complexo. Mas complexidade centralizada é melhor que duplicação distribuída.

---

# 4. Anti-Patterns Proibidos

**Criar useState para posição quando a URL já tem o dado.**

Se `stepId` está na URL, não criar `const [activeStepId, setActiveStepId] = useState(stepId)`. A URL é a verdade. Usar `useParams()` diretamente. Duplicar em state cria duas fontes que podem divergir: a URL diz step A, o state diz step B. Isso acontece quando navegação via URL não atualiza o state local (race condition) ou quando o state atualiza mas a URL não (bug de navegação).

**Calcular próxima aula no frontend.**

Nunca iterar `modules[].lessons[]` para encontrar a próxima aula depois da atual. O servidor tem lógica de prerequisites, scoring mínimo, deadlines, unlocking. O frontend não tem. Se o frontend calcula, pode sugerir aula bloqueada, pular aula que exige score mínimo, ou ignorar ordem definida por regra de negócio. Sempre usar `courseInteractive.next`.

**Usar `navigate(-1)`.**

`navigate(-1)` depende do histórico do browser. Deep link: não há histórico. Nova aba: não há histórico. Redirect: histórico artificial. Em todos esses casos, o botão "Voltar" quebra. Pode sair do site, pode ir para página errada, pode não fazer nada. A navegação é sempre para uma URL absoluta, determinada pelo contexto atual.

**Renderizar atividade fora do LearningShell.**

Qualquer fluxo que abra uma rota fora de `/learn/:courseId/**` para atividades destrói o contexto. O aluno perde outline, breadcrumb, e noção de onde está no curso. A atividade pode existir em página separada (ActivityPlayerPage) para backward compat, mas o novo fluxo nunca deve criar novas rotas fora do shell.

**Invalidar queries individualmente em componentes.**

Se `markViewed` invalida apenas `timeline`, o outline não atualiza. Se `submit` invalida apenas `submission-review`, o `courseInteractive` não atualiza. Cada ação pode afetar múltiplas queries. A invalidação deve ser centralizada em `invalidateLearningCache()` que sabe quais queries invalidar para cada ação.

**Criar componentes de página em `/pages/student/` para o novo fluxo.**

O novo fluxo não tem "páginas". Tem componentes que vivem dentro do LearningShell via `<Outlet />`. Criar `LearnPage.tsx` em `/pages/` é voltar ao modelo de páginas siladas. Tudo em `/components/learning/` sob o shell.

**Usar índice de array para key em listas de steps ou questões.**

Se o admin reordena steps, o React reutiliza DOM para step errado. Usa `step.id` como key. Sempre.

**Fazer fetch condicional baseado em estado local.**

Não fazer `if (activeLessonId) { fetch timeline }`. O estado local pode estar desatualizado. Fazer fetch baseado em params da URL com `enabled: !!lessonId` no TanStack Query. A URL é a verdade, o hook decide se fetcha.

---

# 5. Modelo Mental Correto

O sistema não é um conjunto de páginas com rotas entre elas. É uma **máquina de estados com uma janela de visualização**.

O estado da máquina é: `{ curso, módulo, aula, step, atividade?, modo }`. Esse estado é determinado pela URL. A máquina sempre está em exatamente um estado.

A janela de visualização é o LearningShell. Ele nunca muda de forma — sempre header no topo, outline à esquerda (ou drawer), conteúdo no centro, ações embaixo. O que muda é o que a janela mostra, que é uma projeção do estado da máquina.

Transições de estado são sempre navegações de URL. Quando o aluno clica "Próximo", não é "trocar componente". É "mudar estado da máquina para {step: nextStepId}". A URL muda. A máquina re-renderiza.

Isso significa que o sistema é **stateless no frontend**. O frontend não mantém estado de "onde o aluno está". A URL mantém. O frontend apenas lê a URL e renderiza a projeção correta. Isso parece sutil mas é fundamental: se o frontend é stateless, não há estado para corromper, sincronizar ou perder.

A exceção é o estado de interação temporária: qual questão o aluno está respondendo, quais respostas ele selecionou. Esse estado é local porque é temporário — se perdido, o aluno refaz. Mas posição no curso nunca é temporária. Posição é permanente e deve sobreviver a qualquer evento.

Pense no sistema como uma **esteira**: o aluno entra numa ponta, avança linearmente, e a esteira o conduz. Ele pode olhar para os lados (outline), pode voltar alguns passos (anterior), mas a esteira sempre está se movendo para frente. O sistema nunca deixa o aluno parado sem saber para onde a esteira vai.

---

# 6. Pontos Frágeis

**A transição entre step e atividade.**

É o momento onde o estado da máquina muda de "consumo passivo" para "interação ativa". A action bar muda de labels. O progress indicator muda de unidade (steps para questões). O breadcrumb pode ou não mudar. É onde é mais fácil introduzir inconsistência: action bar mostrando "Step 3 de 7" quando deveria mostrar "Questão 2 de 5", ou outline não refletindo que o aluno está em atividade.

**O retorno de atividade para step.**

Quando a atividade termina, o sistema precisa navegar de volta ao fluxo de steps. Se o stepId de origem não está preservado, o sistema não sabe para onde voltar. Se volta para o step da atividade em vez do próximo step, o aluno fica preso num loop. Se volta para step 0, o aluno perde progresso percebido. A URL `/steps/:stepId/activities/:activityId` existe inteiramente para proteger essa transição.

**A sincronia entre outline e conteúdo.**

O outline mostra aulas com progresso. O conteúdo mostra o step atual. Se o progresso do outline está desatualizado (cache stale), o outline pode mostrar aula como "não iniciada" enquanto o aluno está no step 5. A invalidação de cache deve cobrir ambas as fontes ao mesmo tempo. Se invalidar `timeline` sem invalidar `course-interactive`, o outline mente.

**Sim Trading fullscreen.**

O SimTradingTerminal assume controle total do viewport. O shell precisa ceder espaço completamente — sem header, sem outline, sem action bar. Se qualquer um desses permanece visível, o terminal quebra. Mas ao sair do fullscreen, tudo precisa voltar. Essa transição é binária e precisa ser tratada como modo, não como condicional CSS.

**O comportamento quando `courseInteractive.next` é null.**

`next` é null quando o curso está completo, mas também pode ser null temporariamente se a query está stale ou o backend ainda não computou. Tratar `next === null` como "curso completo" prematuramente mostra celebração no lugar errado. Tratar como "loading" mantém o aluno esperando. O correto é: se `next === null` e `progress.percent === 100`, aula completa. Se `next === null` e `progress.percent < 100`, mostrar estado de "você completou esta aula" sem assumir que o curso acabou.

---

# 7. O Que Define Excelência

**O aluno nunca pergunta "onde estou?".**

Se em qualquer momento o aluno precisa pausar o estudo para entender a interface, falhou. O breadcrumb, o outline highlight, o step indicator, o título da aula — todos existem para que a pergunta nunca precise ser feita.

**O próximo passo é sempre óbvio.**

Após completar um step, o botão "Próximo" está no mesmo lugar. Após completar uma aula, "Próxima aula" está no mesmo lugar. Após completar o curso, "Voltar ao Dashboard" está no mesmo lugar. A posição do CTA primário nunca muda. O label muda. O destino muda. O lugar nunca.

**A transição entre etapas é imperceptível.**

O aluno não sente que "trocou de página". Sente que o conteúdo mudou suavemente. A animação existe para suavizar, não para chamar atenção. Se o aluno nota a animação, ela está lenta demais ou exagerada.

**A atividade parece parte da aula, não um evento separado.**

Quando o aluno entra na atividade, o breadcrumb ainda mostra "Módulo 2 > Aula 5". O outline ainda destaca a mesma aula. O header ainda existe. A atividade é um evento dentro da aula, não uma saída dela.

**O progresso é tranquilizador, não ansioso.**

"12 de 20 aulas · 60%" é tranquilizador. "Faltam 8 aulas" é ansioso. "Step 3 de 7" é tranquilizador. "4 restantes" é ansioso. A linguagem de progresso sempre mostra o que foi feito, nunca o que falta.

**O erro é recuperável sem perda.**

Se a rede falha, o aluno tenta novamente. Se o refresh acontece, o aluno volta ao mesmo lugar. Se uma submissão falha, as respostas estão intactas. O sistema nunca pune o aluno por eventos fora do controle dele.

---

# 8. Erros Comuns

**"Vou adicionar um loading spinner centralizado quando carrega."**

Errado. Skeleton preserva o layout. Spinner centralizado faz o outline desaparecer e reaparecer, causando layout shift. O aluno perde referência espacial. Sempre skeleton.

**"Vou invalidar todas as queries após qualquer ação para garantir sincronia."**

Errado. Invalidar tudo gera N requests paralelos. Em curso com 30 aulas, são 30+ requests de lock status refazendo. Invalidar o que é relevante, na granularidade correta, com a função centralizada.

**"Vou esconder o outline enquanto carrega para não mostrar dados velhos."**

Errado. Dados velhos são melhores que espaço vazio. O outline stale mostra onde o aluno estava. Espaço vazio mostra nada. Mostrar dados stale com indicador sutil de "atualizando" é superior a esconder.

**"Vou criar um hook `useLearningProgress()` que soma steps viewed para calcular percentual da aula."**

Errado. O percentual vem do servidor (`LessonTimelineDTO.progress.percent` ou `CourseInteractiveDTO.progress.percent`). Calcular localmente diverge do servidor. Se o servidor diz 60% e o frontend calcula 75%, o aluno perde confiança no sistema.

**"Vou usar AnimatePresence com mode='wait' entre steps para animação suave."**

Cuidado. `mode='wait'` espera a animação de saída terminar antes de montar o próximo step. Em navegação rápida (aluno clica Próximo Próximo Próximo), isso cria fila de animações. O aluno espera 600ms por clique. Usar `mode='sync'` ou transição instantânea com fade simples.

**"Vou usar `useNavigate()` para ir ao próximo step."**

Funciona, mas `navigate()` com path relativo pode quebrar se a rota atual não for exatamente a esperada. Usar `navigate()` com path absoluto construído a partir dos params da URL: `/t/${slug}/app/learn/${courseId}/lessons/${lessonId}/steps/${nextStepId}`.

**"Vou colocar o CourseOverview numa página separada em `/pages/`."**

Errado. CourseOverview é renderizado como `<Outlet />` dentro do LearningShell na rota `index`. Se vira página, perde acesso ao outline e ao header do shell. Volta ao modelo de páginas isoladas que o sistema inteiro está tentando eliminar.

---

# 9. Checklist Mental do Dev

Antes de implementar qualquer parte do /learn/, responder:

**Isso mantém o fluxo contínuo?**
O aluno precisa "sair" de algo para chegar aqui? Se sim, está errado.

**Isso quebra continuidade de contexto?**
O outline, breadcrumb, e header permanecem consistentes? Se algum muda de lugar ou desaparece, está errado.

**Isso adiciona uma decisão para o aluno?**
O aluno precisa escolher entre dois caminhos para continuar? Se sim, está errado. Um caminho, um CTA.

**Isso depende de estado local para posição?**
Se o aluno recarregar, volta ao mesmo lugar? Se não, o estado está no lugar errado.

**Isso pode divergir do servidor?**
Algum cálculo local pode contradizer o que o backend vai retornar no próximo fetch? Se sim, remover o cálculo.

**Isso funciona via deep link?**
Se eu colar a URL numa aba nova, funciona? Se não, alguma dependência implícita quebrou.

**Isso re-renderiza componentes que não precisam?**
A action bar, outline, ou header re-renderizam quando só o conteúdo deveria mudar? Se sim, verificar context boundaries.

**O botão "Voltar" é determinístico?**
Para esta tela, o botão "Voltar" no header leva sempre ao mesmo destino, independentemente de como chegou aqui? Se depende de histórico, está errado.

**A transição de atividade preserva o stepId?**
Ao entrar na atividade, a URL ainda contém o stepId de origem? Se não, o retorno vai quebrar.

**Isso é tolerante a falha?**
Se a rede falha aqui, o aluno perde algo? Se perde respostas, progresso, ou posição, está errado.

---

# APÊNDICE — O que este documento protege

Este documento existe porque uma spec técnica captura o "o quê" e "como", mas não captura o "por que não de outro jeito". Cada decisão aqui foi tomada contra uma alternativa que parecia razoável mas teria consequências invisíveis:

- stepIndex parecia mais simples que stepId, até o admin reordenar steps
- página separada parecia mais limpa que inline, até o aluno perder contexto
- optimistic update parecia mais rápido, até o cache entrar em estado impossível
- navigate(-1) parecia conveniente, até o deep link quebrar
- estado local parecia suficiente, até o refresh perder tudo
- calcular próxima aula parecia straightforward, até o backend e frontend divergirem

Cada um desses caminhos leva a bugs que aparecem em produção, não em desenvolvimento. Este documento é o mapa de "não vá por aqui".
