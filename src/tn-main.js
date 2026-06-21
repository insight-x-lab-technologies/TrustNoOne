import {
  applyCpuActionSelections,
  applyCpuRoomSelections,
  applyCpuVotes,
  createCpuPlayers
} from './games/mission/mission-cpu.js';
import { CPU_PROFILES, getCpuProfile } from './games/mission/mission-cpu-profiles.js';
import { runMissionValidationSuite } from './games/mission/mission-validation.js';
import {
  createMissionHostSession,
  createMissionPlayerSession,
  extractMissionJoinCode,
  getMissionJoinCodeFromUrl,
  renderMissionQrCode
} from './games/mission/mission-multidevice.js';
import {
  accuseCpu,
  askCpuQuestion,
  assignRoles,
  chooseAction,
  chooseRoom,
  createMissionGame,
  deferVoting,
  generateLogs,
  getPrivateState,
  getPublicState,
  revealRoomOccupancy,
  resolveActions,
  resolveVoting,
  startDiscussion,
  startRound,
  startVoting,
  submitVote
} from './games/mission/mission-engine.js';
import { MISSION_ROOMS } from './games/mission/mission-rooms.js';
import { MISSION_ROLES } from './games/mission/mission-roles.js';
import { getActionById } from './games/mission/mission-actions.js';

const DEFAULT_PLAYER_NAMES = ['Ana', 'Beto', 'Clara', 'Davi', 'Elisa', 'Fê', 'Gabi', 'Hugo'];
const MISSION_SETTINGS_KEY = 'trustnoone_settings_v1';
const MISSION_LAST_CONFIG_KEY = 'trustnoone_last_config_v1';
const DEFAULT_MISSION_SETTINGS = {
  playerCount: 4,
  cpuCount: 3,
  rounds: 6,
  discussionSeconds: 60,
  votingSeconds: 45,
  cpuDifficulty: 'normal'
};
const MISSION_PRESETS = {
  investigativeSolo: {
    id: 'investigativeSolo',
    label: 'Solo Investigativo',
    playerCount: 4,
    cpuCount: 3,
    rounds: 5,
    discussionSeconds: 30,
    votingSeconds: 45,
    cpuDifficulty: 'normal',
    forceVoting: true,
    singleDevice: true
  }
};
const GAME_SESSION_KEY = 'trustnoone_session_v1';
const LAST_RESULT_KEY = 'trustnoone_last_result_v1';

let gameState = null;
let roleIndex = 0;
let roomIndex = 0;
let actionIndex = 0;
let voteIndex = 0;
let privateMode = 'cover';
let pendingActionId = '';
let discussionTimer = null;
let discussionLeft = 60;
let missionMode = 'single';
let hostSession = null;
let deviceSession = null;
let joinedPlayers = [];
let devicePublicState = null;
let devicePrivateState = null;
let pendingDeviceActionId = '';
let activeMissionPresetId = '';

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function showScreen(screenName) {
  const nextScreen = $(`screen-${screenName}`);
  if (!nextScreen) return;
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  nextScreen.classList.add('active');
  document.body.dataset.activeScreen = screenName;
  window.scrollTo(0, 0);
}

function readJsonStorage(key, fallback) {
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(key) || 'null') || {}) };
  } catch (error) {
    return { ...fallback };
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getMissionSettings() {
  return readJsonStorage(MISSION_SETTINGS_KEY, DEFAULT_MISSION_SETTINGS);
}

function setInputValue(id, value) {
  const input = $(id);
  if (input) input.value = String(value);
}

function setMissionSetupValues(config = {}) {
  setInputValue('trustnoone-player-count', config.playerCount ?? DEFAULT_MISSION_SETTINGS.playerCount);
  setInputValue('trustnoone-cpu-count', config.cpuCount ?? DEFAULT_MISSION_SETTINGS.cpuCount);
  setInputValue('trustnoone-rounds', config.rounds ?? DEFAULT_MISSION_SETTINGS.rounds);
  setInputValue('trustnoone-cpu-difficulty', config.cpuDifficulty || DEFAULT_MISSION_SETTINGS.cpuDifficulty);
  if (typeof config.singleDevice === 'boolean') {
    const singleDevice = $('trustnoone-single-device');
    if (singleDevice) singleDevice.checked = config.singleDevice;
  }
}

function applySettingsToSetup() {
  const settings = getMissionSettings();
  activeMissionPresetId = settings.presetId && settings.presetId !== 'custom' ? settings.presetId : '';
  setMissionSetupValues(settings);
  updateRangeLabels();
  renderSetupPlayers();
  updateSetupSummary();
}

function activePlayers() {
  return (gameState?.players || []).filter(player => !player.flags?.expelled);
}

function activeHumanPlayers() {
  return activePlayers().filter(player => !player.flags?.isCpu);
}

function isSoloAssistMode(state = gameState) {
  const players = state?.players || [];
  const active = players.filter(player => !player.flags?.expelled);
  return active.filter(player => !player.flags?.isCpu).length === 1 && active.some(player => player.flags?.isCpu);
}

function currentPlayer(index) {
  return activeHumanPlayers()[index] || null;
}

function renderSetupPlayers() {
  const totalCount = Number.parseInt($('trustnoone-player-count')?.value, 10) || 4;
  const count = Math.max(1, totalCount - getCpuCount());
  const cpuCount = getCpuCount();
  const list = $('trustnoone-player-list');
  if (!list) return;
  const humanRows = Array.from({ length: count }, (_, index) => `
    <label class="mission-player-row">
      <span class="mission-player-index">${index + 1}</span>
      <input class="inp" data-mission-player-name="${index}" value="${escapeHtml(DEFAULT_PLAYER_NAMES[index] || `Jogador ${index + 1}`)}" autocomplete="off" enterkeyhint="${index + 1 < count ? 'next' : 'done'}" inputmode="text">
    </label>
  `).join('');
  const cpuRows = cpuCount ? `
    <div class="tn-cpu-profile-preview" aria-label="Perfis dos CPUs da partida">
      <span class="tn-hud-label">CPUs previstos</span>
      <div class="tn-cpu-profile-list">
        ${createCpuPlayers(cpuCount, count, getCpuDifficulty()).map(cpu => {
    const profile = getCpuProfile(cpu.flags?.personality);
    return `
          <div class="tn-cpu-profile-card">
            <strong>${escapeHtml(cpu.name)} · ${escapeHtml(profile.name)}</strong>
            <small>${escapeHtml(profile.shortDescription)}</small>
          </div>
        `;
  }).join('')}
      </div>
    </div>
  ` : '';
  list.innerHTML = `${humanRows}${cpuRows}`;
}

function updateRangeLabels() {
  const playerCount = $('trustnoone-player-count');
  const playerCountValue = $('trustnoone-player-count-value');
  const cpuCount = $('trustnoone-cpu-count');
  const cpuCountValue = $('trustnoone-cpu-count-value');
  const rounds = $('trustnoone-rounds');
  const roundsValue = $('trustnoone-rounds-value');
  if (playerCount && cpuCount) {
    cpuCount.max = String(Math.max(0, (Number.parseInt(playerCount.value, 10) || 4) - 1));
    if ((Number.parseInt(cpuCount.value, 10) || 0) > (Number.parseInt(cpuCount.max, 10) || 0)) cpuCount.value = cpuCount.max;
  }
  if (playerCount && playerCountValue) playerCountValue.textContent = playerCount.value;
  if (cpuCount && cpuCountValue) cpuCountValue.textContent = cpuCount.value;
  if (rounds && roundsValue) roundsValue.textContent = rounds.value;
  updateMissionSettingsLabels();
  updateSetupSummary();
}

function updateMissionSettingsLabels() {
  [
    ['mission-setting-default-players', 'mission-setting-default-players-value', ''],
    ['mission-setting-default-cpus', 'mission-setting-default-cpus-value', ''],
    ['mission-setting-rounds', 'mission-setting-rounds-value', ''],
    ['mission-setting-discussion', 'mission-setting-discussion-value', 's'],
    ['mission-setting-voting', 'mission-setting-voting-value', 's']
  ].forEach(([inputId, valueId, suffix]) => {
    const input = $(inputId);
    const value = $(valueId);
    if (input && value) value.textContent = `${input.value}${suffix}`;
  });
  const players = $('mission-setting-default-players');
  const cpus = $('mission-setting-default-cpus');
  if (players && cpus) {
    cpus.max = String(Math.max(0, (Number.parseInt(players.value, 10) || 4) - 1));
    if ((Number.parseInt(cpus.value, 10) || 0) > (Number.parseInt(cpus.max, 10) || 0)) cpus.value = cpus.max;
    const cpuValue = $('mission-setting-default-cpus-value');
    if (cpuValue) cpuValue.textContent = cpus.value;
  }
}

function getCpuCount() {
  return Number.parseInt($('trustnoone-cpu-count')?.value, 10) || 0;
}

function getCpuDifficulty() {
  return $('trustnoone-cpu-difficulty')?.value || 'normal';
}

function getActiveMissionPreset() {
  return MISSION_PRESETS[activeMissionPresetId] || null;
}

function updateSetupSummary() {
  const summary = $('trustnoone-setup-summary');
  if (!summary) return;
  const preset = getActiveMissionPreset();
  summary.textContent = preset
    ? `${preset.label}: 1 humano + 3 CPUs, ${preset.rounds} rodadas, discussão curta e votação sempre disponível.`
    : 'Configure os jogadores e passe o celular apenas quando a tela pedir.';
}

function clearActiveMissionPreset() {
  activeMissionPresetId = '';
  updateSetupSummary();
}

function applyMissionPreset(presetId) {
  const preset = MISSION_PRESETS[presetId];
  if (!preset) return;
  activeMissionPresetId = preset.id;
  clearSetupError();
  setMissionSetupValues(preset);
  updateRangeLabels();
  updateSetupMode();
  renderSetupPlayers();
}

function updateSetupMode() {
  const singleDevice = $('trustnoone-single-device')?.checked !== false;
  $('trustnoone-player-list')?.parentElement?.classList.toggle('hidden', !singleDevice);
  $('mission-session-card')?.classList.toggle('hidden', singleDevice);
  if (singleDevice) {
    missionMode = 'single';
  } else if (missionMode === 'single') {
    missionMode = 'host';
  }
}

function readPlayers() {
  const humans = Array.from(document.querySelectorAll('[data-mission-player-name]')).map((input, index) => ({
    id: `player_${index + 1}`,
    name: input.value.trim() || DEFAULT_PLAYER_NAMES[index] || `Jogador ${index + 1}`
  }));
  return [
    ...humans,
    ...createCpuPlayers(getCpuCount(), humans.length, getCpuDifficulty())
  ];
}

function getCurrentMissionConfig(players) {
  const preset = getActiveMissionPreset();
  const fallbackSettings = getMissionSettings();
  return {
    playerCount: players.length,
    cpuCount: getCpuCount(),
    rounds: Number.parseInt($('trustnoone-rounds')?.value, 10) || 6,
    discussionSeconds: preset?.discussionSeconds || fallbackSettings.discussionSeconds,
    votingSeconds: preset?.votingSeconds || fallbackSettings.votingSeconds,
    cpuDifficulty: getCpuDifficulty(),
    presetId: preset?.id || 'custom',
    forceVoting: Boolean(preset?.forceVoting),
    taskProgressScale: preset?.taskProgressScale || fallbackSettings.taskProgressScale || null
  };
}

function buildQuickPlayers(config) {
  const cpuCount = Math.min(config.cpuCount, config.playerCount - 1);
  const humanCount = Math.max(1, config.playerCount - cpuCount);
  const humans = Array.from({ length: humanCount }, (_, index) => ({
    id: `player_${index + 1}`,
    name: DEFAULT_PLAYER_NAMES[index] || `Jogador ${index + 1}`
  }));
  return [...humans, ...createCpuPlayers(cpuCount, humans.length, config.cpuDifficulty)];
}

function getRoleByName(roleName) {
  return Object.values(MISSION_ROLES).find(r => r.name === roleName) || null;
}

function setPlayPhase(text) {
  const el = $('mission-play-phase');
  if (el) el.textContent = text;
}

function renderPlayerChips() {
  if (!gameState) return '';
  const state = getPublicState(gameState);
  const chips = (state.players || []).map(p => {
    const initial = escapeHtml((p.name || '?').charAt(0).toUpperCase());
    const name = escapeHtml(p.name || '?');
    const profile = p.cpuProfile ? ` · ${escapeHtml(p.cpuProfile.name)}` : '';
    return `<span class="tn-player-chip ${p.expelled ? 'tn-chip-expelled' : 'tn-chip-active'} ${p.isCpu ? 'tn-chip-cpu' : ''}" title="${name}${profile}"><span class="tn-chip-avatar">${initial}</span><span class="tn-chip-name">${name}</span>${p.isCpu ? '<span class="tn-chip-tag">CPU</span>' : ''}${p.expelled ? '<span aria-hidden="true"> ✗</span>' : ''}</span>`;
  }).join('');
  return `<div class="tn-players-bar" aria-label="Jogadores na partida">${chips}</div>`;
}

function showActionToast(playerName, callback) {
  render(`
    <div class="card mission-private-card mission-stage-card center tn-toast-card">
      <div class="mission-stage-icon">✅</div>
      <h2 class="card-title">Ação registrada</h2>
      <p class="text-sm">A escolha de <strong>${escapeHtml(playerName)}</strong> foi confirmada.</p>
      <p class="text-sm mt tn-discussion-hint">Ocultando em instantes...</p>
    </div>
  `);
  setTimeout(callback, 1000);
}

function validateSetupPlayers() {
  const inputs = Array.from(document.querySelectorAll('[data-mission-player-name]'));
  const names = inputs.map(inp => inp.value.trim());
  if (names.some(n => !n)) return 'Preencha o nome de todos os jogadores.';
  const unique = new Set(names.map(n => n.toLowerCase()));
  if (unique.size < names.length) return 'Nomes duplicados não são permitidos.';
  return null;
}

function showSetupError(msg) {
  let el = $('trustnoone-setup-error');
  if (!el) {
    const form = $('trustnoone-setup-form');
    if (form) {
      el = document.createElement('p');
      el.id = 'trustnoone-setup-error';
      el.className = 'tn-setup-error';
      form.appendChild(el);
    }
  }
  if (el) el.textContent = msg;
}

function clearSetupError() {
  const el = $('trustnoone-setup-error');
  if (el) el.textContent = '';
}

// ── M-24: Persistência de estado ──

function saveGameSession(displayPhase) {
  if (!gameState) return;
  try {
    writeJsonStorage(GAME_SESSION_KEY, {
      gameState,
      displayPhase: displayPhase || gameState.phase,
      savedAt: Date.now()
    });
  } catch (_) {}
}

function loadGameSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(GAME_SESSION_KEY) || 'null');
    if (!saved?.gameState) return null;
    if (Date.now() - (saved.savedAt || 0) > 86400000) {
      clearGameSession();
      return null;
    }
    return saved;
  } catch (_) {
    return null;
  }
}

function clearGameSession() {
  localStorage.removeItem(GAME_SESSION_KEY);
}

function restoreGameSession() {
  const saved = loadGameSession();
  if (!saved) return;
  gameState = saved.gameState;
  roleIndex = 0;
  roomIndex = 0;
  actionIndex = 0;
  voteIndex = 0;
  privateMode = 'cover';
  showScreen('mission-play');
  const phase = saved.displayPhase;
  if (phase === 'roomReveal') return renderRoomReveal();
  if (phase === 'voteReveal') return renderVoteReveal();
  if (phase === 'final') return renderFinal();
  return renderLogs();
}

function updateContinueButton() {
  const saved = loadGameSession();
  const btn = $('trustnoone-continue-btn');
  if (!btn) return;
  if (saved?.gameState?.round) {
    btn.classList.remove('hidden');
    btn.textContent = `Continuar missão (Rodada ${saved.gameState.round})`;
  } else {
    btn.classList.add('hidden');
  }
}

function injectContinueButton() {
  if ($('trustnoone-continue-btn')) return;
  const container = document.querySelector('.trust-home-main-actions');
  if (!container) return;
  const btn = document.createElement('button');
  btn.id = 'trustnoone-continue-btn';
  btn.className = 'btn btn-accent btn-lg btn-block hidden';
  btn.dataset.missionAction = 'continue-mission';
  container.insertBefore(btn, container.firstChild);
  updateContinueButton();
}

// ── M-28: Histórico da última partida ──

function saveLastResult(state) {
  const winnerLabel = state.winner === 'crew' ? 'Tripulação' : 'Android';
  const reasonLabel = {
    mission_complete: 'missão concluída',
    android_expelled: 'Android expulso',
    ship_destroyed: 'nave destruída',
    android_survived: 'Android sobreviveu',
    crew_too_low: 'tripulação reduzida'
  }[state.winReason] || 'partida encerrada';
  try {
    writeJsonStorage(LAST_RESULT_KEY, {
      winner: winnerLabel,
      android: state.androidIdentity?.name || '?',
      reason: reasonLabel,
      round: state.round,
      maxRounds: state.maxRounds,
      savedAt: Date.now()
    });
  } catch (_) {}
}

function renderHomeLastResult() {
  try {
    const last = JSON.parse(localStorage.getItem(LAST_RESULT_KEY) || 'null');
    if (!last) return;
    if ($('trustnoone-last-result')) return;
    const container = document.querySelector('.trust-home-card');
    if (!container) return;
    const div = document.createElement('div');
    div.id = 'trustnoone-last-result';
    div.className = 'tn-last-result';
    div.innerHTML = `<span class="tn-last-result-label">Última partida</span><span class="tn-last-result-text">${escapeHtml(last.winner)} venceu · ${escapeHtml(last.reason)} · Android: <strong>${escapeHtml(last.android)}</strong></span>`;
    container.appendChild(div);
  } catch (_) {}
}

function publicStatus() {
  const state = getPublicState(gameState);
  const alertLabel = { green: 'Verde', yellow: 'Amarelo', red: 'Vermelho' }[state.alertLevel] || state.alertLevel;
  const missionPct = Math.max(0, Math.min(100, state.missionProgress || 0));
  const shipPct = Math.max(0, Math.min(100, state.shipIntegrity || 0));
  const shipFillClass = shipPct <= 25 ? 'tn-bar-fill-critical' : shipPct <= 50 ? 'tn-bar-fill-danger' : 'tn-bar-fill-ok';
  setPlayPhase(`Rodada ${state.round}/${state.maxRounds}`);
  return `
    <div class="tn-hud mission-status-alert-${escapeHtml(state.alertLevel)} mb">
      <div class="tn-hud-row">
        <span class="tn-hud-label">Rodada</span>
        <span class="tn-hud-val">${state.round}/${state.maxRounds}</span>
        <span class="tn-hud-sep">·</span>
        <span class="tn-hud-label">Alerta</span>
        <span class="tn-hud-val tn-alert-${escapeHtml(state.alertLevel)}">${alertLabel}</span>
      </div>
      <div class="tn-hud-bars">
        <div class="tn-bar-wrap">
          <span class="tn-bar-label">Missão</span>
          <div class="tn-bar"><div class="tn-bar-fill tn-bar-mission" style="width:${missionPct}%"></div></div>
          <span class="tn-bar-pct">${missionPct}%</span>
        </div>
        <div class="tn-bar-wrap">
          <span class="tn-bar-label">Nave</span>
          <div class="tn-bar"><div class="tn-bar-fill ${shipFillClass}" style="width:${shipPct}%"></div></div>
          <span class="tn-bar-pct">${shipPct}%</span>
        </div>
      </div>
    </div>
  `;
}

function renderMissionObjectives(state = getPublicState(gameState)) {
  const objectives = state.missionObjectives?.criticalSystems || [];
  if (!objectives.length) return '';
  const completedCount = objectives.filter(item => (item.completed || 0) >= (item.required || 1)).length;
  return `
    <div class="tn-objectives mb" aria-label="Objetivos críticos da missão">
      <div class="tn-objectives-head">
        <span class="tn-hud-label">Sistemas críticos</span>
        <strong>${completedCount}/${objectives.length}</strong>
      </div>
      <div class="tn-objective-list">
        ${objectives.map(item => {
    const room = state.rooms?.[item.roomId] || MISSION_ROOMS[item.roomId];
    const done = (item.completed || 0) >= (item.required || 1);
    return `
          <div class="tn-objective ${done ? 'tn-objective-done' : ''}">
            <span>${done ? '✓' : '○'}</span>
            <strong>${escapeHtml(room?.name || item.roomId)}</strong>
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderSuspicionMeter(state = getPublicState(gameState)) {
  const suspicion = state.suspicion?.byPlayerId || {};
  const entries = (state.players || [])
    .filter(player => !player.expelled)
    .map(player => ({
      player,
      score: suspicion[player.id]?.score || 0,
      level: suspicion[player.id]?.level || 'low',
      reason: suspicion[player.id]?.reasons?.[0]?.message || 'Sem sinal público forte.'
    }))
    .sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name));
  if (!entries.length) return '';
  return `
    <div class="tn-suspicion mb" aria-label="Medidor público de suspeita">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Suspeita pública</span>
        <strong>${entries[0].score > 0 ? escapeHtml(entries[0].player.name) : 'Sem líder'}</strong>
      </div>
      <div class="tn-suspicion-list">
        ${entries.map(({ player, score, level, reason }) => `
          <div class="tn-suspect tn-suspect-${escapeHtml(level)}">
            <span class="tn-suspect-name">${escapeHtml(player.name)}</span>
            <div class="tn-suspect-bar" aria-hidden="true"><span style="width:${Math.max(4, score)}%"></span></div>
            <strong>${score}</strong>
            <small>${escapeHtml(reason)}</small>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function roundBriefIcon(type = '') {
  return {
    risk: '!',
    log: '?',
    noise: '~',
    objective: '✓',
    suspect: '•',
    alibi: '✓',
    contradiction: '!',
    verified: '✓',
    quiet: '…'
  }[type] || '•';
}

function renderRoundBriefing(state = getPublicState(gameState)) {
  const items = (state.roundBriefing || []).filter(item => item.round === state.round).slice(0, 4);
  if (!items.length) return '';
  return `
    <div class="tn-briefing mb" aria-label="O que importa nesta rodada">
      <div class="tn-panel-head">
        <span class="tn-hud-label">O que importa nesta rodada</span>
        <strong>${items.length} fato${items.length === 1 ? '' : 's'}</strong>
      </div>
      <div class="tn-briefing-list">
        ${items.map(item => `
          <div class="tn-brief-item tn-brief-${escapeHtml(item.type)}">
            <span class="tn-brief-icon">${roundBriefIcon(item.type)}</span>
            <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function logClass(log = {}) {
  return `mission-log-item mission-log-${escapeHtml(log.type || 'access')} mission-log-${escapeHtml(log.precision || 'vague')}`;
}

function evidenceTypeLabel(type = '') {
  return {
    sabotage_candidates: 'Candidatos',
    tampered_record: 'Log adulterado',
    medical_anomaly: 'Anomalia',
    room_alibi: 'Álibi',
    contested_alibi: 'Álibi contestado',
    strong_alibi: 'Álibi forte',
    failed_dual_repair: 'Reparo incompleto',
    investigation_trace: 'Rastreamento',
    access_audit: 'Auditoria',
    room_monitor: 'Monitoramento',
    security_patrol: 'Ronda',
    security_patrol_scheduled: 'Ronda agendada',
    player_scan: 'Escaneamento',
    sample_match: 'Amostras',
    emergency_transmission: 'Emergência',
    energy_risk: 'Risco instável',
    forged_statement: 'Depoimento forjado',
    blackout: 'Apagão',
    intrusion_alarm: 'Alarme',
    calibration_noise: 'Ruído técnico',
    statement_conflict: 'Contradição',
    false_evidence_revealed: 'Pista falsa',
    signal: 'Pista'
  }[type] || 'Pista';
}

function getSoloHumanPlayer(state = getPublicState(gameState)) {
  return (state.players || []).find(player => !player.isCpu && !player.expelled) || null;
}

function renderRoundEventPanel(state = getPublicState(gameState)) {
  const event = state.currentRoundEvent;
  if (!event) return '';
  const rooms = (event.roomIds || [])
    .map(roomId => state.rooms?.[roomId]?.name || MISSION_ROOMS[roomId]?.name || roomId)
    .join(' · ');
  return `
    <div class="tn-round-event tn-round-event-${escapeHtml(event.type)} mb">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Evento da rodada</span>
        <strong>${escapeHtml(event.title || 'Evento')}</strong>
      </div>
      <p>${escapeHtml(event.message || '')}</p>
      ${rooms ? `<small>Setores no radar: ${escapeHtml(rooms)}</small>` : ''}
    </div>
  `;
}

function reliabilityLabel(reliability = 'medium') {
  return {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  }[reliability] || 'Média';
}

function renderEvidencePanel(state = getPublicState(gameState)) {
  const items = (state.evidence || []).filter(item => item.round === state.round).slice(0, 6);
  if (!items.length) return '';
  return `
    <div class="tn-evidence mb" aria-label="Evidências estruturadas da rodada">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Evidências e álibis</span>
        <strong>${items.length} pista${items.length === 1 ? '' : 's'}</strong>
      </div>
      <div class="tn-evidence-list">
        ${items.map(item => {
    const room = state.rooms?.[item.roomId] || MISSION_ROOMS[item.roomId];
    return `
          <div class="tn-evidence-item tn-evidence-${escapeHtml(item.type)}">
            <span class="tn-evidence-meta">${escapeHtml(evidenceTypeLabel(item.type))} · ${escapeHtml(reliabilityLabel(item.reliability))}</span>
            <strong>${escapeHtml(room?.name || 'Setor')}</strong>
            <small>${escapeHtml(item.message)}</small>
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderCpuProfilesPanel(state = getPublicState(gameState)) {
  const cpus = (state.players || []).filter(player => player.isCpu && player.cpuProfile);
  if (!cpus.length) return '';
  return `
    <div class="tn-cpu-profiles mb" aria-label="Perfis sociais dos CPUs">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Perfis dos CPUs</span>
        <strong>${cpus.length} personagem${cpus.length === 1 ? '' : 's'}</strong>
      </div>
      <div class="tn-cpu-profile-list">
        ${cpus.map(cpu => {
    const profile = CPU_PROFILES[cpu.cpuProfile.id] || cpu.cpuProfile;
    return `
          <div class="tn-cpu-profile-card ${cpu.expelled ? 'tn-cpu-profile-expelled' : ''}">
            <strong>${escapeHtml(cpu.name)} · ${escapeHtml(cpu.cpuProfile.name)}</strong>
            <small>${escapeHtml(cpu.cpuProfile.shortDescription)}</small>
            ${profile.voteStyle ? `<span>${escapeHtml(profile.voteStyle)}</span>` : ''}
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderCpuStatementsPanel(state = getPublicState(gameState)) {
  const items = (state.cpuStatements || []).filter(item => item.round === state.round).slice(0, 6);
  if (!items.length) return '';
  return `
    <div class="tn-statements mb" aria-label="Depoimentos dos CPUs">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Depoimentos dos CPUs</span>
        <strong>${items.length} relato${items.length === 1 ? '' : 's'}</strong>
      </div>
      <div class="tn-statement-list">
        ${items.map(item => `
          <div class="tn-statement-item ${item.conflict ? 'tn-statement-conflict' : ''}">
            <div class="tn-statement-title">
              <strong>${escapeHtml((state.players || []).find(player => player.id === item.playerId)?.name || 'CPU')}</strong>
              <span>${escapeHtml(item.profileName || 'CPU')}</span>
            </div>
            <ul class="tn-statement-answers">
              <li><b>Onde</b><span>${escapeHtml(item.answers?.where || 'Sem resposta.')}</span></li>
              <li><b>Fez</b><span>${escapeHtml(item.answers?.what || item.claimedAction || 'Sem resposta.')}</span></li>
              <li><b>Suspeita</b><span>${escapeHtml(item.answers?.suspect || 'Sem suspeita declarada.')}</span></li>
              <li><b>Memória</b><span>${escapeHtml(item.answers?.memory || 'Sem vínculo anterior relevante.')}</span></li>
            </ul>
            <small>${item.conflict ? escapeHtml(item.conflictReason || 'Relato em conflito com registros públicos.') : 'Relato compatível com os registros conhecidos.'}</small>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCpuQuestionPanel(state = getPublicState(gameState)) {
  const items = (state.cpuQuestions || []).filter(item => item.round === state.round).slice(0, 4);
  if (!items.length) return '';
  return `
    <div class="tn-cpu-dialogue mb" aria-label="Perguntas feitas aos CPUs">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Interrogatório</span>
        <strong>${items.length} resposta${items.length === 1 ? '' : 's'}</strong>
      </div>
      <div class="tn-cpu-dialogue-list">
        ${items.map(item => {
    const cpu = (state.players || []).find(player => player.id === item.playerId);
    return `
          <div class="tn-cpu-dialogue-card">
            <strong>${escapeHtml(cpu?.name || 'CPU')}</strong>
            <small>${escapeHtml(item.question || 'Pergunta direta.')}</small>
            <span>${escapeHtml(item.answer || 'Sem resposta pública.')}</span>
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderCpuAccusationPanel(state = getPublicState(gameState)) {
  const items = (state.cpuAccusationReactions || []).filter(item => item.round === state.round).slice(0, 4);
  if (!items.length) return '';
  return `
    <div class="tn-cpu-dialogue mb" aria-label="Reações dos CPUs acusados">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Defesas dos CPUs</span>
        <strong>${items.length} reação${items.length === 1 ? '' : 'ões'}</strong>
      </div>
      <div class="tn-cpu-dialogue-list">
        ${items.map(item => {
    const cpu = (state.players || []).find(player => player.id === item.playerId);
    return `
          <div class="tn-cpu-dialogue-card tn-cpu-dialogue-${escapeHtml(item.stance || 'pushes_back')}">
            <strong>${escapeHtml(cpu?.name || 'CPU')}</strong>
            <small>${item.stance === 'uses_alibi' ? 'Usou álibi público' : item.stance === 'defensive' ? 'Defendeu uma pista contra si' : 'Contestou a acusação'}</small>
            <span>${escapeHtml(item.message || 'Sem defesa pública.')}</span>
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderSoloCpuInterrogationControls(state = getPublicState(gameState)) {
  if (!isSoloAssistMode()) return '';
  const human = getSoloHumanPlayer(state);
  if (!human) return '';
  const questions = (state.cpuQuestions || []).filter(item => item.round === state.round && item.askedByPlayerId === human.id);
  const accusations = (state.cpuAccusationReactions || []).filter(item => item.round === state.round && item.accuserId === human.id);
  const cpus = (state.players || []).filter(player => player.isCpu && !player.expelled);
  if (!cpus.length) return '';
  return `
    <div class="tn-cpu-interrogate mb" aria-label="Ações de investigação contra CPUs">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Pressionar CPUs</span>
        <strong>Perguntas ${questions.length}/2 · acusações ${accusations.length}/2</strong>
      </div>
      <div class="tn-cpu-interrogate-list">
        ${cpus.map(cpu => {
    const asked = questions.some(item => item.playerId === cpu.id);
    const accused = accusations.some(item => item.playerId === cpu.id);
    return `
          <div class="tn-cpu-interrogate-card">
            <div>
              <strong>${escapeHtml(cpu.name)}</strong>
              <small>${escapeHtml(cpu.cpuProfile?.name || 'CPU')}</small>
            </div>
            <div class="tn-cpu-interrogate-actions">
              <button class="btn btn-ghost" data-mission-action="ask-cpu" data-player-id="${cpu.id}" ${asked || questions.length >= 2 ? 'disabled' : ''}>Perguntar</button>
              <button class="btn btn-ghost" data-mission-action="accuse-cpu" data-player-id="${cpu.id}" ${accused || accusations.length >= 2 ? 'disabled' : ''}>Acusar</button>
            </div>
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderCpuVoteExplanationsPanel(state = getPublicState(gameState)) {
  const items = (state.cpuVoteExplanations || []).filter(item => item.round === state.round).slice(0, 6);
  if (!items.length) return '';
  return `
    <div class="tn-cpu-votes mb" aria-label="Motivos dos votos dos CPUs">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Votos dos CPUs</span>
        <strong>${items.length} justificativa${items.length === 1 ? '' : 's'}</strong>
      </div>
      <div class="tn-cpu-vote-list">
        ${items.map(item => {
    const voter = (state.players || []).find(player => player.id === item.voterId);
    const target = item.skipped ? null : (state.players || []).find(player => player.id === item.targetId);
    const confidence = { high: 'forte', medium: 'média', low: 'fraca' }[item.confidence] || 'média';
    return `
          <div class="tn-cpu-vote-card tn-cpu-vote-${escapeHtml(item.confidence || 'medium')}">
            <div class="tn-statement-title">
              <strong>${escapeHtml(voter?.name || 'CPU')}</strong>
              <span>${escapeHtml(item.profileName || 'CPU')} · pista ${confidence}</span>
            </div>
            <small>${item.skipped ? 'Pulou o voto.' : `Votou em ${escapeHtml(target?.name || 'alguém')}.`} ${escapeHtml(item.reason || '')}</small>
            ${item.clue ? `<small>${escapeHtml(item.clue)}</small>` : ''}
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderCpuMemoryPanel(state = getPublicState(gameState)) {
  const memoryByPlayer = state.cpuMemory?.byPlayerId || {};
  const entries = (state.players || [])
    .filter(player => player.isCpu && memoryByPlayer[player.id])
    .map(player => ({ player, memory: memoryByPlayer[player.id] }))
    .filter(({ memory }) => (
      (memory.suspectedPlayerIds || []).length
      || (memory.accusationsReceived || []).length
      || (memory.alliances || []).length
      || (memory.notes || []).length
    ));
  if (!entries.length) return '';
  return `
    <div class="tn-cpu-memory mb" aria-label="Memória social dos CPUs">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Memória dos CPUs</span>
        <strong>Suspeitas e alianças</strong>
      </div>
      <div class="tn-cpu-memory-list">
        ${entries.map(({ player, memory }) => {
    const suspect = memory.suspectedPlayerIds?.[0];
    const accusation = memory.accusationsReceived?.[0];
    const ally = memory.alliances?.[0];
    const note = memory.notes?.[0];
    return `
          <div class="tn-cpu-memory-card">
            <strong>${escapeHtml(player.name)}</strong>
            ${suspect ? `<small>Suspeita de ${escapeHtml((state.players || []).find(p => p.id === suspect.playerId)?.name || 'alguém')}: ${escapeHtml(suspect.reason)}</small>` : ''}
            ${accusation ? `<small>Acusação recebida: ${escapeHtml(accusation.message)}</small>` : ''}
            ${ally ? `<small>Aliança temporária com ${escapeHtml((state.players || []).find(p => p.id === ally.playerId)?.name || 'alguém')}: ${escapeHtml(ally.reason)}</small>` : ''}
            ${note ? `<small>${escapeHtml(note.message)}</small>` : ''}
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function timelineStageLabel(stage = '') {
  return {
    movement: 'Movimento',
    event: 'Evento',
    log: 'Log',
    statement: 'Depoimento'
  }[stage] || 'Fato';
}

function timelineStageIcon(stage = '') {
  return {
    movement: '01',
    event: '02',
    log: '03',
    statement: '04'
  }[stage] || '•';
}

function renderRoundTimeline(state = getPublicState(gameState)) {
  const items = (state.roundTimeline || []).filter(item => item.round === state.round).slice(0, 8);
  if (!items.length) return '';
  return `
    <div class="tn-timeline mb" aria-label="Linha do tempo da rodada">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Linha do tempo</span>
        <strong>Movimento → Evento → Log → Depoimentos</strong>
      </div>
      <div class="tn-timeline-list">
        ${items.map(item => {
    const room = item.roomId ? (state.rooms?.[item.roomId] || MISSION_ROOMS[item.roomId]) : null;
    return `
          <div class="tn-timeline-item tn-timeline-${escapeHtml(item.stage)}">
            <span class="tn-timeline-pin">${timelineStageIcon(item.stage)}</span>
            <span class="tn-timeline-copy">
              <strong>${escapeHtml(timelineStageLabel(item.stage))}${room ? ` · ${escapeHtml(room.name || item.roomId)}` : ''}</strong>
              <small>${escapeHtml(item.message)}</small>
            </span>
          </div>
        `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderSuspicionHistory(state = getPublicState(gameState)) {
  const histories = state.playerHistory?.byPlayerId || {};
  const entries = (state.players || []).map(player => {
    const history = histories[player.id] || {};
    const suspicion = history.suspicion || { score: 0, level: 'low', reasons: [] };
    const rooms = (history.rooms || []).slice(-3).map(item => {
      const room = state.rooms?.[item.roomId] || MISSION_ROOMS[item.roomId];
      return `R${item.round} ${room?.name || item.roomId}`;
    });
    const votesReceived = (history.votes || []).filter(item => item.type === 'received').length;
    const votesCast = (history.votes || []).filter(item => item.type === 'cast').length;
    const latestEvidence = (history.evidence || []).slice(-1)[0];
    return {
      player,
      suspicion,
      rooms,
      votesReceived,
      votesCast,
      latestEvidence
    };
  }).sort((a, b) => (b.suspicion.score || 0) - (a.suspicion.score || 0) || a.player.name.localeCompare(b.player.name));
  if (!entries.length) return '';
  return `
    <div class="tn-history mb" aria-label="Histórico de suspeita entre rodadas">
      <div class="tn-panel-head">
        <span class="tn-hud-label">Histórico de suspeita</span>
        <strong>Fatos acumulados</strong>
      </div>
      <div class="tn-history-grid">
        ${entries.map(({ player, suspicion, rooms, votesReceived, votesCast, latestEvidence }) => `
          <div class="tn-history-card tn-history-${escapeHtml(suspicion.level || 'low')} ${player.expelled ? 'tn-history-expelled' : ''}">
            <div class="tn-history-top">
              <strong>${escapeHtml(player.name)}</strong>
              <span>${Math.max(0, suspicion.score || 0)}</span>
            </div>
            <div class="tn-history-rooms">${rooms.length ? rooms.map(room => `<small>${escapeHtml(room)}</small>`).join('') : '<small>Sem sala registrada</small>'}</div>
            <div class="tn-history-facts">
              <small>${votesReceived} voto(s) recebido(s) · ${votesCast} voto(s) dado(s)</small>
              <small>${escapeHtml(suspicion.reasons?.[0]?.message || latestEvidence?.message || 'Sem fato público forte acumulado.')}</small>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function statusLabel(status = 'normal') {
  return {
    normal: 'Normal',
    sabotaged: 'Sabotada',
    locked: 'Bloqueada',
    critical: 'Crítica'
  }[status] || 'Normal';
}

function riskLabel(risk = 'low') {
  return {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
    critical: 'Crítico'
  }[risk] || 'Baixo';
}

function logTypeIcon(type = '') {
  return {
    access: '🔑',
    task: '✅',
    repair: '🔧',
    movement: '👣',
    event: '⚠️',
    vote: '🗳️',
    system: '💻',
    sabotage: '🔴'
  }[type] || '📋';
}

function logPrecisionLabel(precision = 'vague') {
  return { vague: 'Vago', partial: 'Parcial', clear: 'Claro' }[precision] || precision;
}

function renderRoomMap(options = {}) {
  const { selectable = false, showOccupancy = false } = options;
  const state = gameState ? getPublicState(gameState) : null;
  return `<div class="mission-room-map">${Object.values(MISSION_ROOMS).map(room => {
    const liveRoom = state?.rooms?.[room.id] || room;
    const count = showOccupancy ? state?.roomOccupancy?.[room.id]?.length || 0 : null;
    const attrs = selectable ? ` data-mission-action="choose-room" data-room-id="${room.id}"` : '';
    const tag = selectable ? 'button' : 'div';
    return `
      <${tag} class="mission-map-room mission-map-room-${escapeHtml(liveRoom.status || 'normal')}"${attrs}>
        <span class="mission-map-icon">${room.icon}</span>
        <span class="mission-map-main">
          <strong>${escapeHtml(room.name)}</strong>
          <span>${escapeHtml(room.shortDescription)}</span>
        </span>
        <span class="mission-map-meta">Risco ${riskLabel(room.riskLevel)}</span>
        <span class="mission-map-status">${statusLabel(liveRoom.status)}</span>
        ${showOccupancy ? `<span class="mission-map-count">${count} jogador${count === 1 ? '' : 'es'}</span>` : ''}
      </${tag}>
    `;
  }).join('')}</div>`;
}

function render(html) {
  const root = $('trustnoone-play-root');
  if (!root) return;
  root.classList.remove('tn-phase-enter');
  void root.offsetWidth;
  root.innerHTML = html;
  root.classList.add('tn-phase-enter');
}

function renderDevice(html) {
  const root = $('trustnoone-device-root');
  if (root) root.innerHTML = html;
}

function isMultiHost() {
  return missionMode === 'host' && hostSession;
}

function getActivePublicPlayers(state = getPublicState(gameState)) {
  return (state.players || []).filter(player => !player.expelled && player.active !== false);
}

function allPlayersSubmitted(collection = {}) {
  return getActivePublicPlayers().every(player => collection[player.id]);
}

function canSkipRoundVote(state = getPublicState(gameState)) {
  return state.alertLevel !== 'red' && !state.settings?.forceVoting;
}

function voteSkipBlockMessage(state = getPublicState(gameState)) {
  if (state.alertLevel === 'red') return 'Alerta vermelho: votação obrigatória.';
  if (state.settings?.forceVoting) return 'Preset investigativo: a rodada precisa terminar com uma acusação ou voto privado.';
  return '';
}

function sendPublicStateToDevices() {
  if (!isMultiHost() || !gameState) return;
  hostSession.broadcast('PUBLIC_STATE_UPDATE', { publicState: getPublicState(gameState) });
}

function sendPrivateStatesToDevices() {
  if (!isMultiHost() || !gameState) return;
  joinedPlayers.forEach(player => {
    hostSession.sendToPlayer(player.id, 'PRIVATE_STATE_UPDATE', {
      playerId: player.id,
      privateState: getPrivateState(gameState, player.id)
    });
  });
}

function syncMissionDevices() {
  sendPublicStateToDevices();
  sendPrivateStatesToDevices();
}

function renderJoinedPlayers() {
  const list = $('mission-session-players');
  if (!list) return;
  list.innerHTML = joinedPlayers.length
    ? joinedPlayers.map((player, index) => `
      <div class="mission-player-row">
        <span class="mission-player-index">${index + 1}</span>
        <strong>${escapeHtml(player.name)}</strong>
      </div>
    `).join('')
    : '<div class="mission-log-item">Aguardando jogadores pelo QR Code ou código.</div>';
}

function setMissionSessionStatus(text) {
  const el = $('mission-session-status');
  if (el) el.textContent = text;
}

function renderPrivateCover(kind, player) {
  const state = gameState ? getPublicState(gameState) : null;
  const roundBadge = state ? `<div class="tn-round-badge">Rodada ${state.round}/${state.maxRounds}</div>` : '';
  const titles = {
    role: 'Revelação de papel',
    room: 'Escolha de sala',
    action: 'Escolha de ação',
    vote: 'Votação secreta'
  };
  const icons = { role: '🪪', room: '🗺️', action: '🛠️', vote: '🗳️' };
  const hints = {
    role: 'Você descobrirá qual papel secreto foi atribuído a você nesta partida.',
    room: 'Você escolherá secretamente para qual setor da nave ir nesta rodada.',
    action: 'Você escolherá o que fazer no seu setor. Outros jogadores não verão.',
    vote: 'Você votará para expulsar quem acha que é o Android Hackeado.'
  };
  render(`
    <div class="card mission-private-card mission-stage-card mission-stage-${escapeHtml(kind)} center">
      ${roundBadge}
      <div class="mission-stage-icon">${icons[kind] || '🔒'}</div>
      <div class="mission-private-warning mb">Apenas <strong>${escapeHtml(player.name)}</strong> deve olhar para a tela agora.</div>
      <h2 class="card-title">${titles[kind] || 'Tela privada'}</h2>
      <p class="text-sm mb">${hints[kind] || ''}</p>
      <p class="text-sm mb">Passe o dispositivo para <strong>${escapeHtml(player.name)}</strong> e toque no botão quando todos os outros desviarem o olhar.</p>
      <button class="btn btn-primary btn-lg btn-block" data-mission-action="reveal-private">👁️ Revelar para ${escapeHtml(player.name)}</button>
    </div>
  `);
}

function renderRoleReveal() {
  const player = currentPlayer(roleIndex);
  if (!player) {
    gameState = startRound(gameState);
    roomIndex = 0;
    privateMode = 'cover';
    renderRoomStep();
    return;
  }
  if (privateMode === 'cover') return renderPrivateCover('role', player);
  const privateState = getPrivateState(gameState, player.id);
  const isAndroid = privateState.player.team === 'android';
  const role = getRoleByName(privateState.player.roleName);
  const roleDesc = role?.description || (isAndroid ? 'Sabote a missão sem revelar sua identidade.' : 'Complete a missão e descubra quem é o Android.');
  const teamLabel = isAndroid ? 'Android' : 'Tripulação';
  const teamClass = isAndroid ? 'tn-team-android' : 'tn-team-crew';
  const roleHint = isAndroid
    ? 'Dica: Finja fazer tarefas normais. Não sabote em excesso para não levantar suspeitas.'
    : 'Dica: Observe padrões suspeitos de movimento e ações nos logs públicos.';
  render(`
    <div class="card mission-private-card mission-stage-card mission-stage-role center">
      <div class="mission-stage-icon">${isAndroid ? '🤖' : '👨‍🚀'}</div>
      <div class="mission-private-warning mb">Só <strong>${escapeHtml(player.name)}</strong> pode ver este papel.</div>
      <div class="tn-team-badge ${teamClass}">${teamLabel}</div>
      <h2 class="card-title">${escapeHtml(privateState.player.roleName)}</h2>
      <p class="text-sm mb">${escapeHtml(roleDesc)}</p>
      <div class="tn-role-hint">${roleHint}</div>
      <button class="btn btn-primary btn-lg btn-block" data-mission-action="next-role">Entendi — ocultar tela</button>
    </div>
  `);
}

function renderRoomStep() {
  const player = currentPlayer(roomIndex);
  if (!player) {
    gameState = applyCpuRoomSelections(gameState, getCpuDifficulty());
    gameState = revealRoomOccupancy(gameState);
    renderRoomReveal();
    return;
  }
  if (privateMode === 'cover') return renderPrivateCover('room', player);
  const state = getPublicState(gameState);
  render(`
    <div class="card mission-private-card mission-stage-card mission-stage-room">
      <div class="tn-round-badge">Rodada ${state.round}/${state.maxRounds}</div>
      <div class="mission-stage-kicker">Mapa da nave</div>
      <div class="mission-private-warning mb">Apenas <strong>${escapeHtml(player.name)}</strong> escolhe agora — em segredo.</div>
      <h2 class="card-title">Onde você vai?</h2>
      <p class="text-sm mb">Sua escolha fica oculta até todos decidirem. Certas ações especiais só existem em salas específicas.</p>
      ${renderRoomMap({ selectable: true, showOccupancy: false })}
      <button class="btn btn-ghost btn-lg btn-block mt" data-mission-action="hide-private">Ocultar tela</button>
    </div>
  `);
}

function renderRoomReveal() {
  const state = getPublicState(gameState);
  setPlayPhase(`Rodada ${state.round}/${state.maxRounds}`);
  saveGameSession('roomReveal');
  if (isSoloAssistMode()) return renderSoloInvestigationBriefing(state);
  render(`
    ${publicStatus()}
    ${renderMissionObjectives(state)}
    ${renderCpuProfilesPanel(state)}
    ${renderSuspicionMeter(state)}
    ${renderPlayerChips()}
    <div class="card mission-stage-card mission-stage-room-reveal">
      <div class="mission-stage-kicker">Setores revelados</div>
      <h2 class="card-title">Tripulação posicionada</h2>
      ${renderRoomMap({ selectable: false, showOccupancy: true })}
      <button class="btn btn-primary btn-lg btn-block" data-mission-action="start-actions">Escolher ações →</button>
    </div>
  `);
}

function renderSoloInvestigationBriefing(state = getPublicState(gameState)) {
  render(`
    ${publicStatus()}
    ${renderMissionObjectives(state)}
    ${renderCpuProfilesPanel(state)}
    ${renderSuspicionMeter(state)}
    ${renderPlayerChips()}
    <div class="card mission-stage-card tn-solo-brief">
      <div class="mission-stage-kicker">Turno solo assistido</div>
      <h2 class="card-title">CPUs se posicionaram pela nave</h2>
      <p class="text-sm mb">O deslocamento dos bots foi resolvido em segundo plano. Use o mapa público para escolher sua ação sem passar por telas privadas repetitivas.</p>
      ${renderRoomMap({ selectable: false, showOccupancy: true })}
      <button class="btn btn-primary btn-lg btn-block mt" data-mission-action="start-actions">Escolher minha ação →</button>
    </div>
  `);
}

function renderActionStep() {
  const player = currentPlayer(actionIndex);
  if (!player) {
    gameState = applyCpuActionSelections(gameState, getCpuDifficulty());
    gameState = resolveActions(gameState);
    if (gameState.phase === 'final') return renderFinal();
    gameState = generateLogs(gameState);
    renderLogs();
    return;
  }
  if (privateMode === 'cover') return renderPrivateCover('action', player);
  const privateState = getPrivateState(gameState, player.id);
  const room = MISSION_ROOMS[privateState.player.roomId];
  const actions = privateState.availableActions.map(action => {
    const fullAction = getActionById(action.id) || action;
    const hint = fullAction.logHint || (fullAction.type === 'special_action' ? 'Habilidade especial do papel' : fullAction.type === 'sabotage' ? 'Ação de sabotagem' : '');
    return `
      <button class="btn btn-ghost btn-lg tn-action-btn" data-mission-action="choose-action" data-action-id="${action.id}">
        <span class="tn-action-name">${escapeHtml(action.name)}</span>
        ${hint ? `<span class="tn-action-hint">${escapeHtml(hint)}</span>` : ''}
      </button>
    `;
  }).join('');
  render(`
    <div class="card mission-private-card mission-stage-card mission-stage-action">
      <div class="mission-stage-kicker">Ação privada</div>
      <div class="mission-private-warning mb">Apenas <strong>${escapeHtml(player.name)}</strong> escolhe a ação.</div>
      <h2 class="card-title">${escapeHtml(room?.name || privateState.player.roomId)} · ${escapeHtml(privateState.player.roleName)}</h2>
      <div class="mission-choice-grid">${actions}</div>
      <button class="btn btn-ghost btn-lg btn-block mt" data-mission-action="hide-private">Ocultar tela</button>
    </div>
  `);
}

function renderTargetStep() {
  const player = currentPlayer(actionIndex);
  const privateState = getPrivateState(gameState, player.id);
  const action = privateState.availableActions.find(item => item.id === pendingActionId);
  if (action?.requiresRoomTarget) return renderRoomTargetStep();
  const targets = activePlayers()
    .filter(target => target.id !== player.id && (!action?.targetCpuOnly || target.isCpu))
    .map(target => `<button class="btn btn-ghost btn-lg" data-mission-action="choose-action-target" data-target-id="${target.id}">${escapeHtml(target.name)}</button>`)
    .join('');
  render(`
    <div class="card mission-private-card mission-stage-card mission-stage-action">
      <div class="mission-stage-kicker">Alvo da ação</div>
      <div class="mission-private-warning mb">Apenas <strong>${escapeHtml(player.name)}</strong> escolhe o alvo.</div>
      <h2 class="card-title">${escapeHtml(action?.name || 'Escolha um alvo')}</h2>
      <div class="mission-choice-grid">${targets}</div>
      <button class="btn btn-ghost btn-lg btn-block mt" data-mission-action="hide-private">Ocultar tela</button>
    </div>
  `);
}

function renderRoomTargetStep() {
  const player = currentPlayer(actionIndex);
  const privateState = getPrivateState(gameState, player.id);
  const action = privateState.availableActions.find(item => item.id === pendingActionId);
  const targets = Object.values(MISSION_ROOMS)
    .map(room => `<button class="btn btn-ghost btn-lg" data-mission-action="choose-action-target" data-target-id="${room.id}">
      <span class="tn-action-name">${escapeHtml(room.name)}</span>
      <span class="tn-action-hint">${escapeHtml(room.shortDescription || '')}</span>
    </button>`)
    .join('');
  render(`
    <div class="card mission-private-card mission-stage-card mission-stage-action">
      <div class="mission-stage-kicker">Sala alvo</div>
      <div class="mission-private-warning mb">Apenas <strong>${escapeHtml(player.name)}</strong> escolhe a sala observada.</div>
      <h2 class="card-title">${escapeHtml(action?.name || 'Escolha uma sala')}</h2>
      <div class="mission-choice-grid">${targets}</div>
      <button class="btn btn-ghost btn-lg btn-block mt" data-mission-action="hide-private">Ocultar tela</button>
    </div>
  `);
}

function renderLogs() {
  const state = getPublicState(gameState);
  const currentLogs = state.logs.filter(log => log.round === state.round).slice(-8);
  const logs = currentLogs.map(log => `
    <div class="${logClass(log)}">
      <strong>${logTypeIcon(log.type)} ${logPrecisionLabel(log.precision)}</strong>
      <span>${escapeHtml(log.message)}</span>
    </div>
  `).join('');
  const canSkipVote = canSkipRoundVote(state);
  setPlayPhase(`Rodada ${state.round}/${state.maxRounds}`);
  saveGameSession('logs');
  render(`
    ${publicStatus()}
    ${renderMissionObjectives(state)}
    ${renderRoundEventPanel(state)}
    ${renderRoundBriefing(state)}
    ${renderRoundTimeline(state)}
    ${renderEvidencePanel(state)}
    ${renderCpuProfilesPanel(state)}
    ${renderCpuStatementsPanel(state)}
    ${renderCpuQuestionPanel(state)}
    ${renderCpuAccusationPanel(state)}
    ${renderCpuVoteExplanationsPanel(state)}
    ${renderCpuMemoryPanel(state)}
    ${renderSuspicionMeter(state)}
    ${renderSuspicionHistory(state)}
    ${renderPlayerChips()}
    <div class="card mission-stage-card mission-stage-logs">
      <div class="mission-stage-kicker">Pistas da rodada ${state.round}</div>
      <h2 class="card-title">Logs públicos</h2>
      <p class="text-sm mb">Analise os registros juntos para identificar padrões suspeitos.</p>
      <div class="mission-log-list mb">${logs || '<div class="mission-log-item">Nenhum log claro apareceu nesta rodada.</div>'}</div>
      <button class="btn btn-primary btn-lg btn-block" data-mission-action="start-discussion">💬 Iniciar discussão</button>
      ${canSkipVote ? `<button class="btn btn-ghost btn-lg btn-block mt-sm" data-mission-action="skip-voting">Adiar acusação (-${state.settings?.deferVoteIntegrityCost || 8}% nave)</button>` : `<div class="helper-box mt">⚠️ ${escapeHtml(voteSkipBlockMessage(state))}</div>`}
    </div>
  `);
}

function renderDiscussion() {
  const state = getPublicState(gameState);
  const canSkipVote = canSkipRoundVote(state);
  const alertMessages = {
    green: 'A nave está estável. Discutam com calma.',
    yellow: 'Atenção: integridade comprometida. O Android pode estar agindo.',
    red: '⚠️ Alerta vermelho! A situação é crítica — votação obrigatória.'
  };
  render(`
    ${publicStatus()}
    ${renderMissionObjectives(state)}
    ${renderRoundEventPanel(state)}
    ${renderRoundBriefing(state)}
    ${renderRoundTimeline(state)}
    ${renderEvidencePanel(state)}
    ${renderCpuProfilesPanel(state)}
    ${renderCpuStatementsPanel(state)}
    ${renderCpuQuestionPanel(state)}
    ${renderCpuAccusationPanel(state)}
    ${renderCpuVoteExplanationsPanel(state)}
    ${renderCpuMemoryPanel(state)}
    ${renderSuspicionMeter(state)}
    ${renderSuspicionHistory(state)}
    ${renderSoloCpuInterrogationControls(state)}
    ${renderPlayerChips()}
    <div class="card mission-stage-card mission-stage-discussion center">
      <div class="mission-stage-icon">💬</div>
      <h2 class="card-title">Discussão — Rodada ${state.round}</h2>
      <div class="timer-num mb" id="mission-discussion-time" aria-live="polite" aria-atomic="true">${discussionLeft}</div>
      <p class="text-sm mb">${alertMessages[state.alertLevel] || 'Conversem sobre salas, logs e suspeitas.'}</p>
      <p class="text-sm mb tn-discussion-hint">Não revelem telas privadas. Use os logs públicos para raciocinar em grupo.</p>
      <button class="btn btn-primary btn-lg btn-block" data-mission-action="start-voting">🗳️ Votar agora</button>
      ${canSkipVote ? `<button class="btn btn-ghost btn-lg btn-block mt-sm" data-mission-action="skip-voting">Adiar acusação (-${state.settings?.deferVoteIntegrityCost || 8}% nave)</button>` : `<div class="helper-box mt-sm">⚠️ ${escapeHtml(voteSkipBlockMessage(state))}</div>`}
    </div>
  `);
}

function startDiscussionTimer() {
  clearInterval(discussionTimer);
  discussionLeft = Number.parseInt(gameState?.settings?.discussionSeconds, 10) || 60;
  renderDiscussion();
  discussionTimer = setInterval(() => {
    discussionLeft -= 1;
    const timer = $('mission-discussion-time');
    if (timer) timer.textContent = String(Math.max(0, discussionLeft));
    if (discussionLeft <= 0) {
      clearInterval(discussionTimer);
      beginVoting();
    }
  }, 1000);
}

function beginVoting() {
  clearInterval(discussionTimer);
  gameState = startVoting(gameState);
  if (isMultiHost()) {
    gameState = applyCpuVotes(gameState, getCpuDifficulty());
    syncMissionDevices();
    const voteMap = {
      ...(gameState.votes?.byPlayerId || {}),
      ...(gameState.votes?.skippedByPlayerId || {})
    };
    if (allPlayersSubmitted(voteMap)) {
      gameState = resolveVoting(gameState);
      syncMissionDevices();
      return gameState.phase === 'final' ? renderFinal() : renderVoteReveal();
    }
    return renderMultiHostWaiting('vote');
  }
  voteIndex = 0;
  privateMode = 'cover';
  renderVoteStep();
}

function skipVoting() {
  if (!canSkipRoundVote()) return beginVoting();
  clearInterval(discussionTimer);
  gameState = deferVoting(gameState);
  renderVoteReveal();
}

function renderVoteStep() {
  const player = currentPlayer(voteIndex);
  if (!player) {
    gameState = applyCpuVotes(gameState, getCpuDifficulty());
    gameState = resolveVoting(gameState);
    renderVoteReveal();
    return;
  }
  if (privateMode === 'cover') return renderPrivateCover('vote', player);
  const state = getPublicState(gameState);
  const targets = activePlayers()
    .filter(target => target.id !== player.id)
    .map(target => `<button class="btn btn-ghost btn-lg" data-mission-action="submit-vote" data-target-id="${target.id}">${escapeHtml(target.name)}</button>`)
    .join('');
  render(`
    <div class="card mission-private-card mission-stage-card mission-stage-voting">
      <div class="tn-round-badge">Rodada ${state.round}/${state.maxRounds}</div>
      <div class="mission-stage-kicker">Voto secreto</div>
      <div class="mission-private-warning mb">Apenas <strong>${escapeHtml(player.name)}</strong> vota agora.</div>
      <h2 class="card-title">Quem deve ser expulso?</h2>
      <p class="text-sm mb">Vote em quem você acredita ser o Android Hackeado. O mais votado é expulso.</p>
      <div class="mission-choice-grid">${targets}<button class="btn btn-ghost btn-lg" data-mission-action="submit-vote" data-target-id="skip">Pular voto</button></div>
      <button class="btn btn-ghost btn-lg btn-block mt" data-mission-action="hide-private">Ocultar tela</button>
    </div>
  `);
}

function renderVoteReveal() {
  const state = getPublicState(gameState);
  if (state.phase === 'final') return renderFinal();
  saveGameSession('voteReveal');
  const result = state.votes?.result || {};
  const expelledName = result.expelled ? state.players.find(player => player.id === result.expelled)?.name : '';
  const voteLines = Object.entries(result.counts || {}).map(([targetId, count]) => {
    const targetName = state.players.find(player => player.id === targetId)?.name || 'Jogador';
    return `<div class="mission-log-item mission-log-vote"><strong>${escapeHtml(targetName)}</strong><span>${count} voto${count === 1 ? '' : 's'}</span></div>`;
  }).join('');
  render(`
    ${publicStatus()}
    ${renderMissionObjectives(state)}
    ${renderRoundEventPanel(state)}
    ${renderRoundBriefing(state)}
    ${renderRoundTimeline(state)}
    ${renderEvidencePanel(state)}
    ${renderCpuProfilesPanel(state)}
    ${renderCpuStatementsPanel(state)}
    ${renderCpuQuestionPanel(state)}
    ${renderCpuAccusationPanel(state)}
    ${renderCpuVoteExplanationsPanel(state)}
    ${renderCpuMemoryPanel(state)}
    ${renderSuspicionMeter(state)}
    ${renderSuspicionHistory(state)}
    ${renderPlayerChips()}
    <div class="card mission-stage-card mission-stage-ejection center">
      <div class="mission-stage-icon">${expelledName ? '🚪' : '⚖️'}</div>
      <h2 class="card-title">Resultado da votação</h2>
      <p class="text-sm mb">${result.deferred ? `A acusação foi adiada e a nave perdeu ${result.integrityCost || state.settings?.deferVoteIntegrityCost || 8}% de integridade.` : result.tied ? 'Empate. Ninguém foi expulso.' : expelledName ? `${escapeHtml(expelledName)} foi expulso da missão.` : 'Ninguém foi expulso.'}</p>
      <div class="mission-log-list mb">${voteLines || '<div class="mission-log-item">Nenhum voto contra jogadores.</div>'}<div class="mission-log-item mission-log-vote"><strong>Pulados</strong><span>${result.skipped || 0} voto(s)</span></div></div>
      <button class="btn btn-primary btn-lg btn-block" data-mission-action="next-round">Próxima rodada →</button>
    </div>
  `);
}

function renderMultiHostWaiting(kind) {
  const state = getPublicState(gameState);
  const selected = kind === 'room'
    ? Object.keys(gameState.roomSelections || {}).length
    : kind === 'action'
      ? (gameState.roundActions || []).length
      : Object.keys(gameState.votes?.byPlayerId || {}).length + Object.keys(gameState.votes?.skippedByPlayerId || {}).length;
  const total = getActivePublicPlayers(state).length;
  const title = {
    room: 'Aguardando escolha de salas',
    action: 'Aguardando escolha de ações',
    vote: 'Aguardando votos'
  }[kind];
  render(`
    ${publicStatus()}
    <div class="card center">
      <h2 class="card-title">${title}</h2>
      <p class="text-sm mb">${selected}/${total} jogadores responderam nos próprios devices.</p>
      <div class="mission-log-list">
        ${state.players.map(player => {
    const done = kind === 'room'
      ? Boolean(gameState.roomSelections?.[player.id])
      : kind === 'action'
        ? Boolean((gameState.roundActions || []).find(action => action.playerId === player.id))
        : Boolean(gameState.votes?.byPlayerId?.[player.id] || gameState.votes?.skippedByPlayerId?.[player.id]);
    return `<div class="mission-log-item ${done ? 'mission-log-confirmed' : 'mission-log-waiting'}"><strong>${escapeHtml(player.name)}</strong><span>${done ? 'Confirmado' : 'Aguardando'}</span></div>`;
  }).join('')}
      </div>
    </div>
  `);
}

function renderDeviceWaiting(message = 'Aguardando o host.') {
  renderDevice(`
    <div class="card mission-device-waiting mission-stage-card">
      <div class="mission-stage-icon">⏳</div>
      <h2 class="card-title">Trust No One</h2>
      <p class="text-sm">${escapeHtml(message)}</p>
    </div>
  `);
}

function renderDeviceRoomSelection() {
  const privateState = devicePrivateState;
  if (!privateState) return renderDeviceWaiting();
  const roleText = privateState.player.team === 'android'
    ? 'Você é o Android. Sabote sem ser descoberto.'
    : 'Você é tripulante. Complete tarefas e descubra o Android.';
  renderDevice(`
    <div class="card mission-device-private">
      <div class="mission-private-warning mb">Tela privada de ${escapeHtml(privateState.player.name)}.</div>
      <h2 class="card-title">${escapeHtml(privateState.player.roleName)}</h2>
      <p class="text-sm mb">${roleText}</p>
      <h3 class="mission-section-title">Escolha sua sala</h3>
      <div class="mission-room-map">${Object.values(MISSION_ROOMS).map(room => `
        <button class="mission-map-room mission-map-room-${escapeHtml(room.status || 'normal')}" data-mission-device-action="select-room" data-room-id="${room.id}">
          <span class="mission-map-icon">${room.icon}</span>
          <span class="mission-map-main"><strong>${escapeHtml(room.name)}</strong><span>${escapeHtml(room.shortDescription)}</span></span>
          <span class="mission-map-meta">Risco ${riskLabel(room.riskLevel)}</span>
          <span class="mission-map-status">Secreto</span>
        </button>
      `).join('')}</div>
    </div>
  `);
}

function renderDeviceActionSelection() {
  const privateState = devicePrivateState;
  if (!privateState) return renderDeviceWaiting();
  const room = MISSION_ROOMS[privateState.player.roomId];
  const actions = privateState.availableActions.map(action => {
    const fullAction = getActionById(action.id) || action;
    const hint = fullAction.logHint || (fullAction.type === 'special_action' ? 'Habilidade especial' : fullAction.type === 'sabotage' ? 'Sabotagem' : '');
    return `
      <button class="btn btn-ghost btn-lg tn-action-btn" data-mission-device-action="select-action" data-action-id="${action.id}">
        <span class="tn-action-name">${escapeHtml(action.name)}</span>
        ${hint ? `<span class="tn-action-hint">${escapeHtml(hint)}</span>` : ''}
      </button>
    `;
  }).join('');
  renderDevice(`
    <div class="card mission-device-private">
      <div class="mission-private-warning mb">Escolha privada de ${escapeHtml(privateState.player.name)}.</div>
      <h2 class="card-title">${escapeHtml(room?.name || 'Sala')} · ${escapeHtml(privateState.player.roleName)}</h2>
      <div class="mission-choice-grid">${actions || '<div class="mission-log-item">Nenhuma ação disponível.</div>'}</div>
    </div>
  `);
}

function renderDeviceTargetSelection() {
  const privateState = devicePrivateState;
  const action = privateState?.availableActions.find(item => item.id === pendingDeviceActionId);
  const targets = action?.requiresRoomTarget
    ? Object.values(MISSION_ROOMS)
      .map(room => `<button class="btn btn-ghost btn-lg" data-mission-device-action="select-action-target" data-target-id="${room.id}">${escapeHtml(room.name)}</button>`)
      .join('')
    : getActivePublicPlayers(devicePublicState)
      .filter(player => player.id !== privateState?.player.id && (!action?.targetCpuOnly || player.isCpu))
      .map(player => `<button class="btn btn-ghost btn-lg" data-mission-device-action="select-action-target" data-target-id="${player.id}">${escapeHtml(player.name)}</button>`)
      .join('');
  renderDevice(`
    <div class="card mission-device-private">
      <div class="mission-private-warning mb">Escolha privada.</div>
      <h2 class="card-title">${escapeHtml(action?.name || 'Escolha um alvo')}</h2>
      <div class="mission-choice-grid">${targets}</div>
    </div>
  `);
}

function renderDeviceVoting() {
  const privateState = devicePrivateState;
  const targets = getActivePublicPlayers(devicePublicState)
    .filter(player => player.id !== privateState?.player.id)
    .map(player => `<button class="btn btn-ghost btn-lg" data-mission-device-action="submit-vote" data-target-id="${player.id}">${escapeHtml(player.name)}</button>`)
    .join('');
  renderDevice(`
    <div class="card mission-device-private">
      <div class="mission-private-warning mb">Voto secreto de ${escapeHtml(privateState?.player.name || 'jogador')}.</div>
      <h2 class="card-title">Quem deve sair da missão?</h2>
      <div class="mission-choice-grid">${targets}<button class="btn btn-ghost btn-lg" data-mission-device-action="submit-vote" data-target-id="skip">Pular voto</button></div>
    </div>
  `);
}

function renderDevicePublicUpdate() {
  const state = devicePublicState;
  if (!state) return renderDeviceWaiting();
  if (state.phase === 'final') {
    const winner = state.winner === 'crew' ? 'Tripulação venceu' : 'Android venceu';
    return renderDevice(`
      <div class="card center">
        <h2 class="card-title">${winner}</h2>
        <p class="text-sm mb">Android: ${escapeHtml(state.androidIdentity?.name || 'revelado no host')}</p>
      </div>
    `);
  }
  const logs = (state.logs || []).filter(log => log.round === state.round).slice(-6).map(log => `
    <div class="${logClass(log)}"><strong>${logTypeIcon(log.type)} ${logPrecisionLabel(log.precision)}</strong><span>${escapeHtml(log.message)}</span></div>
  `).join('');
  renderDevice(`
    <div class="card mission-stage-card mission-stage-device-public">
      <h2 class="card-title">Aguardando o host</h2>
      <p class="text-sm mb">Fase atual: ${escapeHtml(state.phase)} · Rodada ${state.round}/${state.maxRounds}</p>
      ${renderRoundTimeline(state)}
      ${renderEvidencePanel(state)}
      ${renderCpuProfilesPanel(state)}
      ${renderCpuStatementsPanel(state)}
      ${renderCpuMemoryPanel(state)}
      ${renderSuspicionHistory(state)}
      <div class="mission-log-list">${logs || '<div class="mission-log-item">Nenhum log público novo.</div>'}</div>
    </div>
  `);
}

function renderDeviceByState() {
  const phase = devicePrivateState?.player ? devicePublicState?.phase || devicePrivateState?.player?.phase : devicePublicState?.phase;
  if (devicePrivateState && phase === 'roomSelection') return renderDeviceRoomSelection();
  if (devicePrivateState && phase === 'actionSelection') return renderDeviceActionSelection();
  if (devicePrivateState && phase === 'voting') return renderDeviceVoting();
  return renderDevicePublicUpdate();
}

function renderFinal() {
  const state = getPublicState(gameState);
  clearGameSession();
  saveLastResult(state);
  updateContinueButton();
  renderHomeLastResult();
  const winner = state.winner === 'crew' ? 'Tripulação venceu' : 'Android venceu';
  const reason = {
    mission_complete: 'A missão chegou a 100%.',
    android_expelled: 'O Android foi expulso.',
    ship_destroyed: 'A integridade da nave chegou a 0.',
    android_survived: 'O Android sobreviveu até o fim.',
    crew_too_low: 'A tripulação ativa ficou baixa demais.'
  }[state.winReason] || 'Partida encerrada.';
  const androidName = state.androidIdentity?.name || 'Desconhecido';
  const eventItems = state.publicEvents.slice(-5).map(event => `
    <div class="mission-log-item mission-log-event"><strong>${escapeHtml(event.type)}</strong><span>${escapeHtml(event.message)}</span></div>
  `).join('');
  const stats = state.players.map(player => {
    const playerStats = state.playerStats?.[player.id] || {};
    return `
      <div class="mission-final-player">
        <strong>${escapeHtml(player.name)}</strong>
        <span>${playerStats.tasks || 0} tarefa(s) · ${playerStats.repairs || 0} reparo(s) · ${playerStats.votesReceived || 0} voto(s)</span>
        ${playerStats.expelled ? '<span class="mission-final-flag">Expulso da missão</span>' : ''}
      </div>
    `;
  }).join('');
  setPlayPhase('Fim de partida');
  render(`
    ${publicStatus()}
    <div class="card mission-final-card mission-final-${escapeHtml(state.winner || 'unknown')}">
      <div class="mission-final-hero">
        <span class="mission-final-badge">${state.winner === 'crew' ? '✅' : '⚠️'}</span>
        <h2 class="card-title">${winner}</h2>
        <p class="text-sm">${reason}</p>
      </div>
      <div class="mission-final-reveal">
        <span>Android Hackeado</span>
        <strong>${escapeHtml(androidName)}</strong>
      </div>
      <div class="mission-final-grid">
        <div>
          <h3 class="mission-section-title">Eventos principais</h3>
          <div class="mission-log-list">${eventItems || '<div class="mission-log-item">Nenhum evento público registrado.</div>'}</div>
        </div>
        <div>
          <h3 class="mission-section-title">Estatísticas</h3>
          <div class="mission-final-stats">${stats}</div>
        </div>
      </div>
      <button class="btn btn-primary btn-lg btn-block" data-mission-nav="mission-setup">Jogar novamente</button>
    </div>
  `);
}

function renderMissionSessionPanel(session) {
  $('mission-session-panel')?.classList.remove('hidden');
  setMissionSessionStatus('Sessão aberta. Jogadores podem entrar pelo QR Code ou código.');
  const code = $('mission-session-code');
  const link = $('mission-session-link');
  if (code) code.textContent = session.id;
  if (link) link.value = session.joinUrl;
  renderMissionQrCode($('mission-session-qr'), session.joinUrl);
  renderJoinedPlayers();
}

function createHostSession() {
  missionMode = 'host';
  joinedPlayers = [];
  $('mission-session-panel')?.classList.remove('hidden');
  setMissionSessionStatus('Criando sessão...');
  hostSession?.close?.();
  hostSession = createMissionHostSession({
    onOpen: renderMissionSessionPanel,
    onPlayersChanged(players) {
      joinedPlayers = players.filter(player => player.connected !== false);
      renderJoinedPlayers();
    },
    onMessage: handleHostDeviceMessage,
    onError(message) {
      setMissionSessionStatus(message || 'Erro ao criar sessão.');
    }
  });
}

function startMultiDeviceGame(players, rounds) {
  const settings = getMissionSettings();
  gameState = createMissionGame({
    id: `mission_${Date.now()}`,
    seed: `${Date.now()}:${players.map(player => player.name).join('|')}`,
    players,
    maxRounds: rounds,
    playerCount: players.length,
    singleDevice: false,
    discussionSeconds: settings.discussionSeconds,
    votingSeconds: settings.votingSeconds,
    taskProgressScale: settings.taskProgressScale,
    minCrewWinRound: settings.minCrewWinRound,
    deferVoteIntegrityCost: settings.deferVoteIntegrityCost
  });
  gameState = assignRoles(gameState);
  gameState = startRound(gameState);
  gameState = applyCpuRoomSelections(gameState, getCpuDifficulty());
  showScreen('mission-play');
  hostSession.broadcast('GAME_STARTED', { publicState: getPublicState(gameState) });
  syncMissionDevices();
  renderMultiHostWaiting('room');
}

function startGame(event) {
  event.preventDefault();
  const singleDevice = $('trustnoone-single-device')?.checked !== false;
  if (!singleDevice) {
    const rounds = Number.parseInt($('trustnoone-rounds')?.value, 10) || 6;
    if (!isMultiHost()) {
      setMissionSessionStatus('Crie uma sessão multi-device antes de iniciar.');
      return;
    }
    const cpuPlayers = createCpuPlayers(getCpuCount(), joinedPlayers.length, getCpuDifficulty());
    const players = [...joinedPlayers, ...cpuPlayers].slice(0, 8);
    if (players.length < 4) {
      setMissionSessionStatus('Aguarde pelo menos 4 jogadores no total, incluindo CPUs.');
      return;
    }
    return startMultiDeviceGame(players, rounds);
  }
  clearSetupError();
  const validationError = validateSetupPlayers();
  if (validationError) {
    showSetupError(validationError);
    return;
  }
  const players = readPlayers();
  const config = getCurrentMissionConfig(players);
  writeJsonStorage(MISSION_LAST_CONFIG_KEY, config);
  gameState = createMissionGame({
    id: `mission_${Date.now()}`,
    seed: `${Date.now()}:${players.map(player => player.name).join('|')}`,
    players,
    maxRounds: config.rounds,
    playerCount: players.length,
    singleDevice: true,
    discussionSeconds: config.discussionSeconds,
    votingSeconds: config.votingSeconds,
    presetId: config.presetId,
    forceVoting: config.forceVoting,
    taskProgressScale: config.taskProgressScale
  });
  gameState = assignRoles(gameState);
  roleIndex = 0;
  privateMode = 'cover';
  showScreen('mission-play');
  renderRoleReveal();
}

function startQuickMission() {
  const config = readJsonStorage(MISSION_LAST_CONFIG_KEY, getMissionSettings());
  const players = buildQuickPlayers(config);
  writeJsonStorage(MISSION_LAST_CONFIG_KEY, { ...config, playerCount: players.length });
  gameState = createMissionGame({
    id: `mission_${Date.now()}`,
    seed: `${Date.now()}:quick:${players.map(player => player.name).join('|')}`,
    players,
    maxRounds: config.rounds,
    playerCount: players.length,
    singleDevice: true,
    discussionSeconds: config.discussionSeconds,
    votingSeconds: config.votingSeconds,
    presetId: config.presetId,
    forceVoting: config.forceVoting,
    taskProgressScale: config.taskProgressScale
  });
  gameState = assignRoles(gameState);
  roleIndex = 0;
  privateMode = 'cover';
  showScreen('mission-play');
  renderRoleReveal();
}

function loadMissionSettingsForm() {
  const settings = getMissionSettings();
  setInputValue('mission-setting-default-players', settings.playerCount);
  setInputValue('mission-setting-default-cpus', settings.cpuCount);
  setInputValue('mission-setting-rounds', settings.rounds);
  setInputValue('mission-setting-discussion', settings.discussionSeconds);
  setInputValue('mission-setting-voting', settings.votingSeconds);
  setInputValue('mission-setting-cpu-difficulty', settings.cpuDifficulty);
  updateMissionSettingsLabels();
}

function collectMissionSettingsForm() {
  return {
    playerCount: Number.parseInt($('mission-setting-default-players')?.value, 10) || DEFAULT_MISSION_SETTINGS.playerCount,
    cpuCount: Number.parseInt($('mission-setting-default-cpus')?.value, 10) || 0,
    rounds: Number.parseInt($('mission-setting-rounds')?.value, 10) || DEFAULT_MISSION_SETTINGS.rounds,
    discussionSeconds: Number.parseInt($('mission-setting-discussion')?.value, 10) || DEFAULT_MISSION_SETTINGS.discussionSeconds,
    votingSeconds: Number.parseInt($('mission-setting-voting')?.value, 10) || DEFAULT_MISSION_SETTINGS.votingSeconds,
    cpuDifficulty: $('mission-setting-cpu-difficulty')?.value || DEFAULT_MISSION_SETTINGS.cpuDifficulty
  };
}

function saveMissionSettings(event) {
  event.preventDefault();
  const settings = collectMissionSettingsForm();
  writeJsonStorage(MISSION_SETTINGS_KEY, settings);
  applySettingsToSetup();
  const status = $('mission-settings-status');
  if (status) status.textContent = 'Configurações salvas.';
}

function resetMissionSettings() {
  writeJsonStorage(MISSION_SETTINGS_KEY, DEFAULT_MISSION_SETTINGS);
  loadMissionSettingsForm();
  applySettingsToSetup();
  const status = $('mission-settings-status');
  if (status) status.textContent = 'Configurações restauradas.';
}

function handlePrivateReveal() {
  privateMode = 'reveal';
  if (gameState.phase === 'roleReveal') return renderRoleReveal();
  if (gameState.phase === 'roomSelection') return renderRoomStep();
  if (gameState.phase === 'actionSelection' || gameState.phase === 'roomReveal') return renderActionStep();
  if (gameState.phase === 'voting') return renderVoteStep();
}

function nextRole() {
  roleIndex += 1;
  privateMode = 'cover';
  renderRoleReveal();
}

function nextRound() {
  gameState = startRound(gameState);
  if (isMultiHost()) {
    gameState = applyCpuRoomSelections(gameState, getCpuDifficulty());
    syncMissionDevices();
    return renderMultiHostWaiting('room');
  }
  roomIndex = 0;
  privateMode = 'cover';
  renderRoomStep();
}

function handleHostRoomSelected(message, player) {
  if (gameState?.phase !== 'roomSelection') return;
  gameState = chooseRoom(gameState, player.id, message.payload?.roomId);
  if (allPlayersSubmitted(gameState.roomSelections || {})) {
    gameState = revealRoomOccupancy(gameState);
    hostSession?.broadcast('PHASE_CHANGED', { fromPhase: 'roomSelection', toPhase: 'roomReveal', round: gameState.round });
    syncMissionDevices();
    return renderRoomReveal();
  }
  syncMissionDevices();
  renderMultiHostWaiting('room');
}

function handleHostActionSelected(message, player) {
  if (gameState?.phase !== 'actionSelection') return;
  const before = (gameState.roundActions || []).length;
  gameState = chooseAction(gameState, player.id, message.payload?.actionId, message.payload?.targetId || null);
  const after = (gameState.roundActions || []).length;
  if (after === before && !(gameState.roundActions || []).find(action => action.playerId === player.id)) {
    hostSession?.sendToPlayer(player.id, 'ERROR', { code: 'INVALID_ACTION', message: 'Ação inválida.' });
    return;
  }
  hostSession?.sendToPlayer(player.id, 'ACTION_CONFIRMED', { actionId: message.payload?.actionId, round: gameState.round });
  if (allPlayersSubmitted(Object.fromEntries((gameState.roundActions || []).map(action => [action.playerId, true])))) {
    gameState = resolveActions(gameState);
    if (gameState.phase !== 'final') gameState = generateLogs(gameState);
    hostSession?.broadcast('PHASE_CHANGED', { fromPhase: 'actionSelection', toPhase: gameState.phase, round: gameState.round });
    syncMissionDevices();
    return gameState.phase === 'final' ? renderFinal() : renderLogs();
  }
  syncMissionDevices();
  renderMultiHostWaiting('action');
}

function handleHostVoteSubmitted(message, player) {
  if (gameState?.phase !== 'voting') return;
  gameState = submitVote(gameState, player.id, message.payload?.targetId || 'skip');
  const voteMap = {
    ...(gameState.votes?.byPlayerId || {}),
    ...(gameState.votes?.skippedByPlayerId || {})
  };
  if (allPlayersSubmitted(voteMap)) {
    gameState = resolveVoting(gameState);
    hostSession?.broadcast(gameState.phase === 'final' ? 'GAME_ENDED' : 'VOTE_REVEALED', { publicState: getPublicState(gameState) });
    syncMissionDevices();
    return gameState.phase === 'final' ? renderFinal() : renderVoteReveal();
  }
  syncMissionDevices();
  renderMultiHostWaiting('vote');
}

function handleHostDeviceMessage(message, player) {
  if (message?.type === 'ROOM_SELECTED') return handleHostRoomSelected(message, player);
  if (message?.type === 'ACTION_SELECTED') return handleHostActionSelected(message, player);
  if (message?.type === 'VOTE_SUBMITTED') return handleHostVoteSubmitted(message, player);
}

function setJoinStatus(text) {
  const el = $('mission-join-status');
  if (el) el.textContent = text;
}

function handleDeviceMessage(message) {
  if (message?.type === 'PLAYER_JOINED') {
    setJoinStatus('Conectado. Aguarde o host iniciar.');
    return renderDeviceWaiting('Conectado. Aguarde o host iniciar.');
  }
  if (message?.type === 'PUBLIC_STATE_UPDATE') {
    devicePublicState = message.payload?.publicState || null;
    return renderDeviceByState();
  }
  if (message?.type === 'PRIVATE_STATE_UPDATE') {
    devicePrivateState = message.payload?.privateState || null;
    return renderDeviceByState();
  }
  if (message?.type === 'ERROR') {
    return renderDeviceWaiting(message.payload?.message || 'Erro na sessão.');
  }
}

function joinMissionSession() {
  const hostId = extractMissionJoinCode($('mission-join-code')?.value || getMissionJoinCodeFromUrl());
  const playerName = ($('mission-join-name')?.value || '').trim();
  if (!hostId || !playerName) {
    setJoinStatus('Informe nome e código da sessão.');
    return;
  }
  deviceSession?.close?.();
  devicePublicState = null;
  devicePrivateState = null;
  setJoinStatus('Conectando...');
  showScreen('mission-device');
  renderDeviceWaiting('Conectando ao host...');
  deviceSession = createMissionPlayerSession({
    hostId,
    playerName,
    onMessage: handleDeviceMessage,
    onError(message) {
      setJoinStatus(message || 'Erro ao conectar.');
      renderDeviceWaiting(message || 'Erro ao conectar.');
    },
    onClose() {
      renderDeviceWaiting('Conexão encerrada.');
    }
  });
}

function leaveDeviceSession() {
  deviceSession?.close?.();
  deviceSession = null;
  devicePublicState = null;
  devicePrivateState = null;
  showScreen('home');
}

function handleDeviceClick(event) {
  const button = event.target.closest('[data-mission-device-action]');
  if (!button || !deviceSession) return false;
  const action = button.dataset.missionDeviceAction;
  if (action === 'select-room') {
    deviceSession.send('ROOM_SELECTED', { roomId: button.dataset.roomId });
    renderDeviceWaiting('Sala enviada. Aguarde os outros jogadores.');
    return true;
  }
  if (action === 'select-action') {
    const chosen = devicePrivateState?.availableActions.find(item => item.id === button.dataset.actionId);
    if (chosen?.requiresTarget || chosen?.requiresRoomTarget) {
      pendingDeviceActionId = chosen.id;
      renderDeviceTargetSelection();
      return true;
    }
    deviceSession.send('ACTION_SELECTED', { actionId: button.dataset.actionId });
    renderDeviceWaiting('Ação enviada. Aguarde a resolução.');
    return true;
  }
  if (action === 'select-action-target') {
    deviceSession.send('ACTION_SELECTED', {
      actionId: pendingDeviceActionId,
      targetId: button.dataset.targetId
    });
    pendingDeviceActionId = '';
    renderDeviceWaiting('Ação enviada. Aguarde a resolução.');
    return true;
  }
  if (action === 'submit-vote') {
    deviceSession.send('VOTE_SUBMITTED', { targetId: button.dataset.targetId });
    renderDeviceWaiting('Voto enviado. Aguarde a revelação.');
    return true;
  }
  return false;
}

function handleMissionClick(event) {
  if (handleDeviceClick(event)) return;
  const nav = event.target.closest('[data-mission-nav]');
  if (nav) {
    event.preventDefault();
    clearInterval(discussionTimer);
    if (nav.dataset.missionNav === 'mission-setup') clearGameSession();
    showScreen(nav.dataset.missionNav);
    if (nav.dataset.missionNav === 'mission-settings') loadMissionSettingsForm();
    if (nav.dataset.missionNav === 'mission-setup') applySettingsToSetup();
    return;
  }

  const actionButton = event.target.closest('[data-mission-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.missionAction;

  if (action === 'continue-mission') return restoreGameSession();
  if (action === 'create-session') return createHostSession();
  if (action === 'join-session') return joinMissionSession();
  if (action === 'quick-mission') return startQuickMission();
  if (action === 'apply-preset') return applyMissionPreset(actionButton.dataset.presetId);
  if (action === 'reset-mission-settings') return resetMissionSettings();
  if (action === 'leave-device-session') return leaveDeviceSession();
  if (action === 'reveal-private') return handlePrivateReveal();
  if (action === 'hide-private') {
    privateMode = 'cover';
    if (gameState.phase === 'roomSelection') return renderRoomStep();
    if (gameState.phase === 'actionSelection' || gameState.phase === 'roomReveal') return renderActionStep();
    if (gameState.phase === 'voting') return renderVoteStep();
  }
  if (action === 'next-role') return nextRole();
  if (action === 'choose-room') {
    const player = currentPlayer(roomIndex);
    gameState = chooseRoom(gameState, player.id, actionButton.dataset.roomId);
    roomIndex += 1;
    privateMode = 'cover';
    return renderRoomStep();
  }
  if (action === 'start-actions') {
    if (isMultiHost()) {
      gameState = { ...gameState, phase: 'actionSelection' };
      gameState = applyCpuActionSelections(gameState, getCpuDifficulty());
      hostSession.broadcast('PHASE_CHANGED', { fromPhase: 'roomReveal', toPhase: 'actionSelection', round: gameState.round });
      syncMissionDevices();
      if (allPlayersSubmitted(Object.fromEntries((gameState.roundActions || []).map(item => [item.playerId, true])))) {
        gameState = resolveActions(gameState);
        if (gameState.phase !== 'final') gameState = generateLogs(gameState);
        syncMissionDevices();
        return gameState.phase === 'final' ? renderFinal() : renderLogs();
      }
      return renderMultiHostWaiting('action');
    }
    actionIndex = 0;
    privateMode = 'cover';
    return renderActionStep();
  }
  if (action === 'choose-action') {
    const player = currentPlayer(actionIndex);
    const privateState = getPrivateState(gameState, player.id);
    const chosenAction = privateState.availableActions.find(item => item.id === actionButton.dataset.actionId);
    if (chosenAction?.requiresTarget || chosenAction?.requiresRoomTarget) {
      pendingActionId = chosenAction.id;
      return renderTargetStep();
    }
    const confirmedName = player.name;
    gameState = chooseAction(gameState, player.id, actionButton.dataset.actionId);
    actionIndex += 1;
    privateMode = 'cover';
    return showActionToast(confirmedName, renderActionStep);
  }
  if (action === 'choose-action-target') {
    const player = currentPlayer(actionIndex);
    const confirmedName = player.name;
    gameState = chooseAction(gameState, player.id, pendingActionId, actionButton.dataset.targetId);
    pendingActionId = '';
    actionIndex += 1;
    privateMode = 'cover';
    return showActionToast(confirmedName, renderActionStep);
  }
  if (action === 'start-discussion') {
    gameState = startDiscussion(gameState);
    if (isMultiHost()) {
      hostSession.broadcast('DISCUSSION_STARTED', { round: gameState.round, publicState: getPublicState(gameState) });
      sendPublicStateToDevices();
      return renderDiscussion();
    }
    return startDiscussionTimer();
  }
  if (action === 'ask-cpu') {
    const human = getSoloHumanPlayer();
    if (human) gameState = askCpuQuestion(gameState, human.id, actionButton.dataset.playerId);
    return renderDiscussion();
  }
  if (action === 'accuse-cpu') {
    const human = getSoloHumanPlayer();
    if (human) gameState = accuseCpu(gameState, human.id, actionButton.dataset.playerId);
    return renderDiscussion();
  }
  if (action === 'start-voting') return beginVoting();
  if (action === 'skip-voting') return skipVoting();
  if (action === 'submit-vote') {
    const voter = currentPlayer(voteIndex);
    gameState = submitVote(gameState, voter.id, actionButton.dataset.targetId);
    voteIndex += 1;
    privateMode = 'cover';
    return renderVoteStep();
  }
  if (action === 'next-round') return nextRound();
}

function initMissionUi() {
  window.runMissionValidationSuite = runMissionValidationSuite;
  loadMissionSettingsForm();
  applySettingsToSetup();
  updateSetupMode();
  injectContinueButton();
  renderHomeLastResult();
  $('trustnoone-player-count')?.addEventListener('input', () => {
    clearActiveMissionPreset();
    updateRangeLabels();
    renderSetupPlayers();
  });
  $('trustnoone-cpu-count')?.addEventListener('input', () => {
    clearActiveMissionPreset();
    updateRangeLabels();
    renderSetupPlayers();
  });
  $('trustnoone-rounds')?.addEventListener('input', () => {
    clearActiveMissionPreset();
    updateRangeLabels();
  });
  $('trustnoone-cpu-difficulty')?.addEventListener('change', clearActiveMissionPreset);
  $('trustnoone-single-device')?.addEventListener('change', () => {
    clearActiveMissionPreset();
    updateSetupMode();
  });
  $('trustnoone-setup-form')?.addEventListener('submit', startGame);
  $('trustnoone-settings-form')?.addEventListener('submit', saveMissionSettings);
  [
    'mission-setting-default-players',
    'mission-setting-default-cpus',
    'mission-setting-rounds',
    'mission-setting-discussion',
    'mission-setting-voting'
  ].forEach(id => $(id)?.addEventListener('input', updateMissionSettingsLabels));
  document.addEventListener('click', handleMissionClick);
  const joinCode = getMissionJoinCodeFromUrl();
  if (joinCode) {
    const input = $('mission-join-code');
    if (input) input.value = joinCode;
    showScreen('home');
    $('mission-join-name')?.focus();
  }
}

initMissionUi();
