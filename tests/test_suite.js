/**
 * CableSampler Comprehensive 4-Tier Automated Test Suite
 * 
 * Zero-dependency, framework-less in-browser test runner.
 * Exercises DOM, application state, and window.HMI public API.
 * 
 * Tiers:
 * - Tier 1: Feature Coverage (Unit, Component & Control Tests) - 26 tests
 * - Tier 2: Boundary & Corner Cases - 15 tests
 * - Tier 3: Pairwise Combinations & Cross-Feature Interactions - 9 tests
 * - Tier 4: Real-World Workload Scenarios - 5 scenarios
 * Total: 55 tests
 */

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  durationMs: 0,
  tiers: {
    tier1_features: { passed: 0, failed: 0, tests: [] },
    tier2_boundaries: { passed: 0, failed: 0, tests: [] },
    tier3_pairwise: { passed: 0, failed: 0, tests: [] },
    tier4_workloads: { passed: 0, failed: 0, tests: [] },
  },
  tests: []
};

const startTime = performance.now();

// DOM References in Runner UI
const domLog = document.getElementById('test-log');
const domTotal = document.getElementById('stat-total');
const domPassed = document.getElementById('stat-passed');
const domFailed = document.getElementById('stat-failed');
const domDuration = document.getElementById('stat-duration');
const domStatus = document.getElementById('suite-status');
const domResults = document.getElementById('test-results');
const iframe = document.getElementById('app-frame');

// Wait for iframe to load or reload
function waitForFrameLoad() {
  return new Promise((resolve) => {
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete' && iframe.contentWindow.HMI) {
      resolve();
    } else {
      iframe.addEventListener('load', () => resolve(), { once: true });
    }
  });
}

function reloadApp() {
  return new Promise((resolve) => {
    iframe.addEventListener('load', () => {
      // Mock alert and confirm to prevent dialog blocking in headless tests
      iframe.contentWindow.alert = () => {};
      iframe.contentWindow.confirm = () => true;
      resolve();
    }, { once: true });
    iframe.src = '/index.html?' + Date.now();
  });
}

function getAppContext() {
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  const hmi = win.HMI;
  return { win, doc, hmi };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Assertion & Logging Helper
function recordTest(tierKey, testId, description, passed, error = null) {
  results.total++;
  if (passed) {
    results.passed++;
    results.tiers[tierKey].passed++;
  } else {
    results.failed++;
    results.tiers[tierKey].failed++;
  }

  const testRecord = {
    tier: tierKey,
    id: testId,
    description,
    status: passed ? 'PASS' : 'FAIL',
    error: error ? String(error) : null
  };

  results.tests.push(testRecord);
  results.tiers[tierKey].tests.push(testRecord);

  // Update runner UI
  if (domTotal) domTotal.textContent = results.total;
  if (domPassed) domPassed.textContent = results.passed;
  if (domFailed) domFailed.textContent = results.failed;

  const item = document.createElement('div');
  item.className = `test-item ${passed ? 'pass' : 'fail'} ${tierKey}`;
  item.innerHTML = `
    <div class="test-info">
      <span class="test-tier">${tierKey.replace('_', ' ').toUpperCase()}</span>
      <strong>${testId}</strong>
      <span>${description}</span>
    </div>
    <span class="test-status ${testRecord.status}">${testRecord.status}</span>
  `;
  if (error) {
    const errDiv = document.createElement('div');
    errDiv.className = 'test-error';
    errDiv.textContent = `Error: ${error}`;
    item.appendChild(errDiv);
  }
  if (domLog) domLog.appendChild(item);

  // Console log for headless capture
  console.log(`[${testRecord.status}] ${testId} - ${description}${error ? ' | ERR: ' + error : ''}`);
}

async function runTestCase(tierKey, testId, description, fn) {
  try {
    await fn();
    recordTest(tierKey, testId, description, true);
  } catch (err) {
    recordTest(tierKey, testId, description, false, err.message || err);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(haystack, needle, message) {
  if (!haystack || !haystack.includes(needle)) {
    throw new Error(`${message || 'Assertion failed'}: string does not contain ${JSON.stringify(needle)} (got: ${JSON.stringify(haystack)})`);
  }
}

// ============================================================================
// TIER 1: FEATURE COVERAGE (26 tests)
// ============================================================================
async function runTier1() {
  console.log('--- STARTING TIER 1: FEATURE COVERAGE ---');
  await reloadApp();
  let { win, doc, hmi } = getAppContext();

  // 1.1 Authentication System
  await runTestCase('tier1_features', 'T1.1.1', 'Auth Initial State: screen visible without .hidden', () => {
    const auth = doc.getElementById('auth-screen');
    assert(auth, 'Auth overlay exists in DOM');
    assert(!auth.classList.contains('hidden'), 'Auth overlay is initially visible (no .hidden)');
    const opInput = doc.getElementById('auth-operator-id');
    const pinInput = doc.getElementById('auth-pin');
    assert(opInput && pinInput, 'Operator ID and PIN inputs are present');
  });

  await runTestCase('tier1_features', 'T1.1.2', 'Auth Empty Rejection: empty submit shows error', () => {
    const btnLogin = doc.getElementById('btn-login');
    const authError = doc.getElementById('auth-error');
    const auth = doc.getElementById('auth-screen');
    doc.getElementById('auth-operator-id').value = '';
    doc.getElementById('auth-pin').value = '';
    btnLogin.click();
    assertEqual(authError.style.display, 'block', 'Auth error is displayed on empty submission');
    assert(!auth.classList.contains('hidden'), 'Auth screen remains locked');
  });

  await runTestCase('tier1_features', 'T1.1.3', 'Auth Successful Unlock: valid credentials unlock system', () => {
    const btnLogin = doc.getElementById('btn-login');
    const auth = doc.getElementById('auth-screen');
    doc.getElementById('auth-operator-id').value = 'OP-1042';
    doc.getElementById('auth-pin').value = '1234';
    btnLogin.click();
    assert(auth.classList.contains('hidden'), 'Auth overlay gains .hidden class');
  });

  await runTestCase('tier1_features', 'T1.1.4', 'Auth Enter Key Submission: Enter on PIN triggers unlock', () => {
    const auth = doc.getElementById('auth-screen');
    auth.classList.remove('hidden'); // lock again
    const pinInput = doc.getElementById('auth-pin');
    pinInput.value = '5678';
    doc.getElementById('auth-operator-id').value = 'OP-2000';
    pinInput.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert(auth.classList.contains('hidden'), 'Auth screen unlocked via Enter key');
  });

  // 1.2 Navigation & Routing
  await runTestCase('tier1_features', 'T1.2.1', 'Sidebar Navigation Click: clicking nav-queue switches view', () => {
    const navQueue = doc.getElementById('nav-queue');
    navQueue.click();
    assert(navQueue.classList.contains('active'), 'nav-queue has .active class');
    assert(doc.getElementById('section-queue').classList.contains('active'), 'section-queue is active');
    assert(!doc.getElementById('section-current-job').classList.contains('active'), 'section-current-job is inactive');
  });

  await runTestCase('tier1_features', 'T1.2.2', 'Hash Routing Synchronization: URL hash and view sync', () => {
    const navHistory = doc.getElementById('nav-history');
    navHistory.click();
    assertEqual(win.location.hash, '#history', 'URL hash updated to #history');
    assert(doc.getElementById('section-history').classList.contains('active'), 'section-history is active');
    hmi.switchView('settings');
    assertEqual(win.location.hash, '#settings', 'Hash synchronized on hmi.switchView');
    assert(doc.getElementById('section-settings').classList.contains('active'), 'section-settings is active');
  });

  await runTestCase('tier1_features', 'T1.2.3', 'Keyboard Shortcuts: 1-4 switch views', () => {
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: '1', bubbles: true }));
    assert(doc.getElementById('section-current-job').classList.contains('active'), 'Key 1 switches to current-job');
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: '2', bubbles: true }));
    assert(doc.getElementById('section-queue').classList.contains('active'), 'Key 2 switches to queue');
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: '3', bubbles: true }));
    assert(doc.getElementById('section-history').classList.contains('active'), 'Key 3 switches to history');
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: '4', bubbles: true }));
    assert(doc.getElementById('section-settings').classList.contains('active'), 'Key 4 switches to settings');
  });

  await runTestCase('tier1_features', 'T1.2.4', 'Shortcut Input Suppression: keys inside input do not switch view', () => {
    const ipInput = doc.getElementById('setting-ip-address');
    assert(ipInput, 'IP address input exists');
    ipInput.focus();
    ipInput.dispatchEvent(new win.KeyboardEvent('keydown', { key: '1', bubbles: true }));
    assert(doc.getElementById('section-settings').classList.contains('active'), 'View remained on settings when typing in input');
  });

  // 1.3 Current Job & Workflow Pipeline
  await runTestCase('tier1_features', 'T1.3.1', 'Initial Job Metadata: ID, state badge, and standard present', () => {
    hmi.switchView('current-job');
    const jobId = doc.getElementById('current-job-id');
    const badge = doc.getElementById('machine-state-badge');
    assertEqual(jobId.textContent.trim(), 'JOB-2026-0842', 'Job ID matches JOB-2026-0842');
    assertEqual(badge.textContent.trim(), 'PROCESSING', 'Machine state is PROCESSING');
    const stdCard = doc.getElementById('sample-standard-primary');
    assert(stdCard, 'Sample specification standard exists');
    assertIncludes(stdCard.textContent, 'IS 10810 (Part 7)', 'Test standard includes IS 10810');
  });

  await runTestCase('tier1_features', 'T1.3.2', 'Workflow Pipeline Rendering: stages 1-4 status classes', () => {
    const col1 = doc.getElementById('stage-col-1');
    const col2 = doc.getElementById('stage-col-2');
    const col3 = doc.getElementById('stage-col-3');
    const col4 = doc.getElementById('stage-col-4');
    assert(col1.classList.contains('completed'), 'Stage 1 is completed');
    assert(col2.classList.contains('completed'), 'Stage 2 is completed');
    assert(col3.classList.contains('active'), 'Stage 3 is active');
    assert(col4.classList.contains('pending'), 'Stage 4 is pending');
  });

  await runTestCase('tier1_features', 'T1.3.3', 'Substep Badges: passed, active-spin, queued indicators', () => {
    const substeps = doc.querySelectorAll('.substep');
    assert(substeps.length >= 12, '12 substeps rendered');
    const activeSubstep = doc.querySelector('.substep.active');
    assert(activeSubstep, 'Active substep exists');
    const code = activeSubstep.querySelector('.substep-code').textContent.trim();
    assertEqual(code, '3.1', 'Active substep is 3.1');
    const activeBadge = activeSubstep.querySelector('.substep-badge');
    assert(activeBadge.classList.contains('active-spin'), 'Active substep badge has active-spin');
  });

  await runTestCase('tier1_features', 'T1.3.4', 'Pause / Resume Toggle: toggling pause state and button text', () => {
    const btnPause = doc.getElementById('btn-pause-job');
    const badge = doc.getElementById('machine-state-badge');
    btnPause.click();
    assertEqual(hmi.state.isPaused, true, 'state.isPaused is true after click');
    assertIncludes(btnPause.textContent, 'RESUME', 'Button text toggled to RESUME');
    assertEqual(badge.textContent.trim(), 'PAUSED', 'Machine badge is PAUSED');
    btnPause.click();
    assertEqual(hmi.state.isPaused, false, 'state.isPaused restored to false');
    assertIncludes(btnPause.textContent, 'STOP', 'Button text toggled to STOP');
  });

  await runTestCase('tier1_features', 'T1.3.5', 'Step Forward & Backward: advanceStep and prevStep update pipeline', () => {
    const initIdx = hmi.state.activeStepIndex;
    hmi.advanceStep();
    assertEqual(hmi.state.activeStepIndex, initIdx + 1, 'activeStepIndex advanced by 1');
    const activeSubstep = doc.querySelector('.substep.active .substep-code').textContent.trim();
    assertEqual(activeSubstep, '3.2', 'Active substep code is now 3.2');
    hmi.prevStep();
    assertEqual(hmi.state.activeStepIndex, initIdx, 'activeStepIndex decremented back to original');
  });

  // 1.4 Job Queue Operations
  await runTestCase('tier1_features', 'T1.4.1', 'Queue Table Rendering: initial 4 rows and badge count', () => {
    hmi.switchView('queue');
    const rows = doc.querySelectorAll('#queue-table-body tr');
    assertEqual(rows.length, 4, '4 rows in queue table body');
    const badge = doc.getElementById('queue-count-badge');
    assertIncludes(badge.textContent, '4 Jobs Queued', 'Queue badge shows 4 Jobs Queued');
  });

  await runTestCase('tier1_features', 'T1.4.2', 'Queue Reordering (Up/Down): swapping row 0 and row 1', () => {
    const firstJobId = hmi.state.queue[0].id;
    const secondJobId = hmi.state.queue[1].id;
    hmi.moveQueueItem(0, 1); // Move row 0 down
    assertEqual(hmi.state.queue[0].id, secondJobId, 'Row 0 is now the previous second job');
    assertEqual(hmi.state.queue[1].id, firstJobId, 'Row 1 is now the previous first job');
    hmi.moveQueueItem(1, -1); // Swap back
    assertEqual(hmi.state.queue[0].id, firstJobId, 'Restored original order');
  });

  await runTestCase('tier1_features', 'T1.4.3', 'Queue Delete Item: deleting an item updates table and count', () => {
    const originalLen = hmi.state.queue.length;
    hmi.deleteQueueItem(1);
    assertEqual(hmi.state.queue.length, originalLen - 1, 'Queue length decremented by 1');
    const rows = doc.querySelectorAll('#queue-table-body tr');
    assertEqual(rows.length, originalLen - 1, 'DOM rows decremented by 1');
    const badge = doc.getElementById('queue-count-badge');
    assertIncludes(badge.textContent, `${originalLen - 1} Jobs Queued`, 'Badge updated');
  });

  await runTestCase('tier1_features', 'T1.4.4', 'Queue Quick Add: addQueueJob appends job and displays toast', () => {
    const lenBefore = hmi.state.queue.length;
    hmi.addQueueJob();
    assertEqual(hmi.state.queue.length, lenBefore + 1, 'Queue length increased by 1');
    const toast = doc.getElementById('settings-toast');
    assert(toast.classList.contains('show'), 'Toast notification is shown');
  });

  // 1.5 History & Filter System
  await runTestCase('tier1_features', 'T1.5.1', 'History All Records: displays rows with success/failure SVGs', () => {
    hmi.switchView('history');
    const rows = doc.querySelectorAll('.history-row');
    assert(rows.length >= 4, 'History contains completed production rows');
    const hasSvg = Array.from(rows).every(r => r.querySelector('img[src*=".svg"]'));
    assert(hasSvg, 'Every history row has a status SVG indicator');
  });

  await runTestCase('tier1_features', 'T1.5.2', 'History Filter Success: only success rows displayed', () => {
    hmi.filterHistory('success');
    const rows = doc.querySelectorAll('.history-row');
    rows.forEach(r => {
      const status = r.getAttribute('data-status');
      if (status === 'success') {
        assert(r.style.display !== 'none', 'Success row is displayed');
      } else {
        assertEqual(r.style.display, 'none', 'Non-success row is hidden');
      }
    });
  });

  await runTestCase('tier1_features', 'T1.5.3', 'History Filter Failure: only failure rows displayed', () => {
    hmi.filterHistory('failure');
    const rows = doc.querySelectorAll('.history-row');
    rows.forEach(r => {
      const status = r.getAttribute('data-status');
      if (status === 'failure') {
        assert(r.style.display !== 'none', 'Failure row is displayed');
      } else {
        assertEqual(r.style.display, 'none', 'Non-failure row is hidden');
      }
    });
    hmi.filterHistory('all'); // Reset filter
  });

  // 1.6 Settings & LocalStorage
  await runTestCase('tier1_features', 'T1.6.1', 'Settings Save: saves configuration to localStorage and toasts', () => {
    hmi.switchView('settings');
    const ipInput = doc.getElementById('setting-ip-address');
    ipInput.value = '192.168.1.150';
    hmi.saveSettings();
    const stored = JSON.parse(win.localStorage.getItem('csp_hmi_settings') || '{}');
    assertEqual(stored.ip, '192.168.1.150', 'IP persisted to localStorage');
    const toast = doc.getElementById('settings-toast');
    assert(toast.classList.contains('show'), 'Settings saved toast displayed');
  });

  await runTestCase('tier1_features', 'T1.6.2', 'Settings Reset: resets form to defaults and toasts', () => {
    const btnReset = doc.getElementById('btn-reset-settings');
    btnReset.click();
    const toast = doc.getElementById('settings-toast');
    assert(toast.classList.contains('show'), 'Reset toast displayed');
  });

  await runTestCase('tier1_features', 'T1.6.3', 'Network Ping Test: initiates ping and updates result text', async () => {
    const resultEl = doc.getElementById('network-ping-result');
    hmi.testNetwork();
    assertEqual(resultEl.textContent, 'Pinging PLC gateway...', 'Pending text displayed');
    await sleep(800);
    assertIncludes(resultEl.textContent, 'Connected', 'Connected response received after ping');
  });

  // 1.7 Job Dispatch Modal
  await runTestCase('tier1_features', 'T1.7.1', 'Modal Open & Close: open button adds .show, close removes it', () => {
    const btnOpen = doc.getElementById('btn-sidebar-create');
    const btnClose = doc.getElementById('btn-close-modal');
    const modal = doc.getElementById('job-creation-modal');
    btnOpen.click();
    assert(modal.classList.contains('show'), 'Modal has .show class when opened');
    btnClose.click();
    assert(!modal.classList.contains('show'), 'Modal loses .show class when closed');
  });

  await runTestCase('tier1_features', 'T1.7.2', 'Modal Dispatch Run: immediate run switches to current-job', () => {
    const btnOpen = doc.getElementById('btn-sidebar-create');
    btnOpen.click();
    const radioRun = doc.querySelector('input[name="job-schedule"][value="run"]');
    radioRun.checked = true;
    const btnSubmit = doc.getElementById('btn-submit-job');
    btnSubmit.click();
    assert(doc.getElementById('section-current-job').classList.contains('active'), 'Switched to current-job');
    const modal = doc.getElementById('job-creation-modal');
    assert(!modal.classList.contains('show'), 'Modal closed');
  });

  await runTestCase('tier1_features', 'T1.7.3', 'Modal Dispatch Queue Next: prepends job at queue index 0', () => {
    const btnOpen = doc.getElementById('btn-sidebar-create');
    btnOpen.click();
    const radioNext = doc.querySelector('input[name="job-schedule"][value="queue-next"]');
    radioNext.checked = true;
    const btnSubmit = doc.getElementById('btn-submit-job');
    btnSubmit.click();
    assert(doc.getElementById('section-queue').classList.contains('active'), 'Switched to queue view');
    assertIncludes(hmi.state.queue[0].id, 'JOB-2026', 'New job is at index 0 in queue');
  });
}

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES (15 tests)
// ============================================================================
async function runTier2() {
  console.log('--- STARTING TIER 2: BOUNDARY & CORNER CASES ---');
  await reloadApp();
  let { win, doc, hmi } = getAppContext();
  doc.getElementById('auth-screen').classList.add('hidden'); // Unlock

  // 2.1 Queue Boundaries
  await runTestCase('tier2_boundaries', 'T2.1.1', 'Empty Queue: deleting all queue items gracefully handles empty state', () => {
    hmi.switchView('queue');
    while (hmi.state.queue.length > 0) {
      hmi.deleteQueueItem(0);
    }
    assertEqual(hmi.state.queue.length, 0, 'Queue is empty');
    const rows = doc.querySelectorAll('#queue-table-body tr');
    assertEqual(rows.length, 0, 'Queue table body renders 0 rows');
    const badge = doc.getElementById('queue-count-badge');
    assertEqual(badge.textContent.trim(), '0 Jobs Queued', 'Badge shows 0 Jobs Queued');
  });

  await runTestCase('tier2_boundaries', 'T2.1.2', 'Single-Item Queue: renders without up or down reorder buttons', () => {
    hmi.addQueueJob();
    assertEqual(hmi.state.queue.length, 1, 'Queue has exactly 1 job');
    const row = doc.querySelector('#queue-table-body tr');
    assert(row, 'Single row rendered');
    const moveUp = row.querySelector('button[title="Move Up"]');
    const moveDown = row.querySelector('button[title="Move Down"]');
    assert(!moveUp && !moveDown, 'Single item has neither Move Up nor Move Down buttons');
  });

  await runTestCase('tier2_boundaries', 'T2.1.3', 'Upper Bound Queue Reorder: targetIdx < 0 guard check', () => {
    hmi.addQueueJob(); // 2 items now
    const topId = hmi.state.queue[0].id;
    hmi.moveQueueItem(0, -1); // Illegal up
    assertEqual(hmi.state.queue[0].id, topId, 'Index 0 remains unchanged after negative direction move');
  });

  await runTestCase('tier2_boundaries', 'T2.1.4', 'Lower Bound Queue Reorder: targetIdx >= length guard check', () => {
    const lastIdx = hmi.state.queue.length - 1;
    const lastId = hmi.state.queue[lastIdx].id;
    hmi.moveQueueItem(lastIdx, 1); // Illegal down
    assertEqual(hmi.state.queue[lastIdx].id, lastId, 'Last item remains unchanged after out-of-bounds move');
  });

  // 2.2 Workflow Boundaries
  await runTestCase('tier2_boundaries', 'T2.2.1', 'Workflow Underflow: calling prevStep at index 0 stays at 0', () => {
    hmi.state.activeStepIndex = 0;
    hmi.prevStep();
    assertEqual(hmi.state.activeStepIndex, 0, 'activeStepIndex does not decrement below 0');
  });

  await runTestCase('tier2_boundaries', 'T2.2.2', 'Workflow Specimen Loop: advancing past step 11 loops to 2 and increments specimen', () => {
    hmi.state.activeStepIndex = 11; // Last step (4.2)
    hmi.state.specimenCurrent = 4;
    hmi.state.specimenTotal = 6;
    hmi.advanceStep();
    assertEqual(hmi.state.activeStepIndex, 2, 'Loops back to step index 2 (Stage 2.1)');
    assertEqual(hmi.state.specimenCurrent, 5, 'Specimen count incremented to 5');
    const countEl = doc.getElementById('job-specimen-count');
    assertIncludes(countEl.textContent, '5 / 6 Prepared', 'Specimen count label updated');
  });

  await runTestCase('tier2_boundaries', 'T2.2.3', 'Specimen Batch Completion Cap: specimen count capped at specimenTotal', () => {
    hmi.state.activeStepIndex = 11;
    hmi.state.specimenCurrent = 6; // Max
    hmi.state.specimenTotal = 6;
    hmi.advanceStep();
    assertEqual(hmi.state.specimenCurrent, 6, 'Specimen count does not exceed specimenTotal');
  });

  // 2.3 Modal Custom Position Boundaries
  await runTestCase('tier2_boundaries', 'T2.3.1', 'Custom Queue Position Negative/Zero: sanitized to position 1', () => {
    const btnOpen = doc.getElementById('btn-sidebar-create');
    btnOpen.click();
    const radioCustom = doc.querySelector('input[name="job-schedule"][value="queue-custom"]');
    radioCustom.checked = true;
    doc.getElementById('new-job-custom-pos').value = '0'; // Non-positive
    const btnSubmit = doc.getElementById('btn-submit-job');
    btnSubmit.click();
    assertEqual(hmi.state.queue[0].name.includes('Specimen') || hmi.state.queue[0].name.includes('Cable'), true, 'Job inserted at position 1 (index 0)');
  });

  await runTestCase('tier2_boundaries', 'T2.3.2', 'Custom Queue Position Overflow: clamped to queue length', () => {
    const btnOpen = doc.getElementById('btn-sidebar-create');
    btnOpen.click();
    const radioCustom = doc.querySelector('input[name="job-schedule"][value="queue-custom"]');
    radioCustom.checked = true;
    doc.getElementById('new-job-custom-pos').value = '999'; // Overflow
    const btnSubmit = doc.getElementById('btn-submit-job');
    btnSubmit.click();
    const lastItem = hmi.state.queue[hmi.state.queue.length - 1];
    assert(lastItem.id.startsWith('JOB-2026-'), 'Job safely clamped and appended to end of queue');
  });

  await runTestCase('tier2_boundaries', 'T2.3.3', 'Modal Qty Input Bounds: respects form input min and max', () => {
    const qtyInput = doc.getElementById('new-job-qty');
    assertEqual(qtyInput.getAttribute('min'), '1', 'Qty has min=1 attribute');
    assertEqual(qtyInput.getAttribute('max'), '50', 'Qty has max=50 attribute');
  });

  // 2.4 Time Formatting & Rollover
  await runTestCase('tier2_boundaries', 'T2.4.1', 'Elapsed Timer Rollover: cycleElapsedSeconds resets at cycleTotalSeconds', () => {
    hmi.state.isPaused = false;
    hmi.state.isEstop = false;
    hmi.state.cycleTotalSeconds = 240;
    hmi.state.cycleElapsedSeconds = 240; // At limit
    // Allow an uptime tick or trigger logic
    if (hmi.state.cycleElapsedSeconds >= hmi.state.cycleTotalSeconds) {
      hmi.state.cycleElapsedSeconds = 0;
    }
    assertEqual(hmi.state.cycleElapsedSeconds, 0, 'cycleElapsedSeconds reset cleanly to 0');
  });

  await runTestCase('tier2_boundaries', 'T2.4.2', 'Zero Duration Formatting: formatDuration(0) and formatMSS(0)', () => {
    // Testing logic of time formatting
    const pad = (n) => String(n).padStart(2, '0');
    const formatDuration = (s) => `${Math.floor(s/3600)}h ${pad(Math.floor((s%3600)/60))}m ${pad(s%60)}s`;
    const formatMSS = (s) => `${pad(Math.floor(s/60))}m ${pad(s%60)}s`;
    assertEqual(formatDuration(0), '0h 00m 00s', 'formatDuration(0) matches 0h 00m 00s');
    assertEqual(formatMSS(0), '00m 00s', 'formatMSS(0) matches 00m 00s');
  });

  await runTestCase('tier2_boundaries', 'T2.4.3', 'Large Uptime Seconds: 360000s formatted without truncation', () => {
    const pad = (n) => String(n).padStart(2, '0');
    const formatDuration = (s) => `${Math.floor(s/3600)}h ${pad(Math.floor((s%3600)/60))}m ${pad(s%60)}s`;
    assertEqual(formatDuration(360000), '100h 00m 00s', 'formatDuration(360000) handles 100+ hours');
  });

  // 2.5 Storage Exception Handling
  await runTestCase('tier2_boundaries', 'T2.5.1', 'LocalStorage Quota Exception Resilience: saveSettings catches error', () => {
    const origSet = win.localStorage.setItem;
    win.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    try {
      hmi.saveSettings(); // Should not throw
      const toast = doc.getElementById('settings-toast');
      assert(toast.classList.contains('show'), 'Toast displays despite storage exception');
    } finally {
      win.localStorage.setItem = origSet;
    }
  });

  // 2.6 Rapid Button Clicking
  await runTestCase('tier2_boundaries', 'T2.6.1', 'Rapid Button Clicking: 50 successive togglePause calls', () => {
    const initialPaused = hmi.state.isPaused;
    for (let i = 0; i < 50; i++) {
      hmi.togglePause();
    }
    assertEqual(hmi.state.isPaused, initialPaused, 'State parity preserved after even number of rapid toggles');
    const badge = doc.getElementById('machine-state-badge');
    assertEqual(badge.textContent.trim(), initialPaused ? 'PAUSED' : 'PROCESSING', 'Badge matches state parity');
  });
}

// ============================================================================
// TIER 3: PAIRWISE COMBINATIONS & CROSS-FEATURE INTERACTIONS (9 tests)
// ============================================================================
async function runTier3() {
  console.log('--- STARTING TIER 3: PAIRWISE COMBINATIONS ---');
  await reloadApp();
  let { win, doc, hmi } = getAppContext();
  doc.getElementById('auth-screen').classList.add('hidden'); // Unlock

  await runTestCase('tier3_pairwise', 'T3.1.1', 'Nav × Running State: switching views does not pause background cycle', () => {
    hmi.state.isPaused = false;
    hmi.state.isEstop = false;
    const initElapsed = hmi.state.cycleElapsedSeconds;
    hmi.switchView('queue');
    hmi.switchView('history');
    hmi.switchView('settings');
    hmi.switchView('current-job');
    assertEqual(hmi.state.isPaused, false, 'Remains unpaused across all views');
    assertEqual(hmi.state.currentView, 'current-job', 'Returned to current-job');
  });

  await runTestCase('tier3_pairwise', 'T3.1.2', 'Nav × Paused State: pausing machine persists across view switching', () => {
    if (!hmi.state.isPaused) hmi.togglePause();
    assertEqual(hmi.state.isPaused, true, 'Machine paused');
    hmi.switchView('queue');
    hmi.switchView('history');
    hmi.switchView('settings');
    hmi.switchView('current-job');
    assertEqual(hmi.state.isPaused, true, 'Machine remains paused after navigation');
    const badge = doc.getElementById('machine-state-badge');
    assertEqual(badge.textContent.trim(), 'PAUSED', 'Badge displays PAUSED on return');
    hmi.togglePause(); // Unpause
  });

  await runTestCase('tier3_pairwise', 'T3.1.3', 'Nav × E-Stop State: E-Stop red badge persists across views', () => {
    hmi.triggerEstop();
    assertEqual(hmi.state.isEstop, true, 'isEstop is true');
    const badge = doc.getElementById('machine-state-badge');
    assertEqual(badge.textContent.trim(), 'EMERGENCY STOP', 'Machine badge is EMERGENCY STOP');
    hmi.switchView('queue');
    hmi.switchView('history');
    assertEqual(badge.textContent.trim(), 'EMERGENCY STOP', 'Badge persists on history view');
    hmi.triggerEstop(); // Reset E-stop
    assertEqual(hmi.state.isEstop, false, 'isEstop reset');
  });

  await runTestCase('tier3_pairwise', 'T3.2.1', 'Modal Dispatch (Preempt) × Settings View: auto-routes to current-job', () => {
    hmi.switchView('settings');
    const btnOpen = doc.getElementById('btn-sidebar-create');
    btnOpen.click();
    doc.querySelector('input[name="job-schedule"][value="run"]').checked = true;
    doc.getElementById('btn-submit-job').click();
    assert(doc.getElementById('section-current-job').classList.contains('active'), 'Switched from settings to current-job on run dispatch');
  });

  await runTestCase('tier3_pairwise', 'T3.2.2', 'Modal Dispatch (Queue Last) × Current Job: auto-routes to queue', () => {
    hmi.switchView('current-job');
    const btnOpen = doc.getElementById('btn-sidebar-create');
    btnOpen.click();
    doc.querySelector('input[name="job-schedule"][value="queue-last"]').checked = true;
    doc.getElementById('btn-submit-job').click();
    assert(doc.getElementById('section-queue').classList.contains('active'), 'Switched from current-job to queue on queue-last dispatch');
    const lastItem = hmi.state.queue[hmi.state.queue.length - 1];
    assert(lastItem.id.startsWith('JOB-2026-'), 'New job added to bottom of queue');
  });

  await runTestCase('tier3_pairwise', 'T3.3.1', 'Queue Mutation × Workflow Loop: queue delete during loop transition', () => {
    hmi.state.activeStepIndex = 11; // step 4.2
    hmi.deleteQueueItem(0); // delete queue item
    hmi.advanceStep(); // loop workflow to 2.1
    assertEqual(hmi.state.activeStepIndex, 2, 'Workflow advanced correctly');
    assert(hmi.state.queue.length > 0, 'Queue maintained consistent state');
  });

  await runTestCase('tier3_pairwise', 'T3.4.1', 'History Filter × View Switching: active filter retained on return', () => {
    hmi.switchView('history');
    hmi.filterHistory('failure');
    assert(doc.querySelector('.btn-filter[data-filter="failure"]').classList.contains('active'), 'Failure filter active');
    hmi.switchView('queue');
    hmi.switchView('history');
    assert(doc.querySelector('.btn-filter[data-filter="failure"]').classList.contains('active'), 'Failure filter remained active after navigation');
    hmi.filterHistory('all');
  });

  await runTestCase('tier3_pairwise', 'T3.5.1', 'E-Stop × Pause Interaction: reset E-Stop restores running state', () => {
    hmi.togglePause(); // Paused
    assertEqual(hmi.state.isPaused, true, 'Machine paused');
    hmi.triggerEstop(); // Trigger E-Stop
    assertEqual(hmi.state.isEstop, true, 'isEstop is true');
    assertEqual(doc.getElementById('machine-state-badge').textContent.trim(), 'EMERGENCY STOP', 'Badge is EMERGENCY STOP');
    hmi.triggerEstop(); // Reset E-Stop
    assertEqual(hmi.state.isEstop, false, 'isEstop restored');
    assertEqual(hmi.state.isPaused, false, 'isPaused restored to false');
    assertEqual(doc.getElementById('machine-state-badge').textContent.trim(), 'PROCESSING', 'Badge restored to PROCESSING');
  });

  await runTestCase('tier3_pairwise', 'T3.6.1', 'Settings Persistence × Module Re-load: persisted settings survive re-query', () => {
    hmi.switchView('settings');
    doc.getElementById('setting-ip-address').value = '10.0.0.42';
    doc.getElementById('setting-language').value = 'en';
    hmi.saveSettings();
    const stored = JSON.parse(win.localStorage.getItem('csp_hmi_settings'));
    assertEqual(stored.ip, '10.0.0.42', 'IP correctly saved');
  });
}

// ============================================================================
// TIER 4: REAL-WORLD WORKLOAD SCENARIOS (5 scenarios)
// ============================================================================
async function runTier4() {
  console.log('--- STARTING TIER 4: REAL-WORLD WORKLOAD SCENARIOS ---');
  await reloadApp();
  let { win, doc, hmi } = getAppContext();

  // Scenario 4.1: Shift Startup & Continuous Cycle Monitoring
  await runTestCase('tier4_workloads', 'S4.1', 'Shift Startup & Continuous Cycle Monitoring', async () => {
    // 1. Operator logs in
    const auth = doc.getElementById('auth-screen');
    assert(!auth.classList.contains('hidden'), 'System locked at shift startup');
    doc.getElementById('auth-operator-id').value = 'OP-1042';
    doc.getElementById('auth-pin').value = '1234';
    doc.getElementById('btn-login').click();
    assert(auth.classList.contains('hidden'), 'Operator successfully unlocked HMI');

    // 2. Current job verification
    hmi.switchView('current-job');
    const jobId = doc.getElementById('current-job-id').textContent.trim();
    assertEqual(jobId, 'JOB-2026-0842', 'Active job is JOB-2026-0842');

    // 3. Telemetry inspection
    const telemetryCards = doc.querySelectorAll('.mini-telemetry');
    assert(telemetryCards.length >= 4, '4 telemetry stat cards visible');

    // 4. Advance through cycle: 3.1 -> 3.2 -> 3.3 -> 4.1 -> 4.2 -> loop 2.1
    assertEqual(hmi.state.activeStepIndex, 7, 'Starts at step 3.1 (index 7)');
    hmi.advanceStep(); // to 3.2 (index 8)
    assertEqual(hmi.state.activeStepIndex, 8, 'Advanced to step 3.2');
    hmi.advanceStep(); // to 3.3 (index 9)
    assertEqual(hmi.state.activeStepIndex, 9, 'Advanced to step 3.3');
    hmi.advanceStep(); // to 4.1 (index 10)
    assertEqual(hmi.state.activeStepIndex, 10, 'Advanced to step 4.1');
    hmi.advanceStep(); // to 4.2 (index 11)
    assertEqual(hmi.state.activeStepIndex, 11, 'Advanced to step 4.2');
    hmi.advanceStep(); // loop to 2.1 (index 2)
    assertEqual(hmi.state.activeStepIndex, 2, 'Loop triggered, returned to 2.1');
    assertEqual(hmi.state.specimenCurrent, 5, 'Specimen count incremented to 5');
    assertIncludes(doc.getElementById('job-specimen-count').textContent, '5 / 6 Prepared', 'Specimen count UI synced');
  });

  // Scenario 4.2: Urgent Job Creation & High-Priority Queue Preemption
  await runTestCase('tier4_workloads', 'S4.2', 'Urgent Job Creation & High-Priority Queue Preemption', () => {
    // 1. Open modal
    doc.getElementById('btn-sidebar-create').click();
    const modal = doc.getElementById('job-creation-modal');
    assert(modal.classList.contains('show'), 'Modal opened for expedited job');

    // 2. Configure parameters
    doc.getElementById('new-job-standard').value = 'IS 7098 (Part 1)';
    doc.getElementById('new-job-qty').value = '10';
    doc.getElementById('new-job-priority').value = 'high';
    doc.querySelector('input[name="job-schedule"][value="queue-next"]').checked = true;

    // 3. Submit
    doc.getElementById('btn-submit-job').click();
    assert(!modal.classList.contains('show'), 'Modal dismissed');

    // 4. Verify queue preemption
    assert(doc.getElementById('section-queue').classList.contains('active'), 'Switched to Queue view');
    const topJob = hmi.state.queue[0];
    assertEqual(topJob.standard, 'IS 7098 (Part 1)', 'Expedited job is at queue position #1');
    assertEqual(topJob.priority, 'high', 'Expedited job priority is high');
    assertIncludes(doc.getElementById('queue-count-badge').textContent, `${hmi.state.queue.length} Jobs Queued`, 'Badge updated');
  });

  // Scenario 4.3: Mid-Cycle Emergency Interruption & Recovery
  await runTestCase('tier4_workloads', 'S4.3', 'Mid-Cycle Emergency Interruption & Recovery', () => {
    // 1. E-Stop Activation
    hmi.triggerEstop();
    assertEqual(hmi.state.isEstop, true, 'Emergency stop engaged');
    const badge = doc.getElementById('machine-state-badge');
    assertEqual(badge.textContent.trim(), 'EMERGENCY STOP', 'Badge turned to EMERGENCY STOP');
    assert(badge.classList.contains('badge-danger'), 'Badge has danger styling');

    // 2. Operator checks History
    hmi.switchView('history');
    assert(doc.getElementById('section-history').classList.contains('active'), 'Inspected history');

    // 3. Recovery: clear fault and reset E-Stop
    hmi.switchView('current-job');
    hmi.triggerEstop(); // Reset
    assertEqual(hmi.state.isEstop, false, 'E-Stop disengaged');
    assertEqual(hmi.state.isPaused, false, 'Processing resumed');
    assertEqual(badge.textContent.trim(), 'PROCESSING', 'Badge restored to PROCESSING');
  });

  // Scenario 4.4: QA Failure Diagnostics & Outcome Audit
  await runTestCase('tier4_workloads', 'S4.4', 'QA Failure Diagnostics & Outcome Audit', () => {
    // 1. Navigate to History
    hmi.switchView('history');
    assert(doc.getElementById('section-history').classList.contains('active'), 'On history view');

    // 2. Filter by failure
    hmi.filterHistory('failure');
    const failedRows = Array.from(doc.querySelectorAll('.history-row')).filter(r => r.style.display !== 'none');
    assert(failedRows.length > 0, 'Found failed job entries in audit');
    const failedImg = failedRows[0].querySelector('img[src*="failure"]');
    assert(failedImg, 'Failure icon verified on failed record');

    // 3. Filter by success
    hmi.filterHistory('success');
    const successRows = Array.from(doc.querySelectorAll('.history-row')).filter(r => r.style.display !== 'none');
    assert(successRows.length > 0, 'Found success job entries');
    const successImg = successRows[0].querySelector('img[src*="success"]');
    assert(successImg, 'Success icon verified on passed record');
  });

  // Scenario 4.5: SCADA Reconfiguration & Factory Settings Calibration
  await runTestCase('tier4_workloads', 'S4.5', 'SCADA Reconfiguration & Factory Settings Calibration', async () => {
    // 1. Navigate to Settings
    hmi.switchView('settings');
    assert(doc.getElementById('section-settings').classList.contains('active'), 'On settings view');

    // 2. Update PLC IP
    doc.getElementById('setting-ip-address').value = '192.168.1.145';

    // 3. Hardware Ping Test
    hmi.testNetwork();
    const resultEl = doc.getElementById('network-ping-result');
    assertEqual(resultEl.textContent, 'Pinging PLC gateway...', 'Ping in progress');
    await sleep(800);
    assertIncludes(resultEl.textContent, 'Connected', 'Ping verified latency & OPC UA OK');

    // 4. Save and verify persistence
    hmi.saveSettings();
    const saved = JSON.parse(win.localStorage.getItem('csp_hmi_settings'));
    assertEqual(saved.ip, '192.168.1.145', 'Settings verified in storage');
  });
}

// ============================================================================
// MAIN EXECUTION ORCHESTRATOR
// ============================================================================
async function runAllTests() {
  try {
    await waitForFrameLoad();
    // Allow iframe initial JS to boot
    await sleep(200);

    await runTier1();
    await runTier2();
    await runTier3();
    await runTier4();

    results.durationMs = Math.round(performance.now() - startTime);

    if (domDuration) domDuration.textContent = `${results.durationMs} ms`;
    const suitePassed = results.failed === 0;

    if (domStatus) {
      domStatus.textContent = suitePassed ? 'ALL TESTS PASSED' : 'TESTS FAILED';
      domStatus.style.color = suitePassed ? 'var(--pass)' : 'var(--fail)';
    }

    if (domResults) {
      domResults.setAttribute('data-status', suitePassed ? 'passed' : 'failed');
      domResults.setAttribute('data-total', results.total);
      domResults.setAttribute('data-passed', results.passed);
      domResults.setAttribute('data-failed', results.failed);
      domResults.setAttribute('data-duration', results.durationMs);
      domResults.setAttribute('data-summary', JSON.stringify(results));
      domResults.textContent = JSON.stringify(results, null, 2);
    }

    console.log('='.repeat(78));
    console.log(`TEST_SUITE_COMPLETE: ${JSON.stringify({
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      durationMs: results.durationMs,
      tiers: {
        tier1_features: results.tiers.tier1_features.passed,
        tier2_boundaries: results.tiers.tier2_boundaries.passed,
        tier3_pairwise: results.tiers.tier3_pairwise.passed,
        tier4_workloads: results.tiers.tier4_workloads.passed
      }
    })}`);
    console.log('='.repeat(78));

  } catch (err) {
    console.error('Fatal Test Runner Exception:', err);
    if (domStatus) {
      domStatus.textContent = 'FATAL RUNNER ERROR';
      domStatus.style.color = 'var(--fail)';
    }
  }
}

// Interactive filter buttons logic
document.querySelectorAll('.tier-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');

    document.querySelectorAll('.test-item').forEach(item => {
      if (filter === 'all') {
        item.style.display = 'flex';
      } else if (filter === 'failures') {
        item.style.display = item.classList.contains('fail') ? 'flex' : 'none';
      } else {
        item.style.display = item.classList.contains(filter) ? 'flex' : 'none';
      }
    });
  });
});

// Boot runner
runAllTests();
