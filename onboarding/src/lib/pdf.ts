import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { Submission } from '@/types/onboarding';
import { PDFDocument } from './pdf-document';

export async function generatePDF(submission: Submission): Promise<Uint8Array> {
  const element = React.createElement(PDFDocument, { submission });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return buffer;
}
