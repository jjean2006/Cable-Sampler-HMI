/**
 * Cable Specimen Producer — Centralized Mutable State Store
 * Holds reactive HMI state shared across all functional modules.
 */

import { INITIAL_STATE, WORKFLOW_STEPS, INITIAL_QUEUE } from '../config/constants.js';

export const state = {
  currentView: INITIAL_STATE.currentView,
  isPaused: INITIAL_STATE.isPaused,
  isEstop: INITIAL_STATE.isEstop,
  uptimeSeconds: INITIAL_STATE.uptimeSeconds,
  cycleElapsedSeconds: INITIAL_STATE.cycleElapsedSeconds,
  cycleTotalSeconds: INITIAL_STATE.cycleTotalSeconds,
  activeStepIndex: INITIAL_STATE.activeStepIndex,
  specimenCurrent: INITIAL_STATE.specimenCurrent,
  specimenTotal: INITIAL_STATE.specimenTotal,
  workflowSteps: WORKFLOW_STEPS.map(step => ({ ...step })),
  queue: INITIAL_QUEUE.map(job => ({ ...job }))
};
