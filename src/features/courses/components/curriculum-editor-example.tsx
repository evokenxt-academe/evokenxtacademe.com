"use client";

/**
 * Example: Course Curriculum Editor
 *
 * Demonstrates how to use the courses feature hooks for:
 * - Fetching a course with full curriculum tree
 * - Adding/deleting sections and lectures
 * - Reordering sections via drag-and-drop
 * - Optimistic updates
 * - Error handling with toast
 */

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconTrash, IconGripVertical, IconAlertCircle } from "@tabler/icons-react";

import {
  useCourse,
  useAddSection,
  useDeleteSection,
  useAddLecture,
  useDeleteLecture,
  useReorderSections,
  useUpdateCourse,
  type CourseWithCurriculum,
  type PositionUpdate,
} from "@/features/courses";

interface CurriculumEditorProps {
  courseId: string;
}

export function CurriculumEditor({ courseId }: CurriculumEditorProps) {
  const { data: course, isLoading, error } = useCourse(courseId);

  const addSectionMutation = useAddSection();
  const deleteSectionMutation = useDeleteSection();
  const addLectureMutation = useAddLecture();
  const deleteLectureMutation = useDeleteLecture();
  const reorderSectionsMutation = useReorderSections();
  const updateCourseMutation = useUpdateCourse();

  // ── Loading state ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconAlertCircle />
              </EmptyMedia>
              <EmptyTitle>Failed to load course</EmptyTitle>
              <EmptyDescription>{error.message}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  if (!course) return null;

  // ── Handlers ───────────────────────────────────────────

  function handleAddSection() {
    addSectionMutation.mutate(
      {
        course_id: courseId,
        title: `Section ${(course?.sections.length ?? 0) + 1}`,
        position: course?.sections.length ?? 0,
      },
      {
        onSuccess: () => toast.success("Section added"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleDeleteSection(sectionId: string) {
    deleteSectionMutation.mutate(
      { sectionId, courseId },
      {
        onSuccess: () => toast.success("Section deleted"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleAddLecture(sectionId: string, lectureCount: number) {
    addLectureMutation.mutate(
      {
        payload: {
          section_id: sectionId,
          title: `Lecture ${lectureCount + 1}`,
          position: lectureCount,
        },
        courseId,
      },
      {
        onSuccess: () => toast.success("Lecture added"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleDeleteLecture(lectureId: string) {
    deleteLectureMutation.mutate(
      { lectureId, courseId },
      {
        onSuccess: () => toast.success("Lecture deleted"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  /**
   * Example: move a section from fromIndex to toIndex.
   * In a real app, this would be triggered by a drag-and-drop library.
   */
  function handleMoveSection(fromIndex: number, toIndex: number) {
    const reordered = [...course!.sections];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updates: PositionUpdate[] = reordered.map((s, i) => ({
      id: s.id,
      position: i,
    }));

    reorderSectionsMutation.mutate(
      { updates, courseId },
      {
        onError: (err) => toast.error(`Reorder failed: ${err.message}`),
      }
    );
  }

  /**
   * Example: optimistic course title update.
   */
  function handleUpdateTitle(newTitle: string) {
    updateCourseMutation.mutate(
      { courseId, payload: { name: newTitle } },
      {
        onSuccess: () => toast.success("Title updated"),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Course header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{course.name}</h2>
          <p className="text-sm text-muted-foreground">
            {course.sections.length} sections ·{" "}
            {course.sections.reduce((a, s) => a + s.lectures.length, 0)}{" "}
            lectures
          </p>
        </div>
        <Badge variant="secondary">{course.status}</Badge>
      </div>

      <Separator />

      {/* Sections */}
      {course.sections.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No sections yet</EmptyTitle>
            <EmptyDescription>
              Add your first section to start building the curriculum.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {course.sections.map((section, sIdx) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IconGripVertical className="size-4 cursor-grab text-muted-foreground" />
                  <CardTitle className="flex-1 text-sm">
                    {section.title}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {section.lectures.length} lectures
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete section ${section.title}`}
                    onClick={() => handleDeleteSection(section.id)}
                    disabled={deleteSectionMutation.isPending}
                  >
                    <IconTrash />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1" role="list">
                  {section.lectures.map((lecture) => (
                    <li
                      key={lecture.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <IconGripVertical className="size-3.5 cursor-grab text-muted-foreground" />
                        <span>{lecture.title}</span>
                        {lecture.is_preview && (
                          <Badge variant="outline">Preview</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{lecture.duration_sec}s</span>
                        <span>{lecture.resources.length} files</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete lecture ${lecture.title}`}
                          onClick={() => handleDeleteLecture(lecture.id)}
                          disabled={deleteLectureMutation.isPending}
                        >
                          <IconTrash />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    handleAddLecture(section.id, section.lectures.length)
                  }
                  disabled={addLectureMutation.isPending}
                >
                  <IconPlus data-icon="inline-start" />
                  Add Lecture
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add section */}
      <Button
        variant="outline"
        onClick={handleAddSection}
        disabled={addSectionMutation.isPending}
      >
        <IconPlus data-icon="inline-start" />
        Add Section
      </Button>
    </div>
  );
}
