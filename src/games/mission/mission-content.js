import { MISSION_ACTIONS } from './mission-actions.js';
import { MISSION_LOG_TYPES } from './mission-logs.js';
import { MISSION_ROLES } from './mission-roles.js';
import { MISSION_ROOMS } from './mission-rooms.js';

export const MISSION_CONTENT_SCHEMA_VERSION = 1;

export const MISSION_SETTING_IDS = {
  starship: 'starship',
  secret_lab: 'secret_lab',
  nuclear_facility: 'nuclear_facility',
  submarine_station: 'submarine_station',
  haunted_mansion: 'haunted_mansion'
};

export const MISSION_CONTENT_PACK_SCHEMA = {
  schema: 'mimi-mission-content-pack',
  schemaVersion: MISSION_CONTENT_SCHEMA_VERSION,
  packId: '',
  name: '',
  version: '1.0.0',
  locale: 'pt-BR',
  author: '',
  description: '',
  settings: [],
  signature: null
};

const DEFAULT_VICTORY_TEXTS = {
  crew: {
    mission_complete: 'A tripulacao concluiu a missao antes que a sabotagem dominasse tudo.',
    android_expelled: 'O Android Hackeado foi expulso da missao.'
  },
  android: {
    ship_destroyed: 'A nave ficou sem integridade e a missao falhou.',
    android_survived: 'O Android sobreviveu ate o fim com a missao incompleta.',
    crew_too_low: 'A tripulacao ativa ficou baixa demais para continuar.'
  }
};

export const STARSHIP_SETTING = {
  id: MISSION_SETTING_IDS.starship,
  name: 'Nave Espacial',
  description: 'Uma nave a deriva tenta concluir sua missao enquanto um Android Hackeado sabota a tripulacao.',
  contentStatus: 'complete',
  visualTheme: {
    suggestedThemeId: 'cosmic',
    backgroundKey: 'trustnoone_cosmic',
    paletteHint: 'neon espacial com paineis escuros',
    icon: '🚀'
  },
  icons: {
    setting: '🚀',
    crew: '👨‍🚀',
    android: '🤖',
    alert: '🚨',
    mission: '🛰️',
    integrity: '🛡️'
  },
  defaults: {
    shipIntegrity: 100,
    missionProgress: 0,
    alertLevel: 'green',
    maxRounds: 6,
    discussionSeconds: 60,
    votingSeconds: 45
  },
  defaultShipIntegrity: 100,
  defaultMissionProgress: 0,
  defaultAlertLevel: 'green',
  rooms: MISSION_ROOMS,
  roles: MISSION_ROLES,
  availableRoleIds: ['crew', 'mechanic', 'it_specialist', 'medic', 'security', 'android'],
  tasks: MISSION_ACTIONS.normalTasks,
  specialActions: MISSION_ACTIONS.specialActions,
  sabotages: MISSION_ACTIONS.sabotageActions,
  logs: {
    types: MISSION_LOG_TYPES,
    possibleBySetting: [
      'occupancy',
      'access',
      'sabotage',
      'medical',
      'security',
      'corrupted',
      'recovered',
      'false'
    ],
    examples: [
      'Um acesso tecnico foi detectado na Engenharia.',
      'O painel do Reator registrou duas interacoes.',
      'Sensores indicam atividade suspeita no Refeitorio.',
      'Cameras estavam offline durante parte da rodada.'
    ]
  },
  specialEvents: [
    {
      id: 'reactor_crisis',
      icon: '⚛️',
      name: 'Crise no Reator',
      trigger: 'overload_reactor ou integridade baixa',
      publicText: 'O Reator entrou em estado instavel.',
      effects: { alertLevel: 'red', preferredRooms: ['reactor', 'engineering'] }
    },
    {
      id: 'communications_blackout',
      icon: '📡',
      name: 'Falha nas Comunicacoes',
      trigger: 'corrupt_logs em Comunicacoes ou Ponte',
      publicText: 'Parte dos registros da rodada foi perdida.',
      effects: { alertLevel: 'yellow', logPrecision: 'corrupted' }
    },
    {
      id: 'life_support_warning',
      icon: '🩺',
      name: 'Alerta de Suporte de Vida',
      trigger: 'poison_supplies ou jogador incapacitado',
      publicText: 'Sensores medicos indicaram risco para a tripulacao.',
      effects: { alertLevel: 'red', preferredRooms: ['medbay', 'cafeteria'] }
    }
  ],
  outcomeTexts: DEFAULT_VICTORY_TEXTS,
  packCompatibility: {
    canBeExtendedByPacks: true,
    extensionPoints: ['rooms', 'roles', 'tasks', 'sabotages', 'logs', 'specialEvents', 'outcomeTexts'],
    requiresSignature: false,
    mergeStrategy: 'append-by-id'
  }
};

function createPlannedSetting({
  id,
  name,
  description,
  icon,
  suggestedThemeId,
  paletteHint
}) {
  return {
    id,
    name,
    description,
    contentStatus: 'planned',
    visualTheme: {
      suggestedThemeId,
      backgroundKey: id,
      paletteHint,
      icon
    },
    icons: {
      setting: icon,
      crew: '🧑',
      android: '🎭',
      alert: '⚠️',
      mission: '🎯',
      integrity: '🛡️'
    },
    defaults: {
      shipIntegrity: 100,
      missionProgress: 0,
      alertLevel: 'green',
      maxRounds: 6,
      discussionSeconds: 60,
      votingSeconds: 45
    },
    defaultShipIntegrity: 100,
    defaultMissionProgress: 0,
    defaultAlertLevel: 'green',
    rooms: {},
    roles: {},
    availableRoleIds: [],
    tasks: {},
    specialActions: {},
    sabotages: {},
    logs: { types: MISSION_LOG_TYPES, possibleBySetting: [], examples: [] },
    specialEvents: [],
    outcomeTexts: DEFAULT_VICTORY_TEXTS,
    packCompatibility: {
      canBeExtendedByPacks: true,
      extensionPoints: ['rooms', 'roles', 'tasks', 'sabotages', 'logs', 'specialEvents', 'outcomeTexts'],
      requiresSignature: false,
      mergeStrategy: 'append-by-id'
    }
  };
}

export const MISSION_SETTINGS = {
  [MISSION_SETTING_IDS.starship]: STARSHIP_SETTING,
  [MISSION_SETTING_IDS.secret_lab]: createPlannedSetting({
    id: MISSION_SETTING_IDS.secret_lab,
    name: 'Laboratorio Secreto',
    description: 'Uma instalacao clandestina sofre infiltracao durante um experimento instavel.',
    icon: '🧪',
    suggestedThemeId: 'dark-mode',
    paletteHint: 'verde toxico, vidro e luz fria'
  }),
  [MISSION_SETTING_IDS.nuclear_facility]: createPlannedSetting({
    id: MISSION_SETTING_IDS.nuclear_facility,
    name: 'Instalacao Nuclear',
    description: 'Uma base de energia critica tenta evitar colapso e contaminacao.',
    icon: '☢️',
    suggestedThemeId: 'high-contrast',
    paletteHint: 'amarelo alerta, concreto e metal'
  }),
  [MISSION_SETTING_IDS.submarine_station]: createPlannedSetting({
    id: MISSION_SETTING_IDS.submarine_station,
    name: 'Estacao Submarina',
    description: 'Uma estacao no fundo do oceano perde sistemas vitais sob pressao extrema.',
    icon: '🌊',
    suggestedThemeId: 'liquid-glass',
    paletteHint: 'azul profundo, vidro e luz de emergencia'
  }),
  [MISSION_SETTING_IDS.haunted_mansion]: createPlannedSetting({
    id: MISSION_SETTING_IDS.haunted_mansion,
    name: 'Mansao Assombrada',
    description: 'Uma mansao antiga esconde um sabotador entre corredores, retratos e passagens secretas.',
    icon: '🏚️',
    suggestedThemeId: 'dark-mode',
    paletteHint: 'velas, sombras e roxo desbotado'
  })
};

export const MISSION_CONTENT = {
  schema: 'mimi-mission-content',
  schemaVersion: MISSION_CONTENT_SCHEMA_VERSION,
  packSchema: MISSION_CONTENT_PACK_SCHEMA,
  settings: MISSION_SETTINGS,
  roles: MISSION_ROLES,
  rooms: MISSION_ROOMS,
  actions: MISSION_ACTIONS,
  logTypes: MISSION_LOG_TYPES
};

export function getMissionSetting(settingId = MISSION_SETTING_IDS.starship) {
  return MISSION_SETTINGS[settingId] || MISSION_SETTINGS[MISSION_SETTING_IDS.starship];
}

export function getAvailableMissionSettings() {
  return Object.values(MISSION_SETTINGS).map(setting => ({
    id: setting.id,
    name: setting.name,
    description: setting.description,
    contentStatus: setting.contentStatus,
    visualTheme: setting.visualTheme,
    icon: setting.icons?.setting || setting.visualTheme?.icon || '🎲'
  }));
}
