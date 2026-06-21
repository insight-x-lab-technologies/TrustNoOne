# Instrucoes para agentes Codex

Este projeto e o jogo TrustNoOne, um social deduction party game inspirado em Among Us, criado a partir de uma base antiga chamada MimiMania.

Antes de iniciar qualquer novo desenvolvimento, leia os documentos abaixo nesta ordem:

1. `docs/PROGRESS.md`
2. `docs/GAMEPLAY_REVIEW.md`
3. `docs/IMPOSTOR_AUDIT.md`
4. `docs/MISSION_ARCHITECTURE.md`, se a tarefa tocar arquitetura, engine, multi-device, separacao MimiMania/TrustNoOne ou estrutura de modulos.
5. `docs/MIMI_MISSION_MULTIDEVICE_PROTOCOL.md`, se a tarefa tocar multi-device, PeerJS, host/guest, mensagens privadas ou sincronizacao entre dispositivos.

## Estado atual da arquitetura

- `src/index.html` carrega `src/tn-main.js`.
- `src/tn-main.js` e a UI principal ativa do TrustNoOne.
- `src/games/mission/` contem a engine real atual: regras, estado, roles, salas, acoes, logs, CPUs, validacao e multi-device.
- `src/games/trustnoone/` ainda contem stubs/legado da primeira tentativa e nao deve ser tratado como fonte de verdade sem uma decisao explicita de migracao.
- `src/script.js` ainda contem bastante codigo legado da MimiMania. Reutilize apenas infraestrutura claramente compartilhada quando fizer sentido.

## Fluxo recomendado de trabalho

1. Leia o roadmap e o diagnostico atual em `docs/PROGRESS.md`.
2. Identifique o item de roadmap relacionado, ou crie um novo item se a tarefa ainda nao estiver registrada.
3. Leia o codigo relevante antes de editar.
4. Prefira mudancas pequenas, testaveis e alinhadas ao design atual.
5. Ao concluir uma etapa relevante, atualize `docs/PROGRESS.md` com o status e os arquivos afetados.

## Direcao de gameplay

O feedback mais recente indica que o jogo esta visualmente bom, mas o gameplay precisa evoluir:

- partidas com 1 humano + CPUs precisam ser divertidas;
- o jogo termina cedo demais por progresso de tarefas;
- as pistas atuais sao genericas demais;
- CPUs precisam parecer personagens sociais, com depoimentos, memoria, suspeitas e justificativas;
- o fluxo solo deve ter menos telas repetitivas e mais investigacao publica;
- cada rodada deve produzir suspeitos, alibis, contradicoes ou decisoes acionaveis.

Priorize os itens `G-*` em `docs/PROGRESS.md` para evolucao de gameplay.

## Cuidados importantes

- Nao reverta alteracoes existentes sem pedido explicito do usuario.
- Verifique `git status` antes e depois de editar.
- Evite refatoracoes amplas sem necessidade direta.
- Preserve a estetica, UX e fluxo visual que ja funcionam.
- Nao vaze papel secreto, identidade do Android, acoes secretas ou estado privado em telas/public payloads.
- Em multi-device, o host deve continuar sendo autoridade do estado.
