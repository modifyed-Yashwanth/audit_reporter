/**
 * SEO service for analyzing SEO aspects
 */

import * as cheerio from 'cheerio';
import type { SEOIssues } from '@/lib/types';

/**
 * Analyzes SEO aspects of a webpage
 * @param html - HTML content of the page
 * @param baseUrl - Base URL of the page
 * @returns SEO issues and analysis
 */
export async function analyzeSEO(html: string, baseUrl: string): Promise<SEOIssues> {
  const $ = cheerio.load(html);
  const url = new URL(baseUrl);

  // Analyze title tag
  const titleTag = $('title').first().text().trim();
  const titleExists = titleTag.length > 0;
  const titleLength = titleTag.length;
  const titleIsValid = titleLength >= 30 && titleLength <= 60;

  // Analyze meta description
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaDescriptionExists = metaDescription.length > 0;
  const metaDescriptionLength = metaDescription.length;
  const metaDescriptionIsValid = metaDescriptionLength >= 120 && metaDescriptionLength <= 160;

  // Analyze H1 tags
  const h1Tags = $('h1');
  const h1Count = h1Tags.length;
  const h1Exists = h1Count > 0;
  const h1IsValid = h1Count === 1;

  // Analyze heading hierarchy
  const headingHierarchyIssues: string[] = [];
  let previousLevel = 0;
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tagName = el.type === 'tag' ? el.name : '';
    const level = parseInt(tagName[1]);
    if (level > previousLevel + 1 && previousLevel > 0) {
      headingHierarchyIssues.push(`Heading ${tagName} found after h${previousLevel}, skipping h${previousLevel + 1}`);
    }
    previousLevel = level;
  });

  // Analyze image alt attributes
  const images = $('img');
  const totalImages = images.length;
  let imagesWithAlt = 0;
  images.each((_, img) => {
    const alt = $(img).attr('alt');
    if (alt !== undefined && alt !== null) {
      imagesWithAlt++;
    }
  });
  const imageAltCoverage = totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100;

  // Analyze canonical tag
  const canonicalTag = $('link[rel="canonical"]').attr('href') || null;
  const canonicalExists = canonicalTag !== null;

  // Check robots.txt
  const robotsTxtUrl = `${url.protocol}//${url.hostname}/robots.txt`;
  let robotsTxtExists = false;
  let robotsTxtAccessible = false;

  try {
    const robotsResponse = await fetch(robotsTxtUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    robotsTxtExists = true;
    robotsTxtAccessible = robotsResponse.ok;
  } catch {
    // robots.txt not found or not accessible
  }

  // Check sitemap.xml
  const sitemapXmlUrl = `${url.protocol}//${url.hostname}/sitemap.xml`;
  let sitemapXmlExists = false;
  let sitemapXmlAccessible = false;

  try {
    const sitemapResponse = await fetch(sitemapXmlUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    sitemapXmlExists = true;
    sitemapXmlAccessible = sitemapResponse.ok;
  } catch {
    // sitemap.xml not found or not accessible
  }

  return {
    titleTag: {
      exists: titleExists,
      length: titleLength,
      isValid: titleIsValid,
    },
    metaDescription: {
      exists: metaDescriptionExists,
      length: metaDescriptionLength,
      isValid: metaDescriptionIsValid,
    },
    h1: {
      exists: h1Exists,
      count: h1Count,
      isValid: h1IsValid,
    },
    headingHierarchy: {
      isValid: headingHierarchyIssues.length === 0,
      issues: headingHierarchyIssues,
    },
    imageAltAttributes: {
      totalImages,
      imagesWithAlt,
      coverage: imageAltCoverage,
    },
    canonicalTag: {
      exists: canonicalExists,
      value: canonicalTag,
    },
    robotsTxt: {
      exists: robotsTxtExists,
      accessible: robotsTxtAccessible,
    },
    sitemapXml: {
      exists: sitemapXmlExists,
      accessible: sitemapXmlAccessible,
    },
  };
}
