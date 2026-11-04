/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Batch, Assignment, Rubric, Submission, CommentBankItem, GuardianSummaryConfig } from '../types/lms';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Dr. Arthur Vance',
    email: 'a.vance@vectorlms.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'active',
    assignedBatches: ['batch-cs401', 'batch-neur202'],
    lastActive: 'Just now'
  },
  {
    id: 'user-inst-1',
    name: 'Prof. Sarah Sterling',
    email: 's.sterling@vectorlms.edu',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'active',
    assignedBatches: ['batch-cs401'],
    lastActive: '3 mins ago'
  },
  {
    id: 'user-inst-2',
    name: 'Dr. Marcus Thorne',
    email: 'm.thorne@vectorlms.edu',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'active',
    assignedBatches: ['batch-neur202'],
    lastActive: '12 mins ago'
  },
  {
    id: 'user-stud-1',
    name: 'Elena Rostova',
    email: 'e.rostova@student.vectorlms.edu',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'active',
    assignedBatches: ['batch-cs401', 'batch-neur202'],
    studentGroup: 'Honors Track',
    guardianEmail: 'd.rostova@gmail.com',
    lastActive: 'Just now'
  },
  {
    id: 'user-stud-2',
    name: 'Kenji Sato',
    email: 'k.sato@student.vectorlms.edu',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'active',
    assignedBatches: ['batch-cs401'],
    studentGroup: 'Core Studio',
    guardianEmail: 'm.sato@yahoo.com',
    lastActive: '18 mins ago'
  },
  {
    id: 'user-stud-3',
    name: 'Amara Patel',
    email: 'a.patel@student.vectorlms.edu',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'active',
    assignedBatches: ['batch-neur202'],
    studentGroup: 'Lab Alpha',
    guardianEmail: 'r.patel@gmail.com',
    lastActive: '1 hour ago'
  },
  {
    id: 'user-guard-1',
    name: 'David Rostova (Guardian)',
    email: 'd.rostova@gmail.com',
    role: 'guardian',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'active',
    assignedBatches: ['batch-cs401', 'batch-neur202'],
    lastActive: '4 hours ago'
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch-cs401',
    name: 'Distributed Systems & Vector Consensus',
    code: 'CS-401',
    term: 'Fall 2026',
    description: 'Advanced distributed consensus, Paxos/Raft protocol formalization, Byzantine fault tolerance, and vector clock ordering.',
    color: 'emerald',
    instructorIds: ['user-inst-1'],
    studentIds: ['user-stud-1', 'user-stud-2'],
    chapters: [
      {
        id: 'ch-1',
        batchId: 'batch-cs401',
        title: 'Foundations of Asynchronous Agreement',
        order: 1,
        description: 'Impossibility theorems, synchronous vs asynchronous networks, and failure detectors.',
        topics: [
          {
            id: 'top-1-1',
            chapterId: 'ch-1',
            batchId: 'batch-cs401',
            title: 'FLP Impossibility & System Models',
            order: 1,
            lectures: [
              {
                id: 'lec-1-1-1',
                topicId: 'top-1-1',
                chapterId: 'ch-1',
                batchId: 'batch-cs401',
                title: 'Lec 01: The Asynchronous Consensus Barrier',
                order: 1,
                durationMinutes: 50,
                date: '2026-10-14',
                hasBoard: true,
                slidesTitle: 'Lecture 01 — FLP Impossibility Proof & State Diagrams',
                slidesPages: [
                  {
                    pageNumber: 1,
                    title: 'Distributed System Topology & Timing Assumptions',
                    subtitle: 'Nodes {P1, P2, P3} over unreliable FIFO network channels',
                    keyConcepts: [
                      'Asynchronous Network: Message delivery delay is unbounded but finite',
                      'Crash-stop failure model: Failed processes halt cleanly and never recover in the current epoch',
                      'Bivalent configurations: Initial global state where both decision values 0 and 1 remain reachable'
                    ],
                    diagramType: 'architecture',
                    codeSnippet: `// Node State Machine Interface
type NodeState = 'Bivalent' | 'Univalent_0' | 'Univalent_1';
interface Message { epoch: number; view: number; payload: Buffer; }`,
                    notes: 'Core theorem: In an asynchronous network, no deterministic consensus protocol can guarantee liveness with even 1 unannounced crash.'
                  },
                  {
                    pageNumber: 2,
                    title: 'Vector Clocks & Causality Invariants',
                    subtitle: 'Lamport timestamps vs Vector Clock partial ordering',
                    keyConcepts: [
                      'Rule 1: Increment local component V_i[i] = V_i[i] + 1 before sending',
                      'Rule 2: On receive(m, V_msg), update V_i[k] = max(V_i[k], V_msg[k]) for all k',
                      'Concurrent Events: neither V(a) <= V(b) nor V(b) <= V(a)'
                    ],
                    diagramType: 'flow',
                    codeSnippet: `function updateVector(localV: number[], msgV: number[]): number[] {
  return localV.map((val, idx) => Math.max(val, msgV[idx] ?? 0));
}`,
                    notes: 'Vector clocks guarantee: e1 -> e2 <=> V(e1) < V(e2).'
                  },
                  {
                    pageNumber: 3,
                    title: 'Quorum Slices & Majority Overlaps',
                    subtitle: 'Ensuring intersection invariant: Q1 ∩ Q2 ≠ ∅',
                    keyConcepts: [
                      'In a system of N nodes, simple majority quorum size is ⌊N/2⌋ + 1',
                      'Any two majority quorums must share at least one non-faulty node in fail-stop',
                      'Byzantine quorum requirement: Q = 2f + 1 where N >= 3f + 1'
                    ],
                    diagramType: 'matrix',
                    notes: 'Examine node failure scenarios during partition recovery phases.'
                  }
                ],
                materials: [
                  { id: 'mat-1', title: 'FLP Impossibility Original Paper (Fischer, Lynch, Paterson)', type: 'pdf', url: '#', pageCount: 14 },
                  { id: 'mat-2', title: 'Vector Clock Invariants Cheat Sheet', type: 'doc', url: '#' }
                ]
              },
              {
                id: 'lec-1-1-2',
                topicId: 'top-1-1',
                chapterId: 'ch-1',
                batchId: 'batch-cs401',
                title: 'Lec 02: Failure Detectors & Synchronizers',
                order: 2,
                durationMinutes: 45,
                date: '2026-10-18',
                hasBoard: true,
                slidesTitle: 'Lecture 02 — Chandra-Toueg Eventually Perfect Failure Detectors',
                slidesPages: [
                  {
                    pageNumber: 1,
                    title: 'Chandra-Toueg Diamond-W (◇W) Detector',
                    subtitle: 'Weak Completeness and Eventual Weak Accuracy',
                    keyConcepts: [
                      'Completeness: Every faulty process is eventually suspected by every correct process',
                      'Accuracy: Eventually there is a correct process that is never suspected by any correct process',
                      'Lowest boundary required to solve consensus in partially synchronous environments'
                    ],
                    diagramType: 'architecture',
                    notes: 'Partial synchrony allows consensus to make progress while preserving safety invariants.'
                  }
                ],
                materials: [
                  { id: 'mat-3', title: 'Failure Detector Taxonomies', type: 'pdf', url: '#' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'ch-2',
        batchId: 'batch-cs401',
        title: 'Replicated State Machines & Raft Protocol',
        order: 2,
        description: 'Log replication, election safety, term synchronization, and linearizable reads.',
        topics: [
          {
            id: 'top-2-1',
            chapterId: 'ch-2',
            batchId: 'batch-cs401',
            title: 'Leader Election & Term Stepping',
            order: 1,
            lectures: [
              {
                id: 'lec-2-1-1',
                topicId: 'top-2-1',
                chapterId: 'ch-2',
                batchId: 'batch-cs401',
                title: 'Lec 03: Raft Consensus Invariants',
                order: 1,
                durationMinutes: 60,
                date: '2026-10-22',
                hasBoard: true,
                slidesTitle: 'Lecture 03 — Raft Consensus State Transitions',
                slidesPages: [
                  {
                    pageNumber: 1,
                    title: 'Raft Three States: Follower, Candidate, Leader',
                    subtitle: 'Randomized election timers and Heartbeat intervals',
                    keyConcepts: [
                      'Election timeout: 150ms - 300ms randomized interval to avoid split votes',
                      'RequestVote RPC: candidate must possess at least as up-to-date log entries',
                      'AppendEntries RPC: acts as heartbeat and replicates log entries sequentially'
                    ],
                    diagramType: 'flow',
                    notes: 'Log Matching Property: If two logs contain an entry with same index and term, then logs are identical in all entries up to the given index.'
                  }
                ],
                materials: [
                  { id: 'mat-4', title: 'In Search of an Understandable Consensus Algorithm', type: 'pdf', url: '#' }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'batch-neur202',
    name: 'Cognitive Neurobiology & Synaptic Dynamics',
    code: 'NEUR-202',
    term: 'Fall 2026',
    description: 'Hodgkin-Huxley ionic channel kinetics, dendritic integration, long-term potentiation (LTP), and neural network dynamics.',
    color: 'indigo',
    instructorIds: ['user-inst-2'],
    studentIds: ['user-stud-1', 'user-stud-3'],
    chapters: [
      {
        id: 'ch-neur-1',
        batchId: 'batch-neur202',
        title: 'Membrane Potentials & Cable Theory',
        order: 1,
        description: 'Nernst equation, Goldman-Hodgkin-Katz voltage equation, and passive dendritic attenuation.',
        topics: [
          {
            id: 'top-neur-1',
            chapterId: 'ch-neur-1',
            batchId: 'batch-neur202',
            title: 'Action Potential Dynamics',
            order: 1,
            lectures: [
              {
                id: 'lec-neur-1',
                topicId: 'top-neur-1',
                chapterId: 'ch-neur-1',
                batchId: 'batch-neur202',
                title: 'Lec 01: Voltage-Gated Sodium & Potassium Conductances',
                order: 1,
                durationMinutes: 50,
                date: '2026-10-15',
                hasBoard: true,
                slidesTitle: 'Lecture 01 — Patch-Clamp Recordings & Gating Variables',
                slidesPages: [
                  {
                    pageNumber: 1,
                    title: 'Hodgkin-Huxley Gating Variables: m, h, n',
                    subtitle: 'Activation and Inactivation curves across depolarization voltages',
                    keyConcepts: [
                      'Na+ current: I_Na = g_Na_max * m^3 * h * (V - E_Na)',
                      'K+ current: I_K = g_K_max * n^4 * (V - E_K)',
                      'Leakage current: I_L = g_L * (V - E_L)'
                    ],
                    diagramType: 'flow',
                    notes: 'Notice how the m^3 factor creates the rapid upstroke delay before sodium channels inactivate via gate h.'
                  }
                ],
                materials: [
                  { id: 'mat-neur-1', title: 'Quantitative Description of Membrane Current', type: 'pdf', url: '#' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_RUBRICS: Rubric[] = [
  {
    id: 'rubric-consensus',
    title: 'Distributed Consensus & Formal Verification Rubric',
    totalPoints: 100,
    criteria: [
      {
        id: 'crit-rigor',
        name: 'Theoretical Rigor & Mathematical Soundness',
        weight: 40,
        levels: [
          { score: 40, label: 'Exemplary', descriptor: 'Flawless formal induction proof, all invariants explicitly validated, zero gaps in bivalence logic.' },
          { score: 32, label: 'Proficient', descriptor: 'Sound core logic; minor omissions in corner-case message delay bounds.' },
          { score: 24, label: 'Developing', descriptor: 'Correct intuition but informal notation; missing termination guarantees.' },
          { score: 10, label: 'Inadequate', descriptor: 'Fundamental misinterpretation of asynchronous vs synchronous guarantees.' }
        ]
      },
      {
        id: 'crit-arch',
        name: 'Protocol Architecture & Failure Tolerance',
        weight: 35,
        levels: [
          { score: 35, label: 'Exemplary', descriptor: 'Comprehensive Byzantine and network partition analysis with clear quorum slice proofs.' },
          { score: 28, label: 'Proficient', descriptor: 'Handles crash-stop cleanly; partition recovery could detail term step-downs more thoroughly.' },
          { score: 20, label: 'Developing', descriptor: 'Basic fail-stop handling only; ignores split-brain scenarios.' },
          { score: 8, label: 'Inadequate', descriptor: 'No failure mitigation or state persistence model defined.' }
        ]
      },
      {
        id: 'crit-clarity',
        name: 'Diagrammatic Precision & State Machines',
        weight: 25,
        levels: [
          { score: 25, label: 'Exemplary', descriptor: 'Clean vector state diagrams with labeled RPC transitions and monotonic epoch counters.' },
          { score: 20, label: 'Proficient', descriptor: 'Legible diagrams; minor ambiguity in transition trigger conditions.' },
          { score: 14, label: 'Developing', descriptor: 'Missing transition guards or unclear node roles.' },
          { score: 5, label: 'Inadequate', descriptor: 'Unstructured diagrams without sequence ordering.' }
        ]
      }
    ]
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    batchId: 'batch-cs401',
    title: 'Consensus Fault Analysis: Byzantine Generals vs Raft Split-Vote',
    description: 'Provide an analytical comparison of partition recovery in Raft compared to PBFT under 33% network drop rate. Include vector state transitions.',
    dueDate: '2026-11-15T23:59:00',
    points: 100,
    targetType: 'all',
    type: 'standard',
    rubricId: 'rubric-consensus'
  },
  {
    id: 'asg-2',
    batchId: 'batch-cs401',
    title: 'Interactive Video Lab: Raft Leader Election & Heartbeat Timing',
    description: 'Watch the simulated cluster election trace and answer time-synced checkpoint questions when cluster partitions occur.',
    dueDate: '2026-11-20T23:59:00',
    points: 50,
    targetType: 'groups',
    targetGroups: ['Honors Track', 'Core Studio'],
    type: 'interactive_video',
    videoConfig: {
      videoUrl: 'https://www.youtube.com/watch?v=vYp4LYbnnW8', // Raft consensus visualization
      duration: 180,
      checkpoints: [
        {
          id: 'cp-1',
          timestamp: 25,
          question: 'What triggers a Follower node to initiate a new Election and increment its term counter?',
          options: [
            'A direct client request for an uncommitted write',
            'Expiration of its randomized election timeout without receiving AppendEntries heartbeat',
            'Receiving a RequestVote RPC from another candidate with a lower term',
            'Periodic timer ticking every 10 milliseconds regardless of leader activity'
          ],
          correctIndex: 1,
          hint: 'Remember that Followers maintain an election timer that resets whenever a valid leader heartbeat arrives.'
        },
        {
          id: 'cp-2',
          timestamp: 75,
          question: 'If Candidate A and Candidate B both start elections at term 4 and receive 2 votes each in a 5-node cluster, what happens next?',
          options: [
            'The node with the lowest IP address is declared the winner by default',
            'Both candidates retry immediately simultaneously causing permanent deadlock',
            'A split vote occurs; timers expire independently with randomized delays to elect a leader in the next term',
            'The client aborts all previous uncommitted state machine commands'
          ],
          correctIndex: 2,
          hint: 'Randomized election timeouts (150-300ms) prevent synchronized split-vote cascades.'
        },
        {
          id: 'cp-3',
          timestamp: 130,
          question: 'Under what condition will a leader step down to follower status immediately?',
          options: [
            'If its CPU load exceeds 85%',
            'If it receives any RPC with a term strictly greater than its current term',
            'Whenever a log entry takes longer than 50ms to replicate to one replica',
            'When all connected clients disconnect'
          ],
          correctIndex: 1,
          hint: 'Terms act as logical clocks in Raft; discovering a higher term means a newer authority exists.'
        }
      ]
    }
  },
  {
    id: 'asg-3',
    batchId: 'batch-cs401',
    title: 'Adaptive Practice Set: Vector Clocks & Causal History',
    description: 'Self-paced practice set testing your ability to compute vector timestamps, detect concurrent conflicts, and resolve causal histories.',
    dueDate: '2026-11-25T23:59:00',
    points: 30,
    targetType: 'individuals',
    targetStudentIds: ['user-stud-1'],
    type: 'practice_set',
    practiceConfig: {
      questions: [
        {
          id: 'pq-1',
          prompt: 'Given processes P1, P2 with initial clocks [0,0]. P1 sends message m1 to P2. P1 local timestamp before send is [1,0]. What is P2 clock after receiving m1?',
          options: ['[1, 1]', '[0, 1]', '[1, 0]', '[2, 1]'],
          correctIndex: 0,
          hints: [
            'P2 takes the component-wise maximum with its own vector clock.',
            'P2 also increments its own local coordinate (index 1).'
          ],
          explanation: 'P2 local clock before receipt was [0,0]. Max([0,0], [1,0]) = [1,0]. Then incrementing P2 component yields [1, 1].'
        },
        {
          id: 'pq-2',
          prompt: 'Which condition proves two events eA with vector V(eA) = [2, 1, 3] and eB with V(eB) = [1, 3, 2] are concurrent (eA || eB)?',
          options: [
            'V(eA)[0] > V(eB)[0] but V(eA)[1] < V(eB)[1]',
            'Their sum of timestamps equals 6',
            'Neither event has been acknowledged by a majority quorum',
            'They occurred within the same physical NTP wall-clock millisecond'
          ],
          correctIndex: 0,
          hints: [
            'For eA -> eB, EVERY coordinate in V(eA) must be <= V(eB) and at least one strictly smaller.',
            'Check coordinate index 0 vs index 1.'
          ],
          explanation: 'Because V(eA)[0]=2 > 1 while V(eA)[1]=1 < 3, neither vector dominates the other, satisfying definition of concurrency (eA || eB).'
        }
      ]
    }
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    assignmentId: 'asg-1',
    studentId: 'user-stud-1',
    studentName: 'Elena Rostova',
    submittedAt: '2026-11-01T14:22:10',
    status: 'graded',
    contentText: `Executive Summary:
In our asynchronous distributed model with N=5 nodes, the safety theorem of Raft depends on the Log Matching Invariant and Election Safety. When a network partition isolates nodes {P1, P2} from {P3, P4, P5}, the partition containing the majority {P3, P4, P5} can continue committing log entries because 3 >= ⌊5/2⌋ + 1. 

Conversely, {P1, P2} cannot establish a quorum, so any candidate in that component will fail to gather majority votes. Upon partition heal, the leader in the majority partition presents a higher term (Epoch k+2), forcing the minority leader P1 to step down and overwrite its uncommitted logs up to the common ancestor entry.

PBFT Invariants:
In PBFT, tolerance requires 3f + 1 nodes. For f=1 fault, 4 nodes are required. The Pre-Prepare, Prepare, and Commit phases guarantee that 2f + 1 non-faulty nodes agree on sequence numbers before state machine execution.`,
    attachedFile: 'Raft_vs_PBFT_Elena_Rostova_Final.pdf',
    grade: 96,
    rubricScores: {
      'crit-rigor': 38,
      'crit-arch': 34,
      'crit-clarity': 24
    },
    feedbackComment: 'Superb breakdown of partition heal dynamics and quorum intersection. Your discussion of uncommitted log truncation shows comprehensive mastery of Section 5.4 in the Raft specification.',
    originalityReport: {
      similarityPercentage: 4.2,
      status: 'clean',
      citationsFound: 6,
      citationsExpected: 4,
      flaggedExcerpts: [
        {
          text: 'In our asynchronous distributed model with N=5 nodes',
          matchSource: 'MIT 6.824 Distributed Systems Syllabus',
          similarity: 88
        }
      ]
    }
  },
  {
    id: 'sub-2',
    assignmentId: 'asg-1',
    studentId: 'user-stud-2',
    studentName: 'Kenji Sato',
    submittedAt: '2026-11-01T19:40:00',
    status: 'submitted',
    contentText: `Consensus Fault Analysis:
Raft split-vote occurs when multiple candidate nodes timeout and broadcast RequestVote simultaneously. If five nodes are split 2-2-1, no one gets a majority of 3. Raft uses random timers between 150ms and 300ms to resolve this.

In PBFT, byzantine faults are handled by view changes. If the primary fails or lies, backup nodes send VIEW-CHANGE messages. When the new primary collects 2f+1 view change messages, it broadcasts NEW-VIEW.`,
    attachedFile: 'Sato_Consensus_Draft.pdf',
    feedbackComment: '',
    originalityReport: {
      similarityPercentage: 11.5,
      status: 'moderate',
      citationsFound: 2,
      citationsExpected: 4,
      flaggedExcerpts: [
        {
          text: 'If the primary fails or lies, backup nodes send VIEW-CHANGE messages',
          matchSource: 'Castro & Liskov 1999 ACM OSDI paper',
          similarity: 94
        }
      ]
    }
  }
];

export const INITIAL_COMMENT_BANK: CommentBankItem[] = [
  { id: 'cb-1', category: 'Rigor', shortcut: '#proof', text: 'Excellent formal induction proof; edge cases regarding message delays are comprehensively bounded.' },
  { id: 'cb-2', category: 'Rigor', shortcut: '#invariant', text: 'Carefully verify your invariant assertion here: does this state hold if an unannounced crash occurs immediately before acknowledgement?' },
  { id: 'cb-3', category: 'Clarity', shortcut: '#diagram', text: 'The state machine transition diagram is exceptionally crisp with clearly labeled guards and triggers.' },
  { id: 'cb-4', category: 'Methodology', shortcut: '#citation', text: 'Strong use of peer-reviewed primary sources; ensure all inline citations conform to IEEE/ACM formatting.' },
  { id: 'cb-5', category: 'Formatting', shortcut: '#notation', text: 'Consider adopting standard partial-order notation (e.g. e1 ≺ e2) rather than descriptive prose for causal relationships.' }
];

export const INITIAL_GUARDIAN_CONFIG: GuardianSummaryConfig = {
  enabled: true,
  frequency: 'weekly',
  sendDay: 'Friday',
  sendHour: '17:00 UTC',
  includeMissingAssignments: true,
  includeUpcomingDeadlines: true,
  includeClassAnnouncements: true,
  lastDispatchedDate: '2026-10-31 17:00'
};
