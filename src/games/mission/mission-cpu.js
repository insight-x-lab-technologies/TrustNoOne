import {
  chooseAction,
  chooseRoom,
  createMissionGame,
  getPrivateState,
  getPublicState,
  submitVote
} from './mission-engine.js';
import { CPU_PERSONALITY_IDS, getCpuProfile } from './mission-cpu-profiles.js';
import { MISSION_ROOMS } from './mission-rooms.js';

export const CPU_PERSONALITIES = CPU_PERSONALITY_IDS;
export const CPU_DIFFICULTIES = {
  easy: { mistakeRate: 0.34, sabotageRate: 0.42, taskBias: 0.65, androidRecklessRate: 0.58, androidFrameRate: 0.18 },
  normal: { mistakeRate: 0.2, sabotageRate: 0.58, taskBias: 0.78, androidRecklessRate: 0.34, androidFrameRate: 0.34 },
  hard: { mistakeRate: 0.1, sabotageRate: 0.62, taskBias: 0.9, androidRecklessRate: 0.12, androidFrameRate: 0.62 }
};

function hashToken(value = '') {
  return String(value).split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function randomFor(state, playerId, salt = '') {
  const value = hashToken(`${state.seed}:${state.round}:${playerId}:${salt}`);
  return (value % 10000) / 10000;
}

function pick(list, state, playerId, salt = '') {
  if (!list.length) return null;
  const index = Math.floor(randomFor(state, playerId, salt) * list.length) % list.length;
  return list[index];
}

function isCpu(player) {
  return Boolean(player.flags?.isCpu);
}

function getCpuPlayers(state) {
  return state.players.filter(player => isCpu(player) && !player.flags?.expelled);
}

function cpuConfig(player, difficulty = 'normal') {
  return {
    personality: player.flags?.personality || 'logical',
    difficulty: CPU_DIFFICULTIES[difficulty] ? difficulty : 'normal',
    weights: CPU_DIFFICULTIES[difficulty] || CPU_DIFFICULTIES.normal
  };
}

function activePlayers(state) {
  return state.players.filter(player => !player.flags?.expelled);
}

function suspiciousRooms(state) {
  return (state.logs || [])
    .filter(log => log.round === state.round && ['sabotage', 'corrupted', 'false'].includes(log.type))
    .map(log => log.roomId)
    .filter(Boolean);
}

function publicSuspicion(state) {
  return getPublicState(state).suspicion?.byPlayerId || {};
}

function playerName(state, playerId) {
  return state.players.find(player => player.id === playerId)?.name || 'Tripulante';
}

function getPlayer(state, playerId) {
  return state.players.find(player => player.id === playerId) || null;
}

function roomName(roomId) {
  return MISSION_ROOMS[roomId]?.name || 'um setor';
}

function currentEvidence(state) {
  return (state.evidence || []).filter(item => item.round === state.round);
}

function suspicionCandidates(state, voterId) {
  const suspicion = publicSuspicion(state);
  return activePlayers(state)
    .filter(candidate => candidate.id !== voterId)
    .map(candidate => ({
      playerId: candidate.id,
      score: suspicion[candidate.id]?.score || 0,
      reason: suspicion[candidate.id]?.reasons?.[0]?.message || ''
    }))
    .sort((a, b) => b.score - a.score);
}

function strongestEvidenceAgainst(state, voterId) {
  const reliabilityWeight = { high: 3, medium: 2, low: 1 };
  const evidence = currentEvidence(state)
    .filter(item => (item.suspectIds || []).some(playerId => playerId !== voterId))
    .sort((a, b) => (reliabilityWeight[b.reliability] || 0) - (reliabilityWeight[a.reliability] || 0))[0];
  const targetId = evidence?.suspectIds?.find(playerId => playerId !== voterId);
  return targetId ? {
    targetId,
    confidence: evidence.reliability === 'high' ? 'high' : 'medium',
    clue: evidence.message || '',
    reason: `${playerName(state, targetId)} apareceu na pista mais forte da rodada.`
  } : null;
}

function roomSuspectDecision(state, player) {
  const rooms = suspiciousRooms(state);
  const suspects = activePlayers(state).filter(candidate => (
    candidate.id !== player.id && rooms.includes(candidate.roomId)
  ));
  const target = pick(suspects, state, player.id, 'room-suspect-vote');
  return target ? {
    targetId: target.id,
    confidence: suspects.length <= 2 ? 'medium' : 'low',
    clue: `${target.name} estava em ${roomName(target.roomId)} quando o setor entrou no radar.`,
    reason: `Votei em ${target.name} porque a sala dele apareceu nos sinais suspeitos.`
  } : null;
}

function memorySuspectDecision(state, player) {
  const memory = state.cpuMemory?.byPlayerId?.[player.id];
  const remembered = (memory?.suspectedPlayerIds || []).find(item => (
    item.playerId !== player.id && activePlayers(state).some(candidate => candidate.id === item.playerId)
  ));
  return remembered ? {
    targetId: remembered.playerId,
    confidence: 'medium',
    clue: remembered.reason || 'memória social acumulada',
    reason: `Mantive pressão em ${playerName(state, remembered.playerId)} por sinais acumulados.`
  } : null;
}

function allyIdsFor(state, player) {
  return (state.cpuMemory?.byPlayerId?.[player.id]?.alliances || [])
    .filter(item => (item.expiresRound || 0) >= state.round)
    .map(item => item.playerId);
}

function roomOccupants(state, roomId) {
  return state.players.filter(player => !player.flags?.expelled && player.roomId === roomId);
}

function chooseCpuRoom(state, player, difficulty) {
  const config = cpuConfig(player, difficulty);
  const rooms = Object.values(MISSION_ROOMS);
  const damagedRooms = Object.values(state.rooms || {}).filter(room => room.sabotaged || room.locked || room.status === 'critical');
  if (player.roleId === 'android') {
    const sabotageRooms = rooms.filter(room => (room.sabotageActions || []).length);
    if (config.personality !== 'chaotic' && randomFor(state, player.id, 'android-room') > 0.22) {
      return pick(sabotageRooms, state, player.id, 'sabotage-room')?.id || 'cafeteria';
    }
  }
  if (config.personality === 'helpful' && damagedRooms.length) {
    return pick(damagedRooms, state, player.id, 'damaged-room')?.id || 'engineering';
  }
  if (player.roleId === 'mechanic' && damagedRooms.some(room => ['engineering', 'reactor'].includes(room.id))) {
    return pick(damagedRooms.filter(room => ['engineering', 'reactor'].includes(room.id)), state, player.id, 'mechanic-room')?.id || 'engineering';
  }
  if (config.personality === 'chaotic') return pick(rooms, state, player.id, 'chaotic-room')?.id || 'cafeteria';
  return pick(rooms.filter(room => room.riskLevel !== 'critical'), state, player.id, 'safe-room')?.id || 'cafeteria';
}

function actionScore(state, player, action, difficulty) {
  const config = cpuConfig(player, difficulty);
  let score = 10;
  if (action.type === 'normal_task') score += config.weights.taskBias * 10;
  if (action.id === 'dual_repair') score += roomOccupants(state, player.roomId).length >= 2 ? 14 : -8;
  if (action.id === 'emergency_repair' || action.id === 'stabilize_reactor') score += state.shipIntegrity < 75 ? 22 : 8;
  if (action.id === 'emergency_transmission') score += state.shipIntegrity < 70 ? 18 : state.round >= state.maxRounds - 1 ? 12 : 6;
  if (action.id === 'recover_deleted_log' || action.id === 'trace_access' || action.id === 'audit_access') score += state.alertLevel !== 'green' ? 12 : 4;
  if (action.id === 'monitor_room' || action.id === 'security_patrol' || action.id === 'protect_player') score += state.alertLevel === 'red' ? 10 : 3;
  if (action.id === 'match_samples') score += state.alertLevel !== 'green' ? 11 : 5;
  if (config.personality === 'helpful' && action.type !== 'sabotage') score += 8;
  if (config.personality === 'cautious' && ['assist_player', 'protect_player', 'check_logs'].includes(action.id)) score += 7;
  if (config.personality === 'impulsive' && ['observe_player', 'inspect_room', 'monitor_room', 'security_patrol'].includes(action.id)) score += 6;
  if (config.personality === 'logical' && ['check_logs', 'trace_access', 'audit_access', 'recover_deleted_log', 'emergency_transmission'].includes(action.id)) score += 8;
  if (config.personality === 'chaotic') score += randomFor(state, player.id, `action-${action.id}`) * 20;
  return score;
}

function chooseCpuCrewMistakeAction(state, player, actions) {
  const personality = cpuConfig(player, player.flags?.difficulty).personality;
  const byId = id => actions.find(action => action.id === id);
  if (personality === 'cautious') return byId('check_logs') || byId('inspect_room') || pick(actions, state, player.id, 'cautious-mistake');
  if (personality === 'impulsive') return byId('observe_player') || byId('inspect_room') || pick(actions, state, player.id, 'impulsive-mistake');
  if (personality === 'helpful') return byId('assist_player') || byId('emergency_repair') || pick(actions, state, player.id, 'helpful-mistake');
  if (personality === 'logical') return byId('trace_access') || byId('check_logs') || pick(actions, state, player.id, 'logical-mistake');
  return pick(actions, state, player.id, 'chaotic-mistake');
}

function chooseCpuCrewAction(state, player, difficulty) {
  const privateState = getPrivateState(state, player.id);
  const actions = privateState?.availableActions || [];
  const mistaken = randomFor(state, player.id, 'crew-mistake') < cpuConfig(player, difficulty).weights.mistakeRate;
  if (mistaken) return chooseCpuCrewMistakeAction(state, player, actions);
  return [...actions].sort((a, b) => actionScore(state, player, b, difficulty) - actionScore(state, player, a, difficulty))[0] || null;
}

function chooseCpuAndroidAction(state, player, difficulty) {
  const privateState = getPrivateState(state, player.id);
  const actions = privateState?.availableActions || [];
  const sabotages = actions.filter(action => action.type === 'sabotage');
  const useful = actions.filter(action => action.type !== 'sabotage');
  const alone = roomOccupants(state, player.roomId).length <= 1;
  const config = cpuConfig(player, difficulty);
  const shouldSabotage = randomFor(state, player.id, 'android-sabotage') < config.weights.sabotageRate;
  if (shouldSabotage && sabotages.length) {
    const reckless = randomFor(state, player.id, 'android-reckless') < config.weights.androidRecklessRate;
    const framing = randomFor(state, player.id, 'android-frame') < config.weights.androidFrameRate;
    const quietSabotage = sabotages.filter(action => ['fake_task', 'corrupt_logs', 'plant_false_evidence', 'divert_energy', 'forge_statement'].includes(action.id));
    const frameActions = sabotages.filter(action => ['plant_false_evidence', 'corrupt_logs', 'divert_energy', 'forge_statement'].includes(action.id));
    const loudSabotage = sabotages.filter(action => ['overload_reactor', 'sabotage_room', 'poison_supplies', 'vent_accident'].includes(action.id));
    if (!alone && reckless) return pick(loudSabotage.length ? loudSabotage : sabotages, state, player.id, 'reckless-sabotage');
    if (framing && frameActions.length) return pick(frameActions, state, player.id, 'frame-sabotage');
    if (alone || difficulty === 'hard') return pick(quietSabotage.length ? quietSabotage : sabotages, state, player.id, 'quiet-sabotage');
    return pick(sabotages, state, player.id, 'sabotage-action');
  }
  return pick(useful.length ? useful : actions, state, player.id, 'fake-useful-action');
}

function chooseTarget(state, player, action) {
  if (action?.requiresRoomTarget) {
    const rooms = Object.values(MISSION_ROOMS);
    const suspicious = suspiciousRooms(state);
    const candidates = rooms.filter(room => suspicious.includes(room.id));
    return pick(candidates.length ? candidates : rooms, state, player.id, `room-target-${action.id}`)?.id || 'cafeteria';
  }
  if (!action?.requiresTarget) return null;
  const targets = activePlayers(state).filter(target => (
    target.id !== player.id && (!action.targetCpuOnly || target.flags?.isCpu)
  ));
  return pick(targets, state, player.id, `target-${action.id}`)?.id || null;
}

function chooseCpuVoteDecision(state, player, difficulty) {
  const config = cpuConfig(player, difficulty);
  const candidates = activePlayers(state).filter(candidate => candidate.id !== player.id);
  const profile = getCpuProfile(config.personality);
  if (!candidates.length) return {
    targetId: 'skip',
    skipped: true,
    confidence: 'low',
    clue: '',
    reason: `${profile.name}: sem alvo válido para acusar.`
  };
  if (player.roleId === 'android') {
    const pressure = suspicionCandidates(state, player.id).find(candidate => getPlayer(state, candidate.playerId)?.roleId !== 'android');
    const framed = currentEvidence(state)
      .flatMap(item => item.suspectIds || [])
      .find(playerId => playerId !== player.id && getPlayer(state, playerId)?.roleId !== 'android');
    const target = getPlayer(state, framed || pressure?.playerId)
      || pick(candidates.filter(candidate => candidate.roleId !== 'android'), state, player.id, 'android-vote');
    return target ? {
      targetId: target.id,
      skipped: false,
      confidence: config.difficulty === 'hard' ? 'medium' : 'low',
      clue: pressure?.reason || `${target.name} apareceu em conversas ou sinais públicos.`,
      reason: `Votei em ${target.name} porque a rodada já tinha sinais públicos contra ele.`
    } : {
      targetId: 'skip',
      skipped: true,
      confidence: 'low',
      clue: '',
      reason: `${profile.name}: não vi pressão pública suficiente para sustentar acusação.`
    };
  }
  const mistake = randomFor(state, player.id, 'vote-mistake') < config.weights.mistakeRate;
  const evidenceDecision = strongestEvidenceAgainst(state, player.id);
  const roomDecision = roomSuspectDecision(state, player);
  const memoryDecision = memorySuspectDecision(state, player);
  const ranked = suspicionCandidates(state, player.id);
  const topSuspicion = ranked[0]?.score > 0 ? {
    targetId: ranked[0].playerId,
    confidence: ranked[0].score >= 45 ? 'medium' : 'low',
    clue: ranked[0].reason,
    reason: `Votei em ${playerName(state, ranked[0].playerId)} pelo histórico público de suspeita.`
  } : null;

  if (config.personality === 'cautious') {
    if (!evidenceDecision || evidenceDecision.confidence !== 'high' || randomFor(state, player.id, 'cautious-skip') < 0.34) {
      return {
        targetId: 'skip',
        skipped: true,
        confidence: 'low',
        clue: evidenceDecision?.clue || '',
        reason: 'Segurei o voto: uma pista fraca ainda pode virar acusação errada.'
      };
    }
    return { ...evidenceDecision, reason: `Votei em ${playerName(state, evidenceDecision.targetId)} porque a evidência estava forte o bastante.` };
  }

  if (config.personality === 'logical' && !mistake) {
    return evidenceDecision || topSuspicion || {
      targetId: 'skip',
      skipped: true,
      confidence: 'low',
      clue: '',
      reason: 'Sem cruzamento consistente entre sala, log e histórico.'
    };
  }

  if (config.personality === 'impulsive') {
    const decision = roomDecision || evidenceDecision || topSuspicion || memoryDecision;
    if (decision) return {
      ...decision,
      confidence: decision.confidence === 'high' ? 'medium' : 'low',
      reason: `Fui direto em ${playerName(state, decision.targetId)}; qualquer sinal perto de falha já merece pressão.`
    };
  }

  if (config.personality === 'helpful') {
    const allies = allyIdsFor(state, player);
    const decision = [evidenceDecision, topSuspicion, roomDecision].find(item => item && !allies.includes(item.targetId));
    return decision || {
      targetId: 'skip',
      skipped: true,
      confidence: 'low',
      clue: allies.length ? `protegi o álibi de ${playerName(state, allies[0])}` : '',
      reason: allies.length
        ? 'Preferi não quebrar um álibi temporário sem pista melhor.'
        : 'Não havia acusação útil para ajudar a tripulação agora.'
    };
  }

  if (config.personality === 'chaotic' || mistake) {
    const target = pick(candidates, state, player.id, 'personality-error-vote');
    return target ? {
      targetId: target.id,
      skipped: false,
      confidence: 'low',
      clue: roomDecision?.clue || topSuspicion?.clue || '',
      reason: `Mudei o foco para ${target.name}; minha leitura da rodada ficou instável.`
    } : {
      targetId: 'skip',
      skipped: true,
      confidence: 'low',
      clue: '',
      reason: 'Não consegui manter uma linha de suspeita.'
    };
  }

  return memoryDecision || topSuspicion || {
    targetId: 'skip',
    skipped: true,
    confidence: 'low',
    clue: '',
    reason: 'Sem alvo claro nesta rodada.'
  };
}

function publicVoteExplanation(state, player, decision) {
  const profile = getCpuProfile(player.flags?.personality);
  return {
    id: `round_${state.round}_cpu_vote_${player.id}`,
    round: state.round,
    voterId: player.id,
    targetId: decision.skipped ? null : decision.targetId,
    skipped: Boolean(decision.skipped),
    profileId: profile.id,
    profileName: profile.name,
    confidence: decision.confidence || 'medium',
    reason: decision.reason,
    clue: decision.clue || ''
  };
}

export function createCpuPlayers(count = 0, startIndex = 0, difficulty = 'normal') {
  const safeCount = Math.max(0, Math.min(7, Number.parseInt(count, 10) || 0));
  return Array.from({ length: safeCount }, (_, index) => {
    const personality = CPU_PERSONALITIES[(startIndex + index) % CPU_PERSONALITIES.length];
    return {
      id: `cpu_${index + 1}`,
      name: `CPU ${index + 1}`,
      flags: { isCpu: true, personality, difficulty }
    };
  });
}

export function applyCpuRoomSelections(gameState, difficulty = 'normal') {
  return getCpuPlayers(gameState).reduce((state, player) => {
    if (state.roomSelections?.[player.id]) return state;
    return chooseRoom(state, player.id, chooseCpuRoom(state, player, player.flags?.difficulty || difficulty));
  }, gameState);
}

export function applyCpuActionSelections(gameState, difficulty = 'normal') {
  return getCpuPlayers(gameState).reduce((state, player) => {
    if ((state.roundActions || []).some(action => action.playerId === player.id)) return state;
    const action = player.roleId === 'android'
      ? chooseCpuAndroidAction(state, player, player.flags?.difficulty || difficulty)
      : chooseCpuCrewAction(state, player, player.flags?.difficulty || difficulty);
    if (!action) return state;
    return chooseAction(state, player.id, action.id, chooseTarget(state, player, action));
  }, gameState);
}

export function applyCpuVotes(gameState, difficulty = 'normal') {
  return getCpuPlayers(gameState).reduce((state, player) => {
    if (state.votes?.byPlayerId?.[player.id] || state.votes?.skippedByPlayerId?.[player.id]) return state;
    const decision = chooseCpuVoteDecision(state, player, player.flags?.difficulty || difficulty);
    const nextState = submitVote(state, player.id, decision.targetId || 'skip');
    nextState.cpuVoteExplanations = [
      ...(nextState.cpuVoteExplanations || []).filter(item => !(item.round === nextState.round && item.voterId === player.id)),
      publicVoteExplanation(nextState, player, decision)
    ];
    return nextState;
  }, gameState);
}

export function runMissionCpuSmokeTest() {
  let state = createMissionGame({
    seed: 'cpu-smoke',
    players: [
      { id: 'p1', name: 'Ana' },
      ...createCpuPlayers(3, 1, 'normal')
    ]
  });
  state.players = state.players.map((player, index) => ({
    ...player,
    roleId: index === 1 ? 'android' : 'crew'
  }));
  state = { ...state, phase: 'roomSelection' };
  state = applyCpuRoomSelections(state);
  state = { ...state, phase: 'actionSelection', roomOccupancy: getPublicState(state).roomOccupancy || {} };
  state = applyCpuActionSelections(state);
  state = { ...state, phase: 'voting', votes: { open: true, round: 1, byPlayerId: {}, skippedByPlayerId: {}, result: null } };
  state = applyCpuVotes(state);
  return {
    ok: Object.keys(state.roomSelections || {}).length >= 3 && (state.roundActions || []).length >= 3,
    state
  };
}
