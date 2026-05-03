import {
  chooseAction,
  chooseRoom,
  createMissionGame,
  getPrivateState,
  getPublicState,
  submitVote
} from './mission-engine.js';
import { MISSION_ROOMS } from './mission-rooms.js';

export const CPU_PERSONALITIES = ['cautious', 'logical', 'impulsive', 'chaotic', 'helpful'];
export const CPU_DIFFICULTIES = {
  easy: { mistakeRate: 0.34, sabotageRate: 0.42, taskBias: 0.65 },
  normal: { mistakeRate: 0.2, sabotageRate: 0.58, taskBias: 0.78 },
  hard: { mistakeRate: 0.1, sabotageRate: 0.74, taskBias: 0.9 }
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
  if (action.id === 'emergency_repair' || action.id === 'stabilize_reactor') score += state.shipIntegrity < 75 ? 22 : 8;
  if (action.id === 'recover_deleted_log' || action.id === 'trace_access') score += state.alertLevel !== 'green' ? 12 : 4;
  if (action.id === 'monitor_room' || action.id === 'protect_player') score += state.alertLevel === 'red' ? 10 : 3;
  if (config.personality === 'helpful' && action.type !== 'sabotage') score += 8;
  if (config.personality === 'chaotic') score += randomFor(state, player.id, `action-${action.id}`) * 20;
  return score;
}

function chooseCpuCrewAction(state, player, difficulty) {
  const privateState = getPrivateState(state, player.id);
  const actions = privateState?.availableActions || [];
  const mistaken = randomFor(state, player.id, 'crew-mistake') < cpuConfig(player, difficulty).weights.mistakeRate;
  if (mistaken) return pick(actions, state, player.id, 'mistake-action');
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
  if (shouldSabotage && sabotages.length && (!alone || config.personality === 'chaotic')) {
    const quietSabotage = alone ? sabotages.filter(action => ['fake_task', 'corrupt_logs', 'plant_false_evidence'].includes(action.id)) : sabotages;
    return pick(quietSabotage.length ? quietSabotage : sabotages, state, player.id, 'sabotage-action');
  }
  return pick(useful.length ? useful : actions, state, player.id, 'fake-useful-action');
}

function chooseTarget(state, player, action) {
  if (!action?.requiresTarget) return null;
  const targets = activePlayers(state).filter(target => target.id !== player.id);
  return pick(targets, state, player.id, `target-${action.id}`)?.id || null;
}

function chooseCpuVote(state, player, difficulty) {
  const config = cpuConfig(player, difficulty);
  const candidates = activePlayers(state).filter(candidate => candidate.id !== player.id);
  if (!candidates.length) return 'skip';
  if (config.personality === 'cautious' && randomFor(state, player.id, 'cautious-skip') < 0.34) return 'skip';
  if (player.roleId === 'android') {
    return pick(candidates.filter(candidate => candidate.roleId !== 'android'), state, player.id, 'android-vote')?.id || 'skip';
  }
  const rooms = suspiciousRooms(state);
  const suspects = candidates.filter(candidate => rooms.includes(candidate.roomId));
  const mistake = randomFor(state, player.id, 'vote-mistake') < config.weights.mistakeRate;
  if (!mistake && suspects.length && ['logical', 'impulsive', 'helpful'].includes(config.personality)) {
    return pick(suspects, state, player.id, 'suspect-vote')?.id || 'skip';
  }
  if (config.personality === 'chaotic' || mistake) return pick(candidates, state, player.id, 'random-vote')?.id || 'skip';
  return 'skip';
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
    return submitVote(state, player.id, chooseCpuVote(state, player, player.flags?.difficulty || difficulty));
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
