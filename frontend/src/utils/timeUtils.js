/**
 * Formats time in seconds to a human-readable hh:mm:ss format.
 * @param {number} seconds - Time in seconds to format.
 * @returns {string} - Formatted time as hh:mm:ss.
 */
export const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };
  