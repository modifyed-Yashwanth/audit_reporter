/**
 * API route for website audit
 * POST /api/audit
 */

import { NextRequest, NextResponse } from "next/server";
import { validateUrl } from "@/lib/utils/urlValidator";
import {
  runLighthouseAudit,
  extractScores,
  extractCoreWebVitals,
} from "@/lib/services/lighthouse.service";
import { analyzeSEO } from "@/lib/services/seo.service";
import { analyzeAccessibility } from "@/lib/services/accessibility.service";
import { analyzeSecurity } from "@/lib/services/security.service";
import type {
  AuditResponse,
  AuditIssue,
  AuditRecommendation,
  SEOIssues,
  AccessibilityIssues,
  SecurityIssues,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes timeout

/**
 * POST /api/audit
 * Request body: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.isValid || !validation.normalizedUrl) {
      return NextResponse.json(
        { error: validation.error || "Invalid URL" },
        { status: 400 }
      );
    }

    const targetUrl = validation.normalizedUrl;

    // Fetch HTML with timeout
    let html = "";
    let headers = new Headers();

    try {
      const response = await fetch(targetUrl, {
        signal: AbortSignal.timeout(30000), // 30 second timeout
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          },
          { status: response.status }
        );
      }

      html = await response.text();
      headers = response.headers;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return NextResponse.json(
          { error: "Request timeout: Website took too long to respond" },
          { status: 408 }
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to fetch URL: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Run Lighthouse audit
    let lighthouseResult;
    let scores;
    let coreWebVitals;

    try {
      lighthouseResult = await runLighthouseAudit(targetUrl);
      scores = extractScores(lighthouseResult);
      coreWebVitals = extractCoreWebVitals(lighthouseResult);
    } catch (error: unknown) {
      console.error("Lighthouse audit failed:", error);
      // Return partial results with default scores
      scores = {
        performance: 0,
        seo: 0,
        accessibility: 0,
        bestPractices: 0,
      };
      coreWebVitals = {
        fcp: null,
        lcp: null,
        cls: null,
        tbt: null,
        speedIndex: null,
      };
    }

    // Analyze SEO
    let seoIssues: SEOIssues;
    try {
      seoIssues = await analyzeSEO(html, targetUrl);
    } catch (error: unknown) {
      console.error("SEO analysis failed:", error);
      // Return partial results
      seoIssues = {
        titleTag: { exists: false, length: null, isValid: false },
        metaDescription: { exists: false, length: null, isValid: false },
        h1: { exists: false, count: 0, isValid: false },
        headingHierarchy: { isValid: true, issues: [] },
        imageAltAttributes: { totalImages: 0, imagesWithAlt: 0, coverage: 0 },
        canonicalTag: { exists: false, value: null },
        robotsTxt: { exists: false, accessible: false },
        sitemapXml: { exists: false, accessible: false },
      };
    }

    // Analyze Accessibility
    let accessibilityIssues: AccessibilityIssues;
    try {
      accessibilityIssues = lighthouseResult
        ? analyzeAccessibility(lighthouseResult, html)
        : {
            lighthouseScore: 0,
            missingAriaLabels: 0,
            colorContrastIssues: 0,
            keyboardAccessibilityIssues: 0,
            details: [],
          };
    } catch (error: unknown) {
      console.error("Accessibility analysis failed:", error);
      accessibilityIssues = {
        lighthouseScore: 0,
        missingAriaLabels: 0,
        colorContrastIssues: 0,
        keyboardAccessibilityIssues: 0,
        details: [],
      };
    }

    // Analyze Security
    let securityIssues: SecurityIssues;
    try {
      securityIssues = await analyzeSecurity(targetUrl, html, headers);
    } catch (error: unknown) {
      console.error("Security analysis failed:", error);
      securityIssues = {
        httpsEnabled: false,
        mixedContent: { detected: false, count: 0 },
        securityHeaders: {
          contentSecurityPolicy: false,
          xFrameOptions: false,
          strictTransportSecurity: false,
          xContentTypeOptions: false,
        },
      };
    }

    // Collect issues and recommendations
    const issues: AuditIssue[] = [];
    const recommendations: AuditRecommendation[] = [];

    // Performance issues
    if (scores.performance < 50) {
      issues.push({
        severity: "critical",
        category: "performance",
        title: "Poor Performance Score",
        description: `Performance score is ${scores.performance}/100, which is below acceptable standards.`,
        recommendation:
          "Optimize images, reduce JavaScript execution time, eliminate render-blocking resources, and improve server response times.",
      });
    } else if (scores.performance < 75) {
      issues.push({
        severity: "warning",
        category: "performance",
        title: "Performance Needs Improvement",
        description: `Performance score is ${scores.performance}/100.`,
        recommendation:
          "Consider optimizing Core Web Vitals, reducing bundle sizes, and implementing lazy loading.",
      });
    }

    if (coreWebVitals.lcp && coreWebVitals.lcp > 4000) {
      issues.push({
        severity: "critical",
        category: "performance",
        title: "Slow Largest Contentful Paint (LCP)",
        description: `LCP is ${(coreWebVitals.lcp / 1000).toFixed(
          2
        )}s, which exceeds the 2.5s threshold.`,
        recommendation:
          "Optimize server response times, eliminate render-blocking resources, and optimize images.",
      });
    }

    if (coreWebVitals.cls && coreWebVitals.cls > 0.25) {
      issues.push({
        severity: "warning",
        category: "performance",
        title: "High Cumulative Layout Shift (CLS)",
        description: `CLS is ${coreWebVitals.cls.toFixed(
          3
        )}, which exceeds the 0.1 threshold.`,
        recommendation:
          "Ensure images and videos have dimensions, avoid inserting content above existing content, and use transform animations.",
      });
    }

    // SEO issues
    if (!seoIssues.titleTag.exists) {
      issues.push({
        severity: "critical",
        category: "seo",
        title: "Missing Title Tag",
        description: "The page does not have a title tag.",
        recommendation:
          "Add a descriptive title tag (30-60 characters) to improve SEO.",
      });
    } else if (!seoIssues.titleTag.isValid) {
      issues.push({
        severity: "warning",
        category: "seo",
        title: "Title Tag Length Issue",
        description: `Title tag length is ${seoIssues.titleTag.length} characters (recommended: 30-60).`,
        recommendation:
          "Optimize title tag length to be between 30-60 characters.",
      });
    }

    if (!seoIssues.metaDescription.exists) {
      issues.push({
        severity: "warning",
        category: "seo",
        title: "Missing Meta Description",
        description: "The page does not have a meta description.",
        recommendation:
          "Add a descriptive meta description (120-160 characters) to improve SEO.",
      });
    } else if (!seoIssues.metaDescription.isValid) {
      issues.push({
        severity: "info",
        category: "seo",
        title: "Meta Description Length Issue",
        description: `Meta description length is ${seoIssues.metaDescription.length} characters (recommended: 120-160).`,
        recommendation:
          "Optimize meta description length to be between 120-160 characters.",
      });
    }

    if (!seoIssues.h1.exists) {
      issues.push({
        severity: "critical",
        category: "seo",
        title: "Missing H1 Tag",
        description: "The page does not have an H1 tag.",
        recommendation: "Add a single H1 tag to the page for better SEO.",
      });
    } else if (!seoIssues.h1.isValid) {
      issues.push({
        severity: "warning",
        category: "seo",
        title: "Multiple H1 Tags",
        description: `The page has ${seoIssues.h1.count} H1 tags (recommended: 1).`,
        recommendation:
          "Use only one H1 tag per page for better SEO structure.",
      });
    }

    if (
      seoIssues.imageAltAttributes.coverage < 90 &&
      seoIssues.imageAltAttributes.totalImages > 0
    ) {
      issues.push({
        severity: "warning",
        category: "seo",
        title: "Missing Image Alt Attributes",
        description: `Only ${seoIssues.imageAltAttributes.coverage.toFixed(
          1
        )}% of images have alt attributes.`,
        recommendation:
          "Add descriptive alt attributes to all images for better SEO and accessibility.",
      });
    }

    if (!seoIssues.canonicalTag.exists) {
      issues.push({
        severity: "info",
        category: "seo",
        title: "Missing Canonical Tag",
        description: "The page does not have a canonical tag.",
        recommendation:
          "Add a canonical tag to prevent duplicate content issues.",
      });
    }

    if (!seoIssues.robotsTxt.exists || !seoIssues.robotsTxt.accessible) {
      issues.push({
        severity: "info",
        category: "seo",
        title: "Missing or Inaccessible robots.txt",
        description: "robots.txt file is missing or not accessible.",
        recommendation:
          "Create a robots.txt file to guide search engine crawlers.",
      });
    }

    if (!seoIssues.sitemapXml.exists || !seoIssues.sitemapXml.accessible) {
      issues.push({
        severity: "info",
        category: "seo",
        title: "Missing or Inaccessible sitemap.xml",
        description: "sitemap.xml file is missing or not accessible.",
        recommendation:
          "Create a sitemap.xml file to help search engines discover your pages.",
      });
    }

    // Accessibility issues
    if (accessibilityIssues.lighthouseScore < 50) {
      issues.push({
        severity: "critical",
        category: "accessibility",
        title: "Poor Accessibility Score",
        description: `Accessibility score is ${accessibilityIssues.lighthouseScore}/100.`,
        recommendation:
          "Improve accessibility by adding ARIA labels, ensuring proper color contrast, and fixing keyboard navigation issues.",
      });
    }

    if (accessibilityIssues.missingAriaLabels > 0) {
      issues.push({
        severity: "warning",
        category: "accessibility",
        title: "Missing ARIA Labels",
        description: `Found ${accessibilityIssues.missingAriaLabels} interactive elements without ARIA labels.`,
        recommendation:
          "Add aria-label or aria-labelledby attributes to interactive elements.",
      });
    }

    if (accessibilityIssues.colorContrastIssues > 0) {
      issues.push({
        severity: "warning",
        category: "accessibility",
        title: "Color Contrast Issues",
        description: `Found ${accessibilityIssues.colorContrastIssues} color contrast issues.`,
        recommendation:
          "Ensure text has sufficient color contrast (WCAG AA: 4.5:1 for normal text, 3:1 for large text).",
      });
    }

    // Best Practices issues
    if (scores.bestPractices < 75) {
      issues.push({
        severity: "warning",
        category: "best-practices",
        title: "Best Practices Needs Improvement",
        description: `Best Practices score is ${scores.bestPractices}/100.`,
        recommendation:
          "Fix console errors, avoid deprecated APIs, optimize images, and ensure proper viewport meta tag.",
      });
    }

    // Security issues
    if (!securityIssues.httpsEnabled) {
      issues.push({
        severity: "critical",
        category: "security",
        title: "HTTPS Not Enabled",
        description: "The website is not using HTTPS.",
        recommendation:
          "Enable HTTPS to secure data transmission and improve SEO rankings.",
      });
    }

    if (securityIssues.mixedContent.detected) {
      issues.push({
        severity: "critical",
        category: "security",
        title: "Mixed Content Detected",
        description: `Found ${securityIssues.mixedContent.count} HTTP resources loaded over HTTPS.`,
        recommendation:
          "Update all resources to use HTTPS to prevent mixed content warnings.",
      });
    }

    if (!securityIssues.securityHeaders.contentSecurityPolicy) {
      issues.push({
        severity: "warning",
        category: "security",
        title: "Missing Content-Security-Policy Header",
        description: "Content-Security-Policy header is not set.",
        recommendation:
          "Implement Content-Security-Policy header to prevent XSS attacks.",
      });
    }

    if (!securityIssues.securityHeaders.xFrameOptions) {
      issues.push({
        severity: "warning",
        category: "security",
        title: "Missing X-Frame-Options Header",
        description: "X-Frame-Options header is not set.",
        recommendation:
          "Set X-Frame-Options header to prevent clickjacking attacks.",
      });
    }

    if (
      !securityIssues.securityHeaders.strictTransportSecurity &&
      securityIssues.httpsEnabled
    ) {
      issues.push({
        severity: "info",
        category: "security",
        title: "Missing Strict-Transport-Security Header",
        description: "Strict-Transport-Security header is not set.",
        recommendation:
          "Set Strict-Transport-Security header to enforce HTTPS connections.",
      });
    }

    if (!securityIssues.securityHeaders.xContentTypeOptions) {
      issues.push({
        severity: "info",
        category: "security",
        title: "Missing X-Content-Type-Options Header",
        description: "X-Content-Type-Options header is not set.",
        recommendation:
          "Set X-Content-Type-Options: nosniff header to prevent MIME type sniffing.",
      });
    }

    // Categorize issues
    const criticalIssues = issues.filter(
      (issue) => issue.severity === "critical"
    );
    const warningIssues = issues.filter(
      (issue) => issue.severity === "warning"
    );
    const infoIssues = issues.filter((issue) => issue.severity === "info");

    // Generate recommendations based on scores and issues
    if (scores.performance < 90) {
      recommendations.push({
        category: "performance",
        title: "Improve Performance",
        description:
          "Optimize images, implement lazy loading, reduce JavaScript bundle size, and use a CDN.",
        priority: scores.performance < 50 ? "high" : "medium",
      });
    }

    if (scores.seo < 90) {
      recommendations.push({
        category: "seo",
        title: "Improve SEO",
        description:
          "Ensure proper meta tags, heading structure, image alt attributes, and create sitemap.xml and robots.txt.",
        priority: scores.seo < 50 ? "high" : "medium",
      });
    }

    if (scores.accessibility < 90) {
      recommendations.push({
        category: "accessibility",
        title: "Improve Accessibility",
        description:
          "Add ARIA labels, ensure color contrast compliance, test keyboard navigation, and follow WCAG guidelines.",
        priority: scores.accessibility < 50 ? "high" : "medium",
      });
    }

    // Assemble audit response (PDF will be generated on-demand)
    const auditResponse: AuditResponse = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      scores,
      coreWebVitals,
      issues: {
        critical: criticalIssues,
        warnings: warningIssues,
        info: infoIssues,
      },
      recommendations,
      pdfReportUrl: "", // PDF will be generated on-demand via /api/audit/pdf
    };

    return NextResponse.json(auditResponse, { status: 200 });
  } catch (error: unknown) {
    console.error("Audit failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
