import { z } from "zod";

export const quizTypeEnum = z.enum([
  "practice",
  "graded",
  "mock_exam",
  "final_exam",
]);

export const showAnswersEnum = z.enum(["submit", "never", "pass"]);

export const QuizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  course_id: z.string().uuid("Select a course"),
  chapter_id: z.string().uuid().optional().nullable(),
  type: quizTypeEnum,
  passing_marks: z.coerce.number().min(0).optional().nullable(),
  time_limit_sec: z.coerce.number().int().positive().optional().nullable(),
  shuffle_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  max_attempts: z.coerce.number().int().min(1).optional().nullable(),
  show_answers_after: showAnswersEnum.default("submit"),
});

export const QuizUpdateSchema = QuizSchema.partial().extend({
  id: z.string().uuid(),
});

export type QuizSchemaType = z.infer<typeof QuizSchema>;
