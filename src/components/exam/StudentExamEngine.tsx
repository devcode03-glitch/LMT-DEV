/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLMS } from '../../context/LMSContext';
import { 
  GeneratedExam, 
  MCQQuestion, 
  StudentAnswerState, 
  ExamResult, 
  ChapterPerformanceMetric, 
  ExamQuestionReviewDetail 
} from '../../types/lms';
import { 
  Clock, 
  Bookmark, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  Send, 
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentExamEngineProps {
  exam: GeneratedExam;
  onFinishExam: (result: ExamResult) => void;
  onExitWithoutSubmitting?: () => void;
}

export const StudentExamEngine: React.FC<StudentExamEngineProps> = ({ 
  exam, 
  onFinishExam,
  onExitWithoutSubmitting
}) => {
  const { currentUser, examChapters, examModules, submitExamResult } = useLMS();

  // Active question index
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Answers State: questionId -> StudentAnswerState
  const [answers, setAnswers] = useState<Record<string, StudentAnswerState>>({});

  // Countdown timer in seconds
  const [remainingSeconds, setRemainingSeconds] = useState<number>(exam.durationMinutes * 60);

  // Auto-save feedback timestamp
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>('Just now');
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Submission confirmation modal
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  const questions = exam.questions;
  const currentQuestion: MCQQuestion = questions[currentIdx] || questions[0];
  const currentAnswerState = answers[currentQuestion?.id] || { selectedOption: null, isFlagged: false, savedAt: Date.now() };

  // Timer Tick & Auto-Submission on expiry
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Asynchronous Auto-Save Mock Function (Section 3 Submission Security)
  const triggerAutoSave = useCallback((questionId: string, newState: StudentAnswerState) => {
    setIsAutoSaving(true);
    // Simulate instantaneous asynchronous AJAX commit to student_responses table
    setTimeout(() => {
      setIsAutoSaving(false);
      setLastSavedTimestamp(new Date().toLocaleTimeString());
    }, 180);
  }, []);

  // Select option handler
  const handleSelectOption = (optKey: 'A' | 'B' | 'C' | 'D') => {
    const updatedState: StudentAnswerState = {
      ...currentAnswerState,
      selectedOption: optKey,
      savedAt: Date.now()
    };
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: updatedState
    }));
    triggerAutoSave(currentQuestion.id, updatedState);
  };

  // Flag for review toggle
  const handleToggleFlag = () => {
    const updatedState: StudentAnswerState = {
      ...currentAnswerState,
      isFlagged: !currentAnswerState.isFlagged,
      savedAt: Date.now()
    };
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: updatedState
    }));
    triggerAutoSave(currentQuestion.id, updatedState);
  };

  // Clear response
  const handleClearResponse = () => {
    const updatedState: StudentAnswerState = {
      ...currentAnswerState,
      selectedOption: null,
      savedAt: Date.now()
    };
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: updatedState
    }));
    triggerAutoSave(currentQuestion.id, updatedState);
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  // Calculate palette status for each question
  const getQuestionStatus = (qId: string) => {
    const ans = answers[qId];
    if (ans?.isFlagged) return 'flagged';
    if (ans?.selectedOption) return 'answered';
    return 'unanswered';
  };

  const answeredCount = Object.values(answers).filter(a => a.selectedOption !== null && !a.isFlagged).length;
  const flaggedCount = Object.values(answers).filter(a => a.isFlagged).length;
  const unansweredCount = questions.length - Object.values(answers).filter(a => a.selectedOption !== null).length;

  // Final Grade Calculation & Chapter Breakdown (Section 4)
  const handleFinalSubmit = () => {
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansCount = 0;

    const chapterStatsMap: Record<string, { total: number; correct: number; incorrect: number }> = {};
    const questionReviewDetails: ExamQuestionReviewDetail[] = [];

    questions.forEach(q => {
      const studentAns = answers[q.id]?.selectedOption ?? null;
      const ch = examChapters.find(c => c.id === q.chapterId);

      if (!chapterStatsMap[q.chapterId]) {
        chapterStatsMap[q.chapterId] = { total: 0, correct: 0, incorrect: 0 };
      }
      chapterStatsMap[q.chapterId].total += 1;

      if (!studentAns) {
        unansCount += 1;
        questionReviewDetails.push({
          questionId: q.id,
          questionText: q.questionText,
          chapterName: ch?.name || 'General Chapter',
          difficulty: q.difficulty,
          selectedOption: null,
          correctOption: q.correctOption,
          isCorrect: false,
          marksAwarded: 0,
          explanation: q.explanation
        });
      } else if (studentAns === q.correctOption) {
        correctCount += 1;
        totalScore += q.marks;
        chapterStatsMap[q.chapterId].correct += 1;
        questionReviewDetails.push({
          questionId: q.id,
          questionText: q.questionText,
          chapterName: ch?.name || 'General Chapter',
          difficulty: q.difficulty,
          selectedOption: studentAns,
          correctOption: q.correctOption,
          isCorrect: true,
          marksAwarded: q.marks,
          explanation: q.explanation
        });
      } else {
        incorrectCount += 1;
        totalScore = Math.max(0, totalScore - q.negativeMarks);
        chapterStatsMap[q.chapterId].incorrect += 1;
        questionReviewDetails.push({
          questionId: q.id,
          questionText: q.questionText,
          chapterName: ch?.name || 'General Chapter',
          difficulty: q.difficulty,
          selectedOption: studentAns,
          correctOption: q.correctOption,
          isCorrect: false,
          marksAwarded: -q.negativeMarks,
          explanation: q.explanation
        });
      }
    });

    const percentage = Math.round((totalScore / (exam.totalMarks || 1)) * 100);
    const passed = percentage >= exam.passingPercentage;

    // Segmented Chapter Breakdown Report (Section 4)
    const chapterBreakdown: ChapterPerformanceMetric[] = Object.entries(chapterStatsMap).map(([chId, stats]) => {
      const chapter = examChapters.find(c => c.id === chId);
      const module = examModules.find(m => m.id === chapter?.moduleId);
      const acc = Math.round((stats.correct / (stats.total || 1)) * 100);
      let masteryLevel: 'High' | 'Needs Review' | 'Weak' = 'High';
      if (acc < 50) masteryLevel = 'Weak';
      else if (acc < 80) masteryLevel = 'Needs Review';

      return {
        chapterId: chId,
        chapterName: chapter?.name || 'Chapter',
        moduleName: module?.name || 'Module',
        totalQuestions: stats.total,
        correctCount: stats.correct,
        incorrectCount: stats.incorrect,
        accuracyPercentage: acc,
        masteryLevel
      };
    });

    const result: ExamResult = {
      id: `res-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: currentUser.id,
      studentName: currentUser.name,
      score: totalScore,
      totalMarks: exam.totalMarks,
      percentage,
      passed,
      correctCount,
      incorrectCount,
      unansweredCount: unansCount,
      totalQuestions: questions.length,
      timeTakenSeconds: (exam.durationMinutes * 60) - remainingSeconds,
      submittedAt: new Date().toLocaleString(),
      chapterBreakdown,
      questionDetails: questionReviewDetails
    };

    submitExamResult(result);
    if (passed) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }
    onFinishExam(result);
  };

  const isLowTime = remainingSeconds < 180; // under 3 mins

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-100 overflow-hidden">
      {/* Top Examination Status Bar (Section 3) */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs z-10">
        <div>
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
            Interactive MCQ Testing Engine
          </span>
          <h2 className="text-sm font-bold text-slate-900 truncate max-w-md">
            {exam.title}
          </h2>
        </div>

        {/* Persistent Countdown Timer (Section 3) */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors ${
            isLowTime 
              ? 'bg-red-50 text-red-700 border-red-300 animate-pulse' 
              : 'bg-slate-50 text-slate-900 border-slate-200'
          }`}>
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-600' : 'text-slate-600'}`} />
            <span className="tabular-nums">{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setIsConfirmSubmitOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit Exam</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Question Canvas vs Right Index Blocks Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Active Question Delivery Card */}
        <div className="flex-1 flex flex-col justify-between p-8 overflow-y-auto">
          <div className="max-w-3xl w-full mx-auto space-y-6">
            {/* Question Progress & Meta */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-900 font-mono">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span>·</span>
                <span className={`font-mono text-[11px] font-bold ${
                  currentQuestion.difficulty === 'EASY'
                    ? 'text-emerald-700'
                    : currentQuestion.difficulty === 'MEDIUM'
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span>·</span>
                <span className="font-mono tabular-nums text-slate-700">
                  +{currentQuestion.marks} / -{currentQuestion.negativeMarks} pts
                </span>
              </div>

              {/* Asynchronous Auto-Save State Indicator (Section 3 Submission Security) */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isAutoSaving ? 'Auto-saving...' : `Auto-saved at ${lastSavedTimestamp}`}
                </span>
              </div>
            </div>

            {/* Question Prompt */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-semibold text-slate-900 leading-relaxed">
                {currentQuestion.questionText}
              </h3>

              {/* Options Cards A, B, C, D (Section 3 Interactive Selection) */}
              <div className="space-y-2.5 pt-2">
                {currentQuestion.options.map(opt => {
                  const isSelected = currentAnswerState.selectedOption === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isSelected ? 'bg-white text-slate-900' : 'bg-white border border-slate-300 text-slate-700'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="text-xs leading-relaxed flex-1 mt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Action Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {/* Flag for Review Toggle (Section 3) */}
                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    currentAnswerState.isFlagged
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${currentAnswerState.isFlagged ? 'fill-amber-600 text-amber-600' : ''}`} />
                  <span>{currentAnswerState.isFlagged ? 'Flagged for Review' : 'Flag for Review'}</span>
                </button>

                {/* Clear Response */}
                {currentAnswerState.selectedOption && (
                  <button
                    onClick={handleClearResponse}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Option</span>
                  </button>
                )}
              </div>

              {/* Prev / Next Pagination */}
              <div className="flex items-center gap-2">
                <button
                  disabled={currentIdx === 0}
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  disabled={currentIdx >= questions.length - 1}
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Layout Showing Color-Coded Index Blocks (Section 3) */}
        <aside className="w-80 shrink-0 bg-white border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Question Index Palette
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click any block to jump directly to that question.
              </p>
            </div>

            {/* Legend Blocks (Section 3) */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-medium border-y border-slate-100 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
                <span className="text-slate-700">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 shrink-0" />
                <span className="text-slate-700">Flagged ({flaggedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                <span className="text-slate-700">Skipped ({unansweredCount})</span>
              </div>
            </div>

            {/* Color-Coded Index Blocks Grid (Section 3) */}
            <div className="grid grid-cols-4 gap-2.5 pt-1">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q.id);
                const isActive = idx === currentIdx;

                let bgClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                if (status === 'answered') {
                  bgClass = 'bg-emerald-600 text-white font-bold hover:bg-emerald-700';
                } else if (status === 'flagged') {
                  bgClass = 'bg-amber-400 text-slate-950 font-bold hover:bg-amber-500';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-lg text-xs font-mono transition-all flex items-center justify-center relative ${bgClass} ${
                      isActive ? 'ring-2 ring-slate-950 ring-offset-2 scale-105 shadow-xs' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {status === 'flagged' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Submit Footer */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setIsConfirmSubmitOpen(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs text-center"
            >
              Submit Entire Paper
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Responses are securely preserved in session cache.
            </p>
          </div>
        </aside>
      </div>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Exam Submission</h3>
                <p className="text-xs text-slate-500">Review your answered status before final grading</p>
              </div>
              <button onClick={() => setIsConfirmSubmitOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                <p className="text-lg font-bold font-mono tabular-nums">{answeredCount}</p>
                <p className="text-[11px] font-medium mt-0.5">Answered</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200">
                <p className="text-lg font-bold font-mono tabular-nums">{flaggedCount}</p>
                <p className="text-[11px] font-medium mt-0.5">Flagged</p>
              </div>
              <div className="p-3 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
                <p className="text-lg font-bold font-mono tabular-nums">{unansweredCount}</p>
                <p className="text-[11px] font-medium mt-0.5">Unanswered</p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>You still have {unansweredCount} unanswered questions. Unanswered questions award 0 points.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
              >
                Return to Exam
              </button>
              <button
                onClick={() => {
                  setIsConfirmSubmitOpen(false);
                  handleFinalSubmit();
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Yes, Finalize & Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
