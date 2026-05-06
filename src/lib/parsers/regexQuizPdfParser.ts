import type {
  DifficultyLevel,
  ParsedQuestion,
  QuestionType,
} from "@/features/admin/quiz-builder/types";

const QUESTION_START_RE =
  /^(?:Q(?:uestion)?\s*\.?\s*\d+[\).:]?|\d+[\).]|Q\.\d+|Q\.\s*\d+)\s+/i;
const OPTION_RE = /^\(?([A-Da-d])\)?[\).\-:]\s+(.+)$/;
const ANSWER_RE = /^(?:answer|ans|correct answer)\s*:\s*(.+)$/i;
const EXPLANATION_RE = /^(?:explanation|reason|rationale|note)\s*:\s*(.+)$/i;

const EASY_KEYWORDS = ["what is", "define", "identify", "state the"];
const HARD_KEYWORDS = [
  "analyse",
  "evaluate",
  "calculate",
  "distinguish",
  "justify",
];

type WorkingQuestion = {
  stem: string;
  options: Array<{ key: string; text: string }>;
  answerRaw?: string;
  explanation?: string;
};

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function normalizeQuestionStart(line: string): string {
  return cleanLine(line.replace(QUESTION_START_RE, ""));
}

function inferDifficulty(text: string): DifficultyLevel {
  const lower = text.toLowerCase();
  if (EASY_KEYWORDS.some((k) => lower.includes(k))) return "easy";
  if (HARD_KEYWORDS.some((k) => lower.includes(k))) return "hard";
  return "medium";
}

function extractAnswerKeys(answerRaw?: string): string[] {
  if (!answerRaw) return [];
  return Array.from(
    new Set(
      answerRaw
        .toUpperCase()
        .match(/[A-D]/g)
        ?.map((k) => k.trim())
        .filter(Boolean) ?? []
    )
  );
}

function inferQuestionType(params: {
  stem: string;
  options: Array<{ key: string; text: string }>;
  answerKeys: string[];
}): QuestionType {
  const stemLower = params.stem.toLowerCase();
  const optionsLower = params.options.map((o) => o.text.toLowerCase());

  if (
    params.options.length === 2 &&
    ((optionsLower.includes("true") && optionsLower.includes("false")) ||
      (optionsLower.includes("yes") && optionsLower.includes("no")))
  ) {
    return "true_or_false";
  }

  if (stemLower.includes("true or false")) {
    return "true_or_false";
  }

  if (
    stemLower.includes("select all") ||
    stemLower.includes("choose all") ||
    stemLower.includes("all that apply") ||
    params.answerKeys.length > 1
  ) {
    return "multiple_select";
  }

  if (
    params.options.length === 0 ||
    stemLower.includes("___") ||
    stemLower.includes("[blank]")
  ) {
    return "subjective";
  }

  return "mcq";
}

function toParsedQuestion(input: WorkingQuestion): ParsedQuestion | null {
  const stem = cleanLine(input.stem);
  if (!stem) return null;

  const answerKeys = extractAnswerKeys(input.answerRaw);
  const type = inferQuestionType({
    stem,
    options: input.options,
    answerKeys,
  });

  const options =
    input.options.length > 0
      ? input.options.map((option) => ({
          text: option.text,
          isCorrect: answerKeys.includes(option.key.toUpperCase()),
        }))
      : undefined;

  return {
    question: stem,
    type,
    difficulty: inferDifficulty(stem),
    marks: 1,
    explanation: input.explanation ? cleanLine(input.explanation) : undefined,
    tags: [],
    options,
    correctAnswer: input.answerRaw ? cleanLine(input.answerRaw) : undefined,
  };
}

export function parseQuestionsFromRawText(rawText: string): ParsedQuestion[] {
  const lines = rawText
    .replace(/\r/g, "\n")
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const blocks: WorkingQuestion[] = [];
  let current: WorkingQuestion | null = null;

  for (const line of lines) {
    if (QUESTION_START_RE.test(line)) {
      if (current) blocks.push(current);
      current = { stem: normalizeQuestionStart(line), options: [] };
      continue;
    }

    if (!current) continue;

    const optionMatch = line.match(OPTION_RE);
    if (optionMatch) {
      current.options.push({
        key: optionMatch[1].toUpperCase(),
        text: cleanLine(optionMatch[2]),
      });
      continue;
    }

    const answerMatch = line.match(ANSWER_RE);
    if (answerMatch) {
      current.answerRaw = answerMatch[1];
      continue;
    }

    const explanationMatch = line.match(EXPLANATION_RE);
    if (explanationMatch) {
      current.explanation = explanationMatch[1];
      continue;
    }

    if (current.options.length === 0 && !current.answerRaw) {
      current.stem = `${current.stem} ${line}`.trim();
    }
  }

  if (current) blocks.push(current);

  return blocks
    .map(toParsedQuestion)
    .filter((question): question is ParsedQuestion => Boolean(question));
}
