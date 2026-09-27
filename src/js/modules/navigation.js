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

  // Sync mobile pill with smooth width animation
  if (typeof document !== 'undefined') {
    const mobileTrigger = document.getElementById('mobile-active-tab-trigger');
    const activeSidebarItem = document.querySelector(`.hmi-sidebar .nav-item[data-target="${targetView}"]`);
    if (mobileTrigger && activeSidebarItem) {
      const activeIcon = activeSidebarItem.querySelector('.nav-icon');
      const activeLabel = activeSidebarItem.querySelector('.nav-label');
      const triggerIcon = mobileTrigger.querySelector('.nav-icon');
      const triggerLabel = mobileTrigger.querySelector('.nav-label');
      
      if (activeIcon && triggerIcon && activeLabel && triggerLabel && triggerLabel.textContent !== activeLabel.textContent) {
        // 1. Measure current width
        const currentWidth = mobileTrigger.getBoundingClientRect().width;
        
        // 2. Lock current width
        mobileTrigger.style.width = `${currentWidth}px`;
        
        // 3. Update content
        triggerIcon.src = activeIcon.src;
        triggerLabel.textContent = activeLabel.textContent;
        
        // 4. Temporarily set to auto (without transition) to measure new width
        mobileTrigger.style.transition = 'none';
        mobileTrigger.style.width = 'auto';
        const newWidth = mobileTrigger.getBoundingClientRect().width;
        
        // 5. Set back to current width to prepare for animation
        mobileTrigger.style.width = `${currentWidth}px`;
        
        // 6. Force reflow so the browser acknowledges the starting width
        void mobileTrigger.offsetWidth;
        
        // 7. Restore CSS transition and animate to new width
        mobileTrigger.style.transition = ''; // Fallback to CSS rules
        mobileTrigger.style.width = `${newWidth}px`;
        
        // 8. Clean up inline width after animation completes so it can naturally flex
        setTimeout(() => {
          mobileTrigger.style.width = '';
        }, 300);
      }
    }
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
