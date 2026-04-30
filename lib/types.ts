/**
 * Type definitions for the Website Audit system
 */

export interface AuditScores {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
}

export interface CoreWebVitals {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  tbt: number | null; // Total Blocking Time
  speedIndex: number | null;
}

export interface SEOIssues {
  titleTag: {
    exists: boolean;
    length: number | null;
    isValid: boolean;
  };
  metaDescription: {
    exists: boolean;
    length: number | null;
    isValid: boolean;
  };
  h1: {
    exists: boolean;
    count: number;
    isValid: boolean;
  };
  headingHierarchy: {
    isValid: boolean;
    issues: string[];
  };
  imageAltAttributes: {
    totalImages: number;
    imagesWithAlt: number;
    coverage: number;
  };
  canonicalTag: {
    exists: boolean;
    value: string | null;
  };
  robotsTxt: {
    exists: boolean;
    accessible: boolean;
  };
  sitemapXml: {
    exists: boolean;
    accessible: boolean;
  };
}

export interface AccessibilityIssues {
  lighthouseScore: number;
  missingAriaLabels: number;
  colorContrastIssues: number;
  keyboardAccessibilityIssues: number;
  details: Array<{
    type: 'missing-aria-label' | 'color-contrast' | 'keyboard-accessibility';
    element: string;
    description: string;
  }>;
}

export interface BestPracticesIssues {
  consoleErrors: number;
  deprecatedApis: number;
  imageFormatOptimization: {
    unoptimizedImages: number;
    details: string[];
  };
  viewportMetaTag: {
    exists: boolean;
    isValid: boolean;
  };
}

export interface SecurityIssues {
  httpsEnabled: boolean;
  mixedContent: {
    detected: boolean;
    count: number;
  };
  securityHeaders: {
    contentSecurityPolicy: boolean;
    xFrameOptions: boolean;
    strictTransportSecurity: boolean;
    xContentTypeOptions: boolean;
  };
}

export interface AuditIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'performance' | 'seo' | 'accessibility' | 'best-practices' | 'security';
  title: string;
  description: string;
  recommendation: string;
}

export interface AuditRecommendation {
  category: 'performance' | 'seo' | 'accessibility' | 'best-practices' | 'security';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AuditResponse {
  url: string;
  timestamp: string;
  scores: AuditScores;
  coreWebVitals: CoreWebVitals;
  issues: {
    critical: AuditIssue[];
    warnings: AuditIssue[];
    info: AuditIssue[];
  };
  recommendations: AuditRecommendation[];
  pdfReportUrl: string;
}

export interface LighthouseResult {
  lhr: {
    categories: {
      performance: { score: number | null };
      seo: { score: number | null };
      accessibility: { score: number | null };
      'best-practices': { score: number | null };
    };
    audits: {
      'first-contentful-paint': { numericValue: number };
      'largest-contentful-paint': { numericValue: number };
      'cumulative-layout-shift': { numericValue: number };
      'total-blocking-time': { numericValue: number };
      'speed-index': { numericValue: number };
      'viewport': { score: number | null };
      'image-alt': { details: { items: unknown[] } };
      'color-contrast': { details: { items: unknown[] } };
      'aria-label': { details: { items: unknown[] } };
      'html-lang-valid': { score: number | null };
      'uses-http2': { score: number | null };
      'uses-text-compression': { score: number | null };
      'redirects-http': { score: number | null };
    };
  };
}
