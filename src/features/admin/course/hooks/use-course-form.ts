"use client"

import { useCallback, useMemo, useState } from "react"
import {
    type CourseFormData,
    type StepId,
    type Section,
    type Lecture,
    type Resource,
    createEmptySection,
    createEmptyLecture,
    createEmptyResource,
    getInitialFormData,
} from "../types/course"

export function useCourseForm() {
    const [formData, setFormData] = useState<CourseFormData>(getInitialFormData)
    const [currentStep, setCurrentStep] = useState<StepId>("basic-info")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // ── Step navigation ──────────────────────────────────────
    const steps: StepId[] = ["basic-info", "curriculum", "pricing", "publish"]
    const currentStepIndex = steps.indexOf(currentStep)

    const goToStep = useCallback((step: StepId) => {
        setCurrentStep(step)
    }, [])

    const goNext = useCallback(() => {
        const nextIndex = currentStepIndex + 1
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex])
        }
    }, [currentStepIndex, steps])

    const goPrev = useCallback(() => {
        const prevIndex = currentStepIndex - 1
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex])
        }
    }, [currentStepIndex, steps])

    // ── Basic updates ────────────────────────────────────────
    const updateField = useCallback(<K extends keyof CourseFormData>(
        key: K,
        value: CourseFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [key]: value }))
        // Clear error for this field
        setErrors(prev => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }, [])

    // Auto-generate slug from name
    const updateName = useCallback((name: string) => {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim()
        setFormData(prev => ({ ...prev, name, slug }))
        setErrors(prev => {
            const next = { ...prev }
            delete next.name
            delete next.slug
            return next
        })
    }, [])

    // ── Section operations ───────────────────────────────────
    const addSection = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            sections: [
                ...prev.sections,
                createEmptySection("", prev.sections.length),
            ],
        }))
    }, [])

    const updateSection = useCallback((sectionId: string, data: Partial<Section>) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId ? { ...s, ...data } : s
            ),
        }))
    }, [])

    const deleteSection = useCallback((sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections
                .filter(s => s.id !== sectionId)
                .map((s, i) => ({ ...s, position: i })),
        }))
    }, [])

    const toggleSectionCollapse = useCallback((sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId ? { ...s, isCollapsed: !s.isCollapsed } : s
            ),
        }))
    }, [])

    const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
        setFormData(prev => {
            const sections = [...prev.sections]
            const [moved] = sections.splice(fromIndex, 1)
            sections.splice(toIndex, 0, moved)
            return {
                ...prev,
                sections: sections.map((s, i) => ({ ...s, position: i })),
            }
        })
    }, [])

    // ── Lecture operations ────────────────────────────────────
    const addLecture = useCallback((sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        lectures: [
                            ...s.lectures,
                            createEmptyLecture(sectionId, s.lectures.length),
                        ],
                    }
                    : s
            ),
        }))
    }, [])

    const updateLecture = useCallback((
        sectionId: string,
        lectureId: string,
        data: Partial<Lecture>
    ) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        lectures: s.lectures.map(l =>
                            l.id === lectureId ? { ...l, ...data } : l
                        ),
                    }
                    : s
            ),
        }))
    }, [])

    const deleteLecture = useCallback((sectionId: string, lectureId: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        lectures: s.lectures
                            .filter(l => l.id !== lectureId)
                            .map((l, i) => ({ ...l, position: i })),
                    }
                    : s
            ),
        }))
    }, [])

    const reorderLectures = useCallback((
        sectionId: string,
        fromIndex: number,
        toIndex: number
    ) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s
                const lectures = [...s.lectures]
                const [moved] = lectures.splice(fromIndex, 1)
                lectures.splice(toIndex, 0, moved)
                return {
                    ...s,
                    lectures: lectures.map((l, i) => ({ ...l, position: i })),
                }
            }),
        }))
    }, [])

    // ── Resource operations ──────────────────────────────────
    const addResource = useCallback((sectionId: string, lectureId: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        lectures: s.lectures.map(l =>
                            l.id === lectureId
                                ? {
                                    ...l,
                                    resources: [
                                        ...l.resources,
                                        createEmptyResource(lectureId),
                                    ],
                                }
                                : l
                        ),
                    }
                    : s
            ),
        }))
    }, [])

    const updateResource = useCallback((
        sectionId: string,
        lectureId: string,
        resourceId: string,
        data: Partial<Resource>
    ) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        lectures: s.lectures.map(l =>
                            l.id === lectureId
                                ? {
                                    ...l,
                                    resources: l.resources.map(r =>
                                        r.id === resourceId ? { ...r, ...data } : r
                                    ),
                                }
                                : l
                        ),
                    }
                    : s
            ),
        }))
    }, [])

    const deleteResource = useCallback((
        sectionId: string,
        lectureId: string,
        resourceId: string
    ) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        lectures: s.lectures.map(l =>
                            l.id === lectureId
                                ? {
                                    ...l,
                                    resources: l.resources.filter(r => r.id !== resourceId),
                                }
                                : l
                        ),
                    }
                    : s
            ),
        }))
    }, [])

    // ── Stats ────────────────────────────────────────────────
    const stats = useMemo(() => {
        const totalSections = formData.sections.length
        const totalLectures = formData.sections.reduce(
            (acc, s) => acc + s.lectures.length, 0
        )
        const totalDuration = formData.sections.reduce(
            (acc, s) => acc + s.lectures.reduce((a, l) => a + l.durationSec, 0), 0
        )
        const totalResources = formData.sections.reduce(
            (acc, s) => acc + s.lectures.reduce((a, l) => a + l.resources.length, 0), 0
        )
        const discountPercent =
            formData.price > 0 && formData.discountPrice > 0
                ? Math.round(((formData.price - formData.discountPrice) / formData.price) * 100)
                : 0

        return { totalSections, totalLectures, totalDuration, totalResources, discountPercent }
    }, [formData])

    // ── Validation ───────────────────────────────────────────
    const validateStep = useCallback((step: StepId): boolean => {
        const newErrors: Record<string, string> = {}

        switch (step) {
            case "basic-info":
                if (!formData.name.trim()) newErrors.name = "Course title is required"
                if (!formData.slug.trim()) newErrors.slug = "Slug is required"
                if (!formData.description.trim()) newErrors.description = "Description is required"
                break
            case "curriculum":
                if (formData.sections.length === 0) {
                    newErrors.sections = "Add at least one section"
                }
                formData.sections.forEach((s, si) => {
                    if (!s.title.trim()) {
                        newErrors[`section-${si}-title`] = `Section ${si + 1} needs a title`
                    }
                })
                break
            case "pricing":
                if (formData.discountPrice > formData.price && formData.price > 0) {
                    newErrors.discountPrice = "Discount price cannot exceed the original price"
                }
                break
            case "publish":
                // No required fields for draft
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    // ── Load pre-built course data (e.g. ACCA) ──────────────
    const loadCourseData = useCallback((data: CourseFormData) => {
        setFormData(data)
        setErrors({})
        setCurrentStep("basic-info")
    }, [])

    return {
        formData,
        currentStep,
        currentStepIndex,
        steps,
        errors,
        isSubmitting,
        stats,
        setIsSubmitting,
        goToStep,
        goNext,
        goPrev,
        updateField,
        updateName,
        addSection,
        updateSection,
        deleteSection,
        toggleSectionCollapse,
        reorderSections,
        addLecture,
        updateLecture,
        deleteLecture,
        reorderLectures,
        addResource,
        updateResource,
        deleteResource,
        validateStep,
        loadCourseData,
    }
}

