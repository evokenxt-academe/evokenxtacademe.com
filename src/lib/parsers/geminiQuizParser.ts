/**
 * Gemini Quiz Parser — AI-powered question extraction for quiz imports
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ParsedQuestion } from "@/types/quiz";

const QUIZ_PROMPT = `You are a professional exam question parser for an LMS covering ACCA, CFA, and CMA certifications.

Parse the following exam text and extract ALL questions.
Return ONLY a valid JSON array — no markdown, no preamble.

Each question must use this exact structure:
{
  "type": "mcq"|"multiple_select"|"subjective"|"fill_blank"|"true_false"|"assertion_reasoning"|"numerical",
  "question_text": "...",
  "marks": number,
  "options": [{ "text": "...", "is_correct": boolean }]|null,
  "correct_answer": "...",
  "numerical_answer": number|null,
  "numerical_tolerance": number,
  "assertion_text": "...|null",
  "reason_text": "...|null",
  "blank_answer": "...|null",
  "model_answer": "...|null",
  "explanation": "...|null",
  "source_ref": "...|null",
  "position": number
}

Detection rules:
- Options A/B/C/D with one marked → mcq
- Multiple options marked correct → multiple_select
- "Calculate" / number answer → numerical
- True/False → true_false
- Assertion and Reason present → assertion_reasoning
- Blank (___) in question → fill_blank
- Otherwise → subjective
- Extract marks from "(2 marks)" / "[1]" / "Marks: 2"
- Default marks = 1 if not found
- Correct MCQ marked with *, (correct), or "Answer: B"`;

export async function parseWithGemini(extractedText: string): Promise<{ questions: ParsedQuestion[]; error: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { questions: [], error: "GEMINI_API_KEY not configured" };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await Promise.race([
        model.generateContent(`${QUIZ_PROMPT}\n\nTEXT:\n${extractedText}`),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000)),
      ]);

      const text = result.response.text();
      // Extract JSON from response (strip markdown fences if any)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in response");

      const parsed = JSON.parse(jsonMatch[0]) as ParsedQuestion[];
      return { questions: parsed.map((q, i) => ({ ...q, position: q.position ?? i + 1, _selected: true, _error: null })), error: null };
    } catch (e: any) {
      lastError = e.message;
      if (attempt < 2) await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }

  return { questions: [], error: lastError };
}
