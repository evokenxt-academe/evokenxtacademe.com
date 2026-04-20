// ─────────────────────────────────────────────────────────────
// Course Creation Types — mirrors PostgreSQL schema
// ─────────────────────────────────────────────────────────────

export type CourseLevel = "knowledge" | "skills" | "professional"
export type CourseStatus = "draft" | "published" | "archived"

export interface Resource {
    id: string
    lectureId: string
    title: string
    fileUrl: string
    file?: File | null
}

export interface Lecture {
    id: string
    sectionId: string
    title: string
    videoUrl: string
    description: string
    durationSec: number
    position: number
    isPreview: boolean
    resources: Resource[]
}

export interface Section {
    id: string
    courseId: string
    title: string
    position: number
    lectures: Lecture[]
    isCollapsed: boolean // UI-only state
}

export interface CourseFormData {
    // Step 1: Basic Info
    name: string
    slug: string
    description: string
    level: CourseLevel
    thumbnailUrl: string
    thumbnailFile: File | null
    instructorId: string

    // Step 2: Curriculum
    sections: Section[]

    // Step 3: Pricing
    price: number
    discountPrice: number

    // Step 4: Publish
    status: CourseStatus
}

export type StepId = "basic-info" | "curriculum" | "pricing" | "publish"

export interface Step {
    id: StepId
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

// Validation state per step
export interface StepValidation {
    isValid: boolean
    errors: Record<string, string>
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function createEmptyResource(lectureId: string): Resource {
    return {
        id: crypto.randomUUID(),
        lectureId,
        title: "",
        fileUrl: "",
        file: null,
    }
}

export function createEmptyLecture(sectionId: string, position: number): Lecture {
    return {
        id: crypto.randomUUID(),
        sectionId,
        title: "",
        videoUrl: "",
        description: "",
        durationSec: 0,
        position,
        isPreview: false,
        resources: [],
    }
}

export function createEmptySection(courseId: string, position: number): Section {
    return {
        id: crypto.randomUUID(),
        courseId,
        title: "",
        position,
        lectures: [],
        isCollapsed: false,
    }
}

export function getInitialFormData(): CourseFormData {
    return {
        name: "",
        slug: "",
        description: "",
        level: "knowledge",
        thumbnailUrl: "",
        thumbnailFile: null,
        instructorId: "",
        sections: [],
        price: 0,
        discountPrice: 0,
        status: "draft",
    }
}
