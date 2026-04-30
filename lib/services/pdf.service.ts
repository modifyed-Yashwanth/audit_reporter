/**
 * PDF service for generating audit reports as PDF
 */

import puppeteer from "puppeteer";
import type { AuditResponse } from "@/lib/types";

/**
 * Generates a PDF report from audit data and returns it as a buffer
 * @param auditData - Audit response data
 * @returns PDF buffer
 */
export async function generatePDFBuffer(
  auditData: AuditResponse
): Promise<Buffer> {
  const html = generateHTMLReport(auditData);

  // Launch browser and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generates HTML content for the PDF report
 * @param auditData - Audit response data
 * @returns HTML string
 */
function generateHTMLReport(auditData: AuditResponse): string {
  const { url, scores, coreWebVitals, issues, recommendations } = auditData;

  const formatScore = (score: number) => {
    if (score >= 90) return `<span style="color: #10b981;">${score}/100</span>`;
    if (score >= 75) return `<span style="color: #f59e0b;">${score}/100</span>`;
    if (score >= 50) return `<span style="color: #f97316;">${score}/100</span>`;
    return `<span style="color: #ef4444;">${score}/100</span>`;
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return "N/A";
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Audit Report - ${url}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .header .url {
      font-size: 16px;
      color: #666;
      word-break: break-all;
    }
    .header .date {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .score-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    .score-card h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .score-card .score-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .web-vitals {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 40px;
    }
    .web-vitals h2 {
      font-size: 20px;
      margin-bottom: 15px;
      color: #1e40af;
    }
    .web-vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .vital-item {
      padding: 10px;
      background: #fff;
      border-radius: 4px;
    }
    .vital-item .label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .vital-item .value {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .issue-list {
      list-style: none;
    }
    .issue-item {
      background: #fff;
      border-left: 4px solid #e5e7eb;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .issue-item.critical {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    .issue-item.warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    .issue-item.info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }
    .issue-item .title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 5px;
      color: #1f2937;
    }
    .issue-item .description {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 8px;
    }
    .issue-item .recommendation {
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
    }
    .recommendations-list {
      list-style: none;
    }
    .recommendation-item {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .recommendation-item .title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 5px;
      color: #1f2937;
    }
    .recommendation-item .description {
      font-size: 14px;
      color: #4b5563;
    }
    .priority {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    .priority.high {
      background: #fee2e2;
      color: #991b1b;
    }
    .priority.medium {
      background: #fef3c7;
      color: #92400e;
    }
    .priority.low {
      background: #dbeafe;
      color: #1e40af;
    }
    @media print {
      .container {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Website Audit Report</h1>
      <div class="url">${url}</div>
      <div class="date">Generated: ${new Date(
        auditData.timestamp
      ).toLocaleString()}</div>
    </div>

    <div class="scores-grid">
      <div class="score-card">
        <h3>Performance</h3>
        <div class="score-value">${formatScore(scores.performance)}</div>
      </div>
      <div class="score-card">
        <h3>SEO</h3>
        <div class="score-value">${formatScore(scores.seo)}</div>
      </div>
      <div class="score-card">
        <h3>Accessibility</h3>
        <div class="score-value">${formatScore(scores.accessibility)}</div>
      </div>
      <div class="score-card">
        <h3>Best Practices</h3>
        <div class="score-value">${formatScore(scores.bestPractices)}</div>
      </div>
    </div>

    <div class="web-vitals">
      <h2>Core Web Vitals</h2>
      <div class="web-vitals-grid">
        <div class="vital-item">
          <div class="label">First Contentful Paint</div>
          <div class="value">${formatTime(coreWebVitals.fcp)}</div>
        </div>
        <div class="vital-item">
          <div class="label">Largest Contentful Paint</div>
          <div class="value">${formatTime(coreWebVitals.lcp)}</div>
        </div>
        <div class="vital-item">
          <div class="label">Cumulative Layout Shift</div>
          <div class="value">${
            coreWebVitals.cls !== null ? coreWebVitals.cls.toFixed(3) : "N/A"
          }</div>
        </div>
        <div class="vital-item">
          <div class="label">Total Blocking Time</div>
          <div class="value">${formatTime(coreWebVitals.tbt)}</div>
        </div>
        <div class="vital-item">
          <div class="label">Speed Index</div>
          <div class="value">${formatTime(coreWebVitals.speedIndex)}</div>
        </div>
      </div>
    </div>

    ${
      issues.critical.length > 0
        ? `
    <div class="section">
      <h2>Critical Issues (${issues.critical.length})</h2>
      <ul class="issue-list">
        ${issues.critical
          .map(
            (issue) => `
          <li class="issue-item critical">
            <div class="title">${escapeHtml(issue.title)}</div>
            <div class="description">${escapeHtml(issue.description)}</div>
            <div class="recommendation">${escapeHtml(
              issue.recommendation
            )}</div>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    ${
      issues.warnings.length > 0
        ? `
    <div class="section">
      <h2>Warnings (${issues.warnings.length})</h2>
      <ul class="issue-list">
        ${issues.warnings
          .map(
            (issue) => `
          <li class="issue-item warning">
            <div class="title">${escapeHtml(issue.title)}</div>
            <div class="description">${escapeHtml(issue.description)}</div>
            <div class="recommendation">${escapeHtml(
              issue.recommendation
            )}</div>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    ${
      issues.info.length > 0
        ? `
    <div class="section">
      <h2>Information (${issues.info.length})</h2>
      <ul class="issue-list">
        ${issues.info
          .map(
            (issue) => `
          <li class="issue-item info">
            <div class="title">${escapeHtml(issue.title)}</div>
            <div class="description">${escapeHtml(issue.description)}</div>
            <div class="recommendation">${escapeHtml(
              issue.recommendation
            )}</div>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }

    ${
      recommendations.length > 0
        ? `
    <div class="section">
      <h2>Recommendations</h2>
      <ul class="recommendations-list">
        ${recommendations
          .map(
            (rec) => `
          <li class="recommendation-item">
            <div class="title">
              ${escapeHtml(rec.title)}
              <span class="priority ${
                rec.priority
              }">${rec.priority.toUpperCase()}</span>
            </div>
            <div class="description">${escapeHtml(rec.description)}</div>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
    `
        : ""
    }
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
