import { createMissionConfig, createPublicMissionDraft } from './mission-state.js';

export function createMissionDraft(formData) {
  const config = createMissionConfig(formData);
  return createPublicMissionDraft(config);
}
