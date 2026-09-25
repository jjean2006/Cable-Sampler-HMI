/**
 * Cable Specimen Producer — Job History Module
 * Filters completed production run records by execution outcome (All, Success, Failure).
 */

import { dom } from '../utils/dom.js';

/**
 * Filters the Job History table rows based on status ('all', 'success', 'failure').
 * @param {string} filter
 */
export function filterHistory(filter) {
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

/**
 * Initializes filter button event listeners.
 */
export function initHistory() {
  dom.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      if (filter) filterHistory(filter);
    });
  });
}
