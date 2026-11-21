/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { Lecture } from '../../types/lms';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Plus, 
  Lock,
  Presentation,
  Clock,
  Upload,
  HardDrive,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  onSelectLecture?: (lecture: Lecture) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectLecture }) => {
  const { 
    currentUser, 
    visibleBatches, 
    selectedBatchId, 
    setSelectedBatchId,
    selectedLecture,
    setSelectedLecture,
    createChapter,
    createTopic,
    createLecture,
    uploadedPdfs,
    activePdfRecord,
    openPdfOnBoard,
    openPdfUploadModal
  } = useLMS();

  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-neur-1': true
  });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    'top-1-1': true,
    'top-neur-1': true
  });

  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  const [addingTopicChapterId, setAddingTopicChapterId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  const [addingLectureTopicId, setAddingLectureTopicId] = useState<string | null>(null);
  const [newLectureTitle, setNewLectureTitle] = useState('');

  const activeBatch = visibleBatches.find(b => b.id === selectedBatchId) || visibleBatches[0];

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'instructor';

  return (
    <aside className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-57px)]">
      {/* Batch Switcher / Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
          Active Batch (Batch → Chapter → Topic → Lecture)
        </label>
        <div className="relative">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-2 shadow-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
          >
            {visibleBatches.map(batch => (
              <option key={batch.id} value={batch.id}>
                {batch.code} · {batch.name}
              </option>
            ))}
          </select>
        </div>
        {activeBatch && (
          <div className="mt-2 text-[11px] text-slate-500 line-clamp-2">
            {activeBatch.description}
          </div>
        )}
      </div>

      {/* Hierarchical Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-500">
          <span>CURRICULUM TREE</span>
          {canEdit && (
            <button
              onClick={() => setIsAddingChapter(true)}
              className="text-[11px] text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 hover:underline"
              title="Add Chapter"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chapter</span>
            </button>
          )}
        </div>

        {/* Create Chapter Form */}
        {isAddingChapter && (
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-2 space-y-2">
            <p className="text-xs font-semibold text-slate-800">New Chapter</p>
            <input
              type="text"
              placeholder="Chapter Title"
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Brief description"
              value={newChapterDesc}
              onChange={e => setNewChapterDesc(e.target.value)}
              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setIsAddingChapter(false)}
                className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newChapterTitle.trim()) {
                    createChapter(selectedBatchId, newChapterTitle.trim(), newChapterDesc.trim());
                    setNewChapterTitle('');
                    setNewChapterDesc('');
                    setIsAddingChapter(false);
                  }
                }}
                className="px-2.5 py-1 text-xs bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Chapters List */}
        {activeBatch?.chapters.map(chapter => {
          const isChapExpanded = expandedChapters[chapter.id] ?? false;
          return (
            <div key={chapter.id} className="space-y-0.5">
              {/* Chapter Node */}
              <div className="flex items-center justify-between group py-1.5 px-2 rounded-md hover:bg-slate-100 transition-colors">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="flex items-center gap-1.5 text-left min-w-0 flex-1"
                >
                  {isChapExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  {isChapExpanded ? (
                    <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {chapter.title}
                  </span>
                </button>
                {canEdit && (
                  <button
                    onClick={() => setAddingTopicChapterId(chapter.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-900 p-0.5 transition-opacity"
                    title="Add Topic"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add Topic Modal / Input */}
              {addingTopicChapterId === chapter.id && (
                <div className="ml-5 p-2 bg-slate-50 rounded border border-slate-200 my-1 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Topic Title"
                    value={newTopicTitle}
                    onChange={e => setNewTopicTitle(e.target.value)}
                    className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setAddingTopicChapterId(null)}
                      className="px-2 py-0.5 text-xs text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (newTopicTitle.trim()) {
                          createTopic(chapter.id, newTopicTitle.trim());
                          setNewTopicTitle('');
                          setAddingTopicChapterId(null);
                        }
                      }}
                      className="px-2 py-0.5 text-xs bg-slate-900 text-white rounded font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Topics */}
              {isChapExpanded && (
                <div className="ml-4 pl-2 border-l border-slate-200 space-y-0.5">
                  {chapter.topics.map(topic => {
                    const isTopExpanded = expandedTopics[topic.id] ?? false;
                    return (
                      <div key={topic.id} className="space-y-0.5">
                        <div className="flex items-center justify-between group py-1 px-2 rounded-md hover:bg-slate-100 transition-colors">
                          <button
                            onClick={() => toggleTopic(topic.id)}
                            className="flex items-center gap-1.5 text-left min-w-0 flex-1"
                          >
                            {isTopExpanded ? (
                              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate">
                              {topic.title}
                            </span>
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => setAddingLectureTopicId(topic.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-900 p-0.5 transition-opacity"
                              title="Add Lecture"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Add Lecture Input */}
                        {addingLectureTopicId === topic.id && (
                          <div className="ml-4 p-2 bg-slate-50 rounded border border-slate-200 my-1 space-y-1.5">
                            <input
                              type="text"
                              placeholder="Lecture Title (e.g. Lec 04: Vector Clocks)"
                              value={newLectureTitle}
                              onChange={e => setNewLectureTitle(e.target.value)}
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setAddingLectureTopicId(null)}
                                className="px-2 py-0.5 text-xs text-slate-600"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (newLectureTitle.trim()) {
                                    createLecture(topic.id, newLectureTitle.trim(), 45);
                                    setNewLectureTitle('');
                                    setAddingLectureTopicId(null);
                                  }
                                }}
                                className="px-2 py-0.5 text-xs bg-slate-900 text-white rounded font-medium"
                              >
                                Add Lecture
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Lectures */}
                        {isTopExpanded && (
                          <div className="ml-4 pl-2 border-l border-slate-200 space-y-1 py-0.5">
                            {topic.lectures.map(lecture => {
                              const isSelected = selectedLecture?.id === lecture.id;
                              return (
                                <button
                                  key={lecture.id}
                                  onClick={() => {
                                    setSelectedLecture(lecture);
                                    if (onSelectLecture) onSelectLecture(lecture);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-start gap-2 transition-colors ${
                                    isSelected
                                      ? 'bg-slate-900 text-white font-medium shadow-xs'
                                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <Presentation className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs truncate">{lecture.title}</p>
                                    <div className="flex items-center gap-1.5 text-[10px] opacity-75 mt-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{lecture.durationMinutes}m</span>
                                      <span>·</span>
                                      <span>{lecture.slidesPages?.length || 1} slides</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {activeBatch?.chapters.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            No chapters found in this batch.
          </div>
        )}

        {/* Uploaded PDFs (Disk & Cloud) */}
        <div className="pt-4 mt-4 border-t border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-500">
            <span>UPLOADED PDFS</span>
            <button
              onClick={() => openPdfUploadModal(null)}
              className="text-[11px] text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 hover:underline"
              title="Upload PDF (Choose Disk or Cloud)"
            >
              <Upload className="w-3 h-3" />
              <span>Upload</span>
            </button>
          </div>

          {uploadedPdfs.length === 0 ? (
            <button
              onClick={() => openPdfUploadModal(null)}
              className="w-full text-left px-2.5 py-2.5 rounded-lg border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-[11px] text-slate-500"
            >
              No PDFs uploaded yet. Click to upload and choose Local Disk or Cloud storage.
            </button>
          ) : (
            <div className="space-y-1">
              {uploadedPdfs.slice(0, 6).map(pdf => {
                const isSelected = activePdfRecord?.id === pdf.id;
                const isCloud = pdf.storageDestination === 'cloud';
                return (
                  <button
                    key={pdf.id}
                    onClick={() => openPdfOnBoard(pdf)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-start gap-2 transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white font-medium shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {isCloud ? (
                      <Cloud
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isSelected ? 'text-indigo-300' : 'text-indigo-500'
                        }`}
                      />
                    ) : (
                      <HardDrive
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isSelected ? 'text-amber-300' : 'text-amber-600'
                        }`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{pdf.name}</p>
                      <p className="text-[10px] opacity-75 font-mono tabular-nums mt-0.5">
                        {isCloud ? 'Cloud' : 'Local Disk'} · {pdf.pageCount}p
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RBAC Enrollment Notice Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">
          {currentUser.role === 'admin'
            ? 'Admin: Global Batch Access'
            : `Enrolled: ${visibleBatches.length} batch(es)`}
        </span>
      </div>
    </aside>
  );
};
