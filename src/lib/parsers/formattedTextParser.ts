
/**
 * Formatted Text Parser — Regex-based question extraction
 * Used as Tab B parser and fallback when Gemini fails.
 */
import type { ParsedQuestion, QuestionType } from "@/types/quiz";

const QUESTION_SPLIT_RE = /(?:^|\n)(?:TYPE:\s*\w+|(?:\d+[\.\)]\s)|(?:Q\d+[\.\)]\s)|(?:\(\w\)\s))/gm;

export function parseFormattedText(text: string): { questions: ParsedQuestion[]; errors: string[] } {
  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];

  // Split by TYPE: blocks
  const blocks = text.split(/(?=TYPE:\s*\w+)/gi).filter((b) => b.trim());

  if (blocks.length === 0) {
    // Try numbered pattern: 1. / Q1.
    const numbered = text.split(/(?=(?:^|\n)\s*(?:\d+[\.\)]\s|Q\d+[\.\)]\s))/gm).filter((b) => b.trim());
    if (numbered.length > 0) {
      numbered.forEach((block, i) => {
        try {
          const q = parseNumberedBlock(block, i);
          if (q) questions.push(q);
        } catch (e: any) {
          errors.push(`Question ${i + 1}: ${e.message}`);
        }
      });
    }
    return { questions, errors };
  }

  blocks.forEach((block, i) => {
    try {
      const q = parseTypedBlock(block, i);
      if (q) questions.push(q);
    } catch (e: any) {
      errors.push(`Block ${i + 1}: ${e.message}`);
    }
  });

  return { questions, errors };
}

function parseTypedBlock(block: string, index: number): ParsedQuestion | null {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const typeMatch = lines[0].match(/TYPE:\s*(\w+)/i);
  const type = (typeMatch?.[1]?.toLowerCase() ?? "mcq") as QuestionType;

  const fields = extractFields(lines);
  const questionText = fields["QUESTION"] || fields["Q"] || "";
  if (!questionText) return null;

  const marksStr = fields["MARKS"] || fields["MARK"] || "1";
  const marks = parseFloat(marksStr) || 1;
  const explanation = fields["EXPLANATION"] || fields["EXPLAIN"] || null;
  const sourceRef = fields["SOURCE"] || fields["SOURCE_REF"] || null;

  let options: { text: string; is_correct: boolean }[] | null = null;
  let numericalAnswer: number | null = null;
  let numericalTolerance = 0;
  let assertionText: string | null = null;
  let reasonText: string | null = null;
  let blankAnswer: string | null = null;
  let modelAnswer: string | null = null;
  let correctAnswer: string | null = null;

  switch (type) {
    case "mcq":
    case "multiple_select":
      options = extractOptions(lines);
      break;
    case "true_false":
      const tfAnswer = (fields["ANSWER"] || "").toLowerCase();
      options = [
        { text: "True", is_correct: tfAnswer === "true" },
        { text: "False", is_correct: tfAnswer === "false" },
      ];
      break;
    case "assertion_reasoning":
      assertionText = fields["ASSERTION"] || fields["ASSERTION_TEXT"] || null;
      reasonText = fields["REASON"] || fields["REASON_TEXT"] || null;
      options = extractOptions(lines);
      break;
    case "numerical":
      numericalAnswer = parseFloat(fields["ANSWER"] || "0") || null;
      numericalTolerance = parseFloat(fields["TOLERANCE"] || "0") || 0;
      break;
    case "fill_blank":
      blankAnswer = fields["ANSWER"] || fields["BLANK_ANSWER"] || null;
      break;
    case "subjective":
      modelAnswer = fields["MODEL_ANSWER"] || fields["ANSWER"] || null;
      break;
  }

  correctAnswer = fields["ANSWER"] || fields["CORRECT"] || null;

  return {
    type, question_text: questionText, marks, options, correct_answer: correctAnswer,
    numerical_answer: numericalAnswer, numerical_tolerance: numericalTolerance,
    assertion_text: assertionText, reason_text: reasonText,
    blank_answer: blankAnswer, model_answer: modelAnswer,
    explanation, source_ref: sourceRef, position: index + 1,
    _selected: true, _error: null,
  };
}

function parseNumberedBlock(block: string, index: number): ParsedQuestion | null {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // First line is the question (strip number prefix)
  const questionText = lines[0].replace(/^(?:\d+[\.\)]\s*|Q\d+[\.\)]\s*)/, "").trim();
  if (!questionText) return null;

  const options = extractOptions(lines.slice(1));
  const type: QuestionType = options && options.length > 0 ? (options.filter((o) => o.is_correct).length > 1 ? "multiple_select" : "mcq") : "subjective";

  return {
    type, question_text: questionText, marks: 1, options: options && options.length > 0 ? options : null,
    correct_answer: null, numerical_answer: null, numerical_tolerance: 0,
    assertion_text: null, reason_text: null, blank_answer: null, model_answer: null,
    explanation: null, source_ref: null, position: index + 1,
    _selected: true, _error: null,
  };
}

function extractFields(lines: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  let currentKey = "";
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+):\s*(.*)/);
    if (match) {
      currentKey = match[1];
      fields[currentKey] = match[2];
    } else if (currentKey && !line.match(/^[A-E][\.\)]\s/)) {
      fields[currentKey] += "\n" + line;
    }
  }
  return fields;
}

function extractOptions(lines: string[]): { text: string; is_correct: boolean }[] {
  const options: { text: string; is_correct: boolean }[] = [];
  const optionRe = /^([A-E])[\.\)]\s*(.*)/;

  for (const line of lines) {
    const match = line.match(optionRe);
    if (match) {
      const text = match[2].replace(/\s*\*\s*$/, "").replace(/\s*\(correct\)\s*$/i, "").trim();
      const isCorrect = line.includes("*") || line.toLowerCase().includes("(correct)");
      options.push({ text, is_correct: isCorrect });
    }
  }
  return options;
}
