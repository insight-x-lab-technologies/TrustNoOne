export const MISSION_LOG_TYPES = {
  occupancy: 'occupancy',
  access: 'access',
  sabotage: 'sabotage',
  medical: 'medical',
  security: 'security',
  corrupted: 'corrupted',
  recovered: 'recovered',
  false: 'false'
};

export const LOG_PRECISION = {
  vague: 'vague',
  partial: 'partial',
  strong: 'strong',
  corrupted: 'corrupted',
  false: 'false'
};

export function createLog(input = {}) {
  return {
    id: input.id || `log_${input.round || 0}_${input.index || 0}`,
    round: Number.parseInt(input.round, 10) || 1,
    roomId: input.roomId || '',
    playerId: input.playerId || null,
    targetId: input.targetId || null,
    type: input.type || MISSION_LOG_TYPES.access,
    precision: input.precision || LOG_PRECISION.vague,
    visibility: input.visibility || 'public',
    message: input.message || 'Registro inconclusivo da nave.',
    tags: Array.isArray(input.tags) ? [...input.tags] : []
  };
}

export function publicLog(input = {}) {
  return createLog({ ...input, visibility: 'public' });
}

export function privateLog(playerId, input = {}) {
  return createLog({ ...input, playerId, visibility: 'private' });
}
