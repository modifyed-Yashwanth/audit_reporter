/**
 * Lighthouse service for running audits
 */

import type { LaunchedChrome } from "chrome-launcher";
import type { LighthouseResult, CoreWebVitals, AuditScores } from "@/lib/types";
import { normalizeScore } from "@/lib/utils/scoreFormatter";

const AUDIT_CATEGORIES = [
  "performance",
  "seo",
  "accessibility",
  "best-practices",
] as const;

async function runPageSpeedAudit(url: string): Promise<LighthouseResult> {
  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );

  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");

  AUDIT_CATEGORIES.forEach((category) => {
    endpoint.searchParams.append("category", category);
  });

  if (process.env.PAGESPEED_API_KEY) {
    endpoint.searchParams.set("key", process.env.PAGESPEED_API_KEY);
  }

  const response = await fetch(endpoint.toString(), {
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `PageSpeed API failed: ${response.status} ${response.statusText} ${errorText}`.trim()
    );
  }

  const payload = (await response.json()) as {
    lighthouseResult?: LighthouseResult["lhr"];
  };

  if (!payload.lighthouseResult) {
    throw new Error("PageSpeed API did not return lighthouseResult");
  }

  return { lhr: payload.lighthouseResult };
}

async function runLocalLighthouse(url: string): Promise<LighthouseResult> {
  let chrome: LaunchedChrome | null = null;

  try {
    const [lighthouseModule, chromeLauncherModule] = await Promise.all([
      import("lighthouse"),
      import("chrome-launcher"),
    ]);

    const lighthouse = lighthouseModule.default;
    const chromeLauncher = chromeLauncherModule;

    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    });

    const options = {
      logLevel: "info" as const,
      output: "json" as const,
      onlyCategories: [...AUDIT_CATEGORIES],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);

    if (!runnerResult) {
      throw new Error("Lighthouse audit failed");
    }

    return runnerResult as unknown as LighthouseResult;
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

/**
 * Runs Lighthouse audit on a given URL
 * @param url - The URL to audit
 * @returns Lighthouse result
 */
export async function runLighthouseAudit(
  url: string
): Promise<LighthouseResult> {
  try {
    return await runLocalLighthouse(url);
  } catch (localError) {
    console.warn(
      "Local Lighthouse failed, falling back to PageSpeed API:",
      localError
    );
    return runPageSpeedAudit(url);
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
