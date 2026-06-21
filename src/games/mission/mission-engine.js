import { getActionById } from './mission-actions.js';
import { getCpuProfile } from './mission-cpu-profiles.js';
import { LOG_PRECISION, MISSION_LOG_TYPES, privateLog, publicLog } from './mission-logs.js';
import { getRole, getRoleDistribution } from './mission-roles.js';
import { getRoom } from './mission-rooms.js';
import { cloneMissionState, createBaseMissionState, MISSION_PHASES } from './mission-state.js';

const CREW_WIN = 'crew';
const ANDROID_WIN = 'android';
const SPECIAL_TASK_PROGRESS = 4;
const SABOTAGE_DAMAGE = 15;
const SKIP_VOTE = 'skip';
const DEFAULT_MAX_ROUNDS = 6;
const MECHANIC_BONUS_ROOMS = ['engineering', 'reactor'];
const OBJECTIVE_PROGRESS_BONUS = 6;

function hashSeed(seed = '') {
  return String(seed).split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function createRandom(seed) {
  let value = hashSeed(seed) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number.parseInt(value, 10) || 0));
}

function shuffle(list, seed) {
  const random = createRandom(seed);
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function publicPlayer(player) {
  const cpuProfile = player.flags?.isCpu ? getCpuProfile(player.flags?.personality) : null;
  return {
    id: player.id,
    name: player.name,
    roomId: player.roomId,
    connected: player.connected,
    active: player.active,
    expelled: Boolean(player.flags?.expelled),
    isCpu: Boolean(player.flags?.isCpu),
    cpuProfile: cpuProfile ? {
      id: cpuProfile.id,
      name: cpuProfile.name,
      shortDescription: cpuProfile.shortDescription
    } : null
  };
}

function publicRoom(room) {
  return {
    id: room.id,
    icon: room.icon,
    name: room.name,
    shortDescription: room.shortDescription,
    description: room.description,
    riskLevel: room.riskLevel,
    status: room.status || 'normal',
    sabotaged: Boolean(room.sabotaged),
    locked: Boolean(room.locked)
  };
}

function getPlayer(state, playerId) {
  return state.players.find(player => player.id === playerId) || null;
}

function getAndroidPlayer(state) {
  return state.players.find(player => player.roleId === 'android') || null;
}

function getActivePlayers(state) {
  return state.players.filter(player => !player.flags?.expelled);
}

function getActiveHumanPlayers(state) {
  return getActivePlayers(state).filter(player => !player.flags?.isCpu);
}

function getActiveCpuPlayers(state) {
  return getActivePlayers(state).filter(player => player.flags?.isCpu);
}

function isAndroidAlive(state) {
  const android = getAndroidPlayer(state);
  return Boolean(android && !android.flags?.expelled);
}

function isAndroid(player) {
  return player?.roleId === 'android';
}

function getRoundActions(state) {
  return Array.isArray(state.roundActions) ? state.roundActions : [];
}

function actionMatchesRoom(action, roomId) {
  return !Array.isArray(action.roomIds) || action.roomIds.includes(roomId);
}

function actionMatchesRole(action, roleId) {
  return !Array.isArray(action.roleIds) || action.roleIds.includes(roleId);
}

function getAndroidActionUse(state, actionId) {
  return state.androidActionUses?.[actionId] || { count: 0, lastRound: 0 };
}

function canUseAndroidAction(state, action) {
  const usage = getAndroidActionUse(state, action.id);
  const limit = Number.isFinite(action.limit) ? action.limit : 99;
  const cooldown = Number.isFinite(action.cooldown) ? action.cooldown : 0;
  if (usage.count >= limit) return false;
  if (usage.count === 0) return true;
  return state.round - usage.lastRound > cooldown;
}

function getAllowedActionIds(state, player, room) {
  const normal = room.normalTasks || [];
  const special = (room.specialActions || []).filter(actionId => {
    const action = getActionById(actionId);
    return action && actionMatchesRole(action, player.roleId) && actionMatchesRoom(action, room.id);
  });
  const sabotage = isAndroid(player)
    ? (room.sabotageActions || []).filter(actionId => {
      const action = getActionById(actionId);
      return action && actionMatchesRoom(action, room.id) && canUseAndroidAction(state, action);
    })
    : [];
  return [...normal, ...special, ...sabotage];
}

function appendPrivateEvent(state, playerId, event) {
  state.privateEvents[playerId] = [...(state.privateEvents[playerId] || []), event];
}

function createEvent(type, message, extra = {}) {
  return { type, message, ...extra };
}

function createDefaultStats() {
  return {
    tasks: 0,
    repairs: 0,
    sabotages: 0,
    votesCast: 0,
    votesReceived: 0,
    roomsVisited: 0,
    logsRecovered: 0,
    protections: 0,
    expelled: false
  };
}

function getPlayerStats(state, playerId) {
  state.playerStats = state.playerStats || {};
  state.playerStats[playerId] = {
    ...createDefaultStats(),
    ...(state.playerStats[playerId] || {})
  };
  return state.playerStats[playerId];
}

function getPlayerHistory(state, playerId) {
  state.playerHistory = state.playerHistory || { byPlayerId: {} };
  state.playerHistory.byPlayerId = state.playerHistory.byPlayerId || {};
  state.playerHistory.byPlayerId[playerId] = {
    rooms: [],
    votes: [],
    facts: [],
    ...(state.playerHistory.byPlayerId[playerId] || {})
  };
  return state.playerHistory.byPlayerId[playerId];
}

function getCpuMemory(state, playerId) {
  state.cpuMemory = state.cpuMemory || { byPlayerId: {} };
  state.cpuMemory.byPlayerId = state.cpuMemory.byPlayerId || {};
  state.cpuMemory.byPlayerId[playerId] = {
    suspectedPlayerIds: [],
    accusationsReceived: [],
    alliances: [],
    notes: [],
    ...(state.cpuMemory.byPlayerId[playerId] || {})
  };
  return state.cpuMemory.byPlayerId[playerId];
}

function recordRoomVisit(state, playerId, roomId) {
  const history = getPlayerHistory(state, playerId);
  history.rooms = [
    ...history.rooms.filter(item => item.round !== state.round),
    { round: state.round, roomId }
  ].sort((a, b) => a.round - b.round).slice(-8);
}

function recordVoteHistory(state) {
  Object.entries(state.votes?.byPlayerId || {}).forEach(([voterId, targetId]) => {
    const voterHistory = getPlayerHistory(state, voterId);
    voterHistory.votes = [
      ...voterHistory.votes,
      { round: state.round, type: 'cast', targetId }
    ].slice(-8);
    const targetHistory = getPlayerHistory(state, targetId);
    targetHistory.votes = [
      ...targetHistory.votes,
      { round: state.round, type: 'received', voterId }
    ].slice(-8);
  });
  Object.keys(state.votes?.skippedByPlayerId || {}).forEach(voterId => {
    const voterHistory = getPlayerHistory(state, voterId);
    voterHistory.votes = [
      ...voterHistory.votes,
      { round: state.round, type: 'skipped' }
    ].slice(-8);
  });
}

function getTaskProgressScale(state) {
  if (Number.isFinite(state.settings?.taskProgressScale)) return state.settings.taskProgressScale;

  const activeCount = Math.max(1, getActivePlayers(state).length);
  const humanCount = getActiveHumanPlayers(state).length;
  const cpuCount = getActiveCpuPlayers(state).length;
  const humanPenalty = humanCount <= 1 ? 0.55 : humanCount === 2 ? 0.7 : humanCount === 3 ? 0.85 : 1;
  const cpuPenalty = 1 - Math.min(0.35, (cpuCount / activeCount) * 0.25);
  return Math.max(0.4, Math.min(1, humanPenalty * cpuPenalty));
}

function getTaskProgress(state, action) {
  const base = 8 + (hashSeed(`${state.seed}:${state.round}:${action.playerId}:${action.actionId}:${action.roomId}`) % 5);
  const player = getPlayer(state, action.playerId);
  const mechanicBonus = player?.roleId === 'mechanic' && MECHANIC_BONUS_ROOMS.includes(action.roomId) ? 4 : 0;
  return Math.max(3, Math.round((base + mechanicBonus) * getTaskProgressScale(state)));
}

function repairRoom(room) {
  room.sabotaged = false;
  room.locked = false;
  room.status = 'normal';
}

function computeAlertLevel(state, crisisCount = 0, previousIntegrity = state.shipIntegrity) {
  const integrityDrop = previousIntegrity - state.shipIntegrity;
  const hasCriticalRoom = Object.values(state.rooms || {}).some(room => room.status === 'critical');
  const hasLockedRoom = Object.values(state.rooms || {}).some(room => room.locked);
  const hasIncapacitated = state.players.some(player => player.flags?.incapacitatedRound === state.round);
  const hasCorruptedLog = getRoundActions(state).some(action => action.actionId === 'corrupt_logs');
  if (hasCriticalRoom || hasIncapacitated || hasCorruptedLog || state.shipIntegrity <= 35 || integrityDrop >= 25) return 'red';
  if (crisisCount > 0 || hasLockedRoom || state.shipIntegrity <= 70 || integrityDrop >= 12) return 'yellow';
  return 'green';
}

function countText(count) {
  if (count === 0) return 'nenhuma interação';
  if (count === 1) return 'uma interação';
  if (count === 2) return 'duas interações';
  return `${count} interações`;
}

function getMissionObjectives(state) {
  const objectives = state.missionObjectives || {};
  const criticalSystems = Array.isArray(objectives.criticalSystems) ? objectives.criticalSystems : [];
  return {
    ...objectives,
    criticalSystems,
    completed: criticalSystems.length > 0 && criticalSystems.every(item => (item.completed || 0) >= (item.required || 1))
  };
}

function completeRoomObjective(state, roomId) {
  const objectives = getMissionObjectives(state);
  let completedNewObjective = false;
  const criticalSystems = objectives.criticalSystems.map(item => {
    if (item.roomId !== roomId || (item.completed || 0) >= (item.required || 1)) return item;
    completedNewObjective = true;
    return {
      ...item,
      completed: Math.min(item.required || 1, (item.completed || 0) + 1)
    };
  });
  state.missionObjectives = getMissionObjectives({ missionObjectives: { ...objectives, criticalSystems } });
  return completedNewObjective;
}

function missionObjectivesComplete(state) {
  return getMissionObjectives(state).completed;
}

function getPlayerName(state, playerId) {
  return getPlayer(state, playerId)?.name || 'Tripulante';
}

function getRoomName(state, roomId) {
  return state.rooms?.[roomId]?.name || getRoom(roomId)?.name || 'um setor';
}

function playerNames(state, playerIds = []) {
  return playerIds.map(playerId => getPlayerName(state, playerId)).join(', ');
}

function candidateText(state, playerIds = []) {
  if (!playerIds.length) return 'ninguém confirmado';
  if (playerIds.length === 1) return getPlayerName(state, playerIds[0]);
  return `${playerIds.length} candidatos: ${playerNames(state, playerIds)}`;
}

function publicActionClaim(actionId = '') {
  return {
    perform_task: 'fiz uma tarefa do setor',
    calibrate_system: 'calibrei um sistema local',
    inspect_room: 'inspecionei a sala',
    check_logs: 'consultei registros',
    assist_player: 'ajudei outro tripulante',
    observe_player: 'observei movimentação',
    dual_repair: 'executei reparo em dupla',
    emergency_repair: 'executei reparo emergencial',
    stabilize_reactor: 'estabilizei o reator',
    recover_deleted_log: 'recuperei um log apagado',
    trace_access: 'rastreei acessos',
    audit_access: 'auditei acessos suspeitos',
    scan_player: 'escaneei um tripulante',
    match_samples: 'pareei amostras médicas',
    treat_player: 'prestei atendimento médico',
    monitor_room: 'monitorei a sala',
    security_patrol: 'agendei uma ronda de segurança',
    protect_player: 'protegi um tripulante',
    emergency_transmission: 'enviei transmissão de emergência'
  }[actionId] || 'fiz uma tarefa comum';
}

function rollFor(state, salt = '') {
  return (hashSeed(`${state.seed}:${state.round}:${salt}`) % 10000) / 10000;
}

function publicRoundEvent(event = null) {
  if (!event) return null;
  return {
    id: event.id,
    round: event.round,
    type: event.type,
    title: event.title,
    message: event.message,
    roomIds: Array.isArray(event.roomIds) ? [...event.roomIds] : [],
    effects: {
      partialOccupancy: Boolean(event.effects?.partialOccupancy),
      reducedLogs: Boolean(event.effects?.reducedLogs),
      statementWeight: Boolean(event.effects?.statementWeight),
      investigationPriority: Boolean(event.effects?.investigationPriority)
    }
  };
}

function createRoundEvent(state, type) {
  if (type === 'blackout') {
    return {
      id: `round_${state.round}_event_blackout`,
      round: state.round,
      type: 'blackout',
      title: 'Apagão',
      message: 'Luzes e sensores falharam: a ocupação ficou parcial e os depoimentos pesam mais.',
      roomIds: [],
      effects: { partialOccupancy: true, reducedLogs: true, statementWeight: true }
    };
  }
  if (type === 'intrusion_alarm') {
    const rooms = Object.values(state.rooms || {});
    const offset = Math.floor(rollFor(state, 'intrusion-offset') * rooms.length) % Math.max(1, rooms.length);
    const first = rooms[offset]?.id || 'communications';
    const second = rooms[(offset + 3) % rooms.length]?.id || 'reactor';
    return {
      id: `round_${state.round}_event_intrusion_alarm`,
      round: state.round,
      type: 'intrusion_alarm',
      title: 'Alarme de Intrusão',
      message: `Sensores destacaram ${getRoomName(state, first)} e ${getRoomName(state, second)} como setores prioritários.`,
      roomIds: [...new Set([first, second])],
      effects: { investigationPriority: true }
    };
  }
  return null;
}

function selectRoundEvent(state) {
  if (state.nextRoundEvent) return createRoundEvent(state, state.nextRoundEvent);
  if (state.round < 2) return null;
  const roll = rollFor(state, 'round-event');
  if (roll < 0.22) return createRoundEvent(state, 'blackout');
  if (roll < 0.44) return createRoundEvent(state, 'intrusion_alarm');
  return null;
}

function calibrationSucceeded(state, action) {
  const occupants = state.roomOccupancy?.[action.roomId] || [];
  const baseChance = occupants.length >= 2 ? 0.82 : 0.68;
  const room = state.rooms?.[action.roomId];
  const pressurePenalty = room?.sabotaged || room?.locked || room?.status === 'critical' ? 0.18 : 0;
  return rollFor(state, `calibrate:${action.playerId}:${action.roomId}`) < Math.max(0.45, baseChance - pressurePenalty);
}

function topPublicSuspectForCpu(state, player, roundLogs = []) {
  const currentLog = roundLogs
    .filter(log => log.visibility !== 'private' && [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.medical, MISSION_LOG_TYPES.false].includes(log.type))
    .map(log => ({
      log,
      occupants: (state.roomOccupancy?.[log.roomId] || []).filter(playerId => playerId !== player.id)
    }))
    .find(entry => entry.occupants.length);
  if (currentLog) {
    const playerId = currentLog.occupants[0];
    return {
      playerId,
      reason: `${getPlayerName(state, playerId)} estava perto do sinal em ${getRoomName(state, currentLog.log.roomId)}`,
      source: 'current_log'
    };
  }
  const suspicion = getPublicSuspicion(state).byPlayerId || {};
  const candidates = state.players
    .filter(candidate => candidate.id !== player.id && !candidate.flags?.expelled)
    .map(candidate => ({
      playerId: candidate.id,
      score: suspicion[candidate.id]?.score || 0,
      reason: suspicion[candidate.id]?.reasons?.[0]?.message || ''
    }))
    .sort((a, b) => b.score - a.score);
  const evidenceSuspect = (state.evidence || [])
    .filter(item => item.round === state.round && item.suspectIds?.some(id => id !== player.id))
    .sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.reliability] || 0) - ({ high: 3, medium: 2, low: 1 }[a.reliability] || 0))[0];
  const evidencePlayerId = evidenceSuspect?.suspectIds?.find(id => id !== player.id);
  if (evidencePlayerId) {
    return {
      playerId: evidencePlayerId,
      reason: evidenceSuspect.message,
      source: 'evidence'
    };
  }
  if (candidates[0]?.score > 0) {
    return {
      playerId: candidates[0].playerId,
      reason: candidates[0].reason || 'apareceu em sinais públicos acumulados',
      source: 'suspicion'
    };
  }
  return null;
}

function strongestAllyForCpu(state, player) {
  const sameRoom = (state.roomOccupancy?.[player.roomId] || [])
    .find(playerId => playerId !== player.id && !getPlayer(state, playerId)?.flags?.expelled);
  if (sameRoom) return { playerId: sameRoom, reason: `dividiu ${getRoomName(state, player.roomId)} nesta rodada` };
  const alibi = (state.evidence || [])
    .filter(item => item.round === state.round && item.type === 'room_alibi' && item.witnessIds?.includes(player.id))
    .slice(0, 1)[0];
  const allyId = alibi?.witnessIds?.find(playerId => playerId !== player.id);
  return allyId ? { playerId: allyId, reason: alibi.message } : null;
}

function cpuMemoryLine(state, player) {
  const memory = getCpuMemory(state, player.id);
  const suspected = memory.suspectedPlayerIds?.[0];
  const ally = memory.alliances?.[0];
  const accusations = memory.accusationsReceived || [];
  const parts = [];
  if (suspected) parts.push(`tenho observado ${getPlayerName(state, suspected.playerId)} desde a rodada ${suspected.firstRound}`);
  if (ally) parts.push(`${getPlayerName(state, ally.playerId)} me deu álibi temporário`);
  if (accusations.length) parts.push(`já recebi ${accusations.length} acusação(ões)`);
  return parts.join('; ');
}

function createCpuStatement(state, player, action, roundLogs) {
  const forgedAction = getRoundActions(state).find(item => item.actionId === 'forge_statement' && item.targetId === player.id);
  const actualRoomId = action?.roomId || player.roomId;
  const isSecret = action?.type === 'sabotage';
  const rooms = Object.keys(state.rooms || {});
  const forgedRoomId = forgedAction
    ? rooms.find(roomId => roomId !== actualRoomId) || actualRoomId
    : null;
  const claimedRoomId = forgedRoomId || (isSecret && action.targetId
    ? getPlayer(state, action.targetId)?.roomId || actualRoomId
    : actualRoomId);
  const claimedAction = forgedAction
    ? 'respondi a uma chamada de rotina'
    : isSecret ? 'fiz uma tarefa comum' : publicActionClaim(action?.actionId);
  const claimedRoomLogs = roundLogs.filter(log => log.visibility !== 'private' && log.roomId === claimedRoomId);
  const actualRoomLogs = roundLogs.filter(log => log.visibility !== 'private' && log.roomId === actualRoomId);
  const occupantIds = state.roomOccupancy?.[claimedRoomId] || [];
  const roomConflict = !occupantIds.includes(player.id);
  const logConflict = claimedRoomLogs.some(log => [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted].includes(log.type))
    || (isSecret && actualRoomLogs.some(log => [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.false].includes(log.type)));
  const conflict = Boolean(forgedAction || roomConflict || logConflict);
  const conflictReason = forgedAction
    ? `O depoimento de ${player.name} ficou inconsistente com a ocupação parcial conhecida.`
    : roomConflict
      ? `O painel de ocupação não colocou ${player.name} em ${getRoomName(state, claimedRoomId)}.`
      : logConflict
      ? `O relato de ${player.name} não explica o sinal suspeito ligado a ${getRoomName(state, actualRoomId)}.`
      : '';
  const profile = getCpuProfile(player.flags?.personality);
  const suspect = topPublicSuspectForCpu(state, player, roundLogs);
  const ally = strongestAllyForCpu(state, player);
  const memoryLine = cpuMemoryLine(state, player);
  const suspicionText = suspect
    ? `Suspeito de ${getPlayerName(state, suspect.playerId)} porque ${suspect.reason}`
    : profile.id === 'cautious'
      ? 'Ainda não tenho suspeito forte; preciso de mais um log.'
      : 'Não tenho alvo claro, então estou olhando quem ficou sem álibi.';
  const allianceText = ally
    ? `Confio temporariamente em ${getPlayerName(state, ally.playerId)}: ${ally.reason}.`
    : 'Não fecho aliança nesta rodada.';

  return {
    id: `round_${state.round}_cpu_statement_${player.id}`,
    round: state.round,
    playerId: player.id,
    roomId: claimedRoomId,
    profileId: profile.id,
    profileName: profile.name,
    claimedAction,
    suspectedPlayerId: suspect?.playerId || null,
    alliancePlayerId: ally?.playerId || null,
    conflict,
    conflictReason,
    forged: Boolean(forgedAction),
    answers: {
      where: `Eu estava em ${getRoomName(state, claimedRoomId)}.`,
      what: `Eu ${claimedAction}; ${profile.statementTone}.`,
      suspect: suspicionText,
      memory: memoryLine || allianceText
    },
    message: `${player.name} (${profile.name}): "Eu estava em ${getRoomName(state, claimedRoomId)}, ${claimedAction}. ${suspicionText}"`
  };
}

function buildCpuStatements(state, roundLogs) {
  return getActiveCpuPlayers(state).map(player => {
    const action = getRoundActions(state).find(item => item.playerId === player.id);
    return createCpuStatement(state, player, action, roundLogs);
  });
}

function latestStatementForCpu(state, playerId) {
  return (state.cpuStatements || [])
    .filter(statement => statement.playerId === playerId)
    .sort((a, b) => b.round - a.round)[0] || null;
}

function publicPressureAgainst(state, playerId) {
  return (state.evidence || [])
    .filter(item => item.round === state.round && item.suspectIds?.includes(playerId))
    .sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.reliability] || 0) - ({ high: 3, medium: 2, low: 1 }[a.reliability] || 0))[0] || null;
}

function createCpuQuestionResponse(state, humanId, cpuId) {
  const cpu = getPlayer(state, cpuId);
  const human = getPlayer(state, humanId);
  if (!cpu?.flags?.isCpu || !human || cpu.flags?.expelled) return null;
  const profile = getCpuProfile(cpu.flags?.personality);
  const statement = latestStatementForCpu(state, cpuId);
  const pressure = publicPressureAgainst(state, cpuId);
  const suspectId = statement?.suspectedPlayerId;
  const answer = pressure
    ? `${profile.name}: essa pista me coloca no radar, mas ela diz "${pressure.message}". Eu manteria isso como ${pressure.reliability === 'high' ? 'sinal forte' : 'sinal parcial'}, não como prova final.`
    : statement
      ? `${profile.name}: ${statement.answers?.where || `eu estava em ${getRoomName(state, cpu.roomId)}.`} ${statement.answers?.what || ''} ${suspectId ? `Minha pressão vai para ${getPlayerName(state, suspectId)}.` : 'Ainda não tenho alvo claro.'}`
      : `${profile.name}: eu estava em ${getRoomName(state, cpu.roomId)} e não tenho contradição pública para explicar.`;
  return {
    id: `round_${state.round}_cpu_question_${humanId}_${cpuId}`,
    round: state.round,
    askedByPlayerId: humanId,
    playerId: cpuId,
    profileId: profile.id,
    question: `${human.name} perguntou diretamente sobre álibi e suspeita.`,
    answer,
    referencedPlayerId: suspectId || null,
    evidenceId: pressure?.id || null
  };
}

function createCpuAccusationReaction(state, accuserId, cpuId) {
  const cpu = getPlayer(state, cpuId);
  const accuser = getPlayer(state, accuserId);
  if (!cpu?.flags?.isCpu || !accuser || cpu.flags?.expelled) return null;
  const profile = getCpuProfile(cpu.flags?.personality);
  const pressure = publicPressureAgainst(state, cpuId);
  const statement = latestStatementForCpu(state, cpuId);
  const alibi = (state.evidence || [])
    .filter(item => item.round === state.round && item.witnessIds?.includes(cpuId) && ['room_alibi', 'contested_alibi'].includes(item.type))
    .slice(0, 1)[0];
  const answer = pressure
    ? `${profile.name}: eu entendo a acusação, mas a pista pública só aponta candidatos. Minha defesa: ${statement?.answers?.where || `eu estava em ${getRoomName(state, cpu.roomId)}.`}`
    : alibi
      ? `${profile.name}: eu contestaria isso pelo álibi da rodada: ${alibi.message}`
      : `${profile.name}: não há log direto contra mim. Minha melhor defesa é meu relato: ${statement?.answers?.what || 'fiz uma tarefa comum'}.`;
  return {
    id: `round_${state.round}_cpu_reaction_${accuserId}_${cpuId}`,
    round: state.round,
    accuserId,
    playerId: cpuId,
    profileId: profile.id,
    stance: pressure ? 'defensive' : alibi ? 'uses_alibi' : 'pushes_back',
    evidenceId: pressure?.id || alibi?.id || null,
    message: answer
  };
}

function createEvidence(state, input = {}) {
  const suspectIds = Array.isArray(input.suspectIds) ? [...new Set(input.suspectIds.filter(Boolean))] : [];
  const witnessIds = Array.isArray(input.witnessIds) ? [...new Set(input.witnessIds.filter(Boolean))] : [];
  return {
    id: input.id || `round_${state.round}_evidence_${hashSeed(JSON.stringify(input)) % 100000}`,
    round: Number.parseInt(input.round, 10) || state.round,
    type: input.type || 'signal',
    roomId: input.roomId || '',
    suspectIds,
    witnessIds,
    reliability: input.reliability || 'medium',
    origin: input.origin || 'sensors',
    originLogId: input.originLogId || null,
    message: input.message || 'Pista inconclusiva registrada.'
  };
}

function latestUnrevealedFalseEvidence(state, beforeRound = state.round) {
  return (state.plantedFalseEvidence || [])
    .filter(item => !item.revealedRound && item.round < beforeRound)
    .sort((a, b) => b.round - a.round)[0] || null;
}

function buildInvestigationEvidence(state, action, roundLogs) {
  const evidence = [];
  const actionIndex = getRoundActions(state).findIndex(item => item.playerId === action.playerId && item.actionId === action.actionId);
  const actionLog = roundLogs.find(log => log.id === `round_${state.round}_log_${actionIndex + 1}`) || null;
  const occupants = state.roomOccupancy?.[action.roomId] || [];

  if (action.actionId === 'dual_repair') {
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_dual_repair_${action.playerId}_${action.roomId}`,
      type: action.dualRepairReady ? 'strong_alibi' : 'failed_dual_repair',
      roomId: action.roomId,
      suspectIds: [],
      witnessIds: action.dualRepairReady ? occupants : [action.playerId],
      reliability: action.dualRepairReady ? 'high' : 'low',
      origin: 'dual_repair',
      originLogId: actionLog?.id || null,
      message: action.dualRepairReady
        ? `Reparo em dupla confirmou ${playerNames(state, occupants)} trabalhando juntos em ${getRoomName(state, action.roomId)}.`
        : `Reparo em dupla falhou em ${getRoomName(state, action.roomId)} porque não havia segunda confirmação na sala.`
    }));
  }

  if (action.actionId === 'trace_access') {
    const revealedFalse = latestUnrevealedFalseEvidence(state);
    if (revealedFalse) {
      evidence.push(createEvidence(state, {
        id: `round_${state.round}_false_revealed_${revealedFalse.id}`,
        type: 'false_evidence_revealed',
        roomId: revealedFalse.roomId,
        suspectIds: revealedFalse.targetId ? [revealedFalse.targetId] : [],
        witnessIds: [action.playerId],
        reliability: 'high',
        origin: 'trace_access',
        originLogId: revealedFalse.logId || null,
        message: `Rastreamento de TI confirmou que a pista contra ${getPlayerName(state, revealedFalse.targetId)} em ${getRoomName(state, revealedFalse.roomId)} era falsa.`
      }));
    } else {
      const suspiciousRooms = [...new Set(roundLogs
        .filter(log => [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.false].includes(log.type))
        .map(log => log.roomId)
        .filter(Boolean))];
      const roomId = suspiciousRooms[0] || action.roomId;
      const suspects = state.roomOccupancy?.[roomId] || occupants;
      evidence.push(createEvidence(state, {
        id: `round_${state.round}_trace_access_${action.playerId}`,
        type: 'investigation_trace',
        roomId,
        suspectIds: suspects,
        witnessIds: [action.playerId],
        reliability: suspects.length <= 2 ? 'high' : 'medium',
        origin: 'trace_access',
        originLogId: actionLog?.id || null,
        message: `Rastreamento de acesso reduziu o foco em ${getRoomName(state, roomId)} para ${candidateText(state, suspects)}.`
      }));
    }
  }

  if (action.actionId === 'audit_access') {
    const suspiciousLog = roundLogs
      .filter(log => [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.false].includes(log.type))
      .sort((a, b) => {
        const weight = { [MISSION_LOG_TYPES.sabotage]: 3, [MISSION_LOG_TYPES.corrupted]: 2, [MISSION_LOG_TYPES.false]: 1 };
        return (weight[b.type] || 0) - (weight[a.type] || 0);
      })[0];
    const roomId = suspiciousLog?.roomId || action.roomId;
    const suspects = (state.roomOccupancy?.[roomId] || occupants).slice(0, 3);
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_audit_access_${action.playerId}`,
      type: 'access_audit',
      roomId,
      suspectIds: suspects,
      witnessIds: [action.playerId],
      reliability: suspects.length > 0 && suspects.length <= 2 ? 'high' : 'medium',
      origin: 'audit_access',
      originLogId: suspiciousLog?.id || actionLog?.id || null,
      message: suspects.length
        ? `Auditoria de acesso reduziu possíveis autores em ${getRoomName(state, roomId)} para ${candidateText(state, suspects)}.`
        : `Auditoria de acesso em ${getRoomName(state, roomId)} não encontrou autor provável.`
    }));
  }

  if (action.actionId === 'monitor_room') {
    const suspicious = roundLogs.some(log => log.roomId === action.roomId && [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.false].includes(log.type));
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_monitor_room_${action.playerId}_${action.roomId}`,
      type: 'room_monitor',
      roomId: action.roomId,
      suspectIds: suspicious ? occupants : [],
      witnessIds: occupants,
      reliability: 'high',
      origin: 'monitor_room',
      originLogId: actionLog?.id || null,
      message: suspicious
        ? `Monitoramento confirmou sinal suspeito em ${getRoomName(state, action.roomId)} com ${candidateText(state, occupants)} presentes.`
        : `Monitoramento não encontrou sabotagem visível em ${getRoomName(state, action.roomId)}; presentes confirmados: ${candidateText(state, occupants)}.`
    }));
  }

  if (action.actionId === 'security_patrol') {
    const watchedRoomId = getRoom(action.targetId)?.id || action.roomId;
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_security_patrol_scheduled_${action.playerId}_${watchedRoomId}`,
      type: 'security_patrol_scheduled',
      roomId: watchedRoomId,
      suspectIds: [],
      witnessIds: [action.playerId],
      reliability: 'medium',
      origin: 'security_patrol',
      originLogId: actionLog?.id || null,
      message: `Ronda de segurança foi preparada para observar ${getRoomName(state, watchedRoomId)} na próxima rodada.`
    }));
  }

  if (action.actionId === 'emergency_transmission') {
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_emergency_transmission_${action.playerId}`,
      type: 'emergency_transmission',
      roomId: action.roomId,
      suspectIds: [],
      witnessIds: [action.playerId],
      reliability: 'high',
      origin: 'emergency_transmission',
      originLogId: actionLog?.id || null,
      message: `Transmissão de emergência saiu de ${getRoomName(state, action.roomId)} e preparou redução de dano para a próxima falha.`
    }));
  }

  if (action.actionId === 'scan_player' && action.targetId) {
    const target = getPlayer(state, action.targetId);
    const changed = Boolean(target?.flags?.incapacitatedRound === state.round || target?.flags?.protectedRound === state.round);
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_scan_player_${action.playerId}_${action.targetId}`,
      type: 'player_scan',
      roomId: action.roomId,
      suspectIds: changed ? [action.targetId] : [],
      witnessIds: [action.playerId],
      reliability: 'high',
      origin: 'scan_player',
      originLogId: actionLog?.id || null,
      message: changed
        ? `Escaneamento encontrou alteração recente em ${getPlayerName(state, action.targetId)}.`
        : `Escaneamento não encontrou alteração médica recente em ${getPlayerName(state, action.targetId)}.`
    }));
  }

  if (action.actionId === 'match_samples' && action.targetId) {
    const target = getPlayer(state, action.targetId);
    const targetAction = getRoundActions(state).find(item => item.playerId === action.targetId);
    const sufferedSabotage = Boolean(target?.flags?.incapacitatedRound === state.round);
    const fakedCondition = Boolean(targetAction?.type === 'sabotage' || targetAction?.actionId === 'fake_task');
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_match_samples_${action.playerId}_${action.targetId}`,
      type: 'sample_match',
      roomId: action.roomId,
      suspectIds: fakedCondition ? [action.targetId] : [],
      witnessIds: [action.playerId],
      reliability: 'high',
      origin: 'match_samples',
      originLogId: actionLog?.id || null,
      message: sufferedSabotage
        ? `Pareamento médico confirmou que ${getPlayerName(state, action.targetId)} sofreu alteração real nesta rodada.`
        : fakedCondition
          ? `Pareamento médico indicou condição inconsistente em ${getPlayerName(state, action.targetId)}; não parece vítima real.`
          : `Pareamento médico não encontrou sabotagem nem condição fingida em ${getPlayerName(state, action.targetId)}.`
    }));
  }

  if (action.actionId === 'divert_energy') {
    const decoyRoomId = getRoom(action.targetId)?.id || action.roomId;
    const suspects = state.roomOccupancy?.[decoyRoomId] || [];
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_diverted_energy_${action.playerId}_${decoyRoomId}`,
      type: 'energy_risk',
      roomId: decoyRoomId,
      suspectIds: suspects,
      witnessIds: [],
      reliability: 'low',
      origin: 'ship_sensors',
      originLogId: actionLog?.id || null,
      message: suspects.length
        ? `Pico de energia colocou ${getRoomName(state, decoyRoomId)} no radar, mas o sinal é instável: ${candidateText(state, suspects)}.`
        : `Pico de energia colocou ${getRoomName(state, decoyRoomId)} no radar sem presença confirmada.`
    }));
  }

  return evidence;
}

function buildEvidenceFromRoundLogs(state, roundLogs, cpuStatements = []) {
  const evidence = [];
  const publicLogs = roundLogs.filter(log => log.visibility !== 'private');

  if (state.currentRoundEvent?.type === 'intrusion_alarm') {
    (state.currentRoundEvent.roomIds || []).forEach(roomId => {
      const suspects = state.roomOccupancy?.[roomId] || [];
      evidence.push(createEvidence(state, {
        id: `round_${state.round}_intrusion_alarm_${roomId}`,
        type: 'intrusion_alarm',
        roomId,
        suspectIds: suspects,
        witnessIds: [],
        reliability: suspects.length ? 'medium' : 'low',
        origin: 'intrusion_alarm',
        message: suspects.length
          ? `Alarme de intrusão priorizou ${getRoomName(state, roomId)}; investigue ${candidateText(state, suspects)}.`
          : `Alarme de intrusão priorizou ${getRoomName(state, roomId)}, mas ninguém apareceu no painel público.`
      }));
    });
  }

  if (state.currentRoundEvent?.type === 'blackout') {
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_blackout_signal`,
      type: 'blackout',
      roomId: '',
      suspectIds: [],
      witnessIds: [],
      reliability: 'low',
      origin: 'ship_sensors',
      message: 'Apagão deixou a ocupação incompleta; depoimentos e contradições importam mais nesta rodada.'
    }));
  }

  (state.securityWatches || [])
    .filter(watch => watch.watchRound === state.round)
    .forEach(watch => {
      const occupants = state.roomOccupancy?.[watch.roomId] || [];
      const suspicious = publicLogs.some(log => (
        log.roomId === watch.roomId
        && [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.false].includes(log.type)
      ));
      evidence.push(createEvidence(state, {
        id: `round_${state.round}_security_patrol_${watch.playerId}_${watch.roomId}`,
        type: 'security_patrol',
        roomId: watch.roomId,
        suspectIds: suspicious ? occupants : [],
        witnessIds: [watch.playerId, ...occupants],
        reliability: suspicious ? (occupants.length <= 2 ? 'high' : 'medium') : 'high',
        origin: 'security_patrol',
        message: suspicious
          ? `Ronda preparada flagrou sinal suspeito em ${getRoomName(state, watch.roomId)}; foco em ${candidateText(state, occupants)}.`
          : `Ronda preparada não viu sabotagem em ${getRoomName(state, watch.roomId)}; presentes com álibi reforçado: ${candidateText(state, occupants)}.`
      }));
    });

  Object.entries(state.roomOccupancy || {}).forEach(([roomId, playerIds]) => {
    if (playerIds.length < 2) return;
    const roomHadSuspiciousSignal = publicLogs.some(log => (
      log.roomId === roomId
      && [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.medical].includes(log.type)
    ));
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_alibi_${roomId}`,
      type: roomHadSuspiciousSignal ? 'contested_alibi' : 'room_alibi',
      roomId,
      suspectIds: roomHadSuspiciousSignal ? playerIds : [],
      witnessIds: playerIds,
      reliability: roomHadSuspiciousSignal ? 'low' : 'medium',
      origin: 'room_occupancy',
      message: roomHadSuspiciousSignal
        ? `${playerNames(state, playerIds)} estavam juntos em ${getRoomName(state, roomId)}, mas o setor teve sinal suspeito.`
        : `${playerNames(state, playerIds)} podem confirmar presença conjunta em ${getRoomName(state, roomId)}.`
    }));
  });

  publicLogs.forEach(log => {
    const occupants = state.roomOccupancy?.[log.roomId] || [];
    if (log.type === MISSION_LOG_TYPES.sabotage) {
      evidence.push(createEvidence(state, {
        id: `round_${state.round}_sabotage_candidates_${log.id}`,
        type: 'sabotage_candidates',
        roomId: log.roomId,
        suspectIds: occupants,
        reliability: occupants.length <= 2 ? 'high' : 'medium',
        origin: 'ship_sensors',
        originLogId: log.id,
        message: occupants.length
          ? `A falha em ${getRoomName(state, log.roomId)} aponta para ${candidateText(state, occupants)}.`
          : `A falha em ${getRoomName(state, log.roomId)} não teve presença confirmada.`
      }));
    }

    if (log.type === MISSION_LOG_TYPES.corrupted) {
      const calibrationNoise = /calibra/i.test(log.message || '');
      evidence.push(createEvidence(state, {
        id: `round_${state.round}_${calibrationNoise ? 'calibration_noise' : 'tampered'}_${log.id}`,
        type: calibrationNoise ? 'calibration_noise' : 'tampered_record',
        roomId: log.roomId,
        suspectIds: calibrationNoise ? [] : occupants,
        witnessIds: calibrationNoise ? occupants : [],
        reliability: 'low',
        origin: calibrationNoise ? 'calibrate_system' : 'damaged_logs',
        originLogId: log.id,
        message: calibrationNoise
          ? `Falha de calibração em ${getRoomName(state, log.roomId)} gerou ruído; trate como pista fraca, não acusação direta.`
          : occupants.length
          ? `Registro adulterado perto de ${candidateText(state, occupants)} em ${getRoomName(state, log.roomId)}.`
          : `Registro adulterado em ${getRoomName(state, log.roomId)} sem candidato claro.`
      }));
    }

    if (log.type === MISSION_LOG_TYPES.medical && occupants.length) {
      evidence.push(createEvidence(state, {
        id: `round_${state.round}_medical_${log.id}`,
        type: 'medical_anomaly',
        roomId: log.roomId,
        suspectIds: occupants,
        reliability: 'medium',
        origin: 'medical_sensors',
        originLogId: log.id,
        message: `Anomalia médica limita a pressão a ${candidateText(state, occupants)}.`
      }));
    }
  });

  getRoundActions(state).forEach(action => {
    evidence.push(...buildInvestigationEvidence(state, action, roundLogs));
  });

  cpuStatements.filter(statement => statement.conflict).forEach(statement => {
    evidence.push(createEvidence(state, {
      id: `round_${state.round}_statement_conflict_${statement.playerId}`,
      type: statement.forged ? 'forged_statement' : 'statement_conflict',
      roomId: statement.roomId,
      suspectIds: [statement.playerId],
      witnessIds: [],
      reliability: statement.forged || state.currentRoundEvent?.type === 'blackout' ? 'high' : 'medium',
      origin: 'cpu_statement',
      message: statement.conflictReason || `Depoimento de ${getPlayerName(state, statement.playerId)} entrou em conflito com os registros.`
    }));
  });

  const priority = {
    false_evidence_revealed: 95,
    statement_conflict: 88,
    forged_statement: 87,
    investigation_trace: 82,
    access_audit: 80,
    intrusion_alarm: 77,
    blackout: 70,
    security_patrol: 79,
    room_monitor: 78,
    player_scan: 76,
    sample_match: 75,
    strong_alibi: 74,
    emergency_transmission: 73,
    energy_risk: 68,
    security_patrol_scheduled: 54,
    sabotage_candidates: 72,
    tampered_record: 66,
    calibration_noise: 64,
    medical_anomaly: 62,
    failed_dual_repair: 48,
    contested_alibi: 56,
    room_alibi: 42
  };
  return evidence
    .sort((a, b) => (priority[b.type] || 20) - (priority[a.type] || 20))
    .slice(0, 14);
}

function createSuspicionReason(kind, message, round, weight = 1, extra = {}) {
  return { kind, message, round, weight, ...extra };
}

function addSuspicion(state, playerId, amount, reason) {
  if (!playerId || amount <= 0) return;
  state.suspicion = state.suspicion || { byPlayerId: {}, history: [] };
  const current = state.suspicion.byPlayerId?.[playerId] || { score: 0, reasons: [] };
  state.suspicion.byPlayerId = {
    ...(state.suspicion.byPlayerId || {}),
    [playerId]: {
      score: Math.min(100, Math.max(0, (current.score || 0) + amount)),
      reasons: [reason, ...(current.reasons || [])].slice(0, 4)
    }
  };
  state.suspicion.history = [
    ...(state.suspicion.history || []),
    { playerId, delta: amount, ...reason }
  ].slice(-40);
}

function addRoomSuspicion(state, roomId, amount, kind, message) {
  const occupants = state.roomOccupancy?.[roomId] || [];
  if (!occupants.length) return;
  const share = Math.max(1, Math.round(amount / occupants.length));
  occupants.forEach(playerId => {
    addSuspicion(state, playerId, share, createSuspicionReason(kind, message, state.round, share, { roomId }));
  });
}

function updateSuspicionFromRoundLogs(state, roundLogs) {
  roundLogs.filter(log => log.visibility !== 'private').forEach(log => {
    const roomName = getRoomName(state, log.roomId);
    if (log.type === MISSION_LOG_TYPES.sabotage) {
      addRoomSuspicion(state, log.roomId, 24, 'sabotage_room', `Estava em ${roomName} quando sensores marcaram sabotagem.`);
    } else if (log.type === MISSION_LOG_TYPES.corrupted) {
      addRoomSuspicion(state, log.roomId, 16, 'tampered_log', `Apareceu log adulterado ligado a ${roomName}.`);
    } else if (log.type === MISSION_LOG_TYPES.medical) {
      addRoomSuspicion(state, log.roomId, 8, 'medical_anomaly', `Sensores médicos apontaram anomalia em ${roomName}.`);
    }
  });
}

function updateSuspicionFromVotes(state) {
  const counts = state.votes?.result?.counts || {};
  Object.entries(counts).forEach(([targetId, count]) => {
    addSuspicion(
      state,
      targetId,
      Math.min(18, count * 6),
      createSuspicionReason('votes_received', `Recebeu ${count} voto${count === 1 ? '' : 's'} na votação.`, state.round, count * 6)
    );
  });
}

function upsertMemoryEntry(list = [], key, entry, limit = 5) {
  return [
    entry,
    ...list.filter(item => item[key] !== entry[key])
  ].slice(0, limit);
}

function updateCpuMemoryFromRound(state, cpuStatements = []) {
  cpuStatements.forEach(statement => {
    const player = getPlayer(state, statement.playerId);
    if (!player?.flags?.isCpu) return;
    const memory = getCpuMemory(state, player.id);
    if (statement.suspectedPlayerId) {
      const existing = memory.suspectedPlayerIds.find(item => item.playerId === statement.suspectedPlayerId);
      memory.suspectedPlayerIds = upsertMemoryEntry(memory.suspectedPlayerIds, 'playerId', {
        playerId: statement.suspectedPlayerId,
        firstRound: existing?.firstRound || state.round,
        lastRound: state.round,
        reason: statement.answers?.suspect || 'Suspeita pública acumulada.'
      });
    }
    if (statement.alliancePlayerId) {
      memory.alliances = upsertMemoryEntry(memory.alliances, 'playerId', {
        playerId: statement.alliancePlayerId,
        round: state.round,
        expiresRound: state.round + 1,
        reason: statement.answers?.memory || 'Álibi temporário da rodada.'
      }, 3);
    }
    if (statement.conflict) {
      memory.notes = upsertMemoryEntry(memory.notes, 'id', {
        id: `statement_conflict_${state.round}`,
        round: state.round,
        message: statement.conflictReason || 'Depoimento entrou em conflito com registros públicos.'
      }, 4);
    }
  });
}

function updateCpuMemoryFromVotes(state) {
  const votes = state.votes?.byPlayerId || {};
  Object.entries(votes).forEach(([voterId, targetId]) => {
    const target = getPlayer(state, targetId);
    if (!target?.flags?.isCpu) return;
    const memory = getCpuMemory(state, targetId);
    memory.accusationsReceived = [
      {
        round: state.round,
        fromPlayerId: voterId,
        message: `${getPlayerName(state, voterId)} votou contra ${target.name}.`
      },
      ...(memory.accusationsReceived || [])
    ].slice(0, 6);
  });
}

function publicCpuMemoryItem(state, playerId) {
  const memory = state.cpuMemory?.byPlayerId?.[playerId] || {};
  return {
    suspectedPlayerIds: (memory.suspectedPlayerIds || []).slice(0, 3).map(item => ({
      playerId: item.playerId,
      firstRound: item.firstRound,
      lastRound: item.lastRound,
      reason: item.reason
    })),
    accusationsReceived: (memory.accusationsReceived || []).slice(0, 3).map(item => ({
      round: item.round,
      fromPlayerId: item.fromPlayerId,
      message: item.message
    })),
    alliances: (memory.alliances || []).slice(0, 2).map(item => ({
      playerId: item.playerId,
      round: item.round,
      expiresRound: item.expiresRound,
      reason: item.reason
    })),
    notes: (memory.notes || []).slice(0, 2).map(item => ({
      round: item.round,
      message: item.message
    }))
  };
}

function getPublicSuspicion(state) {
  const byPlayerId = state.suspicion?.byPlayerId || {};
  return {
    byPlayerId: Object.fromEntries(state.players.map(player => {
      const entry = byPlayerId[player.id] || { score: 0, reasons: [] };
      return [player.id, {
        score: Math.max(0, Math.min(100, Number.parseInt(entry.score, 10) || 0)),
        level: (entry.score || 0) >= 55 ? 'high' : (entry.score || 0) >= 25 ? 'medium' : 'low',
        reasons: (entry.reasons || []).slice(0, 3)
      }];
    })),
    history: (state.suspicion?.history || []).slice(-12)
  };
}

function buildRoundBriefing(state, roundLogs) {
  const items = [];
  const publicRoundLogs = roundLogs.filter(log => log.visibility !== 'private');
  if (state.currentRoundEvent?.type === 'blackout') {
    items.push({
      type: 'blackout',
      priority: 92,
      title: 'Apagão na rodada',
      detail: 'Ocupação parcial e menos logs: compare depoimentos antes de votar.',
      roomId: ''
    });
  }
  if (state.currentRoundEvent?.type === 'intrusion_alarm') {
    items.push({
      type: 'intrusion',
      priority: 89,
      title: 'Alarme de intrusão',
      detail: `Priorize ${state.currentRoundEvent.roomIds.map(roomId => getRoomName(state, roomId)).join(' e ')}.`,
      roomIds: state.currentRoundEvent.roomIds
    });
  }
  const sabotageRooms = [...new Set(publicRoundLogs.filter(log => log.type === MISSION_LOG_TYPES.sabotage).map(log => log.roomId).filter(Boolean))];
  sabotageRooms.forEach(roomId => {
    const occupants = state.roomOccupancy?.[roomId] || [];
    const names = occupants.map(playerId => getPlayerName(state, playerId)).join(', ') || 'ninguém confirmado';
    items.push({
      type: 'risk',
      priority: 90,
      title: `Falha suspeita em ${getRoomName(state, roomId)}`,
      detail: `Estavam no setor: ${names}.`,
      playerIds: occupants,
      roomId
    });
  });

  const tamperedRooms = [...new Set(publicRoundLogs.filter(log => log.type === MISSION_LOG_TYPES.corrupted).map(log => log.roomId).filter(Boolean))];
  tamperedRooms.forEach(roomId => {
    const occupants = state.roomOccupancy?.[roomId] || [];
    const calibrationNoise = publicRoundLogs.some(log => log.roomId === roomId && log.type === MISSION_LOG_TYPES.corrupted && /calibra/i.test(log.message || ''));
    items.push({
      type: calibrationNoise ? 'noise' : 'log',
      priority: calibrationNoise ? 60 : 72,
      title: calibrationNoise ? `Calibração falhou em ${getRoomName(state, roomId)}` : `Registro instável em ${getRoomName(state, roomId)}`,
      detail: calibrationNoise
        ? 'Ruído técnico: gera dúvida, mas não aponta culpado sozinho.'
        : occupants.length ? `Compare depoimentos de ${occupants.map(playerId => getPlayerName(state, playerId)).join(', ')}.` : 'Use este log como pista fraca.',
      playerIds: calibrationNoise ? [] : occupants,
      roomId
    });
  });

  const completedObjectives = getMissionObjectives(state).criticalSystems.filter(item => {
    const roomActions = getRoundActions(state).filter(action => action.roomId === item.roomId);
    return item.completed >= item.required && roomActions.length;
  });
  completedObjectives.slice(0, 2).forEach(item => {
    items.push({
      type: 'objective',
      priority: 58,
      title: `${getRoomName(state, item.roomId)} avançou`,
      detail: 'Este sistema crítico ficou menos urgente para a próxima rodada.',
      roomId: item.roomId
    });
  });

  const suspicious = Object.entries(getPublicSuspicion(state).byPlayerId)
    .map(([playerId, entry]) => ({ playerId, ...entry }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  suspicious.forEach(entry => {
    items.push({
      type: 'suspect',
      priority: 50 + entry.score,
      title: `${getPlayerName(state, entry.playerId)} entrou no radar`,
      detail: entry.reasons[0]?.message || 'Há sinais públicos acumulados contra este jogador.',
      playerIds: [entry.playerId]
    });
  });

  const alibi = (state.evidence || [])
    .filter(item => item.round === state.round && item.type === 'room_alibi')
    .slice(0, 1)[0];
  if (alibi) {
    items.push({
      type: 'alibi',
      priority: 46,
      title: `Álibi parcial em ${getRoomName(state, alibi.roomId)}`,
      detail: alibi.message,
      playerIds: alibi.witnessIds,
      roomId: alibi.roomId
    });
  }

  const statementConflict = (state.evidence || [])
    .filter(item => item.round === state.round && ['statement_conflict', 'forged_statement'].includes(item.type))
    .slice(0, 1)[0];
  if (statementConflict) {
    items.push({
      type: 'contradiction',
      priority: 82,
      title: `${getPlayerName(state, statementConflict.suspectIds[0])} se contradisse`,
      detail: statementConflict.message,
      playerIds: statementConflict.suspectIds,
      roomId: statementConflict.roomId
    });
  }

  const falseRevealed = (state.evidence || [])
    .filter(item => item.round === state.round && item.type === 'false_evidence_revealed')
    .slice(0, 1)[0];
  if (falseRevealed) {
    items.push({
      type: 'verified',
      priority: 86,
      title: 'Pista falsa identificada',
      detail: falseRevealed.message,
      playerIds: falseRevealed.suspectIds,
      roomId: falseRevealed.roomId
    });
  }

  if (!items.length) {
    items.push({
      type: 'quiet',
      priority: 20,
      title: 'Rodada com poucos sinais fortes',
      detail: 'Use ocupação de salas e votos anteriores para escolher quem pressionar.'
    });
  }

  return items
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map(({ priority, ...item }, index) => ({ id: `round_${state.round}_brief_${index + 1}`, round: state.round, ...item }));
}

function createPlayersFromConfig(config = {}) {
  const inputPlayers = Array.isArray(config.players) ? config.players : [];
  if (inputPlayers.length) return inputPlayers;
  const count = Math.min(8, Math.max(4, Number.parseInt(config.playerCount, 10) || 4));
  return Array.from({ length: count }, (_, index) => ({ id: `player_${index + 1}`, name: `Jogador ${index + 1}` }));
}

function setWinnerIfNeeded(state) {
  const result = checkWinCondition(state);
  if (!result) return state;
  return {
    ...state,
    phase: MISSION_PHASES.final,
    winner: result.winner,
    winReason: result.reason
  };
}

export function createMissionGame(config = {}) {
  return createBaseMissionState({
    id: config.id || `mission_${config.seed || 'draft'}`,
    players: createPlayersFromConfig(config),
    maxRounds: config.maxRounds || config.rounds || DEFAULT_MAX_ROUNDS,
    settings: {
      settingId: 'starship',
      singleDevice: config.singleDevice !== false,
      playerCount: config.playerCount || config.players?.length || 4,
      discussionSeconds: config.discussionSeconds,
      votingSeconds: config.votingSeconds,
      presetId: config.presetId,
      forceVoting: config.forceVoting,
      taskProgressScale: config.taskProgressScale,
      minCrewWinRound: config.minCrewWinRound,
      deferVoteIntegrityCost: config.deferVoteIntegrityCost
    },
    missionObjectives: config.missionObjectives,
    seed: config.seed || 'mission-seed'
  });
}

export function assignRoles(gameState) {
  const state = cloneMissionState(gameState);
  const roles = shuffle(getRoleDistribution(state.players.length), `${state.seed}:roles`);
  state.players = state.players.map((player, index) => ({
    ...player,
    roleId: roles[index] || 'crew'
  }));
  state.phase = MISSION_PHASES.roleReveal;
  state.privateEvents = {};
  state.players.forEach(player => {
    const role = getRole(player.roleId);
    appendPrivateEvent(state, player.id, createEvent('role_assigned', `Seu papel é ${role?.name || 'Tripulante'}.`));
  });
  return state;
}

export function startRound(gameState) {
  const state = cloneMissionState(gameState);
  const roundEvent = selectRoundEvent(state);
  state.phase = MISSION_PHASES.roomSelection;
  state.roomSelections = {};
  state.roomOccupancy = {};
  state.fullRoomOccupancy = {};
  state.roundActions = [];
  state.androidActionUses = state.androidActionUses || {};
  state.currentRoundEvent = roundEvent;
  state.nextRoundEvent = null;
  if (roundEvent) {
    state.roundEvents = [
      ...(state.roundEvents || []).filter(item => item.round !== state.round),
      roundEvent
    ].slice(-8);
  }
  state.votes = { open: false, round: null, byPlayerId: {}, result: null };
  state.publicEvents = [
    ...state.publicEvents,
    createEvent('round_started', `Rodada ${state.round} iniciada.`),
    ...(roundEvent ? [createEvent('round_event', roundEvent.message, { roundEventType: roundEvent.type, roomIds: roundEvent.roomIds })] : [])
  ];
  return state;
}

export function chooseRoom(gameState, playerId, roomId) {
  const state = cloneMissionState(gameState);
  if (state.phase !== MISSION_PHASES.roomSelection) return state;
  const player = getPlayer(state, playerId);
  const room = getRoom(roomId);
  if (!player || !room || player.flags?.expelled) return state;
  player.roomId = room.id;
  state.roomSelections = { ...(state.roomSelections || {}), [playerId]: room.id };
  getPlayerStats(state, playerId).roomsVisited += 1;
  recordRoomVisit(state, playerId, room.id);
  return state;
}

export function revealRoomOccupancy(gameState) {
  const state = cloneMissionState(gameState);
  const occupancy = {};
  state.players.filter(player => !player.flags?.expelled).forEach(player => {
    const roomId = player.roomId || state.roomSelections?.[player.id] || 'cafeteria';
    occupancy[roomId] = [...(occupancy[roomId] || []), player.id];
  });
  state.fullRoomOccupancy = occupancy;
  if (state.currentRoundEvent?.type === 'blackout') {
    const visibleEntries = Object.entries(occupancy).filter(([roomId], index) => (
      index % 2 === 0 || (state.currentRoundEvent?.roomIds || []).includes(roomId)
    ));
    state.roomOccupancy = Object.fromEntries(visibleEntries);
  } else {
    state.roomOccupancy = occupancy;
  }
  state.phase = MISSION_PHASES.roomReveal;
  state.publicEvents = [
    ...state.publicEvents,
    createEvent(
      'room_occupancy_revealed',
      state.currentRoundEvent?.type === 'blackout'
        ? 'A tripulação se posicionou pela nave, mas o apagão ocultou parte da ocupação.'
        : 'A tripulação se posicionou pela nave.'
    )
  ];
  return state;
}

export function chooseAction(gameState, playerId, actionId, targetId = null) {
  const state = cloneMissionState(gameState);
  if (![MISSION_PHASES.roomReveal, MISSION_PHASES.actionSelection].includes(state.phase)) return state;
  const player = getPlayer(state, playerId);
  const action = getActionById(actionId);
  if (!player || !action || player.flags?.expelled) return state;
  const room = getRoom(player.roomId);
  if (!room) return state;
  const allowed = getAllowedActionIds(state, player, room);
  if (!allowed.includes(action.id)) return state;
  if (action.requiresTarget && (!targetId || !getPlayer(state, targetId))) return state;
  if (action.targetCpuOnly && !getPlayer(state, targetId)?.flags?.isCpu) return state;
  if (action.requiresRoomTarget && (!targetId || !getRoom(targetId))) return state;
  state.phase = MISSION_PHASES.actionSelection;
  state.roundActions = [
    ...getRoundActions(state).filter(item => item.playerId !== playerId),
    {
      playerId,
      actionId: action.id,
      targetId,
      roomId: room.id,
      type: action.type,
      secret: action.type === 'sabotage'
    }
  ];
  return state;
}

export function resolveActions(gameState) {
  const state = cloneMissionState(gameState);
  const publicEvents = [];
  let missionProgress = state.missionProgress;
  let shipIntegrity = state.shipIntegrity;
  const previousIntegrity = state.shipIntegrity;
  let crisisCount = 0;
  let activeEmergencySignal = (state.emergencyTransmissions || [])
    .filter(item => !item.usedRound && (item.availableRound || 0) <= state.round && (item.expiresRound || 0) >= state.round)
    .sort((a, b) => a.availableRound - b.availableRound)[0] || null;

  getRoundActions(state).forEach(action => {
    const player = getPlayer(state, action.playerId);
    const room = state.rooms[action.roomId];
    if (!player || !room || player.flags?.expelled) return;

    if (action.type === 'normal_task') {
      const progress = getTaskProgress(state, action);
      const dualRepair = action.actionId === 'dual_repair'
        ? { attempted: true, ready: (state.roomOccupancy?.[action.roomId] || []).length >= 2 }
        : { attempted: false, ready: false };
      const objectiveCompleted = dualRepair.attempted
        ? dualRepair.ready && completeRoomObjective(state, room.id)
        : completeRoomObjective(state, room.id);
      const calibration = action.actionId === 'calibrate_system'
        ? { attempted: true, success: calibrationSucceeded(state, action) }
        : { attempted: false, success: true };
      const taskProgress = dualRepair.attempted
        ? dualRepair.ready ? progress + 4 : 1
        : calibration.attempted && calibration.success
        ? progress + 3
        : calibration.attempted
          ? Math.max(1, Math.round(progress * 0.25))
          : progress;
      missionProgress += dualRepair.attempted && !dualRepair.ready
        ? 1
        : objectiveCompleted ? taskProgress + OBJECTIVE_PROGRESS_BONUS : Math.max(2, Math.round(taskProgress * 0.45));
      getPlayerStats(state, player.id).tasks += 1;
      if (dualRepair.ready) {
        getPlayerStats(state, player.id).repairs += 1;
        shipIntegrity += 8;
        repairRoom(room);
      }
      room.completedTasks = [...(room.completedTasks || []), action.actionId];
      action.calibrationSuccess = calibration.success;
      action.dualRepairReady = dualRepair.ready;
      appendPrivateEvent(state, player.id, createEvent(
        'task_done',
        dualRepair.attempted
          ? dualRepair.ready
            ? 'Reparo em dupla confirmado: o setor foi estabilizado e gerou álibi forte.'
            : 'Reparo em dupla incompleto: faltou segunda confirmação na sala.'
          : calibration.attempted
          ? calibration.success
            ? `Calibração concluída: ${taskProgress}% de progresso potencial.`
            : 'A calibração falhou e gerou ruído nos registros públicos.'
          : `Sua tarefa adicionou ${progress}% à missão.`
      ));
      publicEvents.push(createEvent(
        dualRepair.attempted && dualRepair.ready
          ? 'dual_repair'
          : dualRepair.attempted
            ? 'repair_failed'
            : calibration.attempted && !calibration.success ? 'system_noise' : 'task_progress',
        dualRepair.attempted
          ? dualRepair.ready
            ? `Reparo em dupla estabilizou ${room.name}.`
            : `Reparo em dupla não fechou confirmação em ${room.name}.`
          : calibration.attempted
          ? calibration.success
            ? `Calibração bem-sucedida estabilizou ${room.name}.`
            : `Calibração instável gerou ruído em ${room.name}.`
          : objectiveCompleted
            ? `Sistema crítico avançou em ${room.name}.`
            : `Atividade útil registrada em ${room.name}.`,
        { roomId: room.id, objectiveCompleted, calibration }
      ));
    }

    if (action.type === 'special_action') {
      const objectiveCompleted = completeRoomObjective(state, room.id);
      missionProgress += objectiveCompleted ? SPECIAL_TASK_PROGRESS + OBJECTIVE_PROGRESS_BONUS : SPECIAL_TASK_PROGRESS;
      const isRepair = ['stabilize_reactor', 'emergency_repair'].includes(action.actionId);
      shipIntegrity += isRepair ? 10 : 2;
      if (isRepair) {
        getPlayerStats(state, player.id).repairs += 1;
        repairRoom(room);
      }
      if (action.actionId === 'recover_deleted_log') getPlayerStats(state, player.id).logsRecovered += 1;
      if (action.actionId === 'security_patrol') {
        const watchedRoom = getRoom(action.targetId) || room;
        state.securityWatches = [
          ...(state.securityWatches || []).filter(item => !(item.round === state.round && item.playerId === player.id)),
          {
            id: `watch_${state.round}_${player.id}_${watchedRoom.id}`,
            round: state.round,
            watchRound: state.round + 1,
            playerId: player.id,
            roomId: watchedRoom.id
          }
        ].slice(-8);
      }
      if (action.actionId === 'emergency_transmission') {
        state.emergencyTransmissions = [
          ...(state.emergencyTransmissions || []),
          {
            id: `transmission_${state.round}_${player.id}`,
            round: state.round,
            availableRound: state.round + 1,
            expiresRound: state.round + 2,
            playerId: player.id,
            roomId: room.id,
            damageReduction: 12
          }
        ].slice(-6);
      }
      if (action.actionId === 'protect_player' && action.targetId) {
        const target = getPlayer(state, action.targetId);
        if (target) target.flags = { ...(target.flags || {}), protectedRound: state.round };
        getPlayerStats(state, player.id).protections += 1;
      }
      appendPrivateEvent(state, player.id, createEvent('special_done', 'Sua ação especial foi registrada.'));
      publicEvents.push(createEvent(
        'special_action',
        objectiveCompleted
          ? `Procedimento especializado validou um sistema crítico em ${room.name}.`
          : `Procedimento especializado ocorreu em ${room.name}.`,
        { roomId: room.id, objectiveCompleted }
      ));
    }

    if (action.type === 'sabotage' && isAndroid(player)) {
      const actionInfo = getActionById(action.actionId);
      const protectedTarget = action.targetId ? getPlayer(state, action.targetId)?.flags?.protectedRound === state.round : false;
      const rawDamage = actionInfo?.damage ?? SABOTAGE_DAMAGE;
      const protectedDamage = protectedTarget ? Math.floor(rawDamage / 2) : rawDamage;
      const signalReduction = activeEmergencySignal ? Math.min(activeEmergencySignal.damageReduction || 0, protectedDamage) : 0;
      const damage = Math.max(0, protectedDamage - signalReduction);
      shipIntegrity -= damage;
      crisisCount += 1;
      getPlayerStats(state, player.id).sabotages += 1;
      if (signalReduction > 0) {
        state.emergencyTransmissions = (state.emergencyTransmissions || []).map(item => (
          item.id === activeEmergencySignal.id
            ? { ...item, usedRound: state.round, preventedDamage: signalReduction }
            : item
        ));
        publicEvents.push(createEvent(
          'emergency_transmission_used',
          `Transmissão de emergência reduziu ${signalReduction}% de dano da falha.`,
          { roomId: room.id, preventedDamage: signalReduction }
        ));
        activeEmergencySignal = null;
      }
      if (['poison_supplies', 'vent_accident'].includes(action.actionId) && action.targetId) {
        const target = getPlayer(state, action.targetId);
        if (target && !protectedTarget) target.flags = { ...(target.flags || {}), incapacitatedRound: state.round };
      }
      if (action.actionId === 'plant_false_evidence') {
        state.plantedFalseEvidence = [
          ...(state.plantedFalseEvidence || []),
          {
            id: `false_${state.round}_${action.playerId}_${action.targetId || 'unknown'}`,
            round: state.round,
            roomId: room.id,
            targetId: action.targetId || null,
            plantedById: action.playerId,
            logId: `round_${state.round}_log_${getRoundActions(state).findIndex(item => item.playerId === action.playerId && item.actionId === action.actionId) + 1}`
          }
        ];
      }
      if (action.actionId === 'forge_statement') {
        state.forgedStatements = [
          ...(state.forgedStatements || []),
          {
            id: `forged_statement_${state.round}_${action.targetId || 'unknown'}`,
            round: state.round,
            targetId: action.targetId || null,
            roomId: room.id
          }
        ].slice(-6);
      }
      const affectedRoom = action.actionId === 'divert_energy'
        ? state.rooms[getRoom(action.targetId)?.id] || room
        : room;
      affectedRoom.sabotaged = true;
      affectedRoom.status = action.actionId === 'lock_room'
        ? 'locked'
        : action.actionId === 'overload_reactor'
          ? 'critical'
          : 'sabotaged';
      affectedRoom.locked = action.actionId === 'lock_room';
      state.androidActionUses[action.actionId] = {
        count: getAndroidActionUse(state, action.actionId).count + 1,
        lastRound: state.round
      };
      appendPrivateEvent(state, player.id, createEvent('sabotage_done', `Ação secreta aplicada em ${room.name}.`));
      publicEvents.push(createEvent('system_warning', `Uma falha suspeita surgiu em ${affectedRoom.name}.`, { roomId: affectedRoom.id }));
    }
  });

  state.missionProgress = clamp(missionProgress);
  state.shipIntegrity = clamp(shipIntegrity);
  state.alertLevel = computeAlertLevel(state, crisisCount, previousIntegrity);
  state.publicEvents = [...state.publicEvents, ...publicEvents];
  state.phase = MISSION_PHASES.resolution;
  return setWinnerIfNeeded(state);
}

export function generateLogs(gameState) {
  const state = cloneMissionState(gameState);
  const occupancyLogs = Object.entries(state.roomOccupancy || {}).map(([roomId, playerIds], index) => {
    const room = state.rooms[roomId];
    return publicLog({
      id: `round_${state.round}_occupancy_${index + 1}`,
      round: state.round,
      roomId,
      type: MISSION_LOG_TYPES.occupancy,
      precision: playerIds.length > 1 ? LOG_PRECISION.partial : LOG_PRECISION.vague,
      message: `O painel de ${room?.name || 'um setor'} registrou ${countText(playerIds.length)}.`
    });
  });
  let actionLogs = getRoundActions(state).flatMap((action, index) => {
    const room = state.rooms[action.roomId];
    const actionInfo = getActionById(action.actionId);
    const base = {
      id: `round_${state.round}_log_${index + 1}`,
      round: state.round,
      roomId: action.roomId
    };
    const privateEntry = privateLog(action.playerId, {
      ...base,
      id: `${base.id}_private`,
      type: action.type === 'sabotage' ? MISSION_LOG_TYPES.sabotage : MISSION_LOG_TYPES.access,
      precision: LOG_PRECISION.strong,
      message: action.type === 'sabotage'
        ? `Ação secreta executada em ${room?.name || 'setor desconhecido'}.`
        : `Você executou ${actionInfo?.name || 'uma ação'} em ${room?.name || 'setor desconhecido'}.`
    });

    if (action.actionId === 'trace_access') {
      const falseEvidence = latestUnrevealedFalseEvidence(state);
      const suspiciousRooms = [...new Set((state.logs || [])
        .filter(log => [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted].includes(log.type))
        .map(log => log.roomId)
        .filter(Boolean))];
      const roomId = falseEvidence?.roomId || suspiciousRooms[0] || action.roomId;
      const suspects = falseEvidence?.targetId ? [falseEvidence.targetId] : (state.roomOccupancy?.[roomId] || []);
      return [publicLog({
        ...base,
        roomId,
        type: MISSION_LOG_TYPES.recovered,
        precision: LOG_PRECISION.strong,
        message: falseEvidence
          ? `Rastreamento de TI encontrou manipulação em pista antiga contra ${getPlayerName(state, falseEvidence.targetId)}.`
          : `Rastreamento de TI em ${room?.name || 'um setor'} reduziu candidatos para ${candidateText(state, suspects)}.`
      }), privateEntry];
    }
    if (action.actionId === 'audit_access') {
      const suspiciousAction = getRoundActions(state).find(item => (
        item.type === 'sabotage'
        || ['corrupt_logs', 'plant_false_evidence'].includes(item.actionId)
      ));
      const roomId = suspiciousAction?.roomId || action.roomId;
      const suspects = state.roomOccupancy?.[roomId] || [];
      return [publicLog({
        ...base,
        roomId,
        type: MISSION_LOG_TYPES.recovered,
        precision: suspects.length <= 2 ? LOG_PRECISION.strong : LOG_PRECISION.partial,
        message: `Auditoria de acesso em ${getRoomName(state, roomId)} listou possíveis autores: ${candidateText(state, suspects)}.`
      }), privateEntry];
    }
    if (action.actionId === 'recover_deleted_log') {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.recovered,
        precision: LOG_PRECISION.strong,
        message: `Log recuperado em ${room?.name || 'um setor'} aponta para presença de ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    if (action.actionId === 'dual_repair') {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: action.dualRepairReady ? MISSION_LOG_TYPES.repair : MISSION_LOG_TYPES.access,
        precision: action.dualRepairReady ? LOG_PRECISION.strong : LOG_PRECISION.vague,
        message: action.dualRepairReady
          ? `Reparo em dupla em ${room?.name || 'um setor'} confirmou ${playerNames(state, occupants)} trabalhando juntos.`
          : `Reparo em dupla em ${room?.name || 'um setor'} ficou incompleto por falta de segunda confirmação.`
      }), privateEntry];
    }
    if (action.actionId === 'monitor_room') {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.security,
        precision: LOG_PRECISION.strong,
        message: `Câmeras em ${room?.name || 'um setor'} reduziram o foco para ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    if (action.actionId === 'emergency_transmission') {
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.recovered,
        precision: LOG_PRECISION.strong,
        message: `Transmissão de emergência saiu de ${room?.name || 'Comunicações'} e preparou redução de dano para a próxima falha.`
      }), privateEntry];
    }
    if (action.actionId === 'security_patrol') {
      const watchedRoom = getRoom(action.targetId) || room;
      return [publicLog({
        ...base,
        roomId: watchedRoom.id,
        type: MISSION_LOG_TYPES.security,
        precision: LOG_PRECISION.partial,
        message: `Segurança preparou ronda para observar ${watchedRoom.name} na próxima rodada.`
      }), privateEntry];
    }
    if (['scan_player', 'match_samples', 'treat_player'].includes(action.actionId)) {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.medical,
        precision: action.actionId === 'match_samples' ? LOG_PRECISION.strong : LOG_PRECISION.partial,
        message: action.actionId === 'match_samples' && action.targetId
          ? `Laboratório médico pareou amostras de ${getPlayerName(state, action.targetId)}.`
          : `Sensores médicos em ${room?.name || 'um setor'} apontaram anomalia entre ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    if (action.actionId === 'calibrate_system') {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: action.calibrationSuccess ? MISSION_LOG_TYPES.access : MISSION_LOG_TYPES.corrupted,
        precision: action.calibrationSuccess ? LOG_PRECISION.partial : LOG_PRECISION.corrupted,
        message: action.calibrationSuccess
          ? `Calibração em ${room?.name || 'um setor'} confirmou atividade legítima entre ${candidateText(state, occupants)}.`
          : `Calibração falhou em ${room?.name || 'um setor'} e criou ruído nos registros de ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    if (action.actionId === 'corrupt_logs') {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.corrupted,
        precision: LOG_PRECISION.corrupted,
        message: `Um log foi apagado em ${room?.name || 'um setor'}; candidatos próximos: ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    if (action.actionId === 'plant_false_evidence') {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.false,
        precision: LOG_PRECISION.false,
        targetId: action.targetId,
        message: `Uma evidência ambígua em ${room?.name || 'um setor'} envolve ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    if (action.actionId === 'divert_energy') {
      const decoyRoom = getRoom(action.targetId) || room;
      const occupants = state.roomOccupancy?.[decoyRoom.id] || [];
      return [publicLog({
        ...base,
        roomId: decoyRoom.id,
        type: MISSION_LOG_TYPES.false,
        precision: LOG_PRECISION.false,
        message: `Sensores indicam risco energético em ${decoyRoom.name}; candidatos próximos: ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    if (action.actionId === 'forge_statement') {
      const targetName = getPlayerName(state, action.targetId);
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.corrupted,
        precision: LOG_PRECISION.corrupted,
        message: `Transcrição de depoimento ficou inconsistente envolvendo ${targetName}.`
      }), privateEntry];
    }
    if (action.type === 'sabotage') {
      const occupants = state.roomOccupancy?.[action.roomId] || [];
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.sabotage,
        precision: LOG_PRECISION.partial,
        message: `Sensores indicam que um dos presentes em ${room?.name || 'um setor'} causou falha: ${candidateText(state, occupants)}.`
      }), privateEntry];
    }
    const occupants = state.roomOccupancy?.[action.roomId] || [];
    return [publicLog({
      ...base,
      type: MISSION_LOG_TYPES.access,
      precision: action.actionId === 'check_logs' ? LOG_PRECISION.partial : LOG_PRECISION.vague,
      message: action.actionId === 'check_logs'
        ? `Acesso técnico em ${room?.name || 'um setor'} ficou entre ${candidateText(state, occupants)}.`
        : `Atividade operacional em ${room?.name || 'um setor'} teve presença de ${candidateText(state, occupants)}.`
    }), privateEntry];
  });
  if (state.currentRoundEvent?.type === 'blackout') {
    actionLogs = actionLogs.filter((log, index) => (
      log.visibility === 'private'
      || [MISSION_LOG_TYPES.sabotage, MISSION_LOG_TYPES.corrupted, MISSION_LOG_TYPES.false, MISSION_LOG_TYPES.recovered].includes(log.type)
      || index % 3 === 0
    )).map(log => (
      log.visibility === 'private' ? log : {
        ...log,
        precision: log.precision === LOG_PRECISION.strong ? LOG_PRECISION.partial : log.precision,
        message: log.type === MISSION_LOG_TYPES.corrupted
          ? log.message
          : `${log.message} Sinal afetado pelo apagão.`
      }
    ));
  }
  const roundLogs = [...occupancyLogs, ...actionLogs];
  const cpuStatements = buildCpuStatements(state, roundLogs);
  const roundEvidence = buildEvidenceFromRoundLogs(state, roundLogs, cpuStatements);
  const revealedFalseIds = roundEvidence
    .filter(item => item.type === 'false_evidence_revealed')
    .map(item => item.id.replace(`round_${state.round}_false_revealed_`, ''));
  if (revealedFalseIds.length) {
    state.plantedFalseEvidence = (state.plantedFalseEvidence || []).map(item => (
      revealedFalseIds.includes(item.id) ? { ...item, revealedRound: state.round } : item
    ));
  }
  state.logs = [...state.logs, ...roundLogs];
  state.cpuStatements = [
    ...(state.cpuStatements || []).filter(statement => statement.round !== state.round),
    ...cpuStatements
  ];
  state.evidence = [...(state.evidence || []), ...roundEvidence];
  updateSuspicionFromRoundLogs(state, roundLogs);
  updateCpuMemoryFromRound(state, cpuStatements);
  state.roundBriefing = buildRoundBriefing(state, roundLogs);
  state.phase = MISSION_PHASES.logs;
  return state;
}

function publicEvidenceItem(item = {}) {
  return {
    id: item.id,
    round: item.round,
    type: item.type,
    roomId: item.roomId,
    suspectIds: Array.isArray(item.suspectIds) ? [...item.suspectIds] : [],
    witnessIds: Array.isArray(item.witnessIds) ? [...item.witnessIds] : [],
    reliability: item.reliability,
    origin: item.origin,
    originLogId: item.originLogId || null,
    message: item.message
  };
}

function publicCpuStatement(statement = {}) {
  return {
    id: statement.id,
    round: statement.round,
    playerId: statement.playerId,
    roomId: statement.roomId,
    profileId: statement.profileId,
    profileName: statement.profileName,
    claimedAction: statement.claimedAction,
    suspectedPlayerId: statement.suspectedPlayerId || null,
    alliancePlayerId: statement.alliancePlayerId || null,
    conflict: Boolean(statement.conflict),
    conflictReason: statement.conflict ? statement.conflictReason : '',
    answers: {
      where: statement.answers?.where || '',
      what: statement.answers?.what || '',
      suspect: statement.answers?.suspect || '',
      memory: statement.answers?.memory || ''
    },
    message: statement.message
  };
}

function publicCpuQuestion(item = {}) {
  return {
    id: item.id,
    round: item.round,
    askedByPlayerId: item.askedByPlayerId,
    playerId: item.playerId,
    profileId: item.profileId,
    question: item.question || '',
    answer: item.answer || '',
    referencedPlayerId: item.referencedPlayerId || null,
    evidenceId: item.evidenceId || null
  };
}

function publicCpuAccusationReaction(item = {}) {
  return {
    id: item.id,
    round: item.round,
    accuserId: item.accuserId,
    playerId: item.playerId,
    profileId: item.profileId,
    stance: item.stance || 'pushes_back',
    evidenceId: item.evidenceId || null,
    message: item.message || ''
  };
}

function publicCpuVoteExplanation(item = {}) {
  return {
    id: item.id,
    round: item.round,
    voterId: item.voterId,
    targetId: item.targetId || null,
    skipped: Boolean(item.skipped),
    profileId: item.profileId,
    profileName: item.profileName,
    confidence: item.confidence || 'medium',
    reason: item.reason || 'Voto sem justificativa pública.',
    clue: item.clue || ''
  };
}

function buildPublicRoundTimeline(state, publicLogs = []) {
  const timeline = [];
  const roomEntries = Object.entries(state.roomOccupancy || {})
    .filter(([, playerIds]) => playerIds.length)
    .slice(0, 4);
  if (roomEntries.length) {
    timeline.push({
      id: `round_${state.round}_timeline_movement`,
      round: state.round,
      stage: 'movement',
      title: 'Movimento',
      message: roomEntries
        .map(([roomId, playerIds]) => `${getRoomName(state, roomId)}: ${playerNames(state, playerIds)}`)
        .join(' · ')
    });
  }

  const roundEvents = (state.publicEvents || [])
    .filter(event => ['round_event', 'task_progress', 'dual_repair', 'repair_failed', 'special_action', 'system_warning', 'system_noise', 'emergency_transmission_used', 'vote_deferred'].includes(event.type))
    .slice(-3);
  roundEvents.forEach((event, index) => {
    timeline.push({
      id: `round_${state.round}_timeline_event_${index + 1}`,
      round: state.round,
      stage: 'event',
      title: 'Evento',
      roomId: event.roomId || '',
      message: event.message
    });
  });

  publicLogs
    .filter(log => log.round === state.round)
    .filter(log => log.type !== MISSION_LOG_TYPES.occupancy)
    .slice(-3)
    .forEach((log, index) => {
      timeline.push({
        id: `round_${state.round}_timeline_log_${index + 1}`,
        round: state.round,
        stage: 'log',
        title: 'Log',
        roomId: log.roomId || '',
        message: log.message
      });
    });

  (state.cpuStatements || [])
    .filter(statement => statement.round === state.round)
    .slice(0, 3)
    .forEach((statement, index) => {
      timeline.push({
        id: `round_${state.round}_timeline_statement_${index + 1}`,
        round: state.round,
        stage: 'statement',
        title: statement.conflict ? 'Depoimento contestado' : 'Depoimento',
        roomId: statement.roomId || '',
        playerIds: [statement.playerId],
        message: statement.conflict ? statement.conflictReason || statement.message : statement.message
      });
    });

  return timeline.slice(0, 9);
}

function publicPlayerHistory(state) {
  const byPlayerId = state.playerHistory?.byPlayerId || {};
  const suspicion = getPublicSuspicion(state);
  return {
    byPlayerId: Object.fromEntries(state.players.map(player => {
      const history = byPlayerId[player.id] || {};
      const suspicionEntry = suspicion.byPlayerId[player.id] || { score: 0, level: 'low', reasons: [] };
      const relatedEvidence = (state.evidence || [])
        .filter(item => (
          item.suspectIds?.includes(player.id)
          || item.witnessIds?.includes(player.id)
        ))
        .slice(-4)
        .map(item => ({
          id: item.id,
          round: item.round,
          type: item.type,
          roomId: item.roomId,
          reliability: item.reliability,
          message: item.message
        }));
      return [player.id, {
        suspicion: suspicionEntry,
        rooms: (history.rooms || []).slice(-6),
        votes: (history.votes || []).slice(-6),
        cpuMemory: player.flags?.isCpu ? publicCpuMemoryItem(state, player.id) : null,
        evidence: relatedEvidence
      }];
    }))
  };
}

export function startDiscussion(gameState) {
  const state = cloneMissionState(gameState);
  state.phase = MISSION_PHASES.discussion;
  state.publicEvents = [
    ...state.publicEvents,
    createEvent('discussion_started', 'Discussão iniciada.')
  ];
  return state;
}

export function askCpuQuestion(gameState, humanId, cpuId) {
  const state = cloneMissionState(gameState);
  if (![MISSION_PHASES.logs, MISSION_PHASES.discussion].includes(state.phase)) return state;
  const existing = (state.cpuQuestions || []).filter(item => item.round === state.round && item.askedByPlayerId === humanId);
  if (existing.some(item => item.playerId === cpuId) || existing.length >= 2) return state;
  const response = createCpuQuestionResponse(state, humanId, cpuId);
  if (!response) return state;
  state.cpuQuestions = [
    ...(state.cpuQuestions || []),
    response
  ];
  return state;
}

export function accuseCpu(gameState, accuserId, cpuId) {
  const state = cloneMissionState(gameState);
  if (![MISSION_PHASES.logs, MISSION_PHASES.discussion, MISSION_PHASES.voting].includes(state.phase)) return state;
  const existing = (state.cpuAccusationReactions || []).filter(item => item.round === state.round && item.accuserId === accuserId);
  if (existing.some(item => item.playerId === cpuId) || existing.length >= 2) return state;
  const reaction = createCpuAccusationReaction(state, accuserId, cpuId);
  if (!reaction) return state;
  state.cpuAccusationReactions = [
    ...(state.cpuAccusationReactions || []),
    reaction
  ];
  const memory = getCpuMemory(state, cpuId);
  memory.accusationsReceived = [
    {
      round: state.round,
      fromPlayerId: accuserId,
      message: `${getPlayerName(state, accuserId)} acusou ${getPlayerName(state, cpuId)} antes do voto.`
    },
    ...(memory.accusationsReceived || [])
  ].slice(0, 6);
  return state;
}

export function startVoting(gameState) {
  const state = cloneMissionState(gameState);
  state.phase = MISSION_PHASES.voting;
  state.votes = {
    open: true,
    round: state.round,
    byPlayerId: {},
    skippedByPlayerId: {},
    result: null
  };
  return state;
}

export function submitVote(gameState, voterId, targetId) {
  const state = cloneMissionState(gameState);
  const voter = getPlayer(state, voterId);
  const target = targetId === SKIP_VOTE ? null : getPlayer(state, targetId);
  if (!state.votes?.open || !voter || voter.flags?.expelled) return state;
  if (targetId !== SKIP_VOTE && (!target || target.flags?.expelled)) return state;
  if (targetId === SKIP_VOTE) {
    state.votes.skippedByPlayerId = {
      ...(state.votes.skippedByPlayerId || {}),
      [voterId]: true
    };
    delete state.votes.byPlayerId[voterId];
    return state;
  }
  state.votes.byPlayerId = {
    ...state.votes.byPlayerId,
    [voterId]: targetId
  };
  if (state.votes.skippedByPlayerId) delete state.votes.skippedByPlayerId[voterId];
  return state;
}

export function resolveVoting(gameState) {
  const state = cloneMissionState(gameState);
  const counts = {};
  Object.values(state.votes?.byPlayerId || {}).filter(targetId => targetId !== SKIP_VOTE).forEach(targetId => {
    counts[targetId] = (counts[targetId] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [targetId, count = 0] = sorted[0] || [];
  const tied = sorted.length > 1 && sorted[0][1] === sorted[1][1];
  const activeCount = state.players.filter(player => !player.flags?.expelled).length;
  const expelled = !tied && count > activeCount / 2 ? targetId : null;

  if (expelled) {
    const target = getPlayer(state, expelled);
    target.flags = { ...(target.flags || {}), expelled: true };
    getPlayerStats(state, expelled).expelled = true;
  }

  Object.keys(state.votes?.byPlayerId || {}).forEach(voterId => {
    getPlayerStats(state, voterId).votesCast += 1;
  });
  Object.entries(counts).forEach(([targetId, count]) => {
    getPlayerStats(state, targetId).votesReceived += count;
  });
  recordVoteHistory(state);

  state.votes = {
    ...state.votes,
    open: false,
    result: {
      expelled,
      tied,
      counts,
      skipped: Object.keys(state.votes?.skippedByPlayerId || {}).length
    }
  };
  state.phase = MISSION_PHASES.voteReveal;
  state.publicEvents = [
    ...state.publicEvents,
    createEvent('vote_resolved', expelled ? 'A votação expulsou um jogador.' : 'A votação terminou sem expulsão.')
  ];
  updateSuspicionFromVotes(state);
  updateCpuMemoryFromVotes(state);

  const winState = setWinnerIfNeeded(state);
  if (winState.phase === MISSION_PHASES.final) return winState;
  if (state.round >= state.maxRounds) return setWinnerIfNeeded({ ...state, phase: MISSION_PHASES.final });
  return {
    ...state,
    round: state.round + 1
  };
}

export function deferVoting(gameState) {
  const state = cloneMissionState(gameState);
  const cost = Number.parseInt(state.settings?.deferVoteIntegrityCost, 10) || 8;
  state.shipIntegrity = clamp((state.shipIntegrity || 0) - cost);
  state.alertLevel = computeAlertLevel(state, 0, (state.shipIntegrity || 0) + cost);
  state.votes = {
    open: false,
    round: state.round,
    byPlayerId: {},
    skippedByPlayerId: {},
    result: {
      expelled: null,
      tied: false,
      counts: {},
      skipped: getActivePlayers(state).length,
      deferred: true,
      integrityCost: cost
    }
  };
  state.publicEvents = [
    ...state.publicEvents,
    createEvent('vote_deferred', `A acusação foi adiada. A nave perdeu ${cost}% de integridade.`)
  ];
  state.phase = MISSION_PHASES.voteReveal;

  const winState = setWinnerIfNeeded(state);
  if (winState.phase === MISSION_PHASES.final) return winState;
  if (state.round >= state.maxRounds) return setWinnerIfNeeded({ ...state, phase: MISSION_PHASES.final });
  return {
    ...state,
    round: state.round + 1
  };
}

export function checkWinCondition(gameState) {
  const androidAlive = isAndroidAlive(gameState);
  const activePlayers = getActivePlayers(gameState);
  const activeCrew = activePlayers.filter(player => player.roleId !== 'android');
  const minCrewWinRound = Number.parseInt(gameState.settings?.minCrewWinRound, 10) || 3;
  if (gameState.missionProgress >= 100 && gameState.round >= minCrewWinRound && missionObjectivesComplete(gameState)) {
    return { winner: CREW_WIN, reason: 'mission_complete' };
  }
  if (!androidAlive) {
    return { winner: CREW_WIN, reason: 'android_expelled' };
  }
  if (gameState.shipIntegrity <= 0) {
    return { winner: ANDROID_WIN, reason: 'ship_destroyed' };
  }
  if (activeCrew.length <= 1) {
    return { winner: ANDROID_WIN, reason: 'crew_too_low' };
  }
  if (gameState.round >= gameState.maxRounds && gameState.missionProgress < 100 && gameState.phase === MISSION_PHASES.final) {
    return { winner: ANDROID_WIN, reason: 'android_survived' };
  }
  return null;
}

export function getPublicState(gameState) {
  const revealVotes = [MISSION_PHASES.voteReveal, MISSION_PHASES.final].includes(gameState.phase);
  const finalReveal = gameState.phase === MISSION_PHASES.final;
  const android = finalReveal ? getAndroidPlayer(gameState) : null;
  const publicLogs = (gameState.logs || []).filter(log => log.visibility !== 'private').map(log => {
    if (log.type !== MISSION_LOG_TYPES.false && log.precision !== LOG_PRECISION.false) return log;
    return {
      ...log,
      type: MISSION_LOG_TYPES.access,
      precision: LOG_PRECISION.vague,
      targetId: null,
      tags: (log.tags || []).filter(tag => tag !== 'internally_false')
    };
  });
  return {
    id: gameState.id,
    phase: gameState.phase,
    round: gameState.round,
    maxRounds: gameState.maxRounds,
    players: gameState.players.map(publicPlayer),
    rooms: Object.fromEntries(Object.values(gameState.rooms || {}).map(room => [room.id, publicRoom(room)])),
    roomOccupancy: gameState.roomOccupancy || {},
    currentRoundEvent: publicRoundEvent(gameState.currentRoundEvent),
    roundEvents: (gameState.roundEvents || []).map(publicRoundEvent).filter(Boolean),
    missionObjectives: getMissionObjectives(gameState),
    suspicion: getPublicSuspicion(gameState),
    cpuMemory: {
      byPlayerId: Object.fromEntries(gameState.players
        .filter(player => player.flags?.isCpu)
        .map(player => [player.id, publicCpuMemoryItem(gameState, player.id)]))
    },
    playerHistory: publicPlayerHistory(gameState),
    roundTimeline: buildPublicRoundTimeline(gameState, publicLogs),
    roundBriefing: gameState.roundBriefing || [],
    evidence: (gameState.evidence || []).map(publicEvidenceItem),
    cpuStatements: (gameState.cpuStatements || []).map(publicCpuStatement),
    cpuQuestions: (gameState.cpuQuestions || []).map(publicCpuQuestion),
    cpuAccusationReactions: (gameState.cpuAccusationReactions || []).map(publicCpuAccusationReaction),
    cpuVoteExplanations: (gameState.cpuVoteExplanations || []).map(publicCpuVoteExplanation),
    publicEvents: gameState.publicEvents,
    logs: publicLogs,
    shipIntegrity: gameState.shipIntegrity,
    missionProgress: gameState.missionProgress,
    alertLevel: gameState.alertLevel,
    activePlayers: getActivePlayers(gameState).length,
    androidAlive: finalReveal ? isAndroidAlive(gameState) : null,
    votes: revealVotes ? gameState.votes : { open: Boolean(gameState.votes?.open), round: gameState.votes?.round || null },
    settings: gameState.settings,
    winner: gameState.winner || null,
    winReason: gameState.winReason || null,
    androidIdentity: android ? { id: android.id, name: android.name } : null,
    playerStats: finalReveal ? (gameState.playerStats || {}) : null
  };
}

export function getPrivateState(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  if (!player) return null;
  const role = getRole(player.roleId);
  return {
    player: {
      ...publicPlayer(player),
      roleId: player.roleId,
      roleName: role?.name || null,
      team: role?.team || null
    },
    privateEvents: gameState.privateEvents?.[playerId] || [],
    privateLogs: (gameState.logs || []).filter(log => log.visibility === 'private' && log.playerId === playerId),
    availableActions: getAvailableActionsForPlayer(gameState, playerId),
    ownVote: gameState.votes?.byPlayerId?.[playerId] || null
  };
}

export function getAvailableActionsForPlayer(gameState, playerId) {
  const player = getPlayer(gameState, playerId);
  const room = player ? getRoom(player.roomId) : null;
  if (!player || !room || player.flags?.expelled) return [];
  const actionIds = getAllowedActionIds(gameState, player, room);
  return actionIds.map(getActionById).filter(Boolean);
}

export function runMissionEngineSmokeTest() {
  let state = createMissionGame({
    id: 'smoke_mission',
    seed: 'smoke-seed',
    maxRounds: 4,
    players: ['Ana', 'Beto', 'Clara', 'Davi'].map((name, index) => ({ id: `p${index + 1}`, name }))
  });
  state = assignRoles(state);
  state = startRound(state);
  state = chooseRoom(state, 'p1', 'engineering');
  state = chooseRoom(state, 'p2', 'reactor');
  state = chooseRoom(state, 'p3', 'medbay');
  state = chooseRoom(state, 'p4', 'communications');
  state = revealRoomOccupancy(state);
  state.players.forEach(player => {
    const privateState = getPrivateState(state, player.id);
    const action = privateState.availableActions[0];
    if (action) state = chooseAction(state, player.id, action.id);
  });
  state = resolveActions(state);
  state = generateLogs(state);
  state = startDiscussion(state);
  state = startVoting(state);
  state = submitVote(state, 'p1', 'p2');
  state = submitVote(state, 'p2', 'p1');
  state = submitVote(state, 'p3', 'p1');
  state = submitVote(state, 'p4', 'p1');
  state = resolveVoting(state);
  const publicState = getPublicState(state);
  const serialized = JSON.stringify(publicState);
  const leaked = serialized.includes('Android Hackeado') || serialized.includes('"roleId":"android"');
  return {
    ok: !leaked && Boolean(publicState.phase),
    phase: publicState.phase,
    winner: publicState.winner,
    publicState
  };
}
