/**
 * Cable Specimen Producer — Cached DOM Query & Accessor Utilities
 * Defensive null-safe DOM references with dynamic getter evaluation.
 */

export const dom = {
  get clock() { return typeof document !== 'undefined' ? document.getElementById('header-clock') : null; },
  get headerUptime() { return typeof document !== 'undefined' ? document.getElementById('header-uptime') : null; },
  get currentJobUptime() { return typeof document !== 'undefined' ? document.getElementById('current-job-uptime') : null; },
  get navItems() { return typeof document !== 'undefined' ? document.querySelectorAll('.nav-item') : []; },
  get sections() { return typeof document !== 'undefined' ? document.querySelectorAll('.hmi-section') : []; },
  get btnEstop() { return typeof document !== 'undefined' ? document.getElementById('btn-estop') : null; },
  get btnNextStep() { return typeof document !== 'undefined' ? document.getElementById('btn-next-step') : null; },
  get btnPrevStep() { return typeof document !== 'undefined' ? document.getElementById('btn-prev-step') : null; },
  get btnPauseJob() { return typeof document !== 'undefined' ? document.getElementById('btn-pause-job') : null; },
  get progressPercent() { return typeof document !== 'undefined' ? document.getElementById('job-progress-percent') : null; },
  get progressFill() { return typeof document !== 'undefined' ? document.getElementById('job-progress-fill') : null; },
  get elapsedTime() { return typeof document !== 'undefined' ? document.getElementById('job-elapsed-time') : null; },
  get etaTime() { return typeof document !== 'undefined' ? document.getElementById('job-eta-time') : null; },
  get machineBadge() { return typeof document !== 'undefined' ? document.getElementById('machine-state-badge') : null; },
  get queueTableBody() { return typeof document !== 'undefined' ? document.getElementById('queue-table-body') : null; },
  get queueBadge() { return typeof document !== 'undefined' ? document.getElementById('queue-count-badge') : null; },
  get filterBtns() { return typeof document !== 'undefined' ? document.querySelectorAll('.btn-filter') : []; },
  get historyRows() { return typeof document !== 'undefined' ? document.querySelectorAll('.history-row') : []; },
  get settingsForm() { return typeof document !== 'undefined' ? document.getElementById('hmi-settings-form') : null; },
  get btnSaveSettings() { return typeof document !== 'undefined' ? document.getElementById('btn-save-settings') : null; },
  get btnResetSettings() { return typeof document !== 'undefined' ? document.getElementById('btn-reset-settings') : null; },
  get btnTestNetwork() { return typeof document !== 'undefined' ? document.getElementById('btn-test-network') : null; },
  get networkResult() { return typeof document !== 'undefined' ? document.getElementById('network-ping-result') : null; },
  get settingsToast() { return typeof document !== 'undefined' ? document.getElementById('settings-toast') : null; },
  get btnAddQueueJob() { return typeof document !== 'undefined' ? document.getElementById('btn-add-queue-job') : null; },
  get btnSidebarCreate() { return typeof document !== 'undefined' ? document.getElementById('btn-sidebar-create') : null; },
  get modal() { return typeof document !== 'undefined' ? document.getElementById('job-creation-modal') : null; },
  get btnCloseModal() { return typeof document !== 'undefined' ? document.getElementById('btn-close-modal') : null; },
  get btnCancelJob() { return typeof document !== 'undefined' ? document.getElementById('btn-cancel-job') : null; },
  get btnSubmitJob() { return typeof document !== 'undefined' ? document.getElementById('btn-submit-job') : null; },
  get jobStandardInput() { return typeof document !== 'undefined' ? document.getElementById('new-job-standard') : null; },
  get jobQtyInput() { return typeof document !== 'undefined' ? document.getElementById('new-job-qty') : null; },
  get jobPriorityInput() { return typeof document !== 'undefined' ? document.getElementById('new-job-priority') : null; },
  get jobCustomPosInput() { return typeof document !== 'undefined' ? document.getElementById('new-job-custom-pos') : null; },
  get btnSidebarRun() { return typeof document !== 'undefined' ? document.getElementById('btn-sidebar-run') : null; },

  // Selector helper utilities
  get: (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null),
  getAll: (selector) => (typeof document !== 'undefined' ? document.querySelectorAll(selector) : [])
};
