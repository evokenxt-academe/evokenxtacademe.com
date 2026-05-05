"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { chapterSchema, type ChapterFormValues } from "@/lib/validators/course";
import { updateChapter, deleteChapter, type Chapter } from "@/lib/supabase/queries/courses-admin";
import { AutoSaveIndicator } from "./auto-save-indicator";

interface ChapterEditorProps {
  chapter: Chapter;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ChapterEditor({ chapter, onUpdate, onDelete }: ChapterEditorProps) {
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleting, setDeleting] = React.useState(false);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ChapterFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(chapterSchema) as any,
    defaultValues: {
      title: chapter.title,
      description: chapter.description || "",
      is_published: chapter.is_published,
    },
  });

  // Reset when chapter changes
  React.useEffect(() => {
    form.reset({
      title: chapter.title,
      description: chapter.description || "",
      is_published: chapter.is_published,
    });
  }, [chapter.id, chapter.title, chapter.description, chapter.is_published, form]);

  // Auto-save on field changes
  const watchedValues = form.watch();
  React.useEffect(() => {
    if (!form.formState.isDirty) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const vals = form.getValues();
        await updateChapter(chapter.id, {
          title: vals.title,
          description: vals.description || null,
          is_published: vals.is_published,
        } as Partial<Chapter>);
        setSaveStatus("saved");
        form.reset(vals);
        onUpdate();
      } catch {
        setSaveStatus("error");
      }
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.title, watchedValues.description, watchedValues.is_published]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteChapter(chapter.id);
      toast.success("Chapter deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete chapter");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Chapter
          </p>
          <h2 className="text-xl font-semibold">{chapter.title}</h2>
        </div>
        <AutoSaveIndicator status={saveStatus} onRetry={() => form.trigger()} />
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Chapter Title</Label>
          <Input {...form.register("title")} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Description</Label>
          <Textarea {...form.register("description")} rows={3} placeholder="Optional chapter description" />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label>Published</Label>
          <Switch
            checked={form.watch("is_published")}
            onCheckedChange={(val) => form.setValue("is_published", val, { shouldDirty: true })}
          />
        </div>
      </div>

      <Separator />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        className="self-start text-destructive hover:text-destructive"
      >
        {deleting && <Spinner className="mr-2" />}
        Delete Chapter
      </Button>
    </div>
  );
}
