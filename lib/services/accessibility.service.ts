/**
 * Accessibility service for analyzing accessibility aspects
 */

import type { LighthouseResult, AccessibilityIssues } from "@/lib/types";
import { normalizeScore } from "@/lib/utils/scoreFormatter";
import * as cheerio from "cheerio";

/**
 * Analyzes accessibility aspects from Lighthouse result and HTML
 * @param lighthouseResult - Lighthouse result
 * @param html - HTML content of the page
 * @returns Accessibility issues and analysis
 */
export function analyzeAccessibility(
  lighthouseResult: LighthouseResult,
  html: string
): AccessibilityIssues {
  const $ = cheerio.load(html);
  const audits = lighthouseResult.lhr.audits;
  const accessibilityScore = normalizeScore(
    lighthouseResult.lhr.categories.accessibility?.score
  );

  // Count missing aria labels
  let missingAriaLabels = 0;
  const details: AccessibilityIssues["details"] = [];

  // Find interactive elements without aria-label or aria-labelledby
  $('button, a, input, select, textarea, [role="button"], [role="link"]').each(
    (_, el) => {
      const $el = $(el);
      const hasAriaLabel =
        $el.attr("aria-label") || $el.attr("aria-labelledby");
      const hasText = $el.text().trim().length > 0;
      const hasImgAlt = $el.find("img").attr("alt");

      if (!hasAriaLabel && !hasText && !hasImgAlt) {
        missingAriaLabels++;
        const tagName = el.type === "tag" ? el.name : "unknown";
        const className = $el.attr("class")
          ? `.${$el.attr("class")?.split(" ")[0]}`
          : "";
        details.push({
          type: "missing-aria-label",
          element: tagName + className,
          description: `Interactive element without accessible name`,
        });
      }
    }
  );

  // Get color contrast issues from Lighthouse
  const colorContrastItems = audits["color-contrast"]?.details?.items || [];
  const colorContrastIssues = Array.isArray(colorContrastItems)
    ? colorContrastItems.length
    : 0;

  colorContrastItems.slice(0, 10).forEach((item: unknown) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "selector" in item &&
      typeof (item as { selector?: unknown }).selector === "string"
    ) {
      const typedItem = item as {
        selector: string;
        node?: { snippet?: string };
      };
      details.push({
        type: "color-contrast",
        element: typedItem.selector,
        description: typedItem.node?.snippet || "Color contrast issue",
      });
    }
  });

  // Check keyboard accessibility (focusable elements without tabindex)
  let keyboardAccessibilityIssues = 0;
  $('[tabindex="-1"]').each((_, el) => {
    const $el = $(el);
    // Elements with tabindex="-1" that should be keyboard accessible
    if ($el.is("a, button, input, select, textarea")) {
      keyboardAccessibilityIssues++;
      const tagName = el.type === "tag" ? el.name : "unknown";
      details.push({
        type: "keyboard-accessibility",
        element: tagName,
        description: "Focusable element with negative tabindex",
      });
    }
  });

  return {
    lighthouseScore: accessibilityScore,
    missingAriaLabels,
    colorContrastIssues,
    keyboardAccessibilityIssues,
    details: details.slice(0, 50), // Limit to 50 issues
  };
}
