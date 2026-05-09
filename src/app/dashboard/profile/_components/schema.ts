import { z } from "zod";

import { examBodies, genderOptions, languageOptions } from "./types";

export const personalInfoSchema = z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(30).optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(genderOptions).optional(),
    bio: z.string().trim().max(300).optional(),
    linkedin_url: z.string().trim().max(200).optional(),
});

export const academicSchema = z.object({
    college_name: z.string().trim().max(150).optional(),
    university: z.string().trim().max(150).optional(),
    degree: z.string().trim().max(150).optional(),
    graduation_year: z.number().int().min(1980).max(2040).optional(),
    field_of_study: z.string().trim().max(150).optional(),
    current_employer: z.string().trim().max(150).optional(),
    job_title: z.string().trim().max(150).optional(),
    years_of_experience: z.number().int().min(0).max(50).optional(),
});

export const examTargetingSchema = z.object({
    target_exam_body: z.enum(examBodies).optional(),
    target_exam_level: z.string().trim().max(100).optional(),
    target_exam_date: z.string().optional(),
    exam_attempt_number: z.number().int().min(1).optional(),
});

export const locationNotifSchema = z.object({
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().min(2).max(100),
    preferred_language: z.enum(languageOptions),
    notification_email: z.boolean(),
    notification_sms: z.boolean(),
    notification_whatsapp: z.boolean(),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
export type AcademicValues = z.infer<typeof academicSchema>;
export type ExamTargetingValues = z.infer<typeof examTargetingSchema>;
export type LocationNotifValues = z.infer<typeof locationNotifSchema>;