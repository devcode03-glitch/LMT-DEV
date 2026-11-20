/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { useLMS } from '../../context/LMSContext';
import { GeneratedExam, MCQQuestion } from '../../types/lms';
import {
  ParsedExcelMCQRow,
  parseExcelFileToMCQs,
  downloadGujaratiExcelTemplate,
  loadSampleGujaratiExcelRows
} from '../../utils/excelMcqParser';
import { PrepareTestModal } from './PrepareTestModal';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Eye,
  Sparkles,
  Check,
  X
} from 'lucide-react';

interface ExcelMCQUploaderProps {
  onViewInBank: (batchName?: string) => void;
  onExamPublished: (exam: GeneratedExam, launchImmediately: boolean) => void;
}

export const ExcelMCQUploader: React.FC<ExcelMCQUploaderProps> = ({
  onViewInBank,
  onExamPublished
}) => {
  const {
    examSubjects,
    examModules,
    examChapters,
    addExamChapter,
    addMCQQuestionsBulk
  } = useLMS();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Default to Gujarati subject
  const defaultGujSubject =
    examSubjects.find(s => s.id === 'sub-guj101') || examSubjects[0];

  const [targetSubjectId, setTargetSubjectId] = useState<string>(defaultGujSubject?.id || '');
  const [targetModuleId, setTargetModuleId] = useState<string>(() => {
    const mods = examModules.filter(m => m.subjectId === defaultGujSubject?.id);
    return mods[0]?.id || examModules[0]?.id || '';
  });
  const [defaultChapterId, setDefaultChapterId] = useState<string>(() => {
    const chaps = examChapters.filter(c => c.subjectId === defaultGujSubject?.id);
    return chaps[0]?.id || examChapters[0]?.id || '';
  });

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedExcelMCQRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Recently imported state
  const [importedQuestions, setImportedQuestions] = useState<MCQQuestion[]>([]);
  const [importedBatchName, setImportedBatchName] = useState<string>('');
  const [showPrepareModal, setShowPrepareModal] = useState(false);

  // Expanded row preview
  const [expandedRowNum, setExpandedRowNum] = useState<number | null>(null);

  const availableModules = useMemo(
    () => examModules.filter(m => m.subjectId === targetSubjectId),
    [examModules, targetSubjectId]
  );

  const availableChapters = useMemo(
    () => examChapters.filter(c => c.moduleId === targetModuleId),
    [examChapters, targetModuleId]
  );

  const handleSubjectChange = (subId: string) => {
    setTargetSubjectId(subId);
    const mods = examModules.filter(m => m.subjectId === subId);
    const nextModId = mods[0]?.id || '';
    setTargetModuleId(nextModId);
    const chaps = examChapters.filter(c => c.moduleId === nextModId);
    setDefaultChapterId(chaps[0]?.id || '');
  };

  const handleModuleChange = (modId: string) => {
    setTargetModuleId(modId);
    const chaps = examChapters.filter(c => c.moduleId === modId);
    setDefaultChapterId(chaps[0]?.id || '');
  };

  const processFile = async (file: File) => {
    setParseError(null);
    setIsParsing(true);
    setImportedQuestions([]);
    try {
      const { rows } = await parseExcelFileToMCQs(file);
      if (rows.length === 0) {
        setParseError(
          'Excel માં કોઈ માન્ય MCQ પ્રશ્નો મળ્યા નથી. કૃપા કરીને નમૂનાની Gujarati Excel ટેમ્પ્લેટ ડાઉનલોડ કરી તે મુજબ કોલમ રાખો.'
        );
        setParsedRows([]);
      } else {
        setUploadedFileName(file.name);
        setParsedRows(rows);
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Excel ફાઇલ વાંચવામાં ભૂલ આવી.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleLoadSampleGujarati = () => {
    setParseError(null);
    setImportedQuestions([]);
    const sampleRows = loadSampleGujaratiExcelRows();
    setUploadedFileName('Gujarati_MCQ_Exam_Template.xlsx');
    setParsedRows(sampleRows);
  };

  const handleRemoveRow = (rowNumber: number) => {
    setParsedRows(prev => prev.filter(r => r.rowNumber !== rowNumber));
  };

  const handleUpdateCorrectOption = (rowNumber: number, opt: 'A' | 'B' | 'C' | 'D') => {
    setParsedRows(prev =>
      prev.map(r => (r.rowNumber === rowNumber ? { ...r, correctOption: opt } : r))
    );
  };

  const validRows = useMemo(() => parsedRows.filter(r => r.isValid), [parsedRows]);
  const invalidCount = parsedRows.length - validRows.length;
  const gujaratiCount = validRows.filter(r => r.language === 'gu').length;

  const commitValidRowsToBank = (openPrepareAfter: boolean) => {
    if (validRows.length === 0) return;

    const batchLabel =
      uploadedFileName.replace(/\.(xlsx|xls|csv)$/i, '') || `Excel_Import_${Date.now()}`;

    const questionsToInsert: Omit<MCQQuestion, 'id'>[] = validRows.map(row => {
      let resolvedChapterId = defaultChapterId;
      let resolvedModuleId = targetModuleId;

      if (row.chapterName) {
        const matchedChapter = examChapters.find(
          c =>
            c.subjectId === targetSubjectId &&
            (c.name.trim().toLowerCase() === row.chapterName.trim().toLowerCase() ||
              c.name.includes(row.chapterName.trim()) ||
              row.chapterName.includes(c.name.trim()))
        );

        if (matchedChapter) {
          resolvedChapterId = matchedChapter.id;
          resolvedModuleId = matchedChapter.moduleId;
        } else {
          const createdChap = addExamChapter(targetSubjectId, targetModuleId, row.chapterName);
          resolvedChapterId = createdChap.id;
          resolvedModuleId = createdChap.moduleId;
        }
      }

      return {
        subjectId: targetSubjectId,
        moduleId: resolvedModuleId,
        chapterId: resolvedChapterId,
        questionText: row.questionText,
        options: [
          { key: 'A', text: row.optionA },
          { key: 'B', text: row.optionB },
          { key: 'C', text: row.optionC },
          { key: 'D', text: row.optionD }
        ],
        correctOption: row.correctOption,
        difficulty: row.difficulty,
        marks: row.marks,
        negativeMarks: row.negativeMarks,
        explanation: row.explanation,
        language: row.language,
        importBatchName: batchLabel
      };
    });

    const createdQuestions = addMCQQuestionsBulk(questionsToInsert);
    setImportedQuestions(createdQuestions);
    setImportedBatchName(batchLabel);

    if (openPrepareAfter) {
      setShowPrepareModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Excel Bulk MCQ Importer</span>
            <span>·</span>
            <span>ગુજરાતી Unicode (UTF-8) & English Supported</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Upload Gujarati MCQs from Excel & Prepare Test
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={downloadGujaratiExcelTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Download Gujarati Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleGujarati}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors shadow-xs whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Gujarati Excel</span>
          </button>
        </div>
      </div>

      {/* Step 1: Target Subject/Module/Chapter + Upload Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Target Taxonomy Mapping */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">1. Target Subject & Default Mapping</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose where imported Excel questions should be filed. If your Excel includes a{' '}
              <span className="font-mono text-slate-700">પ્રકરણ / Chapter</span> column, chapters are matched automatically.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Subject / વિષય</label>
              <select
                value={targetSubjectId}
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {examSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default Module / મોડ્યુલ</label>
              <select
                value={targetModuleId}
                onChange={e => handleModuleChange(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {availableModules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fallback Chapter / પ્રકરણ</label>
              <select
                value={defaultChapterId}
                onChange={e => setDefaultChapterId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {availableChapters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Supported Column Guide */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Supported Excel Columns (Gujarati or English):</p>
            <p className="leading-relaxed">
              પ્રશ્ન (Question), વિકલ્પ A/B/C/D (Option A–D), સાચો જવાબ (A/B/C/D અથવા ક/ખ/ગ/ઘ), મુશ્કેલી (EASY/MEDIUM/HARD અથવા સરળ/મધ્યમ/અઘરું), ગુણ (Marks), નેગેટિવ ગુણ, પ્રકરણ (Chapter), સમજૂતી (Explanation).
            </p>
          </div>
        </div>

        {/* Right: Drag & Drop Excel File Uploader */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">2. Upload Excel File (.xlsx, .xls, .csv)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Full UTF-8 Gujarati Unicode parsing in your browser — no garbled characters.
            </p>
          </div>

          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[190px] border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-slate-900 bg-slate-100'
                : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {isParsing
                ? 'Excel ફાઇલ વાંચી રહ્યા છીએ...'
                : 'Click to browse or drag & drop your Gujarati Excel file'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports <span className="font-mono">.xlsx</span>, <span className="font-mono">.xls</span>, and UTF-8{' '}
              <span className="font-mono">.csv</span> files with Gujarati script (ગુજરાતી)
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Select Excel File</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Post-Import Success Action Bar */}
      {importedQuestions.length > 0 && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-emerald-950 text-sm">
                {importedQuestions.length} MCQs Imported Successfully! ({importedBatchName})
              </p>
              <p className="text-emerald-800">
                પ્રશ્નો પ્રશ્નબેંકમાં સેવ થઈ ગયા છે. હવે તમે તેમને જોઈ શકો છો અથવા સીધો ઓનલાઇન ટેસ્ટ તૈયાર કરી ઉમેદવારને પરીક્ષા અપાવી શકો છો.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onViewInBank(importedBatchName)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View MCQs in Bank</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrepareModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Prepare Test & Give Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Validate Parsed Gujarati MCQs */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-800">{uploadedFileName}</span>
                <span>·</span>
                <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                  {validRows.length} Valid
                </span>
                {invalidCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-mono tabular-nums text-red-600 font-semibold">
                      {invalidCount} Errors
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="text-indigo-700 font-semibold">
                  {gujaratiCount} Gujarati (ગુજરાતી) MCQs
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Preview Uploaded MCQs Before Preparing Test
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setUploadedFileName('');
                  setImportedQuestions([]);
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Clear Preview
              </button>

              <button
                type="button"
                disabled={validRows.length === 0}
                onClick={() => commitValidRowsToBank(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 disabled:opacity-40 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save {validRows.length} MCQs to Bank</span>
              </button>

              <button
                type="button"
                disabled={validRows.length === 0}
                onClick={() => commitValidRowsToBank(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Import & Prepare Test Now</span>
              </button>
            </div>
          </div>

          {/* Parsed Rows Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3 w-12">Row</th>
                  <th className="px-4 py-3">Question & Options (પ્રશ્ન અને વિકલ્પો)</th>
                  <th className="px-4 py-3 w-24">Correct</th>
                  <th className="px-4 py-3 w-28">Difficulty</th>
                  <th className="px-4 py-3 w-24">Marks</th>
                  <th className="px-4 py-3 w-36">Status</th>
                  <th className="px-4 py-3 w-16 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map(row => {
                  const isExpanded = expandedRowNum === row.rowNumber;
                  return (
                    <tr
                      key={row.rowNumber}
                      className={`align-top transition-colors ${
                        row.isValid ? 'hover:bg-slate-50/70' : 'bg-red-50/40'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono tabular-nums text-slate-500">
                        #{row.rowNumber}
                      </td>
                      <td className="px-4 py-3.5 space-y-2 max-w-xl">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900 leading-relaxed text-[13px]">
                            {row.questionText || <span className="text-red-500 italic">Missing Question</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => setExpandedRowNum(isExpanded ? null : row.rowNumber)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                          >
                            {isExpanded ? 'Hide Details' : 'View Full'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {(
                            [
                              ['A', row.optionA],
                              ['B', row.optionB],
                              ['C', row.optionC],
                              ['D', row.optionD]
                            ] as const
                          ).map(([key, val]) => {
                            const isAns = row.correctOption === key;
                            return (
                              <div
                                key={key}
                                className={`px-2 py-1 rounded border ${
                                  isAns
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="font-mono font-bold mr-1.5">{key}.</span>
                                {val || <span className="text-red-500 italic">Empty</span>}
                              </div>
                            );
                          })}
                        </div>

                        {isExpanded && (
                          <div className="pt-1.5 space-y-1 text-[11px] text-slate-600 border-t border-slate-100">
                            {row.chapterName && (
                              <p>
                                <span className="font-semibold text-slate-800">પ્રકરણ / Chapter: </span>
                                {row.chapterName}
                              </p>
                            )}
                            {row.explanation && (
                              <p>
                                <span className="font-semibold text-slate-800">સમજૂતી / Explanation: </span>
                                {row.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={row.correctOption}
                          onChange={e =>
                            handleUpdateCorrectOption(
                              row.rowNumber,
                              e.target.value as 'A' | 'B' | 'C' | 'D'
                            )
                          }
                          className="font-mono font-bold text-xs px-2 py-1 bg-white border border-slate-300 rounded text-emerald-700"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold">
                        <span
                          className={
                            row.difficulty === 'EASY'
                              ? 'text-emerald-700'
                              : row.difficulty === 'MEDIUM'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }
                        >
                          {row.difficulty}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        +{row.marks} / -{row.negativeMarks}
                      </td>

                      <td className="px-4 py-3.5">
                        {row.isValid ? (
                          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{row.language === 'gu' ? 'Valid · ગુજરાતી' : 'Valid · EN'}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-red-700 space-y-0.5">
                            {row.errors.map((err, i) => (
                              <p key={i} className="flex items-start gap-1">
                                <X className="w-3 h-3 shrink-0 mt-0.5" />
                                <span>{err}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.rowNumber)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove row from import"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prepare Test Modal directly from Imported Excel MCQs */}
      {showPrepareModal && importedQuestions.length > 0 && (
        <PrepareTestModal
          questions={importedQuestions}
          defaultTitle={
            importedQuestions.some(q => q.language === 'gu')
              ? `ગુજરાતી MCQ કસોટી — ${importedBatchName}`
              : `Prepared Test — ${importedBatchName}`
          }
          sourceBatchName={importedBatchName}
          onClose={() => setShowPrepareModal(false)}
          onPublished={(exam, launchNow) => {
            setShowPrepareModal(false);
            onExamPublished(exam, launchNow);
          }}
        />
      )}
    </div>
  );
};
