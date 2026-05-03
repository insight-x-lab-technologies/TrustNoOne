# Protocolo multi-device para Mimi Mission / Trust No One

Este documento define o contrato inicial de mensagens para evoluir o Mimi Mission de single-device para multi-device. O host e sempre a autoridade do estado. Devices de jogadores nunca calculam resultado final, nunca recebem estado completo e nunca recebem dados privados de outro jogador.

## Premissas de seguranca

- O host mantem o `gameState` completo.
- A tela publica recebe somente `getPublicState(gameState)`.
- Cada device de jogador recebe somente `getPrivateState(gameState, playerId)`.
- O Android recebe suas acoes secretas apenas no proprio device.
- Devices enviam intencoes: sala escolhida, acao escolhida, voto. O host valida e aplica.
- Nenhuma mensagem de broadcast pode conter `roleId`, identidade do Android, acoes secretas, votos antes da revelacao ou logs privados.
- O servidor/canal de relay nao deve ser tratado como autoridade de regra; ele apenas transporta mensagens.
- Toda mensagem deve conter `type`, `protocolVersion`, `sessionId`, `messageId`, `sentAt` e, quando aplicavel, `playerId`.

## Envelopes

Envelope base:

- `type`: nome da mensagem.
- `protocolVersion`: versao do protocolo, inicialmente `1`.
- `sessionId`: id da sala.
- `messageId`: id unico da mensagem.
- `sentAt`: timestamp ISO.
- `playerId`: id do jogador, se a mensagem vier de um device de jogador.
- `payload`: dados da mensagem.

Respostas de erro usam `ERROR` e devem incluir `requestMessageId` quando forem resposta a uma mensagem invalida.

## Estados permitidos por destino

Publico:

- `publicState`: estado gerado por `getPublicState`.
- Pode conter ocupacao de salas apenas depois da fase publica.
- Pode conter votos apenas em `voteReveal` ou `final`.
- Pode conter identidade do Android apenas em `final`.

Privado:

- `privateState`: estado gerado por `getPrivateState(gameState, playerId)`.
- Pode conter papel do proprio jogador.
- Pode conter acoes disponiveis do proprio jogador.
- Pode conter logs privados enderecados ao proprio jogador.

## Mensagens

### HOST_CREATED

Origem:

- Host.

Destino:

- Relay e tela publica.

Payload:

- `sessionId`
- `hostDeviceId`
- `joinCode`
- `settings`
- `createdAt`

Contem informacao privada:

- Nao.

Validacoes obrigatorias:

- `sessionId` e `joinCode` unicos.
- Configuracoes dentro dos limites permitidos.
- Host autenticado como dono da sala local.

Tratamento de erro:

- Se codigo ja existir, gerar outro.
- Se configuracao for invalida, retornar `ERROR` com `INVALID_SETTINGS`.

### PLAYER_JOINED

Origem:

- Device do jogador ou relay apos aceitar entrada.

Destino:

- Host.
- Tela publica recebe apenas lista publica atualizada depois da validacao.

Payload:

- `joinCode`
- `playerName`
- `deviceId`
- `clientVersion`

Contem informacao privada:

- Nao.

Validacoes obrigatorias:

- Sala existe e aceita entrada.
- Nome nao vazio.
- Limite de jogadores nao excedido.
- `deviceId` nao vinculado a outro jogador ativo, exceto reconexao.

Tratamento de erro:

- Rejeitar com `ERROR` `ROOM_NOT_FOUND`, `ROOM_FULL`, `INVALID_NAME` ou `DEVICE_ALREADY_BOUND`.

### PLAYER_READY

Origem:

- Device do jogador.

Destino:

- Host.

Payload:

- `playerId`
- `ready`

Contem informacao privada:

- Nao.

Validacoes obrigatorias:

- `playerId` pertence ao `deviceId`.
- Fase atual permite pronto.
- Jogador ainda ativo na sala.

Tratamento de erro:

- Ignorar duplicatas idempotentes.
- Retornar `ERROR` `INVALID_PHASE` ou `PLAYER_NOT_BOUND`.

### GAME_STARTED

Origem:

- Host.

Destino:

- Tela publica e devices dos jogadores.

Payload:

- Para publico: `publicState`
- Para cada jogador: apenas sinal de inicio ou `privateState` individual em mensagem separada.

Contem informacao privada:

- Publico: nao.
- Device individual: sim, se incluir `privateState`.

Validacoes obrigatorias:

- Numero de jogadores valido.
- Todos vinculados ou host permitiu iniciar.
- Roles sorteadas apenas no host.

Tratamento de erro:

- Se setup incompleto, `ERROR` `SETUP_INCOMPLETE`.
- Se envio privado falhar, marcar jogador como pendente e tentar reenviar.

### PRIVATE_STATE_UPDATE

Origem:

- Host.

Destino:

- Um unico device de jogador.

Payload:

- `playerId`
- `phase`
- `privateState`
- `revision`

Contem informacao privada:

- Sim.

Validacoes obrigatorias:

- Destino deve estar vinculado ao mesmo `playerId`.
- `privateState.player.id` deve ser igual ao `playerId`.
- Nunca enviar `privateEvents` ou `privateLogs` de outro jogador.

Tratamento de erro:

- Se destino nao confirmar, reenviar ate limite.
- Se vinculacao falhar, desconectar device e exigir reconexao.

### PUBLIC_STATE_UPDATE

Origem:

- Host.

Destino:

- Tela publica e todos os devices.

Payload:

- `publicState`
- `revision`

Contem informacao privada:

- Nao.

Validacoes obrigatorias:

- Estado deve vir de `getPublicState`.
- Nao pode conter `roleId`, acoes secretas, votos ocultos ou identidade do Android fora de `final`.

Tratamento de erro:

- Se sanitizacao falhar, bloquear envio e registrar erro local critico.
- Devices devem substituir snapshot antigo pela revisao mais recente.

### ROOM_SELECTED

Origem:

- Device do jogador.

Destino:

- Host.

Payload:

- `playerId`
- `roomId`
- `round`

Contem informacao privada:

- Sim, ate a fase de revelacao de salas.

Validacoes obrigatorias:

- `playerId` pertence ao device.
- Fase atual e `roomSelection`.
- Jogador esta ativo.
- Sala existe e nao esta bloqueada para selecao, se essa regra estiver ativa.

Tratamento de erro:

- Se invalida, responder `ERROR` `INVALID_ROOM_SELECTION`.
- Host nao deve reenviar escolha para outros devices antes de `roomReveal`.

### ACTION_SELECTED

Origem:

- Device do jogador.

Destino:

- Host.

Payload:

- `playerId`
- `actionId`
- `targetId`
- `round`

Contem informacao privada:

- Sim.

Validacoes obrigatorias:

- `playerId` pertence ao device.
- Fase atual e `actionSelection`.
- Acao esta em `getPrivateState(...).availableActions` para aquele jogador.
- Alvo obrigatorio presente quando a acao exigir.
- Cooldown e limite de acao do Android validados no host.

Tratamento de erro:

- Rejeitar com `ERROR` `INVALID_ACTION`.
- Nao revelar se a acao era sabotagem.

### ACTION_CONFIRMED

Origem:

- Host.

Destino:

- Device do jogador que enviou a acao.

Payload:

- `playerId`
- `actionId`
- `round`
- `accepted`
- `nextExpectedAction`

Contem informacao privada:

- Sim, pois confirma uma escolha privada.

Validacoes obrigatorias:

- Deve responder apenas ao mesmo jogador.
- Nao incluir efeito resolvido antes da fase de resolucao.

Tratamento de erro:

- Se a acao nao foi aceita, incluir codigo generico e permitir nova escolha quando possivel.

### PHASE_CHANGED

Origem:

- Host.

Destino:

- Tela publica e devices dos jogadores.

Payload:

- `fromPhase`
- `toPhase`
- `round`
- `deadlineAt`
- `requiresPrivateInput`

Contem informacao privada:

- Nao, desde que nao inclua jogador suspeito, acao secreta ou papel.

Validacoes obrigatorias:

- Transicao deve seguir o fluxo permitido.
- `deadlineAt` deve ser coerente com o timer da fase.

Tratamento de erro:

- Devices com fase antiga devem solicitar snapshot novo.
- Host deve reenviar `PUBLIC_STATE_UPDATE` e `PRIVATE_STATE_UPDATE` apos mudancas sensiveis.

### DISCUSSION_STARTED

Origem:

- Host.

Destino:

- Tela publica e devices dos jogadores.

Payload:

- `round`
- `durationSeconds`
- `deadlineAt`
- `publicState`

Contem informacao privada:

- Nao.

Validacoes obrigatorias:

- Fase anterior deve permitir discussao.
- Logs exibidos devem ser somente publicos.

Tratamento de erro:

- Se timer divergir, device deve confiar no `deadlineAt` do host.

### VOTE_SUBMITTED

Origem:

- Device do jogador.

Destino:

- Host.

Payload:

- `voterId`
- `targetId` ou `skip`
- `round`

Contem informacao privada:

- Sim, ate `VOTE_REVEALED`.

Validacoes obrigatorias:

- `voterId` pertence ao device.
- Fase atual e `voting`.
- Votante esta ativo.
- Alvo esta ativo ou e `skip`.
- Um voto por jogador, substituivel ate fechamento se essa regra for permitida.

Tratamento de erro:

- Rejeitar com `ERROR` `INVALID_VOTE`.
- Nunca enviar voto parcial para tela publica.

### VOTE_REVEALED

Origem:

- Host.

Destino:

- Tela publica e devices dos jogadores.

Payload:

- `round`
- `voteResult`
- `publicState`

Contem informacao privada:

- Nao apos a revelacao oficial.

Validacoes obrigatorias:

- Resultado calculado no host.
- Empate tratado sem expulsao.
- Votos revelados somente nesta fase.

Tratamento de erro:

- Se houver voto invalido no agregado, recalcular ignorando voto invalido e registrar erro local.

### GAME_ENDED

Origem:

- Host.

Destino:

- Tela publica e devices dos jogadores.

Payload:

- `winner`
- `winReason`
- `publicState`
- `androidIdentity`
- `summary`
- `playerStats`

Contem informacao privada:

- Nao, porque a partida terminou e a identidade do Android passa a ser publica.

Validacoes obrigatorias:

- Fase deve ser `final`.
- `androidIdentity` so pode aparecer no fim.
- Estatisticas nao devem incluir logs privados brutos.

Tratamento de erro:

- Se algum device nao receber, reenviar snapshot final ao reconectar.

### PLAYER_DISCONNECTED

Origem:

- Relay ou host ao detectar perda de conexao.

Destino:

- Host e tela publica.

Payload:

- `playerId`
- `deviceId`
- `disconnectedAt`
- `reason`

Contem informacao privada:

- Nao.

Validacoes obrigatorias:

- Confirmar que o `deviceId` estava vinculado ao `playerId`.
- Nao remover jogador automaticamente sem regra explicita.

Tratamento de erro:

- Marcar jogador como desconectado.
- Host decide pausar, aguardar ou continuar conforme fase.

### PLAYER_RECONNECTED

Origem:

- Device do jogador.

Destino:

- Host.

Payload:

- `playerId`
- `deviceId`
- `reconnectToken`
- `lastSeenRevision`

Contem informacao privada:

- Nao na solicitacao. A resposta pode conter `privateState` individual.

Validacoes obrigatorias:

- Token valido para `playerId` e `deviceId`.
- Sessao ainda ativa.
- Nao permitir assumir outro jogador.

Tratamento de erro:

- Se valido, enviar `PUBLIC_STATE_UPDATE` e `PRIVATE_STATE_UPDATE` daquele jogador.
- Se invalido, `ERROR` `RECONNECT_DENIED`.

### ERROR

Origem:

- Host, relay ou device.

Destino:

- Remetente original ou host, conforme o caso.

Payload:

- `requestMessageId`
- `code`
- `message`
- `recoverable`
- `retryAfterMs`

Contem informacao privada:

- Nao deve conter.

Validacoes obrigatorias:

- Mensagens de erro nao podem revelar papel, Android, votos ocultos ou acoes secretas.
- Codigo deve ser generico quando a causa especifica for sensivel.

Tratamento de erro:

- Device pode mostrar mensagem simples ao usuario.
- Host deve registrar contexto localmente sem enviar segredos ao device.

## Regras de roteamento

- Broadcast publico: usar apenas `PUBLIC_STATE_UPDATE`, `PHASE_CHANGED`, `DISCUSSION_STARTED`, `VOTE_REVEALED`, `GAME_ENDED` e avisos de conexao sem segredo.
- Unicast privado: usar `PRIVATE_STATE_UPDATE` e `ACTION_CONFIRMED`.
- Intencoes do jogador: `ROOM_SELECTED`, `ACTION_SELECTED`, `VOTE_SUBMITTED`, `PLAYER_READY`.
- Toda intencao recebida fora da fase correta deve ser rejeitada.

## Checklist anti-vazamento

- Public state nunca contem `roleId`.
- Public state nunca contem `roundActions` antes da resolucao sanitizada.
- Public state nunca contem `votes.byPlayerId` antes de `voteReveal`.
- Private state e sempre enviado por `playerId` e `deviceId` vinculados.
- Logs privados nunca entram em broadcast.
- A identidade do Android so aparece em `GAME_ENDED` ou `publicState.phase === final`.
- Mensagens de erro nao podem confirmar se uma acao secreta existia.

## Fluxo minimo sugerido

1. Host cria sala com `HOST_CREATED`.
2. Devices entram com `PLAYER_JOINED`.
3. Jogadores confirmam com `PLAYER_READY`.
4. Host inicia com `GAME_STARTED`.
5. Host envia `PUBLIC_STATE_UPDATE` para publico e `PRIVATE_STATE_UPDATE` individual.
6. Jogadores enviam `ROOM_SELECTED`.
7. Host muda fase com `PHASE_CHANGED` e revela ocupacao por `PUBLIC_STATE_UPDATE`.
8. Jogadores enviam `ACTION_SELECTED` e recebem `ACTION_CONFIRMED`.
9. Host resolve, envia logs publicos por `PUBLIC_STATE_UPDATE` e inicia discussao.
10. Jogadores enviam `VOTE_SUBMITTED`.
11. Host envia `VOTE_REVEALED`.
12. Host avanca rodada ou encerra com `GAME_ENDED`.
