/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PDFStorageDestination } from '../../types/lms';
import { inspectPdfBytes, generateSampleLecturePdfBytes } from '../../utils/pdfRenderer';
import { formatBytes } from '../../utils/pdfStorageService';
import {
  X,
  HardDrive,
  Cloud,
  Upload,
  FileText,
  Check,
  ShieldCheck,
  FolderDown,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface PDFUploadStorageModalProps {
  isOpen: boolean;
  preselectedFile: File | null;
  activeBatchName: string;
  onClose: () => void;
  onConfirmUpload: (params: {
    name: string;
    bytes: Uint8Array;
    pageCount: number;
    destination: PDFStorageDestination;
    alsoSaveToComputerDisk: boolean;
  }) => Promise<void>;
}

interface PendingPdfState {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  sizeBytes: number;
}

export const PDFUploadStorageModal: React.FC<PDFUploadStorageModalProps> = ({
  isOpen,
  preselectedFile,
  activeBatchName,
  onClose,
  onConfirmUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingPdf, setPendingPdf] = useState<PendingPdfState | null>(null);
  const [destination, setDestination] = useState<PDFStorageDestination>('cloud');
  const [alsoSaveToComputerDisk, setAlsoSaveToComputerDisk] = useState<boolean>(true);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Please select a valid PDF document (.pdf).');
      return;
    }

    setErrorMsg(null);
    setIsInspecting(true);
    try {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      const { pageCount } = await inspectPdfBytes(bytes);
      setPendingPdf({
        name: file.name,
        bytes,
        pageCount,
        sizeBytes: bytes.byteLength,
      });
    } catch {
      setErrorMsg('Could not parse this PDF file. Please verify it is a valid, uncorrupted PDF.');
      setPendingPdf(null);
    } finally {
      setIsInspecting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setPendingPdf(null);
      setErrorMsg(null);
      setIsInspecting(false);
      setIsSubmitting(false);
      return;
    }
    if (preselectedFile) {
      loadFile(preselectedFile);
    }
  }, [isOpen, preselectedFile]);

  const handleLoadSamplePdf = async () => {
    setErrorMsg(null);
    setIsInspecting(true);
    try {
      const bytes = generateSampleLecturePdfBytes();
      const { pageCount } = await inspectPdfBytes(bytes);
      setPendingPdf({
        name: 'Distributed_Systems_Lecture_Deck.pdf',
        bytes,
        pageCount,
        sizeBytes: bytes.byteLength,
      });
    } catch {
      setErrorMsg('Unable to generate sample PDF.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const handleConfirm = async () => {
    if (!pendingPdf || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmUpload({
        name: pendingPdf.name,
        bytes: pendingPdf.bytes,
        pageCount: pendingPdf.pageCount,
        destination,
        alsoSaveToComputerDisk: destination === 'disk' && alsoSaveToComputerDisk,
      });
      onClose();
    } catch {
      setErrorMsg('Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Upload PDF & Choose Storage Destination
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select whether to save this document on local disk or store it on cloud for {activeBatchName}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* File Picker / Selected File Summary */}
          {!pendingPdf ? (
            <div className="space-y-3">
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
                }`}
              >
                {isInspecting ? (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                    <p className="text-sm font-medium">Inspecting PDF pages with PDF.js...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <Upload className="w-5 h-5 text-slate-700" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      Click to choose a PDF file or drag and drop here
                    </p>
                    <p className="text-xs text-slate-500">
                      Parsed locally in your browser via PDF.js · Supports multi-page decks up to 50 MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  No PDF file handy to test?
                </span>
                <button
                  type="button"
                  onClick={handleLoadSamplePdf}
                  disabled={isInspecting}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:underline disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample 3-Page Lecture PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{pendingPdf.name}</p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {formatBytes(pendingPdf.sizeBytes)} · {pendingPdf.pageCount}{' '}
                    {pendingPdf.pageCount === 1 ? 'page' : 'pages'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 shrink-0"
              >
                Change File
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) loadFile(file);
              e.target.value = '';
            }}
          />

          {/* Per-Upload Storage Choice Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Storage Destination for This Upload
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Save on Disk */}
              <button
                type="button"
                onClick={() => setDestination('disk')}
                className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  destination === 'disk'
                    ? 'border-slate-900 bg-slate-50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      destination === 'disk'
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {destination === 'disk' && <Check className="w-3 h-3" />}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Save on Disk</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Persist directly to local disk storage without cloud bucket sync. Best for private drafts or offline copies.
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate pt-1 border-t border-slate-200/70">
                  ./storage/local-disk/
                </div>
              </button>

              {/* Option 2: Store on Cloud */}
              <button
                type="button"
                onClick={() => setDestination('cloud')}
                className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  destination === 'cloud'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      destination === 'cloud'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {destination === 'cloud' && <Check className="w-3 h-3" />}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Store on Cloud</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Upload to encrypted Cloud Bucket with 60-min signed URLs so enrolled students can access the deck anywhere.
                  </p>
                </div>
                <div className="text-[11px] text-indigo-700 font-mono truncate pt-1 border-t border-indigo-100">
                  cloud://vectorlms-pdfs/
                </div>
              </button>
            </div>

            {/* Secondary Option Context */}
            {destination === 'disk' ? (
              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoSaveToComputerDisk}
                  onChange={e => setAlsoSaveToComputerDisk(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <FolderDown className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs text-slate-700">
                  Also save a copy directly to my computer's local disk folder now
                </span>
              </label>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Protected with HMAC-signed URLs expiring automatically after 60 minutes (SRS S-2).
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!pendingPdf || isSubmitting || isInspecting}
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              destination === 'cloud'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{destination === 'cloud' ? 'Uploading to Cloud...' : 'Saving on Disk...'}</span>
              </>
            ) : destination === 'cloud' ? (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>Store on Cloud & Open on Board</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>Save on Disk & Open on Board</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
