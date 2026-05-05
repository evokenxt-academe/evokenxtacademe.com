import { z } from "zod";

// ── Course Base Schema (shared create + edit) ────────────────────────
export const courseBaseSchema = z.object({
  subject_id: z.string().uuid("Select a subject"),
  instructor_id: z.string().uuid("Select an instructor"),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be under 150 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers and hyphens only"
    ),
  short_description: z.string().max(200).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  language: z.enum(["en", "hi", "hi-en"]).default("en"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  is_featured: z.boolean().default(false),
  thumbnail_url: z.string().url().optional().or(z.literal("")),
  preview_video_url: z.string().url().optional().or(z.literal("")),
  what_you_learn: z
    .array(z.string().min(1))
    .min(1, "Add at least one learning outcome"),
  requirements: z.array(z.string().min(1)).default([]),
});

export type CourseFormValues = z.infer<typeof courseBaseSchema>;

// ── Step-specific schemas for multi-step validation ──────────────────
export const stepProgramSchema = z.object({
  subject_id: z.string().uuid("Select a subject"),
  instructor_id: z.string().uuid("Select an instructor"),
});

export const stepDetailsSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be under 150 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers and hyphens only"
    ),
  short_description: z.string().max(200).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  language: z.enum(["en", "hi", "hi-en"]).default("en"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  is_featured: z.boolean().default(false),
});

export const stepMediaSchema = z.object({
  thumbnail_url: z.string().url().optional().or(z.literal("")),
  preview_video_url: z.string().url().optional().or(z.literal("")),
});

export const stepOutcomesSchema = z.object({
  what_you_learn: z
    .array(z.string().min(1))
    .min(1, "Add at least one learning outcome"),
  requirements: z.array(z.string().min(1)).default([]),
});

// ── Chapter Schema ───────────────────────────────────────────────────
export const chapterSchema = z.object({
  title: z.string().min(2, "Title required").max(200),
  description: z.string().optional().or(z.literal("")),
  is_published: z.boolean().default(false),
});

export type ChapterFormValues = z.infer<typeof chapterSchema>;

// ── Lecture Schema ───────────────────────────────────────────────────
export const lectureSchema = z.object({
  title: z.string().min(2, "Title required").max(200),
  description: z.string().optional().or(z.literal("")),
  video_url: z.string().url().optional().or(z.literal("")),
  video_provider: z
    .enum(["youtube", "cloudfront", "bunny", "vimeo"])
    .default("youtube"),
  yt_video_id: z.string().optional().or(z.literal("")),
  duration_sec: z.coerce.number().int().min(0).default(0),
  is_preview: z.boolean().default(false),
  is_published: z.boolean().default(false),
  transcript_url: z.string().url().optional().or(z.literal("")),
  notes_url: z.string().url().optional().or(z.literal("")),
});

export type LectureFormValues = z.infer<typeof lectureSchema>;

// ── Pricing Schema ───────────────────────────────────────────────────
export const pricingSchema = z.object({
  label: z.string().min(1, "Label is required"),
  currency: z.string().length(3).default("INR"),
  base_price: z.coerce.number().positive("Price must be positive"),
  discounted_price: z.coerce.number().positive().optional(),
  valid_from: z.string().optional().or(z.literal("")),
  valid_until: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type PricingFormValues = z.infer<typeof pricingSchema>;

// ── Resource Schema ──────────────────────────────────────────────────
export const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  file_url: z.string().url("Enter a valid URL"),
  file_type: z.enum([
    "pdf",
    "video",
    "slide",
    "spreadsheet",
    "link",
    "image",
    "audio",
    "zip",
  ]),
  file_size_kb: z.coerce.number().int().min(0).optional(),
});

export type ResourceFormValues = z.infer<typeof resourceSchema>;

// ── Study Material Schema ────────────────────────────────────────────
export const studyMaterialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  type: z.enum([
    "pdf",
    "video",
    "slide",
    "spreadsheet",
    "link",
    "image",
    "audio",
    "zip",
  ]),
  access_level: z.enum(["free", "enrolled", "premium"]),
  file_url: z.string().url("Enter a valid URL"),
  file_size_kb: z.coerce.number().int().min(0).optional(),
  is_published: z.boolean().default(false),
});

export type StudyMaterialFormValues = z.infer<typeof studyMaterialSchema>;
