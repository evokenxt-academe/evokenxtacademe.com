"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  IconDotsVertical,
  IconUpload,
  IconEyeOff,
  IconArchive,
  IconCopy,
  IconTrash,
  IconExternalLink,
  IconCheck,
  IconX,
  IconLoader2,
  IconLayoutSidebar,
  IconCloudUpload,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/admin/courses/status-badge";
import { PricingTab } from "./pricing-tab";
import {
  courseBaseSchema,
  type CourseFormValues,
} from "@/lib/validators/course";
import {
  fetchCourseById,
  updateCourse,
  deleteCourse,
  duplicateCourse,
  updateCourseStatus,
  fetchInstructors,
  checkSlugUnique,
  type CourseDetail,
  type Instructor,
} from "@/lib/supabase/queries/courses-admin";
import { createClient } from "@/lib/supabase/client";

import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/utils/video";
import { CoursePreviewCard } from "../../../new/_components/course-preview-card";
import { uploadResourceFile, type UploadProgress } from "@/features/admin/course/services/course-api";

interface EditCourseTabsProps {
  courseId: string;
}

export function EditCourseTabs({ courseId }: EditCourseTabsProps) {
  const router = useRouter();
  const [course, setCourse] = React.useState<CourseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("details");

  // Reference data
  const [instructors, setInstructors] = React.useState<Instructor[]>([]);

  // Saving states per tab
  const [savingTab, setSavingTab] = React.useState<string | null>(null);

  // Slug check
  const [slugStatus, setSlugStatus] = React.useState<"idle" | "checking" | "unique" | "taken">("idle");
  const slugTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const thumbInputRef = React.useRef<HTMLInputElement>(null);
  const [thumbUploading, setThumbUploading] = React.useState(false);
  const [thumbProgress, setThumbProgress] = React.useState<UploadProgress | null>(null);

  const previewInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUploading, setPreviewUploading] = React.useState(false);
  const [previewProgress, setPreviewProgress] = React.useState<UploadProgress | null>(null);

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const result = await uploadResourceFile(file, `thumb-${Date.now()}`, setThumbProgress);
      if (result.success && result.fileUrl) {
        form.setValue("thumbnail_url", result.fileUrl, { shouldDirty: true });
        toast.success("Thumbnail uploaded");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setThumbUploading(false);
      setThumbProgress(null);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    }
  };

  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUploading(true);
    try {
      const result = await uploadResourceFile(file, `preview-${Date.now()}`, setPreviewProgress);
      if (result.success && result.fileUrl) {
        form.setValue("preview_video_url", result.fileUrl, { shouldDirty: true });
        toast.success("Preview video uploaded");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setPreviewUploading(false);
      setPreviewProgress(null);
      if (previewInputRef.current) previewInputRef.current.value = "";
    }
  };

  const form = useForm<CourseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(courseBaseSchema) as any,
    defaultValues: {
      subject_id: "",
      instructor_id: "",
      title: "",
      slug: "",
      short_description: "",
      description: "",
      language: "en",
      status: "draft",
      is_featured: false,
      thumbnail_url: "",
      preview_video_url: "",
      what_you_learn: [],
      requirements: [],
    },
    mode: "onChange",
  });

  const watchedSlug = form.watch("slug");
  const dirtyFields = form.formState.dirtyFields;

  // Load course
  React.useEffect(() => {
    async function load() {
      try {
        const data = await fetchCourseById(courseId);
        setCourse(data);
        form.reset({
          subject_id: data.subject_id,
          instructor_id: data.instructor_id,
          title: data.title,
          slug: data.slug,
          short_description: data.short_description || "",
          description: data.description || "",
          language: data.language as "en" | "hi" | "hi-en",
          status: data.status,
          is_featured: data.is_featured,
          thumbnail_url: data.thumbnail_url || "",
          preview_video_url: data.preview_video_url || "",
          what_you_learn: data.what_you_learn || [],
          requirements: data.requirements || [],
        });
      } catch {
        toast.error("Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, form]);

  // Load reference data
  React.useEffect(() => {
    fetchInstructors().then(setInstructors).catch(console.error);
  }, []);

  // Realtime conflict detection
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`course-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "courses",
          filter: `id=eq.${courseId}`,
        },
        () => {
          toast("This course was updated in another session", {
            action: {
              label: "Reload",
              onClick: () => window.location.reload(),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  // Slug uniqueness check
  React.useEffect(() => {
    if (!watchedSlug || watchedSlug.length < 3 || watchedSlug === course?.slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    if (slugTimeout.current) clearTimeout(slugTimeout.current);
    slugTimeout.current = setTimeout(async () => {
      try {
        const isUnique = await checkSlugUnique(watchedSlug, courseId);
        setSlugStatus(isUnique ? "unique" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);
  }, [watchedSlug, courseId, course?.slug]);

  // Tab save handlers
  const saveTab = async (tab: string) => {
    setSavingTab(tab);
    try {
      const vals = form.getValues();
      let payload: Record<string, unknown> = {};

      switch (tab) {
        case "program":
          payload = {
            subject_id: vals.subject_id,
            instructor_id: vals.instructor_id,
          };
          break;
        case "details":
          payload = {
            title: vals.title,
            slug: vals.slug,
            short_description: vals.short_description || null,
            description: vals.description || null,
            language: vals.language,
            status: vals.status,
            is_featured: vals.is_featured,
          };
          break;
        case "media":
          payload = {
            thumbnail_url: vals.thumbnail_url || null,
            preview_video_url: vals.preview_video_url || null,
          };
          break;
        case "outcomes":
          payload = {
            what_you_learn: vals.what_you_learn,
            requirements: vals.requirements,
          };
          break;
      }

      await updateCourse(courseId, payload);
      toast.success("Changes saved");
      form.reset(vals); // Reset dirty state
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSavingTab(null);
    }
  };

  // Status actions
  const handleStatusChange = async (status: "draft" | "published" | "archived") => {
    try {
      await updateCourseStatus(courseId, status);
      form.setValue("status", status);
      setCourse((c) => (c ? { ...c, status } : c));
      toast.success(`Course ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDuplicate = async () => {
    try {
      const result = await duplicateCourse(courseId);
      toast.success("Course duplicated");
      router.push(`/admin/courses/${result.id}/edit`);
    } catch {
      toast.error("Failed to duplicate");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCourse(courseId);
      toast.success("Course deleted");
      router.push("/admin/courses");
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  // Tag inputs
  const [outcomeInput, setOutcomeInput] = React.useState("");
  const [requirementInput, setRequirementInput] = React.useState("");
  const whatYouLearn = form.watch("what_you_learn") || [];
  const requirements = form.watch("requirements") || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Course not found
      </div>
    );
  }

  const title = form.watch("title");
  const status = form.watch("status");
  const previewVideoUrl = form.watch("preview_video_url") || "";
  const ytId = previewVideoUrl ? extractYouTubeId(previewVideoUrl) : null;

  // Tab dirty indicators
  const isDetailsDirty = !!(dirtyFields.title || dirtyFields.slug || dirtyFields.short_description || dirtyFields.description || dirtyFields.language || dirtyFields.status || dirtyFields.is_featured);
  const isMediaDirty = !!(dirtyFields.thumbnail_url || dirtyFields.preview_video_url);
  const isOutcomesDirty = !!(dirtyFields.what_you_learn || dirtyFields.requirements);
  const isProgramDirty = !!(dirtyFields.subject_id || dirtyFields.instructor_id);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/courses/${courseId}/content`}>
              <IconLayoutSidebar data-icon="inline-start" />
              Content Builder
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/courses/${course?.slug}`} target="_blank" rel="noopener noreferrer">
              <IconExternalLink data-icon="inline-start" />
              View Course
            </a>
          </Button>
          <Button size="sm" onClick={() => saveTab(activeTab)}>
            {savingTab && <Spinner className="mr-2" />}
            Save All
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-8">
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {status !== "published" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("published")}>
                    <IconUpload data-icon="inline-start" />
                    Publish
                  </DropdownMenuItem>
                )}
                {status === "published" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("draft")}>
                    <IconEyeOff data-icon="inline-start" />
                    Unpublish
                  </DropdownMenuItem>
                )}
                {status !== "archived" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                    <IconArchive data-icon="inline-start" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDuplicate}>
                  <IconCopy data-icon="inline-start" />
                  Duplicate
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="program" className="gap-1.5">
            Program & Subject
            {isProgramDirty && <span className="size-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-1.5">
            Details
            {isDetailsDirty && <span className="size-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5">
            Media
            {isMediaDirty && <span className="size-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="gap-1.5">
            Outcomes
            {isOutcomesDirty && <span className="size-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Program Tab */}
        <TabsContent value="program">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="flex flex-col gap-2">
                <Label>Subject</Label>
                <p className="text-sm text-muted-foreground">
                  Current: {course.subject?.program_level?.program?.body} → {course.subject?.program_level?.label} → {course.subject?.name}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Instructor</Label>
                <Select
                  value={form.watch("instructor_id")}
                  onValueChange={(val) => form.setValue("instructor_id", val, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {instructors.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name} — {i.email}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => saveTab("program")}
                disabled={!isProgramDirty || !!savingTab}
              >
                {savingTab === "program" && <Spinner className="mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="flex flex-col gap-2">
                <Label>Course Title</Label>
                <Input {...form.register("title")} maxLength={150} />
                <span className="text-right text-xs text-muted-foreground tabular-nums">
                  {(title || "").length}/150
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">/courses/</span>
                  <div className="relative flex-1">
                    <Input {...form.register("slug")} className="pr-8" />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {slugStatus === "checking" && <IconLoader2 className="size-4 animate-spin text-muted-foreground" />}
                      {slugStatus === "unique" && <IconCheck className="size-4 text-green-500" />}
                      {slugStatus === "taken" && <IconX className="size-4 text-destructive" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Short Description</Label>
                <Textarea {...form.register("short_description")} rows={2} maxLength={200} />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Full Description</Label>
                <Textarea {...form.register("description")} rows={6} />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Language</Label>
                <Select
                  value={form.watch("language")}
                  onValueChange={(val) => form.setValue("language", val as "en" | "hi" | "hi-en", { shouldDirty: true })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="hi-en">Hinglish</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <RadioGroup
                  value={form.watch("status")}
                  onValueChange={(val) => form.setValue("status", val as "draft" | "published" | "archived", { shouldDirty: true })}
                  className="flex gap-3"
                >
                  <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 ${status === "draft" ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value="draft" />
                    <span className="text-sm font-medium">Draft</span>
                  </label>
                  <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 ${status === "published" ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value="published" />
                    <span className="text-sm font-medium">Published</span>
                  </label>
                  <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 ${status === "archived" ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value="archived" />
                    <span className="text-sm font-medium">Archived</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Featured Course</Label>
                  <p className="text-xs text-muted-foreground">Show in featured sections</p>
                </div>
                <Switch
                  checked={form.watch("is_featured")}
                  onCheckedChange={(val) => form.setValue("is_featured", val, { shouldDirty: true })}
                />
              </div>

              <Button
                onClick={() => saveTab("details")}
                disabled={!isDetailsDirty || !!savingTab}
              >
                {savingTab === "details" && <Spinner className="mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="flex flex-col gap-2">
                <Label>Thumbnail URL</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Input {...form.register("thumbnail_url")} placeholder="https://..." className="flex-1" />
                    <Button type="button" variant="outline" onClick={() => thumbInputRef.current?.click()}>
                      <IconCloudUpload className="mr-2 size-4" />
                      Upload Image
                    </Button>
                    <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={handleThumbUpload} />
                  </div>
                  {thumbUploading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconLoader2 className="size-3 animate-spin" />
                      Uploading... {thumbProgress?.progress}%
                    </div>
                  )}
                  {form.watch("thumbnail_url") && (
                    <img
                      src={form.watch("thumbnail_url")}
                      alt="Thumbnail"
                      className="mt-1 aspect-video w-64 rounded-md object-cover border shadow-sm"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Preview Video URL</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Input {...form.register("preview_video_url")} placeholder="https://youtube.com/watch?v=..." className="flex-1" />
                    <Button type="button" variant="outline" onClick={() => previewInputRef.current?.click()}>
                      <IconCloudUpload className="mr-2 size-4" />
                      Upload Video
                    </Button>
                    <input type="file" ref={previewInputRef} className="hidden" accept="video/*" onChange={handlePreviewUpload} />
                  </div>
                  {previewUploading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconLoader2 className="size-3 animate-spin" />
                      Uploading... {previewProgress?.progress}%
                    </div>
                  )}
                  {ytId ? (
                    <img
                      src={getYouTubeThumbnail(ytId)}
                      alt="Video preview"
                      className="mt-1 aspect-video w-64 rounded-md object-cover border shadow-sm"
                    />
                  ) : form.watch("preview_video_url") && form.watch("preview_video_url").includes("cloudflare") ? (
                    <video
                      src={form.watch("preview_video_url")}
                      controls
                      className="mt-1 aspect-video w-64 rounded-md object-cover border shadow-sm"
                    />
                  ) : null}
                </div>
              </div>

              <Button
                onClick={() => saveTab("media")}
                disabled={!isMediaDirty || !!savingTab || thumbUploading || previewUploading}
              >
                {savingTab === "media" && <Spinner className="mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outcomes Tab */}
        <TabsContent value="outcomes">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-6">
              {/* What You'll Learn */}
              <div className="flex flex-col gap-2">
                <Label>What You&apos;ll Learn</Label>
                <div className="flex flex-col gap-2">
                  {whatYouLearn.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <span className="flex-1 text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = whatYouLearn.filter((_, i) => i !== idx);
                          form.setValue("what_you_learn", next, { shouldDirty: true });
                        }}
                        className="rounded p-0.5 hover:bg-muted"
                      >
                        <IconX className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={outcomeInput}
                    onChange={(e) => setOutcomeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (outcomeInput.trim()) {
                          form.setValue("what_you_learn", [...whatYouLearn, outcomeInput.trim()], { shouldDirty: true });
                          setOutcomeInput("");
                        }
                      }
                    }}
                    placeholder="Add outcome and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (outcomeInput.trim()) {
                        form.setValue("what_you_learn", [...whatYouLearn, outcomeInput.trim()], { shouldDirty: true });
                        setOutcomeInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Requirements */}
              <div className="flex flex-col gap-2">
                <Label>Requirements / Prerequisites</Label>
                <div className="flex flex-col gap-2">
                  {requirements.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <span className="flex-1 text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = requirements.filter((_, i) => i !== idx);
                          form.setValue("requirements", next, { shouldDirty: true });
                        }}
                        className="rounded p-0.5 hover:bg-muted"
                      >
                        <IconX className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (requirementInput.trim()) {
                          form.setValue("requirements", [...requirements, requirementInput.trim()], { shouldDirty: true });
                          setRequirementInput("");
                        }
                      }
                    }}
                    placeholder="Add requirement and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (requirementInput.trim()) {
                        form.setValue("requirements", [...requirements, requirementInput.trim()], { shouldDirty: true });
                        setRequirementInput("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => saveTab("outcomes")}
                disabled={!isOutcomesDirty || !!savingTab}
              >
                {savingTab === "outcomes" && <Spinner className="mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <PricingTab courseId={courseId} />
        </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-6">
          <div className="sticky top-6">
            <CoursePreviewCard values={form.watch()} />
            
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Course ID</span>
                    <code className="text-xs font-mono bg-muted p-2 rounded truncate">{courseId}</code>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Last Updated</span>
                    <span className="text-sm">{new Date(course.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{course.title}&quot; and all its
              content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
