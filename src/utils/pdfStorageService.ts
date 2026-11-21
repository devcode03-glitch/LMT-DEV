/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFStorageDestination, UploadedPDFRecord } from '../types/lms';

const DB_NAME = 'VectorLMS_PDFStorage_v1';
const META_STORE = 'pdf_metadata';
const BLOB_STORE = 'pdf_blobs';

function openLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPutRecord(record: UploadedPDFRecord, bytes?: Uint8Array): Promise<void> {
  try {
    const db = await openLocalDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
      tx.objectStore(META_STORE).put(record);
      if (bytes) {
        tx.objectStore(BLOB_STORE).put(bytes.slice().buffer, record.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Gracefully ignore if IndexedDB is unavailable
  }
}

async function idbGetAllRecords(): Promise<UploadedPDFRecord[]> {
  try {
    const db = await openLocalDB();
    return await new Promise<UploadedPDFRecord[]>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).getAll();
      req.onsuccess = () => resolve((req.result as UploadedPDFRecord[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function idbGetBlob(id: string): Promise<Uint8Array | null> {
  try {
    const db = await openLocalDB();
    return await new Promise<Uint8Array | null>((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readonly');
      const req = tx.objectStore(BLOB_STORE).get(id);
      req.onsuccess = () => {
        if (req.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(req.result));
        } else if (req.result instanceof Uint8Array) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbDeleteRecord(id: string): Promise<void> {
  try {
    const db = await openLocalDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
      tx.objectStore(META_STORE).delete(id);
      tx.objectStore(BLOB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Triggers saving a PDF directly to the user's computer disk.
 * Uses File System Access API (showSaveFilePicker) when permitted, falling back to browser download.
 */
export async function savePdfToUserDisk(
  bytes: Uint8Array,
  fileName: string
): Promise<'picker' | 'download'> {
  const safeName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const pdfBlob = new Blob([bytes.slice().buffer], { type: 'application/pdf' });

  const win = window as unknown as {
    showSaveFilePicker?: (opts: {
      suggestedName: string;
      types: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
    }>;
  };

  if (typeof win.showSaveFilePicker === 'function') {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName: safeName,
        types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      return 'picker';
    } catch (err) {
      // If user explicitly cancelled the save picker, don't force fallback download
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'picker';
      }
      // SecurityError in iframe or unsupported context -> fall back to download link
    }
  }

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'download';
}

/**
 * Fetches all uploaded PDF metadata records from backend API, merging with local IndexedDB records.
 */
export async function listStoredPdfs(): Promise<UploadedPDFRecord[]> {
  const localRecords = await idbGetAllRecords();
  try {
    const res = await fetch('/api/pdfs');
    if (res.ok) {
      const data = (await res.json()) as { pdfs?: UploadedPDFRecord[] };
      const serverRecords = data.pdfs || [];
      const serverIds = new Set(serverRecords.map(r => r.id));
      const onlyLocal = localRecords.filter(r => !serverIds.has(r.id));
      return [...serverRecords, ...onlyLocal].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    }
  } catch {
    // Fallback to local records
  }
  return localRecords.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

/**
 * Persists an uploaded PDF to the user's chosen destination ('disk' or 'cloud').
 */
export async function persistUploadedPdf(params: {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  destination: PDFStorageDestination;
  batchId: string;
  lectureId?: string;
  uploadedBy: string;
}): Promise<UploadedPDFRecord> {
  const { name, bytes, pageCount, destination, batchId, lectureId, uploadedBy } = params;

  try {
    const base64Data = uint8ArrayToBase64(bytes);
    const res = await fetch('/api/pdfs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        sizeBytes: bytes.byteLength,
        pageCount,
        destination,
        batchId,
        lectureId,
        uploadedBy,
        base64Data,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { pdf: UploadedPDFRecord };
      // Also cache locally for instant board switching
      await idbPutRecord(data.pdf, bytes);
      return data.pdf;
    }
  } catch {
    // Fallback to browser-local persistence
  }

  const id = `pdf-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fallbackRecord: UploadedPDFRecord = {
    id,
    name,
    sizeBytes: bytes.byteLength,
    pageCount,
    storageDestination: destination,
    batchId,
    lectureId,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    localDiskPath: destination === 'disk' ? `local-disk://${safeName}` : undefined,
    cloudBucketPath: destination === 'cloud' ? `cloud://vectorlms-pdfs/${batchId}/${safeName}` : undefined,
    signedUrl:
      destination === 'cloud'
        ? `${window.location.origin}/api/pdfs/signed/${id}?expires=${Date.now() + 3600000}`
        : undefined,
    signedUrlExpiresAt: destination === 'cloud' ? Date.now() + 3600000 : undefined,
    savedOnServer: false,
  };

  await idbPutRecord(fallbackRecord, bytes);
  return fallbackRecord;
}

/**
 * Loads raw PDF bytes for rendering on the PDF.js Collaborative Board.
 */
export async function loadPdfBytes(record: UploadedPDFRecord): Promise<Uint8Array> {
  // Prefer local cache for instant rendering if available
  const cached = await idbGetBlob(record.id);
  if (cached && cached.byteLength > 0) {
    return cached;
  }

  // Otherwise fetch from server endpoint (signed URL for cloud, file route for disk)
  const fetchUrl =
    record.storageDestination === 'cloud' && record.signedUrl
      ? record.signedUrl
      : `/api/pdfs/file/${record.id}`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error('Could not retrieve PDF file from storage.');
  }
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  await idbPutRecord(record, bytes);
  return bytes;
}

/**
 * Migrates an uploaded PDF between Local Disk Storage and Cloud Object Storage.
 */
export async function migrateStoredPdf(
  record: UploadedPDFRecord,
  destination: PDFStorageDestination
): Promise<UploadedPDFRecord> {
  if (record.savedOnServer) {
    try {
      const res = await fetch(`/api/pdfs/${record.id}/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      });
      if (res.ok) {
        const data = (await res.json()) as { pdf: UploadedPDFRecord };
        await idbPutRecord(data.pdf);
        return data.pdf;
      }
    } catch {
      // Fallback below
    }
  }

  const safeName = record.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const updated: UploadedPDFRecord = {
    ...record,
    storageDestination: destination,
    localDiskPath: destination === 'disk' ? `local-disk://${safeName}` : undefined,
    cloudBucketPath:
      destination === 'cloud' ? `cloud://vectorlms-pdfs/${record.batchId}/${safeName}` : undefined,
    signedUrl:
      destination === 'cloud'
        ? `${window.location.origin}/api/pdfs/signed/${record.id}?expires=${Date.now() + 3600000}`
        : undefined,
    signedUrlExpiresAt: destination === 'cloud' ? Date.now() + 3600000 : undefined,
  };
  await idbPutRecord(updated);
  return updated;
}

/**
 * Deletes an uploaded PDF from Disk or Cloud storage.
 */
export async function deleteStoredPdf(record: UploadedPDFRecord): Promise<void> {
  if (record.savedOnServer) {
    try {
      await fetch(`/api/pdfs/${record.id}`, { method: 'DELETE' });
    } catch {
      // Continue with local cleanup
    }
  }
  await idbDeleteRecord(record.id);
}
