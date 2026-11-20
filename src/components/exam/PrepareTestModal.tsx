/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { GeneratedExam, MCQQuestion } from '../../types/lms';
import { Play, CheckCircle2, Clock, Percent, Shuffle, ShieldAlert, Languages } from 'lucide-react';

interface PrepareTestModalProps {
  questions: MCQQuestion[];
  defaultTitle?: string;
  sourceBatchName?: string;
  onClose: () => void;
  onPublished: (exam: GeneratedExam, launchImmediately: boolean) => void;
}

export const PrepareTestModal: React.FC<PrepareTestModalProps> = ({
  questions,
  defaultTitle,
  sourceBatchName,
  onClose,
  onPublished
}) => {
  const { createGeneratedExam } = useLMS();

  const isMostlyGujarati =
    questions.filter(q => q.language === 'gu').length >= Math.ceil(questions.length / 2);

  const [title, setTitle] = useState(
    defaultTitle ||
      (isMostlyGujarati
        ? 'ગુજરાતી MCQ પરીક્ષા (Excel ટેસ્ટ)'
        : 'Prepared MCQ Assessment')
  );
  const [description, setDescription] = useState(
    isMostlyGujarati
      ? 'Excel માંથી અપલોડ કરેલા ગુજરાતી પ્રશ્નો પર આધારિત ઓનલાઇન સમયબદ્ધ કસોટી.'
      : 'Timed multiple-choice examination prepared from imported question bank items.'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    Math.max(5, Math.ceil(questions.length * 1.5))
  );
  const [passingPercentage, setPassingPercentage] = useState<number>(60);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState<boolean>(true);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(false);
  const [examLanguage, setExamLanguage] = useState<'gu' | 'en'>(isMostlyGujarati ? 'gu' : 'en');

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 2), 0);

  const buildAndPublish = (launchImmediately: boolean) => {
    if (!title.trim() || questions.length === 0) return;

    const orderedQuestions = shuffleQuestions
      ? [...questions].sort(() => Math.random() - 0.5)
      : [...questions];

    const exam: GeneratedExam = {
      id: `exam-prep-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      subjectId: questions[0]?.subjectId || 'sub-guj101',
      durationMinutes,
      passingPercentage,
      totalMarks,
      negativeMarkingEnabled,
      language: examLanguage,
      sourceBatchName,
      questions: orderedQuestions,
      createdAt: new Date().toISOString()
    };

    createGeneratedExam(exam);
    onPublished(exam, launchImmediately);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <p className="text-xs font-mono text-indigo-600 font-semibold">
              Prepare Candidate Examination · ટેસ્ટ તૈયાર કરો
            </p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Configure Test from {questions.length} MCQs ({totalMarks} Total Marks)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm px-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Test Title */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Exam Title / પરીક્ષાનું નામ
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. ગુજરાતી સામાન્ય જ્ઞાન કસોટી - ૧"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Instructions / પરીક્ષાની સૂચનાઓ
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Timing & Passing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Duration (Mins)</span>
              </label>
              <input
                type="number"
                min={1}
                max={240}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Percent className="w-3.5 h-3.5 text-slate-500" />
                <span>Passing %</span>
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={passingPercentage}
                onChange={e => setPassingPercentage(Math.min(100, Math.max(10, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Languages className="w-3.5 h-3.5 text-slate-500" />
                <span>Exam UI Language</span>
              </label>
              <select
                value={examLanguage}
                onChange={e => setExamLanguage(e.target.value as 'gu' | 'en')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={negativeMarkingEnabled}
                onChange={e => setNegativeMarkingEnabled(e.target.checked)}
                className="rounded accent-slate-900"
              />
              <div className="min-w-0">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Negative Marking
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Deduct penalty on incorrect answers
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={e => setShuffleQuestions(e.target.checked)}
                className="rounded accent-slate-900"
              />
              <div className="min-w-0">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                  Shuffle Order
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Randomize MCQ sequence for candidates
                </span>
              </div>
            </label>
          </div>

          {/* Quick Question Preview Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Included Questions Preview</span>
              <span className="font-mono tabular-nums">
                {questions.length} MCQs · {totalMarks} Marks
              </span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {questions.slice(0, 6).map((q, i) => (
                <div key={q.id} className="text-[11px] text-slate-700 truncate">
                  <span className="font-mono text-slate-400 mr-1.5">{i + 1}.</span>
                  {q.questionText}
                </div>
              ))}
              {questions.length > 6 && (
                <div className="text-[11px] text-slate-400 italic">
                  + {questions.length - 6} more questions included...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => buildAndPublish(false)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Save to Candidate Portal</span>
          </button>
          <button
            type="button"
            onClick={() => buildAndPublish(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Prepare & Give Test Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
