# Website Audit System

A production-ready Website Audit system built with Next.js (App Router) that provides comprehensive website analysis including Performance, SEO, Accessibility, Best Practices, and Security audits. The system generates detailed PDF reports with actionable recommendations.

## Features

- **Performance Audits**: Lighthouse performance scores, Core Web Vitals (FCP, LCP, CLS, TBT, Speed Index)
- **SEO Analysis**: Title tags, meta descriptions, heading hierarchy, image alt attributes, canonical tags, robots.txt, sitemap.xml
- **Accessibility Checks**: Lighthouse accessibility score, ARIA labels, color contrast, keyboard accessibility
- **Best Practices**: Console errors, deprecated APIs, image optimization, viewport meta tag
- **Security Analysis**: HTTPS detection, mixed content, security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- **PDF Reports**: Professional PDF reports with detailed findings and recommendations

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Lighthouse** - Website auditing
- **Puppeteer** - PDF generation and browser automation
- **Chrome Launcher** - Chrome/Chromium automation
- **Cheerio** - HTML parsing for SEO analysis

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Chrome/Chromium (required for Lighthouse and Puppeteer)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd audit_reporter
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Ensure Chrome/Chromium is installed on your system. The system will use the system's Chrome installation.

## Usage

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The API will be available at `http://localhost:3000/api/audit`

### API Endpoint

**POST** `/api/audit`

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "scores": {
    "performance": 85,
    "seo": 92,
    "accessibility": 78,
    "bestPractices": 88
  },
  "coreWebVitals": {
    "fcp": 1200,
    "lcp": 2500,
    "cls": 0.05,
    "tbt": 150,
    "speedIndex": 2000
  },
  "issues": {
    "critical": [
      {
        "severity": "critical",
        "category": "performance",
        "title": "Slow Largest Contentful Paint (LCP)",
        "description": "LCP is 4.50s, which exceeds the 2.5s threshold.",
        "recommendation": "Optimize server response times, eliminate render-blocking resources, and optimize images."
      }
    ],
    "warnings": [],
    "info": []
  },
  "recommendations": [
    {
      "category": "performance",
      "title": "Improve Performance",
      "description": "Optimize images, implement lazy loading, reduce JavaScript bundle size, and use a CDN.",
      "priority": "medium"
    }
  ],
  "pdfReportUrl": "/downloads/audit-report-example-com-1234567890.pdf"
}
```

### Example Usage

#### Using cURL:

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

#### Using fetch (JavaScript):

```javascript
const response = await fetch('http://localhost:3000/api/audit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const data = await response.json();
console.log(data);
```

#### Using axios:

```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:3000/api/audit', {
  url: 'https://example.com'
});

console.log(response.data);
```

## Project Structure

```
audit_reporter/
├── app/
│   ├── api/
│   │   └── audit/
│   │       └── route.ts          # API route handler
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── lib/
│   ├── services/
│   │   ├── lighthouse.service.ts # Lighthouse audit service
│   │   ├── seo.service.ts        # SEO analysis service
│   │   ├── accessibility.service.ts # Accessibility analysis service
│   │   ├── security.service.ts   # Security analysis service
│   │   └── pdf.service.ts        # PDF generation service
│   ├── utils/
│   │   ├── urlValidator.ts       # URL validation utility
│   │   └── scoreFormatter.ts     # Score formatting utility
│   └── types.ts                  # TypeScript type definitions
├── public/
│   └── downloads/                # Generated PDF reports
└── package.json
```

## Configuration

### Runtime Configuration

The API route uses Node.js runtime (not Edge) to support Puppeteer and Lighthouse:

```typescript
export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes timeout
```

### Timeouts

- **URL Fetch Timeout**: 30 seconds
- **Lighthouse Audit**: Variable (typically 30-60 seconds)
- **API Route Timeout**: 120 seconds (2 minutes)

## Error Handling

The system handles various error scenarios gracefully:

- **Invalid URLs**: Returns 400 status with error message
- **Unreachable URLs**: Returns 408 (timeout) or 500 (connection error)
- **Partial Failures**: Returns partial results if some checks fail
- **PDF Generation Failures**: Continues without PDF if generation fails

## PDF Reports

PDF reports are generated and saved in `/public/downloads/` directory. The filename format is:

```
audit-report-<domain>-<timestamp>.pdf
```

Example: `audit-report-example-com-1704067200000.pdf`

The PDF includes:
- Overall scores (Performance, SEO, Accessibility, Best Practices)
- Core Web Vitals metrics
- Critical issues
- Warnings
- Information items
- Actionable recommendations

## Performance Considerations

- Lighthouse audits can take 30-60 seconds depending on the website
- PDF generation adds additional processing time (5-10 seconds)
- The system is designed to handle timeouts gracefully
- Consider implementing rate limiting for production use

## Production Deployment

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables

For production, consider setting:

- `NODE_ENV=production`
- Configure appropriate timeouts based on your infrastructure
- Set up proper error logging and monitoring

### Docker Deployment

For Docker deployment, ensure Chrome/Chromium is installed in the container:

```dockerfile
FROM node:18-alpine

# Install Chrome dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Chrome path
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Rest of your Dockerfile...
```

## Limitations

- Requires Node.js runtime (not compatible with Edge runtime)
- Requires Chrome/Chromium installation
- Lighthouse audits can be resource-intensive
- Some websites may block automated access

## Troubleshooting

### Chrome/Chromium Not Found

Ensure Chrome/Chromium is installed and accessible. On Linux, you may need to install it:

```bash
# Ubuntu/Debian
sudo apt-get install chromium-browser

# macOS (using Homebrew)
brew install chromium
```

### Timeout Errors

If you encounter timeout errors:
- Increase the timeout values in the API route
- Check network connectivity
- Verify the target website is accessible

### Memory Issues

Lighthouse can be memory-intensive. If you encounter memory issues:
- Increase Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096`
- Consider running audits in background jobs
- Implement rate limiting

## Future Enhancements

Potential improvements (not yet implemented):
- Rate limiting middleware
- Background processing for heavy audits
- Shareable public report links
- Audit history per user
- Caching for repeated audits
- Scheduled audits
- Email reports
- Dashboard UI

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
