/**
 * Cable Specimen Producer — Industrial HMI Controller
 * Framework-less JavaScript implementation
 */

(function () {
  'use strict';

  // =========================================================================
  // State & Data
  // =========================================================================
  const state = {
    currentView: 'current-job',
    isPaused: false,
    isEstop: false,
    uptimeSeconds: 101672, // 28h 14m 32s
    cycleElapsedSeconds: 165, // 02m 45s
    cycleTotalSeconds: 240, // 04m 00s
    activeStepIndex: 7, // 0-indexed: corresponds to Step 3.2 (8th step)
    specimenCurrent: 4,
    specimenTotal: 6,
    
    // Workflow stages and substeps mapping exactly to workflow.md
    workflowSteps: [
      { stage: 1, stageTitle: 'Test and Parameter Setup', code: '1.1', desc: 'Operator Selection (Cable Type & Test Standard)' },
      { stage: 1, stageTitle: 'Test and Parameter Setup', code: '1.2', desc: 'Recipe Loading' },
      
      { stage: 2, stageTitle: 'Cable Preparation', code: '2.1', desc: 'Automated Feeding' },
      { stage: 2, stageTitle: 'Cable Preparation', code: '2.2', desc: 'Cable Detection' },
      { stage: 2, stageTitle: 'Cable Preparation', code: '2.3', desc: 'Diameter Sensing' },
      { stage: 2, stageTitle: 'Cable Preparation', code: '2.4', desc: 'Blade Depth Adjustment' },
      { stage: 2, stageTitle: 'Cable Preparation', code: '2.5', desc: 'Clamping and Positioning' },
      
      { stage: 3, stageTitle: 'Cutting and Extraction', code: '3.1', desc: 'Outer Sheath Stripping' },
      { stage: 3, stageTitle: 'Cutting and Extraction', code: '3.2', desc: 'Insulation Tube Extraction' },
      { stage: 3, stageTitle: 'Cutting and Extraction', code: '3.3', desc: 'Dumbbell Specimen Cutting' },
      
      { stage: 4, stageTitle: 'Finishing and Output', code: '4.1', desc: 'Gauge Line Marking' },
      { stage: 4, stageTitle: 'Finishing and Output', code: '4.2', desc: 'Tray Ejection (triggers Next Specimen Loop back to 2.1)' }
    ],

    queue: [
      {
        id: 'JOB-2026-0843',
        name: 'XLPE Sheath Dumbbell Production',
        standard: 'IS 7098 (Parts 1 & 2)',
        specimens: '6 pcs',
        startTime: '19:30:15 (+01m 15s)',
        duration: '04m 00s',
        priority: 'high'
      },
      {
        id: 'JOB-2026-0844',
        name: 'Tensile & Elongation Hot Set Sample',
        standard: 'IS 10810 (Parts 2, 7, 33)',
        specimens: '10 pcs',
        startTime: '19:34:15 (+05m 15s)',
        duration: '06m 15s',
        priority: 'normal'
      },
      {
        id: 'JOB-2026-0845',
        name: 'Single-Core Insulation Stripping',
        standard: 'IS 7098 (Part 1)',
        specimens: '4 pcs',
        startTime: '19:40:30 (+11m 30s)',
        duration: '03m 00s',
        priority: 'normal'
      },
      {
        id: 'JOB-2026-0846',
        name: 'Water Absorption Disc Sample Cut',
        standard: 'IS 10810 (Part 33)',
        specimens: '8 pcs',
        startTime: '19:43:30 (+14m 30s)',
        duration: '05m 15s',
        priority: 'low'
      }
    ]
  };

  // =========================================================================
  // DOM Elements Helper
  // =========================================================================
  const dom = {
    clock: document.getElementById('header-clock'),
    headerUptime: document.getElementById('header-uptime'),
    currentJobUptime: document.getElementById('current-job-uptime'),
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.hmi-section'),
    btnEstop: document.getElementById('btn-estop'),
    btnNextStep: document.getElementById('btn-next-step'),
    btnPrevStep: document.getElementById('btn-prev-step'),
    btnPauseJob: document.getElementById('btn-pause-job'),
    progressPercent: document.getElementById('job-progress-percent'),
    progressFill: document.getElementById('job-progress-fill'),
    elapsedTime: document.getElementById('job-elapsed-time'),
    etaTime: document.getElementById('job-eta-time'),
    machineBadge: document.getElementById('machine-state-badge'),
    queueTableBody: document.getElementById('queue-table-body'),
    queueBadge: document.getElementById('queue-count-badge'),
    filterBtns: document.querySelectorAll('.btn-filter'),
    historyRows: document.querySelectorAll('.history-row'),
    settingsForm: document.getElementById('hmi-settings-form'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnResetSettings: document.getElementById('btn-reset-settings'),
    btnTestNetwork: document.getElementById('btn-test-network'),
    networkResult: document.getElementById('network-ping-result'),
    settingsToast: document.getElementById('settings-toast'),
        btnAddQueueJob: document.getElementById('btn-add-queue-job'),
        btnSidebarCreate: document.getElementById('btn-sidebar-create'),
    modal: document.getElementById('job-creation-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelJob: document.getElementById('btn-cancel-job'),
    btnSubmitJob: document.getElementById('btn-submit-job'),
    jobStandardInput: document.getElementById('new-job-standard'),
    jobQtyInput: document.getElementById('new-job-qty'),
    jobPriorityInput: document.getElementById('new-job-priority'),
    jobCustomPosInput: document.getElementById('new-job-custom-pos')
  };

  // =========================================================================
  // Time & Uptime Formatting
  // =========================================================================
  function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  function formatMSS(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(minutes)}m ${pad(seconds)}s`;
  }

  function updateClock() {
    const now = new Date();
    if (dom.clock) {
      dom.clock.textContent = now.toTimeString().split(' ')[0];
    }
  }

  function updateUptime() {
    state.uptimeSeconds += 1;
    const formatted = formatDuration(state.uptimeSeconds);
    if (dom.headerUptime) dom.headerUptime.textContent = formatted;
    if (dom.currentJobUptime) dom.currentJobUptime.textContent = formatted;

    // Advance cycle elapsed if running
    if (!state.isPaused && !state.isEstop) {
      state.cycleElapsedSeconds += 1;
      if (state.cycleElapsedSeconds > state.cycleTotalSeconds) {
        state.cycleElapsedSeconds = 0;
      }
      const pct = Math.min(100, Math.round((state.cycleElapsedSeconds / state.cycleTotalSeconds) * 100));
      const remaining = Math.max(0, state.cycleTotalSeconds - state.cycleElapsedSeconds);
      
      if (dom.progressPercent) dom.progressPercent.textContent = `${pct}%`;
      if (dom.progressFill) dom.progressFill.style.width = `${pct}%`;
      if (dom.elapsedTime) dom.elapsedTime.textContent = formatMSS(state.cycleElapsedSeconds);
      if (dom.etaTime) dom.etaTime.textContent = formatMSS(remaining);
    }
  }

  // =========================================================================
  // Navigation View Switching
  // =========================================================================
  function switchView(targetView) {
    state.currentView = targetView;

    // Update nav items
    dom.navItems.forEach(item => {
      if (item.getAttribute('data-target') === targetView) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });

    // Update sections
    dom.sections.forEach(section => {
      if (section.id === `section-${targetView}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Update URL hash without jumping
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, null, `#${targetView}`);
    }
  }

  // =========================================================================
  // Workflow Step Management (workflow.md)
  // =========================================================================
  function renderWorkflowUI() {
    const activeStep = state.workflowSteps[state.activeStepIndex];
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

  function advanceStep() {
    if (state.activeStepIndex < state.workflowSteps.length - 1) {
      state.activeStepIndex++;
    } else {
      // Loop or specimen completion
      state.activeStepIndex = 2; // Loop back to 2.1 as specified in workflow.md
      if (state.specimenCurrent < state.specimenTotal) {
        state.specimenCurrent++;
      }
      const countEl = document.getElementById('job-specimen-count');
      if (countEl) countEl.textContent = `${state.specimenCurrent} / ${state.specimenTotal} Prepared`;
    }
    renderWorkflowUI();
  }

  function prevStep() {
    if (state.activeStepIndex > 0) {
      state.activeStepIndex--;
      renderWorkflowUI();
    }
  }

  function togglePause() {
    state.isPaused = !state.isPaused;
    if (dom.btnPauseJob) {
      dom.btnPauseJob.innerHTML = state.isPaused ? '<span>RESUME</span>' : '<span>STOP</span>';
      dom.btnPauseJob.className = state.isPaused ? 'btn btn-sm btn-resume' : 'btn btn-sm btn-noisy-stop';
    }
    if (dom.machineBadge) {
      dom.machineBadge.textContent = state.isPaused ? 'PAUSED' : 'PROCESSING';
      dom.machineBadge.className = state.isPaused ? 'badge badge-warning' : 'badge badge-success';
    }
  }

  function triggerEstop() {
    state.isEstop = !state.isEstop;
    if (state.isEstop) {
      state.isPaused = true;
      if (dom.machineBadge) {
        dom.machineBadge.textContent = 'EMERGENCY STOP';
        dom.machineBadge.className = 'badge badge-danger';
      }
      if (dom.btnEstop) {
        dom.btnEstop.style.boxShadow = '0 0 16px rgba(239, 68, 68, 1)';
        dom.btnEstop.textContent = 'RESET STOP';
      }
      alert('EMERGENCY STOP ACTIVATED: Cutter, feeder motors, and pneumatic clamps safely disengaged.');
    } else {
      state.isPaused = false;
      if (dom.machineBadge) {
        dom.machineBadge.textContent = 'PROCESSING';
        dom.machineBadge.className = 'badge badge-success';
      }
      if (dom.btnEstop) {
        dom.btnEstop.style.boxShadow = '';
        dom.btnEstop.textContent = 'E-STOP';
      }
    }
  }

  // =========================================================================
  // Job Queue Management
  // =========================================================================
  function renderQueueTable() {
    if (!dom.queueTableBody) return;
    dom.queueTableBody.innerHTML = '';

    state.queue.forEach((item, index) => {
      const tr = document.createElement('tr');
      const isFirst = index === 0;
      const isLast = index === state.queue.length - 1;

      tr.innerHTML = `
        <td class="mono">#${index + 1}</td>
        <td>
          <div class="job-name-cell">
            <strong class="job-code mono">${item.id}</strong>
            <span class="job-desc">${item.name}</span>
          </div>
        </td>
        <td>
          <span class="table-standard-pill mono">${item.standard}</span>
        </td>
        <td class="mono">${item.specimens}</td>
        <td><span class="mono ${isFirst ? 'highlight-time' : ''}">${item.startTime}</span></td>
        <td class="mono">${item.duration}</td>
        <td><span class="priority-badge ${item.priority}">${item.priority}</span></td>
        <td>
          ${!isFirst ? `<button class="table-action-btn" title="Move Up" onclick="window.HMI.moveQueueItem(${index}, -1)">↑</button>` : ''}
          ${!isLast ? `<button class="table-action-btn" title="Move Down" onclick="window.HMI.moveQueueItem(${index}, 1)">↓</button>` : ''}
          <button class="table-action-btn delete" title="Cancel Job" onclick="window.HMI.deleteQueueItem(${index})">✕</button>
        </td>
      `;
      dom.queueTableBody.appendChild(tr);
    });

    if (dom.queueBadge) {
      dom.queueBadge.textContent = `${state.queue.length} Jobs Queued`;
    }
  }

  function moveQueueItem(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= state.queue.length) return;
    const temp = state.queue[index];
    state.queue[index] = state.queue[targetIdx];
    state.queue[targetIdx] = temp;
    renderQueueTable();
  }

  function deleteQueueItem(index) {
    if (confirm(`Remove ${state.queue[index].id} from queue?`)) {
      state.queue.splice(index, 1);
      renderQueueTable();
    }
  }

  function addQueueJob() {
    const nextNum = 847 + state.queue.length;
    const newJob = {
      id: `JOB-2026-0${nextNum}`,
      name: 'IS 10810 / IS 7098 Cable Specimen Batch',
      standard: state.queue.length % 2 === 0 ? 'IS 10810 (Parts 2, 7, 33)' : 'IS 7098 (Parts 1 & 2)',
      specimens: '6 pcs',
      startTime: '+20m 00s',
      duration: '04m 15s',
      priority: 'normal'
    };
    state.queue.push(newJob);
    renderQueueTable();
    showToast(`Added ${newJob.id} to execution queue.`);
  }

  // =========================================================================
  // Job History Filter
  // =========================================================================
  function filterHistory(filter) {
    dom.filterBtns.forEach(btn => {
      if (btn.getAttribute('data-filter') === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const rows = document.querySelectorAll('.history-row');
    rows.forEach(row => {
      const status = row.getAttribute('data-status');
      if (filter === 'all' || status === filter) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

// =========================================================================
  // Settings Actions & Feedback
  // =========================================================================
  function showToast(message) {
    if (!dom.settingsToast) return;
    const msgEl = dom.settingsToast.querySelector('.toast-message');
    if (msgEl && message) msgEl.textContent = message;

    dom.settingsToast.classList.add('show');
    setTimeout(() => {
      dom.settingsToast.classList.remove('show');
    }, 3200);
  }

  function saveSettings() {
    const lang = document.getElementById('setting-language')?.value || 'en';
    const units = document.getElementById('setting-units-system')?.value || 'metric';
    const ip = document.getElementById('setting-ip-address')?.value || '192.168.1.120';

    try {
      localStorage.setItem('csp_hmi_settings', JSON.stringify({
        lang, units, ip, savedAt: new Date().toISOString()
      }));
    } catch (e) {
      // Ignore if localStorage unavailable
    }

    showToast('HMI Settings saved and applied successfully.');
  }

  function resetSettings() {
    if (dom.settingsForm) {
      dom.settingsForm.reset();
      showToast('Settings restored to factory calibration defaults.');
    }
  }

  function testNetwork() {
    if (dom.networkResult) {
      dom.networkResult.textContent = 'Pinging PLC gateway...';
      dom.networkResult.style.color = '#38bdf8';

      setTimeout(() => {
        dom.networkResult.textContent = 'Connected (Ping: 1.8ms | OPC UA OK)';
        dom.networkResult.style.color = '#10b981';
      }, 700);
    }
  }


  function openModal() {
    if (dom.modal) dom.modal.classList.add('show');
  }

  function closeModal() {
    if (dom.modal) dom.modal.classList.remove('show');
  }

  function submitJob() {
    const schedule = document.querySelector('input[name="job-schedule"]:checked').value;
    const standard = dom.jobStandardInput ? dom.jobStandardInput.value : 'Unknown Standard';
    const qty = dom.jobQtyInput ? dom.jobQtyInput.value : '6';
    const priority = dom.jobPriorityInput ? dom.jobPriorityInput.value : 'normal';
    
    if (schedule === 'run') {
      showToast(`Started new job: ${standard}`);
      switchView('current-job');
    } else {
      const nextNum = 847 + state.queue.length;
      const newJob = {
        id: `JOB-2026-0${nextNum}`,
        name: standard.includes('10810') ? 'IS 10810 Specimen Batch' : 'IS 7098 Cable Prep',
        standard: standard,
        specimens: `${qty} pcs`,
        startTime: '+00m 00s',
        duration: '05m 30s',
        priority: priority
      };
      
      if (schedule === 'queue-next') {
        state.queue.unshift(newJob);
        showToast(`Added JOB-2026-0${nextNum} as next in queue.`);
      } else if (schedule === 'queue-last') {
        state.queue.push(newJob);
        showToast(`Added JOB-2026-0${nextNum} to end of queue.`);
      } else if (schedule === 'queue-custom') {
        let pos = parseInt(dom.jobCustomPosInput.value, 10);
        if (isNaN(pos) || pos < 1) pos = 1;
        
        let insertIdx = pos - 1;
        if (insertIdx > state.queue.length) insertIdx = state.queue.length;
        
        state.queue.splice(insertIdx, 0, newJob);
        showToast(`Added JOB-2026-0${nextNum} to queue at position ${pos}.`);
      }
      
      renderQueueTable();
      switchView('queue');
    }
    closeModal();
  }

  // =========================================================================
  // Event Listeners & Initialization
  // =========================================================================
  function initEvents() {

    // Auth logic
    const authScreen = document.getElementById('auth-screen');
    const btnLogin = document.getElementById('btn-login');
    const authOpId = document.getElementById('auth-operator-id');
    const authPin = document.getElementById('auth-pin');
    const authError = document.getElementById('auth-error');

    if(btnLogin) {
      btnLogin.addEventListener('click', () => {
        if(authOpId.value.trim() !== '' && authPin.value.trim() !== '') {
          authScreen.classList.add('hidden');
          showToast('Operator ' + authOpId.value + ' authenticated.');
        } else {
          authError.style.display = 'block';
        }
      });
      
      authPin.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') btnLogin.click();
      });
    }

    // Navigation items
    dom.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        switchView(target);
      });
    });

    // Hash routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['current-job', 'queue', 'history', 'settings'].includes(hash)) {
        switchView(hash);
      }
    });

    // Initial hash check
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && ['current-job', 'queue', 'history', 'settings'].includes(initialHash)) {
      switchView(initialHash);
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === 'F1' || e.key === '1') {
        e.preventDefault();
        switchView('current-job');
      } else if (e.key === 'F2' || e.key === '2') {
        e.preventDefault();
        switchView('queue');
      } else if (e.key === 'F3' || e.key === '3') {
        e.preventDefault();
        switchView('history');
      } else if (e.key === 'F4' || e.key === '4') {
        e.preventDefault();
        switchView('settings');
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePause();
      }
    });

    // Current Job Controls
    if (dom.btnNextStep) dom.btnNextStep.addEventListener('click', advanceStep);
    if (dom.btnPrevStep) dom.btnPrevStep.addEventListener('click', prevStep);
    if (dom.btnPauseJob) dom.btnPauseJob.addEventListener('click', togglePause);
    if (dom.btnEstop) dom.btnEstop.addEventListener('click', triggerEstop);

        // Queue Controls
    if (dom.btnAddQueueJob) dom.btnAddQueueJob.addEventListener('click', addQueueJob);
        if (dom.btnSidebarCreate) dom.btnSidebarCreate.addEventListener('click', openModal);
    if (dom.btnCloseModal) dom.btnCloseModal.addEventListener('click', closeModal);
    if (dom.btnCancelJob) dom.btnCancelJob.addEventListener('click', closeModal);
    if (dom.btnSubmitJob) dom.btnSubmitJob.addEventListener('click', submitJob);
    if (dom.btnSidebarRun) dom.btnSidebarRun.addEventListener('click', () => {
      showToast('New job execution started.', 'success');
      switchView('current-job');
    });

    // History filter buttons
    dom.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        filterHistory(filter);
      });
    });

    // Settings actions
    if (dom.btnSaveSettings) dom.btnSaveSettings.addEventListener('click', saveSettings);
    if (dom.btnResetSettings) dom.btnResetSettings.addEventListener('click', resetSettings);
    if (dom.btnTestNetwork) dom.btnTestNetwork.addEventListener('click', testNetwork);
  }

  // =========================================================================
  // Initialize App
  // =========================================================================
  function init() {
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(updateUptime, 1000);
    initEvents();
    renderWorkflowUI();
    renderQueueTable();

    console.log('Cable Specimen Producer HMI initialized successfully.');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API for testing and automation
  window.HMI = {
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

})();
