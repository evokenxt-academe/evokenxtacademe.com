"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CourseOption, StreamQuality, StreamVisibility } from "@/types/live-stream";
import { streamControlPath } from "@/lib/live-stream/admin-paths";
import Link from "next/link";

type ScheduleStreamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string;
  onCreated?: (streamId: string) => void;
};



export function ScheduleStreamDialog({
  open,
  onOpenChange,
  courseId: fixedCourseId,
  onCreated,
}: ScheduleStreamDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseOpen, setCourseOpen] = useState(false);
  const [ytStatus, setYtStatus] = useState<{
    connected: boolean;
    expired?: boolean;
    channel?: { channelName: string } | null;
  }>({ connected: false });


  const [form, setForm] = useState({
    title: "",
    courseId: "",
    description: "",
    visibility: "unlisted" as StreamVisibility,
    scheduledDate: "",
    scheduledTime: "",
    enableDvr: true,
    enableChat: true,
    chatModeration: false,
    maxQuality: "1080p" as StreamQuality,
    categoryId: "27",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;

    if (fixedCourseId) {
      setForm((f) => ({ ...f, courseId: fixedCourseId }));
    }

    const load = async () => {
      let query = supabase
        .from("courses")
        .select(`
          id, title,
          subjects(name, code,
            program_levels(label,
              programs(body)
            )
          )
        `);

      if (fixedCourseId) {
        query = query.eq("id", fixedCourseId);
      } else {
        query = query.order("title");
      }

      const { data } = await query;

      setCourses(
        (data ?? []).map((c: Record<string, unknown>) => {
          const subjects = c.subjects as Record<string, unknown> | null;
          const programLevels = subjects?.program_levels as Record<string, unknown> | null;
          const programs = programLevels?.programs as Record<string, unknown> | null;
          return {
            id: c.id as string,
            title: c.title as string,
            programBody: (programs?.body as string) ?? "",
            subjectCode: (subjects?.code as string) ?? "",
            subjectName: (subjects?.name as string) ?? "",
          };
        }),
      );

      try {
        const res = await fetch("/api/youtube/status");
        if (res.ok) setYtStatus(await res.json());
      } catch {
        /* ignore */
      }
    };

    load();
  }, [open, supabase, fixedCourseId]);

  const selectedCourse = courses.find((c) => c.id === form.courseId);



  const handleSubmit = async () => {
    if (!form.title.trim() || !form.courseId || !form.scheduledDate || !form.scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const scheduledAt = `${form.scheduledDate}T${form.scheduledTime}:00`;

      const { data: stream, error } = await supabase
        .from("live_streams")
        .insert({
          course_id: form.courseId,
          instructor_id: user.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          visibility: form.visibility,
          scheduled_at: scheduledAt,
          tags: [],
          enable_dvr: form.enableDvr,
          enable_chat: form.enableChat,
          chat_moderation: form.chatModeration,
          max_quality: form.maxQuality,
          category_id: parseInt(form.categoryId, 10),
          notes: form.notes.trim() || null,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success(`Stream scheduled (ID: ${stream.id.slice(0, 8)}…)`);
      onOpenChange(false);
      if (onCreated) {
        onCreated(stream.id);
      } else if (form.courseId) {
        router.push(streamControlPath(form.courseId, stream.id));
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to create stream");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="flex flex-col gap-5">
      {/* YouTube OAuth Banner */}
      <Alert variant={ytStatus.connected && !ytStatus.expired ? "default" : "destructive"}>
        <AlertCircle className="size-4" />
        <AlertTitle className="flex items-center gap-2">
          YouTube Connection
          {ytStatus.connected && !ytStatus.expired ? (
            <Badge className="bg-green-600">Connected ✓</Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              Not Connected
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {ytStatus.connected && !ytStatus.expired
              ? `Linked to ${ytStatus.channel?.channelName ?? "your channel"}`
              : "Connect YouTube to create broadcasts from the control room."}
          </span>
          {(!ytStatus.connected || ytStatus.expired) && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/youtube/connect?from=${encodeURIComponent(pathname)}`}>Connect YouTube Account</Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="ACCA F3 — Live Revision Session"
        />
      </div>

      {!fixedCourseId && (
        <div className="flex flex-col gap-2">
          <Label>
            Course <span className="text-destructive">*</span>
          </Label>
          <Popover open={courseOpen} onOpenChange={setCourseOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                {selectedCourse
                  ? `${selectedCourse.programBody} · ${selectedCourse.subjectCode} · ${selectedCourse.title}`
                  : "Select course…"}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search courses…" />
                <CommandList>
                  <CommandEmpty>No courses found.</CommandEmpty>
                  <CommandGroup>
                    {courses.map((course) => (
                      <CommandItem
                        key={course.id}
                        value={`${course.programBody} ${course.subjectCode} ${course.title}`}
                        onSelect={() => {
                          setForm((f) => ({ ...f, courseId: course.id }));
                          setCourseOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            form.courseId === course.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">
                          {course.programBody} · {course.subjectCode} · {course.title}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Visibility</Label>
        <RadioGroup
          value={form.visibility}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, visibility: v as StreamVisibility }))
          }
          className="flex flex-col gap-2 sm:flex-row sm:gap-4"
        >
          {(["public", "unlisted", "private"] as const).map((v) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem value={v} id={`vis-${v}`} />
              <Label htmlFor={`vis-${v}`} className="capitalize font-normal cursor-pointer">
                {v}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">
            Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            value={form.scheduledDate}
            onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="time">
            Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time"
            type="time"
            value={form.scheduledTime}
            onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="chat">Enable Chat</Label>
          <Switch
            id="chat"
            checked={form.enableChat}
            onCheckedChange={(v) => setForm((f) => ({ ...f, enableChat: v }))}
          />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Scheduling…
          </>
        ) : (
          "Schedule Stream"
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader>
            <DrawerTitle>Schedule Live Stream</DrawerTitle>
            <DrawerDescription>Create a new scheduled broadcast</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Live Stream</DialogTitle>
          <DialogDescription>Create a new scheduled broadcast</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
