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
  IconBrandYoutube,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  createChapter,
  deleteChapter,
  reorderChapters,
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
  onSyncComplete?: () => void;
}

function SortableChapterRow({
  chapter,
  isSelected,
  onSelect,
  onSelectLecture,
  selectedId,
  onDeleteChapter,
  onTogglePublished,
  onSyncChapter,
  syncingChapterId,
}: {
  chapter: Chapter;
  isSelected: boolean;
  onSelect: () => void;
  onSelectLecture: (lecture: Lecture) => void;
  selectedId: string | null;
  onDeleteChapter: () => void;
  onTogglePublished: (val: boolean) => void;
  onSyncChapter: () => void;
  syncingChapterId: string | null;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lectures = [...(chapter.lectures || [])].sort((a, b) => a.position - b.position);
  const hasPlaylist = !!chapter.youtube_playlist_id;
  const isSyncing = syncingChapterId === chapter.id;

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div
          className={`flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors ${
            isSelected ? "bg-accent" : "hover:bg-muted"
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
            className="flex flex-1 items-center gap-1.5 truncate text-left text-sm font-medium"
          >
            {hasPlaylist && (
              <IconBrandYoutube className="size-3.5 shrink-0 text-red-500" />
            )}
            <span className="truncate">{chapter.title}</span>
            {lectures.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                {lectures.length}
              </Badge>
            )}
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
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onSelect}>
                  <IconPencil data-icon="inline-start" />
                  Edit Section
                </DropdownMenuItem>
                {hasPlaylist && (
                  <DropdownMenuItem onClick={onSyncChapter} disabled={isSyncing}>
                    <IconRefresh
                      data-icon="inline-start"
                      className={isSyncing ? "animate-spin" : ""}
                    />
                    Sync Playlist
                  </DropdownMenuItem>
                )}
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
                      <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                      <AlertDialogDescription>
                        All synced lectures in this section will be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDeleteChapter}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
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
              <button
                key={lecture.id}
                type="button"
                onClick={() => onSelectLecture(lecture)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                  selectedId === lecture.id ? "bg-accent" : "hover:bg-muted"
                }`}
              >
                {lecture.thumbnail_url || lecture.yt_video_id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      lecture.thumbnail_url ||
                      `https://img.youtube.com/vi/${lecture.yt_video_id}/default.jpg`
                    }
                    alt=""
                    className="size-6 shrink-0 rounded object-cover"
                  />
                ) : (
                  <IconPlayerPlay className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate text-sm" title={lecture.title}>
                  {lecture.title}
                </span>
                <div className="flex shrink-0 items-center gap-1">
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
            ))}
            {lectures.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                {hasPlaylist ? "Sync playlist to import lectures" : "Link a playlist to sync"}
              </p>
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
  onSyncComplete,
}: ChapterListProps) {
  const [syncingChapterId, setSyncingChapterId] = React.useState<string | null>(null);

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
      toast.error("Failed to reorder sections");
      onChaptersChange(chapters);
    }
  };

  const handleAddChapter = async () => {
    try {
      const newChapter = await createChapter(courseId, "New Section", chapters.length);
      onChaptersChange([
        ...chapters,
        {
          ...newChapter,
          lectures: [],
          youtube_playlist_id: null,
          yt_sync_enabled: true,
          yt_last_synced_at: null,
          yt_sync_error: null,
        },
      ]);
      toast.success("Section added — link a YouTube playlist to start syncing");
    } catch {
      toast.error("Failed to add section");
    }
  };

  const handleSyncChapter = async (chapterId: string) => {
    setSyncingChapterId(chapterId);
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}/sync-youtube`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      const { result } = data;
      toast.success(
        `${result.lecturesCreated} new, ${result.lecturesUpdated} updated`
      );
      onSyncComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingChapterId(null);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await deleteChapter(chapterId);
      onChaptersChange(chapters.filter((c) => c.id !== chapterId));
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete section");
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
              onDeleteChapter={() => handleDeleteChapter(chapter.id)}
              onTogglePublished={(val) => handleTogglePublished(chapter.id, val)}
              onSyncChapter={() => handleSyncChapter(chapter.id)}
              syncingChapterId={syncingChapterId}
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
        Add Section
      </Button>
    </div>
  );
}
