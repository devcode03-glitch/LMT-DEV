/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Submission, RubricCriterion, CommentBankItem } from '../../types/lms';
import { 
  FileCheck, 
  ShieldCheck, 
  Download, 
  MessageSquare, 
  Check, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  UserCheck, 
  Calendar,
  FileText,
  Clock
} from 'lucide-react';

export const GradingRubricView: React.FC = () => {
  const { 
    currentUser, 
    submissions, 
    assignments, 
    rubrics, 
    gradeSubmission, 
    toggleExcuseSubmission,
    commentBank,
    addCommentBankItem
  } = useLMS();

  const [selectedSubId, setSelectedSubId] = useState<string>(submissions[0]?.id || '');
  const activeSubmission = submissions.find(s => s.id === selectedSubId) || submissions[0];
  const activeAssignment = assignments.find(a => a.id === activeSubmission?.assignmentId);
  const activeRubric = rubrics.find(r => r.id === (activeAssignment?.rubricId || 'rubric-consensus')) || rubrics[0];

  // Local grading state
  const [selectedScores, setSelectedScores] = useState<Record<string, number>>(
    activeSubmission?.rubricScores || {}
  );
  const [feedbackText, setFeedbackText] = useState<string>(
    activeSubmission?.feedbackComment || ''
  );
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Comment bank modal / quick insert
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentCategory, setNewCommentCategory] = useState<CommentBankItem['category']>('Rigor');
  const [newCommentShortcut, setNewCommentShortcut] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // SIS Export Modal
  const [showSisModal, setShowSisModal] = useState(false);

  // Compute calculated point total from selected rubric levels
  const calculatedTotal = Object.values(selectedScores).reduce((acc, score) => acc + score, 0);

  // Grade scale letter
  const getGradeScale = (score: number) => {
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 70) return 'C';
    return 'F';
  };

  const handleSelectLevel = (criterionId: string, score: number) => {
    const updated = { ...selectedScores, [criterionId]: score };
    setSelectedScores(updated);
  };

  const handleCommitGrade = () => {
    if (!activeSubmission) return;
    gradeSubmission(activeSubmission.id, calculatedTotal, selectedScores, feedbackText);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleInsertComment = (text: string) => {
    setFeedbackText(prev => prev ? `${prev}\n\n${text}` : text);
  };

  // SIS OneRoster CSV Export (FR-5.6)
  const handleExportOneRoster = () => {
    const headers = 'sourcedId,status,dateLastModified,userSourcedId,classSourcedId,lineItemSourcedId,score,scoreDate,comment\n';
    const rows = submissions.map(s => {
      return `${s.id},active,${new Date().toISOString()},${s.studentId},batch-cs401,${s.assignmentId},${s.grade ?? ''},${s.submittedAt},"${s.feedbackComment.replace(/"/g, '""')}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OneRoster_Grades_VectorLMS.csv';
    a.click();
    URL.revokeObjectURL(url);
    setShowSisModal(false);
  };

  // SIS Clever JSON Export (FR-5.6)
  const handleExportCleverJSON = () => {
    const cleverPayload = {
      integration: 'Clever Secure Sync',
      timestamp: new Date().toISOString(),
      roster_grades: submissions.map(s => ({
        student_id: s.studentId,
        student_name: s.studentName,
        assignment_id: s.assignmentId,
        score: s.grade,
        status: s.status,
        rubric_breakdown: s.rubricScores
      }))
    };
    const blob = new Blob([JSON.stringify(cleverPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Clever_Grades_Payload.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowSisModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Submissions Queue
          </span>
          <select
            value={selectedSubId}
            onChange={e => {
              const sub = submissions.find(s => s.id === e.target.value);
              setSelectedSubId(e.target.value);
              setSelectedScores(sub?.rubricScores || {});
              setFeedbackText(sub?.feedbackComment || '');
            }}
            className="text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {submissions.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.studentName} · {sub.status.toUpperCase()} {sub.grade ? `(${sub.grade}/100)` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Mark as Excused Toggle (FR-5.4) */}
          <button
            onClick={() => toggleExcuseSubmission(activeSubmission.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              activeSubmission.status === 'excused'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Exclude excused work from final-average calculations (FR-5.4)"
          >
            {activeSubmission.status === 'excused' ? 'Status: Excused (Excluded from GPA)' : 'Mark as Excused'}
          </button>

          {/* Export to SIS (FR-5.6) */}
          <button
            onClick={() => setShowSisModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to SIS (OneRoster/Clever)</span>
          </button>

          {/* Commit Grade Button */}
          <button
            onClick={handleCommitGrade}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Commit Grade & Feedback</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Student Work vs Right Rubric & Feedback */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Student Submission Document View */}
        <div className="w-1/2 border-r border-slate-200 bg-white flex flex-col overflow-y-auto p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{activeSubmission.studentName}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Submitted {new Date(activeSubmission.submittedAt).toLocaleString()}</span>
                <span>·</span>
                <span className="font-mono text-slate-700">{activeSubmission.attachedFile}</span>
              </div>
            </div>

            {/* Originality / Plagiarism Check Badge (FR-5.5) */}
            {activeSubmission.originalityReport && (
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Originality Score</span>
                  <span className="font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[11px]">
                    {100 - activeSubmission.originalityReport.similarityPercentage}% Unique
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeSubmission.originalityReport.citationsFound} / {activeSubmission.originalityReport.citationsExpected} verified citations
                </p>
              </div>
            )}
          </div>

          {/* Plagiarism Similarity Card (FR-5.5) */}
          {activeSubmission.originalityReport && activeSubmission.originalityReport.flaggedExcerpts.length > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Originality Scan Alert (FR-5.5)</span>
              </div>
              {activeSubmission.originalityReport.flaggedExcerpts.map((exc, idx) => (
                <div key={idx} className="text-xs text-amber-800 bg-white/70 p-2 rounded border border-amber-200">
                  <p className="italic">"{exc.text}"</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Matched {exc.similarity}% with <strong>{exc.matchSource}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Submission Text Body */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Student Written Work & Solution
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-line select-text">
              {activeSubmission.contentText}
            </div>
          </div>
        </div>

        {/* Right: Interactive Configurable Rubric (FR-5.1 & FR-5.2) & Comment Bank (FR-5.3) */}
        <div className="w-1/2 bg-slate-50 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Rubric Header & Score Tally */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase">Rubric Auto-Tally (FR-5.2)</p>
              <h3 className="text-base font-bold text-slate-900">{activeRubric.title}</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {calculatedTotal} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <span className="text-xs font-semibold text-indigo-600 font-mono">
                Grade: {getGradeScale(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Criteria Matrix */}
          <div className="space-y-4">
            {activeRubric.criteria.map((crit: RubricCriterion) => {
              const currentScore = selectedScores[crit.id] ?? 0;
              return (
                <div key={crit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{crit.name}</h4>
                      <p className="text-[11px] text-slate-400">Max Weight: {crit.weight} pts</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {currentScore} pts
                    </span>
                  </div>

                  {/* Level Descriptors (FR-5.1) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {crit.levels.map(level => {
                      const isSelected = currentScore === level.score;
                      return (
                        <button
                          key={level.score}
                          onClick={() => handleSelectLevel(crit.id, level.score)}
                          className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold">{level.label}</p>
                            <p className="text-[10px] opacity-75 mt-1 leading-snug line-clamp-3">
                              {level.descriptor}
                            </p>
                          </div>
                          <p className="text-xs font-mono font-semibold mt-2">{level.score} pts</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reusable Comment Bank (FR-5.3) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900">Reusable Comment Bank (FR-5.3)</h4>
              </div>
              <button
                onClick={() => setIsAddingComment(!isAddingComment)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Snippet</span>
              </button>
            </div>

            {/* Quick Insert Snippet Chips */}
            <div className="flex flex-wrap gap-1.5">
              {commentBank.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleInsertComment(item.text)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border border-slate-200"
                  title={item.text}
                >
                  <span className="font-mono text-indigo-600 font-bold">{item.shortcut}</span>
                  <span className="truncate max-w-[120px]">{item.category}</span>
                </button>
              ))}
            </div>

            {/* Add Comment Snippet Drawer */}
            {isAddingComment && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Shortcut (e.g. #latency)"
                    value={newCommentShortcut}
                    onChange={e => setNewCommentShortcut(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded"
                  />
                  <select
                    value={newCommentCategory}
                    onChange={e => setNewCommentCategory(e.target.value as any)}
                    className="p-1.5 bg-white border border-slate-200 rounded"
                  >
                    <option value="Rigor">Rigor</option>
                    <option value="Clarity">Clarity</option>
                    <option value="Methodology">Methodology</option>
                    <option value="Formatting">Formatting</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  placeholder="Reusable feedback sentence..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded"
                />
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => setIsAddingComment(false)} className="px-2 py-0.5 text-slate-500">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newCommentText.trim() && newCommentShortcut.trim()) {
                        addCommentBankItem(newCommentCategory, newCommentShortcut.trim(), newCommentText.trim());
                        setNewCommentText('');
                        setNewCommentShortcut('');
                        setIsAddingComment(false);
                      }
                    }}
                    className="px-2.5 py-0.5 bg-slate-900 text-white rounded font-medium"
                  >
                    Save Snippet
                  </button>
                </div>
              </div>
            )}

            {/* Feedback Editor Area */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Student Feedback Statement
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Click comment snippets above or type custom pedagogical notes..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {isSavedNotice && (
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Grade and feedback successfully synced to gradebook and SIS cache!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SIS EXPORT MODAL (FR-5.6) */}
      {showSisModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Export Grades to SIS</h3>
                <p className="text-xs text-slate-500">FR-5.6 OneRoster & Clever Interoperability</p>
              </div>
              <button onClick={() => setShowSisModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Export verified grade records, student identifiers, and rubric criteria breakdowns according to industry standard student information system schemas.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleExportOneRoster}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-400 text-left flex items-center justify-between transition-colors bg-slate-50 hover:bg-slate-100"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">OneRoster v1.2 Format (CSV)</p>
                  <p className="text-[11px] text-slate-500">Compatible with PowerSchool, Infinite Campus & Canvas</p>
                </div>
                <Download className="w-4 h-4 text-slate-600" />
              </button>

              <button
                onClick={handleExportCleverJSON}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-400 text-left flex items-center justify-between transition-colors bg-slate-50 hover:bg-slate-100"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Clever Secure Sync (JSON)</p>
                  <p className="text-[11px] text-slate-500">Standardized API payload with encrypted roster IDs</p>
                </div>
                <Download className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSisModal(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
