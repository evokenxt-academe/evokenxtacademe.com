"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { IconChevronDown, IconPlus, IconTrash, IconFile, IconX, IconCloudUpload, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  fetchStudyMaterials,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
  type StudyMaterial,
} from "@/lib/supabase/queries/courses-admin";
import { uploadResourceFile, type UploadProgress } from "@/features/admin/course/services/course-api";

interface StudyMaterialsSectionProps {
  courseId: string;
}

const accessColors: Record<string, "default" | "secondary" | "outline"> = {
  free: "secondary",
  enrolled: "default",
  premium: "outline",
};

export function StudyMaterialsSection({ courseId }: StudyMaterialsSectionProps) {
  const [materials, setMaterials] = React.useState<StudyMaterial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [newMaterial, setNewMaterial] = React.useState({
    title: "",
    description: "",
    type: "pdf" as string,
    access_level: "enrolled" as string,
    file_url: "",
    file_size_kb: "",
    is_published: false,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = React.useState("");

  const loadMaterials = React.useCallback(async () => {
    try {
      const data = await fetchStudyMaterials(courseId);
      setMaterials(data);
    } catch {
      console.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1024) {
      setUploadError("File must be unde 1GB");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const result = await uploadResourceFile(
        file,
        newMaterial.title || file.name.replace(/\.[^.]+$/, ""),
        (p) => setUploadProgress(p)
      );

      if (result.success && result.fileUrl) {
        setNewMaterial((prev) => ({
          ...prev,
          file_url: result.fileUrl!,
          title: prev.title || file.name.replace(/\.[^.]+$/, ""),
          file_size_kb: Math.round(file.size / 1024).toString(),
          type: file.type.startsWith("image/") ? "image" : (file.type === "application/pdf" ? "pdf" : prev.type)
        }));
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (err) {
      setUploadError("Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAdd = async () => {
    if (!newMaterial.title || !newMaterial.file_url) {
      toast.error("Title and URL are required");
      return;
    }
    setSaving(true);
    try {
      await createStudyMaterial({
        course_id: courseId,
        chapter_id: null,
        title: newMaterial.title,
        description: newMaterial.description || null,
        type: newMaterial.type,
        access_level: newMaterial.access_level,
        file_url: newMaterial.file_url,
        file_size_kb: newMaterial.file_size_kb ? Number(newMaterial.file_size_kb) : null,
        is_published: newMaterial.is_published,
        position: materials.length,
      });
      toast.success("Study material added");
      setSheetOpen(false);
      setNewMaterial({
        title: "",
        description: "",
        type: "pdf",
        access_level: "enrolled",
        file_url: "",
        file_size_kb: "",
        is_published: false,
      });
      loadMaterials();
    } catch {
      toast.error("Failed to add material");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      await updateStudyMaterial(id, { is_published: isPublished });
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_published: isPublished } : m))
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudyMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success("Material removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
          <span>Study Materials ({materials.length})</span>
          <IconChevronDown
            className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""
              }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-1 pt-2">
            {materials.map((m) => (
              <div key={m.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                <IconFile className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm" title={m.title}>
                  {m.title.length > 15 ? `${m.title.substring(0, 15)}...` : m.title}
                </span>
                <Badge variant={accessColors[m.access_level]} className="text-[10px] uppercase">
                  {m.access_level}
                </Badge>
                <Switch
                  checked={m.is_published}
                  onCheckedChange={(val) => handleTogglePublished(m.id, val)}
                  className="scale-75"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this study material?")) {
                      handleDelete(m.id);
                    }
                  }}
                >
                  <IconTrash className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="mt-1 w-full justify-start text-muted-foreground"
            >
              <IconPlus data-icon="inline-start" />
              Add Material
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Add Material Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full flex flex-col h-full border-l shadow-2xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>Add Study Material</SheetTitle>
            <SheetDescription>
              Upload a file and configure access levels for your course study material.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex-1 overflow-y-auto p-5 -mr-2 flex flex-col gap-6">

            {/* File Upload Section */}
            <div className="flex flex-col gap-2 border rounded-xl p-5 bg-muted/5 shadow-sm">
              <Label className="text-base font-semibold">Material File</Label>
              <p className="text-sm text-muted-foreground mb-3">Upload a PDF, document, or image (Max 1GB).</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />

              {newMaterial.file_url ? (
                <div className="flex items-center justify-between bg-background p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <IconCheck className="size-5 text-green-500 shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm truncate font-medium">{newMaterial.title || "File uploaded successfully"}</span>
                      {newMaterial.file_size_kb && (
                        <span className="text-xs text-muted-foreground">
                          {(Number(newMaterial.file_size_kb) / 1024).toFixed(1)} MB • {newMaterial.type.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setNewMaterial(prev => ({ ...prev, file_url: "", file_size_kb: "" }))}
                  >
                    <IconX className="size-4" />
                  </Button>
                </div>
              ) : isUploading ? (
                <div className="flex flex-col gap-3 p-5 border rounded-lg bg-background shadow-sm">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <IconLoader2 className="size-4 animate-spin text-primary" />
                      Uploading to Cloudflare...
                    </span>
                    <span className="text-primary">{uploadProgress?.progress || 0}%</span>
                  </div>
                  <Progress value={uploadProgress?.progress || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress ? `${(uploadProgress.loaded / 1024 / 1024).toFixed(1)} MB of ${(uploadProgress.total / 1024 / 1024).toFixed(1)} MB` : "Starting upload..."}
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-2 py-10 bg-background hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                      <IconCloudUpload className="size-6" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium">Click to upload file</span>
                      <span className="text-xs text-muted-foreground">Supported formats: PDF, Video, Zip, Audio, Images</span>
                    </div>
                  </div>
                </Button>
              )}
              {uploadError && <p className="text-xs text-destructive mt-2">{uploadError}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Title</Label>
              <Input
                value={newMaterial.title}
                onChange={(e) => setNewMaterial((m) => ({ ...m, title: e.target.value }))}
                placeholder="e.g. Course Syllabus"
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Description (Optional)</Label>
              <Textarea
                value={newMaterial.description}
                onChange={(e) => setNewMaterial((m) => ({ ...m, description: e.target.value }))}
                rows={3}
                placeholder="Brief description of this material..."
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">File Type</Label>
                <Select
                  value={newMaterial.type}
                  onValueChange={(val) => setNewMaterial((m) => ({ ...m, type: val }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="zip">ZIP</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Access Level</Label>
                <Select
                  value={newMaterial.access_level}
                  onValueChange={(val) => setNewMaterial((m) => ({ ...m, access_level: val }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Publish Material</Label>
                <p className="text-xs text-muted-foreground">Make this material visible to students immediately.</p>
              </div>
              <Switch
                checked={newMaterial.is_published}
                onCheckedChange={(val) => setNewMaterial((m) => ({ ...m, is_published: val }))}
              />
            </div>
          </div>

          <div className="pt-5 pb-1 border-t mt-6 flex justify-end gap-3 bg-background">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving || isUploading}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving || isUploading || !newMaterial.file_url}>
              {saving ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Material"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
