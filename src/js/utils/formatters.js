/**
 * Cable Specimen Producer — Time & Duration Formatters
 * Pure functions for duration and minute-second formatting.
 */

/**
 * Formats seconds into "Xh YYm ZZs"
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
}

/**
 * Formats seconds into "YYm ZZs"
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatMSS(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(minutes)}m ${pad(seconds)}s`;
}
