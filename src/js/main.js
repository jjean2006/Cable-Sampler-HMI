/**
 * Cable Specimen Producer — Industrial HMI Modular Coordinator (ES6+)
 * Framework-less JavaScript implementation
 *
 * Bootstraps all feature modules, initiates clock & uptime intervals,
 * and mounts the public window.HMI controller interface.
 */

import { dom } from './utils/dom.js';
import { state } from './state/store.js';
import { formatDuration, formatMSS } from './utils/formatters.js';
import { initMobile } from './modules/mobile.js';
import { initAuth } from './modules/auth.js';
import { switchView, initNavigation } from './modules/navigation.js';
import {
  renderWorkflowUI,
  advanceStep,
  prevStep,
  togglePause,
  triggerEstop,
  updateCycleProgress,
  initWorkflow
} from './modules/workflow.js';
import {
  renderQueueTable,
  moveQueueItem,
  deleteQueueItem,
  addQueueJob,
  openModal,
  closeModal,
  submitJob,
  initQueue
} from './modules/queue.js';
import { filterHistory, initHistory } from './modules/history.js';
import {
  showToast,
  saveSettings,
  resetSettings,
  loadSettings,
  testNetwork,
  initSettings
} from './modules/settings.js';

/**
 * Updates wall clock display if header-clock element exists.
 */
function updateClock() {
  const now = new Date();
  if (dom.clock) {
    dom.clock.textContent = now.toTimeString().split(' ')[0];
  }
}

// ============================================================================
// Public window.HMI API Contract
// ============================================================================
const HMI = {
  state,
  switchView,
  advanceStep,
  prevStep,
  togglePause,
  triggerEstop,
  moveQueueItem,
  deleteQueueItem,
  addQueueJob,
  filterHistory,
  saveSettings,
  resetSettings,
  testNetwork,
  showToast
};

if (typeof window !== 'undefined') {
  window.HMI = HMI;
}

/**
 * Initializes and mounts all feature modules and starts periodic timer loops.
 */
export function init() {
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(updateCycleProgress, 1000);

  initAuth();
  initNavigation();
  initWorkflow();
  initQueue();
  initHistory();
  initSettings();
  initMobile();


  renderWorkflowUI();
  renderQueueTable();

  console.log('Cable Specimen Producer HMI initialized successfully.');
}

// Bootstrap application when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export {
  state,
  switchView,
  advanceStep,
  prevStep,
  togglePause,
  triggerEstop,
  moveQueueItem,
  deleteQueueItem,
  addQueueJob,
  filterHistory,
  saveSettings,
  resetSettings,
  testNetwork,
  showToast,
  openModal,
  closeModal,
  submitJob,
  renderWorkflowUI,
  renderQueueTable,
  updateCycleProgress,
  updateClock,
  formatDuration,
  formatMSS,
  dom,
  HMI
};

export default HMI;
