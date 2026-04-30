"use client";

import { useState } from "react";
import type {
  AuditResponse,
  AuditIssue,
  AuditRecommendation,
} from "@/lib/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuditData(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const parseApiResponse = async <T,>(
        res: Response,
      ): Promise<{ data: T | null; message: string | null }> => {
        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");

        if (isJson) {
          try {
            const json = (await res.json()) as T & { error?: string };
            return {
              data: json,
              message:
                typeof json === "object" &&
                json !== null &&
                "error" in json &&
                typeof json.error === "string"
                  ? json.error
                  : null,
            };
          } catch {
            return {
              data: null,
              message: "Server returned invalid JSON. Please try again.",
            };
          }
        }

        const text = await res.text();
        const cleanedText = text
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        return {
          data: null,
          message: cleanedText || "Unexpected server response.",
        };
      };

      const { data, message } = await parseApiResponse<AuditResponse>(response);

      if (!response.ok) {
        throw new Error(message || "Failed to run audit");
      }

      if (!data) {
        throw new Error("Audit response was empty. Please try again.");
      }

      setAuditData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreRing = (score: number) => {
    if (score >= 90) return "ring-green-500";
    if (score >= 75) return "ring-yellow-500";
    if (score >= 50) return "ring-orange-500";
    return "ring-red-500";
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return "N/A";
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header Section */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Website Auditor
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Comprehensive website analysis tool
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  Enter Website URL
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      "Analyze"
                    )}
                  </button>
                </div>
              </div>
            </form>
            {loading && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Running audit... this can take 20-60 seconds in production while
                PageSpeed metrics are collected.
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                  Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {auditData && (
          <div className="space-y-8">
            {/* Scores Overview */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Audit Scores
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreCard
                  title="Performance"
                  score={auditData.scores.performance}
                  getScoreColor={getScoreColor}
                  getScoreRing={getScoreRing}
                />
                <ScoreCard
                  title="SEO"
                  score={auditData.scores.seo}
                  getScoreColor={getScoreColor}
                  getScoreRing={getScoreRing}
                />
                <ScoreCard
                  title="Accessibility"
                  score={auditData.scores.accessibility}
                  getScoreColor={getScoreColor}
                  getScoreRing={getScoreRing}
                />
                <ScoreCard
                  title="Best Practices"
                  score={auditData.scores.bestPractices}
                  getScoreColor={getScoreColor}
                  getScoreRing={getScoreRing}
                />
              </div>
            </section>

            {/* Core Web Vitals */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Core Web Vitals
              </h2>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard
                    label="First Contentful Paint"
                    value={formatTime(auditData.coreWebVitals.fcp)}
                    abbreviation="FCP"
                  />
                  <MetricCard
                    label="Largest Contentful Paint"
                    value={formatTime(auditData.coreWebVitals.lcp)}
                    abbreviation="LCP"
                  />
                  <MetricCard
                    label="Cumulative Layout Shift"
                    value={
                      auditData.coreWebVitals.cls !== null
                        ? auditData.coreWebVitals.cls.toFixed(3)
                        : "N/A"
                    }
                    abbreviation="CLS"
                  />
                  <MetricCard
                    label="Total Blocking Time"
                    value={formatTime(auditData.coreWebVitals.tbt)}
                    abbreviation="TBT"
                  />
                  <MetricCard
                    label="Speed Index"
                    value={formatTime(auditData.coreWebVitals.speedIndex)}
                    abbreviation="SI"
                  />
                </div>
              </div>
            </section>

            {/* Issues Section */}
            {(auditData.issues.critical.length > 0 ||
              auditData.issues.warnings.length > 0 ||
              auditData.issues.info.length > 0) && (
              <section>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Issues Found
                </h2>
                <div className="space-y-4">
                  {auditData.issues.critical.length > 0 && (
                    <IssueSection
                      title="Critical"
                      issues={auditData.issues.critical}
                      severity="critical"
                      icon="🔴"
                    />
                  )}
                  {auditData.issues.warnings.length > 0 && (
                    <IssueSection
                      title="Warnings"
                      issues={auditData.issues.warnings}
                      severity="warning"
                      icon="🟡"
                    />
                  )}
                  {auditData.issues.info.length > 0 && (
                    <IssueSection
                      title="Information"
                      issues={auditData.issues.info}
                      severity="info"
                      icon="🔵"
                    />
                  )}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {auditData.recommendations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Recommendations
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {auditData.recommendations.map((rec, idx) => (
                      <RecommendationCard key={idx} recommendation={rec} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* PDF Download */}
            <section>
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-900 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3">
                      <svg
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        Download Full Report
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Get a comprehensive PDF report with all audit details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/audit/pdf", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(auditData),
                        });

                        if (!response.ok) {
                          throw new Error("Failed to generate PDF");
                        }

                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        const domain = auditData.url
                          .replace(/^https?:\/\//, "")
                          .replace(/\/.*$/, "");
                        const timestamp = Date.now();
                        a.download = `audit-report-${domain}-${timestamp}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error) {
                        alert("Failed to download PDF. Please try again.");
                        console.error("PDF download error:", error);
                      }
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

// Score Card Component
function ScoreCard({
  title,
  score,
  getScoreColor,
  getScoreRing,
}: {
  title: string;
  score: number;
  getScoreColor: (score: number) => string;
  getScoreRing: (score: number) => string;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border-2 ${getScoreRing(
        score,
      )} border-opacity-50 dark:border-opacity-30 p-6`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-lg text-slate-400 dark:text-slate-500">/100</span>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  abbreviation,
}: {
  label: string;
  value: string;
  abbreviation: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
          {abbreviation}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-500 line-clamp-1">
        {label}
      </div>
    </div>
  );
}

// Issue Section Component
function IssueSection({
  title,
  issues,
  severity,
  icon,
}: {
  title: string;
  issues: AuditIssue[];
  severity: "critical" | "warning" | "info";
  icon: string;
}) {
  const colors = {
    critical: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-900",
      text: "text-red-800 dark:text-red-300",
      badge: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200 dark:border-yellow-900",
      text: "text-yellow-800 dark:text-yellow-300",
      badge:
        "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900",
      text: "text-blue-800 dark:text-blue-300",
      badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    },
  };

  const colorScheme = colors[severity];

  return (
    <div
      className={`${colorScheme.bg} ${colorScheme.border} border rounded-xl p-5`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className={`font-semibold ${colorScheme.text}`}>{title}</h3>
        <span
          className={`${colorScheme.badge} text-xs font-semibold px-2 py-0.5 rounded-full`}
        >
          {issues.length}
        </span>
      </div>
      <div className="space-y-3">
        {issues.map((issue, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800"
          >
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1.5 text-sm">
              {issue.title}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {issue.description}
            </p>
            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <svg
                className="h-4 w-4 text-slate-400 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {issue.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({
  recommendation,
}: {
  recommendation: AuditRecommendation;
}) {
  const priorityStyles = {
    high: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-900",
      badge: "bg-red-500 text-white",
    },
    medium: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200 dark:border-yellow-900",
      badge: "bg-yellow-500 text-white",
    },
    low: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900",
      badge: "bg-blue-500 text-white",
    },
  };

  const style = priorityStyles[recommendation.priority];

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex-1">
          {recommendation.title}
        </h4>
        <span
          className={`${style.badge} text-xs font-semibold px-2 py-1 rounded-full shrink-0`}
        >
          {recommendation.priority}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {recommendation.description}
      </p>
    </div>
  );
}
