export const MISSION_SETTINGS = [
  {
    id: 'starship',
    name: 'Nave Espacial',
    description: 'Uma tripulacao familiar tenta manter a nave funcionando enquanto um Android hackeado sabota a missao.'
  }
];

export function getDefaultMissionSetting() {
  return MISSION_SETTINGS[0];
}
