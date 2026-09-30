
// Prevent manual scrolling during tour
function preventScroll(e) {
  e.preventDefault();
}

function preventKeyScroll(e) {
  const keys = ['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
  if (keys.includes(e.code)) {
    e.preventDefault();
  }
}
import { dom } from '../utils/dom.js';

let currentStep = 0;
let tooltip = null;
let overlays = {};
let autoClickTimer = null;
let currentAdvanceOnClick = null;
let currentTargetEl = null;

// Helper to reliably check if element is truly visible
function isElementVisible(el) {
  if (!el) return false;
  if (el.isVirtual) return true;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  
  // Check computed opacity and display
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  
  // Check if a parent is opacity: 0
  let parent = el.parentElement;
  while (parent) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.opacity === '0' || parentStyle.display === 'none') return false;
    parent = parent.parentElement;
  }
  
  return true;
}

const steps = [
  {
    title: "Current Job Overview",
    content: "Shows progress and details of current job",
    target: () => {
      const header = document.querySelector('#section-current-job .section-header');
      const grid = document.querySelector('.job-meta-grid');
      if (!header || !grid) return '#section-current-job .section-header';
      return {
        isVirtual: true,
        getBoundingClientRect: () => {
          const r1 = header.getBoundingClientRect();
          const r2 = grid.getBoundingClientRect();
          return {
            top: Math.min(r1.top, r2.top),
            left: Math.min(r1.left, r2.left),
            right: Math.max(r1.right, r2.right),
            bottom: Math.max(r1.bottom, r2.bottom),
            width: Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left),
            height: Math.max(r1.bottom, r2.bottom) - Math.min(r1.top, r2.top)
          };
        }
      };
    },
    placement: 'bottom'
  },
  {
    title: "Pipeline Status",
    content: () => window.innerWidth <= 1024 
      ? "This pipeline tracks job progress. Tap a stage to reveal its detailed subtasks below."
      : "This visual pipeline tracks the progress of the currently active job through the machine's 4 stages, along with detailed subtasks.",
    target: () => {
      const pipeline = document.querySelector('.stages-pipeline');
      const subtasks = document.querySelector('.workflow-steps-breakdown');
      if (!pipeline || !subtasks) return '.stages-pipeline';
      
      return {
        isVirtual: true,
        getBoundingClientRect: () => {
          const r1 = pipeline.getBoundingClientRect();
          const r2 = subtasks.getBoundingClientRect();
          
          if (r2.height === 0 || r2.width === 0) return r1; // Fallback if subtasks are display: none
          if (r1.height === 0 || r1.width === 0) return r2;
          
          return {
            top: Math.min(r1.top, r2.top),
            left: Math.min(r1.left, r2.left),
            right: Math.max(r1.right, r2.right),
            bottom: Math.max(r1.bottom, r2.bottom),
            width: Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left),
            height: Math.max(r1.bottom, r2.bottom) - Math.min(r1.top, r2.top)
          };
        }
      };
    },
    placement: 'top'
  },
  {
    title: "Machine Controls",
    content: "You can safely pause the active job here without losing progress.",
    target: () => '#btn-pause-job',
    placement: 'bottom'
  },

  {
    title: "Navigation Menu",
    content: () => window.innerWidth <= 1024
      ? "Click the menu button to manually open the navigation sidebar."
      : "Here you can switch between different views.",
    target: () => {
      if (window.innerWidth <= 1024) return '#mobile-active-tab-trigger';
      
      const firstTab = document.querySelector('#top-nav-current-job');
      const lastTab = document.querySelector('#top-nav-settings');
      if (!firstTab || !lastTab) return '.topbar-nav';
      
      return {
        isVirtual: true,
        getBoundingClientRect: () => {
          const r1 = firstTab.getBoundingClientRect();
          const r2 = lastTab.getBoundingClientRect();
          return {
            top: Math.min(r1.top, r2.top),
            left: Math.min(r1.left, r2.left),
            right: Math.max(r1.right, r2.right),
            bottom: Math.max(r1.bottom, r2.bottom),
            width: Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left),
            height: Math.max(r1.bottom, r2.bottom) - Math.min(r1.top, r2.top)
          };
        }
      };
    },
    placement: 'bottom',
    requireClick: () => window.innerWidth <= 1024
  },
  {
    title: "Go to Queue",
    content: "Click on the Queue tab. ",
    target: () => window.innerWidth <= 1024 ? '#nav-queue' : '#top-nav-queue',
    placement: 'bottom',
    requireClick: true
  },
  {
    title: "Job Queue",
    content: "This table shows jobs waiting to be processed. The machine pulls from the top of the queue automatically.",
    target: () => {
      const t = document.querySelector('#queue-table');
      return t ? (t.closest('.table-responsive') || t) : null;
    },
    placement: 'bottom'
  },
  {
    title: "Dispatch New Jobs",
    content: "Click this button to open the job dispatch modal.",
    target: () => '#btn-topbar-create',
    placement: 'bottom',
    requireClick: true
  },
  {
    title: "Job Priority",
    content: "Assign an execution priority to this job. High priority jobs are visually flagged.",
    target: () => '#new-job-priority',
    placement: 'bottom'
  },
  {
    title: "Queue Sorting & Schedule",
    content: "You can automatically sort this job into the queue by injecting it at a custom position, placing it next, or pushing it to the end.",
    target: () => '.schedule-options',
    placement: 'bottom'
  },
  {
    title: "Cancel Dispatch",
    content: "For this tour, let's just cancel. Click 'Cancel'.",
    target: () => '#btn-cancel-job',
    placement: 'top',
    requireClick: true
  },
  {
    title: "Queue Actions",
    content: "You can bump a job to the top of the queue or delete it using these action buttons.",
    target: () => '#queue-table tbody tr:first-child .btn-icon',
    placement: 'bottom'
  },
  {
    title: "Go to History",
    content: "Click on the History tab. ",
    target: () => window.innerWidth <= 1024 ? '#nav-history' : '#top-nav-history',
    placement: 'bottom',
    requireClick: true
  },
  {
    title: "History Search & Filters",
    content: "You can quickly search for specific job IDs or filter by job status.",
    target: () => '#search-history',
    placement: 'bottom'
  },
  {
    title: "History Table",
    content: "All successfully completed and aborted jobs are recorded here for auditing.",
    target: () => {
      const t = document.querySelector('#history-table');
      return t ? (t.closest('.table-responsive') || t) : null;
    },
    placement: 'top'
  },
  {
    title: "Go to Settings",
    content: "Click on the Settings tab. ",
    target: () => window.innerWidth <= 1024 ? '#nav-settings' : '#top-nav-settings',
    placement: 'bottom',
    requireClick: true
  },
  {
    title: "Settings & Configuration",
    content: "You can adjust UI behaviors, localization, and system options here.",
    target: () => {
      const cards = document.querySelectorAll('#section-settings .settings-card');
      if (cards.length === 0) return '#section-settings';
      return {
        isVirtual: true,
        getBoundingClientRect: () => {
          let minT = Infinity, minL = Infinity, maxR = -Infinity, maxB = -Infinity;
          cards.forEach(c => {
            const r = c.getBoundingClientRect();
            if (r.top < minT) minT = r.top;
            if (r.left < minL) minL = r.left;
            if (r.right > maxR) maxR = r.right;
            if (r.bottom > maxB) maxB = r.bottom;
          });
          return {
            top: minT, left: minL, right: maxR, bottom: maxB,
            width: maxR - minL, height: maxB - minT
          };
        }
      };
    },
    placement: 'bottom'
  },
  {
    title: "Network Diagnostics",
    content: "Use this utility to ping the machine and verify connectivity.",
    target: () => '#btn-test-network',
    placement: 'top'
  },
  {
    title: "Save Changes",
    content: "Don't forget to save your configuration changes. This concludes the tour!",
    target: () => '#btn-save-settings',
    placement: 'bottom'
  }
];

export function initTour() {}

function runTour() {
  if (tooltip) return; // Already running
  currentStep = 0;

  // Block manual scrolling
  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });
  window.addEventListener('keydown', preventKeyScroll, { passive: false });

  // Create invisible click blockers
  ['top', 'bottom', 'left', 'right'].forEach(pos => {
    let div = document.createElement('div');
    div.className = `tour-overlay tour-overlay-${pos}`;
    div.style.background = 'transparent'; // Make them invisible, just for blocking clicks
    document.body.appendChild(div);
    overlays[pos] = div;
  });

  // Create visual rounded cutout
  overlays.visual = document.createElement('div');
  overlays.visual.className = 'tour-visual-cutout';
  document.body.appendChild(overlays.visual);

  // Create Tooltip
  tooltip = document.createElement('div');
  tooltip.className = 'tour-tooltip';
  tooltip.innerHTML = `
    <div class="tour-arrow"></div>
    <div class="tour-header">
      <h3 class="tour-title"></h3>
      <span class="tour-counter"></span>
    </div>
    <div class="tour-body"></div>
    <div class="tour-footer">
      <button class="tour-btn" id="tour-skip-btn" style="background: transparent; color: var(--text-muted); border: none; padding: 0 8px; font-weight: 500;">Skip Tour</button>
      <button class="tour-btn" id="tour-next-btn">Okay</button>
    </div>
    <div class="tour-auto-progress-bar"></div>
  `;
  document.body.appendChild(tooltip);

  document.getElementById('tour-next-btn').addEventListener('click', nextStep);
  document.getElementById('tour-skip-btn').addEventListener('click', endTour);
  window.addEventListener('resize', positionElements);
  window.addEventListener('scroll', positionElements);

  renderStep();
}

function renderStep() {
  if (currentStep >= steps.length) {
    endTour();
    return;
  }

  const step = steps[currentStep];

  setTimeout(() => {
    let targetSelector = step.target();
    let targetEl = typeof targetSelector === 'string' ? document.querySelector(targetSelector) : targetSelector;
    
    // Check if element is truly visible
    let isVisible = isElementVisible(targetEl);

    // If target not found or invisible, it might be inside a closed mobile menu
    if (!isVisible) {
      if (typeof targetSelector === 'string' && window.innerWidth <= 1024 && (targetSelector.includes('nav-') || targetSelector.includes('main-nav'))) {
         document.querySelector('.hmi-sidebar')?.classList.add('expanded');
         setTimeout(renderStep, 300); // Wait for animation
         return;
      }
    }
    
    targetEl = typeof targetSelector === 'string' ? document.querySelector(targetSelector) : targetSelector;
    isVisible = isElementVisible(targetEl);

    if (isVisible) {
      // Check if scroll is necessary (element must be fully in view with a 60px margin)
      const rect = (targetEl.isVirtual && targetEl.getBoundingClientRect) ? targetEl.getBoundingClientRect() : targetEl.getBoundingClientRect();
      const inView = (rect.top >= 60 && rect.bottom <= window.innerHeight - 60);
      
      let scrollDelay = 0;
      if (!inView) {
        scrollDelay = 600;
        if (!targetEl.isVirtual && targetEl.scrollIntoView) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (targetEl.isVirtual) {
            window.scrollBy({ top: rect.top - (window.innerHeight / 2) + (rect.height / 2), behavior: 'smooth' });
        }
      }

      tooltip.querySelector('.tour-title').textContent = typeof step.title === 'function' ? step.title() : step.title;
      tooltip.querySelector('.tour-body').textContent = typeof step.content === 'function' ? step.content() : step.content;
      tooltip.querySelector('.tour-counter').textContent = `${currentStep + 1} / ${steps.length}`;
      
      const nextBtn = tooltip.querySelector('#tour-next-btn');
      
      const needsClick = typeof step.requireClick === 'function' ? step.requireClick() : step.requireClick;
      if (needsClick) {
        nextBtn.style.display = 'none';
        
        // Animate progress bar
        const prog = tooltip.querySelector('.tour-auto-progress-bar');
        prog.style.transition = 'none';
        prog.style.width = '0%';
        prog.style.opacity = '1';
        void prog.offsetWidth; // Force reflow
        prog.style.transition = 'width 5s linear';
        prog.style.width = '100%';
        
        // 5-second auto click timer
        autoClickTimer = setTimeout(() => {
           if (targetEl) targetEl.click();
        }, 5000);
        
        const advanceOnClick = () => {
          clearTimeout(autoClickTimer);
          targetEl.removeEventListener('click', advanceOnClick);
          currentAdvanceOnClick = null;
          currentTargetEl = null;
          // Let mobile.js handle closing the sidebar natively when nav items are clicked
          nextStep();
        };
        currentAdvanceOnClick = advanceOnClick;
        currentTargetEl = targetEl;
        targetEl.addEventListener('click', advanceOnClick);
      } else {
        nextBtn.style.display = 'block';
        const prog = tooltip.querySelector('.tour-auto-progress-bar');
        if (prog) {
            prog.style.transition = 'opacity 0.2s ease';
            prog.style.opacity = '0';
        }
        nextBtn.textContent = currentStep === steps.length - 1 ? "Finish" : "Okay";
      }
      
      // Wait for scroll (if any) to finish before drawing
      setTimeout(() => {
        positionElements();
        overlays.visual.style.opacity = '1';
        tooltip.classList.add('active');
      }, scrollDelay);
    } else {
      console.warn('Tour target not found or hidden:', targetSelector);
      nextStep();
    }
  }, 100);
}

function positionElements() {
  if (!tooltip || currentStep >= steps.length) return;
  const step = steps[currentStep];
  const targetSelector = step.target();
  const targetEl = typeof targetSelector === 'string' ? document.querySelector(targetSelector) : targetSelector;
  if (!targetEl) return;

  const rect = targetEl.getBoundingClientRect();
  const pad = 4; // Padding around the cutout
  
  let t = rect.top - pad;
  let b = rect.bottom + pad;
  let l = rect.left - pad;
  let r = rect.right + pad;
  
  if (t < 0) t = 0;
  if (l < 0) l = 0;
  let h = b - t;

  overlays.top.style.top = '0';
  overlays.top.style.left = '0';
  overlays.top.style.width = '100vw';
  overlays.top.style.height = `${t}px`;

  overlays.bottom.style.top = `${b}px`;
  overlays.bottom.style.left = '0';
  overlays.bottom.style.width = '100vw';
  overlays.bottom.style.height = `calc(100vh - ${b}px)`;

  overlays.left.style.top = `${t}px`;
  overlays.left.style.left = '0';
  overlays.left.style.width = `${l}px`;
  overlays.left.style.height = `${h}px`;

  overlays.right.style.top = `${t}px`;
  overlays.right.style.left = `${r}px`;
  overlays.right.style.width = `calc(100vw - ${r}px)`;
  overlays.right.style.height = `${h}px`;

  // Position the visual cutout
  overlays.visual.style.top = `${t}px`;
  overlays.visual.style.left = `${l}px`;
  overlays.visual.style.width = `${r - l}px`;
  overlays.visual.style.height = `${b - t}px`;

  const placement = step.placement || 'bottom';
  const tooltipRect = tooltip.getBoundingClientRect();
  const spacing = 16; 

  let top = 0;
  let left = 0;

  switch(placement) {
    case 'bottom':
      top = rect.bottom + spacing;
      left = window.innerWidth <= 1024 ? (window.innerWidth / 2) - (tooltipRect.width / 2) : rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      break;
    case 'top':
      top = rect.top - tooltipRect.height - spacing;
      left = window.innerWidth <= 1024 ? (window.innerWidth / 2) - (tooltipRect.width / 2) : rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      break;
    case 'right':
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.right + spacing;
      break;
    case 'left':
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.left - tooltipRect.width - spacing;
      break;
  }

  // Constrain Tooltip to viewport
  if (left < 16) left = 16;
  if (left + tooltipRect.width > window.innerWidth - 16) left = window.innerWidth - tooltipRect.width - 16;
  if (top < 16) top = 16;
  if (top + tooltipRect.height > window.innerHeight - 16) top = window.innerHeight - tooltipRect.height - 16;

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.dataset.placement = placement;

  const arrow = tooltip.querySelector('.tour-arrow');
  const targetCenterX = rect.left + (rect.width / 2);
  const targetCenterY = rect.top + (rect.height / 2);
  
  if (placement === 'top' || placement === 'bottom') {
    let arrowLeft = targetCenterX - left - 8;
    if (arrowLeft < 16) arrowLeft = 16;
    if (arrowLeft > tooltipRect.width - 32) arrowLeft = tooltipRect.width - 32;
    arrow.style.left = `${arrowLeft}px`;
    arrow.style.top = ''; 
  } else {
    let arrowTop = targetCenterY - top - 8;
    if (arrowTop < 16) arrowTop = 16;
    if (arrowTop > tooltipRect.height - 32) arrowTop = tooltipRect.height - 32;
    arrow.style.top = `${arrowTop}px`;
    arrow.style.left = '';
  }
}

function nextStep() {
  tooltip.classList.remove('active');
  overlays.visual.style.opacity = '0';
  currentStep++;
  setTimeout(renderStep, 150);
}

function endTour() {
  if (autoClickTimer) clearTimeout(autoClickTimer);
  if (currentTargetEl && currentAdvanceOnClick) {
    currentTargetEl.removeEventListener('click', currentAdvanceOnClick);
  }
  currentTargetEl = null;
  currentAdvanceOnClick = null;
  Object.values(overlays).forEach(div => div && div.remove());
  if (tooltip) tooltip.remove();
  tooltip = null;
  window.removeEventListener('resize', positionElements);
  window.removeEventListener('scroll', positionElements);
  window.removeEventListener('wheel', preventScroll);
  window.removeEventListener('touchmove', preventScroll);
  window.removeEventListener('keydown', preventKeyScroll);
  
  document.querySelector('.hmi-sidebar')?.classList.remove('expanded');
  localStorage.setItem('tourCompleted', 'true');
}

export function startTour() {
  if (document.querySelector('.tour-welcome-overlay') || tooltip) return;

  const overlay = document.createElement('div');
  overlay.className = 'tour-welcome-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.4s ease';
  
  const modal = document.createElement('div');
  modal.className = 'tour-tooltip';
  modal.style.position = 'relative';
  modal.style.opacity = '0';
  modal.style.transform = 'translateY(20px)';
  modal.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  modal.style.width = '600px';
  modal.style.maxWidth = '90vw';
  modal.style.textAlign = 'center';
  modal.style.padding = '50px 40px';
  
  modal.innerHTML = `
    <div style="margin-bottom: 24px; display: flex; justify-content: center;">
      <svg class="brand-logo" width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" stroke="var(--text-main)" stroke-width="2"/>
        <circle cx="16" cy="11" r="3" fill="var(--text-main)"/>
        <circle cx="11.5" cy="19" r="3" fill="var(--text-main)"/>
        <circle cx="20.5" cy="19" r="3" fill="var(--text-main)"/>
      </svg>
    </div>
    <h2 style="font-size: 28px; margin-bottom: 16px; color: var(--text-main);">Cable Sampler Dashboard</h2>
    <p style="font-size: 18px; color: var(--text-muted); margin-bottom: 40px; line-height: 1.6;">Start the tour to get acquainted with the system.</p>
    <div style="display: flex; gap: 16px; justify-content: center;">
      <button class="tour-btn" id="welcome-skip-btn" style="background-color: transparent; border: 1px solid var(--border-subtle); color: var(--text-muted); padding: 12px 24px; font-size: 16px;">Skip</button>
      <button class="tour-btn" id="welcome-start-btn" style="padding: 12px 24px; font-size: 16px;">Start Tour</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Force browser reflow to register initial opacity:0 before transitioning
  void overlay.offsetWidth;
  
  // Trigger fade-in animation
  overlay.style.opacity = '1';
  modal.style.opacity = '1';
  modal.style.transform = 'translateY(0)';
  
  document.getElementById('welcome-skip-btn').addEventListener('click', () => {
    overlay.style.opacity = '0';
    modal.style.opacity = '0';
    modal.style.transform = 'translateY(10px)';
    setTimeout(() => overlay.remove(), 400);
    localStorage.setItem('tourCompleted', 'true');
  });
  
  document.getElementById('welcome-start-btn').addEventListener('click', () => {
    overlay.style.opacity = '0';
    modal.style.opacity = '0';
    modal.style.transform = 'translateY(10px)';
    setTimeout(() => {
      overlay.remove();
      runTour();
    }, 400);
  });
}

window.startTour = startTour;
