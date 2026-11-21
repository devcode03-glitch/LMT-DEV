/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PDFStorageDestination, UploadedPDFRecord } from '../../types/lms';
import { formatBytes } from '../../utils/pdfStorageService';
import {
  X,
  HardDrive,
  Cloud,
  Upload,
  FileText,
  Download,
  Trash2,
  ArrowRightLeft,
  Link2,
  Check,
  ExternalLink,
} from 'lucide-react';

interface PDFLibraryDrawerProps {
  isOpen: boolean;
  pdfs: UploadedPDFRecord[];
  activePdfId: string | null;
  onClose: () => void;
  onUploadNew: () => void;
  onOpenOnBoard: (record: UploadedPDFRecord) => void;
  onSaveToDisk: (record: UploadedPDFRecord) => void;
  onMigrateStorage: (record: UploadedPDFRecord, destination: PDFStorageDestination) => Promise<void>;
  onDelete: (record: UploadedPDFRecord) => Promise<void>;
}

export const PDFLibraryDrawer: React.FC<PDFLibraryDrawerProps> = ({
  isOpen,
  pdfs,
  activePdfId,
  onClose,
  onUploadNew,
  onOpenOnBoard,
  onSaveToDisk,
  onMigrateStorage,
  onDelete,
}) => {
  const [filter, setFilter] = useState<'all' | 'disk' | 'cloud'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isOpen) return null;

  const diskCount = pdfs.filter(p => p.storageDestination === 'disk').length;
  const cloudCount = pdfs.filter(p => p.storageDestination === 'cloud').length;

  const filtered = pdfs.filter(p => {
    if (filter === 'all') return true;
    return p.storageDestination === filter;
  });

  const handleCopySignedUrl = async (record: UploadedPDFRecord) => {
    if (!record.signedUrl) return;
    const fullUrl = record.signedUrl.startsWith('http')
      ? record.signedUrl
      : `${window.location.origin}${record.signedUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(prev => (prev === record.id ? null : prev)), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const handleMigrate = async (record: UploadedPDFRecord) => {
    const nextDest: PDFStorageDestination = record.storageDestination === 'cloud' ? 'disk' : 'cloud';
    setBusyId(record.id);
    try {
      await onMigrateStorage(record, nextDest);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (record: UploadedPDFRecord) => {
    setBusyId(record.id);
    try {
      await onDelete(record);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Uploaded PDF Library</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {diskCount} on Disk · {cloudCount} on Cloud
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onUploadNew();
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Close library"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Storage Filter Controls */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`py-1.5 rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({pdfs.length})
            </button>
            <button
              onClick={() => setFilter('disk')}
              className={`py-1.5 rounded-md transition-colors inline-flex items-center justify-center gap-1 ${
                filter === 'disk' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardDrive className="w-3 h-3" />
              <span>Disk ({diskCount})</span>
            </button>
            <button
              onClick={() => setFilter('cloud')}
              className={`py-1.5 rounded-md transition-colors inline-flex items-center justify-center gap-1 ${
                filter === 'cloud' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-3 h-3" />
              <span>Cloud ({cloudCount})</span>
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">No PDFs in this view</p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload any PDF and choose whether to save it on Local Disk or store it on Cloud.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onUploadNew();
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Your First PDF</span>
              </button>
            </div>
          ) : (
            filtered.map(pdf => {
              const isActive = pdf.id === activePdfId;
              const isCloud = pdf.storageDestination === 'cloud';
              const isBusy = busyId === pdf.id;

              return (
                <div
                  key={pdf.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isActive ? 'bg-indigo-50/40' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                          isCloud
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}
                      >
                        {isCloud ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate" title={pdf.name}>
                          {pdf.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                          {isCloud ? 'Stored on Cloud' : 'Saved on Disk'} · {formatBytes(pdf.sizeBytes)} ·{' '}
                          {pdf.pageCount} {pdf.pageCount === 1 ? 'pg' : 'pgs'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                          {isCloud ? pdf.cloudBucketPath : pdf.localDiskPath}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[11px] font-semibold text-indigo-700 shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Action Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => {
                        onOpenOnBoard(pdf);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open on Board</span>
                    </button>

                    <button
                      onClick={() => onSaveToDisk(pdf)}
                      className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 inline-flex items-center gap-1"
                      title="Save a copy to your computer disk"
                    >
                      <Download className="w-3 h-3" />
                      <span>Save to Disk</span>
                    </button>

                    <button
                      disabled={isBusy}
                      onClick={() => handleMigrate(pdf)}
                      className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 inline-flex items-center gap-1 disabled:opacity-50"
                      title={isCloud ? 'Move to Local Disk Storage' : 'Move to Cloud Storage'}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>{isCloud ? 'Move to Disk' : 'Move to Cloud'}</span>
                    </button>

                    {isCloud && pdf.signedUrl && (
                      <button
                        onClick={() => handleCopySignedUrl(pdf)}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 inline-flex items-center gap-1"
                        title="Copy 60-minute signed URL"
                      >
                        {copiedId === pdf.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="w-3 h-3" />
                            <span>Signed Link</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      disabled={isBusy}
                      onClick={() => handleDelete(pdf)}
                      className="ml-auto p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete PDF"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
