import { getDefaultMissionSetting } from './mission-content.js';

export const TRUSTNOONE_LIMITS = {
  minPlayers: 4,
  maxPlayers: 8,
  minRounds: 4,
  maxRounds: 8
};

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function createMissionConfig(formData = {}) {
  const setting = getDefaultMissionSetting();
  return {
    matchName: String(formData.matchName || 'Missao da Familia').trim() || 'Missao da Familia',
    playerCount: clampNumber(formData.playerCount, TRUSTNOONE_LIMITS.minPlayers, TRUSTNOONE_LIMITS.maxPlayers, 4),
    rounds: clampNumber(formData.rounds, TRUSTNOONE_LIMITS.minRounds, TRUSTNOONE_LIMITS.maxRounds, 4),
    settingId: setting.id,
    settingName: setting.name,
    singleDevice: formData.singleDevice !== false
  };
}

export function createPublicMissionDraft(config) {
  return {
    phase: 'setup',
    matchName: config.matchName,
    playerCount: config.playerCount,
    rounds: config.rounds,
    settingName: config.settingName,
    singleDevice: config.singleDevice
  };
}
