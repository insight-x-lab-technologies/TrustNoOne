# Auditoria para Mimi Mission / Mimi Impostor / Starship Sabotage

Este documento avalia a base atual da MimiMania para criar um novo jogo de deducao social por rodadas, multi-device, em JavaScript vanilla, HTML e CSS. A recomendacao geral e reaproveitar a infraestrutura visual e operacional, mas criar uma camada de gameplay separada para impedir vazamento de papeis secretos, acoes secretas e identidade do Android hackeado.

## Objetivo do MVP

Criar um fluxo minimo jogavel com:

- Configuracao de jogadores.
- Sorteio privado de papeis.
- Tela privada por jogador para revelar apenas seu proprio papel.
- Rodadas com fase publica de missao, votacao e resultado.
- Estado publico separado do estado privado.
- Sincronizacao multi-device transmitindo apenas dados publicos ou dados privados enderecados ao device correto.

## 1. Reutilizar diretamente

### Sistema de temas

Arquivos principais:

- `src/themes.css`
- Partes globais de `src/style.css`
- `applyTheme`, `getCurrentTheme` e variaveis relacionadas em `src/script.js`

Motivo:

- O tema ja e baseado em tokens CSS por classe `body.theme-*`.
- A estetica cosmica combina com a nave espacial a deriva.
- Pode sustentar o novo jogo sem mudar arquitetura.

Cuidados:

- O novo jogo deve usar os mesmos tokens, mas pode criar classes de tela novas.
- Evitar acoplar nomes de temas a regras de gameplay.

### Layout visual e componentes base

Arquivos principais:

- `src/index.html`
- `src/style.css`

Elementos reutilizaveis:

- `.screen` e navegacao por telas.
- `.page-shell`, `.page-header`, `.card`.
- `.btn`, `.inp`, `.toggle`, `.mode-card`.
- Notificacao `#notif`.
- Pads mobile-first, grids responsivos e estados `.hidden`.

Motivo:

- A UI atual ja esta pronta para celular e jogo familiar.
- Os componentes sao genericos o bastante para setup, lobby, sala publica e telas privadas.

Cuidados:

- Reutilizar classes visuais, nao a estrutura de mímica/desenho.
- Criar telas proprias do novo jogo, em vez de adaptar `screen-game` atual.

### PWA basico

Arquivos principais:

- `src/manifest.webmanifest`
- `src/service-worker.js`
- Registro do service worker em `src/index.html`

Motivo:

- O comportamento de instalacao e cache da casca do app e reutilizavel.
- O novo jogo pode continuar sendo servido como app standalone.

Cuidados:

- Manifesto precisa pequena revisao de nome/descricao se o app virar multi-jogo.
- Service worker precisara incluir novos arquivos caso a implementacao seja modularizada.

### Funcoes utilitarias pequenas

Funcoes candidatas:

- `clone`
- `getNestedValue`
- `copyTextToClipboard`
- `getThemeVar`
- `showNotif`
- `resetViewportToTop`
- `openExternalUrl`

Motivo:

- Sao genericas e independentes da regra de mímica.

Cuidados:

- Devem ser movidas para modulo/utilitario ou mantidas sem conhecer estado do jogo.

## 2. Reutilizar apos pequena refatoracao

### Sistema de idiomas

Arquivos principais:

- `TRANSLATIONS` em `src/script.js`
- `applyTranslations`
- `setLanguage`
- `refreshLocalizedUI`

Motivo:

- O mecanismo de `data-i18n`, placeholder, title e aria-label e bom.
- Ja suporta multiplos idiomas.

Refatoracao necessaria:

- Separar traducoes de infraestrutura das traducoes do jogo atual.
- Criar namespace novo, por exemplo `impostor.*`.
- Evitar que `refreshLocalizedUI` chame renderizadores especificos de mímica/desenho quando o modo ativo for o novo jogo.

Risco:

- Hoje o i18n esta muito acoplado a `gameState`, wordbank, leaderboard e telas atuais.

### Storage/localStorage

Arquivos principais:

- Chaves `mm_settings_v2`, `mm_content_v1`, `mm_leaderboard_v1`, `mm_quick_game_v1`, `mm_user_id_v1`
- `saveSettings`, `initializeSettings`
- `clearAppStorage`

Motivo:

- Settings, tema, idioma, som, musica e user_id podem ser compartilhados.

Refatoracao necessaria:

- Criar chaves separadas para o novo jogo, por exemplo `mm_impostor_settings_v1`, `mm_impostor_last_players_v1`, `mm_impostor_leaderboard_v1`.
- Nunca persistir papeis secretos em storage compartilhado sem escopo e expiracao.
- Separar storage publico de storage privado por device.

Risco:

- O reset atual apaga tudo com prefixo `mm_`.
- Reusar chaves de jogadores/placar do jogo atual misturaria historicos incompatíveis.

### Musica e sons

Arquivos principais:

- `musicState`
- `updateBackgroundMusic`
- `playBeep`, `playAlertBeep`, `playNavigationSound`, `playCorrectSound`, `playWrongSound`

Motivo:

- AudioContext e musica por tema podem ser reaproveitados.
- Alertas sonoros ajudam em fases cronometradas.

Refatoracao necessaria:

- Generalizar `GAMEPLAY_MUSIC_SCREENS` para aceitar telas do novo jogo.
- Criar sons semanticamente neutros: inicio de fase, alerta, votacao, emergencia.
- Evitar `correct/wrong` como API principal do novo jogo.

### Leaderboard

Arquivos principais:

- Tela `screen-leaderboard`
- `loadLeaderboard`, `saveLeaderboard`, `renderLeaderboard`

Motivo:

- O modelo de ranking local e a UI podem servir como base.

Refatoracao necessaria:

- Separar schema do placar por jogo.
- O novo jogo precisa metricas diferentes: vitorias da tripulacao, vitorias do Android, partidas como impostor, votos corretos, missoes salvas.
- Adicionar filtro por jogo se a MimiMania virar hub multi-jogo.

Risco:

- O schema atual depende de `mime/drawing` e `teams/ffa`.
- Reutilizar diretamente geraria dados sem significado.

### Multi-device

Arquivos principais:

- `screen-multidevice`
- `screen-guest`
- PeerJS e QRCode em `src/index.html`
- `multiDeviceState`
- `createMultiDeviceHost`
- `connectToMultiDeviceHost`
- `broadcastHostGameState`
- `buildHostGamePayload`
- `sendToGuest`

Motivo:

- Ja existe host, join por link/codigo, QR code e broadcast para guests.
- A base e util para lobby e sincronizacao de telas.

Refatoracao necessaria:

- Trocar broadcast unico por roteamento de mensagens por destinatario.
- Criar envelope de mensagem com `scope: public | private`, `recipientDeviceId` e `phase`.
- Criar builders separados: `buildPublicState`, `buildPrivatePlayerState`.
- Garantir que telas publicas nunca recebam `role`, `impostorId`, sabotagens secretas ou acoes privadas.
- Adicionar validacao defensiva antes de qualquer `conn.send`.

Risco critico:

- O modelo atual foi feito para tela auxiliar publica. Ele nao resolve segredo por jogador.
- No social deduction, enviar o estado completo para guests quebra o jogo.

### Setup de jogadores

Arquivos principais:

- `screen-setup`
- `renderTeamPlayers`, `renderFFAPlayers`, `addFFAPlayer`, `removeFFAPlayer`
- `loadPlayersForMode`

Motivo:

- Entrada de nomes, validacao de quantidade e layout mobile podem ser reaproveitados.

Refatoracao necessaria:

- Criar setup proprio sem times A/B.
- Suportar 4 a 10 jogadores, se definido nas regras.
- Adicionar atribuicao de device por jogador no multi-device.
- Separar cadastro publico de dados privados do papel.

Risco:

- O setup atual presume mímica/desenho, dificuldade, categorias, rounds por jogador e times/FFA.

## 3. Copiar como referencia, mas recriar para o novo jogo

### Gameplay principal em `script.js`

Trechos de referencia:

- `gameState`
- `startGame`
- `initTurn`
- `revealWord`
- `startTimer`
- `markResult`
- `nextTurn`
- `showMidScore`
- `showFinalScore`

Motivo:

- O ciclo por fases e timer serve como exemplo de fluxo.

Por que recriar:

- A regra do novo jogo e outra: papeis secretos, sabotagem, discussao, votacao, tarefas/missoes e condicoes de vitoria.
- O estado atual mistura configuracao, estado publico, palavra secreta, pontuacao e renderizacao.
- Para o novo jogo, o estado deve nascer separado:
  - Estado publico: fase, rodada, timer, jogadores vivos/ativos, eventos publicos, votos revelados quando apropriado.
  - Estado privado: papel, alinhamento, poderes, alvo de sabotagem, informacoes do Android.
  - Estado local do device: jogador dono, conexao, tela atual.

### Telas de jogo, placar e resultado

Arquivos principais:

- `screen-game`
- `screen-score`
- `screen-final`
- `resultOverlay`
- CSS de scoreboard e timer

Motivo:

- Servem como referencia visual de estados, timer e feedback.

Por que recriar:

- O novo jogo precisa telas de papel secreto, briefing, missao, sabotagem, discussao, votacao, resultado de rodada e final.
- O overlay de correto/errado nao se encaixa na experiencia de deducao social.

### Sistema de packs/add-ons

Arquivos principais:

- `WORD_PACK_SCHEMA`
- Validacao de assinatura
- `contentModel`
- `installWordPackFile`
- `renderWordBank`
- `buildInstalledPackFromEnvelope`

Motivo:

- A arquitetura de packs assinados e localmente instalaveis e valiosa.

Por que recriar:

- O conteudo do novo jogo nao e banco de palavras; deve ser missoes, eventos, sabotagens, mapas, papeis e prompts familiares.
- O schema precisa outro nome e outra validacao, por exemplo `mimimania.impostorpack.v1`.
- O modelo deve impedir packs com textos adultos, acusatorios ou inadequados para familia, se houver curadoria.

### Canvas/desenho

Arquivos principais:

- `drawingState`
- `initializeDrawingCanvas`
- `broadcastDrawingStroke`
- `guestDrawingState`

Motivo:

- Serve como referencia se futuramente houver tarefas de desenho, mapa ou minigames.

Por que recriar:

- Nao e necessario para o MVP social deduction.
- A transmissao de desenho atual e publica, nao privada.
- Manter canvas no MVP aumenta superficie de bug sem ajudar a regra principal.

### Quick game

Arquivos principais:

- `QUICK_GAME_KEY`
- `normalizeQuickGameConfig`
- `startQuickGame`
- `renderQuickGameSummary`

Motivo:

- Bom exemplo de configuracao rapida e persistida.

Por que recriar:

- O novo jogo precisa presets diferentes: numero de Androids, papeis ativos, duracao de discussao, dificuldade familiar, modo com/sem eliminacao.

## 4. Nao reutilizar

### Banco de palavras core como gameplay

Arquivos principais:

- `DEFAULT_WORDS_*`
- `CATEGORY_KEYS`
- `DIFFICULTY_KEYS`
- `pickWord`
- `getCoreWordsForCategory`

Motivo:

- E conteudo especifico de mímica/desenho.
- Nao modela missoes, sabotagens, papeis nem deducao social.

Excecao:

- Pode inspirar estrutura multilíngue de conteudo.

### Regras de pontuacao do jogo atual

Arquivos principais:

- `DEFAULT_CORRECT_POINTS`
- `DEFAULT_WRONG_PENALTY_POINTS`
- `DEFAULT_FFA_GUESSER_POINTS`
- `addScore`
- `recordLeaderboardFinalScore`

Motivo:

- Correto/errado, pontos de ator e adivinhador nao existem como regra central no novo jogo.

### Modos atuais `mime`, `drawing`, `teams`, `ffa`

Arquivos principais:

- `GAME_TYPES`
- `LEADERBOARD_MODE_KEYS`
- `selectGameType`
- `selectMode`

Motivo:

- Sao conceitos do jogo antigo.
- O novo jogo deve ter modo proprio, por exemplo `impostor`, com subconfiguracoes de papeis e rodadas.

### Tela de wordbank para jogador final

Arquivos principais:

- `screen-wordbank`
- Funcoes de adicionar/remover palavras e desafios

Motivo:

- Nao serve para o MVP.
- Pode confundir familia e aumentar manutencao.

Excecao:

- Administracao de packs pode voltar depois, com schema novo.

### Doacoes e compartilhamento como parte do MVP do novo jogo

Arquivos principais:

- `screen-donate`
- `shareToPlatform`
- Scripts externos de Buy Me a Coffee e Ko-fi

Motivo:

- Nao sao essenciais para validar a jogabilidade.
- Podem permanecer no app existente, mas nao devem entrar no nucleo do novo jogo.

## Analise por arquivo

### `src/index.html`

Classificacao:

- Reutilizar diretamente: estrutura de shell, import de CSS, PWA, componentes visuais.
- Reutilizar apos pequena refatoracao: home, multi-device, settings, leaderboard.
- Copiar como referencia: setup, game, score, final.
- Nao reutilizar: wordbank como feature do novo MVP.

Recomendacao:

- Adicionar telas novas para o jogo impostor em vez de editar profundamente as telas atuais.
- Separar telas publicas e privadas desde o HTML.

### `src/style.css`

Classificacao:

- Reutilizar diretamente: tokens globais, componentes, responsividade, cards, botoes, inputs, notificacao.
- Reutilizar apos pequena refatoracao: estilos de leaderboard, multi-device e settings.
- Copiar como referencia: timer, score rows, game layout.
- Nao reutilizar: regras condicionadas a `body[data-game-type="drawing"]` para o novo jogo.

Recomendacao:

- Criar uma secao CSS propria para `impostor`, reaproveitando classes base.

### `src/themes.css`

Classificacao:

- Reutilizar diretamente.

Recomendacao:

- Usar o tema `cosmic` como padrao inicial do novo jogo.
- Se houver identidade propria, adicionar apenas tokens/overrides sem mexer na regra de jogo.

### `src/script.js`

Classificacao:

- Reutilizar diretamente: utilitarios pequenos, tema, notificacao, clipboard, fullscreen/PWA.
- Reutilizar apos pequena refatoracao: i18n, settings, audio, multi-device, storage.
- Copiar como referencia: fluxo de fases, timer, placar, setup, packs.
- Nao reutilizar: gameplay atual, wordbank como regra, pontuacao atual, modos mime/drawing.

Recomendacao:

- Antes do novo jogo crescer, dividir `script.js` por responsabilidade ou criar um modulo novo isolado.
- O MVP deve ter funcoes puras para reducer/estado e funcoes separadas para renderizacao.

### `src/manifest.webmanifest`

Classificacao:

- Reutilizar apos pequena refatoracao.

Recomendacao:

- Se o produto virar hub, ajustar nome/descricao para MimiMania.
- Se virar jogo independente, ajustar para Mimi Mission ou nome final.

## Recomendacao de arquitetura para o novo jogo

Criar um nucleo novo com estas responsabilidades:

- `createInitialImpostorState(config)`.
- `assignSecretRoles(players, options)`.
- `getPublicState(state)`.
- `getPrivateStateForPlayer(state, playerId)`.
- `applyPublicAction(state, action)`.
- `applyPrivateAction(state, playerId, action)`.
- `buildDevicePayload(state, deviceContext)`.

Regra obrigatoria:

- Toda mensagem multi-device deve passar por `buildDevicePayload`.
- Nenhum objeto de estado completo deve ser enviado diretamente por PeerJS.
- Nenhum render publico deve receber estado privado.

## Plano incremental sugerido

1. Criar entrada do novo jogo na home.
2. Criar setup simples de jogadores sem times.
3. Criar atribuicao local de papeis com revelacao privada no mesmo device.
4. Criar loop publico: briefing, missao, discussao, votacao, resultado.
5. Adaptar multi-device com roteamento privado por jogador.
6. Adicionar leaderboard proprio.
7. Adicionar packs de missoes e sabotagens depois do MVP.

## Decisao final

A base atual e boa como app shell e biblioteca visual, mas nao como nucleo de regra para deducao social. O maior reaproveitamento seguro esta em temas, componentes, i18n, settings, audio, PWA e parte da conexao multi-device. O gameplay, o modelo de estado e o protocolo de mensagens precisam ser novos para proteger informacoes secretas.
