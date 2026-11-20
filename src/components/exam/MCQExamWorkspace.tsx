/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { GeneratedExam, ExamResult } from '../../types/lms';
import { ExcelMCQUploader } from './ExcelMCQUploader';
import { InstructorQuestionBank } from './InstructorQuestionBank';
import { PaperBlueprintManager } from './PaperBlueprintManager';
import { StudentExamEngine } from './StudentExamEngine';
import { ExamReportSheet } from './ExamReportSheet';
import { 
  FileQuestion, 
  FileSpreadsheet, 
  Play, 
  BarChart2, 
  Clock, 
  ArrowRight,
  Upload,
  UserCheck,
  Trash2,
  ClipboardCheck
} from 'lucide-react';

type ExamSubTab = 'excel' | 'bank' | 'portal' | 'blueprints' | 'test' | 'reports';

export const MCQExamWorkspace: React.FC = () => {
  const {
    currentUser,
    generatedExams,
    deleteGeneratedExam,
    examResults,
    examSubjects
  } = useLMS();

  // Default to Excel Gujarati Upload so the complete Upload -> View -> Prepare -> Give Test flow is front and center
  const [activeSubTab, setActiveSubTab] = useState<ExamSubTab>('excel');

  // Optional batch filter when navigating from Excel uploader -> Question Bank
  const [bankBatchFilter, setBankBatchFilter] = useState<string | undefined>(undefined);

  // Active exam session & Candidate Name entry
  const [activeExam, setActiveExam] = useState<GeneratedExam | null>(null);
  const [candidateNameInput, setCandidateNameInput] = useState<string>(currentUser.name);

  // Active exam report to view
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  const handleStartExam = (exam: GeneratedExam) => {
    setActiveExam(exam);
    setActiveSubTab('test');
  };

  const handleExamPublished = (exam: GeneratedExam, launchImmediately: boolean) => {
    if (launchImmediately) {
      setActiveExam(exam);
      setActiveSubTab('test');
    } else {
      setActiveSubTab('portal');
    }
  };

  const handleFinishExam = (result: ExamResult) => {
    setActiveExam(null);
    setSelectedResult(result);
    setActiveSubTab('reports');
  };

  // If in active testing engine, render full test view
  if (activeSubTab === 'test' && activeExam) {
    return (
      <StudentExamEngine
        exam={activeExam}
        candidateName={candidateNameInput || currentUser.name}
        onFinishExam={handleFinishExam}
        onExitWithoutSubmitting={() => {
          setActiveExam(null);
          setActiveSubTab('portal');
        }}
      />
    );
  }

  // If viewing a specific report sheet
  if (activeSubTab === 'reports' && selectedResult) {
    return (
      <ExamReportSheet
        result={selectedResult}
        onBackToDashboard={() => setSelectedResult(null)}
      />
    );
  }

  const latestExam = generatedExams[0];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>MCQ Examination Engine</span>
              <span>·</span>
              <span>Excel Upload (ગુજરાતી) · Prepare Test · Candidate Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              MCQ Examination Architecture & Gujarati Excel Test Studio
            </h1>
          </div>

          {latestExam && (
            <button
              type="button"
              onClick={() => handleStartExam(latestExam)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Give Latest Test ({latestExam.questions.length} Qs)</span>
            </button>
          )}
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit text-xs font-medium border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('excel')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === 'excel'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Excel Upload (ગુજરાતી)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('bank')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === 'bank'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>2. View MCQs & Prepare</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('portal')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === 'portal'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. Candidate Test Portal ({generatedExams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('blueprints')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === 'blueprints'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Blueprints</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedResult(null);
              setActiveSubTab('reports');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeSubTab === 'reports'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Exam Reports ({examResults.length})</span>
          </button>
        </div>

        {/* Tab 1: Gujarati Excel Upload & Instant Test Preparation */}
        {activeSubTab === 'excel' && (
          <ExcelMCQUploader
            onViewInBank={batchName => {
              setBankBatchFilter(batchName);
              setActiveSubTab('bank');
            }}
            onExamPublished={handleExamPublished}
          />
        )}

        {/* Tab 2: Question Bank Viewer & Custom Test Selection */}
        {activeSubTab === 'bank' && (
          <InstructorQuestionBank
            initialBatchFilter={bankBatchFilter}
            onOpenExcelUpload={() => setActiveSubTab('excel')}
            onExamPublished={handleExamPublished}
          />
        )}

        {/* Tab 3: Candidate Test Portal (Give Prepared Tests) */}
        {activeSubTab === 'portal' && (
          <div className="space-y-6">
            {/* Candidate Identity Bar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Candidate Examination Portal · ઉમેદવાર પરીક્ષા પોર્ટલ
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter candidate name below and start any prepared Gujarati or English MCQ test.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Candidate Name:
                </label>
                <input
                  type="text"
                  value={candidateNameInput}
                  onChange={e => setCandidateNameInput(e.target.value)}
                  placeholder="ઉમેદવારનું નામ લખો..."
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 w-56 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Prepared Tests List */}
            <div className="space-y-3.5">
              {generatedExams.map(exam => {
                const subject = examSubjects.find(s => s.id === exam.subjectId);
                return (
                  <div
                    key={exam.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-slate-800">
                          {subject?.code || 'EXAM'}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-indigo-700">
                          {exam.language === 'gu' ? 'ગુજરાતી પરીક્ષા' : 'English Exam'}
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums text-slate-700">
                          {exam.questions.length} Questions
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums text-slate-700">
                          {exam.totalMarks} Marks
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {exam.durationMinutes} mins
                        </span>
                        <span>·</span>
                        <span>
                          Pass: <strong className="font-mono">{exam.passingPercentage}%</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                      {exam.description && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartExam(exam)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>
                          {exam.language === 'gu' ? 'પરીક્ષા શરૂ કરો (Start Test)' : 'Start Exam'}
                        </span>
                      </button>

                      {currentUser.role !== 'student' && generatedExams.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteGeneratedExam(exam.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete prepared test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {generatedExams.length === 0 && (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">No prepared tests available yet.</p>
                  <p className="text-xs text-slate-500">
                    Upload Gujarati MCQs from Excel and click "Prepare Test" to publish an exam here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Blueprints */}
        {activeSubTab === 'blueprints' && (
          <PaperBlueprintManager onLaunchExamPreview={handleStartExam} />
        )}

        {/* Tab 5: Exam Reports List */}
        {activeSubTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Candidate Examination Results & Score Reports
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {examResults.length} Submissions Logged
              </span>
            </div>

            <div className="space-y-3">
              {examResults.map(res => (
                <div
                  key={res.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">{res.studentName}</span>
                      <span>·</span>
                      <span>{res.submittedAt}</span>
                      <span>·</span>
                      <span className="font-mono">{res.totalQuestions} Questions</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{res.examTitle}</h4>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      Score: <strong className="text-slate-900">{res.score} / {res.totalMarks}</strong> ({res.percentage}%) · Correct: {res.correctCount} · Incorrect: {res.incorrectCount}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs font-bold ${
                        res.passed ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {res.passed ? 'PASSED' : 'NEEDS RETAKE'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedResult(res)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <span>View Report & Breakdown</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
