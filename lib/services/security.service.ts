/**
 * Security service for analyzing security aspects
 */

import type { SecurityIssues } from '@/lib/types';

/**
 * Analyzes security aspects of a webpage
 * @param url - URL of the page
 * @param html - HTML content (optional, for mixed content detection)
 * @param headers - HTTP response headers
 * @returns Security issues and analysis
 */
export async function analyzeSecurity(
  url: string,
  html: string,
  headers: Headers
): Promise<SecurityIssues> {
  const urlObj = new URL(url);

  // Check HTTPS
  const httpsEnabled = urlObj.protocol === 'https:';

  // Check for mixed content in HTML
  let mixedContentCount = 0;
  if (html && httpsEnabled) {
    // Look for HTTP resources loaded over HTTPS
    const httpResourcePatterns = [
      /src=["']http:\/\//gi,
      /href=["']http:\/\//gi,
      /url\(["']?http:\/\//gi,
      /action=["']http:\/\//gi,
    ];

    httpResourcePatterns.forEach((pattern) => {
      const matches = html.match(pattern);
      if (matches) {
        mixedContentCount += matches.length;
      }
    });
  }

  const mixedContentDetected = mixedContentCount > 0;

  // Check security headers
  const securityHeaders = {
    contentSecurityPolicy: headers.has('Content-Security-Policy'),
    xFrameOptions: headers.has('X-Frame-Options') || headers.has('x-frame-options'),
    strictTransportSecurity:
      headers.has('Strict-Transport-Security') || headers.has('strict-transport-security'),
    xContentTypeOptions:
      headers.has('X-Content-Type-Options') || headers.has('x-content-type-options'),
  };

  return {
    httpsEnabled,
    mixedContent: {
      detected: mixedContentDetected,
      count: mixedContentCount,
    },
    securityHeaders,
  };
}
