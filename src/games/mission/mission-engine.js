import { getActionById } from './mission-actions.js';
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
  return {
    id: player.id,
    name: player.name,
    roomId: player.roomId,
    connected: player.connected,
    active: player.active,
    expelled: Boolean(player.flags?.expelled)
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

function getTaskProgress(state, action) {
  const base = 8 + (hashSeed(`${state.seed}:${state.round}:${action.playerId}:${action.actionId}:${action.roomId}`) % 5);
  const player = getPlayer(state, action.playerId);
  const mechanicBonus = player?.roleId === 'mechanic' && MECHANIC_BONUS_ROOMS.includes(action.roomId) ? 4 : 0;
  return base + mechanicBonus;
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
      votingSeconds: config.votingSeconds
    },
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
  state.phase = MISSION_PHASES.roomSelection;
  state.roomSelections = {};
  state.roomOccupancy = {};
  state.roundActions = [];
  state.androidActionUses = state.androidActionUses || {};
  state.votes = { open: false, round: null, byPlayerId: {}, result: null };
  state.publicEvents = [
    ...state.publicEvents,
    createEvent('round_started', `Rodada ${state.round} iniciada.`)
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
  return state;
}

export function revealRoomOccupancy(gameState) {
  const state = cloneMissionState(gameState);
  const occupancy = {};
  state.players.filter(player => !player.flags?.expelled).forEach(player => {
    const roomId = player.roomId || state.roomSelections?.[player.id] || 'cafeteria';
    occupancy[roomId] = [...(occupancy[roomId] || []), player.id];
  });
  state.roomOccupancy = occupancy;
  state.phase = MISSION_PHASES.roomReveal;
  state.publicEvents = [
    ...state.publicEvents,
    createEvent('room_occupancy_revealed', 'A tripulação se posicionou pela nave.')
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
  if (action.requiresTarget && !targetId) return state;
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

  getRoundActions(state).forEach(action => {
    const player = getPlayer(state, action.playerId);
    const room = state.rooms[action.roomId];
    if (!player || !room || player.flags?.expelled) return;

    if (action.type === 'normal_task') {
      const progress = getTaskProgress(state, action);
      missionProgress += progress;
      getPlayerStats(state, player.id).tasks += 1;
      room.completedTasks = [...(room.completedTasks || []), action.actionId];
      appendPrivateEvent(state, player.id, createEvent('task_done', `Sua tarefa adicionou ${progress}% à missão.`));
      publicEvents.push(createEvent('task_progress', `Atividade útil registrada em ${room.name}.`, { roomId: room.id }));
    }

    if (action.type === 'special_action') {
      missionProgress += SPECIAL_TASK_PROGRESS;
      const isRepair = ['stabilize_reactor', 'emergency_repair'].includes(action.actionId);
      shipIntegrity += isRepair ? 10 : 2;
      if (isRepair) {
        getPlayerStats(state, player.id).repairs += 1;
        repairRoom(room);
      }
      if (action.actionId === 'recover_deleted_log') getPlayerStats(state, player.id).logsRecovered += 1;
      if (action.actionId === 'protect_player' && action.targetId) {
        const target = getPlayer(state, action.targetId);
        if (target) target.flags = { ...(target.flags || {}), protectedRound: state.round };
        getPlayerStats(state, player.id).protections += 1;
      }
      appendPrivateEvent(state, player.id, createEvent('special_done', 'Sua ação especial foi registrada.'));
      publicEvents.push(createEvent('special_action', `Procedimento especializado ocorreu em ${room.name}.`, { roomId: room.id }));
    }

    if (action.type === 'sabotage' && isAndroid(player)) {
      const actionInfo = getActionById(action.actionId);
      const protectedTarget = action.targetId ? getPlayer(state, action.targetId)?.flags?.protectedRound === state.round : false;
      const damage = protectedTarget ? Math.floor((actionInfo?.damage || SABOTAGE_DAMAGE) / 2) : actionInfo?.damage ?? SABOTAGE_DAMAGE;
      shipIntegrity -= damage;
      crisisCount += 1;
      getPlayerStats(state, player.id).sabotages += 1;
      if (['poison_supplies', 'vent_accident'].includes(action.actionId) && action.targetId) {
        const target = getPlayer(state, action.targetId);
        if (target && !protectedTarget) target.flags = { ...(target.flags || {}), incapacitatedRound: state.round };
      }
      room.sabotaged = true;
      room.status = action.actionId === 'lock_room'
        ? 'locked'
        : action.actionId === 'overload_reactor'
          ? 'critical'
          : 'sabotaged';
      room.locked = action.actionId === 'lock_room';
      state.androidActionUses[action.actionId] = {
        count: getAndroidActionUse(state, action.actionId).count + 1,
        lastRound: state.round
      };
      appendPrivateEvent(state, player.id, createEvent('sabotage_done', `Ação secreta aplicada em ${room.name}.`));
      publicEvents.push(createEvent('system_warning', `Uma falha suspeita surgiu em ${room.name}.`, { roomId: room.id }));
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
  const actionLogs = getRoundActions(state).flatMap((action, index) => {
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

    if (action.actionId === 'recover_deleted_log') {
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.recovered,
        precision: LOG_PRECISION.strong,
        message: `Log recuperado: alguém com função técnica acessou ${room?.name || 'um setor'}.`
      }), privateEntry];
    }
    if (action.actionId === 'monitor_room') {
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.security,
        precision: LOG_PRECISION.strong,
        message: `Câmeras registraram movimentação incompleta em ${room?.name || 'um setor'}.`
      }), privateEntry];
    }
    if (['scan_player', 'treat_player'].includes(action.actionId)) {
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.medical,
        precision: LOG_PRECISION.partial,
        message: `Sensores médicos indicaram atividade incomum em ${room?.name || 'um setor'}.`
      }), privateEntry];
    }
    if (action.actionId === 'corrupt_logs') {
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.corrupted,
        precision: LOG_PRECISION.corrupted,
        message: 'Um log foi apagado antes da resolução da rodada.'
      }), privateEntry];
    }
    if (action.actionId === 'plant_false_evidence') {
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.false,
        precision: LOG_PRECISION.false,
        targetId: action.targetId,
        message: `Uma evidência ambígua apareceu em ${room?.name || 'um setor'}.`
      }), privateEntry];
    }
    if (action.type === 'sabotage') {
      return [publicLog({
        ...base,
        type: MISSION_LOG_TYPES.sabotage,
        precision: LOG_PRECISION.partial,
        message: `Sensores indicam atividade suspeita em ${room?.name || 'um setor'}.`
      }), privateEntry];
    }
    return [publicLog({
      ...base,
      type: MISSION_LOG_TYPES.access,
      precision: action.actionId === 'check_logs' ? LOG_PRECISION.partial : LOG_PRECISION.vague,
      message: action.actionId === 'check_logs'
        ? `Um acesso técnico foi detectado em ${room?.name || 'um setor'}.`
        : `Atividade operacional registrada em ${room?.name || 'um setor'}.`
    }), privateEntry];
  });
  state.logs = [...state.logs, ...occupancyLogs, ...actionLogs];
  state.phase = MISSION_PHASES.logs;
  return state;
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
  if (gameState.missionProgress >= 100) {
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
      tags: [...(log.tags || []), 'internally_false']
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
