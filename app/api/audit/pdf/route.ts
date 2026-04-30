/**
 * API route for generating PDF reports on-demand
 * POST /api/audit/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDFBuffer } from '@/lib/services/pdf.service';
import type { AuditResponse } from '@/lib/types';
import { extractDomain } from '@/lib/utils/urlValidator';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute timeout for PDF generation

/**
 * POST /api/audit/pdf
 * Request body: AuditResponse JSON
 * Returns: PDF file as stream
 */
export async function POST(request: NextRequest) {
  try {
    const auditData: AuditResponse = await request.json();

    // Validate audit data
    if (!auditData || !auditData.url) {
      return NextResponse.json(
        { error: 'Invalid audit data' },
        { status: 400 }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = await generatePDFBuffer(auditData);

    // Generate filename
    const domain = extractDomain(auditData.url);
    const timestamp = Date.now();
    const filename = `audit-report-${domain}-${timestamp}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse
    const pdfArray = new Uint8Array(pdfBuffer);

    // Return PDF as response
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('PDF generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
}
