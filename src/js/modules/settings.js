/**
 * Cable Specimen Producer — HMI Settings Module
 * LocalStorage persistence, factory calibration reset, simulated PLC network ping, and toast feedback.
 */

import { dom } from '../utils/dom.js';
import { STORAGE_KEY } from '../config/constants.js';

let toastTimer = null;

/**
 * Displays floating feedback toast notification with automatic 3.2s dismissal.
 * @param {string} message
 */
export function showToast(message) {
  if (!dom.settingsToast) return;
  const msgEl = dom.settingsToast.querySelector('.toast-message');
  if (msgEl && message) msgEl.textContent = message;

  dom.settingsToast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (dom.settingsToast) dom.settingsToast.classList.remove('show');
    toastTimer = null;
  }, 3200);
}

/**
 * Persists HMI configuration parameters to localStorage.
 */
export function saveSettings() {
  const lang = document.getElementById('setting-language')?.value || 'en';
  const units = document.getElementById('setting-units-system')?.value || 'metric';
  const ip = document.getElementById('setting-ip-address')?.value || '192.168.1.120';

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lang, units, ip, savedAt: new Date().toISOString()
    }));
  } catch (e) {
    // Gracefully ignore if localStorage unavailable or quota exceeded
  }

  showToast('HMI Settings saved and applied successfully.');
}

/**
 * Restores persisted HMI configuration parameters from localStorage on startup.
 */
export function loadSettings() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return;
    const settings = JSON.parse(raw);
    if (settings.lang && document.getElementById('setting-language')) {
      document.getElementById('setting-language').value = settings.lang;
    }
    if (settings.units && document.getElementById('setting-units-system')) {
      document.getElementById('setting-units-system').value = settings.units;
    }
    if (settings.ip && document.getElementById('setting-ip-address')) {
      document.getElementById('setting-ip-address').value = settings.ip;
    }
  } catch (e) {
    // Gracefully ignore parsing or storage access errors
  }
}

/**
 * Resets settings form to factory defaults and provides feedback toast.
 */
export function resetSettings() {
  if (dom.settingsForm) {
    dom.settingsForm.reset();
    showToast('Settings restored to factory calibration defaults.');
  }
}

/**
 * Simulates network ping to industrial PLC gateway with latency feedback.
 */
export function testNetwork() {
  if (dom.networkResult) {
    dom.networkResult.textContent = 'Pinging PLC gateway...';
    dom.networkResult.style.color = '#38bdf8';

    setTimeout(() => {
      if (dom.networkResult) {
        dom.networkResult.textContent = 'Connected (Ping: 1.8ms | OPC UA OK)';
        dom.networkResult.style.color = '#10b981';
      }
    }, 700);
  }
}

/**
 * Initializes settings event listeners and loads stored settings.
 */
export function initSettings() {
  loadSettings();
  if (dom.btnSaveSettings) dom.btnSaveSettings.addEventListener('click', saveSettings);
  if (dom.btnResetSettings) dom.btnResetSettings.addEventListener('click', resetSettings);
  if (dom.btnTestNetwork) dom.btnTestNetwork.addEventListener('click', testNetwork);
}
