/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { TranscriptWord } from '../../types/lms';
import { 
  Camera, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Scissors, 
  Download, 
  Sparkles, 
  FileText, 
  Play, 
  Pause, 
  RotateCcw,
  Layers,
  Check,
  Film
} from 'lucide-react';

const INITIAL_TRANSCRIPT: TranscriptWord[] = [
  { start: 0.0, end: 1.4, text: "Welcome" },
  { start: 1.4, end: 2.1, text: "everyone" },
  { start: 2.1, end: 2.8, text: "to" },
  { start: 2.8, end: 3.5, text: "Lecture" },
  { start: 3.5, end: 4.2, text: "four" },
  { start: 4.2, end: 4.8, text: "on" },
  { start: 4.8, end: 5.9, text: "distributed" },
  { start: 5.9, end: 6.8, text: "consensus." },
  { start: 7.2, end: 8.0, text: "Today" },
  { start: 8.0, end: 8.6, text: "we" },
  { start: 8.6, end: 9.3, text: "will" },
  { start: 9.3, end: 10.1, text: "prove" },
  { start: 10.1, end: 10.8, text: "the" },
  { start: 10.8, end: 11.8, text: "invariance" },
  { start: 11.8, end: 12.6, text: "of" },
  { start: 12.6, end: 13.5, text: "vector" },
  { start: 13.5, end: 14.4, text: "clocks" },
  { start: 14.8, end: 15.6, text: "under" },
  { start: 15.6, end: 16.5, text: "network" },
  { start: 16.5, end: 17.6, text: "partitions." },
  { start: 18.0, end: 18.5, text: "Um," },
  { start: 18.5, end: 19.0, text: "you" },
  { start: 19.0, end: 19.4, text: "know," },
  { start: 19.5, end: 20.2, text: "notice" },
  { start: 20.2, end: 20.8, text: "how" },
  { start: 20.8, end: 21.6, text: "partial" },
  { start: 21.6, end: 22.4, text: "orders" },
  { start: 22.4, end: 23.3, text: "preserve" },
  { start: 23.3, end: 24.2, text: "causality." }
];

export const MediaRecordingStudio: React.FC = () => {
  const { currentUser, selectedLecture } = useLMS();

  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(24);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [pipPosition, setPipPosition] = useState<'bottom-right' | 'top-right' | 'bottom-left'>('bottom-right');

  // Transcript-based text editing state (FR-7.2)
  const [transcript, setTranscript] = useState<TranscriptWord[]>(INITIAL_TRANSCRIPT);
  const [trimPreviewActive, setTrimPreviewActive] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  // Multimedia Student Templates (FR-7.3)
  const [activeTemplate, setActiveTemplate] = useState<string>('lecture_pip');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attempt real user webcam device if accessible
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraEnabled) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: micEnabled })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Graceful fallback to styled video avatar presenter
        });
    }
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [cameraEnabled, micEnabled]);

  // Recording timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Toggle word deletion for transcript trimming (FR-7.2)
  const toggleDeleteWord = (index: number) => {
    setTranscript(prev =>
      prev.map((word, i) => i === index ? { ...word, deleted: !word.deleted } : word)
    );
  };

  // Remove filler words automatically ("um", "you know")
  const autoRemoveFillers = () => {
    setTranscript(prev =>
      prev.map(w => {
        const lower = w.text.toLowerCase().replace(/[^a-z]/g, '');
        if (['um', 'uh', 'you', 'know'].includes(lower)) {
          return { ...w, deleted: true };
        }
        return w;
      })
    );
  };

  const handleExportTrimmedMedia = () => {
    const activeWords = transcript.filter(w => !w.deleted);
    const exportData = {
      title: `${selectedLecture?.title || 'Lecture'}_Trimmed_Recording`,
      instructor: currentUser.name,
      originalDurationSeconds: recordDuration,
      trimmedDurationSeconds: activeWords.length * 0.7,
      transcript: activeWords,
      template: activeTemplate,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Media Creation & Extensions</span>
              <span>·</span>
              <span>FR-7.1, FR-7.2, FR-7.3</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Webcam PiP Studio & Transcript-Based Video Editor
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Recording CTA */}
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
              <span>{isRecording ? 'Stop Recording' : 'Start Studio Recording'}</span>
            </button>
          </div>
        </div>

        {/* Main Stage Grid: Studio Canvas PiP vs Transcript Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Studio Stage Canvas with Floating Webcam PiP (FR-7.1) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative bg-slate-900 rounded-2xl aspect-video overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between p-6">
              {/* Background Slide Presentation Canvas */}
              <div className="text-white space-y-3 select-none">
                <span className="text-xs font-mono text-indigo-400 font-semibold uppercase">
                  {selectedLecture?.title || 'Distributed Systems Lecture'}
                </span>
                <h3 className="text-xl font-bold text-white max-w-md">
                  Vector Clocks & Causality Invariants
                </h3>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 max-w-sm">
                  Rule 1: V_i[i] = V_i[i] + 1<br />
                  Rule 2: V_i[k] = max(V_i[k], V_msg[k])
                </div>
              </div>

              {/* Floating Webcam Picture-in-Picture (PiP) Window (FR-7.1) */}
              {cameraEnabled && (
                <div
                  className={`absolute w-44 aspect-video bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20 transition-all ${
                    pipPosition === 'bottom-right'
                      ? 'bottom-4 right-4'
                      : pipPosition === 'top-right'
                      ? 'top-4 right-4'
                      : 'bottom-4 left-4'
                  }`}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover hidden"
                  />
                  {/* Fallback avatar camera representation */}
                  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-2 relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500 mb-1"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-white font-medium truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-indigo-300 uppercase tracking-wide">
                      Webcam PiP
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Studio Controls */}
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/80 backdrop-blur-xs p-3 rounded-xl border border-slate-800 z-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-red-400 flex items-center gap-1.5 font-bold">
                    <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                    {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                  </span>
                  <span>·</span>
                  <button
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className="hover:text-white flex items-center gap-1"
                  >
                    {cameraEnabled ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-slate-500" />}
                    <span>Camera</span>
                  </button>
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className="hover:text-white flex items-center gap-1"
                  >
                    {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
                    <span>Mic</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">PiP Dock:</span>
                  <button
                    onClick={() => setPipPosition('bottom-right')}
                    className={`px-2 py-0.5 rounded text-[11px] ${pipPosition === 'bottom-right' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    BR
                  </button>
                  <button
                    onClick={() => setPipPosition('top-right')}
                    className={`px-2 py-0.5 rounded text-[11px] ${pipPosition === 'top-right' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    TR
                  </button>
                  <button
                    onClick={() => setPipPosition('bottom-left')}
                    className={`px-2 py-0.5 rounded text-[11px] ${pipPosition === 'bottom-left' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    BL
                  </button>
                </div>
              </div>
            </div>

            {/* Multimedia Templates Selector (FR-7.3) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Film className="w-4 h-4 text-indigo-600" />
                <span>Student Multimedia Project Templates (FR-7.3)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'lecture_pip', title: 'Instructor Lecture PiP', desc: 'Full-stage vector slides with speaker webcam' },
                  { id: 'lightning_talk', title: '3-Min Lightning Talk', desc: 'Structured student research presentation' },
                  { id: 'code_walkthrough', title: 'Code & Proof Review', desc: 'Side-by-side terminal & blackboard canvas' }
                ].map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setActiveTemplate(tmpl.id)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      activeTemplate === tmpl.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold">{tmpl.title}</p>
                    <p className="text-[10px] opacity-75 mt-0.5 leading-tight">{tmpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Transcript-Based Video Trimmer (FR-7.2) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Transcript-Based Video Trimmer</h3>
                    <p className="text-xs text-slate-500">FR-7.2 Click words to trim or remove</p>
                  </div>
                </div>
                <button
                  onClick={autoRemoveFillers}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                >
                  Auto-Trim Fillers
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Click any word in the speech transcript to strike it out and exclude that video segment from the final rendering.
              </p>

              {/* Interactive Word Chips */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[220px] flex flex-wrap gap-1.5 text-xs">
                {transcript.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDeleteWord(idx)}
                    className={`px-1.5 py-0.5 rounded transition-all select-none ${
                      word.deleted
                        ? 'line-through text-red-400 bg-red-50 hover:bg-red-100'
                        : 'text-slate-800 bg-white hover:bg-slate-200 shadow-2xs'
                    }`}
                    title={`${word.start.toFixed(1)}s - ${word.end.toFixed(1)}s (Click to ${word.deleted ? 'restore' : 'trim'})`}
                  >
                    {word.text}
                  </button>
                ))}
              </div>

              {/* Trimming Statistics */}
              <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1 font-mono">
                <span>Active Duration: ~{(transcript.filter(w => !w.deleted).length * 0.7).toFixed(1)}s</span>
                <span className="text-red-500">
                  Trimmed: {transcript.filter(w => w.deleted).length} words
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setTranscript(INITIAL_TRANSCRIPT)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Reset All Edits
              </button>

              <button
                onClick={handleExportTrimmedMedia}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Trimmed Media Package</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
