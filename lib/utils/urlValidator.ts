/**
 * URL validation utility
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates and normalizes a URL
 * @param url - The URL to validate
 * @returns Validation result with normalized URL if valid
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string',
    };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return {
      isValid: false,
      error: 'URL cannot be empty',
    };
  }

  // Try to parse the URL
  try {
    let normalizedUrl = trimmedUrl;

    // Add protocol if missing
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Parse to validate
    const urlObj = new URL(normalizedUrl);

    // Validate protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'URL must use HTTP or HTTPS protocol',
      };
    }

    // Validate hostname
    if (!urlObj.hostname) {
      return {
        isValid: false,
        error: 'URL must have a valid hostname',
      };
    }

    return {
      isValid: true,
      normalizedUrl: urlObj.href,
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Extracts domain from URL
 * @param url - The URL
 * @returns Domain name
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
