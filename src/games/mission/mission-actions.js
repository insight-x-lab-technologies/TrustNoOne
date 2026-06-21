export const MISSION_ACTIONS = {
  normalTasks: {
    perform_task: {
      id: 'perform_task',
      name: 'Fazer tarefa da sala',
      type: 'normal_task',
      logHint: 'tarefa concluída'
    },
    inspect_room: {
      id: 'inspect_room',
      name: 'Inspecionar sala',
      type: 'normal_task',
      logHint: 'inspeção local'
    },
    check_logs: {
      id: 'check_logs',
      name: 'Verificar logs',
      type: 'normal_task',
      logHint: 'consulta de registros'
    },
    calibrate_system: {
      id: 'calibrate_system',
      name: 'Calibrar sistema',
      type: 'normal_task',
      logHint: 'minigame rápido: sucesso acelera a missão, falha gera ruído'
    },
    dual_repair: {
      id: 'dual_repair',
      name: 'Reparo em dupla',
      type: 'normal_task',
      logHint: 'exige 2 pessoas na sala e cria álibi forte'
    },
    assist_player: {
      id: 'assist_player',
      name: 'Ajudar jogador',
      type: 'normal_task',
      requiresTarget: true,
      logHint: 'apoio a tripulante'
    },
    observe_player: {
      id: 'observe_player',
      name: 'Observar jogador',
      type: 'normal_task',
      requiresTarget: true,
      logHint: 'observação discreta'
    }
  },
  specialActions: {
    emergency_repair: {
      id: 'emergency_repair',
      name: 'Reparo emergencial',
      type: 'special_action',
      roleIds: ['mechanic'],
      roomIds: ['engineering', 'reactor', 'bridge']
    },
    stabilize_reactor: {
      id: 'stabilize_reactor',
      name: 'Estabilizar reator',
      type: 'special_action',
      roleIds: ['mechanic'],
      roomIds: ['reactor']
    },
    recover_deleted_log: {
      id: 'recover_deleted_log',
      name: 'Recuperar log apagado',
      type: 'special_action',
      roleIds: ['it_specialist'],
      roomIds: ['communications', 'bridge']
    },
    trace_access: {
      id: 'trace_access',
      name: 'Rastrear acesso',
      type: 'special_action',
      roleIds: ['it_specialist'],
      roomIds: ['communications', 'storage', 'bridge']
    },
    audit_access: {
      id: 'audit_access',
      name: 'Auditar acesso',
      type: 'special_action',
      roleIds: ['it_specialist'],
      roomIds: ['communications', 'storage', 'bridge'],
      logHint: 'lista curta de possíveis autores de sabotagem'
    },
    scan_player: {
      id: 'scan_player',
      name: 'Escanear jogador',
      type: 'special_action',
      roleIds: ['medic'],
      roomIds: ['medbay'],
      requiresTarget: true
    },
    match_samples: {
      id: 'match_samples',
      name: 'Parear amostras',
      type: 'special_action',
      roleIds: ['medic'],
      roomIds: ['medbay'],
      requiresTarget: true,
      logHint: 'confirma alteração real ou condição fingida'
    },
    treat_player: {
      id: 'treat_player',
      name: 'Tratar jogador',
      type: 'special_action',
      roleIds: ['medic'],
      roomIds: ['medbay', 'quarters'],
      requiresTarget: true
    },
    monitor_room: {
      id: 'monitor_room',
      name: 'Monitorar sala',
      type: 'special_action',
      roleIds: ['security'],
      roomIds: ['bridge', 'cafeteria', 'storage', 'communications']
    },
    security_patrol: {
      id: 'security_patrol',
      name: 'Ronda de segurança',
      type: 'special_action',
      roleIds: ['security'],
      roomIds: ['bridge', 'cafeteria', 'storage', 'communications'],
      requiresRoomTarget: true,
      logHint: 'observa uma sala na próxima rodada'
    },
    protect_player: {
      id: 'protect_player',
      name: 'Proteger jogador',
      type: 'special_action',
      roleIds: ['security'],
      requiresTarget: true
    },
    emergency_transmission: {
      id: 'emergency_transmission',
      name: 'Transmissão de emergência',
      type: 'special_action',
      roomIds: ['communications'],
      logHint: 'prepara escudo contra o próximo dano do Android'
    }
  },
  sabotageActions: {
    fake_task: {
      id: 'fake_task',
      name: 'Fingir tarefa',
      type: 'sabotage',
      cooldown: 0,
      limit: 99,
      damage: 0,
      trace: 'registro de tarefa inconsistente'
    },
    sabotage_room: {
      id: 'sabotage_room',
      name: 'Sabotar sala',
      type: 'sabotage',
      cooldown: 1,
      limit: 4,
      damage: 15,
      trace: 'falha local repentina'
    },
    corrupt_logs: {
      id: 'corrupt_logs',
      name: 'Corromper logs',
      type: 'sabotage',
      cooldown: 1,
      limit: 3,
      damage: 8,
      roomIds: ['communications', 'bridge'],
      trace: 'lacuna nos registros'
    },
    divert_energy: {
      id: 'divert_energy',
      name: 'Desviar energia',
      type: 'sabotage',
      cooldown: 1,
      limit: 3,
      damage: 6,
      roomIds: ['reactor', 'engineering', 'communications'],
      requiresRoomTarget: true,
      trace: 'pico de energia em setor isca'
    },
    forge_statement: {
      id: 'forge_statement',
      name: 'Forjar depoimento',
      type: 'sabotage',
      cooldown: 2,
      limit: 2,
      damage: 4,
      requiresTarget: true,
      targetCpuOnly: true,
      trace: 'relato inconsistente induzido'
    },
    lock_room: {
      id: 'lock_room',
      name: 'Bloquear sala',
      type: 'sabotage',
      cooldown: 1,
      limit: 3,
      damage: 8,
      trace: 'porta travada remotamente'
    },
    poison_supplies: {
      id: 'poison_supplies',
      name: 'Contaminar suprimentos',
      type: 'sabotage',
      cooldown: 2,
      limit: 2,
      damage: 15,
      roomIds: ['cafeteria', 'storage', 'medbay'],
      trace: 'suprimentos alterados'
    },
    overload_reactor: {
      id: 'overload_reactor',
      name: 'Sobrecarregar reator',
      type: 'sabotage',
      cooldown: 2,
      limit: 2,
      damage: 25,
      roomIds: ['reactor'],
      trace: 'pico de energia'
    },
    vent_accident: {
      id: 'vent_accident',
      name: 'Acidente no duto',
      type: 'sabotage',
      cooldown: 2,
      limit: 2,
      damage: 15,
      roomIds: ['engineering', 'quarters', 'storage'],
      requiresTarget: true,
      trace: 'pressão instável no duto'
    },
    plant_false_evidence: {
      id: 'plant_false_evidence',
      name: 'Plantar pista falsa',
      type: 'sabotage',
      cooldown: 2,
      limit: 2,
      damage: 0,
      requiresTarget: true,
      trace: 'evidência ambígua encontrada'
    }
  }
};

export function getActionById(actionId) {
  return Object.values(MISSION_ACTIONS)
    .flatMap(group => Object.values(group))
    .find(action => action.id === actionId) || null;
}
