/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ExamSubject, 
  ExamModule, 
  ExamChapter, 
  MCQQuestion, 
  ExamBlueprint, 
  GeneratedExam,
  ExamResult
} from '../types/lms';

export const EXAM_SUBJECTS: ExamSubject[] = [
  {
    id: 'sub-guj101',
    code: 'GUJ-101',
    name: 'ગુજરાતી વિજ્ઞાન, ગણિત અને સામાન્ય જ્ઞાન (Gujarati Exam)',
    description: 'ગુજરાતી માધ્યમની સ્પર્ધાત્મક અને શૈક્ષણિક MCQ પરીક્ષાઓ માટે વિષય, મોડ્યુલ અને પ્રકરણ આધારિત પ્રશ્નબેંક.'
  },
  {
    id: 'sub-cs401',
    code: 'CS-401',
    name: 'Distributed Systems & Vector Consensus',
    description: 'Asynchronous consensus, FLP impossibility, vector clocks, Paxos, Raft, and Byzantine Fault Tolerance.'
  },
  {
    id: 'sub-neur202',
    code: 'NEUR-202',
    name: 'Cognitive Neurobiology & Synaptic Dynamics',
    description: 'Ionic conductances, Hodgkin-Huxley gating equations, cable theory, and Long-Term Potentiation (LTP).'
  }
];

export const EXAM_MODULES: ExamModule[] = [
  { id: 'mod-guj-1', subjectId: 'sub-guj101', name: 'મોડ્યુલ ૧: ગુજરાતનો ઇતિહાસ અને ભૂગોળ', order: 1 },
  { id: 'mod-guj-2', subjectId: 'sub-guj101', name: 'મોડ્યુલ ૨: સામાન્ય વિજ્ઞાન અને કમ્પ્યુટર', order: 2 },
  { id: 'mod-1', subjectId: 'sub-cs401', name: 'Module 1: Foundations of Asynchronous Consensus', order: 1 },
  { id: 'mod-2', subjectId: 'sub-cs401', name: 'Module 2: Replicated State Machines & Protocol Invariants', order: 2 },
  { id: 'mod-3', subjectId: 'sub-neur202', name: 'Module 1: Biophysical Membrane Kinetics', order: 1 }
];

export const EXAM_CHAPTERS: ExamChapter[] = [
  { id: 'chp-guj-1', moduleId: 'mod-guj-1', subjectId: 'sub-guj101', name: 'પ્રકરણ ૧: ગુજરાતની ભૂગોળ અને નદીઓ', order: 1 },
  { id: 'chp-guj-2', moduleId: 'mod-guj-1', subjectId: 'sub-guj101', name: 'પ્રકરણ ૨: ભારતનું બંધારણ અને ઇતિહાસ', order: 2 },
  { id: 'chp-guj-3', moduleId: 'mod-guj-2', subjectId: 'sub-guj101', name: 'પ્રકરણ ૩: ભૌતિક અને જીવવિજ્ઞાન', order: 1 },
  { id: 'chp-guj-4', moduleId: 'mod-guj-2', subjectId: 'sub-guj101', name: 'પ્રકરણ ૪: કમ્પ્યુટર અને ટેકનોલોજી', order: 2 },
  { id: 'chp-101', moduleId: 'mod-1', subjectId: 'sub-cs401', name: 'Chapter 1: FLP Impossibility & Timing Models', order: 1 },
  { id: 'chp-102', moduleId: 'mod-1', subjectId: 'sub-cs401', name: 'Chapter 2: Vector Clocks & Causal Ordering', order: 2 },
  { id: 'chp-201', moduleId: 'mod-2', subjectId: 'sub-cs401', name: 'Chapter 3: Raft Leader Election & Quorums', order: 1 },
  { id: 'chp-202', moduleId: 'mod-2', subjectId: 'sub-cs401', name: 'Chapter 4: Byzantine Fault Tolerance & Quorum Slices', order: 2 },
  { id: 'chp-301', moduleId: 'mod-3', subjectId: 'sub-neur202', name: 'Chapter 1: Hodgkin-Huxley Conductance Channels', order: 1 },
  { id: 'chp-302', moduleId: 'mod-3', subjectId: 'sub-neur202', name: 'Chapter 2: Synaptic Potentiation & Dendritic Attenuation', order: 2 }
];

export const INITIAL_MCQ_QUESTIONS: MCQQuestion[] = [
  // Chapter 1: FLP Impossibility (CS-401)
  {
    id: 'q-101-1',
    subjectId: 'sub-cs401',
    moduleId: 'mod-1',
    chapterId: 'chp-101',
    questionText: 'What is the fundamental conclusion established by the Fischer-Lynch-Paterson (FLP) theorem?',
    options: [
      { key: 'A', text: 'Consensus is impossible in synchronous networks when more than 50% of nodes fail' },
      { key: 'B', text: 'No deterministic consensus protocol can guarantee both safety and liveness in an asynchronous network with even a single unannounced crash failure' },
      { key: 'C', text: 'Vector clocks cannot achieve causal ordering without NTP synchronized hardware clocks' },
      { key: 'D', text: 'Byzantine faults can be tolerated only if the total node count is an even number' }
    ],
    correctOption: 'B',
    difficulty: 'EASY',
    marks: 2,
    negativeMarks: 0.5,
    explanation: 'The FLP impossibility theorem proves that in an asynchronous network where message delays are finite but unbounded, no deterministic consensus algorithm can guarantee termination in all executions if even one process may experience an unannounced crash.'
  },
  {
    id: 'q-101-2',
    subjectId: 'sub-cs401',
    moduleId: 'mod-1',
    chapterId: 'chp-101',
    questionText: 'In FLP proof terminology, what distinguishes a "bivalent" global configuration from an "univalent" configuration?',
    options: [
      { key: 'A', text: 'A bivalent state has two active leaders, while univalent has exactly one leader' },
      { key: 'B', text: 'In a bivalent state, both decision outcomes (0 and 1) remain reachable through subsequent step transitions' },
      { key: 'C', text: 'A bivalent state contains an odd number of crashed processes' },
      { key: 'D', text: 'A bivalent state has committed data to both write-ahead log replicas simultaneously' }
    ],
    correctOption: 'B',
    difficulty: 'MEDIUM',
    marks: 3,
    negativeMarks: 0.75,
    explanation: 'A configuration C is bivalent if starting from C there exist execution sequences reaching decision 0 and sequences reaching decision 1. Once a configuration becomes 0-valent or 1-valent, the decision outcome is irreversible.'
  },
  {
    id: 'q-101-3',
    subjectId: 'sub-cs401',
    moduleId: 'mod-1',
    chapterId: 'chp-101',
    questionText: 'Which class of Chandra-Toueg failure detectors represents the weakest detector capable of solving asynchronous consensus with a majority of correct processes?',
    options: [
      { key: 'A', text: 'Perfect Failure Detector (P)' },
      { key: 'B', text: 'Strong Failure Detector (S)' },
      { key: 'C', text: 'Eventually Weak Failure Detector (◇W)' },
      { key: 'D', text: 'Strict Synchronizer Omega (Ω)' }
    ],
    correctOption: 'C',
    difficulty: 'HARD',
    marks: 4,
    negativeMarks: 1.0,
    explanation: 'Chandra and Toueg proved that ◇W (which guarantees eventual weak completeness and eventual weak accuracy) is the weakest failure detector class capable of solving consensus in systems with a correct majority.'
  },

  // Chapter 2: Vector Clocks & Causal Ordering (CS-401)
  {
    id: 'q-102-1',
    subjectId: 'sub-cs401',
    moduleId: 'mod-1',
    chapterId: 'chp-102',
    questionText: 'When process P_i receives a message with vector timestamp V_msg, how does P_i update its own vector clock V_i?',
    options: [
      { key: 'A', text: 'V_i is overwritten entirely by V_msg' },
      { key: 'B', text: 'V_i[k] = max(V_i[k], V_msg[k]) for all k, followed by incrementing V_i[i]' },
      { key: 'C', text: 'V_i[k] = min(V_i[k], V_msg[k]) to preserve monotonic backoff' },
      { key: 'D', text: 'V_i is summed arithmetically with V_msg modulo node count' }
    ],
    correctOption: 'B',
    difficulty: 'EASY',
    marks: 2,
    negativeMarks: 0.5,
    explanation: 'The recipient process merges its causal horizon by taking the component-wise maximum across all process coordinates, then increments its own coordinate to mark the local receive event.'
  },
  {
    id: 'q-102-2',
    subjectId: 'sub-cs401',
    moduleId: 'mod-1',
    chapterId: 'chp-102',
    questionText: 'Given events e1 with V(e1) = [3, 1, 4] and e2 with V(e2) = [2, 3, 4], what is the causal relationship between e1 and e2?',
    options: [
      { key: 'A', text: 'e1 causally preceded e2 (e1 -> e2)' },
      { key: 'B', text: 'e2 causally preceded e1 (e2 -> e1)' },
      { key: 'C', text: 'e1 and e2 are concurrent (e1 || e2)' },
      { key: 'D', text: 'e1 and e2 are linearizable in term 4' }
    ],
    correctOption: 'C',
    difficulty: 'MEDIUM',
    marks: 3,
    negativeMarks: 0.75,
    explanation: 'Because V(e1)[0]=3 > V(e2)[0]=2 but V(e1)[1]=1 < V(e2)[1]=3, neither vector dominates the other component-wise. Therefore, e1 and e2 are causally concurrent.'
  },
  {
    id: 'q-102-3',
    subjectId: 'sub-cs401',
    moduleId: 'mod-1',
    chapterId: 'chp-102',
    questionText: 'Why can scalar Lamport timestamps NOT detect concurrency, whereas vector clocks can?',
    options: [
      { key: 'A', text: 'Lamport timestamps do not support 64-bit integer arithmetic' },
      { key: 'B', text: 'Lamport clocks only satisfy L(e1) < L(e2) if e1 -> e2, but the reverse implication does NOT hold' },
      { key: 'C', text: 'Lamport clocks require physical atomic clocks at every cluster node' },
      { key: 'D', text: 'Lamport timestamps are reset to zero at every leader election epoch' }
    ],
    correctOption: 'B',
    difficulty: 'HARD',
    marks: 4,
    negativeMarks: 1.0,
    explanation: 'Scalar Lamport clocks establish a total order consistent with causality (e1 -> e2 => L(e1) < L(e2)), but L(e1) < L(e2) does NOT imply e1 -> e2. Vector clocks achieve an exact equivalence: e1 -> e2 <=> V(e1) < V(e2).'
  },

  // Chapter 3: Raft Leader Election & Quorums (CS-401)
  {
    id: 'q-201-1',
    subjectId: 'sub-cs401',
    moduleId: 'mod-2',
    chapterId: 'chp-201',
    questionText: 'What is the primary purpose of using randomized election timeouts (e.g. 150ms - 300ms) in the Raft consensus protocol?',
    options: [
      { key: 'A', text: 'To ensure messages do not exceed TCP MTU packet limits' },
      { key: 'B', text: 'To prevent split-vote scenarios where multiple followers become candidates simultaneously' },
      { key: 'C', text: 'To encrypt vote messages using asymmetric public keys' },
      { key: 'D', text: 'To compress log entries prior to state machine execution' }
    ],
    correctOption: 'B',
    difficulty: 'EASY',
    marks: 2,
    negativeMarks: 0.5,
    explanation: 'Randomized election timeouts break symmetry among follower nodes, ensuring that typically one follower times out first, increments term, and wins the majority of votes before others timeout.'
  },
  {
    id: 'q-201-2',
    subjectId: 'sub-cs401',
    moduleId: 'mod-2',
    chapterId: 'chp-201',
    questionText: 'In a 5-node Raft cluster, what is the minimum quorum size required to elect a leader and commit a log entry?',
    options: [
      { key: 'A', text: '2 nodes' },
      { key: 'B', text: '3 nodes' },
      { key: 'C', text: '4 nodes' },
      { key: 'D', text: '5 nodes' }
    ],
    correctOption: 'B',
    difficulty: 'MEDIUM',
    marks: 3,
    negativeMarks: 0.75,
    explanation: 'Raft requires a simple majority quorum: ⌊N/2⌋ + 1. For N=5, ⌊5/2⌋ + 1 = 3 nodes.'
  },
  {
    id: 'q-201-3',
    subjectId: 'sub-cs401',
    moduleId: 'mod-2',
    chapterId: 'chp-201',
    questionText: 'According to Raft Leader Completeness property, under what condition will a voter reject a candidate\'s RequestVote RPC even if the candidate\'s term is higher?',
    options: [
      { key: 'A', text: 'If the voter\'s local IP address is numerically lower' },
      { key: 'B', text: 'If the candidate\'s log is less up-to-date than the voter\'s log (evaluated by last term, then last index)' },
      { key: 'C', text: 'If the candidate has pending client uncommitted transactions in its buffer' },
      { key: 'D', text: 'If the election was initiated during a scheduled checkpoint window' }
    ],
    correctOption: 'B',
    difficulty: 'HARD',
    marks: 4,
    negativeMarks: 1.0,
    explanation: 'Raft enforces that a candidate can only be elected if its log contains all committed entries from prior terms. A voter rejects votes if the candidate\'s log is less up-to-date (evaluated first by last log term, then by log length/index).'
  },

  // Chapter 4: Byzantine Fault Tolerance (CS-401)
  {
    id: 'q-202-1',
    subjectId: 'sub-cs401',
    moduleId: 'mod-2',
    chapterId: 'chp-202',
    questionText: 'In a system tolerating f Byzantine faulty nodes, what is the minimum total number of nodes N required by Practical Byzantine Fault Tolerance (PBFT)?',
    options: [
      { key: 'A', text: 'N >= 2f + 1' },
      { key: 'B', text: 'N >= 3f + 1' },
      { key: 'C', text: 'N >= 4f + 1' },
      { key: 'D', text: 'N >= 5f + 1' }
    ],
    correctOption: 'B',
    difficulty: 'EASY',
    marks: 2,
    negativeMarks: 0.5,
    explanation: 'PBFT requires N >= 3f + 1 nodes. If f nodes are faulty and lie, and another f nodes are slow/non-responsive, the system must still collect 2f + 1 matching responses to reach safe consensus.'
  },
  {
    id: 'q-202-2',
    subjectId: 'sub-cs401',
    moduleId: 'mod-2',
    chapterId: 'chp-202',
    questionText: 'What are the three core three-phase message exchanges in PBFT normal-case operation?',
    options: [
      { key: 'A', text: 'Request, Heartbeat, Acknowledge' },
      { key: 'B', text: 'Pre-Prepare, Prepare, Commit' },
      { key: 'C', text: 'Propose, Accept, Finalize' },
      { key: 'D', text: 'Discover, Sync, Execute' }
    ],
    correctOption: 'B',
    difficulty: 'MEDIUM',
    marks: 3,
    negativeMarks: 0.75,
    explanation: 'PBFT sequences requests via Pre-Prepare (primary orders requests), Prepare (nodes broadcast verification), and Commit (nodes verify that 2f+1 non-faulty nodes prepared the same view and sequence).'
  },

  // Chapter 1: Hodgkin-Huxley (NEUR-202)
  {
    id: 'q-301-1',
    subjectId: 'sub-neur202',
    moduleId: 'mod-3',
    chapterId: 'chp-301',
    questionText: 'In the Hodgkin-Huxley model, which gating variable governs the rapid activation of voltage-gated sodium (Na+) conductances?',
    options: [
      { key: 'A', text: 'n variable (raised to the 4th power)' },
      { key: 'B', text: 'm variable (raised to the 3rd power)' },
      { key: 'C', text: 'h variable (inactivation gate)' },
      { key: 'D', text: 'leak conductance variable g_L' }
    ],
    correctOption: 'B',
    difficulty: 'EASY',
    marks: 2,
    negativeMarks: 0.5,
    explanation: 'Sodium current is given by I_Na = g_Na_max * m^3 * h * (V - E_Na). The m variable represents activation and operates on a faster kinetic timescale than inactivation variable h.',
    language: 'en'
  }
];

export interface SampleGujaratiExcelRow {
  'પ્રશ્ન (Question)': string;
  'વિકલ્પ A (Option A)': string;
  'વિકલ્પ B (Option B)': string;
  'વિકલ્પ C (Option C)': string;
  'વિકલ્પ D (Option D)': string;
  'સાચો જવાબ (Correct)': 'A' | 'B' | 'C' | 'D';
  'મુશ્કેલી (Difficulty)': 'EASY' | 'MEDIUM' | 'HARD';
  'ગુણ (Marks)': number;
  'નેગેટિવ ગુણ (Negative Marks)': number;
  'પ્રકરણ (Chapter)': string;
  'સમજૂતી (Explanation)': string;
}

export const SAMPLE_GUJARATI_EXCEL_ROWS: SampleGujaratiExcelRow[] = [
  {
    'પ્રશ્ન (Question)': 'ગુજરાતની સૌથી લાંબી નદી કઈ છે?',
    'વિકલ્પ A (Option A)': 'નર્મદા',
    'વિકલ્પ B (Option B)': 'સાબરમતી',
    'વિકલ્પ C (Option C)': 'તાપી',
    'વિકલ્પ D (Option D)': 'મહી',
    'સાચો જવાબ (Correct)': 'B',
    'મુશ્કેલી (Difficulty)': 'EASY',
    'ગુણ (Marks)': 2,
    'નેગેટિવ ગુણ (Negative Marks)': 0.5,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૧: ગુજરાતની ભૂગોળ અને નદીઓ',
    'સમજૂતી (Explanation)': 'ગુજરાત રાજ્યમાં વહેતી લંબાઈની દ્રષ્ટિએ સાબરમતી (આશરે ૩૨૧ કિમી) ગુજરાતની સૌથી લાંબી નદી છે, જ્યારે જળજથ્થાની દ્રષ્ટિએ નર્મદા સૌથી મોટી નદી છે.'
  },
  {
    'પ્રશ્ન (Question)': 'ભારતીય બંધારણના કયા અનુચ્છેદ હેઠળ સમાનતાનો મૂળભૂત અધિકાર આપવામાં આવ્યો છે?',
    'વિકલ્પ A (Option A)': 'અનુચ્છેદ ૧૪ થી ૧૮',
    'વિકલ્પ B (Option B)': 'અનુચ્છેદ ૧૯ થી ૨૨',
    'વિકલ્પ C (Option C)': 'અનુચ્છેદ ૨૫ થી ૨૮',
    'વિકલ્પ D (Option D)': 'અનુચ્છેદ ૩૨',
    'સાચો જવાબ (Correct)': 'A',
    'મુશ્કેલી (Difficulty)': 'MEDIUM',
    'ગુણ (Marks)': 2,
    'નેગેટિવ ગુણ (Negative Marks)': 0.5,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૨: ભારતનું બંધારણ અને ઇતિહાસ',
    'સમજૂતી (Explanation)': 'ભારતીય બંધારણના ભાગ-૩ માં અનુચ્છેદ ૧૪ થી ૧૮ સુધી સમાનતાના અધિકાર (Right to Equality) ની જોગવાઈ કરવામાં આવી છે.'
  },
  {
    'પ્રશ્ન (Question)': 'માનવ શરીરમાં લોહીને શુદ્ધ કરવાનું મુખ્ય કાર્ય કયું અંગ કરે છે?',
    'વિકલ્પ A (Option A)': 'યકૃત (Liver)',
    'વિકલ્પ B (Option B)': 'મૂત્રપિંડ (Kidney)',
    'વિકલ્પ C (Option C)': 'જઠર (Stomach)',
    'વિકલ્પ D (Option D)': 'બરોળ (Spleen)',
    'સાચો જવાબ (Correct)': 'B',
    'મુશ્કેલી (Difficulty)': 'EASY',
    'ગુણ (Marks)': 2,
    'નેગેટિવ ગુણ (Negative Marks)': 0.5,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૩: ભૌતિક અને જીવવિજ્ઞાન',
    'સમજૂતી (Explanation)': 'મૂત્રપિંડ (Kidney) માં આવેલા નેફ્રોન્સ લોહીમાંથી યુરિયા અને અન્ય નકામા કચરાને ગાળીને લોહીને શુદ્ધ કરે છે.'
  },
  {
    'પ્રશ્ન (Question)': 'કમ્પ્યુટરમાં CPU નું પૂરું નામ શું છે?',
    'વિકલ્પ A (Option A)': 'Central Process Unit',
    'વિકલ્પ B (Option B)': 'Central Processing Unit',
    'વિકલ્પ C (Option C)': 'Computer Personal Unit',
    'વિકલ્પ D (Option D)': 'Central Program Utility',
    'સાચો જવાબ (Correct)': 'B',
    'મુશ્કેલી (Difficulty)': 'EASY',
    'ગુણ (Marks)': 2,
    'નેગેટિવ ગુણ (Negative Marks)': 0.5,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૪: કમ્પ્યુટર અને ટેકનોલોજી',
    'સમજૂતી (Explanation)': 'CPU એટલે Central Processing Unit, જેને કમ્પ્યુટરનું મગજ કહેવામાં આવે છે.'
  },
  {
    'પ્રશ્ન (Question)': 'પ્રકાશની શૂન્યાવકાશમાં ઝડપ આશરે કેટલી હોય છે?',
    'વિકલ્પ A (Option A)': '૩ × ૧૦^૫ મીટર/સેકન્ડ',
    'વિકલ્પ B (Option B)': '૩ × ૧૦^૮ મીટર/સેકન્ડ',
    'વિકલ્પ C (Option C)': '૩ × ૧૦^૬ કિમી/સેકન્ડ',
    'વિકલ્પ D (Option D)': '૧.૫ × ૧૦^૮ મીટર/સેકન્ડ',
    'સાચો જવાબ (Correct)': 'B',
    'મુશ્કેલી (Difficulty)': 'MEDIUM',
    'ગુણ (Marks)': 3,
    'નેગેટિવ ગુણ (Negative Marks)': 0.75,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૩: ભૌતિક અને જીવવિજ્ઞાન',
    'સમજૂતી (Explanation)': 'શૂન્યાવકાશમાં પ્રકાશની ઝડપ આશરે ૨,૯૯,૭૯૨,૪૫૮ મીટર/સેકન્ડ એટલે કે ૩ × ૧૦^૮ મીટર/સેકન્ડ હોય છે.'
  },
  {
    'પ્રશ્ન (Question)': 'ગુજરાત રાજ્યની સ્થાપના ક્યારે થઈ હતી?',
    'વિકલ્પ A (Option A)': '૧૫ ઓગસ્ટ ૧૯૪૭',
    'વિકલ્પ B (Option B)': '૨૬ જાન્યુઆરી ૧૯૫૦',
    'વિકલ્પ C (Option C)': '૧ મે ૧૯૬૦',
    'વિકલ્પ D (Option D)': '૧ નવેમ્બર ૧૯૫૬',
    'સાચો જવાબ (Correct)': 'C',
    'મુશ્કેલી (Difficulty)': 'EASY',
    'ગુણ (Marks)': 2,
    'નેગેટિવ ગુણ (Negative Marks)': 0.5,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૨: ભારતનું બંધારણ અને ઇતિહાસ',
    'સમજૂતી (Explanation)': 'બૃહદ મુંબઈ રાજ્યમાંથી અલગ પડીને ૧ મે ૧૯૬૦ ના રોજ ગુજરાત રાજ્યની સ્થાપના થઈ હતી.'
  },
  {
    'પ્રશ્ન (Question)': 'ઇન્ટરનેટ પર સુરક્ષિત ડેટા ટ્રાન્સફર માટે કયા પ્રોટોકોલનો ઉપયોગ થાય છે?',
    'વિકલ્પ A (Option A)': 'HTTP',
    'વિકલ્પ B (Option B)': 'FTP',
    'વિકલ્પ C (Option C)': 'HTTPS',
    'વિકલ્પ D (Option D)': 'SMTP',
    'સાચો જવાબ (Correct)': 'C',
    'મુશ્કેલી (Difficulty)': 'MEDIUM',
    'ગુણ (Marks)': 3,
    'નેગેટિવ ગુણ (Negative Marks)': 0.75,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૪: કમ્પ્યુટર અને ટેકનોલોજી',
    'સમજૂતી (Explanation)': 'HTTPS (Hypertext Transfer Protocol Secure) TLS/SSL એન્ક્રિપ્શન દ્વારા વેબ બ્રાઉઝર અને સર્વર વચ્ચે સુરક્ષિત સંચાર પૂરો પાડે છે.'
  },
  {
    'પ્રશ્ન (Question)': 'કચ્છના નાના રણમાં કયું દુર્લભ પ્રાણી જોવા મળે છે?',
    'વિકલ્પ A (Option A)': 'એશિયાઈ સિંહ',
    'વિકલ્પ B (Option B)': 'ઘુડખર (જંગલી ગધેડું)',
    'વિકલ્પ C (Option C)': 'કાળિયાર',
    'વિકલ્પ D (Option D)': 'રીંછ',
    'સાચો જવાબ (Correct)': 'B',
    'મુશ્કેલી (Difficulty)': 'HARD',
    'ગુણ (Marks)': 4,
    'નેગેટિવ ગુણ (Negative Marks)': 1,
    'પ્રકરણ (Chapter)': 'પ્રકરણ ૧: ગુજરાતની ભૂગોળ અને નદીઓ',
    'સમજૂતી (Explanation)': 'કચ્છના નાના રણમાં આવેલ ઘુડખર અભયારણ્ય ભારતીય જંગલી ગધેડા (ઘુડખર) માટે વિશ્વભરમાં પ્રખ્યાત છે.'
  }
];

export const INITIAL_BLUEPRINTS: ExamBlueprint[] = [
  {
    id: 'bp-cs401-midterm',
    title: 'CS-401 Midterm Examination Blueprint',
    code: 'BP-CS401-2026',
    subjectId: 'sub-cs401',
    durationMinutes: 15,
    passingPercentage: 70,
    totalQuestions: 8,
    totalMarks: 24,
    negativeMarkingEnabled: true,
    rules: [
      {
        id: 'rule-1',
        subjectId: 'sub-cs401',
        moduleId: 'mod-1',
        chapterId: 'chp-101',
        difficulty: 'EASY',
        questionCount: 1,
        marksPerQuestion: 2
      },
      {
        id: 'rule-2',
        subjectId: 'sub-cs401',
        moduleId: 'mod-1',
        chapterId: 'chp-101',
        difficulty: 'MEDIUM',
        questionCount: 1,
        marksPerQuestion: 3
      },
      {
        id: 'rule-3',
        subjectId: 'sub-cs401',
        moduleId: 'mod-1',
        chapterId: 'chp-102',
        difficulty: 'EASY',
        questionCount: 1,
        marksPerQuestion: 2
      },
      {
        id: 'rule-4',
        subjectId: 'sub-cs401',
        moduleId: 'mod-1',
        chapterId: 'chp-102',
        difficulty: 'MEDIUM',
        questionCount: 1,
        marksPerQuestion: 3
      },
      {
        id: 'rule-5',
        subjectId: 'sub-cs401',
        moduleId: 'mod-1',
        chapterId: 'chp-102',
        difficulty: 'HARD',
        questionCount: 1,
        marksPerQuestion: 4
      },
      {
        id: 'rule-6',
        subjectId: 'sub-cs401',
        moduleId: 'mod-2',
        chapterId: 'chp-201',
        difficulty: 'EASY',
        questionCount: 1,
        marksPerQuestion: 2
      },
      {
        id: 'rule-7',
        subjectId: 'sub-cs401',
        moduleId: 'mod-2',
        chapterId: 'chp-201',
        difficulty: 'HARD',
        questionCount: 1,
        marksPerQuestion: 4
      },
      {
        id: 'rule-8',
        subjectId: 'sub-cs401',
        moduleId: 'mod-2',
        chapterId: 'chp-202',
        difficulty: 'MEDIUM',
        questionCount: 1,
        marksPerQuestion: 4
      }
    ]
  }
];

export const INITIAL_EXAM_RESULTS: ExamResult[] = [
  {
    id: 'res-elena-1',
    examId: 'exam-sample-cs401',
    examTitle: 'CS-401 Distributed Consensus Assessment',
    studentId: 'user-stud-1',
    studentName: 'Elena Rostova',
    score: 21,
    totalMarks: 24,
    percentage: 87.5,
    passed: true,
    correctCount: 7,
    incorrectCount: 1,
    unansweredCount: 0,
    totalQuestions: 8,
    timeTakenSeconds: 580,
    submittedAt: '2026-11-03 16:45',
    chapterBreakdown: [
      {
        chapterId: 'chp-101',
        chapterName: 'FLP Impossibility & Timing Models',
        moduleName: 'Foundations of Asynchronous Consensus',
        totalQuestions: 2,
        correctCount: 2,
        incorrectCount: 0,
        accuracyPercentage: 100,
        masteryLevel: 'High'
      },
      {
        chapterId: 'chp-102',
        chapterName: 'Vector Clocks & Causal Ordering',
        moduleName: 'Foundations of Asynchronous Consensus',
        totalQuestions: 3,
        correctCount: 3,
        incorrectCount: 0,
        accuracyPercentage: 100,
        masteryLevel: 'High'
      },
      {
        chapterId: 'chp-201',
        chapterName: 'Raft Leader Election & Quorums',
        moduleName: 'Replicated State Machines & Protocol Invariants',
        totalQuestions: 2,
        correctCount: 1,
        incorrectCount: 1,
        accuracyPercentage: 50,
        masteryLevel: 'Needs Review'
      },
      {
        chapterId: 'chp-202',
        chapterName: 'Byzantine Fault Tolerance & Quorum Slices',
        moduleName: 'Replicated State Machines & Protocol Invariants',
        totalQuestions: 1,
        correctCount: 1,
        incorrectCount: 0,
        accuracyPercentage: 100,
        masteryLevel: 'High'
      }
    ],
    questionDetails: [
      {
        questionId: 'q-101-1',
        questionText: 'What is the fundamental conclusion established by the Fischer-Lynch-Paterson (FLP) theorem?',
        chapterName: 'FLP Impossibility & Timing Models',
        difficulty: 'EASY',
        selectedOption: 'B',
        correctOption: 'B',
        isCorrect: true,
        marksAwarded: 2,
        explanation: 'FLP theorem proves that no deterministic consensus protocol can guarantee safety and liveness in an asynchronous network with crash failures.'
      },
      {
        questionId: 'q-201-3',
        questionText: 'Under what condition will a voter reject a candidate\'s RequestVote RPC even if the candidate\'s term is higher?',
        chapterName: 'Raft Leader Election & Quorums',
        difficulty: 'HARD',
        selectedOption: 'C',
        correctOption: 'B',
        isCorrect: false,
        marksAwarded: -1.0,
        explanation: 'Voters reject candidates whose logs are less up-to-date (evaluated by last term, then last log index) to preserve Leader Completeness.'
      }
    ]
  }
];
