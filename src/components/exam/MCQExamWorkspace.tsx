/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { GeneratedExam, ExamResult } from '../../types/lms';
import { InstructorQuestionBank } from './InstructorQuestionBank';
import { PaperBlueprintManager } from './PaperBlueprintManager';
import { StudentExamEngine } from './StudentExamEngine';
import { ExamReportSheet } from './ExamReportSheet';
import { 
  FileQuestion, 
  FileSpreadsheet, 
  Play, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const MCQExamWorkspace: React.FC = () => {
  const { currentUser, generatedExams, examResults, mcqQuestions, examBlueprints } = useLMS();

  // Active sub-view
  const [activeSubTab, setActiveSubTab] = useState<'bank' | 'blueprints' | 'test' | 'reports'>('bank');

  // Active exam session
  const [activeExam, setActiveExam] = useState<GeneratedExam | null>(null);

  // Active exam report to view
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(examResults[0] || null);

  // Launch test from Blueprint or pre-compiled list
  const handleStartExam = (exam: GeneratedExam) => {
    setActiveExam(exam);
    setActiveSubTab('test');
  };

  // Launch default compiled sample exam if none selected
  const handleStartSampleExam = () => {
    const sampleExam: GeneratedExam = {
      id: 'exam-sample-cs401',
      title: 'CS-401 Distributed Consensus Assessment',
      subjectId: 'sub-cs401',
      durationMinutes: 15,
      passingPercentage: 70,
      totalMarks: 24,
      questions: mcqQuestions.slice(0, 8),
      createdAt: new Date().toISOString()
    };
    setActiveExam(sampleExam);
    setActiveSubTab('test');
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
        onFinishExam={handleFinishExam}
        onExitWithoutSubmitting={() => {
          setActiveExam(null);
          setActiveSubTab('bank');
        }}
      />
    );
  }

  // If in report view and a result is selected, render ExamReportSheet
  if (activeSubTab === 'reports' && selectedResult) {
    return (
      <ExamReportSheet
        result={selectedResult}
        onBackToDashboard={() => setActiveSubTab('bank')}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Module Sub-Header & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>MCQ Examination Engine</span>
              <span>·</span>
              <span>Architecture & Implementation</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              MCQ Examination Architecture & Testing Engine
            </h1>
          </div>

          {/* Quick Launch Active Test CTA */}
          <button
            onClick={handleStartSampleExam}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Timed Student Exam</span>
          </button>
        </div>

        {/* Sub-Tabs Navigation (Functional Segmented Buttons) */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit text-xs font-medium border border-slate-200">
          <button
            onClick={() => setActiveSubTab('bank')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'bank'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>Question Bank & Input (Sec 2)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('blueprints')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'blueprints'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Paper Blueprints (Sec 2)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'reports'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Exam Reports & Breakdown (Sec 4)</span>
          </button>
        </div>

        {/* Content based on sub-tab */}
        {activeSubTab === 'bank' && <InstructorQuestionBank />}

        {activeSubTab === 'blueprints' && (
          <PaperBlueprintManager onLaunchExamPreview={handleStartExam} />
        )}

        {activeSubTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Student Examination Results & Score Reports
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {examResults.length} Submissions Logged
              </span>
            </div>

            <div className="space-y-3">
              {examResults.map(res => (
                <div
                  key={res.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors"
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
                    <p className="text-xs text-slate-500 font-mono">
                      Score: <strong className="text-slate-900">{res.score} / {res.totalMarks}</strong> ({res.percentage}%) · Correct: {res.correctCount} · Incorrect: {res.incorrectCount}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                      res.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedResult(res);
                        setActiveSubTab('reports');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <span>View Chapter Diagnostics</span>
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
