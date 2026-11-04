/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { 
  ExamBlueprint, 
  BlueprintRule, 
  DifficultyLevel, 
  GeneratedExam, 
  MCQQuestion 
} from '../../types/lms';
import { 
  FileSpreadsheet, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Percent, 
  Layers, 
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PaperBlueprintManagerProps {
  onLaunchExamPreview?: (exam: GeneratedExam) => void;
}

export const PaperBlueprintManager: React.FC<PaperBlueprintManagerProps> = ({ onLaunchExamPreview }) => {
  const { 
    examSubjects, 
    examModules, 
    examChapters, 
    mcqQuestions, 
    examBlueprints, 
    createExamBlueprint,
    createGeneratedExam
  } = useLMS();

  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>(
    examBlueprints[0]?.id || ''
  );

  const activeBlueprint = examBlueprints.find(b => b.id === selectedBlueprintId) || examBlueprints[0];

  // Create Blueprint Modal State
  const [isCreatingBp, setIsCreatingBp] = useState(false);
  const [bpTitle, setBpTitle] = useState('');
  const [bpCode, setBpCode] = useState('');
  const [bpSubjectId, setBpSubjectId] = useState(examSubjects[0]?.id || '');
  const [bpDuration, setBpDuration] = useState(15);
  const [bpPassing, setBpPassing] = useState(70);
  const [bpNegMarking, setBpNegMarking] = useState(true);

  // New Blueprint Rules builder
  const [rules, setRules] = useState<Omit<BlueprintRule, 'id'>[]>([
    {
      subjectId: examSubjects[0]?.id || '',
      moduleId: examModules[0]?.id || '',
      chapterId: examChapters[0]?.id || '',
      difficulty: 'EASY',
      questionCount: 2,
      marksPerQuestion: 2
    },
    {
      subjectId: examSubjects[0]?.id || '',
      moduleId: examModules[0]?.id || '',
      chapterId: examChapters[1]?.id || '',
      difficulty: 'MEDIUM',
      questionCount: 2,
      marksPerQuestion: 3
    }
  ]);

  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null);

  // Add rule in builder
  const handleAddRule = () => {
    const defaultModule = examModules.find(m => m.subjectId === bpSubjectId) || examModules[0];
    const defaultChapter = examChapters.find(c => c.moduleId === defaultModule?.id) || examChapters[0];

    setRules(prev => [
      ...prev,
      {
        subjectId: bpSubjectId,
        moduleId: defaultModule?.id || '',
        chapterId: defaultChapter?.id || '',
        difficulty: 'MEDIUM',
        questionCount: 1,
        marksPerQuestion: 3
      }
    ]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Blueprint Creation
  const handleSaveBlueprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpTitle.trim() || rules.length === 0) return;

    const totalQuestions = rules.reduce((acc, r) => acc + r.questionCount, 0);
    const totalMarks = rules.reduce((acc, r) => acc + (r.questionCount * r.marksPerQuestion), 0);

    createExamBlueprint({
      title: bpTitle.trim(),
      code: bpCode.trim() || `BP-${Date.now()}`,
      subjectId: bpSubjectId,
      durationMinutes: bpDuration,
      passingPercentage: bpPassing,
      totalQuestions,
      totalMarks,
      negativeMarkingEnabled: bpNegMarking,
      rules: rules.map((r, i) => ({ ...r, id: `rule-${Date.now()}-${i}` }))
    });

    setIsCreatingBp(false);
  };

  // Generate Paper from Active Blueprint (Section 2 Workflow)
  const handleGenerateExamPaper = () => {
    if (!activeBlueprint) return;

    const selectedQuestions: MCQQuestion[] = [];
    const usedIds = new Set<string>();
    let hasShortage = false;

    for (const rule of activeBlueprint.rules) {
      // Find candidate questions matching chapter, subject, and difficulty
      const candidates = mcqQuestions.filter(q => 
        q.chapterId === rule.chapterId &&
        q.difficulty === rule.difficulty &&
        !usedIds.has(q.id)
      );

      // If exact matching questions are available, pull up to rule.questionCount
      const pulled = candidates.slice(0, rule.questionCount);
      pulled.forEach(q => {
        selectedQuestions.push(q);
        usedIds.add(q.id);
      });

      if (pulled.length < rule.questionCount) {
        // Fallback: pull from same chapter with any difficulty to ensure complete test
        const fallback = mcqQuestions.filter(q => 
          q.chapterId === rule.chapterId && !usedIds.has(q.id)
        );
        const needed = rule.questionCount - pulled.length;
        const fallbackPulled = fallback.slice(0, needed);
        fallbackPulled.forEach(q => {
          selectedQuestions.push(q);
          usedIds.add(q.id);
        });
        if (pulled.length + fallbackPulled.length < rule.questionCount) {
          hasShortage = true;
        }
      }
    }

    // If still missing, fill with other subject questions
    if (selectedQuestions.length < activeBlueprint.totalQuestions) {
      const remaining = mcqQuestions.filter(q => !usedIds.has(q.id));
      const fillCount = activeBlueprint.totalQuestions - selectedQuestions.length;
      remaining.slice(0, fillCount).forEach(q => selectedQuestions.push(q));
    }

    const generated: GeneratedExam = {
      id: `exam-${Date.now()}`,
      blueprintId: activeBlueprint.id,
      title: activeBlueprint.title,
      subjectId: activeBlueprint.subjectId,
      durationMinutes: activeBlueprint.durationMinutes,
      passingPercentage: activeBlueprint.passingPercentage,
      totalMarks: activeBlueprint.totalMarks,
      questions: selectedQuestions,
      createdAt: new Date().toISOString()
    };

    createGeneratedExam(generated);
    setGenerationFeedback(`Successfully compiled "${activeBlueprint.title}" with ${selectedQuestions.length} questions across ${activeBlueprint.rules.length} taxonomy specification rules.`);

    if (onLaunchExamPreview) {
      onLaunchExamPreview(generated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Automated Paper Blueprint Engine</span>
            <span>·</span>
            <span>Section 2 Blueprint Specification</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Paper Blueprints & Question Allocation Rules
          </h2>
        </div>

        <button
          onClick={() => setIsCreatingBp(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Paper Blueprint</span>
        </button>
      </div>

      {/* Blueprint Selector & Summary Card */}
      {activeBlueprint && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-indigo-600 uppercase">
                {activeBlueprint.code}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{activeBlueprint.title}</h3>
              <p className="text-xs text-slate-500">
                Specification model allocating questions by Subject, Module, Chapter & Difficulty.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedBlueprintId}
                onChange={e => setSelectedBlueprintId(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
              >
                {examBlueprints.map(bp => (
                  <option key={bp.id} value={bp.id}>{bp.title}</option>
                ))}
              </select>

              <button
                onClick={handleGenerateExamPaper}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compile Test Paper</span>
              </button>
            </div>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
              </span>
              <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {activeBlueprint.durationMinutes} mins
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" /> Passing Score
              </span>
              <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {activeBlueprint.passingPercentage}%
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Target Questions
              </span>
              <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {activeBlueprint.totalQuestions} questions
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="text-slate-500">Total Marks</span>
              <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {activeBlueprint.totalMarks} pts
              </p>
            </div>
          </div>

          {generationFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-medium border border-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{generationFeedback}</span>
            </div>
          )}

          {/* Specification Rules Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Blueprint Allocation Rules Matrix
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Rule #</th>
                    <th className="px-4 py-2.5">Target Chapter</th>
                    <th className="px-4 py-2.5">Target Module</th>
                    <th className="px-4 py-2.5">Difficulty</th>
                    <th className="px-4 py-2.5">Count</th>
                    <th className="px-4 py-2.5">Marks / Q</th>
                    <th className="px-4 py-2.5 text-right">Available in Bank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeBlueprint.rules.map((rule, idx) => {
                    const chapter = examChapters.find(c => c.id === rule.chapterId);
                    const module = examModules.find(m => m.id === rule.moduleId);
                    const bankAvailable = mcqQuestions.filter(q => 
                      q.chapterId === rule.chapterId && q.difficulty === rule.difficulty
                    ).length;

                    return (
                      <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">
                          0{idx + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {chapter?.name || 'General Chapter'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {module?.name || 'Core Module'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[11px] font-bold ${
                            rule.difficulty === 'EASY'
                              ? 'text-emerald-700'
                              : rule.difficulty === 'MEDIUM'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}>
                            {rule.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums font-bold text-slate-900">
                          {rule.questionCount}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums text-slate-600">
                          {rule.marksPerQuestion} pts
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                            bankAvailable >= rule.questionCount
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {bankAvailable} ready
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BLUEPRINT MODAL */}
      {isCreatingBp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Paper Blueprint</h3>
                <p className="text-xs text-slate-500">Rule-based question distribution for balanced testing</p>
              </div>
              <button onClick={() => setIsCreatingBp(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBlueprint} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blueprint Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-401 Final Term Examination"
                    value={bpTitle}
                    onChange={e => setBpTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={bpSubjectId}
                    onChange={e => setBpSubjectId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {examSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={bpDuration}
                    onChange={e => setBpDuration(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Passing %</label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={bpPassing}
                    onChange={e => setBpPassing(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Negative Marking</label>
                  <select
                    value={bpNegMarking ? 'yes' : 'no'}
                    onChange={e => setBpNegMarking(e.target.value === 'yes')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="yes">Enabled (Penalty)</option>
                    <option value="no">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Rules Matrix Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Question Allocation Rules ({rules.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Allocation Rule</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {rules.map((rule, idx) => {
                    const availableChapters = examChapters.filter(c => c.subjectId === bpSubjectId);
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <label className="text-[10px] text-slate-500 block">Chapter</label>
                          <select
                            value={rule.chapterId}
                            onChange={e => {
                              const chId = e.target.value;
                              const ch = examChapters.find(c => c.id === chId);
                              setRules(prev => prev.map((r, i) => i === idx ? { ...r, chapterId: chId, moduleId: ch?.moduleId || r.moduleId } : r));
                            }}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px]"
                          >
                            {availableChapters.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-3">
                          <label className="text-[10px] text-slate-500 block">Difficulty</label>
                          <select
                            value={rule.difficulty}
                            onChange={e => {
                              const diff = e.target.value as DifficultyLevel;
                              setRules(prev => prev.map((r, i) => i === idx ? { ...r, difficulty: diff } : r));
                            }}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px]"
                          >
                            <option value="EASY">EASY</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HARD">HARD</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 block">Questions</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={rule.questionCount}
                            onChange={e => {
                              const cnt = Number(e.target.value);
                              setRules(prev => prev.map((r, i) => i === idx ? { ...r, questionCount: cnt } : r));
                            }}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px]"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 block">Marks/Q</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={rule.marksPerQuestion}
                            onChange={e => {
                              const m = Number(e.target.value);
                              setRules(prev => prev.map((r, i) => i === idx ? { ...r, marksPerQuestion: m } : r));
                            }}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px]"
                          />
                        </div>

                        <div className="col-span-1 text-right pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(idx)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingBp(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Save Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
