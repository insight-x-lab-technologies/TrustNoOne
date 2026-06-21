import { getMissionSetting } from './mission-content.js';
import { createRoomsState } from './mission-rooms.js';

export const MISSION_PHASES = {
  setup: 'setup',
  roleReveal: 'roleReveal',
  roomSelection: 'roomSelection',
  roomReveal: 'roomReveal',
  actionSelection: 'actionSelection',
  resolution: 'resolution',
  logs: 'logs',
  discussion: 'discussion',
  voting: 'voting',
  voteReveal: 'voteReveal',
  final: 'final'
};

export function createMissionPlayer(input = {}, index = 0) {
  return {
    id: String(input.id || `player_${index + 1}`),
    name: String(input.name || `Jogador ${index + 1}`),
    roleId: input.roleId || null,
    roomId: input.roomId || 'cafeteria',
    connected: input.connected !== false,
    active: input.active !== false,
    flags: { ...(input.flags || {}) }
  };
}

export function createMissionSettings(input = {}) {
  const setting = getMissionSetting(input.settingId || 'starship');
  const taskProgressScale = Number.parseFloat(input.taskProgressScale);
  const minCrewWinRound = Number.parseInt(input.minCrewWinRound, 10);
  const deferVoteIntegrityCost = Number.parseInt(input.deferVoteIntegrityCost, 10);
  return {
    settingId: setting.id,
    settingName: setting.name,
    singleDevice: input.singleDevice !== false,
    playerCount: Number.parseInt(input.playerCount, 10) || 4,
    discussionSeconds: Number.parseInt(input.discussionSeconds, 10) || 60,
    votingSeconds: Number.parseInt(input.votingSeconds, 10) || 45,
    presetId: input.presetId || 'custom',
    forceVoting: Boolean(input.forceVoting),
    taskProgressScale: Number.isFinite(taskProgressScale) && taskProgressScale > 0
      ? Math.min(1.5, Math.max(0.25, taskProgressScale))
      : null,
    minCrewWinRound: Number.isFinite(minCrewWinRound) && minCrewWinRound > 0 ? minCrewWinRound : 3,
    deferVoteIntegrityCost: Number.isFinite(deferVoteIntegrityCost) && deferVoteIntegrityCost > 0
      ? Math.min(25, deferVoteIntegrityCost)
      : 8
  };
}

export function createMissionObjectives(input = {}) {
  const objectives = input.objectives || input;
  const criticalSystems = Array.isArray(objectives.criticalSystems) && objectives.criticalSystems.length
    ? objectives.criticalSystems
    : ['engineering', 'reactor', 'medbay', 'communications'];

  return {
    criticalSystems: criticalSystems.map(item => ({
      roomId: String(item.roomId || item.id || item),
      required: Number.parseInt(item.required, 10) || 1,
      completed: Math.max(0, Number.parseInt(item.completed, 10) || 0)
    })),
    completed: Boolean(objectives.completed)
  };
}

export function createBaseMissionState(input = {}) {
  const setting = getMissionSetting(input.settingId || input.settings?.settingId || 'starship');
  const players = Array.isArray(input.players)
    ? input.players.map(createMissionPlayer)
    : [];

  return {
    id: String(input.id || 'mission_draft'),
    phase: input.phase || MISSION_PHASES.setup,
    round: Number.parseInt(input.round, 10) || 1,
    maxRounds: Number.parseInt(input.maxRounds, 10) || 6,
    players,
    rooms: input.rooms || createRoomsState(),
    publicEvents: Array.isArray(input.publicEvents) ? [...input.publicEvents] : [],
    privateEvents: input.privateEvents || {},
    fullRoomOccupancy: input.fullRoomOccupancy || {},
    logs: Array.isArray(input.logs) ? [...input.logs] : [],
    evidence: Array.isArray(input.evidence) ? [...input.evidence] : [],
    cpuStatements: Array.isArray(input.cpuStatements) ? [...input.cpuStatements] : [],
    forgedStatements: Array.isArray(input.forgedStatements) ? [...input.forgedStatements] : [],
    cpuQuestions: Array.isArray(input.cpuQuestions) ? [...input.cpuQuestions] : [],
    cpuAccusationReactions: Array.isArray(input.cpuAccusationReactions) ? [...input.cpuAccusationReactions] : [],
    cpuVoteExplanations: Array.isArray(input.cpuVoteExplanations) ? [...input.cpuVoteExplanations] : [],
    plantedFalseEvidence: Array.isArray(input.plantedFalseEvidence) ? [...input.plantedFalseEvidence] : [],
    securityWatches: Array.isArray(input.securityWatches) ? [...input.securityWatches] : [],
    emergencyTransmissions: Array.isArray(input.emergencyTransmissions) ? [...input.emergencyTransmissions] : [],
    suspicion: input.suspicion || { byPlayerId: {}, history: [] },
    playerHistory: input.playerHistory || { byPlayerId: {} },
    cpuMemory: input.cpuMemory || { byPlayerId: {} },
    roundBriefing: Array.isArray(input.roundBriefing) ? [...input.roundBriefing] : [],
    roundEvents: Array.isArray(input.roundEvents) ? [...input.roundEvents] : [],
    currentRoundEvent: input.currentRoundEvent || null,
    nextRoundEvent: input.nextRoundEvent || null,
    missionObjectives: createMissionObjectives(input.missionObjectives),
    androidActionUses: input.androidActionUses || {},
    playerStats: input.playerStats || {},
    shipIntegrity: Number.parseInt(input.shipIntegrity, 10) || setting.defaultShipIntegrity,
    missionProgress: Number.parseInt(input.missionProgress, 10) || setting.defaultMissionProgress,
    alertLevel: input.alertLevel || setting.defaultAlertLevel,
    votes: input.votes || {
      open: false,
      round: null,
      byPlayerId: {},
      result: null
    },
    settings: createMissionSettings(input.settings || { settingId: setting.id }),
    seed: String(input.seed || 'mission-seed')
  };
}

export function cloneMissionState(state) {
  return JSON.parse(JSON.stringify(state));
}
