# Revisão de Gameplay — Trust No One
Versão do documento: 1.0 | Data: 2026-05-04

---

## 1. Estado atual do jogo (diagnóstico)

O projeto tem uma fundação sólida: engine de regras completa em `src/games/mission/mission-engine.js`,
sistema de estado público/privado bem separado e telas HTML definidas. O problema é que a camada
de UI em `src/games/trustnoone/` está desconectada do engine real — o jogo simplesmente não começa.
O jogador vê o formulário de setup, clica em "Iniciar partida" e nada acontece além de um texto
de resumo aparecer na tela.

### O que funciona
- Navegação entre telas (Home → Setup → Configurações → voltar)
- Formulário de setup (sliders de jogadores/rodadas, nome da partida, toggle single-device)
- Salvamento de rascunho no localStorage
- Tema visual, backgrounds e responsividade visual das telas estáticas

### O que está quebrado ou ausente
- "Iniciar partida" não inicia o jogo — apenas salva rascunho e exibe texto
- Nenhum jogador pode ser cadastrado na lista (`#trustnoone-player-list` sem código)
- A tela de jogo `#trustnoone-play-root` nunca recebe conteúdo (tela em branco)
- Não há reveal de papéis (etapa fundamental: quem é o Android?)
- Não há seleção de sala por rodada
- Não há seleção de ação por jogador
- Não há fase de discussão com timer
- Não há votação funcional na UI
- Não há tela de resultados por rodada
- Não há tela final com reveal do Android e placar
- CPUs não implementados no módulo `trustnoone/`
- `trustnoone/mission-engine.js` tem apenas 6 linhas (cria só rascunho de config)
- O engine completo está em `games/mission/mission-engine.js` mas não é usado pela UI

---

## 2. Fluxo de jogo esperado (referência para os itens abaixo)

```
Home
 └─ [Nova Partida]
     └─ SETUP: cadastrar jogadores, ajustar configurações
         └─ [Iniciar]
             └─ REVEAL DE PAPÉIS: cada jogador vê seu papel (passa o celular)
                 └─ RODADA N (repete 4–8x)
                     ├─ Seleção de Sala (cada jogador escolhe, single-device em sequência)
                     ├─ Seleção de Ação (cada jogador escolhe em privado — passa o celular)
                     ├─ Resolução de Ações (engine aplica, eventos públicos aparecem)
                     ├─ Logs da Rodada (pistas públicas e privadas)
                     ├─ Discussão (timer público, conversa livre ao redor do celular)
                     └─ Votação (cada jogador vota em privado — passa o celular)
                         └─ Resultado da Votação (quem foi expulso ou empate)
                             └─ [Próxima Rodada] ou [FIM se condição atingida]
                                 └─ FINAL: reveal do Android, placar, vencedor
```

---

## 3. Lista de melhorias — priorizadas

Cada item tem ID, prioridade (P1=crítico, P2=alto, P3=médio), tipo e descrição do que fazer e por quê.

---

### Sessão 1 — Motor ligado (P1, bloqueadores absolutos)

#### M-01 · Conectar o engine real ao módulo trustnoone
- Prioridade: P1
- Tipo: Arquitetura
- O `trustnoone/mission-engine.js` tem apenas 6 linhas e não implementa nada. O engine completo
  está em `games/mission/mission-engine.js` (698 linhas, 100% funcional). A solução mais rápida é
  fazer `trustnoone/mission-ui-host.js` e `mission-main.js` importarem diretamente de
  `../mission/mission-engine.js`.
- Efeito sem correção: nenhuma lógica de jogo é executável.

#### M-02 · Cadastro de jogadores na tela de setup
- Prioridade: P1
- Tipo: UI
- O HTML tem `#trustnoone-player-list` mas não há código que permita adicionar jogadores. Precisa de:
  campo de nome + botão "+" ou auto-gerar campos baseados no slider. Ao ajustar o slider de
  quantidade, a lista de campos de nome deve atualizar. Botão "Iniciar" só ativa com mínimo 4 nomes.
- Efeito sem correção: o jogo não tem participantes cadastrados.

#### M-03 · "Iniciar partida" deve iniciar o jogo
- Prioridade: P1
- Tipo: Lógica de controle (mission-ui-host.js)
- O `handleSetupSubmit` atual: salva rascunho → para. Deve: (1) construir array de jogadores
  a partir da lista cadastrada, (2) chamar `createMissionGame()` e `assignRoles()` do engine,
  (3) salvar o estado completo em memória/localStorage, (4) navegar para `#screen-mission-play`,
  (5) disparar o renderizador da fase `roleReveal`.
- Efeito sem correção: ponto de entrada do jogo nunca é acionado.

#### M-04 · Renderizador central de fase (game loop de UI)
- Prioridade: P1
- Tipo: UI / Arquitetura (mission-ui-host.js ou mission-main.js)
- `#trustnoone-play-root` nunca recebe conteúdo. Precisa de uma função `renderPhase(state)` que
  leia `state.phase` e chame o renderer correto. Fases a cobrir:
  `roleReveal`, `roomSelection`, `actionSelection`, `resolution`, `logs`, `discussion`,
  `voting`, `voteReveal`, `final`.
- Efeito sem correção: tela em branco em todas as fases.

---

### Sessão 2 — Esqueleto do fluxo de jogo (P1, fases mínimas)

#### M-05 · Fase de Reveal de Papéis — passe o celular
- Prioridade: P1
- Tipo: UI + UX (mission-ui-player.js)
- Sequência para N jogadores: "Vez de [Nome] — toque para ver seu papel" (tela escura/bloqueada).
  Jogador toca. Mostra: nome do papel, time (Tripulação / Android Hackeado), habilidade especial.
  Botão "Entendi — passar adiante" esconde o papel e avança para o próximo jogador.
  Após o último jogador, avançar para a primeira rodada.
- Nunca mostrar o papel sem o gesto intencional. Este é o momento de maior tensão do jogo.

#### M-06 · Fase de Seleção de Sala
- Prioridade: P1
- Tipo: UI
- Grid de 6 salas com cards clicáveis: nome, ícone, status (normal/sabotada/bloqueada) em cores
  distintas. Cada jogador escolhe uma sala (single-device: em sequência, tela bloqueada entre cada
  um). Ao finalizar todos, avançar para seleção de ação.

#### M-07 · Fase de Seleção de Ação — privada
- Prioridade: P1
- Tipo: UI + Segurança (mission-ui-player.js)
- Tela bloqueada ("Vez de [Nome]"). Após toque: mostrar apenas as ações disponíveis para o papel
  e sala deste jogador (chamar `getAvailableActionsForPlayer()`). Ação escolhida não aparece em
  público — apenas "ação registrada ✓". Chamar `chooseAction()` ao confirmar.

#### M-08 · Resolução de Ações e Logs
- Prioridade: P1
- Tipo: UI
- Após todas as ações: chamar `resolveActions()` e `generateLogs()`. Mostrar tela pública com:
  eventos da rodada (o que aconteceu em cada sala, sem revelar identidades), nível de alerta
  (verde/amarelo/vermelho), barra de integridade da nave e barra de progresso da missão.
  Abaixo, lista de logs com precisão variável (pistas para dedução).

---

### Sessão 3 — Jogo completo de ponta a ponta (P1)

#### M-09 · Fase de Discussão com Timer
- Prioridade: P1
- Tipo: UI
- Tela visível a todos: timer regressivo grande e legível, lista de jogadores ativos, eventos
  da rodada disponíveis para consulta. Botão para o host encerrar antecipadamente. Ao finalizar
  (timeout ou botão), avançar para votação.

#### M-10 · Fase de Votação — privada, em sequência
- Prioridade: P1
- Tipo: UI
- Single-device: cada jogador vota em privado (tela bloqueada entre cada um). Lista de jogadores
  ativos como opções de voto. Opção "Ninguém (pular)". Timer de votação visível. Após todos
  votarem: chamar `resolveVoting()`.

#### M-11 · Resultado da Votação e avanço de rodada
- Prioridade: P1
- Tipo: UI
- Mostrar: quem foi expulso (ou "empate — ninguém foi expulso"), atualizar barras de integridade
  e progresso. Se condição de vitória foi atingida, ir para tela final. Caso contrário: botão
  "Próxima rodada" (apenas host aciona).

#### M-12 · Tela Final — reveal do Android e placar
- Prioridade: P1
- Tipo: UI
- Mostrar: vencedor (Tripulação ou Android), revelar identidade do Android (nome + papel),
  placar de estatísticas por jogador (tarefas, sabotagens, votos dados/recebidos). Botão
  "Jogar novamente" que reinicia setup com os mesmos jogadores.

---

### Sessão 4 — UX essencial para coerência (P2)

#### M-13 · Indicador de fase e rodada sempre visível
- Prioridade: P2
- Tipo: UX
- O header da tela de jogo mostra apenas "Trust No One". Adicionar: número de rodada atual
  ("Rodada 2 / 6"), nome da fase atual ("Votação"), nível de alerta como ícone colorido.
  Qualquer jogador que pegue o celular deve entender imediatamente onde o jogo está.

#### M-14 · HUD da nave (integridade + progresso da missão)
- Prioridade: P2
- Tipo: UX
- Sempre visível durante o jogo: barra de Integridade da Nave (0–100%) e barra de Progresso
  da Missão (0–100%). No mobile: topo fixo compacto. No desktop: sidebar ou cabeçalho expandido.
  Sem estas métricas, a tensão estratégica do jogo não existe para o jogador.

#### M-15 · Padrão "passe o celular" com tela de privacidade
- Prioridade: P2
- Tipo: UX — específico single-device
- Toda transição para ação privada deve seguir o padrão: (1) tela escura com nome do próximo
  jogador, (2) botão "Estou pronto" — o próximo jogador pressiona, (3) informação privada é
  revelada. Evita que o jogador anterior veja informações do próximo. Aplicar em: reveal de
  papéis, seleção de ação, votação.

#### M-16 · Feedback de ação confirmada (toast neutro)
- Prioridade: P2
- Tipo: UX
- Após o jogador confirmar uma ação, mostrar feedback visual breve: "Ação registrada." Sem
  revelar tipo ou resultado. Depois esconder a tela privada. Evita dúvida de "enviou ou não?".

#### M-17 · Lista de jogadores com status visual
- Prioridade: P2
- Tipo: UX
- Em todas as fases: lista de jogadores com inicial/avatar, nome, status (ativo, expulso).
  Expulsos em cinza com ícone ✗. No mobile: chips horizontais compactos no topo ou rodapé.
  No desktop: sidebar com cards. Nunca mostrar papel em público.

#### M-18 · Logs de pistas com formatação legível
- Prioridade: P2
- Tipo: UX
- Logs gerados pelo engine são textos planos. Na UI: cards com ícone por tipo (acesso, sabotagem,
  médico, segurança, corrompido), nome da sala, precisão indicada por cor/opacidade
  (forte = visível, vago = esmaecido). Devem ser consultáveis durante a discussão.

---

### Sessão 5 — Layout responsivo (P2)

#### M-19 · Layout mobile portrait — tela de jogo
- Prioridade: P2
- Tipo: Layout (style.css)
- Stack vertical para 320–430px: HUD fixo no topo (compacto), área de conteúdo da fase no
  centro (scrollável se necessário), jogadores em chips no rodapé. Botões de ação: mínimo 48px
  de altura. Timer: mínimo 2.5rem. Sem overflow horizontal.

#### M-20 · Layout desktop landscape — tela de jogo
- Prioridade: P2
- Tipo: Layout (style.css)
- Grid 2 colunas em ≥1024px: sidebar esquerda (280px fixo) com HUD da nave, lista de jogadores
  e logs de pistas; área principal à direita com a fase ativa. Sidebar sempre visível, sem
  necessidade de scroll lateral.

#### M-21 · Tela de setup mobile — usabilidade da lista de jogadores
- Prioridade: P2
- Tipo: Layout
- Com muitos jogadores, o formulário fica longo. Usar scroll suave dentro do card. Campos de
  nome com botão "Próximo" no teclado para navegar entre campos sem fechar o teclado. Botão
  "Iniciar" fixo no rodapé do card, sempre acessível.

#### M-22 · Aviso de orientação landscape no mobile
- Prioridade: P2
- Tipo: UX
- Em mobile landscape (max-height: 520px), a tela de jogo perde muito espaço. Mostrar toast:
  "Para melhor experiência, gire o celular para modo retrato." Dispensável pelo usuário.

---

### Sessão 6 — CPUs e robustez (P2)

#### M-23 · CPUs jogáveis no modo single-device
- Prioridade: P2
- Tipo: Funcionalidade (novo: trustnoone/mission-cpu.js)
- CPUs devem: escolher sala aleatória (ou por heurística simples), escolher primeira ação
  disponível, votar em jogador com mais votos (dificuldade normal) ou aleatório (fácil).
  Nas fases privadas, CPUs são processados automaticamente sem precisar "passar o celular".
  Referência: `games/mission/mission-cpu.js` se existir.

#### M-24 · Persistência de estado entre recargas
- Prioridade: P2
- Tipo: Robustez (storage.js)
- Salvar o estado completo do jogo em localStorage a cada mudança de fase. Na tela home, se
  houver partida salva em andamento, mostrar botão "Continuar partida". Evita perda por acidente
  (especialmente crítico em single-device onde o celular circula).

#### M-25 · Validação de setup com feedback inline
- Prioridade: P2
- Tipo: UX
- Se o setup for inválido (< 4 jogadores, nome vazio, nome duplicado), mostrar mensagem
  específica próxima ao campo. Botão "Iniciar" desabilitado até o setup ser válido. Sem
  alerts ou erros no console.

---

### Sessão 7 — Polimento (P3)

#### M-26 · Transições suaves entre fases
- Prioridade: P3
- Tipo: UX (style.css)
- Fade ou slide de 300ms entre fases. Exibir nome da fase no centro durante a transição.
  Evita a sensação de "quebra" quando diferentes jogadores pegam o celular.

#### M-27 · Acessibilidade mínima no mobile
- Prioridade: P3
- Tipo: A11y
- Botões com área de toque ≥ 44×44px. Contraste mínimo 4.5:1 em textos de status. Timer com
  `aria-live="polite"`. Ícones decorativos com `aria-hidden="true"`.

#### M-28 · Histórico da última partida na home
- Prioridade: P3
- Tipo: Funcionalidade leve (storage.js)
- Salvar no localStorage: resultado da última partida (quem venceu, quem era o Android,
  rodadas jogadas). Exibir na tela home como "Última partida: Android sobreviveu em 6 rodadas."
  Sem servidor, apenas localStorage.

---

## 4. Sequência recomendada de sessões

```
Sessão 1 → M-01, M-02, M-03, M-04
  Meta: o jogo começa ao clicar em "Iniciar". A tela de play recebe conteúdo.

Sessão 2 → M-05, M-06, M-07, M-08
  Meta: todas as fases existem. Uma rodada completa é jogável.

Sessão 3 → M-09, M-10, M-11, M-12
  Meta: múltiplas rodadas, votação funcional, tela final. O jogo termina.

Sessão 4 → M-13, M-14, M-15, M-16, M-17, M-18
  Meta: jogo compreensível, privacidade garantida, HUD útil.

Sessão 5 → M-19, M-20, M-21, M-22
  Meta: funciona bem em mobile portrait e desktop landscape.

Sessão 6 → M-23, M-24, M-25
  Meta: CPUs funcionam. Não perde estado ao recarregar. Setup valida.

Sessão 7 → M-26, M-27, M-28
  Meta: experiência polida e acessível.
```

---

## 5. Arquivos-chave por sessão

| Arquivo | Uso |
|---|---|
| `src/games/mission/mission-engine.js` | Engine completo (698 linhas) — fonte da verdade das regras |
| `src/games/trustnoone/mission-engine.js` | Stub de 6 linhas — redirecionar imports (M-01) |
| `src/games/trustnoone/mission-main.js` | 3 linhas — orquestrar game loop aqui (M-03, M-04) |
| `src/games/trustnoone/mission-ui-host.js` | Setup form — expandir para iniciar jogo (M-02, M-03) |
| `src/games/trustnoone/mission-ui-player.js` | Placeholder — implementar fases privadas (M-05, M-07, M-10) |
| `src/index.html` linhas 250–270 | Tela de play e device — adicionar HTML das fases |
| `src/shared/timer.js` | Timer reutilizável para discussão e votação |
| `src/shared/ui.js` | `showScreen()` para navegação |
| `src/style.css` | Layout base — adicionar classes `.mission-play-*` |

---

## 6. Decisão de arquitetura — pendente antes da Sessão 1

Como conectar `trustnoone/` ao engine real (`games/mission/mission-engine.js`)?

**Opção A (recomendada para as primeiras sessões):** `mission-ui-host.js` e `mission-main.js`
  importam diretamente de `../mission/mission-engine.js`.
  Vantagem: usa código já testado sem copiar. Risco: acoplamento entre os dois diretórios.

**Opção B:** Copiar `mission-engine.js` para `trustnoone/`.
  Vantagem: independência total. Risco: duplicação que pode divergir.

**Opção C:** Mover engine para `shared/` como módulo compartilhado.
  Vantagem: arquitetura limpa. Risco: mais refatoração antes do jogo funcionar.

Sugestão: Opção A para as sessões 1–3; decidir sobre mover para `shared/` depois que o jogo
estiver funcional de ponta a ponta.
