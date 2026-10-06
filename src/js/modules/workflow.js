/**
 * Cable Specimen Producer — Workflow & Stage Pipeline Module
 * 4-stage pipeline, 12 substeps, cycle progress calculations, and machine pause/e-stop control.
 */

import { state } from '../state/store.js';
import { formatDuration, formatMSS } from '../utils/formatters.js';

/**
 * Synchronizes stages 1-4, detail cards, connectors, and 12 substep badges.
 */
export function renderWorkflowUI() {
  const activeStep = state.workflowSteps[state.activeStepIndex];
  if (!activeStep) return;
  const currentStageNum = activeStep.stage;

  // 1. Update Stages Pipeline (Top pipeline)
  for (let s = 1; s <= 4; s++) {
    const stageCol = document.getElementById(`stage-col-${s}`);
    const connector = document.getElementById(`connector-${s}`);

    if (stageCol) {
      stageCol.classList.remove('completed', 'active', 'pending');
      const statusText = stageCol.querySelector('.stage-status-text');

      if (s < currentStageNum) {
        stageCol.classList.add('completed');
        if (statusText) statusText.textContent = 'Completed';
      } else if (s === currentStageNum) {
        stageCol.classList.add('active');
        if (statusText) statusText.textContent = `In Progress (Step ${activeStep.code})`;
      } else {
        stageCol.classList.add('pending');
        if (statusText) statusText.textContent = 'Pending';
      }
    }

    if (connector) {
      if (s < currentStageNum) {
        connector.classList.add('completed');
      } else {
        connector.classList.remove('completed');
      }
    }
  }

  // 2. Update Stage Detail Blocks & Substep List
  for (let s = 1; s <= 4; s++) {
    const block = document.querySelector(`.stage-detail-block[data-stage="${s}"]`);
    if (!block) continue;

    block.classList.remove('completed', 'active', 'pending');
    const tag = block.querySelector('.status-tag');

    if (s < currentStageNum) {
      block.classList.add('completed');
      if (tag) {
        tag.className = 'status-tag success';
        tag.textContent = 'Completed';
      }
    } else if (s === currentStageNum) {
      block.classList.add('active');
      if (tag) {
        tag.className = 'status-tag active';
        tag.textContent = 'Active Stage';
      }
    } else {
      block.classList.add('pending');
      if (tag) {
        tag.className = 'status-tag pending';
        tag.textContent = 'Pending';
      }
    }
  }

  // Substeps
  const allSubstepEls = document.querySelectorAll('.substep');
  allSubstepEls.forEach(el => {
    const codeEl = el.querySelector('.substep-code');
    const badgeEl = el.querySelector('.substep-badge');
    if (!codeEl) return;
    const stepCode = codeEl.textContent.trim();

    const stepIdx = state.workflowSteps.findIndex(item => item.code === stepCode);
    if (stepIdx === -1) return;

    el.classList.remove('done', 'active', 'pending');
    if (badgeEl) badgeEl.className = 'substep-badge';

    if (stepIdx < state.activeStepIndex) {
      el.classList.add('done');
      if (badgeEl) {
        badgeEl.classList.add('done');
        badgeEl.textContent = 'Passed';
      }
    } else if (stepIdx === state.activeStepIndex) {
      el.classList.add('active');
      if (badgeEl) {
        badgeEl.classList.add('active-spin');
        badgeEl.textContent = 'In Progress...';
      }
    } else {
      el.classList.add('pending');
      if (badgeEl) {
        badgeEl.classList.add('pending');
        badgeEl.textContent = 'Queued';
      }
    }
  });
}

/**
 * Advances active step; loops from 4.2 back to 2.1, increments specimen count.
 */
export function advanceStep() {
  if (state.activeStepIndex < state.workflowSteps.length - 1) {
    state.activeStepIndex++;
  } else {
    // Loop back to 2.1 as specified in workflow.md
    state.activeStepIndex = 2;
    if (state.specimenCurrent < state.specimenTotal) {
      state.specimenCurrent++;
    }
    const countEl = document.getElementById('job-specimen-count');
    if (countEl) countEl.textContent = `${state.specimenCurrent} / ${state.specimenTotal} Prepared`;
  }
  renderWorkflowUI();
}

/**
 * Decrements active step with lower bound guard (>= 0).
 */
export function prevStep() {
  if (state.activeStepIndex > 0) {
    state.activeStepIndex--;
    renderWorkflowUI();
  }
}

/**
 * Flips machine pause state, updates button text (STOP vs RESUME) and machine badge.
 */
export function togglePause() {
  state.isPaused = !state.isPaused;
  if (document.getElementById('btn-pause-job')) {
    document.getElementById('btn-pause-job').innerHTML = state.isPaused ? '<span>RESUME</span>' : '<span>STOP</span>';
    document.getElementById('btn-pause-job').className = state.isPaused ? 'btn btn-sm btn-resume' : 'btn btn-sm btn-noisy-stop';
  }
  if (document.getElementById('machine-state-badge')) {
    document.getElementById('machine-state-badge').textContent = state.isPaused ? 'PAUSED' : 'PROCESSING';
    document.getElementById('machine-state-badge').className = state.isPaused ? 'badge badge-warning' : 'badge badge-success';
  }
}

/**
 * Triggers or resets Emergency Stop (E-Stop).
 */
export function triggerEstop() {
  state.isEstop = !state.isEstop;
  if (state.isEstop) {
    state.isPaused = true;
    if (document.getElementById('machine-state-badge')) {
      document.getElementById('machine-state-badge').textContent = 'EMERGENCY STOP';
      document.getElementById('machine-state-badge').className = 'badge badge-danger';
    }
    if (document.getElementById('btn-estop')) {
      document.getElementById('btn-estop').style.boxShadow = '0 0 16px rgba(239, 68, 68, 1)';
      document.getElementById('btn-estop').textContent = 'RESET STOP';
    }
    if (typeof alert === 'function') {
      alert('EMERGENCY STOP ACTIVATED: Cutter, feeder motors, and pneumatic clamps safely disengaged.');
    }
  } else {
    state.isPaused = false;
    if (document.getElementById('machine-state-badge')) {
      document.getElementById('machine-state-badge').textContent = 'PROCESSING';
      document.getElementById('machine-state-badge').className = 'badge badge-success';
    }
    if (document.getElementById('btn-estop')) {
      document.getElementById('btn-estop').style.boxShadow = '';
      document.getElementById('btn-estop').textContent = 'E-STOP';
    }
  }
}

/**
 * Advances cycle elapsed and uptime counters every 1 second, updating progress bars and ETA.
 */
export function updateCycleProgress() {
  state.uptimeSeconds += 1;
  const formatted = formatDuration(state.uptimeSeconds);
  if (document.getElementById('header-uptime')) document.getElementById('header-uptime').textContent = formatted;
  if (document.getElementById('current-job-uptime')) document.getElementById('current-job-uptime').textContent = formatted;

  // Advance cycle elapsed if running
  if (!state.isPaused && !state.isEstop) {
    state.cycleElapsedSeconds += 1;
    if (state.cycleElapsedSeconds > state.cycleTotalSeconds) {
      state.cycleElapsedSeconds = 0;
    }
    const pct = Math.min(100, Math.round((state.cycleElapsedSeconds / state.cycleTotalSeconds) * 100));
    const remaining = Math.max(0, state.cycleTotalSeconds - state.cycleElapsedSeconds);
    
    if (document.getElementById('job-progress-percent')) document.getElementById('job-progress-percent').textContent = `${pct}%`;
    if (document.getElementById('job-progress-fill')) document.getElementById('job-progress-fill').style.width = `${pct}%`;
    if (document.getElementById('job-elapsed-time')) document.getElementById('job-elapsed-time').textContent = formatMSS(state.cycleElapsedSeconds);
    if (document.getElementById('job-eta-time')) document.getElementById('job-eta-time').textContent = formatMSS(remaining);
  }
}

/**
 * Binds workflow button event listeners.
 */
export function initWorkflow() {
  if (document.getElementById('btn-next-step')) document.getElementById('btn-next-step').addEventListener('click', advanceStep);
  if (document.getElementById('btn-prev-step')) document.getElementById('btn-prev-step').addEventListener('click', prevStep);
  if (document.getElementById('btn-pause-job')) document.getElementById('btn-pause-job').addEventListener('click', togglePause);
  if (document.getElementById('btn-estop')) document.getElementById('btn-estop').addEventListener('click', triggerEstop);
}
