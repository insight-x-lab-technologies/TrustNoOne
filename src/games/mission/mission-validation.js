import {
  accuseCpu,
  askCpuQuestion,
  assignRoles,
  checkWinCondition,
  chooseAction,
  chooseRoom,
  createMissionGame,
  deferVoting,
  generateLogs,
  getPrivateState,
  getPublicState,
  revealRoomOccupancy,
  resolveActions,
  resolveVoting,
  startDiscussion,
  startRound,
  startVoting,
  submitVote
} from './mission-engine.js';
import {
  applyCpuActionSelections,
  applyCpuVotes
} from './mission-cpu.js';

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
  const completeObjectives = {
    criticalSystems: ['engineering', 'reactor', 'medbay', 'communications'].map(roomId => ({
      roomId,
      required: 1,
      completed: 1
    })),
    completed: true
  };
  const mission = checkWinCondition({ ...base, round: 3, missionProgress: 100, missionObjectives: completeObjectives });
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

function testMissionProgressRequiresObjectives() {
  const base = forceRoles(makeAssignedGame(4, 'objectives-win'), ['android', 'mechanic', 'crew', 'crew']);
  const early = checkWinCondition({ ...base, round: 2, missionProgress: 100 });
  const missingChecklist = checkWinCondition({ ...base, round: 3, missionProgress: 100 });
  const completeObjectives = {
    criticalSystems: ['engineering', 'reactor', 'medbay', 'communications'].map(roomId => ({
      roomId,
      required: 1,
      completed: 1
    })),
    completed: true
  };
  const completed = checkWinCondition({ ...base, round: 3, missionProgress: 100, missionObjectives: completeObjectives });
  return assert(
    'Vitoria por progresso exige rodada minima e objetivos criticos',
    !early && !missingChecklist && completed?.reason === 'mission_complete',
    `early=${early?.reason}, missing=${missingChecklist?.reason}, completed=${completed?.reason}`
  );
}

function testRoomObjectivesAdvanceChecklist() {
  let state = forceRoles(makeAssignedGame(4, 'objectives-advance'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p2', 'engineering');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p2', 'perform_task');
  state = resolveActions(state);
  const objective = state.missionObjectives.criticalSystems.find(item => item.roomId === 'engineering');
  const ok = objective?.completed === 1 && !state.missionObjectives.completed;
  return assert('Tarefa em sala critica avanca checklist de missao', ok, JSON.stringify(state.missionObjectives));
}

function testDeferredVoteHasCost() {
  let state = forceRoles(makeAssignedGame(4, 'defer-vote'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  const before = state.shipIntegrity;
  state = deferVoting(state);
  const result = state.votes?.result || {};
  const ok = result.deferred && result.integrityCost > 0 && state.shipIntegrity === before - result.integrityCost;
  return assert('Adiar acusacao tem custo publico de integridade', ok, `before=${before}, after=${state.shipIntegrity}`);
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
  const publicSanitized = !(getPublicState(state).logs || []).some(log => (
    log.type === 'false'
    || log.precision === 'false'
    || log.targetId
    || (log.tags || []).includes('internally_false')
  ));
  return assert('Logs falsos sao internos e publicamente sanitizados', internalMarked && publicSanitized, 'log falso ficou explicito no publicState');
}

function testSuspicionAndBriefingStayPublicSafe() {
  let state = forceRoles(makeAssignedGame(4, 'public-suspicion'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'reactor');
  state = chooseRoom(state, 'p2', 'reactor');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'overload_reactor');
  state = resolveActions(state);
  state = generateLogs(state);
  const publicState = getPublicState(state);
  const serialized = JSON.stringify({ suspicion: publicState.suspicion, roundBriefing: publicState.roundBriefing });
  const hasSignal = (publicState.suspicion?.byPlayerId?.p1?.score || 0) > 0
    && (publicState.suspicion?.byPlayerId?.p2?.score || 0) > 0
    && (publicState.roundBriefing || []).some(item => item.type === 'risk');
  const safe = !serialized.includes('"roleId"') && !serialized.includes('Android Hackeado') && !serialized.includes('overload_reactor');
  return assert('Suspeita e briefing publicos nao vazam segredo', hasSignal && safe, serialized);
}

function testVotesIncreasePublicSuspicion() {
  let state = forceRoles(makeAssignedGame(4, 'vote-suspicion'), ['android', 'mechanic', 'crew', 'crew']);
  state = startVoting(state);
  state = submitVote(state, 'p2', 'p1');
  state = submitVote(state, 'p3', 'p1');
  state = resolveVoting(state);
  const publicState = getPublicState(state);
  const ok = (publicState.suspicion?.byPlayerId?.p1?.score || 0) >= 12
    && publicState.suspicion.byPlayerId.p1.reasons.some(reason => reason.kind === 'votes_received');
  return assert('Votos recebidos alimentam suspeita publica', ok, JSON.stringify(publicState.suspicion?.byPlayerId?.p1));
}

function testStructuredEvidenceAndCandidateLogs() {
  let state = forceRoles(makeAssignedGame(4, 'structured-evidence'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'reactor');
  state = chooseRoom(state, 'p2', 'reactor');
  state = chooseRoom(state, 'p3', 'medbay');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'overload_reactor');
  state = resolveActions(state);
  state = generateLogs(state);
  const publicState = getPublicState(state);
  const sabotageEvidence = (publicState.evidence || []).find(item => item.type === 'sabotage_candidates');
  const candidateLog = (publicState.logs || []).some(log => (
    log.round === state.round
    && log.type === 'sabotage'
    && log.message.includes('p2') === false
    && log.message.includes('Jogador 1')
    && log.message.includes('Jogador 2')
  ));
  const serialized = JSON.stringify(publicState.evidence || []);
  const safe = !serialized.includes('"roleId"') && !serialized.includes('Android Hackeado') && !serialized.includes('overload_reactor');
  const ok = sabotageEvidence?.roomId === 'reactor'
    && sabotageEvidence.suspectIds.includes('p1')
    && sabotageEvidence.suspectIds.includes('p2')
    && candidateLog
    && safe;
  return assert('Evidencias estruturadas e logs apontam candidatos sem vazar segredo', ok, serialized);
}

function testRoomAlibisArePublicEvidence() {
  let state = forceRoles(makeAssignedGame(4, 'room-alibi'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p2', 'engineering');
  state = chooseRoom(state, 'p3', 'engineering');
  state = chooseRoom(state, 'p4', 'communications');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p2', 'perform_task');
  state = chooseAction(state, 'p3', 'perform_task');
  state = resolveActions(state);
  state = generateLogs(state);
  const publicState = getPublicState(state);
  const alibi = (publicState.evidence || []).find(item => item.type === 'room_alibi' && item.roomId === 'engineering');
  const briefingUsesAlibi = (publicState.roundBriefing || []).some(item => item.type === 'alibi');
  const ok = alibi?.witnessIds.includes('p2') && alibi?.witnessIds.includes('p3') && briefingUsesAlibi;
  return assert('Jogadores juntos geram alibi parcial publico', ok, JSON.stringify(publicState.evidence || []));
}

function testCpuStatementsCreateContradictions() {
  let state = forceRoles(makeAssignedGame(4, 'cpu-statements'), ['crew', 'android', 'mechanic', 'crew']);
  state.players = state.players.map(player => player.id === 'p2' ? { ...player, flags: { ...(player.flags || {}), isCpu: true } } : player);
  state = startRound(state);
  state = chooseRoom(state, 'p2', 'reactor');
  state = chooseRoom(state, 'p3', 'reactor');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p2', 'overload_reactor');
  state = resolveActions(state);
  state = generateLogs(state);
  const publicState = getPublicState(state);
  const statement = (publicState.cpuStatements || []).find(item => item.playerId === 'p2');
  const contradiction = (publicState.evidence || []).find(item => item.type === 'statement_conflict' && item.suspectIds.includes('p2'));
  const serialized = JSON.stringify({ statement, contradiction });
  const safe = !serialized.includes('"roleId"') && !serialized.includes('overload_reactor') && !serialized.includes('Android Hackeado');
  return assert('Depoimento CPU conflitante vira pista publica segura', statement?.conflict && contradiction && safe, serialized);
}

function testInvestigationActionsCreateClearEvidence() {
  let state = forceRoles(makeAssignedGame(4, 'investigation-actions'), ['android', 'it_specialist', 'security', 'medic']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'reactor');
  state = chooseRoom(state, 'p2', 'communications');
  state = chooseRoom(state, 'p3', 'bridge');
  state = chooseRoom(state, 'p4', 'medbay');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'overload_reactor');
  state = chooseAction(state, 'p2', 'trace_access');
  state = chooseAction(state, 'p3', 'monitor_room');
  state = chooseAction(state, 'p4', 'scan_player', 'p1');
  state = resolveActions(state);
  state = generateLogs(state);
  const publicState = getPublicState(state);
  const types = new Set((publicState.evidence || []).map(item => item.type));
  const ok = types.has('investigation_trace') && types.has('room_monitor') && types.has('player_scan');
  return assert('Acoes investigativas produzem pistas especificas', ok, JSON.stringify(publicState.evidence || []));
}

function testFalseEvidenceCanBeRevealedLater() {
  let state = forceRoles(makeAssignedGame(4, 'false-evidence-reveal'), ['android', 'it_specialist', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'bridge');
  state = chooseRoom(state, 'p2', 'communications');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'plant_false_evidence', 'p3');
  state = resolveActions(state);
  state = generateLogs(state);
  const firstPublic = getPublicState(state);
  const initiallyHidden = !(firstPublic.evidence || []).some(item => item.type === 'false_evidence_revealed');
  state = { ...state, phase: 'voteReveal', round: 2 };
  state = startRound(state);
  state = chooseRoom(state, 'p2', 'communications');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p2', 'trace_access');
  state = resolveActions(state);
  state = generateLogs(state);
  const publicState = getPublicState(state);
  const revealed = (publicState.evidence || []).find(item => item.type === 'false_evidence_revealed');
  const serialized = JSON.stringify(publicState);
  const safe = !serialized.includes('plantedById')
    && !serialized.includes('"roleId"')
    && !serialized.includes('plant_false_evidence')
    && !serialized.includes('internally_false');
  return assert('TI pode revelar pista falsa plantada em rodada futura', initiallyHidden && revealed?.suspectIds.includes('p3') && safe, serialized);
}

function testTimelineAndPlayerHistoryArePublicSafe() {
  let state = forceRoles(makeAssignedGame(4, 'timeline-history'), ['android', 'mechanic', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'reactor');
  state = chooseRoom(state, 'p2', 'reactor');
  state = chooseRoom(state, 'p3', 'bridge');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'overload_reactor');
  state = resolveActions(state);
  state = generateLogs(state);
  state = startVoting(state);
  state = submitVote(state, 'p2', 'p1');
  state = submitVote(state, 'p3', 'p1');
  state = submitVote(state, 'p4', 'p1');
  state = resolveVoting(state);
  const publicState = getPublicState(state);
  const timelineStages = new Set((publicState.roundTimeline || []).map(item => item.stage));
  const p1History = publicState.playerHistory?.byPlayerId?.p1;
  const hasTimeline = timelineStages.has('movement') && timelineStages.has('log');
  const hasHistory = p1History?.rooms?.some(item => item.roomId === 'reactor')
    && p1History?.votes?.some(item => item.type === 'received')
    && (p1History?.suspicion?.score || 0) > 0;
  const serialized = JSON.stringify({
    timeline: publicState.roundTimeline,
    playerHistory: publicState.playerHistory
  });
  const safe = !serialized.includes('"roleId"')
    && !serialized.includes('Android Hackeado')
    && !serialized.includes('overload_reactor')
    && !serialized.includes('plantedById')
    && !serialized.includes('plant_false_evidence');
  return assert('Linha do tempo e historico de suspeita sao publicos e seguros', hasTimeline && hasHistory && safe, serialized);
}

function testCpuProfilesStatementsAndMemoryArePublicSafe() {
  let state = forceRoles(makeAssignedGame(4, 'cpu-social-memory'), ['crew', 'android', 'mechanic', 'crew']);
  state.players = state.players.map(player => (
    player.id === 'p2'
      ? { ...player, flags: { ...(player.flags || {}), isCpu: true, personality: 'logical' } }
      : player.id === 'p3'
        ? { ...player, flags: { ...(player.flags || {}), isCpu: true, personality: 'helpful' } }
        : player
  ));
  state = startRound(state);
  state = chooseRoom(state, 'p2', 'reactor');
  state = chooseRoom(state, 'p3', 'reactor');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p2', 'overload_reactor');
  state = chooseAction(state, 'p3', 'stabilize_reactor');
  state = resolveActions(state);
  state = generateLogs(state);
  state = startVoting(state);
  state = submitVote(state, 'p1', 'p2');
  state = resolveVoting(state);
  const publicState = getPublicState(state);
  const cpu = publicState.players.find(player => player.id === 'p2');
  const statement = (publicState.cpuStatements || []).find(item => item.playerId === 'p2');
  const memory = publicState.cpuMemory?.byPlayerId?.p2;
  const historyMemory = publicState.playerHistory?.byPlayerId?.p2?.cpuMemory;
  const hasProfile = cpu?.isCpu && cpu.cpuProfile?.name === 'Lógico' && cpu.cpuProfile?.shortDescription;
  const hasStatement = statement?.answers?.where && statement.answers.what && statement.answers.suspect;
  const hasMemory = memory?.suspectedPlayerIds?.length
    && memory.accusationsReceived?.some(item => item.fromPlayerId === 'p1')
    && historyMemory?.accusationsReceived?.length;
  const serialized = JSON.stringify({ cpu, statement, memory, historyMemory, publicState });
  const safe = !serialized.includes('"roleId"')
    && !serialized.includes('Android Hackeado')
    && !serialized.includes('overload_reactor')
    && !serialized.includes('plantedById')
    && !serialized.includes('plant_false_evidence');
  return assert('Perfis, depoimentos e memoria CPU sao publicos e seguros', hasProfile && hasStatement && hasMemory && safe, serialized);
}

function testCpuVotesHavePublicPersonalityReasons() {
  let state = forceRoles(makeAssignedGame(4, 'cpu-vote-reasons'), ['crew', 'android', 'mechanic', 'crew']);
  state.players = state.players.map(player => (
    player.id === 'p2'
      ? { ...player, flags: { ...(player.flags || {}), isCpu: true, personality: 'logical', difficulty: 'normal' } }
      : player.id === 'p3'
        ? { ...player, flags: { ...(player.flags || {}), isCpu: true, personality: 'cautious', difficulty: 'normal' } }
        : player
  ));
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'reactor');
  state = chooseRoom(state, 'p2', 'reactor');
  state = chooseRoom(state, 'p3', 'reactor');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p2', 'overload_reactor');
  state = resolveActions(state);
  state = generateLogs(state);
  state = startVoting(state);
  state = applyCpuVotes(state, 'normal');
  const publicState = getPublicState(state);
  const explanations = publicState.cpuVoteExplanations || [];
  const logicalVote = explanations.find(item => item.voterId === 'p2');
  const cautiousVote = explanations.find(item => item.voterId === 'p3');
  const serialized = JSON.stringify({ explanations, publicState });
  const safe = !serialized.includes('"roleId"')
    && !serialized.includes('Android Hackeado')
    && !serialized.includes('overload_reactor')
    && !serialized.includes('plant_false_evidence');
  const ok = explanations.length >= 2
    && logicalVote?.reason
    && cautiousVote?.profileName === 'Cauteloso'
    && typeof cautiousVote.skipped === 'boolean'
    && safe;
  return assert('Votos de CPU têm motivos públicos por personalidade', ok, serialized);
}

function testHardCpuAndroidPrefersSubtleSabotage() {
  let state = forceRoles(makeAssignedGame(4, 'cpu-hard-android-1'), ['crew', 'android', 'mechanic', 'crew']);
  state.players = state.players.map(player => (
    player.id === 'p2'
      ? { ...player, flags: { ...(player.flags || {}), isCpu: true, personality: 'logical', difficulty: 'hard' } }
      : player
  ));
  state = startRound(state);
  state = chooseRoom(state, 'p2', 'communications');
  state = chooseRoom(state, 'p1', 'communications');
  state = revealRoomOccupancy(state);
  state = applyCpuActionSelections(state, 'hard');
  const action = (state.roundActions || []).find(item => item.playerId === 'p2');
  const subtle = ['fake_task', 'corrupt_logs', 'plant_false_evidence'].includes(action?.actionId);
  return assert('Android CPU dificil prioriza sabotagem menos obvia', subtle, JSON.stringify(action));
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

function taskProgressForPlayers(players, seed) {
  let state = forceRoles(createMissionGame({ seed, players }), ['crew', 'crew', 'crew', 'crew']);
  state = startRound(state);
  players.forEach(player => {
    state = chooseRoom(state, player.id, 'cafeteria');
  });
  state = revealRoomOccupancy(state);
  players.forEach(player => {
    state = chooseAction(state, player.id, 'perform_task');
  });
  state = resolveActions(state);
  return state.missionProgress;
}

function testTaskProgressScalesForCpuSolo() {
  const humanPlayers = makePlayers(4);
  const soloCpuPlayers = makePlayers(4).map((player, index) => (
    index === 0 ? player : { ...player, flags: { isCpu: true } }
  ));
  const humanProgress = taskProgressForPlayers(humanPlayers, 'task-scale');
  const soloCpuProgress = taskProgressForPlayers(soloCpuPlayers, 'task-scale');
  const ok = soloCpuProgress < humanProgress && soloCpuProgress <= Math.ceil(humanProgress * 0.6);
  return assert('Progresso de tarefas escala para solo com CPUs', ok, `human=${humanProgress}, soloCpu=${soloCpuProgress}`);
}

function testCpuQuestionAndReactionArePublicSafe() {
  let state = forceRoles(createMissionGame({
    seed: 'cpu-question-safe',
    players: makePlayers(4).map((player, index) => (
      index === 0 ? player : { ...player, flags: { isCpu: true, personality: index === 1 ? 'cautious' : 'logical' } }
    ))
  }), ['crew', 'android', 'mechanic', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'bridge');
  state = chooseRoom(state, 'p2', 'bridge');
  state = chooseRoom(state, 'p3', 'engineering');
  state = chooseRoom(state, 'p4', 'cafeteria');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'check_logs');
  state = chooseAction(state, 'p2', 'corrupt_logs');
  state = chooseAction(state, 'p3', 'perform_task');
  state = chooseAction(state, 'p4', 'perform_task');
  state = resolveActions(state);
  state = generateLogs(state);
  state = startDiscussion(state);
  state = askCpuQuestion(state, 'p1', 'p2');
  state = accuseCpu(state, 'p1', 'p2');
  const publicState = getPublicState(state);
  const ok = (publicState.cpuQuestions || []).some(item => item.playerId === 'p2')
    && (publicState.cpuAccusationReactions || []).some(item => item.playerId === 'p2')
    && !JSON.stringify({ questions: publicState.cpuQuestions, reactions: publicState.cpuAccusationReactions }).includes('"roleId"')
    && !JSON.stringify({ questions: publicState.cpuQuestions, reactions: publicState.cpuAccusationReactions }).includes('android');
  return assert('Perguntas e defesas de CPU sao publicas e seguras', ok, JSON.stringify(publicState.cpuQuestions || []));
}

function testCalibrateSystemCreatesProgressOrNoise() {
  let state = forceRoles(makeAssignedGame(4, 'calibrate-system'), ['crew', 'crew', 'crew', 'crew']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'engineering');
  state = chooseRoom(state, 'p2', 'cafeteria');
  state = chooseRoom(state, 'p3', 'storage');
  state = chooseRoom(state, 'p4', 'quarters');
  state = revealRoomOccupancy(state);
  const available = getPrivateState(state, 'p1')?.availableActions || [];
  state = chooseAction(state, 'p1', 'calibrate_system');
  state = resolveActions(state);
  state = generateLogs(state);
  const publicState = getPublicState(state);
  const hasAction = available.some(action => action.id === 'calibrate_system' && action.type === 'normal_task');
  const hasProgress = state.missionProgress > 0;
  const hasCalibrationSignal = (publicState.logs || []).some(log => /Calibra/i.test(log.message))
    || (publicState.evidence || []).some(item => item.type === 'calibration_noise');
  const safe = !JSON.stringify(publicState).includes('"roleId"') && !JSON.stringify(publicState).includes('Android Hackeado');
  return assert('Calibrar Sistema gera progresso ou ruido publico seguro', hasAction && hasProgress && hasCalibrationSignal && safe, JSON.stringify(publicState.logs || []));
}

function testNewGameplayActivitiesCreateActionableEvidence() {
  let state = forceRoles(makeAssignedGame(4, 'gameplay-activities'), ['android', 'it_specialist', 'security', 'medic']);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'storage');
  state = chooseRoom(state, 'p2', 'communications');
  state = chooseRoom(state, 'p3', 'bridge');
  state = chooseRoom(state, 'p4', 'medbay');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'vent_accident', 'p4');
  state = chooseAction(state, 'p2', 'audit_access');
  state = chooseAction(state, 'p3', 'security_patrol', 'storage');
  state = chooseAction(state, 'p4', 'match_samples', 'p4');
  state = resolveActions(state);
  state = generateLogs(state);
  const firstPublic = getPublicState(state);
  const audit = (firstPublic.evidence || []).find(item => item.type === 'access_audit');
  const samples = (firstPublic.evidence || []).find(item => item.type === 'sample_match');
  const scheduled = (firstPublic.evidence || []).find(item => item.type === 'security_patrol_scheduled');

  state = { ...state, phase: 'voteReveal', round: 2 };
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'storage');
  state = chooseRoom(state, 'p3', 'storage');
  state = revealRoomOccupancy(state);
  state = chooseAction(state, 'p1', 'sabotage_room');
  state = resolveActions(state);
  state = generateLogs(state);
  const secondPublic = getPublicState(state);
  const patrol = (secondPublic.evidence || []).find(item => item.type === 'security_patrol' && item.roomId === 'storage');
  const serialized = JSON.stringify({ firstPublic, secondPublic });
  const safe = !serialized.includes('"roleId"')
    && !serialized.includes('Android Hackeado')
    && !serialized.includes('vent_accident')
    && !serialized.includes('"actionId"');
  const ok = audit?.suspectIds?.includes('p1')
    && audit.suspectIds.length <= 3
    && samples?.message?.includes('sofreu alteração real')
    && scheduled?.roomId === 'storage'
    && patrol?.suspectIds?.includes('p1')
    && safe;
  return assert('G-26/G-27/G-28 geram evidencias acionaveis e seguras', ok, serialized);
}

function testAdvancedGameplayActivitiesCreateDilemmas() {
  let repairState = forceRoles(makeAssignedGame(4, 'dual-repair'), ['crew', 'mechanic', 'crew', 'android']);
  repairState = startRound(repairState);
  repairState = chooseRoom(repairState, 'p2', 'engineering');
  repairState = chooseRoom(repairState, 'p3', 'engineering');
  repairState = revealRoomOccupancy(repairState);
  const repairAvailable = (getPrivateState(repairState, 'p2')?.availableActions || []).some(action => action.id === 'dual_repair');
  repairState = chooseAction(repairState, 'p2', 'dual_repair');
  repairState = resolveActions(repairState);
  repairState = generateLogs(repairState);
  const repairPublic = getPublicState(repairState);
  const strongAlibi = (repairPublic.evidence || []).find(item => item.type === 'strong_alibi' && item.roomId === 'engineering');

  let transmissionState = forceRoles(makeAssignedGame(4, 'emergency-transmission'), ['android', 'crew', 'crew', 'crew']);
  transmissionState = startRound(transmissionState);
  transmissionState = chooseRoom(transmissionState, 'p2', 'communications');
  transmissionState = revealRoomOccupancy(transmissionState);
  transmissionState = chooseAction(transmissionState, 'p2', 'emergency_transmission');
  transmissionState = resolveActions(transmissionState);
  transmissionState = generateLogs(transmissionState);
  const hasTransmissionEvidence = (getPublicState(transmissionState).evidence || []).some(item => item.type === 'emergency_transmission');
  transmissionState = { ...transmissionState, phase: 'voteReveal', round: 2 };
  transmissionState = startRound(transmissionState);
  transmissionState = chooseRoom(transmissionState, 'p1', 'reactor');
  transmissionState = revealRoomOccupancy(transmissionState);
  transmissionState = chooseAction(transmissionState, 'p1', 'overload_reactor');
  transmissionState = resolveActions(transmissionState);
  const reducedDamage = transmissionState.shipIntegrity >= 87
    && (transmissionState.emergencyTransmissions || []).some(item => item.usedRound === 2 && item.preventedDamage > 0);

  let divertState = forceRoles(makeAssignedGame(4, 'divert-energy'), ['android', 'crew', 'crew', 'crew']);
  divertState = startRound(divertState);
  divertState = chooseRoom(divertState, 'p1', 'reactor');
  divertState = chooseRoom(divertState, 'p2', 'cafeteria');
  divertState = revealRoomOccupancy(divertState);
  divertState = chooseAction(divertState, 'p1', 'divert_energy', 'cafeteria');
  divertState = resolveActions(divertState);
  divertState = generateLogs(divertState);
  const divertPublic = getPublicState(divertState);
  const energyRisk = (divertPublic.evidence || []).find(item => item.type === 'energy_risk' && item.roomId === 'cafeteria');
  const publicLogUsesDecoyRoom = (divertPublic.logs || []).some(log => (
    log.round === divertState.round
    && log.roomId === 'cafeteria'
    && /risco energético/i.test(log.message || '')
  ));
  const serialized = JSON.stringify({ repairPublic, transmission: getPublicState(transmissionState), divertPublic });
  const safe = !serialized.includes('"roleId"')
    && !serialized.includes('Android Hackeado')
    && !serialized.includes('divert_energy')
    && !serialized.includes('"actionId"')
    && !serialized.includes('"type":"false"')
    && !serialized.includes('"precision":"false"');
  const ok = repairAvailable
    && strongAlibi?.witnessIds?.includes('p2')
    && strongAlibi?.witnessIds?.includes('p3')
    && hasTransmissionEvidence
    && reducedDamage
    && energyRisk?.suspectIds?.includes('p2')
    && energyRisk.reliability === 'low'
    && publicLogUsesDecoyRoom
    && safe;
  return assert('G-29/G-30/G-31 criam dilemas publicos seguros', ok, serialized);
}

function testStatementForgeryAndRoundEventsArePublicSafe() {
  let forgeState = forceRoles(makeAssignedGame(4, 'forge-statement'), ['android', 'crew', 'crew', 'crew']);
  forgeState = {
    ...forgeState,
    players: forgeState.players.map(player => (
      player.id === 'p2' ? { ...player, flags: { ...(player.flags || {}), isCpu: true, personality: 'logical' } } : player
    ))
  };
  forgeState = startRound(forgeState);
  forgeState = chooseRoom(forgeState, 'p1', 'communications');
  forgeState = chooseRoom(forgeState, 'p2', 'bridge');
  forgeState = revealRoomOccupancy(forgeState);
  const forgeAvailable = (getPrivateState(forgeState, 'p1')?.availableActions || []).some(action => action.id === 'forge_statement');
  const rejectedHumanTarget = chooseAction(forgeState, 'p1', 'forge_statement', 'p3');
  forgeState = chooseAction(forgeState, 'p1', 'forge_statement', 'p2');
  forgeState = resolveActions(forgeState);
  forgeState = generateLogs(forgeState);
  const forgePublic = getPublicState(forgeState);
  const forgedEvidence = (forgePublic.evidence || []).find(item => item.type === 'forged_statement' && item.suspectIds?.includes('p2'));
  const forgedStatement = (forgePublic.cpuStatements || []).find(item => item.playerId === 'p2');

  let blackoutState = forceRoles(makeAssignedGame(4, 'blackout-event'), ['android', 'crew', 'crew', 'crew']);
  blackoutState = { ...blackoutState, round: 2, nextRoundEvent: 'blackout' };
  blackoutState = startRound(blackoutState);
  blackoutState = chooseRoom(blackoutState, 'p1', 'reactor');
  blackoutState = chooseRoom(blackoutState, 'p2', 'bridge');
  blackoutState = chooseRoom(blackoutState, 'p3', 'medbay');
  blackoutState = chooseRoom(blackoutState, 'p4', 'communications');
  blackoutState = revealRoomOccupancy(blackoutState);
  const blackoutPublicBeforeLogs = getPublicState(blackoutState);
  blackoutState = chooseAction(blackoutState, 'p1', 'overload_reactor');
  blackoutState = resolveActions(blackoutState);
  blackoutState = generateLogs(blackoutState);
  const blackoutPublic = getPublicState(blackoutState);

  let alarmState = forceRoles(makeAssignedGame(4, 'intrusion-event'), ['android', 'crew', 'crew', 'crew']);
  alarmState = { ...alarmState, round: 2, nextRoundEvent: 'intrusion_alarm' };
  alarmState = startRound(alarmState);
  alarmState = chooseRoom(alarmState, 'p1', alarmState.currentRoundEvent.roomIds[0]);
  alarmState = revealRoomOccupancy(alarmState);
  alarmState = resolveActions(alarmState);
  alarmState = generateLogs(alarmState);
  const alarmPublic = getPublicState(alarmState);
  const alarmEvidence = (alarmPublic.evidence || []).filter(item => item.type === 'intrusion_alarm');

  const serialized = JSON.stringify({ forgePublic, blackoutPublic, alarmPublic });
  const safe = !serialized.includes('"roleId"')
    && !serialized.includes('Android Hackeado')
    && !serialized.includes('"actionId"')
    && !serialized.includes('"plantedById"');
  const ok = forgeAvailable
    && (rejectedHumanTarget.roundActions || []).every(action => action.actionId !== 'forge_statement')
    && forgedEvidence?.reliability === 'high'
    && forgedStatement?.conflict
    && blackoutPublicBeforeLogs.currentRoundEvent?.type === 'blackout'
    && Object.keys(blackoutPublicBeforeLogs.roomOccupancy || {}).length < 4
    && (blackoutPublic.evidence || []).some(item => item.type === 'blackout')
    && alarmPublic.currentRoundEvent?.type === 'intrusion_alarm'
    && alarmPublic.currentRoundEvent.roomIds.length === 2
    && alarmEvidence.length === 2
    && safe;
  return assert('G-32/G-33/G-34 geram pressao publica segura', ok, serialized);
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
    testMissionProgressRequiresObjectives,
    testRoomObjectivesAdvanceChecklist,
    testDeferredVoteHasCost,
    testFalseLogsSanitized,
    testSuspicionAndBriefingStayPublicSafe,
    testVotesIncreasePublicSuspicion,
    testStructuredEvidenceAndCandidateLogs,
    testRoomAlibisArePublicEvidence,
    testCpuStatementsCreateContradictions,
    testInvestigationActionsCreateClearEvidence,
    testFalseEvidenceCanBeRevealedLater,
    testTimelineAndPlayerHistoryArePublicSafe,
    testCpuProfilesStatementsAndMemoryArePublicSafe,
    testCpuVotesHavePublicPersonalityReasons,
    testHardCpuAndroidPrefersSubtleSabotage,
    testPrivatePayloadRouting,
    testTaskProgressScalesForCpuSolo,
    testCpuQuestionAndReactionArePublicSafe,
    testCalibrateSystemCreatesProgressOrNoise,
    testNewGameplayActivitiesCreateActionableEvidence,
    testAdvancedGameplayActivitiesCreateDilemmas,
    testStatementForgeryAndRoundEventsArePublicSafe
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
