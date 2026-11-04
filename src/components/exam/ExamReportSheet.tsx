/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExamResult } from '../../types/lms';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  ArrowLeft, 
  Download, 
  Check, 
  X,
  HelpCircle,
  Layers,
  BookOpen
} from 'lucide-react';

interface ExamReportSheetProps {
  result: ExamResult;
  onBackToDashboard: () => void;
}

export const ExamReportSheet: React.FC<ExamReportSheetProps> = ({ 
  result, 
  onBackToDashboard 
}) => {
  const [filterReview, setFilterReview] = useState<'all' | 'incorrect' | 'correct'>('all');

  const filteredQuestions = result.questionDetails.filter(q => {
    if (filterReview === 'correct') return q.isCorrect;
    if (filterReview === 'incorrect') return !q.isCorrect;
    return true;
  });

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Examination Console</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print Official Score Report</span>
          </button>
        </div>

        {/* Master Score Banner (Section 4) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-indigo-600 uppercase">
              Section 4 Verified Score Sheet
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {result.examTitle}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
              <span className="font-semibold text-slate-800">{result.studentName}</span>
              <span>·</span>
              <span>Submitted {result.submittedAt}</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatSeconds(result.timeTakenSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 sm:border-l sm:border-slate-200 sm:pl-6">
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase font-mono font-semibold">Final Score</span>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {result.score} <span className="text-sm font-normal text-slate-400">/ {result.totalMarks}</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">
                {result.percentage}% Marks
              </span>
            </div>

            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wide border ${
                result.passed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}>
                {result.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                <span>{result.passed ? 'PASSED' : 'NEEDS RETAKE'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4-Column Key Metrics Strip (Section 4) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Correct Answers</span>
            <p className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              {result.correctCount}
            </p>
            <p className="text-[11px] text-slate-400">Full points awarded</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Incorrect (Penalized)</span>
            <p className="text-2xl font-bold font-mono text-red-600 tabular-nums">
              {result.incorrectCount}
            </p>
            <p className="text-[11px] text-slate-400">Negative marks applied</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Unanswered / Skipped</span>
            <p className="text-2xl font-bold font-mono text-slate-700 tabular-nums">
              {result.unansweredCount}
            </p>
            <p className="text-[11px] text-slate-400">0 points awarded</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Pacing Speed</span>
            <p className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
              {Math.round(result.timeTakenSeconds / (result.totalQuestions || 1))}s
            </p>
            <p className="text-[11px] text-slate-400">Average time per question</p>
          </div>
        </div>

        {/* Chapter Breakdown Table (Section 4 Mandatory Requirement) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-2 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Chapter Breakdown & Weakness Diagnosis (Section 4)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted chapter/topic performance diagnostics highlighting mastery areas and deficiency gaps.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              {result.chapterBreakdown.length} Chapters Assessed
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-5 py-3">Chapter Name</th>
                  <th className="px-5 py-3">Module Context</th>
                  <th className="px-5 py-3">Total Qs</th>
                  <th className="px-5 py-3">Correct / Total</th>
                  <th className="px-5 py-3">Accuracy %</th>
                  <th className="px-5 py-3 text-right">Mastery Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.chapterBreakdown.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {ch.chapterName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {ch.moduleName}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-slate-700">
                      {ch.totalQuestions}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-slate-700">
                      {ch.correctCount} / {ch.totalQuestions}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums font-bold text-slate-900">
                      {ch.accuracyPercentage}%
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                        ch.masteryLevel === 'High'
                          ? 'bg-emerald-50 text-emerald-800'
                          : ch.masteryLevel === 'Needs Review'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-red-50 text-red-800'
                      }`}>
                        {ch.masteryLevel === 'High' && '● '}
                        {ch.masteryLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Question Review Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Question-by-Question Solution Review</h3>
              <p className="text-xs text-slate-500">Compare your answers against correct solutions and detailed rationales.</p>
            </div>

            {/* Filter segmented buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilterReview('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterReview === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({result.questionDetails.length})
              </button>
              <button
                onClick={() => setFilterReview('incorrect')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterReview === 'incorrect' ? 'bg-white text-red-700 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Incorrect ({result.incorrectCount + result.unansweredCount})
              </button>
              <button
                onClick={() => setFilterReview('correct')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterReview === 'correct' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Correct ({result.correctCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const isCorrect = q.isCorrect;
              const isUnanswered = q.selectedOption === null;

              return (
                <div 
                  key={q.questionId}
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : 'bg-red-50/20 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="font-mono font-bold text-slate-800">Item {idx + 1}</span>
                        <span>·</span>
                        <span>{q.chapterName}</span>
                        <span>·</span>
                        <span className="font-mono text-[11px] font-bold text-slate-700">{q.difficulty}</span>
                      </div>
                      <p className="font-semibold text-slate-900 leading-snug">{q.questionText}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${
                        isCorrect ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {q.marksAwarded > 0 ? `+${q.marksAwarded}` : q.marksAwarded} pts
                      </span>
                    </div>
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] bg-white p-3 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Your Response:</span>
                      <p className={`font-mono font-bold ${
                        isCorrect ? 'text-emerald-700' : isUnanswered ? 'text-slate-400 italic' : 'text-red-700'
                      }`}>
                        {isUnanswered ? 'Skipped / Unanswered' : `Option ${q.selectedOption}`}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">Correct Option:</span>
                      <p className="font-mono font-bold text-emerald-700">
                        Option {q.correctOption}
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="p-2.5 bg-white/80 rounded-lg text-slate-700 leading-relaxed border border-slate-200/60">
                      <span className="font-bold text-slate-900">Pedagogical Rationale: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
