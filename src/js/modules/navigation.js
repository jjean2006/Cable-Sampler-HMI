/**
 * Cable Specimen Producer — Navigation & Routing Module
 * View switching, hash routing, and global keyboard shortcuts (F1-F4, 1-4, Spacebar).
 */

import { dom } from '../utils/dom.js';
import { state } from '../state/store.js';
import { togglePause } from './workflow.js';

/**
 * Switches the active HMI section view and synchronizes sidebar active classes & URL hash.
 * @param {string} targetView
 */
export function switchView(targetView) {
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

/**
 * Initializes navigation event handlers, hash change listener, and global keyboard shortcuts.
 */
export function initNavigation() {
  // Navigation menu items click
  dom.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      if (target) switchView(target);
    });
  });

  if (typeof window !== 'undefined') {
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

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;

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
  }
}
