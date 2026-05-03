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
  return {
    settingId: setting.id,
    settingName: setting.name,
    singleDevice: input.singleDevice !== false,
    playerCount: Number.parseInt(input.playerCount, 10) || 4,
    discussionSeconds: Number.parseInt(input.discussionSeconds, 10) || 60,
    votingSeconds: Number.parseInt(input.votingSeconds, 10) || 45
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
    logs: Array.isArray(input.logs) ? [...input.logs] : [],
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
