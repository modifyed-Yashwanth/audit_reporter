/**
 * Lighthouse service for running audits
 */

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import type { LighthouseResult, CoreWebVitals, AuditScores } from "@/lib/types";
import { normalizeScore } from "@/lib/utils/scoreFormatter";

/**
 * Runs Lighthouse audit on a given URL
 * @param url - The URL to audit
 * @returns Lighthouse result
 */
export async function runLighthouseAudit(
  url: string
): Promise<LighthouseResult> {
  let chrome: chromeLauncher.LaunchedChrome | null = null;

  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    });

    const options = {
      logLevel: "info" as const,
      output: "json" as const,
      onlyCategories: ["performance", "seo", "accessibility", "best-practices"],
      port: chrome.port,
    };

    // Run Lighthouse
    const runnerResult = await lighthouse(url, options);

    if (!runnerResult) {
      throw new Error("Lighthouse audit failed");
    }

    return runnerResult as unknown as LighthouseResult;
  } finally {
    // Clean up Chrome instance
    if (chrome) {
      await chrome.kill();
    }
  }
}

/**
 * Extracts scores from Lighthouse result
 * @param result - Lighthouse result
 * @returns Audit scores
 */
export function extractScores(result: LighthouseResult): AuditScores {
  const categories = result.lhr.categories;

  return {
    performance: normalizeScore(categories.performance?.score),
    seo: normalizeScore(categories.seo?.score),
    accessibility: normalizeScore(categories.accessibility?.score),
    bestPractices: normalizeScore(categories["best-practices"]?.score),
  };
}

/**
 * Extracts Core Web Vitals from Lighthouse result
 * @param result - Lighthouse result
 * @returns Core Web Vitals
 */
export function extractCoreWebVitals(result: LighthouseResult): CoreWebVitals {
  const audits = result.lhr.audits;

  return {
    fcp: audits["first-contentful-paint"]?.numericValue || null,
    lcp: audits["largest-contentful-paint"]?.numericValue || null,
    cls: audits["cumulative-layout-shift"]?.numericValue || null,
    tbt: audits["total-blocking-time"]?.numericValue || null,
    speedIndex: audits["speed-index"]?.numericValue || null,
  };
}
