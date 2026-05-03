// ─────────────────────────────────────────────────────────────
// Answer Key Parser — Deterministic PDF answer extraction
// ─────────────────────────────────────────────────────────────
//
// Parses answer key PDFs with the format:
//   SECTION 1: MCQ
//   Q1 Answer: C
//   Q2 Answer: B
//
// Then matches answers against existing questions in the DB
// and marks the correct options / stores free-text answers.
// ─────────────────────────────────────────────────────────────

/**
 * A single parsed answer entry from the PDF.
 */
export interface ParsedAnswer {
    /** 1-based question number within its section */
    questionNumber: number;
    /** Raw answer text extracted from the PDF (e.g. "C", "Equity", "95200") */
    answer: string;
    /** The section header this answer belongs to (e.g. "MCQ", "Fill in the blanks") */
    sectionName: string;
}

/**
 * Result of matching a parsed answer against a DB question.
 */
export interface MatchResult {
    questionId: string;
    position: number;
    status: "updated" | "skipped" | "failed";
    /** Describes what happened — for logging */
    reason: string;
    /** The answer value that was applied */
    appliedAnswer?: string;
}

/**
 * Aggregate result returned to the caller.
 */
export interface ImportAnswerKeyResult {
    totalParsed: number;
    totalMatched: number;
    updated: number;
    failed: number;
    skipped: number;
    details: MatchResult[];
}

// ── Section types we recognise ────────────────────────────────

/** Question categories inferred from section header text */
export type AnswerSectionType = "mcq" | "fill" | "number" | "subjective" | "true_false" | "unknown";

/**
 * Infer the question type from a section header string.
 * Uses simple keyword matching — no guessing, no AI.
 */
export function inferSectionType(sectionName: string): AnswerSectionType {
    const lower = sectionName.toLowerCase().trim();

    if (/\bmcq\b/.test(lower) || /\bmultiple\s*choice\b/.test(lower)) return "mcq";
    if (/\btrue\b.*\bfalse\b/.test(lower) || /\bt\s*\/?\s*f\b/.test(lower)) return "true_false";
    if (/\bfill\b/.test(lower) || /\bblank/.test(lower)) return "fill";
    if (/\bnumber\b/.test(lower) || /\bnumeric/.test(lower) || /\binteger\b/.test(lower)) return "number";
    if (/\bsubjective\b/.test(lower) || /\bshort\s*answer\b/.test(lower) || /\blong\s*answer\b/.test(lower)) return "subjective";

    return "unknown";
}

// ── PDF text parsing ──────────────────────────────────────────

/**
 * Split raw PDF text into labelled sections.
 * Expected format: `SECTION 1: MCQ`, `SECTION 2: Fill in the blanks`, etc.
 *
 * Returns an array of { sectionName, body } pairs.
 */
export function splitSections(text: string): Array<{ sectionName: string; body: string }> {
    const sectionPattern = /SECTION\s+\d+\s*:\s*(.+)/gi;
    const matches = [...text.matchAll(sectionPattern)];

    if (matches.length === 0) {
        // No explicit section headers → treat entire text as a single unnamed section
        return [{ sectionName: "unknown", body: text }];
    }

    const sections: Array<{ sectionName: string; body: string }> = [];

    for (let i = 0; i < matches.length; i++) {
        const sectionName = matches[i][1].trim();
        const start = matches[i].index! + matches[i][0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
        const body = text.slice(start, end).trim();
        sections.push({ sectionName, body });
    }

    return sections;
}

/**
 * Extract Q/A pairs from a section body.
 * Matches lines like:
 *   Q1 Answer: C
 *   Q2 Answer: Equity
 *   Q10 Answer: 95200
 *
 * Also supports:
 *   Q1. Answer: C
 *   Q1) Answer: C
 *   1. Answer: C
 *   1) Answer: C
 */
export function extractAnswers(body: string, sectionName: string): ParsedAnswer[] {
    const answerPattern = /(?:Q\.?\s*)?(\d+)\s*[.):]?\s*Answer\s*:\s*(.+)/gi;
    const answers: ParsedAnswer[] = [];
    const seen = new Set<number>();

    for (const match of body.matchAll(answerPattern)) {
        const questionNumber = parseInt(match[1], 10);
        const answer = match[2].trim();

        // Skip duplicates — first occurrence wins
        if (seen.has(questionNumber)) continue;
        seen.add(questionNumber);

        if (questionNumber > 0 && answer.length > 0) {
            answers.push({ questionNumber, answer, sectionName });
        }
    }

    return answers;
}

/**
 * Parse the full PDF text and return all answers, grouped by section.
 */
export function parseAnswerKeyText(text: string): ParsedAnswer[] {
    const sections = splitSections(text);
    const allAnswers: ParsedAnswer[] = [];

    for (const { sectionName, body } of sections) {
        const answers = extractAnswers(body, sectionName);
        allAnswers.push(...answers);
    }

    return allAnswers;
}

// ── Option matching (MCQ / True-False) ────────────────────────

/**
 * Maps a single-letter answer (A/B/C/D/...) to a 0-based option index.
 * Returns -1 if the answer isn't a recognised letter.
 */
export function letterToIndex(letter: string): number {
    const upper = letter.trim().toUpperCase();
    if (upper.length !== 1 || upper < "A" || upper > "Z") return -1;
    return upper.charCodeAt(0) - "A".charCodeAt(0);
}

/**
 * Determine which option in a list matches the given answer string.
 * Returns the matched option's ID, or null if no match is found.
 *
 * Matching strategy (deterministic, in order of priority):
 * 1. Single letter (A/B/C/D) → map to option index by position
 * 2. "True" / "False" → exact case-insensitive match on option text
 * 3. Exact text match on option text (case-insensitive, trimmed)
 */
export function matchOptionByAnswer(
    answer: string,
    options: Array<{ id: string; text: string; position?: number }>,
): string | null {
    if (options.length === 0) return null;

    const trimmed = answer.trim();

    // Strategy 1: Single letter → positional index
    const index = letterToIndex(trimmed);
    if (index >= 0 && index < options.length) {
        // Sort by position if available, otherwise use array order
        const sorted = [...options].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        return sorted[index]?.id ?? null;
    }

    // Strategy 2 & 3: Case-insensitive exact text match
    const lowerAnswer = trimmed.toLowerCase();
    for (const option of options) {
        if (option.text.trim().toLowerCase() === lowerAnswer) {
            return option.id;
        }
    }

    return null;
}
