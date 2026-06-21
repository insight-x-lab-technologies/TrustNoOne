export const CPU_PROFILES = {
  cautious: {
    id: 'cautious',
    name: 'Cauteloso',
    shortDescription: 'Evita acusações cedo e valoriza álibis confirmados.',
    statementTone: 'prefiro não cravar sem dois sinais',
    voteStyle: 'segura voto quando a pista é fraca'
  },
  logical: {
    id: 'logical',
    name: 'Lógico',
    shortDescription: 'Cruza sala, log e voto antes de suspeitar.',
    statementTone: 'estou comparando log com presença',
    voteStyle: 'segue o maior conjunto de evidências'
  },
  impulsive: {
    id: 'impulsive',
    name: 'Impulsivo',
    shortDescription: 'Pressiona rápido quem aparece perto de falhas.',
    statementTone: 'não vou enrolar quando alguém parece suspeito',
    voteStyle: 'acusa cedo quando há qualquer sinal'
  },
  chaotic: {
    id: 'chaotic',
    name: 'Caótico',
    shortDescription: 'Muda de foco com facilidade e cria ruído social.',
    statementTone: 'minha leitura mudou de novo nesta rodada',
    voteStyle: 'vota de forma menos previsível'
  },
  helpful: {
    id: 'helpful',
    name: 'Prestativo',
    shortDescription: 'Prioriza reparos, confirma presença e protege aliados.',
    statementTone: 'vou tentar organizar os fatos úteis',
    voteStyle: 'prefere apoiar quem tem álibi forte'
  }
};

export const CPU_PERSONALITY_IDS = Object.keys(CPU_PROFILES);

export function getCpuProfile(personality = 'logical') {
  return CPU_PROFILES[personality] || CPU_PROFILES.logical;
}
