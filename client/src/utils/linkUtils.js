/**
 * Detects the type of a given link.
 * Supported types: 'youtube', 'github', 'drive', 'other'
 * @param {string} url - The URL to analyze
 * @returns {string} - The category ('youtube' | 'github' | 'drive' | 'other')
 */
export const detectLinkType = (url) => {
  if (!url || typeof url !== 'string') return 'other';

  const cleanUrl = url.trim().toLowerCase();

  if (
    cleanUrl.includes('youtube.com') || 
    cleanUrl.includes('youtu.be')
  ) {
    return 'youtube';
  }

  if (cleanUrl.includes('github.com')) {
    return 'github';
  }

  if (
    cleanUrl.includes('drive.google.com') || 
    cleanUrl.includes('docs.google.com')
  ) {
    return 'drive';
  }

  return 'other';
};

/**
 * Extracts a cleaner display name for a URL
 * @param {string} url - The URL to clean
 * @returns {string} - A clean display title
 */
export const getLinkDisplayTitle = (url) => {
  if (!url || typeof url !== 'string') return '';

  try {
    const parsed = new URL(url);
    let host = parsed.hostname.replace('www.', '');
    let path = parsed.pathname;

    if (host === 'github.com') {
      // e.g., github.com/user/repo -> "GitHub: user/repo"
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `GitHub: ${parts[0]}/${parts[1]}`;
      }
      return 'GitHub Link';
    }

    if (host === 'youtube.com' || host === 'youtu.be') {
      return 'YouTube Resource';
    }

    if (host === 'drive.google.com' || host === 'docs.google.com') {
      return 'Google Drive Resource';
    }

    // Default: return hostname + truncated path if long
    if (path && path !== '/') {
      const truncatedPath = path.length > 15 ? path.substring(0, 15) + '...' : path;
      return `${host}${truncatedPath}`;
    }

    return host;
  } catch (e) {
    // If not a valid URL construct, return a subset of the string
    return url.length > 30 ? url.substring(0, 30) + '...' : url;
  }
};
