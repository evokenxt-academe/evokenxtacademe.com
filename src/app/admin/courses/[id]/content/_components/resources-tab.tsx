"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IconPlus, IconTrash, IconFile, IconX, IconUpload, IconCloudUpload, IconCheck, IconEye } from "@tabler/icons-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  fetchLectureResources,
  addLectureResource,
  deleteLectureResource,
  type LectureResource,
} from "@/lib/supabase/queries/courses-admin";
import { uploadResourceFile, type UploadProgress } from "@/features/admin/course/services/course-api";

interface ResourcesTabProps {
  lectureId: string;
}

const fileTypeIcons: Record<string, string> = {
  pdf: "📄",
  video: "🎬",
  slide: "📊",
  spreadsheet: "📋",
  link: "🔗",
  image: "🖼️",
  audio: "🎵",
  zip: "📦",
};

function ResourceRow({ resource, onDelete }: { resource: LectureResource; onDelete: (id: string) => void }) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const isPdf = resource.file_type === "pdf";

  return (
    <>
      <div className="flex items-center gap-3 rounded-md border px-3 py-2">
        <span className="text-lg">{fileTypeIcons[resource.file_type] || "📎"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{resource.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-[10px]">
              {resource.file_type}
            </Badge>
            {resource.file_size_kb && (
              <span className="text-xs text-muted-foreground">
                {(resource.file_size_kb / 1024).toFixed(1)} MB
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setPreviewOpen(true)}
          >
            <IconEye className="mr-1.5 size-3.5" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(resource.id)}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[95vh] w-[95vw] max-w-[95vw] flex-col overflow-hidden p-0 sm:max-w-[1200px]">
          {resource.file_url && (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-5 py-3 bg-muted/30">
                <div>
                  <DialogTitle className="text-base font-semibold">
                    {resource.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Resource Preview
                  </DialogDescription>
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {resource.file_type}
                </Badge>
              </div>
              <div className="flex-1 bg-black/5 relative">
                <iframe
                  title={resource.title}
                  src={resource.file_url + (isPdf ? "#toolbar=0&navpanes=0" : "")}
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t px-5 py-3 bg-muted/30">
                <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ResourcesTab({ lectureId }: ResourcesTabProps) {
  const [resources, setResources] = React.useState<LectureResource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [newResource, setNewResource] = React.useState({
    title: "",
    file_url: "",
    file_type: "pdf" as string,
    file_size_kb: "",
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = React.useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File must be under 50MB");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const result = await uploadResourceFile(
        file,
        newResource.title || file.name.replace(/\.[^.]+$/, ""),
        (p) => setUploadProgress(p)
      );

      if (result.success) {
        setNewResource((prev) => ({
          ...prev,
          file_url: result.fileUrl,
          title: prev.title || file.name.replace(/\.[^.]+$/, ""),
          file_size_kb: Math.round(file.size / 1024).toString(),
          file_type: file.type.startsWith("image/") ? "image" : (file.type === "application/pdf" ? "pdf" : prev.file_type)
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

  const loadResources = React.useCallback(async () => {
    try {
      const data = await fetchLectureResources(lectureId);
      setResources(data);
    } catch {
      console.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [lectureId]);

  React.useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleAdd = async () => {
    if (!newResource.title || !newResource.file_url) {
      toast.error("Title and URL are required");
      return;
    }
    setSaving(true);
    try {
      await addLectureResource({
        lecture_id: lectureId,
        title: newResource.title,
        file_url: newResource.file_url,
        file_type: newResource.file_type,
        file_size_kb: newResource.file_size_kb ? Number(newResource.file_size_kb) : null,
        position: resources.length,
      });
      toast.success("Resource added");
      setShowForm(false);
      setNewResource({ title: "", file_url: "", file_type: "pdf", file_size_kb: "" });
      loadResources();
    } catch {
      toast.error("Failed to add resource");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLectureResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resource removed");
    } catch {
      toast.error("Failed to remove resource");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading resources...</p>
      ) : resources.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <IconFile className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No resources yet</p>
        </div>
      ) : (
        resources.map((resource) => (
          <ResourceRow key={resource.id} resource={resource} onDelete={handleDelete} />
        ))
      )}

      {showForm && (
        <div className="flex flex-col gap-3 rounded-md border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Title</Label>
              <Input
                value={newResource.title}
                onChange={(e) => setNewResource((r) => ({ ...r, title: e.target.value }))}
                placeholder="Resource title"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">File Type</Label>
              <Select
                value={newResource.file_type}
                onValueChange={(val) => setNewResource((r) => ({ ...r, file_type: val }))}
              >
                <SelectTrigger>
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
          </div>
          <div className="flex flex-col gap-2 border rounded-md p-3 bg-muted/20">
            <Label className="text-xs">File Upload</Label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            
            {newResource.file_url ? (
              <div className="flex items-center justify-between bg-background p-2 rounded border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <IconCheck className="size-4 text-green-500 shrink-0" />
                  <span className="text-xs truncate">{newResource.file_url}</span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={() => setNewResource(prev => ({ ...prev, file_url: "", file_size_kb: "" }))}
                >
                  <IconX className="size-3" />
                </Button>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Uploading...</span>
                  <span className="text-primary">{uploadProgress?.percent || 0}%</span>
                </div>
                <Progress value={uploadProgress?.percent || 0} className="h-2" />
                {uploadProgress && uploadProgress.speed > 0 && (
                  <span className="text-[10px] text-muted-foreground text-right">
                    {uploadProgress.speedLabel}
                  </span>
                )}
              </div>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full text-xs h-8 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload className="size-3 mr-2" />
                Choose File (Max 50MB)
              </Button>
            )}
            {uploadError && <span className="text-[11px] text-destructive">{uploadError}</span>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              Add
            </Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="border-dashed">
          <IconPlus data-icon="inline-start" />
          Add Resource
        </Button>
      )}
    </div>
  );
}
