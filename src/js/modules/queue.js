/**
 * Cable Specimen Producer — Job Queue Management Module
 * Queue table rendering, item reordering, job deletion, quick additions, and modal dispatch scheduling.
 */

import { dom } from '../utils/dom.js';
import { state } from '../state/store.js';
import { showToast } from './settings.js';
import { switchView } from './navigation.js';

/**
 * Re-renders the job queue table rows based on state.queue array.
 */
export function renderQueueTable() {
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

/**
 * Moves a queue item up (-1) or down (+1) in execution order with bounds checking.
 * @param {number} index
 * @param {number} direction
 */
export function moveQueueItem(index, direction) {
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= state.queue.length) return;
  const temp = state.queue[index];
  state.queue[index] = state.queue[targetIdx];
  state.queue[targetIdx] = temp;
  renderQueueTable();
}

/**
 * Deletes a queue item with operator confirmation prompt.
 * @param {number} index
 */
export function deleteQueueItem(index) {
  const item = state.queue[index];
  if (!item) return;
  if (typeof confirm !== 'function' || confirm(`Remove ${item.id} from queue?`)) {
    state.queue.splice(index, 1);
    renderQueueTable();
  }
}

/**
 * Generates and appends a sequential job to the queue.
 */
export function addQueueJob() {
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

/**
 * Opens the Job Creation modal overlay.
 */
export function openModal() {
  if (dom.modal) dom.modal.classList.add('show');
}

/**
 * Closes the Job Creation modal overlay.
 */
export function closeModal() {
  if (dom.modal) dom.modal.classList.remove('show');
}

/**
 * Submits the Job Creation form, inserting the job according to scheduling choice.
 */
export function submitJob() {
  const scheduleEl = document.querySelector('input[name="job-schedule"]:checked');
  const schedule = scheduleEl ? scheduleEl.value : 'queue-last';
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
      let pos = dom.jobCustomPosInput ? parseInt(dom.jobCustomPosInput.value, 10) : 1;
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

/**
 * Binds queue controls and modal event listeners.
 */
export function initQueue() {
  if (dom.btnAddQueueJob) dom.btnAddQueueJob.addEventListener('click', addQueueJob);
  if (dom.btnSidebarCreate) dom.btnSidebarCreate.addEventListener('click', openModal);
  const topbarCreate = document.getElementById('btn-topbar-create');
  if (topbarCreate) topbarCreate.addEventListener('click', openModal);
  if (dom.btnCloseModal) dom.btnCloseModal.addEventListener('click', closeModal);
  if (dom.btnCancelJob) dom.btnCancelJob.addEventListener('click', closeModal);
  if (dom.btnSubmitJob) dom.btnSubmitJob.addEventListener('click', submitJob);
  if (dom.btnSidebarRun) {
    dom.btnSidebarRun.addEventListener('click', () => {
      showToast('New job execution started.', 'success');
      switchView('current-job');
    });
  }
}
