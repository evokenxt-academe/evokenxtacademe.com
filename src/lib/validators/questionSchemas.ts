import { z } from "zod";

export const questionTypeEnum = z.enum([
  "mcq",
  "multiple_select",
  "subjective",
  "fill_blank",
  "true_false",
  "assertion_reasoning",
  "numerical",
]);

export const difficultyEnum = z.enum(["easy", "medium", "hard", "expert"]);

const optionSchema = z.object({
  option_text: z.string().min(1, "Option text is required"),
  is_correct: z.boolean(),
  position: z.coerce.number().int().min(0),
  explanation: z.string().optional().nullable(),
});

export const QuestionBaseSchema = z.object({
  type: questionTypeEnum,
  question_text: z.string().min(1, "Question text is required"),
  question_image_url: z.string().url().optional().nullable(),
  marks: z.coerce.number().positive("Marks must be greater than 0"),
  negative_marks: z.coerce.number().min(0).default(0),
  source_ref: z.string().max(200).optional().nullable(),
  is_mandatory: z.boolean().default(true),
  explanation: z.string().optional().nullable(),
  explanation_image_url: z.string().url().optional().nullable(),
});

export const McqSchema = QuestionBaseSchema.extend({
  type: z.literal("mcq"),
  options: z
    .array(optionSchema)
    .min(2, "At least 2 options are required")
    .refine((opts) => opts.filter((o) => o.is_correct).length === 1, {
      message: "Exactly 1 correct option is required for MCQ",
    }),
});

export const MultipleSelectSchema = QuestionBaseSchema.extend({
  type: z.literal("multiple_select"),
  options: z
    .array(optionSchema)
    .min(2, "At least 2 options are required")
    .refine((opts) => opts.filter((o) => o.is_correct).length >= 1, {
      message: "At least 1 correct option is required",
    }),
});

export const TrueFalseSchema = QuestionBaseSchema.extend({
  type: z.literal("true_false"),
  options: z
    .array(optionSchema)
    .length(2, "True/False must have exactly 2 options")
    .refine((opts) => opts.filter((o) => o.is_correct).length === 1, {
      message: "Exactly 1 correct option is required",
    }),
});

export const AssertionReasonSchema = QuestionBaseSchema.extend({
  type: z.literal("assertion_reasoning"),
  assertion_text: z.string().min(1, "Assertion text is required"),
  reason_text: z.string().min(1, "Reason text is required"),
  options: z
    .array(optionSchema)
    .length(5, "Assertion & Reasoning must have exactly 5 options")
    .refine((opts) => opts.filter((o) => o.is_correct).length === 1, {
      message: "Exactly 1 correct option is required",
    }),
});

export const FillBlankSchema = QuestionBaseSchema.extend({
  type: z.literal("fill_blank"),
  blank_placeholder: z.string().optional().nullable(),
  options: z
    .array(optionSchema)
    .min(1, "At least 1 correct answer is required")
    .refine((opts) => opts.some((o) => o.is_correct), {
      message: "At least 1 correct answer is required",
    }),
});

export const NumericalSchema = QuestionBaseSchema.extend({
  type: z.literal("numerical"),
  numerical_answer: z.coerce.number({ required_error: "Answer is required" }),
  numerical_tolerance: z.coerce.number().min(0).default(0),
});

export const SubjectiveSchema = QuestionBaseSchema.extend({
  type: z.literal("subjective"),
  model_answer: z.string().optional().nullable(),
});

export const QuestionFormSchema = z.discriminatedUnion("type", [
  McqSchema,
  MultipleSelectSchema,
  TrueFalseSchema,
  AssertionReasonSchema,
  FillBlankSchema,
  NumericalSchema,
  SubjectiveSchema,
]);

export const BankQuestionSchema = QuestionBaseSchema.extend({
  subject_id: z.string().uuid("Subject is required"),
  topic_id: z.string().uuid().optional().nullable(),
  sub_topic_id: z.string().uuid().optional().nullable(),
  difficulty: difficultyEnum.default("medium"),
  year: z.coerce.number().int().min(1990).max(2100).optional().nullable(),
  session: z.string().max(50).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  blank_answer: z.string().optional().nullable(),
  options: z.array(optionSchema).optional().default([]),
});

export const BankImportJobSchema = z.object({
  subject_id: z.string().uuid("Subject is required"),
  topic_id: z.string().uuid().optional().nullable(),
  sub_topic_id: z.string().uuid().optional().nullable(),
});

export type QuestionFormSchemaType = z.infer<typeof QuestionFormSchema>;
export type BankQuestionSchemaType = z.infer<typeof BankQuestionSchema>;
