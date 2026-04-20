export type AdminCoursePreviewResource = {
    id: string
    title: string
    fileUrl: string
}

export type AdminCoursePreviewLecture = {
    id: string
    title: string
    description: string
    videoUrl: string
    durationSec: number
    position: number
    isPreview: boolean
    resources: AdminCoursePreviewResource[]
}

export type AdminCoursePreviewSection = {
    id: string
    title: string
    position: number
    lectures: AdminCoursePreviewLecture[]
}

export type AdminCoursePreview = {
    id: string
    name: string
    slug: string
    description: string
    level: "knowledge" | "skills" | "professional" | string
    status: "draft" | "published" | "archived" | string
    price: number
    discountPrice: number | null
    thumbnailUrl: string
    createdAt: string
    instructor: {
        id: string
        name: string
        email: string
    }
    stats: {
        totalSections: number
        totalLectures: number
        totalResources: number
        totalDurationSec: number
    }
    sections: AdminCoursePreviewSection[]
}