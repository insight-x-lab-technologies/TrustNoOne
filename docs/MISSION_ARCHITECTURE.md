# Arquitetura modular para TrustNoOne

Este documento propoe uma arquitetura incremental para adicionar o novo jogo TrustNoOne, tambem chamado provisoriamente de Mimi Mission, Mimi Impostor ou Starship Sabotage, sem quebrar o jogo atual da MimiMania. A ideia e extrair apenas infraestrutura compartilhada e manter a regra do novo jogo em um nucleo proprio, pequeno e testavel.

## Objetivos

- Manter JavaScript vanilla, HTML e CSS.
- Evitar framework novo.
- Preservar o jogo atual durante a migracao.
- Criar uma engine separada para deducao social.
- Separar estado publico de estado privado desde o MVP.
- Impedir vazamento da identidade do Android hackeado.
- Comecar single-device e evoluir para multi-device com o mesmo contrato de estado.

## Estrutura sugerida

```text
src/
  index.html
  style.css
  themes.css
  script.js
  shared/
    storage.js
    i18n.js
    audio.js
    theme.js
    ui.js
    timer.js
  games/
    trustnoone/
      mission-engine.js
      mission-state.js
      mission-content.js
      mission-roles.js
      mission-rooms.js
      mission-actions.js
      mission-logs.js
      mission-voting.js
      mission-ui-host.js
      mission-ui-player.js
      mission-multidevice.js
```

## Regra de migracao

O jogo atual deve continuar funcionando pelo caminho existente. O novo jogo deve entrar como uma trilha paralela, usando modulos novos. A extracao para `shared/` deve ser feita aos poucos, apenas quando houver uso real por mais de um jogo.

## O que fica em `shared/`

### `shared/storage.js`

Responsavel por acesso padronizado a `localStorage` e `sessionStorage`.

Deve conter:

- Leitura e escrita JSON com fallback seguro.
- Namespaces por jogo.
- Helpers para migracao de schema.
- Reset por namespace, nao reset global cego.
- Storage efemero de dados privados do device, quando necessario.

Nao deve conter:

- Regras de placar.
- Papeis.
- Missoes.
- Identidade do Android.

Chaves recomendadas:

- `mm_settings_v2` para configuracoes globais ja existentes.
- `mm_trustnoone_config_v1` para presets do novo jogo.
- `mm_trustnoone_leaderboard_v1` para historico do novo jogo.
- `mm_trustnoone_device_v1` para vinculo local do device.

### `shared/i18n.js`

Responsavel por traducao da UI.

Deve conter:

- Registro de dicionarios por namespace.
- Funcao `t(key, params, language)`.
- Aplicacao de `data-i18n`, `data-i18n-placeholder`, `data-i18n-title` e `data-i18n-aria-label`.
- Resolucao do idioma ativo.

Namespaces sugeridos:

- `common.*`
- `settings.*`
- `home.*`
- `mission.*`
- `mission.role.*`
- `mission.phase.*`
- `mission.action.*`

Nao deve conter:

- Renderizacao especifica de telas.
- Logica de fases do jogo.

### `shared/audio.js`

Responsavel por efeitos sonoros e musica.

Deve conter:

- Unlock de audio por interacao do usuario.
- Musica por contexto: menu, gameplay, tensao, resultado.
- Sons semanticos: click, alert, phaseStart, vote, reveal, success, danger.

Nao deve conter:

- Condicoes de vitoria.
- Regras de timer.
- Nomes de telas especificas do jogo atual.

### `shared/theme.js`

Responsavel por tema visual.

Deve conter:

- `applyTheme`.
- `getCurrentTheme`.
- `getThemeVar`.
- Validacao de temas disponiveis.

Nao deve conter:

- Estado de partida.
- Regras por jogo.

### `shared/ui.js`

Responsavel por utilitarios de interface.

Deve conter:

- Navegacao entre telas.
- `showNotif`.
- Helpers de modal simples.
- Clipboard.
- Fullscreen.
- PWA install prompt.
- Reset de scroll.

Nao deve conter:

- Renderizacao de jogador, voto ou missao.
- Acesso a estado privado.

### `shared/timer.js`

Responsavel por cronometros reutilizaveis.

Deve conter:

- Timer com start, pause, resume, stop.
- Callback de tick.
- Callback de fim.
- Formatacao de tempo.
- Adaptador para UI circular, se continuar sendo usado.

Nao deve conter:

- Decisao do que acontece quando o timer termina.
- Penalidade ou pontuacao.

## O que fica especifico de `games/trustnoone/`

### `mission-state.js`

Define formatos e criadores de estado.

Deve conter:

- `createInitialMissionState(config)`.
- `createPublicState(state)`.
- `createPrivateStateForPlayer(state, playerId)`.
- `createHostSnapshot(state)`.
- Normalizacao de jogadores.
- Fases validas da partida.

Estado minimo sugerido:

- `gameId`
- `phase`
- `round`
- `players`
- `room`
- `mission`
- `publicEvents`
- `votes`
- `winner`
- `privateByPlayerId`

Regra:

- `privateByPlayerId` nunca deve ser entregue diretamente a UI publica.

### `mission-engine.js`

Orquestra a partida e aplica transicoes puras.

Deve conter:

- `startMissionGame(config, rng)`.
- `advancePhase(state, action)`.
- `applyAction(state, action)`.
- `resolveRound(state)`.
- `checkWinCondition(state)`.

Deve ser o modulo mais testavel.

Nao deve conter:

- DOM.
- PeerJS.
- localStorage.
- Audio.

### `mission-content.js`

Conteudo do jogo.

Deve conter:

- Missoes familiares.
- Eventos da nave.
- Sabotagens.
- Textos de briefing.
- Dicas publicas.
- Configuracoes de dificuldade.

Futuro:

- Pode evoluir para packs assinados, mas com schema proprio, por exemplo `mimimania.trustnoonepack.v1`.

### `mission-roles.js`

Define papeis e poderes.

Papeis iniciais:

- Android hackeado.
- Mecanico.
- Tecnico de TI.
- Medico.
- Seguranca.
- Tripulante.

Deve conter:

- Metadados publicos do papel, quando houver.
- Texto privado do papel.
- Restricoes de quantidade.
- Distribuicao por numero de jogadores.
- Helpers para saber alinhamento sem expor identidade.

Regra:

- O nome do Android deve existir somente no estado privado do host e no estado privado do proprio jogador Android.

### `mission-rooms.js`

Define locais da nave.

Exemplos:

- Ponte de comando.
- Engenharia.
- Medbay.
- Comunicacoes.
- Reator.
- Deposito.

Deve conter:

- Lista de salas.
- Eventos possiveis por sala.
- Regras publicas de localizacao, se usadas.

### `mission-actions.js`

Define acoes de jogador.

Exemplos:

- Realizar tarefa.
- Investigar.
- Proteger.
- Reparar.
- Sabotar.
- Reportar suspeita.
- Pular acao.

Deve conter:

- Validacao de acao por fase.
- Validacao por papel.
- Conversao de acao privada em evento publico permitido.

Regra:

- Acoes secretas devem entrar como `privateAction`.
- O retorno publico deve ser sanitizado.

### `mission-logs.js`

Registra eventos da partida.

Deve conter:

- Log publico.
- Log privado do host.
- Log privado por jogador, se necessario.

Exemplo:

- Publico: "Uma falha ocorreu na Engenharia."
- Privado do Android: "Sua sabotagem na Engenharia foi aplicada."
- Privado do host: "Jogador Ana sabotou Engenharia."

Regra:

- Logs publicos nunca devem conter autor de acao secreta.

### `mission-voting.js`

Gerencia votacao.

Deve conter:

- Abrir votacao.
- Registrar voto.
- Alterar voto, se permitido.
- Fechar votacao.
- Apurar resultado.
- Definir empate.

Regra:

- Durante a votacao, votos podem ser privados.
- Ao final, revelar apenas o que a regra permitir.

### `mission-ui-host.js`

Renderiza a experiencia do host ou tela principal.

Deve conter:

- Setup do jogo.
- Estado publico da nave.
- Fase atual.
- Timer.
- Eventos publicos.
- Resultado da rodada.
- Tela final.

Nao deve conter:

- Renderizacao de papel secreto de outro jogador.
- Acesso direto a `privateByPlayerId`, exceto por funcoes de debug desativadas.

### `mission-ui-player.js`

Renderiza a experiencia privada do jogador.

Deve conter:

- Tela "este device pertence a qual jogador".
- Revelacao privada de papel.
- Acoes disponiveis para o proprio jogador.
- Confirmacao de voto.
- Feedback privado permitido.

Regra:

- Recebe apenas `privateStateForPlayer`.
- Nao recebe snapshot completo do host.

### `mission-multidevice.js`

Adapta TrustNoOne para PeerJS.

Deve conter:

- Criacao de sala.
- Entrada por QR code.
- Vinculo de device a jogador.
- Registro de conexoes por `deviceId`.
- Envio de payload publico.
- Envio de payload privado por jogador/device.
- Recebimento de acoes.

Regra:

- Nao pode enviar `state` bruto.
- Todo envio deve passar por `buildPayloadForDevice`.

## Separacao de estado publico e privado

O estado interno do host pode ser completo, mas toda leitura externa deve usar seletores.

Camadas recomendadas:

- Estado interno: usado apenas pela engine no host.
- Estado publico: seguro para tela principal e espectadores.
- Estado privado por jogador: seguro somente para o device do jogador.
- Estado local do device: preferencias e conexao.

Exemplo conceitual:

```text
hostState
  public
    phase, round, timer, publicPlayers, publicEvents, visibleVotes
  privateByPlayerId
    role, alignment, secretActions, privateHints
```

Contratos:

- `getPublicState(hostState)` remove papeis e autores secretos.
- `getPrivateStateForPlayer(hostState, playerId)` retorna apenas o necessario para aquele jogador.
- `buildPayloadForDevice(hostState, deviceContext)` combina publico + privado autorizado.

## Como evitar vazamento da identidade do Android

Regras obrigatorias:

- Nunca passar `hostState` para UI publica.
- Nunca salvar `privateByPlayerId` em storage global persistente.
- Nunca enviar lista completa de papeis para clients.
- Nunca incluir `androidPlayerId`, `impostorId`, `roleMap` ou `alignmentMap` em payload publico.
- Nunca derivar CSS, ids de DOM ou textos publicos com base em papel secreto.
- Nunca deixar logs privados cairem em `publicEvents`.
- Nunca usar broadcast para dados privados.

Payload publico permitido:

- Lista de jogadores sem papel.
- Fase atual.
- Rodada atual.
- Timer.
- Sala/missao atual.
- Eventos publicos sanitizados.
- Resultado publico de votacao, conforme regra.
- Vencedor ao fim, sem revelar detalhes extras se a regra nao permitir.

Payload privado permitido:

- Papel do proprio jogador.
- Acoes disponiveis para o proprio jogador.
- Resultado privado da propria acao.
- Informacoes especiais do proprio papel.

Validacoes defensivas:

- Criar `assertNoSecrets(payload)` para payload publico.
- Criar allowlist de campos publicos.
- Em desenvolvimento, bloquear envio se payload publico contiver `role`, `android`, `impostor`, `secret`, `private`, `sabotageOwner` ou campos equivalentes.

## Compatibilidade com o jogo atual

Estrategia:

- Manter `src/script.js` funcionando como legado.
- Nao renomear ids e classes existentes no primeiro passo.
- Adicionar entrada visual para TrustNoOne sem remover Mímica/Desenho.
- Extrair `shared/` apenas quando uma funcao for usada pelos dois jogos.
- Criar chaves de storage separadas para TrustNoOne.
- Criar leaderboard proprio.
- Preservar `manifest.webmanifest` e `service-worker.js` ate haver nova organizacao de build.

Opcao incremental:

1. `script.js` continua carregando o jogo atual.
2. Novo arquivo `games/trustnoone/mission-main.js` inicializa apenas telas do novo jogo.
3. Depois, utilitarios comuns migram para `shared/`.
4. Quando estavel, `script.js` pode virar `games/mimimania/current-game.js` ou similar.

## Single-device primeiro

O MVP single-device deve simular privacidade por fluxo fisico:

1. Host cadastra jogadores.
2. Engine sorteia papeis.
3. Cada jogador recebe uma tela de revelacao privada.
4. O jogador toca em "ocultar" antes de passar o device.
5. A partida roda em tela publica.
6. Votos podem ser registrados no mesmo device, um jogador por vez.

Cuidados:

- A tela publica nao pode ter botao/debug que revele todos os papeis.
- O estado privado pode existir em memoria no host, mas sempre acessado por seletor.
- A UI de revelacao privada deve limpar texto ao sair.

## Evolucao para multi-device

Depois do single-device:

1. Criar sala no host.
2. Cada device entra com QR code.
3. Cada device escolhe ou recebe um jogador.
4. Host guarda `deviceId -> playerId`.
5. Host envia payload publico para todos.
6. Host envia payload privado apenas ao device vinculado.
7. Devices enviam acoes para o host.
8. Host valida acoes pela engine.
9. Host redistribui novos payloads sanitizados.

Fluxo de mensagem:

```text
host -> all devices: public-state
host -> one device: private-state
device -> host: player-action
host -> all devices: public-event
```

Regra:

- Client nunca decide resultado de acao.
- Client apenas solicita acao.
- Host valida e aplica.

## Ordem de implementacao recomendada

1. Criar documentos e contratos de estado.
2. Criar `mission-state.js`, `mission-roles.js` e `mission-engine.js`.
3. Criar testes manuais ou pequenos testes de engine.
4. Criar telas single-device.
5. Integrar tema, i18n, storage e audio compartilhados.
6. Criar leaderboard proprio.
7. Adaptar multi-device com payloads publicos/privados.
8. Adicionar conteudo expansivel.

## Definicao de pronto para o MVP

- Uma partida completa roda em single-device.
- Android e tripulacao podem vencer.
- Papeis sao sorteados e exibidos individualmente.
- Tela publica nao mostra segredos.
- Engine nao acessa DOM.
- UI nao recebe estado bruto.
- Multi-device ainda pode estar ausente, desde que os contratos ja estejam preparados.

## Decisao principal

TrustNoOne deve ser tratado como um jogo novo dentro da MimiMania, nao como variacao de mímica/desenho. A base atual fornece casca, tema e utilitarios; a regra, o estado, os payloads e a UI de jogador precisam ser modulares e especificos para deducao social.
