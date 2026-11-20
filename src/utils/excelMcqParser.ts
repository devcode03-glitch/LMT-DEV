/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { DifficultyLevel } from '../types/lms';
import { SAMPLE_GUJARATI_EXCEL_ROWS } from '../data/examMockData';

export interface ParsedExcelMCQRow {
  rowNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  difficulty: DifficultyLevel;
  marks: number;
  negativeMarks: number;
  chapterName: string;
  explanation: string;
  language: 'gu' | 'en';
  isValid: boolean;
  errors: string[];
}

const GUJARATI_UNICODE_REGEX = /[\u0A80-\u0AFF]/;

export function containsGujarati(text: string): boolean {
  return GUJARATI_UNICODE_REGEX.test(text);
}

/**
 * Converts Gujarati digits (૦-૯) to standard ASCII digits (0-9) for numeric parsing.
 */
function normalizeGujaratiDigits(input: string): string {
  const gujDigits = '૦૧૨૩૪૫૬૭૮૯';
  return input.replace(/[૦-૯]/g, (d) => String(gujDigits.indexOf(d)));
}

function normalizeHeaderKey(key: string): string {
  return key
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_\-()]+/g, ' ');
}

function getField(row: Record<string, unknown>, aliases: string[]): string {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const target = normalizeHeaderKey(alias);
    for (const [k, v] of entries) {
      const normK = normalizeHeaderKey(k);
      if (normK === target || normK.includes(target)) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          return String(v).trim();
        }
      }
    }
  }
  return '';
}

function parseCorrectOption(
  raw: string,
  options: { A: string; B: string; C: string; D: string }
): 'A' | 'B' | 'C' | 'D' | null {
  const cleaned = normalizeGujaratiDigits(raw).trim();
  if (!cleaned) return null;

  const upper = cleaned.toUpperCase();
  if (upper === 'A' || upper === '1' || cleaned === 'ક' || upper === 'OPTION A' || cleaned === 'વિકલ્પ A' || cleaned === 'વિકલ્પ ક') return 'A';
  if (upper === 'B' || upper === '2' || cleaned === 'ખ' || upper === 'OPTION B' || cleaned === 'વિકલ્પ B' || cleaned === 'વિકલ્પ ખ') return 'B';
  if (upper === 'C' || upper === '3' || cleaned === 'ગ' || upper === 'OPTION C' || cleaned === 'વિકલ્પ C' || cleaned === 'વિકલ્પ ગ') return 'C';
  if (upper === 'D' || upper === '4' || cleaned === 'ઘ' || upper === 'OPTION D' || cleaned === 'વિકલ્પ D' || cleaned === 'વિકલ્પ ઘ') return 'D';

  // Fallback: match against option text
  if (cleaned === options.A.trim()) return 'A';
  if (cleaned === options.B.trim()) return 'B';
  if (cleaned === options.C.trim()) return 'C';
  if (cleaned === options.D.trim()) return 'D';

  // Extract trailing letter A/B/C/D if like "(B)" or "Ans: B"
  const letterMatch = upper.match(/\b([ABCD])\b/);
  if (letterMatch) return letterMatch[1] as 'A' | 'B' | 'C' | 'D';

  return null;
}

function parseDifficulty(raw: string): DifficultyLevel {
  const norm = raw.trim().toLowerCase();
  if (norm.includes('easy') || norm.includes('સરળ') || norm.includes('સહેલું') || norm === 'e') {
    return 'EASY';
  }
  if (norm.includes('hard') || norm.includes('અઘરું') || norm.includes('કઠિન') || norm === 'h') {
    return 'HARD';
  }
  return 'MEDIUM';
}

function parseNumeric(raw: string, fallback: number): number {
  if (!raw) return fallback;
  const normalized = normalizeGujaratiDigits(raw).replace(/[^0-9.]/g, '');
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : fallback;
}

export function mapRawObjectsToParsedRows(rawRows: Record<string, unknown>[]): ParsedExcelMCQRow[] {
  return rawRows
    .map((row, idx): ParsedExcelMCQRow => {
      const questionText = getField(row, ['પ્રશ્ન', 'question', 'question text', 'mcq', 'q']);
      const optionA = getField(row, ['વિકલ્પ a', 'વિકલ્પ ક', 'option a', 'opt a', 'a', 'option 1', 'વિકલ્પ 1', 'વિકલ્પ ૧']);
      const optionB = getField(row, ['વિકલ્પ b', 'વિકલ્પ ખ', 'option b', 'opt b', 'b', 'option 2', 'વિકલ્પ 2', 'વિકલ્પ ૨']);
      const optionC = getField(row, ['વિકલ્પ c', 'વિકલ્પ ગ', 'option c', 'opt c', 'c', 'option 3', 'વિકલ્પ 3', 'વિકલ્પ ૩']);
      const optionD = getField(row, ['વિકલ્પ d', 'વિકલ્પ ઘ', 'option d', 'opt d', 'd', 'option 4', 'વિકલ્પ 4', 'વિકલ્પ ૪']);
      const rawCorrect = getField(row, ['સાચો જવાબ', 'જવાબ', 'correct option', 'correct', 'answer', 'ans']);
      const rawDifficulty = getField(row, ['મુશ્કેલી', 'કઠિનતા', 'difficulty', 'level']);
      const rawMarks = getField(row, ['ગુણ', 'marks', 'points', 'score']);
      const rawNegMarks = getField(row, ['નેગેટિવ ગુણ', 'negative marks', 'negative', 'penalty']);
      const chapterName = getField(row, ['પ્રકરણ', 'chapter', 'topic', 'વિભાગ']);
      const explanation = getField(row, ['સમજૂતી', 'explanation', 'rationale', 'solution', 'નોંધ']);

      const errors: string[] = [];
      if (!questionText) errors.push('પ્રશ્ન ખાલી છે (Missing Question)');
      if (!optionA || !optionB) errors.push('ઓછામાં ઓછા વિકલ્પ A અને B જરૂરી છે (Need Option A & B)');
      if (!optionC) errors.push('વિકલ્પ C ખાલી છે (Missing Option C)');
      if (!optionD) errors.push('વિકલ્પ D ખાલી છે (Missing Option D)');

      const parsedCorrect = parseCorrectOption(rawCorrect, {
        A: optionA,
        B: optionB,
        C: optionC,
        D: optionD
      });
      if (!parsedCorrect) {
        errors.push(`સાચો જવાબ અમાન્ય છે ("${rawCorrect || 'ખાલી'}") — A/B/C/D અથવા ક/ખ/ગ/ઘ વાપરો`);
      }

      const combinedText = `${questionText} ${optionA} ${optionB} ${optionC} ${optionD} ${explanation}`;
      const language: 'gu' | 'en' = containsGujarati(combinedText) ? 'gu' : 'en';

      return {
        rowNumber: idx + 2, // Excel row index (row 1 is header)
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption: parsedCorrect || 'A',
        difficulty: parseDifficulty(rawDifficulty),
        marks: parseNumeric(rawMarks, 2),
        negativeMarks: parseNumeric(rawNegMarks, 0.5),
        chapterName,
        explanation,
        language,
        isValid: errors.length === 0,
        errors
      };
    })
    .filter(r => r.questionText || r.optionA || r.optionB || r.optionC || r.optionD);
}

export async function parseExcelFileToMCQs(file: File): Promise<{
  rows: ParsedExcelMCQRow[];
  sheetName: string;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel ફાઇલમાં કોઈ શીટ મળી નથી (No worksheet found in file).');
  }
  const sheet = workbook.Sheets[sheetName];
  const rawObjects = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ''
  });

  if (rawObjects.length === 0) {
    throw new Error('Excel શીટ ખાલી છે (Worksheet contains no rows).');
  }

  return {
    rows: mapRawObjectsToParsedRows(rawObjects),
    sheetName
  };
}

export function loadSampleGujaratiExcelRows(): ParsedExcelMCQRow[] {
  return mapRawObjectsToParsedRows(
    SAMPLE_GUJARATI_EXCEL_ROWS as unknown as Record<string, unknown>[]
  );
}

export function downloadGujaratiExcelTemplate(): void {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_GUJARATI_EXCEL_ROWS);
  worksheet['!cols'] = [
    { wch: 48 }, // Question
    { wch: 24 }, // Option A
    { wch: 24 }, // Option B
    { wch: 24 }, // Option C
    { wch: 24 }, // Option D
    { wch: 16 }, // Correct
    { wch: 16 }, // Difficulty
    { wch: 12 }, // Marks
    { wch: 16 }, // Negative Marks
    { wch: 34 }, // Chapter
    { wch: 52 }  // Explanation
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gujarati_MCQs');
  XLSX.writeFile(workbook, 'Gujarati_MCQ_Exam_Template.xlsx');
}
