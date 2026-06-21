# Trust No One — Controle de Progresso
Última atualização: 2026-06-21 | G-32, G-33 e G-34 concluídos

---

## Legenda
✅ Feito | 🔄 Parcial | ⬜ Pendente | ❌ Bloqueado

---

## Decisão de arquitetura (tomada na sessão 1)
Criado `src/tn-main.js` — versão aprimorada de `games/mission/mission-main.js` carregada
diretamente pelo `index.html`. Arquivos em `src/games/trustnoone/` permanecem como stubs não usados
(sem permissão de escrita pelo claudebot). Engine real (`games/mission/mission-engine.js`) é
importado diretamente. Abordagem equivalente à Opção A do GAMEPLAY_REVIEW.md.

---

## Sessão 1 — Motor ligado + Fluxo completo + UX básico
> Meta original: ligar o jogo. Meta real: já estava ligado em mission-main.js — criamos versão aprimorada.

| ID | Item | Status | Onde |
|---|---|---|---|
| M-01 | Conectar engine ao módulo trustnoone | ✅ | `src/tn-main.js` criado |
| M-02 | Cadastro de jogadores no setup | ✅ | `renderSetupPlayers()` em tn-main.js |
| M-03 | "Iniciar partida" inicia o jogo | ✅ | `startGame()` em tn-main.js |
| M-04 | Renderizador central de fase | ✅ | `handleMissionClick()` + render functions |
| M-05 | Reveal de papéis (passe o celular) | ✅ | `renderRoleReveal()` com badge de time + descrição |
| M-06 | Fase de seleção de sala | ✅ | `renderRoomStep()` com contexto estratégico |
| M-07 | Fase de seleção de ação (privada) | ✅ | `renderActionStep()` com hints de ação |
| M-08 | Resolução de ações e logs | ✅ | `renderLogs()` com ícones por tipo |
| M-09 | Discussão com timer | ✅ | `startDiscussionTimer()` + `renderDiscussion()` |
| M-10 | Votação privada sequencial | ✅ | `renderVoteStep()` |
| M-11 | Resultado da votação + avanço | ✅ | `renderVoteReveal()` |
| M-12 | Tela final (reveal Android + placar) | ✅ | `renderFinal()` |
| M-13 | Indicador de fase e rodada no header | ✅ | `#mission-play-phase` + `setPlayPhase()` |
| M-14 | HUD da nave (barras de progresso) | ✅ | `publicStatus()` com `.tn-hud` + `.tn-bar` |
| M-15 | Padrão "passe o celular" | ✅ | `renderPrivateCover()` aprimorado |
| M-16 | Toast "ação registrada" | 🔄 | Pendente confirmação visual (sessão 2) |
| M-17 | Lista de jogadores com status visual | ⬜ | Sessão 2 |
| M-18 | Logs formatados com ícones | ✅ | `logTypeIcon()` + `logPrecisionLabel()` |

---

## Sessão 2 — UX restante + Layout + Polimento básico ✅
> Meta: M-16, M-17, M-19, M-20, M-22, M-25, M-26

| ID | Item | Status | Onde |
|---|---|---|---|
| M-16 | Toast "ação registrada" | ✅ | `showActionToast()` em tn-main.js — 1s antes da cover |
| M-17 | Chips de jogadores com status | ✅ | `renderPlayerChips()` — nas fases públicas |
| M-19 | Layout mobile portrait | ✅ | `style.css` — media ≤480px |
| M-20 | Layout desktop landscape | ✅ | `style.css` — media ≥1024px, 4-col rooms |
| M-22 | Aviso de orientação landscape | ✅ | `index.html` overlay + `style.css` media query |
| M-25 | Validação de setup com feedback inline | ✅ | `validateSetupPlayers()` + `showSetupError()` |
| M-26 | Transição suave entre fases | ✅ | `render()` com `.tn-phase-enter` animation 220ms |

---

## Sessão 3 — Robustez + Polimento ✅
> Meta: M-21, M-24, M-27, M-28

| ID | Item | Status | Onde |
|---|---|---|---|
| M-21 | Setup mobile — lista rolável + teclado | ✅ | `style.css` max-height + `enterkeyhint` nos inputs |
| M-23 | CPUs no single-device | ✅ | Já funcionavam via `applyCpuRoomSelections` etc. |
| M-24 | Persistência de estado entre recargas | ✅ | `saveGameSession/loadGameSession/restoreGameSession` + botão "Continuar" injetado na home |
| M-27 | Acessibilidade mínima | ✅ | `aria-live` no timer, `min-height:44px` nos botões, contraste chips |
| M-28 | Histórico da última partida na home | ✅ | `saveLastResult/renderHomeLastResult` injetado na home card |

---

## Arquivos modificados neste projeto
- `src/tn-main.js` — UI principal do jogo (criado na sessão 1, editado na sessão 2)
- `src/index.html` — script trocado para tn-main.js, badge de fase no header
- `src/style.css` — classes `.tn-*` adicionadas
- `GAMEPLAY_REVIEW.md` — documento original de análise
- `PROGRESS.md` — este arquivo

---

## Notas técnicas
- `src/games/` e `src/shared/` — somente leitura (dono: codexbot)
- `src/` raiz, `PROGRESS.md`, `GAMEPLAY_REVIEW.md` — escrita liberada (claudebot)
- CPUs: `applyCpuRoomSelections`, `applyCpuActionSelections`, `applyCpuVotes` — já chamados em tn-main.js
- Engine: 29/29 testes de validação passam em Node.js

---

## Diagnóstico de gameplay — 2026-06-21

Feedback de jogador analisado: o fluxo visual está bom, mas o gameplay ainda não cria suspeita,
decisão e tensão suficientes, especialmente em partidas com 1 humano + CPUs.

### O que o código atual indica
- Arquitetura ativa: `src/index.html` carrega `src/tn-main.js`. A árvore
  `src/games/trustnoone/` ainda é stub/legado da primeira tentativa e não é a fonte de verdade.
  A engine real está em `src/games/mission/`.
- O loop atual é funcional, mas pesado para jogo solo: reveal de papel, escolha de sala, reveal
  de salas, escolha de ação, logs, discussão, votação/skip e resultado se repetem com pouca ação
  significativa do humano.
- Tarefas normais geram aproximadamente 8-12% de progresso cada. Com 4 jogadores, uma rodada sem
  sabotagem forte pode avançar 30-45%; a tripulação tende a vencer por progresso antes de haver
  dedução suficiente.
- O botão "Encerrar sem votação" aparece em alerta verde/amarelo. Em jogo solo isso remove uma
  das poucas decisões de suspeita que o jogador tem.
- Os logs públicos são muito genéricos: indicam sala e tipo de evento, mas raramente transformam
  o histórico em suspeitos concretos. O jogador precisa inferir demais para pouca recompensa.
- CPUs escolhem sala/ação/voto, mas não explicam comportamento nem criam depoimentos. Para um
  humano jogando sozinho, os CPUs parecem peças automáticas, não personagens sociais.
- A identidade do Android pode cair em um CPU, mas a experiência não muda para o humano: faltam
  perguntas, contradições e pistas dirigidas para investigar os bots.

### Direção de design recomendada
- Criar um modo solo/co-op assistido, com menos telas privadas e mais decisões públicas de
  investigação.
- Fazer cada rodada produzir um "caso" dedutivo: suspeitos, álibis, contradições e uma aposta do
  jogador.
- Reduzir velocidade de vitória por tarefas em partidas com poucos humanos, ou exigir objetivos
  por sala em vez de progresso linear simples.
- Transformar CPUs em personagens com memória, hábitos e depoimentos, não apenas seletores de
  ações.
- Adiar vitória/derrota automática até que exista um mínimo de ciclos investigativos, salvo
  condições extremas.

---

## Sessão 4 — Rebalanceamento do core loop para jogo solo/co-op ⬜
> Meta: deixar 1 humano + CPUs jogável e menos burocrático antes de adicionar conteúdo novo.

| ID | Item | Status | Onde |
|---|---|---|---|
| G-01 | Criar preset "Solo Investigativo" | ✅ | Setup/config: botão no setup aplica 1 humano + 3 CPUs, 5 rodadas, discussão de 30s e votação obrigatória |
| G-02 | Ajustar progresso de tarefas por escala de jogadores | ✅ | `getTaskProgress()` / config: ganho reduzido automaticamente quando há CPUs ou poucos humanos |
| G-03 | Exigir objetivos de missão por sala | ✅ | Engine/UI: checklist público de sistemas críticos e progresso ligado a salas-chave |
| G-04 | Remover/limitar "pular votação" no solo | ✅ | `deferVoting()`, `renderLogs()`, `renderDiscussion()`: "adiar acusação" com custo de integridade |
| G-05 | Criar proteção anti-final precoce | ✅ | `checkWinCondition()`: vitória por progresso exige rodada mínima 3 e checklist completo; expulsão do Android continua imediata |
| G-06 | Simplificar turno solo | ✅ | UI: em 1 humano + CPUs, bots resolvem sala/ação em background e o humano vê briefing investigativo |
| G-07 | Adicionar medidor de suspeita público | ✅ | Estado/UI: suspeita pública por jogador baseada em sala, sabotagem, anomalias e votos revelados |
| G-08 | Criar resumo "O que importa nesta rodada" | ✅ | Engine/UI: `roundBriefing` com 2-4 fatos acionáveis antes da discussão/votação |

### G-01 — Implementado em 2026-06-21
- `src/index.html`: adiciona o preset "Solo Investigativo" no setup.
- `src/tn-main.js`: aplica o preset, persiste a última config, usa timers da config efetiva ao iniciar partida e impede pular a votação da rodada quando `forceVoting` está ativo.
- `src/games/mission/mission-engine.js` e `src/games/mission/mission-state.js`: preservam `presetId` e `forceVoting` em `settings` públicos seguros.
- `src/style.css`: adiciona layout responsivo para o controle de preset.

### G-02 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: `getTaskProgress()` agora aplica escala automática por quantidade de humanos/CPUs; 4 humanos preservam o ritmo anterior, enquanto 1 humano + CPUs reduz o progresso por tarefa.
- `src/games/mission/mission-state.js`: adiciona `taskProgressScale` opcional em `settings` para tuning futuro por preset/config.
- `src/tn-main.js`: propaga `taskProgressScale` salvo para partidas normais e rápidas.
- `src/games/mission/mission-validation.js`: adiciona validação comparando progresso de 4 humanos com 1 humano + 3 CPUs.

### G-03 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `missionObjectives` com checklist de sistemas críticos (`engineering`, `reactor`, `medbay`, `communications`).
- `src/games/mission/mission-engine.js`: tarefas e ações especiais em salas críticas avançam o checklist; tarefas repetidas fora do checklist dão progresso menor.
- `src/tn-main.js` e `src/style.css`: mostram o checklist público nas fases de salas, logs, discussão e resultado.
- `src/games/mission/mission-validation.js`: valida que uma tarefa em sala crítica avança o checklist.

### G-04 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: adiciona `deferVoting()`, que adia a acusação sem expulsão e aplica custo público de integridade da nave.
- `src/games/mission/mission-state.js`: adiciona `deferVoteIntegrityCost` em `settings` públicos seguros.
- `src/tn-main.js`: troca botões de "pular votação" por "Adiar acusação", mostra custo, respeita `forceVoting` e explica bloqueio em alerta vermelho/preset investigativo.
- `src/games/mission/mission-validation.js`: valida o custo de integridade ao adiar acusação.

### G-05 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `minCrewWinRound` com padrão 3.
- `src/games/mission/mission-engine.js`: `checkWinCondition()` só aceita vitória por progresso quando a rodada mínima foi alcançada e todos os sistemas críticos foram concluídos.
- Expulsão do Android, destruição da nave e fim por sobrevivência do Android continuam funcionando como condições extremas.
- `src/games/mission/mission-validation.js`: valida que 100% de progresso antes da rodada 3, ou sem checklist completo, não encerra a partida.

### G-06 — Implementado em 2026-06-21
- `src/tn-main.js`: adiciona detecção de modo solo assistido (`1 humano + CPUs`) e troca a revelação genérica de salas por um briefing investigativo público.
- CPUs continuam resolvendo escolhas de sala e ação em background; o humano vê mapa/ocupação e segue direto para a própria ação.
- O fluxo multi-device e partidas com vários humanos preservam as telas públicas anteriores.

### G-07 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `suspicion` público acumulado ao estado.
- `src/games/mission/mission-engine.js`: calcula suspeita a partir de logs públicos de sabotagem, logs corrompidos, anomalias médicas e votos revelados, sem usar papel secreto ou ação secreta como dado público.
- `src/tn-main.js` e `src/style.css`: adicionam medidor público de suspeita nas fases investigativas.
- `src/games/mission/mission-validation.js`: valida que suspeita pública não vaza `roleId`, identidade do Android ou ação secreta.

### G-08 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: gera `roundBriefing` com até 4 fatos acionáveis por rodada: falhas suspeitas, registros corrompidos, sistemas críticos avançados e suspeitos no radar.
- `src/tn-main.js`: mostra o painel "O que importa nesta rodada" antes da discussão/votação.
- `src/style.css`: adiciona layout responsivo dos cards de briefing e suspeita.

---

## Sessão 5 — Pistas com sentido e investigação real ⬜
> Meta: cada rodada deve gerar informação usável para acusar, inocentar ou pressionar alguém.

| ID | Item | Status | Onde |
|---|---|---|---|
| G-09 | Modelo de evidências estruturadas | ✅ | Engine: `evidence[]` público com tipo, sala, candidatos/testemunhas, confiabilidade e origem |
| G-10 | Logs apontando candidatos, não só salas | ✅ | `generateLogs()`: logs públicos citam presentes/candidatos por sala sem revelar ação secreta |
| G-11 | Álibis por sala | ✅ | Engine/UI: jogadores juntos geram álibi parcial ou álibi contestado quando há sinal suspeito |
| G-12 | Contradições de depoimento CPU | ✅ | Engine/UI: `cpuStatements[]` público; conflitos viram evidência/briefing sem revelar papel |
| G-13 | Ações investigativas com retorno claro | ✅ | `trace_access`, `monitor_room`, `scan_player`: geram evidências específicas e mensagens compreensíveis |
| G-14 | Pistas falsas identificáveis depois | ✅ | `plant_false_evidence` registra rastro interno; `trace_access` pode revelar falsidade em rodada futura |
| G-15 | Linha do tempo da rodada | ✅ | Engine/UI: `roundTimeline` público mostra Movimento → Evento → Log → Depoimentos em ordem curta |
| G-16 | Histórico de suspeita entre rodadas | ✅ | Engine/UI: `playerHistory` público mantém cartões por jogador com fatos acumulados, votos e salas visitadas |

### G-09 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `evidence[]` ao estado base.
- `src/games/mission/mission-engine.js`: gera evidências estruturadas por rodada com `type`, `roomId`, `suspectIds`, `witnessIds`, `reliability`, `origin`, `originLogId` e `message`.
- `getPublicState()` expõe somente campos públicos da evidência, sem `roleId`, ação secreta ou identidade do Android.
- `src/games/mission/mission-validation.js`: adiciona validação de evidência pública segura.

### G-10 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: logs de sabotagem, logs corrompidos, câmera, médico, recuperação e acesso agora citam candidatos/presentes da sala.
- Logs falsos continuam marcados internamente e sanitizados no payload público.
- `src/games/mission/mission-validation.js`: valida que logs apontam candidatos sem revelar `overload_reactor`, papel ou Android.

### G-11 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: ocupação com 2+ jogadores gera álibi parcial; se a mesma sala teve sabotagem/corrupção/anomalia, gera álibi contestado.
- `src/tn-main.js`: adiciona painel "Evidências e álibis" nas fases de logs, discussão e atualização pública de dispositivos.
- `src/style.css`: adiciona estilos responsivos para evidências, álibis e estado contestado.
- `src/games/mission/mission-validation.js`: valida que jogadores juntos aparecem como testemunhas públicas e alimentam o briefing.

### G-12 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `cpuStatements[]` ao estado base.
- `src/games/mission/mission-engine.js`: CPUs ativos geram depoimento público de sala/ação; conflitos com ocupação ou logs suspeitos viram `statement_conflict` e item de briefing.
- `src/tn-main.js` e `src/style.css`: adicionam painel "Depoimentos dos CPUs" nas fases públicas da rodada.
- `src/games/mission/mission-validation.js`: valida que depoimentos conflitantes são públicos e não vazam papel, Android ou ação secreta.

### G-13 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: `trace_access`, `monitor_room` e `scan_player` agora geram evidências estruturadas (`investigation_trace`, `room_monitor`, `player_scan`) com candidatos, testemunhas e confiabilidade.
- `src/tn-main.js`: rotula os novos tipos no painel de evidências.
- `src/style.css`: destaca pistas investigativas sem criar novo layout.
- `src/games/mission/mission-validation.js`: valida que as três ações produzem retorno público específico.

### G-14 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `plantedFalseEvidence[]` interno ao host.
- `src/games/mission/mission-engine.js`: `plant_false_evidence` registra rastro privado; logs públicos continuam sanitizados até uma ação futura de `trace_access` revelar `false_evidence_revealed`.
- `src/tn-main.js` e `src/style.css`: mostram pista falsa confirmada como evidência/briefing público.
- `src/games/mission/mission-validation.js`: valida revelação futura por TI e ausência de vazamento de autoria, papel ou ação secreta no payload público.

### G-15 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: adiciona `roundTimeline` ao estado público a partir de ocupação, eventos públicos, logs públicos e depoimentos de CPUs.
- `src/tn-main.js`: exibe o painel "Linha do tempo" nas fases de logs, discussão, resultado de votação e atualização pública de dispositivos.
- `src/style.css`: adiciona timeline compacta com etapas numeradas e layout responsivo.
- `src/games/mission/mission-validation.js`: valida que a linha do tempo não vaza papel, Android ou ação secreta.

### G-16 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `playerHistory` público ao estado base.
- `src/games/mission/mission-engine.js`: registra salas visitadas e votos revelados por jogador, e expõe histórico sanitizado com suspeita/evidências públicas.
- `src/tn-main.js`: adiciona cartões de "Histórico de suspeita" por jogador nas fases investigativas e no device público.
- `src/style.css`: adiciona grid responsivo de histórico com pontuação, salas recentes e fatos acumulados.

---

## Sessão 6 — CPUs como personagens sociais ⬜
> Meta: bots precisam parecer oponentes/aliados investigáveis, principalmente no modo solo.

| ID | Item | Status | Onde |
|---|---|---|---|
| G-17 | Perfis de CPU visíveis | ✅ | Setup/UI: cauteloso, lógico, impulsivo, caótico, prestativo com descrição curta |
| G-18 | Depoimento de CPU após logs | ✅ | CPU/UI: cada bot responde "onde estava", "o que fez", "quem suspeita" |
| G-19 | Memória simples de comportamento | ✅ | CPU state: registrar suspeitos, acusações recebidas e alianças temporárias |
| G-20 | Voto de CPU explicado | ✅ | `applyCpuVotes()`: motivos públicos curtos por voto/skip, exibidos no resultado |
| G-21 | Android CPU com estratégia graduada | ✅ | CPU: dificuldade altera sabotagem óbvia/discreta e pressão pública |
| G-22 | Tripulantes CPU podem errar com personalidade | ✅ | CPU: erro de ação/voto segue perfil social, não aleatoriedade pura |
| G-23 | Pergunta direta do jogador para um CPU | ✅ | UI solo/engine: escolher até 2 CPUs por rodada para interrogar antes do voto |
| G-24 | Reações ao ser acusado | ✅ | CPU/UI: defesa curta baseada nos próprios logs, álibis públicos e perfil |

### G-17 — Implementado em 2026-06-21
- `src/games/mission/mission-cpu-profiles.js`: adiciona catálogo seguro de perfis (`cauteloso`, `lógico`, `impulsivo`, `caótico`, `prestativo`) com descrição curta, tom e estilo de voto.
- `src/games/mission/mission-cpu.js`: passa a usar o catálogo compartilhado ao criar CPUs.
- `src/games/mission/mission-engine.js`: expõe `isCpu` e `cpuProfile` no jogador público, sem papel ou identidade do Android.
- `src/tn-main.js` e `src/style.css`: mostram perfis dos CPUs no setup, chips públicos e fases investigativas.

### G-18 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: `cpuStatements[]` agora inclui respostas estruturadas para "onde estava", "o que fez", "quem suspeita" e uma linha de memória/aliança.
- Depoimentos consideram perfil social, sala declarada, logs públicos da rodada e suspeita pública acumulada sem revelar ações secretas.
- `src/tn-main.js` e `src/style.css`: renderizam os depoimentos em formato consultável após logs, discussão, resultado e device público.

### G-19 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `cpuMemory` ao estado base.
- `src/games/mission/mission-engine.js`: registra suspeitos observados, acusações recebidas por voto e alianças temporárias derivadas de álibis/salas públicas.
- `getPublicState()` expõe memória sanitizada em `cpuMemory` e dentro de `playerHistory`, sem `roleId`, ação secreta ou autoria privada.
- `src/games/mission/mission-validation.js`: adiciona teste cobrindo perfis, depoimentos, memória e ausência de vazamento.

### G-20 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `cpuVoteExplanations[]` ao estado.
- `src/games/mission/mission-cpu.js`: `applyCpuVotes()` registra uma justificativa pública curta para cada voto ou skip de CPU, com perfil, confiança e pista usada.
- `src/games/mission/mission-engine.js`: `getPublicState()` expõe justificativas sanitizadas sem papel, ação secreta ou identidade do Android.
- `src/tn-main.js` e `src/style.css`: adicionam painel "Votos dos CPUs" no resultado de votação.

### G-21 — Implementado em 2026-06-21
- `src/games/mission/mission-cpu.js`: dificuldade de CPU agora controla tendência do Android a sabotagem óbvia, sabotagem discreta e plantio de suspeita pública.
- No difícil, o Android CPU prioriza ações discretas (`fake_task`, `corrupt_logs`, `plant_false_evidence`) quando o contexto permite.
- `src/games/mission/mission-validation.js`: adiciona validação determinística para Android CPU difícil preferindo sabotagem menos óbvia.

### G-22 — Implementado em 2026-06-21
- `src/games/mission/mission-cpu.js`: erros de tripulantes CPU agora seguem perfil: cauteloso segura voto, lógico cruza evidência, impulsivo pressiona cedo, prestativo preserva álibis e caótico muda de foco.
- A escolha de ação de tripulantes também usa erro coerente com personalidade em vez de sorte pura.
- `src/games/mission/mission-validation.js`: adiciona validação para motivos públicos por personalidade e segurança do payload.

### G-23 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `cpuQuestions[]` público ao estado.
- `src/games/mission/mission-engine.js`: adiciona `askCpuQuestion()`, com limite de até 2 CPUs interrogados por rodada pelo humano e respostas baseadas em depoimento, evidência pública, suspeita e perfil social.
- `src/tn-main.js` e `src/style.css`: adicionam painel de interrogatório no modo solo assistido antes do voto, com respostas públicas consultáveis em discussão e resultado.
- `src/games/mission/mission-validation.js`: valida que perguntas/respostas não vazam papel, Android ou ação secreta.

### G-24 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js`: adiciona `cpuAccusationReactions[]` público ao estado.
- `src/games/mission/mission-engine.js`: adiciona `accuseCpu()`, com defesas curtas que usam apenas pressão pública, álibis/depoimentos e perfil do CPU.
- `src/tn-main.js` e `src/style.css`: adicionam botões de acusação contra CPUs no solo e painel "Defesas dos CPUs".
- A acusação antes do voto também alimenta memória pública do CPU como acusação recebida, sem revelar papel.

---

## Sessão 7 — Novas atividades de gameplay ⬜
> Meta: atividades devem criar risco/recompensa, informação e dilemas, não só progresso.

| ID | Item | Status | Onde |
|---|---|---|---|
| G-25 | Atividade "Calibrar Sistema" | ✅ | Normal task: sucesso gera progresso, falha gera ruído no log/evidência |
| G-26 | Atividade "Auditar Acesso" | ✅ | TI: ação técnica revela lista curta de possíveis autores de sabotagem |
| G-27 | Atividade "Ronda de Segurança" | ✅ | Segurança: escolhe uma sala para observar na próxima rodada |
| G-28 | Atividade "Parear Amostras" | ✅ | Médico: confirma se um jogador sofreu sabotagem ou fingiu condição |
| G-29 | Atividade "Reparo em Dupla" | ✅ | Mecânico/crew: exige dois jogadores na mesma sala; cria álibi forte |
| G-30 | Atividade "Transmissão de Emergência" | ✅ | Comunicações: se completada, reduz dano da próxima sabotagem do Android |
| G-31 | Sabotagem "Desviar Energia" | ✅ | Android: escolhe uma sala isca para gerar log falso de risco |
| G-32 | Sabotagem "Forjar Depoimento" | ✅ | Android: faz um CPU produzir depoimento inconsistente sem revelar autoria |
| G-33 | Evento "Apagão" | ✅ | Rodada especial: ocupação parcial, menos logs, maior peso para depoimentos |
| G-34 | Evento "Alarme de Intrusão" | ✅ | Rodada especial: todos veem 2 salas suspeitas e precisam priorizar investigação |

### G-25 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js` e `src/games/mission/mission-rooms.js`: adicionam `calibrate_system` como tarefa normal disponível nas salas.
- `src/games/mission/mission-engine.js`: resolução determinística de calibração; sucesso acelera progresso da missão, falha gera evento/log de ruído técnico e evidência `calibration_noise` de baixa confiabilidade.
- `src/tn-main.js` e `src/style.css`: rotulam ruído técnico no painel de evidências e briefing da rodada.
- `src/games/mission/mission-validation.js`: valida disponibilidade da ação, progresso/ruído público e ausência de vazamento no payload.

### G-26 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js` e `src/games/mission/mission-rooms.js`: adicionam `audit_access` para Técnico de TI em comunicações, depósito e ponte.
- `src/games/mission/mission-engine.js`: auditoria cruza sabotagens/logs suspeitos da rodada e cria evidência pública `access_audit` com até 3 candidatos, sem revelar papel ou ação secreta.
- `src/tn-main.js` e `src/style.css`: rotulam e destacam auditoria no painel de evidências.

### G-27 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js`: adiciona `security_patrol` com alvo de sala.
- `src/games/mission/mission-state.js` e `src/games/mission/mission-engine.js`: host guarda `securityWatches` e aplica a ronda na rodada seguinte, gerando evidência `security_patrol` ou álibi reforçado.
- `src/tn-main.js`: adiciona seleção privada de sala-alvo também no fluxo multi-device.
- `src/games/mission/mission-cpu.js`: CPUs de segurança escolhem sala alvo para a ronda.

### G-28 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js` e `src/games/mission/mission-rooms.js`: adicionam `match_samples` para Médico no laboratório.
- `src/games/mission/mission-engine.js`: pareamento gera evidência `sample_match`, diferenciando alteração real, condição inconsistente e alvo sem alteração.
- `src/games/mission/mission-validation.js`: adiciona validação integrada para G-26/G-27/G-28 e segurança do payload público.

### G-29 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js` e `src/games/mission/mission-rooms.js`: adicionam `dual_repair` em Engenharia e Reator.
- `src/games/mission/mission-engine.js`: o reparo só estabiliza a sala quando há 2+ jogadores no mesmo setor; em caso de sucesso, repara o setor, melhora integridade e gera evidência `strong_alibi`.
- `src/tn-main.js` e `src/style.css`: rotulam e destacam álibi forte/reparo incompleto no painel de evidências.

### G-30 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js` e `src/games/mission/mission-rooms.js`: adicionam `emergency_transmission` em Comunicações.
- `src/games/mission/mission-state.js` e `src/games/mission/mission-engine.js`: registram `emergencyTransmissions` no host; uma transmissão concluída reduz o dano da próxima sabotagem válida do Android.
- A evidência pública `emergency_transmission` informa o escudo sem revelar ações privadas.

### G-31 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js` e `src/games/mission/mission-rooms.js`: adicionam sabotagem `divert_energy` com alvo de sala-isca.
- `src/games/mission/mission-engine.js`: a sala-isca recebe risco público e evidência `energy_risk` de baixa confiabilidade; `getPublicState()` continua sanitizando logs falsos.
- `src/games/mission/mission-cpu.js`: Android CPU passa a considerar `divert_energy` como sabotagem discreta/de enquadramento.
- `src/games/mission/mission-validation.js`: adiciona validação integrada para G-29/G-30/G-31, incluindo correção para o briefing usar apenas logs públicos.

### G-32 — Implementado em 2026-06-21
- `src/games/mission/mission-actions.js` e `src/games/mission/mission-rooms.js`: adicionam sabotagem `forge_statement`, com alvo obrigatório em CPU.
- `src/games/mission/mission-engine.js`: depoimentos forjados geram inconsistência pública e evidência `forged_statement`, sem expor autoria, papel ou `actionId`.
- `src/games/mission/mission-cpu.js`: Android CPU considera `forge_statement` como sabotagem discreta/de enquadramento e mira CPUs ativos.
- `src/tn-main.js` e `src/style.css`: filtram alvos válidos e rotulam a evidência como "Depoimento forjado".

### G-33 — Implementado em 2026-06-21
- `src/games/mission/mission-state.js` e `src/games/mission/mission-engine.js`: adicionam eventos públicos de rodada; `blackout` deixa a ocupação parcial, reduz/degrada logs públicos e aumenta o peso de contradições.
- `src/games/mission/mission-content.js`: registra o evento "Apagão" no setting da nave.
- `src/tn-main.js` e `src/style.css`: exibem painel de evento da rodada nas telas públicas de investigação, discussão e resultado.

### G-34 — Implementado em 2026-06-21
- `src/games/mission/mission-engine.js`: adiciona evento `intrusion_alarm`, com duas salas suspeitas públicas e evidências `intrusion_alarm` para priorizar investigação.
- `src/games/mission/mission-content.js`: registra "Alarme de Intrusão" nos eventos especiais.
- `src/games/mission/mission-validation.js`: adiciona validação integrada para G-32/G-33/G-34, garantindo pistas públicas sem vazamento de papel, Android, autoria privada ou `actionId`.

---

## Sessão 8 — Ritmo, dificuldade e validação ⬜
> Meta: medir se as mudanças deixam o jogo mais divertido e com final menos abrupto.

| ID | Item | Status | Onde |
|---|---|---|---|
| G-35 | Simulador de 100 partidas por preset | ⬜ | Node/test: medir duração média, vencedor, rodadas até primeira acusação |
| G-36 | Métrica de qualidade de pistas | ⬜ | Teste: cada rodada deve ter ao menos 1 pista acionável e no máximo 1 pista forte |
| G-37 | Tuning por dificuldade | ⬜ | Config: fácil favorece pistas claras; difícil aumenta pistas ambíguas e Android cauteloso |
| G-38 | Tutorial jogável de 2 rodadas | ⬜ | UI: primeira partida guiada explicando suspeita, logs e votação |
| G-39 | Pós-partida explicativo | ⬜ | Final: revelar linha do tempo real do Android e comparar com pistas vistas |
| G-40 | Playtest checklist | ⬜ | Docs: critérios de "foi divertido?", "tive suspeitos?", "a derrota pareceu justa?" |
