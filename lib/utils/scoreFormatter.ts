/**
 * Score formatting utilities
 */

/**
 * Converts a score (0-1 or 0-100) to a percentage (0-100)
 * @param score - Score value (0-1 or 0-100)
 * @returns Score as percentage (0-100)
 */
export function normalizeScore(score: number | null | undefined): number {
  if (score === null || score === undefined || isNaN(score)) {
    return 0;
  }

  // If score is between 0-1, convert to 0-100
  if (score <= 1) {
    return Math.round(score * 100);
  }

  // If already 0-100, return as is
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Formats a score with color indicator
 * @param score - Score value (0-100)
 * @returns Formatted score string
 */
export function formatScore(score: number): string {
  const normalized = normalizeScore(score);
  return `${normalized}/100`;
}

/**
 * Gets score color category
 * @param score - Score value (0-100)
 * @returns Color category
 */
export function getScoreColor(score: number): 'red' | 'orange' | 'yellow' | 'green' {
  const normalized = normalizeScore(score);

  if (normalized >= 90) return 'green';
  if (normalized >= 75) return 'yellow';
  if (normalized >= 50) return 'orange';
  return 'red';
}

/**
 * Gets score label
 * @param score - Score value (0-100)
 * @returns Score label
 */
export function getScoreLabel(score: number): string {
  const normalized = normalizeScore(score);

  if (normalized >= 90) return 'Excellent';
  if (normalized >= 75) return 'Good';
  if (normalized >= 50) return 'Needs Improvement';
  return 'Poor';
}
