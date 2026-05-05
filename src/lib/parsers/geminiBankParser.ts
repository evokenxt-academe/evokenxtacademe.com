/**
 * Gemini Bank Parser — Topic-aware AI parsing for question bank imports
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ParsedQuestion } from "@/types/quiz";

export async function parseWithGeminiForBank(
  extractedText: string,
  subjectName: string,
  programBody: string,
  levelLabel: string,
  topicsArray: { name: string; id: string }[]
): Promise<{ questions: ParsedQuestion[]; error: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { questions: [], error: "GEMINI_API_KEY not configured" };

  const topicNames = JSON.stringify(topicsArray.map((t) => t.name));

  const prompt = `You are parsing a professional question bank for an LMS.

Subject context: ${subjectName} (${programBody} ${levelLabel})

Available topics for this subject (match exactly or null):
${topicNames}

Parse ALL questions. Return ONLY a valid JSON array.
Each question:
{
  "type": "mcq"|"multiple_select"|"subjective"|"fill_blank"|"true_false"|"assertion_reasoning"|"numerical",
  "question_text": "...",
  "options": [{ "text": "...", "is_correct": boolean }]|null,
  "numerical_answer": number|null,
  "numerical_tolerance": number,
  "assertion_text": ".."|null,
  "reason_text": ".."|null,
  "blank_answer": ".."|null,
  "model_answer": ".."|null,
  "explanation": ".."|null,
  "marks": number,
  "difficulty": "easy"|"medium"|"hard"|"expert",
  "topic_name": "..." (must match provided topics or null),
  "sub_topic_name": ".."|null,
  "source_ref": ".."|null,
  "year": number|null,
  "tags": ["...", "..."],
  "position": number
}

Difficulty heuristics:
  easy   = definitional, recall-based
  medium = application of a concept
  hard   = multi-step analysis
  expert = judgment/evaluation, SBL/P-level style

TEXT:
${extractedText}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000)),
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in response");

      const parsed = JSON.parse(jsonMatch[0]) as ParsedQuestion[];
      return {
        questions: parsed.map((q, i) => ({
          ...q,
          position: q.position ?? i + 1,
          difficulty: q.difficulty ?? "medium",
          _selected: true,
          _error: null,
        })),
        error: null,
      };
    } catch (e: any) {
      lastError = e.message;
      if (attempt < 2) await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }

  return { questions: [], error: lastError };
}
