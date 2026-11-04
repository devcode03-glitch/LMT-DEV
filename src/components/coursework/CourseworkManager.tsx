/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Assignment, VideoCheckpoint, PracticeQuestion } from '../../types/lms';
import { 
  FileText, 
  Video, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Users, 
  User, 
  Calendar, 
  Clock, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CourseworkManager: React.FC = () => {
  const { 
    currentUser, 
    visibleAssignments, 
    createAssignment, 
    deleteAssignment,
    selectedBatchId,
    batches
  } = useLMS();

  // Create Assignment Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-28');
  const [points, setPoints] = useState(100);
  const [targetType, setTargetType] = useState<'all' | 'groups' | 'individuals'>('all');
  const [targetGroup, setTargetGroup] = useState('Honors Track');
  const [type, setType] = useState<'standard' | 'interactive_video' | 'practice_set'>('standard');
  const [isDraft, setIsDraft] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Interactive Video Player Modal State
  const [activeVideoAsg, setActiveVideoAsg] = useState<Assignment | null>(null);
  const [videoPlayTime, setVideoPlayTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<VideoCheckpoint | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checkpointAnswerStatus, setCheckpointAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [answeredCheckpoints, setAnsweredCheckpoints] = useState<string[]>([]);

  // Practice Set Modal State
  const [activePracticeAsg, setActivePracticeAsg] = useState<Assignment | null>(null);
  const [practiceQuestionIndex, setPracticeQuestionIndex] = useState(0);
  const [practiceSelectedOpt, setPracticeSelectedOpt] = useState<number | null>(null);
  const [practiceHintsRevealed, setPracticeHintsRevealed] = useState<number>(0);
  const [practiceStatus, setPracticeStatus] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
  const [practiceScore, setPracticeScore] = useState(0);
  const [isPracticeComplete, setIsPracticeComplete] = useState(false);

  const canCreate = currentUser.role === 'admin' || currentUser.role === 'instructor';
  const currentBatch = batches.find(b => b.id === selectedBatchId);

  // Time-synced video checkpoint checker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoPlaying && activeVideoAsg?.videoConfig) {
      interval = setInterval(() => {
        setVideoPlayTime(prev => {
          const nextTime = prev + 1;
          const checkpoint = activeVideoAsg.videoConfig?.checkpoints.find(
            cp => cp.timestamp === nextTime && !answeredCheckpoints.includes(cp.id)
          );
          if (checkpoint) {
            setIsVideoPlaying(false);
            setActiveCheckpoint(checkpoint);
            setSelectedOption(null);
            setCheckpointAnswerStatus('idle');
            setShowHint(false);
          }
          if (nextTime >= (activeVideoAsg.videoConfig?.duration || 180)) {
            setIsVideoPlaying(false);
            return activeVideoAsg.videoConfig?.duration || 180;
          }
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying, activeVideoAsg, answeredCheckpoints]);

  // Video Checkpoint Answer Submit
  const handleAnswerCheckpoint = () => {
    if (!activeCheckpoint || selectedOption === null) return;
    if (selectedOption === activeCheckpoint.correctIndex) {
      setCheckpointAnswerStatus('correct');
      setAnsweredCheckpoints(prev => [...prev, activeCheckpoint.id]);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      setCheckpointAnswerStatus('wrong');
    }
  };

  const handleResumeVideo = () => {
    setActiveCheckpoint(null);
    setCheckpointAnswerStatus('idle');
    setIsVideoPlaying(true);
  };

  // Practice set answer submit
  const handlePracticeSubmit = () => {
    if (!activePracticeAsg?.practiceConfig || practiceSelectedOpt === null) return;
    const q = activePracticeAsg.practiceConfig.questions[practiceQuestionIndex];
    if (practiceSelectedOpt === q.correctIndex) {
      setPracticeStatus('correct');
      setPracticeScore(prev => prev + 1);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    } else {
      setPracticeStatus('wrong');
    }
  };

  const handleNextPracticeQuestion = () => {
    if (!activePracticeAsg?.practiceConfig) return;
    if (practiceQuestionIndex < activePracticeAsg.practiceConfig.questions.length - 1) {
      setPracticeQuestionIndex(prev => prev + 1);
      setPracticeSelectedOpt(null);
      setPracticeHintsRevealed(0);
      setPracticeStatus('unanswered');
    } else {
      setIsPracticeComplete(true);
    }
  };

  // Create Assignment Form Submission
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createAssignment({
      batchId: selectedBatchId,
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date(dueDate).toISOString(),
      points,
      targetType,
      targetGroups: targetType === 'groups' ? [targetGroup] : undefined,
      type,
      isDraft,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      videoConfig: type === 'interactive_video' ? {
        videoUrl: 'https://www.youtube.com/watch?v=vYp4LYbnnW8',
        duration: 120,
        checkpoints: [
          {
            id: `cp-${Date.now()}`,
            timestamp: 20,
            question: 'Verify the quorum requirement for safety invariants:',
            options: ['Simple majority (N/2 + 1)', 'Single node authority', 'All nodes unanimously'],
            correctIndex: 0,
            hint: 'Majority quorums guarantee at least 1 overlapping node.'
          }
        ]
      } : undefined,
      practiceConfig: type === 'practice_set' ? {
        questions: [
          {
            id: `pq-${Date.now()}`,
            prompt: 'Identify the invariant satisfied by monotonic vector clocks:',
            options: ['Eventual strong consistency', 'Causal precedence order', 'Strict linearizable wall-clock time'],
            correctIndex: 1,
            hints: ['Think about partial orders vs total order.'],
            explanation: 'Monotonic vector clocks preserve causal precedence (e1 -> e2 => V(e1) < V(e2)).'
          }
        ]
      } : undefined
    });

    setTitle('');
    setDescription('');
    setIsCreating(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-y-auto p-8">
      {/* Top Banner & Header */}
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Coursework & Differentiated Learning</span>
              <span>·</span>
              <span className="font-mono text-slate-700 font-semibold">{currentBatch?.code}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Assignments, Video Checkpoints & Practice Sets
            </h1>
          </div>

          {canCreate && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coursework</span>
            </button>
          )}
        </div>

        {/* Differentiated Targeting Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Whole Class Assignments</p>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {visibleAssignments.filter(a => a.targetType === 'all').length}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Differentiated Groups</p>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {visibleAssignments.filter(a => a.targetType === 'groups').length}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Individual Track Work</p>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {visibleAssignments.filter(a => a.targetType === 'individuals').length}
              </p>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {visibleAssignments.map(asg => {
            const isVideo = asg.type === 'interactive_video';
            const isPractice = asg.type === 'practice_set';

            return (
              <div 
                key={asg.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  {/* Meta badges: unboxed clean text with separators */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {isVideo ? 'Interactive Video' : isPractice ? 'Adaptive Practice Set' : 'Standard Coursework'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      Due {new Date(asg.dueDate).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">{asg.points} pts</span>
                    <span>·</span>
                    <span className="text-indigo-600 font-medium">
                      {asg.targetType === 'all'
                        ? 'All Enrolled'
                        : asg.targetType === 'groups'
                        ? `Group: ${asg.targetGroups?.join(', ')}`
                        : 'Individual Track'}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">
                    {asg.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {asg.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {isVideo && (
                    <button
                      onClick={() => {
                        setActiveVideoAsg(asg);
                        setVideoPlayTime(0);
                        setIsVideoPlaying(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Launch Video Lab</span>
                    </button>
                  )}

                  {isPractice && (
                    <button
                      onClick={() => {
                        setActivePracticeAsg(asg);
                        setPracticeQuestionIndex(0);
                        setPracticeSelectedOpt(null);
                        setPracticeHintsRevealed(0);
                        setPracticeStatus('unanswered');
                        setPracticeScore(0);
                        setIsPracticeComplete(false);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start Practice Set</span>
                    </button>
                  )}

                  {!isVideo && !isPractice && (
                    <div className="text-xs font-medium text-slate-600 px-3 py-1.5 bg-slate-100 rounded-lg">
                      Rubric Linked
                    </div>
                  )}

                  {canCreate && (
                    <button
                      onClick={() => deleteAssignment(asg.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {visibleAssignments.length === 0 && (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-sm font-semibold text-slate-700">No assignments assigned to this batch or student group.</p>
              <p className="text-xs text-slate-500 mt-1">Assignments adapt according to your enrolled student group.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE COURSEWORK MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Differentiated Coursework</h3>
                <p className="text-xs text-slate-500">FR-4.1 & FR-4.4 Coursework Architect</p>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-700 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Byzantine Quorum Verification"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Instructions</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Instructions for students..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Coursework Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  >
                    <option value="standard">Standard (Rubric Linked)</option>
                    <option value="interactive_video">Interactive Video (FR-4.2)</option>
                    <option value="practice_set">Adaptive Practice Set (FR-4.3)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Differentiated Distribution Target (FR-4.1) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Distribution (FR-4.1)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium ${
                      targetType === 'all'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Whole Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('groups')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium ${
                      targetType === 'groups'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Student Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('individuals')}
                    className={`py-2 px-2 text-center rounded-lg border font-medium ${
                      targetType === 'individuals'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Individual Track
                  </button>
                </div>
              </div>

              {targetType === 'groups' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Student Group</label>
                  <select
                    value={targetGroup}
                    onChange={e => setTargetGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  >
                    <option value="Honors Track">Honors Track</option>
                    <option value="Core Studio">Core Studio</option>
                    <option value="Lab Alpha">Lab Alpha</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={isDraft}
                    onChange={e => setIsDraft(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>Save as draft</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                  >
                    Publish Coursework
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE VIDEO ASSIGNMENT MODAL (FR-4.2) */}
      {activeVideoAsg && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-950 rounded-2xl max-w-3xl w-full p-6 text-white shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-red-400 font-semibold uppercase">FR-4.2 Interactive Video Lab</span>
                <h3 className="text-base font-bold text-white">{activeVideoAsg.title}</h3>
              </div>
              <button
                onClick={() => {
                  setActiveVideoAsg(null);
                  setIsVideoPlaying(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Simulated Video Player Stage */}
            <div className="relative bg-slate-900 rounded-xl aspect-video flex flex-col justify-between p-6 border border-slate-800 overflow-hidden">
              {/* Video Content Canvas */}
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <Video className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Raft Leader Election & Randomized Heartbeat Trace
                </p>
                <p className="text-xs text-slate-400 max-w-md">
                  Simulating multi-node partition event at 0:25 and split-vote resolution at 1:15.
                </p>
              </div>

              {/* Video Timeline & Controls */}
              <div className="space-y-2 bg-slate-950/80 backdrop-blur-xs p-3 rounded-lg border border-slate-800">
                {/* Timeline Bar with Checkpoint markers */}
                <div className="relative w-full h-2 bg-slate-800 rounded-full cursor-pointer">
                  <div 
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{ width: `${(videoPlayTime / (activeVideoAsg.videoConfig?.duration || 180)) * 100}%` }}
                  />
                  {activeVideoAsg.videoConfig?.checkpoints.map(cp => {
                    const pct = (cp.timestamp / (activeVideoAsg.videoConfig?.duration || 180)) * 100;
                    const isAnswered = answeredCheckpoints.includes(cp.id);
                    return (
                      <div
                        key={cp.id}
                        className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-950 transition-transform ${
                          isAnswered ? 'bg-emerald-500' : 'bg-amber-400 ring-2 ring-amber-400/30'
                        }`}
                        style={{ left: `${pct}%` }}
                        title={`Checkpoint at ${Math.floor(cp.timestamp / 60)}:${(cp.timestamp % 60).toString().padStart(2, '0')}`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className="p-1 hover:text-white"
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="font-mono">
                      {Math.floor(videoPlayTime / 60)}:{(videoPlayTime % 60).toString().padStart(2, '0')} / 03:00
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Video automatically pauses at interactive checkpoints
                  </span>
                </div>
              </div>

              {/* Time-Synced Checkpoint Modal Overlay (FR-4.2) */}
              {activeCheckpoint && (
                <div className="absolute inset-4 bg-slate-950/95 backdrop-blur-md rounded-xl p-5 border border-slate-700 flex flex-col justify-between animate-in zoom-in-95 duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Interactive Checkpoint (Playback Paused)</span>
                    </div>
                    <p className="text-sm font-bold text-white leading-relaxed">
                      {activeCheckpoint.question}
                    </p>

                    <div className="space-y-2 pt-1">
                      {activeCheckpoint.options.map((opt, i) => (
                        <button
                          key={i}
                          disabled={checkpointAnswerStatus === 'correct'}
                          onClick={() => setSelectedOption(i)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                            selectedOption === i
                              ? 'bg-red-600/20 border-red-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>

                    {showHint && (
                      <div className="p-2.5 bg-indigo-950/50 border border-indigo-800 rounded-lg text-xs text-indigo-300 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{activeCheckpoint.hint}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                    <button
                      onClick={() => setShowHint(true)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Need Hint?</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {checkpointAnswerStatus === 'idle' && (
                        <button
                          disabled={selectedOption === null}
                          onClick={handleAnswerCheckpoint}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                        >
                          Check Answer
                        </button>
                      )}

                      {checkpointAnswerStatus === 'wrong' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400 font-medium">Incorrect, try again</span>
                          <button
                            onClick={handleAnswerCheckpoint}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {checkpointAnswerStatus === 'correct' && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Correct!
                          </span>
                          <button
                            onClick={handleResumeVideo}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Resume Playback</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADAPTIVE PRACTICE SET MODAL (FR-4.3) */}
      {activePracticeAsg && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono text-emerald-600 font-semibold uppercase">FR-4.3 Practice Set</span>
                <h3 className="text-base font-bold text-slate-900">{activePracticeAsg.title}</h3>
              </div>
              <button
                onClick={() => setActivePracticeAsg(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {!isPracticeComplete && activePracticeAsg.practiceConfig && (
              <div className="space-y-4 text-xs">
                {/* Question counter */}
                <div className="flex items-center justify-between text-slate-500 font-mono">
                  <span>Question {practiceQuestionIndex + 1} of {activePracticeAsg.practiceConfig.questions.length}</span>
                  <span>Score: {practiceScore} / {activePracticeAsg.practiceConfig.questions.length}</span>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {activePracticeAsg.practiceConfig.questions[practiceQuestionIndex].prompt}
                </p>

                {/* Options */}
                <div className="space-y-2">
                  {activePracticeAsg.practiceConfig.questions[practiceQuestionIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={practiceStatus !== 'unanswered'}
                      onClick={() => setPracticeSelectedOpt(i)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        practiceSelectedOpt === i
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Progressive Hints (FR-4.3) */}
                {practiceHintsRevealed > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                    <p className="font-semibold text-amber-900 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Pedagogical Hint {practiceHintsRevealed}</span>
                    </p>
                    <p className="text-amber-800">
                      {activePracticeAsg.practiceConfig.questions[practiceQuestionIndex].hints[practiceHintsRevealed - 1]}
                    </p>
                  </div>
                )}

                {/* Explanation on answer */}
                {practiceStatus !== 'unanswered' && (
                  <div className={`p-3 rounded-lg border ${
                    practiceStatus === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <p className="font-bold mb-1">
                      {practiceStatus === 'correct' ? '✓ Mastered!' : '✕ Not quite.'}
                    </p>
                    <p>{activePracticeAsg.practiceConfig.questions[practiceQuestionIndex].explanation}</p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    disabled={practiceHintsRevealed >= (activePracticeAsg.practiceConfig.questions[practiceQuestionIndex].hints.length || 0)}
                    onClick={() => setPracticeHintsRevealed(prev => prev + 1)}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 disabled:opacity-40"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Get Hint ({activePracticeAsg.practiceConfig.questions[practiceQuestionIndex].hints.length - practiceHintsRevealed} remaining)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {practiceStatus === 'unanswered' ? (
                      <button
                        disabled={practiceSelectedOpt === null}
                        onClick={handlePracticeSubmit}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextPracticeQuestion}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1"
                      >
                        <span>Next Concept</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isPracticeComplete && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Practice Set Completed!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your automated mastery summary has been committed to your student profile.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl inline-block font-mono text-sm">
                  Mastery Score: <strong>{practiceScore} / {activePracticeAsg.practiceConfig?.questions.length}</strong>
                </div>
                <div>
                  <button
                    onClick={() => setActivePracticeAsg(null)}
                    className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                  >
                    Return to Coursework
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
