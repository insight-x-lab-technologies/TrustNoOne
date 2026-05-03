import {
  assignRoles,
  checkWinCondition,
  chooseAction,
  chooseRoom,
  createMissionGame,
  generateLogs,
  getPrivateState,
  getPublicState,
  revealRoomOccupancy,
  resolveActions,
  resolveVoting,
  startRound,
  startVoting,
  submitVote
} from './mission-engine.js';

function assert(name, condition, details = '') {
  return {
    name,
    ok: Boolean(condition),
    details: condition ? 'ok' : details
  };
}

function makePlayers(count = 4) {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Jogador ${index + 1}`
  }));
}

function makeAssignedGame(count = 4, seed = 'validation-seed') {
  return assignRoles(createMissionGame({
    id: `validation_${seed}`,
    seed,
    players: makePlayers(count)
  }));
}

function forceRoles(state, roleIds) {
  return {
    ...state,
    players: state.players.map((player, index) => ({
      ...player,
      roleId: roleIds[index] || 'crew'
    }))
  };
}

function publicText(state) {
  return JSON.stringify(getPublicState(state));
}

function testAndroidAssigned() {
  const state = makeAssignedGame(6, 'android-assigned');
  const androidCount = state.players.filter(player => player.roleId === 'android').length;
  return assert('Android sorteado corretamente', androidCount === 1, `androidCount=${androidCount}`);
}

function testPublicStateNoAndroidLeak() {
  let state = makeAssignedGame(6, 'public-no-leak');
  state = startRound(state);
  const leaked = publicText(state).includes('"roleId"') || publicText(state).includes('Android Hackeado');
  return assert('getPublicState nao revela Android', !leaked, 'estado publico contem papel ou nome secreto');
}

function testPrivateStateScoped() {
  const state = forceRoles(makeAssignedGame(4, 'private-scoped'), ['android', 'mechanic', 'it_specialist', 'crew']);
  const androidPrivate = getPrivateState(state, 'p1');
  const crewPrivate = getPrivateState(state, 'p2');
  const ok = androidPrivate.player.roleId === 'android'
    && crewPrivate.player.roleId === 'mechanic'
    && !JSON.stringify(crewPrivate).includes('"roleId":"android"');
  return assert('getPrivateState revela somente o jogador correto', ok, 'privateState contem informacao de outro jogador');
}

function testNoActionOutsidePhase() {
  let state = forceRoles(createMissionGame({ seed: 'phase-check', players: makePlayers(4) }), ['android', 'mechanic', 'crew', 'crew']);
  state = chooseRoom(state, 'p1', 'reactor');
  state = chooseAction(state, 'p1', 'overload_reactor');
  const ok = !state.roomSelections?.p1 && !(state.roundActions || []).length;
  return assert('Jogador nao age fora da fase correta', ok, 'acao ou sala aceita fora de fase');
}

function testCannotUseOtherRoleAction() {
  let state = forceRoles(makeAssignedGame(4, 'role-action'), ['android', 'crew', 'mechanic', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p2', 'reactor');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p2', 'stabilize_reactor');
  const ok = !(state.roundActions || []).some(action => action.playerId === 'p2');
  return assert('Jogador nao usa acao de outro papel', ok, 'tripulante comum usou acao de mecanico');
}

function testAndroidCooldown() {
  let state = forceRoles(makeAssignedGame(4, 'cooldown'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'reactor');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'overload_reactor');
  state = resolveActions(state);
  state = { ...state, phase: 'voteReveal', round: 2 };
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'reactor');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'overload_reactor');
  const blocked = !(state.roundActions || []).some(action => action.playerId === 'p1' && action.actionId === 'overload_reactor');
  return assert('Android respeita cooldown', blocked, 'overload_reactor aceito em cooldown');
}

function testVotesRevealOnlyAtCorrectPhase() {
  let state = forceRoles(makeAssignedGame(4, 'votes'), ['android', 'mechanic', 'crew', 'crew']);
  state = startVoting(state);
  state = submitVote(state, 'p2', 'p1');
  const hidden = !JSON.stringify(getPublicState(state).votes).includes('p1');
  state = resolveVoting(state);
  const revealed = JSON.stringify(getPublicState(state).votes).includes('p1');
  return assert('Votos so revelam na fase correta', hidden && revealed, 'votos vazaram antes ou nao revelaram depois');
}

function testWinConditions() {
  const base = forceRoles(makeAssignedGame(4, 'wins'), ['android', 'mechanic', 'crew', 'crew']);
  const mission = checkWinCondition({ ...base, missionProgress: 100 });
  const expelled = checkWinCondition({
    ...base,
    players: base.players.map(player => player.id === 'p1' ? { ...player, flags: { expelled: true } } : player)
  });
  const destroyed = checkWinCondition({ ...base, shipIntegrity: 0 });
  const survived = checkWinCondition({ ...base, phase: 'final', round: 6, maxRounds: 6, missionProgress: 40 });
  const ok = mission?.winner === 'crew'
    && expelled?.reason === 'android_expelled'
    && destroyed?.winner === 'android'
    && survived?.reason === 'android_survived';
  return assert('Condicoes de vitoria funcionam', ok, 'alguma condicao retornou resultado inesperado');
}

function testFalseLogsSanitized() {
  let state = forceRoles(makeAssignedGame(4, 'false-logs'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'bridge');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'plant_false_evidence', 'p2');
  state = resolveActions(state);
  state = generateLogs(state);
  const internalMarked = (state.logs || []).some(log => log.type === 'false' || log.precision === 'false');
  const publicSanitized = !(getPublicState(state).logs || []).some(log => log.type === 'false' || log.precision === 'false' || log.targetId);
  return assert('Logs falsos sao internos e publicamente sanitizados', internalMarked && publicSanitized, 'log falso ficou explicito no publicState');
}

function testPrivatePayloadRouting() {
  const state = forceRoles(makeAssignedGame(4, 'payload-routing'), ['android', 'mechanic', 'crew', 'crew']);
  const payloads = state.players.map(player => ({
    destinationPlayerId: player.id,
    privateState: getPrivateState(state, player.id)
  }));
  const scoped = payloads.every(payload => payload.privateState.player.id === payload.destinationPlayerId);
  const crewPayload = payloads.find(payload => payload.destinationPlayerId === 'p2');
  const noWrongAndroid = !JSON.stringify(crewPayload.privateState).includes('"roleId":"android"');
  return assert('Multi-device nao roteia payload privado errado', scoped && noWrongAndroid, 'payload privado nao corresponde ao destino');
}

export function runMissionValidationSuite(options = {}) {
  const tests = [
    testAndroidAssigned,
    testPublicStateNoAndroidLeak,
    testPrivateStateScoped,
    testNoActionOutsidePhase,
    testCannotUseOtherRoleAction,
    testAndroidCooldown,
    testVotesRevealOnlyAtCorrectPhase,
    testWinConditions,
    testFalseLogsSanitized,
    testPrivatePayloadRouting
  ];
  const results = tests.map(test => test());
  const passed = results.filter(result => result.ok).length;
  const failed = results.length - passed;
  const summary = {
    ok: failed === 0,
    passed,
    failed,
    total: results.length,
    results
  };
  if (options.log !== false) {
    console.group?.('Mimi Mission validation suite');
    results.forEach(result => {
      const line = `${result.ok ? 'PASS' : 'FAIL'} - ${result.name}${result.ok ? '' : `: ${result.details}`}`;
      if (result.ok) console.log(line);
      else console.error(line);
    });
    console.log(`Resultado: ${passed}/${results.length} validacoes passaram.`);
    console.groupEnd?.();
  }
  return summary;
}
