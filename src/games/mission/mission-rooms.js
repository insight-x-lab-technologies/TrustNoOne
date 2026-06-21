export const RISK_LEVELS = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical'
};

export const ROOM_STATUS = {
  normal: 'normal',
  sabotaged: 'sabotaged',
  locked: 'locked',
  critical: 'critical'
};

const DEFAULT_NORMAL_ACTIONS = ['perform_task', 'calibrate_system', 'inspect_room', 'check_logs', 'assist_player', 'observe_player'];
const DEFAULT_ANDROID_ACTIONS = ['fake_task', 'sabotage_room', 'lock_room', 'plant_false_evidence', 'forge_statement'];

export const MISSION_ROOMS = {
  bridge: {
    id: 'bridge',
    icon: '🧭',
    name: 'Ponte de Comando',
    shortDescription: 'Navegação e alertas.',
    description: 'Centro de navegação, alertas e decisões da nave.',
    riskLevel: RISK_LEVELS.high,
    normalTasks: DEFAULT_NORMAL_ACTIONS,
    specialActions: ['emergency_repair', 'recover_deleted_log', 'trace_access', 'audit_access', 'monitor_room', 'security_patrol'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'corrupt_logs'],
    logTypes: ['access', 'system', 'movement']
  },
  engineering: {
    id: 'engineering',
    icon: '🛠️',
    name: 'Engenharia',
    shortDescription: 'Motores e manutenção.',
    description: 'Área de manutenção dos motores, energia e suporte mecânico.',
    riskLevel: RISK_LEVELS.high,
    normalTasks: [...DEFAULT_NORMAL_ACTIONS, 'dual_repair'],
    specialActions: ['emergency_repair'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'vent_accident', 'divert_energy'],
    logTypes: ['repair', 'system', 'sabotage']
  },
  reactor: {
    id: 'reactor',
    icon: '⚛️',
    name: 'Reator',
    shortDescription: 'Energia central.',
    description: 'Núcleo energético da nave e ponto mais sensível da missão.',
    riskLevel: RISK_LEVELS.critical,
    normalTasks: [...DEFAULT_NORMAL_ACTIONS, 'dual_repair'],
    specialActions: ['emergency_repair', 'stabilize_reactor'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'overload_reactor', 'divert_energy'],
    logTypes: ['system', 'repair', 'sabotage']
  },
  medbay: {
    id: 'medbay',
    icon: '🩺',
    name: 'Laboratório Médico',
    shortDescription: 'Exames e amostras.',
    description: 'Sala de exames, amostras e monitoramento da tripulação.',
    riskLevel: RISK_LEVELS.medium,
    normalTasks: DEFAULT_NORMAL_ACTIONS,
    specialActions: ['scan_player', 'match_samples', 'treat_player'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'poison_supplies'],
    logTypes: ['medical', 'access', 'system']
  },
  communications: {
    id: 'communications',
    icon: '📡',
    name: 'Comunicações',
    shortDescription: 'Mensagens e sinais.',
    description: 'Canal de mensagens, pedidos de ajuda e sincronização externa.',
    riskLevel: RISK_LEVELS.high,
    normalTasks: DEFAULT_NORMAL_ACTIONS,
    specialActions: ['recover_deleted_log', 'trace_access', 'audit_access', 'monitor_room', 'security_patrol', 'emergency_transmission'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'corrupt_logs', 'divert_energy'],
    logTypes: ['communication', 'system', 'sabotage']
  },
  cafeteria: {
    id: 'cafeteria',
    icon: '🍽️',
    name: 'Refeitório',
    shortDescription: 'Área comum.',
    description: 'Área comum onde a tripulação se reúne e conversa.',
    riskLevel: RISK_LEVELS.low,
    normalTasks: DEFAULT_NORMAL_ACTIONS,
    specialActions: ['monitor_room', 'security_patrol'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'poison_supplies'],
    logTypes: ['movement', 'access', 'supply']
  },
  storage: {
    id: 'storage',
    icon: '📦',
    name: 'Depósito',
    shortDescription: 'Peças e suprimentos.',
    description: 'Local de ferramentas, peças e suprimentos da nave.',
    riskLevel: RISK_LEVELS.medium,
    normalTasks: DEFAULT_NORMAL_ACTIONS,
    specialActions: ['trace_access', 'audit_access', 'monitor_room', 'security_patrol'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'poison_supplies', 'vent_accident'],
    logTypes: ['access', 'movement', 'sabotage', 'supply']
  },
  quarters: {
    id: 'quarters',
    icon: '🛏️',
    name: 'Alojamentos',
    shortDescription: 'Descanso da tripulação.',
    description: 'Setor de descanso e pertences pessoais da tripulação.',
    riskLevel: RISK_LEVELS.low,
    normalTasks: DEFAULT_NORMAL_ACTIONS,
    specialActions: ['treat_player'],
    sabotageActions: [...DEFAULT_ANDROID_ACTIONS, 'vent_accident'],
    logTypes: ['movement', 'access', 'security']
  }
};

export function getRoom(roomId) {
  return MISSION_ROOMS[roomId] || null;
}

export function createRoomsState() {
  return Object.fromEntries(
    Object.values(MISSION_ROOMS).map(room => [
      room.id,
      {
        ...room,
        status: ROOM_STATUS.normal,
        sabotaged: false,
        locked: false,
        completedTasks: []
      }
    ])
  );
}
