/**
 * Cable Specimen Producer — Centralized Mutable State Store
 * Holds reactive HMI state shared across all functional modules.
 */

import { INITIAL_STATE, WORKFLOW_STEPS, INITIAL_QUEUE } from '../config/constants.js?v=2801';

export const state = structuredClone({
  ...INITIAL_STATE,
  workflowSteps: WORKFLOW_STEPS,
  queue: INITIAL_QUEUE
});
