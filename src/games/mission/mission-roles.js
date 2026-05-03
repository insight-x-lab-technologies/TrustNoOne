export const MISSION_ROLES = {
  crew: {
    id: 'crew',
    name: 'Tripulante',
    team: 'crew',
    secret: false,
    description: 'Ajuda a concluir tarefas e identificar o Android Hackeado.'
  },
  mechanic: {
    id: 'mechanic',
    name: 'Mecânico',
    team: 'crew',
    secret: false,
    description: 'Tem facilidade para reparar sistemas físicos da nave.'
  },
  it_specialist: {
    id: 'it_specialist',
    name: 'Técnico de TI',
    team: 'crew',
    secret: false,
    description: 'Investiga falhas digitais e protege sistemas contra sabotagem.'
  },
  medic: {
    id: 'medic',
    name: 'Médico',
    team: 'crew',
    secret: false,
    description: 'Analisa sinais vitais e ajuda a tripulação a se manter ativa.'
  },
  security: {
    id: 'security',
    name: 'Segurança',
    team: 'crew',
    secret: false,
    description: 'Observa movimentações suspeitas e protege áreas críticas.'
  },
  android: {
    id: 'android',
    name: 'Android Hackeado',
    team: 'android',
    secret: true,
    description: 'Sabota a missão sem revelar sua identidade.'
  }
};

export const DEFAULT_ROLE_DISTRIBUTION = {
  4: ['android', 'mechanic', 'it_specialist', 'crew'],
  5: ['android', 'mechanic', 'it_specialist', 'medic', 'crew'],
  6: ['android', 'mechanic', 'it_specialist', 'medic', 'security', 'crew'],
  7: ['android', 'mechanic', 'it_specialist', 'medic', 'security', 'crew', 'crew'],
  8: ['android', 'mechanic', 'it_specialist', 'medic', 'security', 'crew', 'crew', 'crew']
};

export function getRole(roleId) {
  return MISSION_ROLES[roleId] || null;
}

export function getRoleDistribution(playerCount = 4) {
  return [...(DEFAULT_ROLE_DISTRIBUTION[playerCount] || DEFAULT_ROLE_DISTRIBUTION[4])];
}
