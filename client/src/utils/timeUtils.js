/**
 * Formats an ISO date string or Date object into a relative string representation.
 * e.g., "2 hours ago", "just now", "3 days ago"
 * @param {string|Date} dateVal - The date to format
 * @returns {string} - The formatted relative time string
 */
export const formatRelativeTime = (dateVal) => {
  if (!dateVal) return '';

  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) {
    return 'just now'; // Fallback for minor system clock sync differences
  }

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  // Fallback to standard local date if more than a month ago
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
