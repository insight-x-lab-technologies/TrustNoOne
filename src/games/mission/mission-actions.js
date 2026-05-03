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
    scan_player: {
      id: 'scan_player',
      name: 'Escanear jogador',
      type: 'special_action',
      roleIds: ['medic'],
      roomIds: ['medbay'],
      requiresTarget: true
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
    protect_player: {
      id: 'protect_player',
      name: 'Proteger jogador',
      type: 'special_action',
      roleIds: ['security'],
      requiresTarget: true
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
