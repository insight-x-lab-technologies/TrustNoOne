import { playUiTone } from '../../shared/audio.js';
import { showScreen, setText } from '../../shared/ui.js';
import { createMissionDraft } from './mission-engine.js';

const STORAGE_KEY = 'mm_trustnoone_last_setup_v1';

function getSetupElements() {
  return {
    form: document.getElementById('trustnoone-setup-form'),
    matchName: document.getElementById('trustnoone-match-name'),
    playerCount: document.getElementById('trustnoone-player-count'),
    playerCountValue: document.getElementById('trustnoone-player-count-value'),
    rounds: document.getElementById('trustnoone-rounds'),
    roundsValue: document.getElementById('trustnoone-rounds-value'),
    singleDevice: document.getElementById('trustnoone-single-device'),
    summary: document.getElementById('trustnoone-setup-summary')
  };
}

function updateRangeLabel(input, output) {
  if (input && output) output.textContent = input.value;
}

function readSetupForm() {
  const elements = getSetupElements();
  return {
    matchName: elements.matchName?.value,
    playerCount: elements.playerCount?.value,
    rounds: elements.rounds?.value,
    singleDevice: elements.singleDevice?.checked !== false
  };
}

function saveDraft(draft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function renderDraftSummary(draft) {
  setText(
    'trustnoone-setup-summary',
    `${draft.matchName} | ${draft.playerCount} jogadores | ${draft.rounds} rodadas | ${draft.settingName} | single-device`
  );
}

function handleSetupSubmit(event) {
  event.preventDefault();
  const draft = createMissionDraft(readSetupForm());
  saveDraft(draft);
  renderDraftSummary(draft);
  playUiTone(720);
}

function bindSetupForm() {
  const elements = getSetupElements();
  if (!elements.form) return;

  updateRangeLabel(elements.playerCount, elements.playerCountValue);
  updateRangeLabel(elements.rounds, elements.roundsValue);

  elements.playerCount?.addEventListener('input', () => updateRangeLabel(elements.playerCount, elements.playerCountValue));
  elements.rounds?.addEventListener('input', () => updateRangeLabel(elements.rounds, elements.roundsValue));
  elements.form.addEventListener('submit', handleSetupSubmit);
}

function bindMissionNavigation() {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-mission-nav]');
    if (!button) return;
    event.preventDefault();
    playUiTone();
    showScreen(button.dataset.missionNav);
  });
}

export function initTrustNoOneHostUi() {
  bindMissionNavigation();
  bindSetupForm();
}
