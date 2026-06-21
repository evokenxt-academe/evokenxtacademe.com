import { z } from "zod";

import { examBodies, genderOptions, languageOptions } from "./types";

export const personalInfoSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().trim().max(30).optional().nullable(),
    date_of_birth: z.string().optional().nullable(),
    gender: z.enum(genderOptions).optional().nullable(),
    bio: z.string().trim().max(300).optional().nullable(),
    linkedin_url: z.string().trim().max(200).optional().nullable(),
});

export const academicSchema = z.object({
    college_name: z.string().trim().max(150).optional().nullable(),
    university: z.string().trim().max(150).optional().nullable(),
    degree: z.string().trim().max(150).optional().nullable(),
    graduation_year: z.number().int().min(1980).max(2040).optional().nullable(),
    field_of_study: z.string().trim().max(150).optional().nullable(),
    current_employer: z.string().trim().max(150).optional().nullable(),
    job_title: z.string().trim().max(150).optional().nullable(),
    years_of_experience: z.number().int().min(0).max(50).optional().nullable(),
});

export const examTargetingSchema = z.object({
    target_exam_body: z.enum(examBodies).optional().nullable(),
    target_exam_level: z.string().trim().max(100).optional().nullable(),
    target_exam_date: z.string().optional().nullable(),
    exam_attempt_number: z.number().int().min(1).optional().nullable(),
});

export const locationNotifSchema = z.object({
    city: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
    preferred_language: z.enum(languageOptions).optional().nullable(),
    notification_email: z.boolean().optional(),
    notification_sms: z.boolean().optional(),
    notification_whatsapp: z.boolean().optional(),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
export type AcademicValues = z.infer<typeof academicSchema>;
export type ExamTargetingValues = z.infer<typeof examTargetingSchema>;
export type LocationNotifValues = z.infer<typeof locationNotifSchema>;