/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Role, 
  Batch, 
  Chapter, 
  Topic, 
  Lecture, 
  VectorStroke, 
  ToolType, 
  CollaboratorCursor, 
  Assignment, 
  Rubric, 
  Submission, 
  CommentBankItem, 
  GuardianSummaryConfig,
  OTDelta,
  ExamSubject,
  ExamModule,
  ExamChapter,
  MCQQuestion,
  ExamBlueprint,
  GeneratedExam,
  ExamResult
} from '../types/lms';
import { 
  INITIAL_USERS, 
  INITIAL_BATCHES, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_RUBRICS, 
  INITIAL_SUBMISSIONS, 
  INITIAL_COMMENT_BANK,
  INITIAL_GUARDIAN_CONFIG 
} from '../data/mockData';
import {
  EXAM_SUBJECTS,
  EXAM_MODULES,
  EXAM_CHAPTERS,
  INITIAL_MCQ_QUESTIONS,
  INITIAL_BLUEPRINTS,
  INITIAL_EXAM_RESULTS
} from '../data/examMockData';

interface SessionInvalidationNotice {
  userId: string;
  userName: string;
  batchId: string;
  timestamp: string;
  tokenRevoked: boolean;
}

interface LMSContextType {
  // Authentication & RBAC
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: 'active' | 'banned') => void;
  reassignUserBatches: (userId: string, batchIds: string[]) => void;
  registerUser: (newUser: Omit<User, 'id' | 'lastActive'>) => void;
  sessionInvalidationNotice: SessionInvalidationNotice | null;
  dismissSessionNotice: () => void;

  // Content Taxonomy
  batches: Batch[];
  visibleBatches: Batch[];
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  selectedLecture: Lecture | null;
  setSelectedLecture: (lecture: Lecture | null) => void;
  createChapter: (batchId: string, title: string, description: string) => void;
  createTopic: (chapterId: string, title: string) => void;
  createLecture: (topicId: string, title: string, durationMinutes: number) => void;

  // Collaborative Board Engine
  activePageIndex: number;
  setActivePageIndex: (index: number) => void;
  totalPages: number;
  strokes: VectorStroke[];
  addStroke: (stroke: Omit<VectorStroke, 'id' | 'timestamp' | 'authorId' | 'authorName'>) => void;
  undoLastStroke: () => void;
  clearCurrentPage: () => void;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  strokeOpacity: number;
  setStrokeOpacity: (opacity: number) => void;
  
  // Follow Leader & Real-Time Sync
  isFollowLeaderActive: boolean;
  toggleFollowLeader: () => void;
  leaderViewport: { zoom: number; panX: number; panY: number; pageIndex: number };
  updateLeaderViewport: (viewport: { zoom: number; panX: number; panY: number; pageIndex: number }) => void;
  connectedCollaborators: CollaboratorCursor[];
  otLog: OTDelta[];
  peerLatencyMs: number;

  // Coursework & Differentiated Assignments
  assignments: Assignment[];
  visibleAssignments: Assignment[];
  createAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  deleteAssignment: (id: string) => void;
  
  // Grading & Rubrics
  rubrics: Rubric[];
  submissions: Submission[];
  gradeSubmission: (submissionId: string, grade: number, rubricScores: Record<string, number>, feedback: string) => void;
  toggleExcuseSubmission: (submissionId: string) => void;
  commentBank: CommentBankItem[];
  addCommentBankItem: (category: CommentBankItem['category'], shortcut: string, text: string) => void;

  // Guardian & Integrations
  guardianConfig: GuardianSummaryConfig;
  updateGuardianConfig: (config: Partial<GuardianSummaryConfig>) => void;
  triggerGuardianDispatch: () => void;
  lastDispatchAlert: string | null;
  dismissDispatchAlert: () => void;

  // MCQ Exam Engine (Section 2, 3, 4)
  examSubjects: ExamSubject[];
  examModules: ExamModule[];
  examChapters: ExamChapter[];
  mcqQuestions: MCQQuestion[];
  addMCQQuestion: (q: Omit<MCQQuestion, 'id'>) => void;
  updateMCQQuestion: (id: string, q: Partial<MCQQuestion>) => void;
  deleteMCQQuestion: (id: string) => void;
  examBlueprints: ExamBlueprint[];
  createExamBlueprint: (bp: Omit<ExamBlueprint, 'id'>) => void;
  generatedExams: GeneratedExam[];
  createGeneratedExam: (exam: GeneratedExam) => void;
  examResults: ExamResult[];
  submitExamResult: (res: ExamResult) => void;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users & Auth
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>('user-inst-1'); // Default to Instructor Prof. Sarah
  const [sessionInvalidationNotice, setSessionInvalidationNotice] = useState<SessionInvalidationNotice | null>(null);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Batches & Taxonomy
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('batch-cs401');

  // RBAC Filter for Batches
  const visibleBatches = batches.filter(batch => {
    if (currentUser.role === 'admin') return true;
    return currentUser.assignedBatches.includes(batch.id);
  });

  // Keep selectedBatchId valid
  useEffect(() => {
    if (!visibleBatches.some(b => b.id === selectedBatchId) && visibleBatches.length > 0) {
      setSelectedBatchId(visibleBatches[0].id);
    }
  }, [currentUser, visibleBatches, selectedBatchId]);

  // Selected Lecture
  const currentBatch = batches.find(b => b.id === selectedBatchId) || batches[0];
  const firstLecture = currentBatch?.chapters[0]?.topics[0]?.lectures[0] || null;
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(firstLecture);

  // Sync selectedLecture when batch changes
  useEffect(() => {
    const lecture = currentBatch?.chapters[0]?.topics[0]?.lectures[0] || null;
    setSelectedLecture(lecture);
  }, [selectedBatchId]);

  // Collaborative Board State
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const totalPages = selectedLecture?.slidesPages?.length || 3;
  const [strokes, setStrokes] = useState<VectorStroke[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [strokeOpacity, setStrokeOpacity] = useState<number>(1);

  // Follow Leader & WebSocket OT Simulation
  const [isFollowLeaderActive, setIsFollowLeaderActive] = useState<boolean>(true);
  const [leaderViewport, setLeaderViewport] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    pageIndex: 0
  });
  const [otLog, setOtLog] = useState<OTDelta[]>([]);
  const peerLatencyMs = 48; // Target latency < 120ms (P-1 requirement)

  // Collaborators
  const [connectedCollaborators, setConnectedCollaborators] = useState<CollaboratorCursor[]>([
    {
      id: 'user-inst-1',
      name: 'Prof. Sarah Sterling',
      role: 'instructor',
      color: '#3b82f6',
      x: 340,
      y: 220,
      page: 0,
      lastActive: Date.now()
    },
    {
      id: 'user-stud-1',
      name: 'Elena Rostova',
      role: 'student',
      color: '#10b981',
      x: 480,
      y: 360,
      page: 0,
      lastActive: Date.now()
    },
    {
      id: 'user-stud-2',
      name: 'Kenji Sato',
      role: 'student',
      color: '#f59e0b',
      x: 210,
      y: 440,
      page: 0,
      lastActive: Date.now()
    }
  ]);

  // Simulate subtle natural cursor drift for other collaborators to demonstrate real-time collaborative OT presence
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedCollaborators(prev =>
        prev.map(c => {
          if (c.id === currentUser.id) return c;
          const deltaX = (Math.random() - 0.48) * 14;
          const deltaY = (Math.random() - 0.48) * 12;
          return {
            ...c,
            x: Math.max(50, Math.min(850, c.x + deltaX)),
            y: Math.max(50, Math.min(550, c.y + deltaY)),
            lastActive: Date.now()
          };
        })
      );
    }, 2400);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // If follow leader is active and student is logged in, sync their page index to leader's
  useEffect(() => {
    if (isFollowLeaderActive && currentUser.role === 'student') {
      setActivePageIndex(leaderViewport.pageIndex);
    }
  }, [isFollowLeaderActive, leaderViewport.pageIndex, currentUser.role]);

  // Coursework & Assignments
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [rubrics] = useState<Rubric[]>(INITIAL_RUBRICS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [commentBank, setCommentBank] = useState<CommentBankItem[]>(INITIAL_COMMENT_BANK);
  const [guardianConfig, setGuardianConfig] = useState<GuardianSummaryConfig>(INITIAL_GUARDIAN_CONFIG);
  const [lastDispatchAlert, setLastDispatchAlert] = useState<string | null>(null);

  // Filter visible assignments by user role and batch
  const visibleAssignments = assignments.filter(asg => {
    if (asg.batchId !== selectedBatchId) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'instructor') return true;
    
    // For student: check targetType
    if (asg.targetType === 'all') return true;
    if (asg.targetType === 'groups' && asg.targetGroups && currentUser.studentGroup) {
      return asg.targetGroups.includes(currentUser.studentGroup);
    }
    if (asg.targetType === 'individuals' && asg.targetStudentIds) {
      return asg.targetStudentIds.includes(currentUser.id);
    }
    return false;
  });

  // Switch User
  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
  };

  // Update user status
  const updateUserStatus = (userId: string, status: 'active' | 'banned') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    if (status === 'banned') {
      setSessionInvalidationNotice({
        userId,
        userName: users.find(u => u.id === userId)?.name || 'User',
        batchId: 'All',
        timestamp: new Date().toLocaleTimeString(),
        tokenRevoked: true
      });
    }
  };

  // Reassign User Batches (FR-1.3, FR-1.4: Invalidate affected access tokens within 1s)
  const reassignUserBatches = (userId: string, newBatchIds: string[]) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, assignedBatches: newBatchIds } : u));
    
    // Trigger instant session invalidation notice (<1s propagation test)
    setSessionInvalidationNotice({
      userId,
      userName: targetUser?.name || 'User',
      batchId: newBatchIds.join(', '),
      timestamp: new Date().toLocaleTimeString(),
      tokenRevoked: true
    });
  };

  const dismissSessionNotice = () => {
    setSessionInvalidationNotice(null);
  };

  // Register User
  const registerUser = (newUser: Omit<User, 'id' | 'lastActive'>) => {
    const id = `user-${Date.now()}`;
    const created: User = {
      ...newUser,
      id,
      lastActive: 'Just now'
    };
    setUsers(prev => [created, ...prev]);
  };

  // Add vector stroke with OT Delta log
  const addStroke = (stroke: Omit<VectorStroke, 'id' | 'timestamp' | 'authorId' | 'authorName'>) => {
    const newStroke: VectorStroke = {
      ...stroke,
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.name
    };

    setStrokes(prev => [...prev, newStroke]);

    // Record OT Operation
    const delta: OTDelta = {
      id: `ot-${Date.now()}`,
      type: 'ADD_STROKE',
      payload: newStroke,
      rev: otLog.length + 1,
      timestamp: Date.now(),
      authorId: currentUser.id
    };
    setOtLog(prev => [delta, ...prev.slice(0, 49)]);
  };

  const undoLastStroke = () => {
    setStrokes(prev => {
      // Find last stroke on current page authored by current user (or any if instructor)
      const pageStrokes = prev.filter(s => s.pageIndex === activePageIndex);
      if (pageStrokes.length === 0) return prev;
      const lastStroke = pageStrokes[pageStrokes.length - 1];
      return prev.filter(s => s.id !== lastStroke.id);
    });
  };

  const clearCurrentPage = () => {
    setStrokes(prev => prev.filter(s => s.pageIndex !== activePageIndex));
    const delta: OTDelta = {
      id: `ot-${Date.now()}`,
      type: 'CLEAR_PAGE',
      payload: { pageIndex: activePageIndex },
      rev: otLog.length + 1,
      timestamp: Date.now(),
      authorId: currentUser.id
    };
    setOtLog(prev => [delta, ...prev.slice(0, 49)]);
  };

  const toggleFollowLeader = () => {
    setIsFollowLeaderActive(prev => !prev);
  };

  const updateLeaderViewport = useCallback((vp: { zoom: number; panX: number; panY: number; pageIndex: number }) => {
    setLeaderViewport(vp);
    if (isFollowLeaderActive && currentUser.role === 'instructor') {
      const delta: OTDelta = {
        id: `ot-${Date.now()}`,
        type: 'VIEWPORT_SYNC',
        payload: vp,
        rev: otLog.length + 1,
        timestamp: Date.now(),
        authorId: currentUser.id
      };
      setOtLog(prev => [delta, ...prev.slice(0, 49)]);
    }
  }, [isFollowLeaderActive, currentUser.role, currentUser.id, otLog.length]);

  // Create Content Taxonomy items
  const createChapter = (batchId: string, title: string, description: string) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id !== batchId) return batch;
      const newChapter: Chapter = {
        id: `ch-${Date.now()}`,
        batchId,
        title,
        order: batch.chapters.length + 1,
        description,
        topics: []
      };
      return { ...batch, chapters: [...batch.chapters, newChapter] };
    }));
  };

  const createTopic = (chapterId: string, title: string) => {
    setBatches(prev => prev.map(batch => {
      const chapterIndex = batch.chapters.findIndex(c => c.id === chapterId);
      if (chapterIndex === -1) return batch;
      const chapter = batch.chapters[chapterIndex];
      const newTopic: Topic = {
        id: `top-${Date.now()}`,
        chapterId,
        batchId: batch.id,
        title,
        order: chapter.topics.length + 1,
        lectures: []
      };
      const updatedChapters = [...batch.chapters];
      updatedChapters[chapterIndex] = {
        ...chapter,
        topics: [...chapter.topics, newTopic]
      };
      return { ...batch, chapters: updatedChapters };
    }));
  };

  const createLecture = (topicId: string, title: string, durationMinutes: number) => {
    setBatches(prev => prev.map(batch => {
      let found = false;
      const updatedChapters = batch.chapters.map(chapter => {
        const topicIndex = chapter.topics.findIndex(t => t.id === topicId);
        if (topicIndex === -1) return chapter;
        found = true;
        const topic = chapter.topics[topicIndex];
        const newLecture: Lecture = {
          id: `lec-${Date.now()}`,
          topicId,
          chapterId: chapter.id,
          batchId: batch.id,
          title,
          order: topic.lectures.length + 1,
          durationMinutes,
          date: new Date().toISOString().split('T')[0],
          hasBoard: true,
          slidesTitle: `${title} — Vector Deck`,
          slidesPages: [
            {
              pageNumber: 1,
              title: `${title} Overview`,
              subtitle: 'Core Concept Introduction',
              keyConcepts: ['Key takeaway 1', 'Key takeaway 2', 'Synthesis question'],
              notes: 'Introduced during live session.'
            }
          ],
          materials: []
        };
        const updatedTopics = [...chapter.topics];
        updatedTopics[topicIndex] = {
          ...topic,
          lectures: [...topic.lectures, newLecture]
        };
        return { ...chapter, topics: updatedTopics };
      });
      return found ? { ...batch, chapters: updatedChapters } : batch;
    }));
  };

  // Coursework
  const createAssignment = (asg: Omit<Assignment, 'id'>) => {
    const newAsg: Assignment = {
      ...asg,
      id: `asg-${Date.now()}`
    };
    setAssignments(prev => [newAsg, ...prev]);
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  // Grading
  const gradeSubmission = (submissionId: string, grade: number, rubricScores: Record<string, number>, feedback: string) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id !== submissionId) return sub;
      return {
        ...sub,
        grade,
        rubricScores,
        feedbackComment: feedback,
        status: 'graded'
      };
    }));
  };

  const toggleExcuseSubmission = (submissionId: string) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id !== submissionId) return sub;
      const newStatus = sub.status === 'excused' ? 'missing' : 'excused';
      return {
        ...sub,
        status: newStatus
      };
    }));
  };

  const addCommentBankItem = (category: CommentBankItem['category'], shortcut: string, text: string) => {
    const newItem: CommentBankItem = {
      id: `cb-${Date.now()}`,
      category,
      shortcut,
      text
    };
    setCommentBank(prev => [...prev, newItem]);
  };

  // Guardian dispatch
  const updateGuardianConfig = (config: Partial<GuardianSummaryConfig>) => {
    setGuardianConfig(prev => ({ ...prev, ...config }));
  };

  const triggerGuardianDispatch = () => {
    const nowStr = new Date().toLocaleString();
    setGuardianConfig(prev => ({ ...prev, lastDispatchedDate: nowStr }));
    setLastDispatchAlert(`Weekly guardian summary successfully queued and dispatched to authorized contacts (including ${currentUser.guardianEmail || 'guardians@vectorlms.edu'}).`);
  };

  const dismissDispatchAlert = () => {
    setLastDispatchAlert(null);
  };

  // MCQ Exam Engine State (Section 2, 3, 4)
  const [examSubjects] = useState<ExamSubject[]>(EXAM_SUBJECTS);
  const [examModules] = useState<ExamModule[]>(EXAM_MODULES);
  const [examChapters] = useState<ExamChapter[]>(EXAM_CHAPTERS);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>(INITIAL_MCQ_QUESTIONS);
  const [examBlueprints, setExamBlueprints] = useState<ExamBlueprint[]>(INITIAL_BLUEPRINTS);
  const [generatedExams, setGeneratedExams] = useState<GeneratedExam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>(INITIAL_EXAM_RESULTS);

  const addMCQQuestion = (q: Omit<MCQQuestion, 'id'>) => {
    const newQ: MCQQuestion = {
      ...q,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    setMcqQuestions(prev => [newQ, ...prev]);
  };

  const updateMCQQuestion = (id: string, q: Partial<MCQQuestion>) => {
    setMcqQuestions(prev => prev.map(item => item.id === id ? { ...item, ...q } : item));
  };

  const deleteMCQQuestion = (id: string) => {
    setMcqQuestions(prev => prev.filter(item => item.id !== id));
  };

  const createExamBlueprint = (bp: Omit<ExamBlueprint, 'id'>) => {
    const newBp: ExamBlueprint = {
      ...bp,
      id: `bp-${Date.now()}`
    };
    setExamBlueprints(prev => [newBp, ...prev]);
  };

  const createGeneratedExam = (exam: GeneratedExam) => {
    setGeneratedExams(prev => [exam, ...prev.filter(e => e.id !== exam.id)]);
  };

  const submitExamResult = (res: ExamResult) => {
    setExamResults(prev => [res, ...prev]);
  };

  return (
    <LMSContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        updateUserStatus,
        reassignUserBatches,
        registerUser,
        sessionInvalidationNotice,
        dismissSessionNotice,

        batches,
        visibleBatches,
        selectedBatchId,
        setSelectedBatchId,
        selectedLecture,
        setSelectedLecture,
        createChapter,
        createTopic,
        createLecture,

        activePageIndex,
        setActivePageIndex,
        totalPages,
        strokes,
        addStroke,
        undoLastStroke,
        clearCurrentPage,
        activeTool,
        setActiveTool,
        strokeColor,
        setStrokeColor,
        strokeWidth,
        setStrokeWidth,
        strokeOpacity,
        setStrokeOpacity,

        isFollowLeaderActive,
        toggleFollowLeader,
        leaderViewport,
        updateLeaderViewport,
        connectedCollaborators,
        otLog,
        peerLatencyMs,

        assignments,
        visibleAssignments,
        createAssignment,
        deleteAssignment,

        rubrics,
        submissions,
        gradeSubmission,
        toggleExcuseSubmission,
        commentBank,
        addCommentBankItem,

        guardianConfig,
        updateGuardianConfig,
        triggerGuardianDispatch,
        lastDispatchAlert,
        dismissDispatchAlert,

        examSubjects,
        examModules,
        examChapters,
        mcqQuestions,
        addMCQQuestion,
        updateMCQQuestion,
        deleteMCQQuestion,
        examBlueprints,
        createExamBlueprint,
        generatedExams,
        createGeneratedExam,
        examResults,
        submitExamResult
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }
  return context;
};
