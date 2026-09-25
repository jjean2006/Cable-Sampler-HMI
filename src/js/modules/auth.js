/**
 * Cable Specimen Producer — Operator Authentication Module
 * Manages operator login validation, PIN submission, lock screen overlay dismissal, and unlock toast.
 */

import { showToast } from './settings.js';

export function initAuth() {
  const authScreen = document.getElementById('auth-screen');
  const btnLogin = document.getElementById('btn-login');
  const authOpId = document.getElementById('auth-operator-id');
  const authPin = document.getElementById('auth-pin');
  const authError = document.getElementById('auth-error');

  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      if (authOpId && authPin && authOpId.value.trim() !== '' && authPin.value.trim() !== '') {
        if (authScreen) authScreen.classList.add('hidden');
        showToast('Operator ' + authOpId.value + ' authenticated.');
      } else {
        if (authError) authError.style.display = 'block';
      }
    });

    if (authPin) {
      authPin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnLogin.click();
      });
    }
  }
}
