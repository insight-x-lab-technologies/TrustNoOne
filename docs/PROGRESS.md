# Trust No One — Controle de Progresso
Última atualização: 2026-05-04 | Sessão 3 concluída

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
- Engine: 10/10 testes de validação passam em Node.js
