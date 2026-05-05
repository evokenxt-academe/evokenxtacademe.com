"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconGripVertical,
  IconChevronRight,
  IconChevronDown,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconPlayerPlay,
  IconEye,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  createChapter,
  createLecture,
  deleteChapter,
  deleteLecture,
  reorderChapters,
  reorderLectures,
  updateChapter,
  type Chapter,
  type Lecture,
} from "@/lib/supabase/queries/courses-admin";
import { formatDuration } from "@/lib/utils/video";

interface ChapterListProps {
  courseId: string;
  chapters: Chapter[];
  onChaptersChange: (chapters: Chapter[]) => void;
  onSelectChapter: (chapter: Chapter) => void;
  onSelectLecture: (lecture: Lecture, chapter: Chapter) => void;
  selectedId: string | null;
}

function SortableChapterRow({
  chapter,
  isSelected,
  onSelect,
  onSelectLecture,
  selectedId,
  onAddLecture,
  onDeleteChapter,
  onTogglePublished,
  onReorderLectures,
  onDeleteLecture,
}: {
  chapter: Chapter;
  isSelected: boolean;
  onSelect: () => void;
  onSelectLecture: (lecture: Lecture) => void;
  selectedId: string | null;
  onAddLecture: () => void;
  onDeleteChapter: () => void;
  onTogglePublished: (val: boolean) => void;
  onReorderLectures: (chapterId: string, orderedIds: string[]) => void;
  onDeleteLecture: (lectureId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lectures = chapter.lectures || [];

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div
          className={`flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors ${isSelected ? "bg-accent" : "hover:bg-muted"
            }`}
        >
          <button {...attributes} {...listeners} className="cursor-grab p-0.5">
            <IconGripVertical className="size-4 text-muted-foreground" />
          </button>

          <CollapsibleTrigger asChild>
            <button className="p-0.5">
              {expanded ? (
                <IconChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <IconChevronRight className="size-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <button
            onClick={onSelect}
            className="flex-1 truncate text-left text-sm font-medium"
          >
            {chapter.title}
          </button>

          <Switch
            checked={chapter.is_published}
            onCheckedChange={onTogglePublished}
            className="scale-75"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6">
                <IconDotsVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onSelect}>
                  <IconPencil data-icon="inline-start" />
                  Edit Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddLecture}>
                  <IconPlus data-icon="inline-start" />
                  Add Lecture
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <IconTrash data-icon="inline-start" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this chapter? All lectures within will be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteChapter} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent>
          <div className="ml-6 flex flex-col gap-0.5 border-l py-1 pl-3">
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                className={`group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors ${selectedId === lecture.id ? "bg-accent" : "hover:bg-muted"
                  }`}
              >
                <button
                  onClick={() => onSelectLecture(lecture)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <IconPlayerPlay className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm" title={lecture.title}>
                    {lecture.title.length > 10 ? `${lecture.title.substring(0, 10)}...` : lecture.title}
                  </span>
                  <div className="flex items-center gap-1">
                    {lecture.is_preview && (
                      <IconEye className="size-3 text-muted-foreground" />
                    )}
                    {lecture.duration_sec > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDuration(lecture.duration_sec)}
                      </span>
                    )}
                  </div>
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:bg-destructive/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Lecture?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this lecture. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLecture(lecture.id);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {lectures.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">No lectures</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function ChapterList({
  courseId,
  chapters,
  onChaptersChange,
  onSelectChapter,
  onSelectLecture,
  selectedId,
}: ChapterListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(chapters, oldIndex, newIndex);
    onChaptersChange(reordered);

    try {
      await reorderChapters(courseId, reordered.map((c) => c.id));
    } catch {
      toast.error("Failed to reorder chapters");
      onChaptersChange(chapters); // revert
    }
  };

  const handleAddChapter = async () => {
    try {
      const newChapter = await createChapter(courseId, "New Chapter", chapters.length);
      onChaptersChange([...chapters, { ...newChapter, lectures: [] }]);
      toast.success("Chapter added");
    } catch {
      toast.error("Failed to add chapter");
    }
  };

  const handleAddLecture = async (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    try {
      const lectureCount = chapter.lectures?.length || 0;
      const newLecture = await createLecture(chapterId, "New Lecture", lectureCount);
      const updatedChapters = chapters.map((c) =>
        c.id === chapterId
          ? { ...c, lectures: [...(c.lectures || []), newLecture] }
          : c
      );
      onChaptersChange(updatedChapters);
      toast.success("Lecture added");
    } catch {
      toast.error("Failed to add lecture");
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await deleteChapter(chapterId);
      onChaptersChange(chapters.filter((c) => c.id !== chapterId));
      toast.success("Chapter deleted");
    } catch {
      toast.error("Failed to delete chapter");
    }
  };

  const handleDeleteLecture = async (chapterId: string, lectureId: string) => {
    try {
      await deleteLecture(lectureId);
      const updatedChapters = chapters.map((c) =>
        c.id === chapterId
          ? { ...c, lectures: c.lectures?.filter((l) => l.id !== lectureId) || [] }
          : c
      );
      onChaptersChange(updatedChapters);
      toast.success("Lecture deleted");
    } catch {
      toast.error("Failed to delete lecture");
    }
  };

  const handleTogglePublished = async (chapterId: string, isPublished: boolean) => {
    try {
      await updateChapter(chapterId, { is_published: isPublished } as Partial<Chapter>);
      onChaptersChange(
        chapters.map((c) =>
          c.id === chapterId ? { ...c, is_published: isPublished } : c
        )
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleReorderLectures = async (chapterId: string, orderedIds: string[]) => {
    try {
      await reorderLectures(chapterId, orderedIds);
    } catch {
      toast.error("Failed to reorder lectures");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={chapters.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {chapters.map((chapter) => (
            <SortableChapterRow
              key={chapter.id}
              chapter={chapter}
              isSelected={selectedId === chapter.id}
              onSelect={() => onSelectChapter(chapter)}
              onSelectLecture={(lecture) => onSelectLecture(lecture, chapter)}
              selectedId={selectedId}
              onAddLecture={() => handleAddLecture(chapter.id)}
              onDeleteChapter={() => handleDeleteChapter(chapter.id)}
              onTogglePublished={(val) => handleTogglePublished(chapter.id, val)}
              onReorderLectures={handleReorderLectures}
              onDeleteLecture={(lectureId) => handleDeleteLecture(chapter.id, lectureId)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddChapter}
        className="mt-2 w-full border-dashed"
      >
        <IconPlus data-icon="inline-start" />
        Add Chapter
      </Button>
    </div>
  );
}
