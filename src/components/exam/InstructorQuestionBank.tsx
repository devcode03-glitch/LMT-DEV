/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLMS } from '../../context/LMSContext';
import { DifficultyLevel, MCQQuestion } from '../../types/lms';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  HelpCircle, 
  Filter,
  Check,
  Layers,
  BookOpen
} from 'lucide-react';

export const InstructorQuestionBank: React.FC = () => {
  const { 
    examSubjects, 
    examModules, 
    examChapters, 
    mcqQuestions, 
    addMCQQuestion, 
    deleteMCQQuestion 
  } = useLMS();

  // Dynamic Chained Dropdown Filter State (Section 2)
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterModuleId, setFilterModuleId] = useState<string>('all');
  const [filterChapterId, setFilterChapterId] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Question Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubjectId, setModalSubjectId] = useState<string>(examSubjects[0]?.id || '');
  const [modalModuleId, setModalModuleId] = useState<string>('');
  const [modalChapterId, setModalChapterId] = useState<string>('');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [marks, setMarks] = useState<number>(3);
  const [negativeMarks, setNegativeMarks] = useState<number>(0.75);
  const [explanation, setExplanation] = useState('');

  // Dynamic Chained Filter: Available modules for selected filter subject
  const availableFilterModules = useMemo(() => {
    if (filterSubjectId === 'all') return examModules;
    return examModules.filter(m => m.subjectId === filterSubjectId);
  }, [filterSubjectId, examModules]);

  // Dynamic Chained Filter: Available chapters for selected filter module
  const availableFilterChapters = useMemo(() => {
    if (filterModuleId === 'all') {
      if (filterSubjectId === 'all') return examChapters;
      return examChapters.filter(c => c.subjectId === filterSubjectId);
    }
    return examChapters.filter(c => c.moduleId === filterModuleId);
  }, [filterModuleId, filterSubjectId, examChapters]);

  // Dynamic Chained Modal: Available modules for modal subject
  const availableModalModules = useMemo(() => {
    return examModules.filter(m => m.subjectId === modalSubjectId);
  }, [modalSubjectId, examModules]);

  // Dynamic Chained Modal: Available chapters for modal module
  const availableModalChapters = useMemo(() => {
    return examChapters.filter(c => c.moduleId === modalModuleId);
  }, [modalModuleId, examChapters]);

  // Keep modal module & chapter in sync when subject changes
  const handleModalSubjectChange = (newSubId: string) => {
    setModalSubjectId(newSubId);
    const mods = examModules.filter(m => m.subjectId === newSubId);
    const firstModId = mods[0]?.id || '';
    setModalModuleId(firstModId);
    const chaps = examChapters.filter(c => c.moduleId === firstModId);
    setModalChapterId(chaps[0]?.id || '');
  };

  const handleModalModuleChange = (newModId: string) => {
    setModalModuleId(newModId);
    const chaps = examChapters.filter(c => c.moduleId === newModId);
    setModalChapterId(chaps[0]?.id || '');
  };

  const openAddModal = () => {
    const initSubId = examSubjects[0]?.id || '';
    setModalSubjectId(initSubId);
    const mods = examModules.filter(m => m.subjectId === initSubId);
    const firstModId = mods[0]?.id || '';
    setModalModuleId(firstModId);
    const chaps = examChapters.filter(c => c.moduleId === firstModId);
    setModalChapterId(chaps[0]?.id || '');

    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOpt('A');
    setDifficulty('MEDIUM');
    setMarks(3);
    setNegativeMarks(0.75);
    setExplanation('');
    setIsModalOpen(true);
  };

  // Filtered Questions List
  const filteredQuestions = useMemo(() => {
    return mcqQuestions.filter(q => {
      const matchSubject = filterSubjectId === 'all' || q.subjectId === filterSubjectId;
      const matchModule = filterModuleId === 'all' || q.moduleId === filterModuleId;
      const matchChapter = filterChapterId === 'all' || q.chapterId === filterChapterId;
      const matchDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
      const matchSearch = !searchQuery || 
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.explanation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchModule && matchChapter && matchDifficulty && matchSearch;
    });
  }, [mcqQuestions, filterSubjectId, filterModuleId, filterChapterId, filterDifficulty, searchQuery]);

  // Handle Create Question Submission
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) return;

    addMCQQuestion({
      subjectId: modalSubjectId,
      moduleId: modalModuleId,
      chapterId: modalChapterId,
      questionText: questionText.trim(),
      options: [
        { key: 'A', text: optA.trim() },
        { key: 'B', text: optB.trim() },
        { key: 'C', text: optC.trim() },
        { key: 'D', text: optD.trim() }
      ],
      correctOption: correctOpt,
      difficulty,
      marks,
      negativeMarks,
      explanation: explanation.trim()
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>MCQ Question Bank Management</span>
            <span>·</span>
            <span>Section 2 Instructor Data Input</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Hierarchical Question Repository & Taxonomy
          </h2>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New MCQ Question</span>
        </button>
      </div>

      {/* Dynamic Chained Dropdown Filter Bar (Section 2) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Dynamic Chained Taxonomy Filter (Subject → Module → Chapter)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Chained 1: Subject */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Subject</label>
            <select
              value={filterSubjectId}
              onChange={e => {
                setFilterSubjectId(e.target.value);
                setFilterModuleId('all');
                setFilterChapterId('all');
              }}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Subjects</option>
              {examSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} · {s.name}</option>
              ))}
            </select>
          </div>

          {/* Chained 2: Module (Updates dynamically based on selected Subject) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Module</label>
            <select
              value={filterModuleId}
              onChange={e => {
                setFilterModuleId(e.target.value);
                setFilterChapterId('all');
              }}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Modules</option>
              {availableFilterModules.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Chained 3: Chapter (Updates dynamically based on selected Module) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Chapter</label>
            <select
              value={filterChapterId}
              onChange={e => setFilterChapterId(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Chapters</option>
              {availableFilterChapters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Badge Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Difficulties</option>
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
          </div>
        </div>

        {/* Text Search */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 mt-0.5" />
          <input
            type="text"
            placeholder="Search by question keywords, formula, or explanation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Questions Count & Density Meta */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <strong>{filteredQuestions.length}</strong> questions in active filter</span>
        <span className="font-mono">Total Repository: {mcqQuestions.length} items</span>
      </div>

      {/* Questions Card List */}
      <div className="space-y-3.5">
        {filteredQuestions.map((q, idx) => {
          const subject = examSubjects.find(s => s.id === q.subjectId);
          const chapter = examChapters.find(c => c.id === q.chapterId);
          return (
            <div 
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              {/* Question Header & Meta */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800">{subject?.code}</span>
                    <span>·</span>
                    <span className="text-slate-700">{chapter?.name}</span>
                    <span>·</span>
                    <span className={`font-mono text-[11px] font-bold ${
                      q.difficulty === 'EASY' 
                        ? 'text-emerald-700' 
                        : q.difficulty === 'MEDIUM' 
                        ? 'text-amber-700' 
                        : 'text-red-700'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums text-slate-700">+{q.marks} / -{q.negativeMarks} pts</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    <span className="font-mono text-slate-400 mr-2">Q{idx + 1}.</span>
                    {q.questionText}
                  </h3>
                </div>

                <button
                  onClick={() => deleteMCQQuestion(q.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Options Grid (A, B, C, D) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {q.options.map(opt => {
                  const isCorrect = opt.key === q.correctOption;
                  return (
                    <div 
                      key={opt.key}
                      className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                        isCorrect
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 ${
                        isCorrect ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="flex-1 leading-tight">{opt.text}</span>
                      {isCorrect && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rationale / Explanation */}
              {q.explanation && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <span className="font-bold text-slate-700">Pedagogical Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-sm font-semibold text-slate-700">No questions match the selected taxonomy criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Adjust your Subject, Module, or Chapter filter or click "Add New MCQ Question".</p>
          </div>
        )}
      </div>

      {/* ADD QUESTION MODAL (Section 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add MCQ Question to Bank</h3>
                <p className="text-xs text-slate-500">Section 2: Chained Subject → Module → Chapter Input</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              {/* Chained Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={modalSubjectId}
                    onChange={e => handleModalSubjectChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  >
                    {examSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Module</label>
                  <select
                    value={modalModuleId}
                    onChange={e => handleModalModuleChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  >
                    {availableModalModules.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chapter</label>
                  <select
                    value={modalChapterId}
                    onChange={e => setModalChapterId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  >
                    {availableModalChapters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Question Text</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Enter the conceptual question or scenario..."
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Options & Correct Answer Selection</label>
                
                {[
                  { key: 'A', val: optA, setVal: setOptA },
                  { key: 'B', val: optB, setVal: setOptB },
                  { key: 'C', val: optC, setVal: setOptC },
                  { key: 'D', val: optD, setVal: setOptD }
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="correctOptGroup"
                        checked={correctOpt === item.key}
                        onChange={() => setCorrectOpt(item.key as any)}
                        className="accent-slate-900"
                      />
                      <span className="font-mono font-bold text-slate-700 w-5">
                        {item.key}.
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${item.key} text`}
                      value={item.val}
                      onChange={e => item.setVal(e.target.value)}
                      className={`w-full p-2 rounded-lg border text-xs focus:outline-none ${
                        correctOpt === item.key
                          ? 'bg-emerald-50/50 border-emerald-400 text-slate-900 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Difficulty & Marks Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Marks Awarded (+)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={marks}
                    onChange={e => setMarks(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Negative Marks (-)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.25"
                    value={negativeMarks}
                    onChange={e => setNegativeMarks(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Solution Rationale / Explanation (Shown upon submission)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why the selected option is correct and cite relevant theorems..."
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Commit Question to Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
