"use client"

import {
    IconRocket,
    IconEye,
    IconNotebook,
    IconClock,
    IconFileText,
    IconLayersIntersect,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Field,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field"
import type { CourseFormData, CourseStatus } from "../../types/course"

interface PublishStepProps {
    formData: CourseFormData
    updateField: <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => void
    stats: {
        totalSections: number
        totalLectures: number
        totalDuration: number
        totalResources: number
    }
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
}

export function PublishStep({
    formData,
    updateField,
    stats,
}: PublishStepProps) {
    const isPublished = formData.status === "published"

    // Readiness checks
    const checks = [
        { label: "Course title", ok: !!formData.name.trim() },
        { label: "Course description", ok: !!formData.description.trim() },
        { label: "Thumbnail uploaded", ok: !!formData.thumbnailUrl },
        { label: "At least 1 section", ok: stats.totalSections > 0 },
        { label: "At least 1 lecture", ok: stats.totalLectures > 0 },
    ]
    const passedChecks = checks.filter((c) => c.ok).length
    const allPassed = passedChecks === checks.length

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconRocket className="size-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Publish Settings</h2>
                    <p className="text-sm text-muted-foreground">
                        Review your course and go live
                    </p>
                </div>
            </div>

            {/* Readiness Checklist */}
            <div className="rounded-xl border bg-muted/30 p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Publish Readiness</h3>
                    <Badge variant={allPassed ? "default" : "secondary"}>
                        {passedChecks}/{checks.length}
                    </Badge>
                </div>
                <div className="flex flex-col gap-2.5">
                    {checks.map((check) => (
                        <div
                            key={check.label}
                            className="flex items-center gap-2.5"
                        >
                            <div
                                className={`flex size-5 items-center justify-center rounded-full text-xs font-bold ${
                                    check.ok
                                        ? "bg-primary/15 text-primary"
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {check.ok ? "✓" : "·"}
                            </div>
                            <span
                                className={`text-sm ${
                                    check.ok
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {check.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Course Summary */}
            <div className="rounded-xl border p-5">
                <h3 className="mb-4 text-sm font-medium">Course Summary</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <SummaryItem
                        icon={<IconLayersIntersect className="size-4" />}
                        label="Sections"
                        value={stats.totalSections.toString()}
                    />
                    <SummaryItem
                        icon={<IconNotebook className="size-4" />}
                        label="Lectures"
                        value={stats.totalLectures.toString()}
                    />
                    <SummaryItem
                        icon={<IconClock className="size-4" />}
                        label="Duration"
                        value={formatDuration(stats.totalDuration)}
                    />
                    <SummaryItem
                        icon={<IconFileText className="size-4" />}
                        label="Resources"
                        value={stats.totalResources.toString()}
                    />
                </div>
            </div>

            <Separator />

            {/* Status Toggle */}
            <Field orientation="horizontal">
                <div className="flex flex-col gap-1">
                    <FieldLabel
                        htmlFor="course-status"
                        className="cursor-pointer text-base"
                    >
                        {isPublished ? (
                            <Badge variant="default">Published</Badge>
                        ) : (
                            <Badge variant="secondary">Draft</Badge>
                        )}
                    </FieldLabel>
                    <FieldDescription>
                        {isPublished
                            ? "Your course is live and visible to students"
                            : "Save as draft — only you can see this course"}
                    </FieldDescription>
                </div>
                <Switch
                    id="course-status"
                    checked={isPublished}
                    onCheckedChange={(checked) =>
                        updateField("status", checked ? "published" : "draft" as CourseStatus)
                    }
                />
            </Field>

            {/* Preview Button */}
            {formData.name && (
                <Button type="button" variant="outline" className="w-full">
                    <IconEye data-icon="inline-start" />
                    Preview Course Page
                </Button>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────

function SummaryItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <span className="text-lg font-semibold">{value}</span>
        </div>
    )
}
