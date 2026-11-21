/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PDFInspectionResult {
  pageCount: number;
}

/**
 * Inspects PDF binary bytes locally in the browser using PDF.js to validate and count pages.
 */
export async function inspectPdfBytes(bytes: Uint8Array): Promise<PDFInspectionResult> {
  // Clone bytes because PDF.js transfers the buffer to the Web Worker
  const dataCopy = bytes.slice();
  const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  await loadingTask.destroy();
  return { pageCount };
}

/**
 * Renders a specific 1-indexed page of a PDF onto a target HTMLCanvasElement,
 * fitting cleanly inside containerWidth x containerHeight at crisp HiDPI resolution.
 */
export async function renderPdfPageToCanvas(
  bytes: Uint8Array,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  containerWidth: number,
  containerHeight: number
): Promise<{ width: number; height: number }> {
  const dataCopy = bytes.slice();
  const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
  const pdfDoc = await loadingTask.promise;

  try {
    const safePageNum = Math.max(1, Math.min(pageNumber, pdfDoc.numPages));
    const page = await pdfDoc.getPage(safePageNum);

    const baseViewport = page.getViewport({ scale: 1 });
    const scaleX = containerWidth / baseViewport.width;
    const scaleY = containerHeight / baseViewport.height;
    const fitScale = Math.min(scaleX, scaleY);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const renderViewport = page.getViewport({ scale: fitScale * dpr });
    const displayWidth = Math.round(baseViewport.width * fitScale);
    const displayHeight = Math.round(baseViewport.height * fitScale);

    canvas.width = Math.round(renderViewport.width);
    canvas.height = Math.round(renderViewport.height);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not acquire 2D canvas context for PDF rendering.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport,
      canvas,
    }).promise;

    return { width: displayWidth, height: displayHeight };
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * Generates a valid, self-contained 3-page PDF in memory so users can test
 * the Disk vs. Cloud upload workflow immediately without needing a local file.
 */
export function generateSampleLecturePdfBytes(): Uint8Array {
  const pagesText = [
    [
      'VectorLMS Sample Lecture Deck',
      'Page 1: Distributed Consensus & Replication',
      '1. Quorum intersection ensures single-leader safety.',
      '2. Raft log entries commit once replicated to majority.',
      '3. Annotate directly over this PDF layer at 60 FPS.'
    ],
    [
      'Page 2: Storage Architecture - Disk vs. Cloud',
      '- Local Disk Storage: Saved directly to local disk storage.',
      '- Cloud Object Storage: Stored in batch bucket with 60-min signed URLs.',
      '- Switch any uploaded PDF between Disk and Cloud anytime.'
    ],
    [
      'Page 3: Live Session Summary & Exercises',
      'Exercise A: Trace Leader Election timeout under network partition.',
      'Exercise B: Draw vector clock increments for 3 concurrent nodes.',
      'Save annotations or export board snapshot when done.'
    ]
  ];

  const escapePdfText = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const objects: string[] = [];
  // 1: Catalog, 2: Pages, 3: Font
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const pageObjNums: number[] = [];
  const pageEntries: string[] = [];

  // Pre-calculate object numbers: 3 is Font, then pairs of (Page, Content) starting at 4
  for (let i = 0; i < pagesText.length; i++) {
    pageObjNums.push(4 + i * 2);
  }

  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map(n => `${n} 0 R`).join(' ')}] /Count ${pagesText.length} >>\nendobj\n`
  );
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );

  pagesText.forEach((lines, idx) => {
    const pageObjNum = 4 + idx * 2;
    const contentObjNum = pageObjNum + 1;

    const commands: string[] = [
      '0.97 0.98 0.99 rg',
      '0 0 792 490 re f',
      '0.06 0.09 0.16 rg',
      '0 430 792 60 re f',
      '1 1 1 rg',
      'BT /F1 20 Tf 40 453 Td (' + escapePdfText(lines[0]) + ') Tj ET',
      '0.12 0.16 0.23 rg',
    ];

    lines.slice(1).forEach((line, lineIdx) => {
      const y = 370 - lineIdx * 48;
      const fontSize = lineIdx === 0 ? 15 : 13;
      commands.push(`BT /F1 ${fontSize} Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`);
    });

    commands.push(
      '0.45 0.50 0.58 rg',
      `BT /F1 10 Tf 40 30 Td (VectorLMS PDF.js Vector Board · Page ${idx + 1} of ${pagesText.length}) Tj ET`
    );

    const stream = commands.join('\n');
    pageEntries.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 490] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`
    );
    pageEntries.push(
      `${contentObjNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    );
  });

  const allObjects = [...objects, ...pageEntries];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of allObjects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${allObjects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
