/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

interface StoredPDFMetadata {
  id: string;
  name: string;
  safeFileName: string;
  sizeBytes: number;
  pageCount: number;
  storageDestination: 'disk' | 'cloud';
  batchId: string;
  lectureId?: string;
  uploadedBy: string;
  uploadedAt: string;
  localDiskPath?: string;
  cloudBucketPath?: string;
  storedFilePath: string;
}

const PORT = Number(process.env.PORT) || 3000;
const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const LOCAL_DISK_DIR = path.join(STORAGE_ROOT, 'local-disk');
const CLOUD_BUCKET_DIR = path.join(STORAGE_ROOT, 'cloud-bucket');
const INDEX_FILE = path.join(STORAGE_ROOT, 'pdf-index.json');
const SIGNING_SECRET = process.env.PDF_SIGNING_SECRET || 'vectorlms-cloud-signed-url-secret-v1';
const SIGNED_URL_TTL_MS = 60 * 60 * 1000; // 60 minutes per SRS S-2

function ensureStorageDirs() {
  fs.mkdirSync(LOCAL_DISK_DIR, { recursive: true });
  fs.mkdirSync(CLOUD_BUCKET_DIR, { recursive: true });
}

function readIndex(): StoredPDFMetadata[] {
  ensureStorageDirs();
  if (!fs.existsSync(INDEX_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(records: StoredPDFMetadata[]) {
  ensureStorageDirs();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name || 'document.pdf');
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

function createSignedToken(id: string, expiresAt: number): string {
  return crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(`${id}:${expiresAt}`)
    .digest('hex')
    .slice(0, 32);
}

function serializeRecord(rec: StoredPDFMetadata) {
  if (rec.storageDestination === 'cloud') {
    const expiresAt = Date.now() + SIGNED_URL_TTL_MS;
    const token = createSignedToken(rec.id, expiresAt);
    return {
      id: rec.id,
      name: rec.name,
      sizeBytes: rec.sizeBytes,
      pageCount: rec.pageCount,
      storageDestination: rec.storageDestination,
      batchId: rec.batchId,
      lectureId: rec.lectureId,
      uploadedBy: rec.uploadedBy,
      uploadedAt: rec.uploadedAt,
      cloudBucketPath: rec.cloudBucketPath,
      signedUrl: `/api/pdfs/signed/${rec.id}?token=${token}&expires=${expiresAt}`,
      signedUrlExpiresAt: expiresAt,
      savedOnServer: true,
    };
  }

  return {
    id: rec.id,
    name: rec.name,
    sizeBytes: rec.sizeBytes,
    pageCount: rec.pageCount,
    storageDestination: rec.storageDestination,
    batchId: rec.batchId,
    lectureId: rec.lectureId,
    uploadedBy: rec.uploadedBy,
    uploadedAt: rec.uploadedAt,
    localDiskPath: rec.localDiskPath,
    savedOnServer: true,
  };
}

async function startServer() {
  ensureStorageDirs();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // List all uploaded PDFs (with fresh signed URLs for cloud records)
  app.get('/api/pdfs', (_req, res) => {
    const records = readIndex().filter(rec => fs.existsSync(rec.storedFilePath));
    res.json({ pdfs: records.map(serializeRecord) });
  });

  // Upload a PDF with explicit per-upload storage choice ('disk' | 'cloud')
  app.post('/api/pdfs/upload', (req, res) => {
    try {
      const {
        name,
        sizeBytes,
        pageCount,
        destination,
        batchId,
        lectureId,
        uploadedBy,
        base64Data,
      } = req.body as {
        name?: string;
        sizeBytes?: number;
        pageCount?: number;
        destination?: 'disk' | 'cloud';
        batchId?: string;
        lectureId?: string;
        uploadedBy?: string;
        base64Data?: string;
      };

      if (!name || !base64Data || (destination !== 'disk' && destination !== 'cloud')) {
        res.status(400).json({ error: 'Missing required PDF upload fields or invalid storage destination.' });
        return;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0) {
        res.status(400).json({ error: 'Uploaded PDF data is empty.' });
        return;
      }

      const id = `pdf-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const safeFileName = sanitizeFileName(name);
      const safeBatch = (batchId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');

      let storedFilePath = '';
      let localDiskPath: string | undefined;
      let cloudBucketPath: string | undefined;

      if (destination === 'disk') {
        storedFilePath = path.join(LOCAL_DISK_DIR, `${id}_${safeFileName}`);
        localDiskPath = `./storage/local-disk/${id}_${safeFileName}`;
        fs.writeFileSync(storedFilePath, buffer);
      } else {
        const batchBucketDir = path.join(CLOUD_BUCKET_DIR, safeBatch);
        fs.mkdirSync(batchBucketDir, { recursive: true });
        storedFilePath = path.join(batchBucketDir, `${id}_${safeFileName}`);
        cloudBucketPath = `cloud://vectorlms-pdfs/${safeBatch}/${id}_${safeFileName}`;
        fs.writeFileSync(storedFilePath, buffer);
      }

      const newRecord: StoredPDFMetadata = {
        id,
        name,
        safeFileName,
        sizeBytes: sizeBytes || buffer.length,
        pageCount: Math.max(1, Number(pageCount) || 1),
        storageDestination: destination,
        batchId: batchId || 'general',
        lectureId,
        uploadedBy: uploadedBy || 'Instructor',
        uploadedAt: new Date().toISOString(),
        localDiskPath,
        cloudBucketPath,
        storedFilePath,
      };

      const existing = readIndex();
      writeIndex([newRecord, ...existing]);

      res.status(201).json({ pdf: serializeRecord(newRecord) });
    } catch (err) {
      console.error('PDF upload failed:', err);
      res.status(500).json({ error: 'Failed to persist PDF file.' });
    }
  });

  // Stream PDF file directly (used for local disk stored PDFs and downloads)
  app.get('/api/pdfs/file/:id', (req, res) => {
    const records = readIndex();
    const rec = records.find(r => r.id === req.params.id);
    if (!rec || !fs.existsSync(rec.storedFilePath)) {
      res.status(404).json({ error: 'PDF file not found.' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${rec.safeFileName}"`);
    fs.createReadStream(rec.storedFilePath).pipe(res);
  });

  // Stream Cloud PDF via expiring HMAC-signed URL (SRS S-2)
  app.get('/api/pdfs/signed/:id', (req, res) => {
    const { id } = req.params;
    const token = String(req.query.token || '');
    const expires = Number(req.query.expires || 0);

    if (!token || !expires || Date.now() > expires) {
      res.status(403).json({ error: 'Signed URL has expired or is invalid.' });
      return;
    }

    const expected = createSignedToken(id, expires);
    if (token !== expected) {
      res.status(403).json({ error: 'Invalid signed URL signature.' });
      return;
    }

    const records = readIndex();
    const rec = records.find(r => r.id === id);
    if (!rec || !fs.existsSync(rec.storedFilePath)) {
      res.status(404).json({ error: 'Cloud PDF object not found.' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${rec.safeFileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    fs.createReadStream(rec.storedFilePath).pipe(res);
  });

  // Migrate an uploaded PDF between Disk and Cloud storage
  app.post('/api/pdfs/:id/migrate', (req, res) => {
    try {
      const { id } = req.params;
      const { destination } = req.body as { destination?: 'disk' | 'cloud' };
      if (destination !== 'disk' && destination !== 'cloud') {
        res.status(400).json({ error: 'Invalid target destination.' });
        return;
      }

      const records = readIndex();
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'PDF record not found.' });
        return;
      }

      const rec = records[idx];
      if (!fs.existsSync(rec.storedFilePath)) {
        res.status(404).json({ error: 'Source PDF file missing.' });
        return;
      }

      if (rec.storageDestination === destination) {
        res.json({ pdf: serializeRecord(rec) });
        return;
      }

      const safeBatch = (rec.batchId || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
      let targetPath = '';
      let localDiskPath: string | undefined;
      let cloudBucketPath: string | undefined;

      if (destination === 'disk') {
        targetPath = path.join(LOCAL_DISK_DIR, `${rec.id}_${rec.safeFileName}`);
        localDiskPath = `./storage/local-disk/${rec.id}_${rec.safeFileName}`;
      } else {
        const batchBucketDir = path.join(CLOUD_BUCKET_DIR, safeBatch);
        fs.mkdirSync(batchBucketDir, { recursive: true });
        targetPath = path.join(batchBucketDir, `${rec.id}_${rec.safeFileName}`);
        cloudBucketPath = `cloud://vectorlms-pdfs/${safeBatch}/${rec.id}_${rec.safeFileName}`;
      }

      fs.copyFileSync(rec.storedFilePath, targetPath);
      if (rec.storedFilePath !== targetPath && fs.existsSync(rec.storedFilePath)) {
        fs.unlinkSync(rec.storedFilePath);
      }

      const updated: StoredPDFMetadata = {
        ...rec,
        storageDestination: destination,
        localDiskPath,
        cloudBucketPath,
        storedFilePath: targetPath,
      };
      records[idx] = updated;
      writeIndex(records);

      res.json({ pdf: serializeRecord(updated) });
    } catch (err) {
      console.error('PDF migration failed:', err);
      res.status(500).json({ error: 'Failed to move PDF storage location.' });
    }
  });

  // Delete an uploaded PDF from Disk or Cloud
  app.delete('/api/pdfs/:id', (req, res) => {
    const { id } = req.params;
    const records = readIndex();
    const rec = records.find(r => r.id === id);
    if (rec && fs.existsSync(rec.storedFilePath)) {
      try {
        fs.unlinkSync(rec.storedFilePath);
      } catch {
        // Ignore cleanup failure
      }
    }
    const remaining = records.filter(r => r.id !== id);
    writeIndex(remaining);
    res.json({ deleted: true, id });
  });

  // Mount Vite middleware in development or serve static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VectorLMS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});
