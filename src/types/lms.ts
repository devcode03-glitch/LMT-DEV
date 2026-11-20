/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'instructor' | 'student' | 'guardian';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: 'active' | 'banned';
  assignedBatches: string[]; // Batch IDs
  studentGroup?: string; // e.g. "Honors Track", "Core Studio", "Lab Alpha"
  guardianEmail?: string;
  lastActive: string;
}

export interface LectureMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'slides' | 'link';
  url: string;
  pageCount?: number;
}

export interface Lecture {
  id: string;
  topicId: string;
  chapterId: string;
  batchId: string;
  title: string;
  order: number;
  durationMinutes: number;
  date: string;
  hasBoard: boolean;
  slidesTitle: string;
  slidesPages: BoardSlideContent[];
  materials: LectureMaterial[];
  videoUrl?: string;
}

export interface Topic {
  id: string;
  chapterId: string;
  batchId: string;
  title: string;
  order: number;
  lectures: Lecture[];
}

export interface Chapter {
  id: string;
  batchId: string;
  title: string;
  order: number;
  description: string;
  topics: Topic[];
}

export interface Batch {
  id: string;
  name: string;
  code: string;
  term: string;
  description: string;
  color: string;
  instructorIds: string[];
  studentIds: string[];
  chapters: Chapter[];
}

// Collaborative Board Types
export type ToolType = 
  | 'select'
  | 'pen' 
  | 'highlighter' 
  | 'eraser' 
  | 'rect' 
  | 'circle' 
  | 'arrow' 
  | 'line' 
  | 'text' 
  | 'sticky' 
  | 'laser';

export interface VectorPoint {
  x: number;
  y: number;
}

export interface VectorStroke {
  id: string;
  pageIndex: number;
  tool: ToolType;
  points: VectorPoint[];
  color: string;
  width: number;
  opacity: number;
  text?: string;
  authorId: string;
  authorName: string;
  timestamp: number;
  isFilled?: boolean;
}

export interface BoardSlideContent {
  pageNumber: number;
  title: string;
  subtitle?: string;
  keyConcepts: string[];
  diagramType?: 'architecture' | 'flow' | 'matrix' | 'code';
  codeSnippet?: string;
  notes?: string;
}

export interface CollaboratorCursor {
  id: string;
  name: string;
  role: Role;
  color: string;
  x: number;
  y: number;
  page: number;
  lastActive: number;
}

export interface OTDelta {
  id: string;
  type: 'ADD_STROKE' | 'REMOVE_STROKE' | 'CLEAR_PAGE' | 'VIEWPORT_SYNC';
  payload: any;
  rev: number;
  timestamp: number;
  authorId: string;
}

// Coursework & Differentiated Learning
export type AssignmentTargetType = 'all' | 'groups' | 'individuals';

export interface VideoCheckpoint {
  id: string;
  timestamp: number; // in seconds
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  hints: string[];
  explanation: string;
}

export interface Assignment {
  id: string;
  batchId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  targetType: AssignmentTargetType;
  targetGroups?: string[];
  targetStudentIds?: string[];
  type: 'standard' | 'interactive_video' | 'practice_set';
  rubricId?: string;
  isDraft?: boolean;
  scheduledDate?: string;
  videoConfig?: {
    videoUrl: string;
    duration: number; // total seconds
    checkpoints: VideoCheckpoint[];
  };
  practiceConfig?: {
    questions: PracticeQuestion[];
  };
}

// Rubrics & Grading
export interface RubricLevel {
  score: number;
  label: string;
  descriptor: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  totalPoints: number;
  criteria: RubricCriterion[];
}

export interface OriginalityMatch {
  text: string;
  matchSource: string;
  similarity: number;
}

export interface OriginalityReport {
  similarityPercentage: number;
  status: 'clean' | 'moderate' | 'flagged';
  flaggedExcerpts: OriginalityMatch[];
  citationsFound: number;
  citationsExpected: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'missing' | 'excused' | 'late';
  contentText: string;
  attachedFile?: string;
  grade?: number;
  rubricScores?: Record<string, number>;
  feedbackComment: string;
  originalityReport?: OriginalityReport;
}

export interface CommentBankItem {
  id: string;
  category: 'Clarity' | 'Rigor' | 'Methodology' | 'Formatting';
  shortcut: string;
  text: string;
}

// Transcript and Media Recording
export interface TranscriptWord {
  start: number;
  end: number;
  text: string;
  deleted?: boolean;
}

export interface MediaRecording {
  id: string;
  title: string;
  duration: number;
  date: string;
  transcript: TranscriptWord[];
}

export interface GuardianSummaryConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  sendDay: string;
  sendHour: string;
  includeMissingAssignments: boolean;
  includeUpcomingDeadlines: boolean;
  includeClassAnnouncements: boolean;
  lastDispatchedDate: string;
}

// ==========================================
// MCQ Examination Module Architecture (SRS Section 2, 3, 4)
// ==========================================

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface ExamSubject {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface ExamModule {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface ExamChapter {
  id: string;
  moduleId: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface MCQQuestion {
  id: string;
  subjectId: string;
  moduleId: string;
  chapterId: string;
  questionText: string;
  options: MCQOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  difficulty: DifficultyLevel;
  marks: number;
  negativeMarks: number;
  explanation: string;
  tags?: string[];
  language?: 'en' | 'gu';
  importBatchName?: string;
}

export interface BlueprintRule {
  id: string;
  subjectId: string;
  moduleId: string;
  chapterId: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  marksPerQuestion: number;
}

export interface ExamBlueprint {
  id: string;
  title: string;
  code: string;
  subjectId: string;
  durationMinutes: number;
  passingPercentage: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarkingEnabled: boolean;
  rules: BlueprintRule[];
}

export interface GeneratedExam {
  id: string;
  blueprintId?: string;
  title: string;
  description?: string;
  subjectId: string;
  durationMinutes: number;
  passingPercentage: number;
  totalMarks: number;
  negativeMarkingEnabled?: boolean;
  language?: 'en' | 'gu';
  sourceBatchName?: string;
  questions: MCQQuestion[];
  createdAt: string;
}

export interface StudentAnswerState {
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isFlagged: boolean;
  savedAt: number;
}

export interface ChapterPerformanceMetric {
  chapterId: string;
  chapterName: string;
  moduleName: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  masteryLevel: 'High' | 'Needs Review' | 'Weak';
}

export interface ExamQuestionReviewDetail {
  questionId: string;
  questionText: string;
  chapterName: string;
  difficulty: DifficultyLevel;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  marksAwarded: number;
  explanation: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  submittedAt: string;
  chapterBreakdown: ChapterPerformanceMetric[];
  questionDetails: ExamQuestionReviewDetail[];
}

