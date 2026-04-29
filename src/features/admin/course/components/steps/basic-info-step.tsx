"use client"

import { useCallback, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    IconInfoCircle,
    IconPhoto,
    IconX,
} from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/file-uploader"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import type { CourseFormData, CourseLevel } from "../../types/course"
import { adminApi } from "@/features/admin/lib/admin-api"

interface BasicInfoStepProps {
    formData: CourseFormData
    errors: Record<string, string>
    updateField: <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => void
    updateName: (name: string) => void
}

const LEVEL_OPTIONS: { value: CourseLevel; label: string; color: string }[] = [
    { value: "knowledge", label: "Knowledge Level", color: "bg-emerald-500/10 text-emerald-600" },
    { value: "skills", label: "Skills Level", color: "bg-amber-500/10 text-amber-600" },
    { value: "professional", label: "Professional Level", color: "bg-rose-500/10 text-rose-600" },
]

export function BasicInfoStep({
    formData,
    errors,
    updateField,
    updateName,
}: BasicInfoStepProps) {
    const [thumbnailPreview, setThumbnailPreview] = useState<string>(
        formData.thumbnailUrl || ""
    )
    const { data: usersData } = useQuery({
        queryKey: ["admin-users-for-course-form"],
        queryFn: adminApi.getUsers,
    })
    const instructors = (usersData?.users ?? []).filter((user) =>
        user.role === "instructor" || user.role === "admin",
    )

    const removeThumbnail = useCallback(() => {
        setThumbnailPreview("")
        updateField("thumbnailFile", null)
        updateField("thumbnailUrl", "")
    }, [updateField])

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconInfoCircle className="size-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Basic Information</h2>
                    <p className="text-sm text-muted-foreground">
                        Set the foundation for your course
                    </p>
                </div>
            </div>

            <FieldGroup>
                {/* Course Title */}
                <Field data-invalid={!!errors.name || undefined}>
                    <FieldLabel htmlFor="course-name">
                        Course Title
                        <Badge variant="destructive" className="ml-1.5 text-[10px]">
                            Required
                        </Badge>
                    </FieldLabel>
                    <Input
                        id="course-name"
                        placeholder="e.g. ACCA Complete Professional Qualification"
                        value={formData.name}
                        onChange={(e) => updateName(e.target.value)}
                        aria-invalid={!!errors.name}
                        className="h-10"
                    />
                    {errors.name ? (
                        <FieldDescription className="text-destructive">
                            {errors.name}
                        </FieldDescription>
                    ) : (
                        <FieldDescription>
                            A clear, compelling title helps students find your course
                        </FieldDescription>
                    )}
                    {formData.slug && (
                        <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5">
                            <span className="text-xs text-muted-foreground">URL:</span>
                            <code className="text-xs font-medium text-primary">
                                /courses/{formData.slug}
                            </code>
                        </div>
                    )}
                </Field>

                {/* Description */}
                <Field data-invalid={!!errors.description || undefined}>
                    <FieldLabel htmlFor="course-description">
                        Description
                        <Badge variant="destructive" className="ml-1.5 text-[10px]">
                            Required
                        </Badge>
                    </FieldLabel>
                    <Textarea
                        id="course-description"
                        placeholder="Describe what students will learn, prerequisites, and course outcomes..."
                        value={formData.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        aria-invalid={!!errors.description}
                        rows={5}
                        className="resize-y"
                    />
                    <div className="flex items-center justify-between">
                        {errors.description ? (
                            <FieldDescription className="text-destructive">
                                {errors.description}
                            </FieldDescription>
                        ) : (
                            <FieldDescription>
                                Use rich detail — this appears on your course landing page
                            </FieldDescription>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {formData.description.length} characters
                        </span>
                    </div>
                </Field>

                {/* Level */}
                <Field>
                    <FieldLabel htmlFor="course-level">Difficulty Level</FieldLabel>
                    <Select
                        value={formData.level}
                        onValueChange={(val) => updateField("level", val as CourseLevel)}
                    >
                        <SelectTrigger id="course-level" className="w-full">
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {LEVEL_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FieldDescription>
                        Helps students find courses matching their skill level
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="course-instructor">Instructor</FieldLabel>
                    <Select
                        value={formData.instructorId}
                        onValueChange={(value) => updateField("instructorId", value)}
                    >
                        <SelectTrigger id="course-instructor" className="w-full">
                            <SelectValue placeholder="Assign instructor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {instructors.map((instructor) => (
                                    <SelectItem key={instructor.id} value={instructor.id}>
                                        {instructor.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FieldDescription>
                        Assign ownership for this course in the admin panel.
                    </FieldDescription>
                </Field>

                {/* Thumbnail Upload */}
                <Field>
                    <FieldLabel>Course Thumbnail</FieldLabel>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {/* Preview */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 sm:w-64">
                            {thumbnailPreview ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={thumbnailPreview}
                                        alt="Course thumbnail preview"
                                        className="size-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute right-2 top-2 size-7"
                                        onClick={removeThumbnail}
                                    >
                                        <IconX data-icon="inline-start" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex size-full flex-col items-center justify-center gap-2 p-4">
                                    <IconPhoto className="size-8 text-muted-foreground/50" />
                                    <p className="text-center text-xs text-muted-foreground">
                                        16:9 ratio recommended
                                        <br />
                                        1280×720px minimum
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Upload Button */}
                        <div className="flex w-full max-w-sm flex-col gap-2">
                            <FileUploader
                                accept="image/jpeg,image/png,image/webp"
                                maxSizeMB={10}
                                folder="course-thumbnails"
                                onUploadComplete={(url) => {
                                    setThumbnailPreview(url)
                                    updateField("thumbnailUrl", url)
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG or WebP. Max 10MB.
                            </p>
                        </div>
                    </div>
                </Field>
            </FieldGroup>
        </div>
    )
}
