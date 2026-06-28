"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
import {
  IconPlus,
  IconTrash,
  IconFile,
  IconX,
  IconUpload,
  IconCloudUpload,
  IconCheck,
  IconEye,
  IconBrandGoogleDrive,
  IconDeviceLaptop,
  IconSearch,
  IconChevronLeft,
  IconFolder,
  IconFolderOpen,
  IconLink,
  IconLoader2,
  IconChevronRight,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  fetchLectureResources,
  addLectureResource,
  deleteLectureResource,
  type LectureResource,
} from "@/lib/supabase/queries/courses-admin";
import {
  uploadResourceFile,
  type UploadProgress,
} from "@/features/admin/course/services/course-api";

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

function mapMimeTypeToResourceType(mimeType: string): string {
  if (!mimeType) return "pdf";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.google-apps.document" || mimeType.includes("wordprocessingml")) return "pdf";
  if (mimeType === "application/vnd.google-apps.presentation" || mimeType.includes("presentationml")) return "slide";
  if (mimeType === "application/vnd.google-apps.spreadsheet" || mimeType.includes("spreadsheetml")) return "spreadsheet";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "zip";
  return "link";
}

function getGoogleDrivePreviewUrl(url: string): { fileId: string; previewUrl: string } | null {
  const match = url.match(/(?:\/file\/d\/|\/document\/d\/|\/spreadsheets\/d\/|\/presentation\/d\/|id=)([a-zA-Z0-9_-]{25,110})/);
  if (match && match[1]) {
    const fileId = match[1];
    return {
      fileId,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`
    };
  }
  return null;
}

function getFilenameFromUrl(url: string): string {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? `Google Drive File (ID: ${match[1].slice(0, 8)}...)` : "Google Drive Document";
  }
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  return decodeURIComponent(lastPart.replace(/^\d+-[a-f0-9-]+-/, ""));
}



function ResourceRow({
  resource,
  onDelete,
}: {
  resource: LectureResource;
  onDelete: (id: string) => void;
}) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isPdf = resource.file_type === "pdf";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(resource.id);
      setShowDeleteConfirm(false);
      setPreviewOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-md border px-3 py-2">
        <span className="text-lg">
          {fileTypeIcons[resource.file_type] || "📎"}
        </span>
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
            onClick={() => setShowDeleteConfirm(true)}
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
                  src={
                    resource.file_url + (isPdf ? "#toolbar=0&navpanes=0" : "")
                  }
                  className="absolute inset-0 h-full w-full border-0"
                  allow="autoplay"
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t px-5 py-3 bg-muted/30">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <IconTrash className="size-3.5 mr-1.5" />
                  Delete
                </Button>
                <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{resource.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
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
  const [activeTab, setActiveTab] = React.useState<"computer" | "drive">("computer");
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
  const [dragActive, setDragActive] = React.useState(false);

  // Google Drive state
  const [pastedDriveUrl, setPastedDriveUrl] = React.useState("");
  const [driveStatus, setDriveStatus] = React.useState({
    connected: false,
    hasDriveScope: false,
    isExpired: false,
    loading: true,
    apiDisabled: false,
    apiDisabledMessage: "",
  });
  const [folderStack, setFolderStack] = React.useState<Array<{ id: string; name: string }>>([
    { id: "root", name: "My Drive" },
  ]);
  const [driveFiles, setDriveFiles] = React.useState<any[]>([]);
  const [driveLoading, setDriveLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [importingFileId, setImportingFileId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("google_success") === "true") {
        toast.success("Google Drive connected successfully!");
        setShowForm(true);
        setActiveTab("drive");
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  const checkDriveStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/google-drive/status");
      if (res.ok) {
        const data = await res.json();
        setDriveStatus({
          connected: data.connected,
          hasDriveScope: data.hasDriveScope,
          isExpired: data.isExpired,
          loading: false,
          apiDisabled: false,
          apiDisabledMessage: "",
        });
      } else {
        setDriveStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setDriveStatus((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "drive") {
      checkDriveStatus();
    }
  }, [activeTab, checkDriveStatus]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDriveFiles = React.useCallback(async (folderId: string, search: string) => {
    setDriveLoading(true);
    try {
      const url = new URL("/api/admin/google-drive/list", window.location.origin);
      url.searchParams.set("folderId", folderId);
      if (search) {
        url.searchParams.set("search", search);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      } else {
        const errData = await res.json();
        if (errData.error === "api_disabled") {
          setDriveStatus((prev) => ({
            ...prev,
            apiDisabled: true,
            apiDisabledMessage: errData.message,
          }));
        } else if (errData.error === "reauth_required") {
          setDriveStatus((prev) => ({ ...prev, connected: false }));
          toast.error("Google Drive connection expired. Please reconnect.");
        } else {
          toast.error(errData.message || "Failed to load Google Drive files");
        }
        console.warn("Failed to load Google Drive files:", errData.message);
      }
    } catch (err) {
      console.warn("Failed to load Google Drive files", err);
      toast.error("Network error when contacting Google Drive");
    } finally {
      setDriveLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (
      activeTab === "drive" &&
      driveStatus.connected &&
      driveStatus.hasDriveScope &&
      !driveStatus.isExpired
    ) {
      const currentFolderId = folderStack[folderStack.length - 1].id;
      fetchDriveFiles(currentFolderId, debouncedSearch);
    }
  }, [folderStack, debouncedSearch, activeTab, driveStatus.connected, driveStatus.hasDriveScope, driveStatus.isExpired, fetchDriveFiles]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileSelection = async (file: File) => {
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
        (p) => setUploadProgress(p),
      );

      if (result.success) {
        let detectedType = "pdf";
        if (file.type.startsWith("image/")) {
          detectedType = "image";
        } else if (file.type.startsWith("video/")) {
          detectedType = "video";
        } else if (file.type.startsWith("audio/")) {
          detectedType = "audio";
        } else if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
          detectedType = "spreadsheet";
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          detectedType = "pdf";
        } else if (file.type === "application/zip" || file.type === "application/x-zip-compressed") {
          detectedType = "zip";
        }

        setNewResource((prev) => ({
          ...prev,
          file_url: result.fileUrl,
          title: prev.title || file.name.replace(/\.[^.]+$/, ""),
          file_size_kb: Math.round(file.size / 1024).toString(),
          file_type: detectedType,
        }));
        toast.success("File uploaded successfully to cloud storage!");
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelection(file);
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
        file_size_kb: newResource.file_size_kb
          ? Number(newResource.file_size_kb)
          : null,
        position: resources.length,
      });
      toast.success("Resource added");
      setShowForm(false);
      setNewResource({
        title: "",
        file_url: "",
        file_type: "pdf",
        file_size_kb: "",
      });
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

  const handleConnectDrive = () => {
    const fromPath = window.location.pathname;
    window.location.href = `/api/youtube/oauth/authorize?state=${encodeURIComponent(fromPath)}`;
  };

  const handleFolderClick = (folder: { id: string; name: string }) => {
    setFolderStack((prev) => [...prev, folder]);
    setSearchQuery("");
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
    setSearchQuery("");
  };

  const handleImportDriveFile = async (file: { id: string; name: string; mimeType: string; size?: string }) => {
    setImportingFileId(file.id);
    const drivePreview = `https://drive.google.com/file/d/${file.id}/preview`;
    const resType = mapMimeTypeToResourceType(file.mimeType);
    const sizeKb = file.size ? Math.round(Number(file.size) / 1024).toString() : "";

    try {
      await addLectureResource({
        lecture_id: lectureId,
        title: file.name.replace(/\.[^.]+$/, ""),
        file_url: drivePreview,
        file_type: resType,
        file_size_kb: sizeKb ? Number(sizeKb) : null,
        position: resources.length,
      });
      toast.success(`"${file.name}" imported successfully from Google Drive!`);
      setShowForm(false);
      loadResources();
    } catch {
      toast.error("Failed to import Google Drive file");
    } finally {
      setImportingFileId(null);
    }
  };

  const handleParsePastedLink = () => {
    if (!pastedDriveUrl) {
      toast.error("Please paste a Google Drive sharing URL");
      return;
    }

    const driveInfo = getGoogleDrivePreviewUrl(pastedDriveUrl);
    if (!driveInfo) {
      toast.error("Invalid Google Drive URL. Make sure it is a document, folder, or file sharing link.");
      return;
    }

    setNewResource((prev) => ({
      ...prev,
      file_url: driveInfo.previewUrl,
      title: prev.title || "Imported Google Drive Note",
      file_type: "pdf",
    }));
    toast.success("Google Drive link parsed successfully! Set a title and click 'Add Resource'.");
    setPastedDriveUrl("");
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
          <ResourceRow
            key={resource.id}
            resource={resource}
            onDelete={handleDelete}
          />
        ))
      )}

      {showForm && (
        <div className="flex flex-col gap-4 rounded-xl border p-4 shadow-sm bg-background">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm font-semibold">Add New Resource</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setShowForm(false)}
            >
              <IconX className="size-4" />
            </Button>
          </div>

          {/* Source Tabs */}
          <div className="flex p-1 rounded-lg bg-muted/60 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("computer")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all",
                activeTab === "computer"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <IconDeviceLaptop className="size-4" />
              💻 My Computer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("drive")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all",
                activeTab === "drive"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <IconBrandGoogleDrive className="size-4 text-emerald-600 dark:text-emerald-500" />
              🤖 Google Drive
            </button>
          </div>

          {activeTab === "computer" ? (
            <div className="flex flex-col gap-3">
              {/* Drag and Drop area */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />

              {!newResource.file_url && !isUploading && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                    dragActive
                      ? "border-primary bg-primary/5 scale-[0.99]"
                      : "border-muted-foreground/20 bg-muted/5 hover:bg-muted/10 hover:border-muted-foreground/30"
                  )}
                >
                  <div className="p-3 rounded-full bg-background shadow-sm mb-3">
                    <IconCloudUpload className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold mb-1">Drag & drop notes or files here</p>
                  <p className="text-xs text-muted-foreground mb-4">or click to browse your computer</p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
                    <Badge variant="outline" className="text-[10px]">PDF</Badge>
                    <Badge variant="outline" className="text-[10px]">Word</Badge>
                    <Badge variant="outline" className="text-[10px]">Excel</Badge>
                    <Badge variant="outline" className="text-[10px]">Image</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">Maximum file size: 50MB</p>
                </div>
              )}

              {isUploading && (
                <div className="flex flex-col gap-2.5 border rounded-xl p-5 bg-muted/10">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <IconLoader2 className="size-3.5 animate-spin text-primary" />
                      Uploading to cloud...
                    </span>
                    <span className="text-primary">{uploadProgress?.percent || 0}%</span>
                  </div>
                  <Progress value={uploadProgress?.percent || 0} className="h-2" />
                  {uploadProgress && uploadProgress.speed > 0 && (
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Speed: {uploadProgress.speedLabel}</span>
                      <span>ETA: {uploadProgress.eta}s remaining</span>
                    </div>
                  )}
                </div>
              )}

              {newResource.file_url && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <span className="text-base">{fileTypeIcons[newResource.file_type] || "📄"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[150px] sm:max-w-[300px]" title={getFilenameFromUrl(newResource.file_url)}>
                            {getFilenameFromUrl(newResource.file_url)}
                          </p>
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20 hover:bg-emerald-500/10 border-0 text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                            Uploaded
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                          {newResource.file_size_kb && (
                            <span>{(Number(newResource.file_size_kb) / 1024).toFixed(1)} MB</span>
                          )}
                          {newResource.file_size_kb && <span>•</span>}
                          <span className="truncate max-w-[180px] sm:max-w-[280px]" title={newResource.file_url}>
                            {newResource.file_url}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                      onClick={() =>
                        setNewResource((prev) => ({
                          ...prev,
                          file_url: "",
                          file_size_kb: "",
                        }))
                      }
                    >
                      <IconX className="size-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-semibold">Title</Label>
                      <Input
                        value={newResource.title}
                        onChange={(e) =>
                          setNewResource((r) => ({ ...r, title: e.target.value }))
                        }
                        placeholder="Resource title"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-semibold">File Type</Label>
                      <Select
                        value={newResource.file_type}
                        onValueChange={(val) =>
                          setNewResource((r) => ({ ...r, file_type: val }))
                        }
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

                  <div className="flex justify-end gap-2 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAdd} disabled={saving}>
                      {saving ? "Adding..." : "Add Resource"}
                    </Button>
                  </div>
                </div>
              )}

              {uploadError && (
                <span className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium">
                  {uploadError}
                </span>
              )}
            </div>
          ) : (
            /* Google Drive Tab */
            <div className="flex flex-col gap-3">
              {driveStatus.loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <IconLoader2 className="size-8 text-emerald-500 animate-spin" />
                  <span className="text-xs text-muted-foreground">Checking Google authentication...</span>
                </div>
              ) : driveStatus.apiDisabled ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-amber-500/20 rounded-xl bg-amber-500/5">
                  <IconBrandGoogleDrive className="size-12 text-emerald-600 dark:text-emerald-500 mb-3" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">Google Drive API Disabled</p>
                  <p className="text-xs text-muted-foreground max-w-md mb-5 leading-normal">
                    {driveStatus.apiDisabledMessage}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const match = driveStatus.apiDisabledMessage.match(/https?:\/\/[^\s]+/);
                        const url = match ? match[0].replace(/\.+$/, "") : "https://console.developers.google.com/apis/api/drive.googleapis.com/overview";
                        window.open(url, "_blank");
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs gap-2"
                    >
                      Enable Drive API
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDriveStatus(prev => ({ ...prev, apiDisabled: false }));
                        fetchDriveFiles(folderStack[folderStack.length - 1].id, searchQuery);
                      }}
                      className="text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : !driveStatus.connected || !driveStatus.hasDriveScope || driveStatus.isExpired ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center border rounded-xl bg-muted/5">
                  <IconBrandGoogleDrive className="size-12 text-emerald-600 dark:text-emerald-500 mb-3" />
                  <p className="text-sm font-semibold mb-1">Google Drive is not connected</p>
                  <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-normal">
                    Connect your Google account to browse, search, and import notes or documents directly from your Google Drive folder.
                  </p>
                  <Button
                    onClick={handleConnectDrive}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-2"
                  >
                    <IconBrandGoogleDrive className="size-4" />
                    Connect Google Account
                  </Button>
                </div>
              ) : (
                /* Drive File Explorer */
                <div className="flex flex-col gap-3">
                  {/* Link Paste Selector */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/10">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Paste Google Drive Sharing URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={pastedDriveUrl}
                        onChange={(e) => setPastedDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/.../view"
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleParsePastedLink}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Load Link
                      </Button>
                    </div>
                  </div>

                  {newResource.file_url ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            <span className="text-base">{fileTypeIcons[newResource.file_type] || "📄"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground truncate max-w-[150px] sm:max-w-[300px]" title={getFilenameFromUrl(newResource.file_url)}>
                                {getFilenameFromUrl(newResource.file_url)}
                              </p>
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20 hover:bg-emerald-500/10 border-0 text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                                Google Drive
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                              <span className="truncate max-w-[200px] sm:max-w-[300px]" title={newResource.file_url}>
                                {newResource.file_url}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                          onClick={() => setNewResource((prev) => ({ ...prev, file_url: "" }))}
                        >
                          <IconX className="size-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={newResource.title}
                            onChange={(e) =>
                              setNewResource((r) => ({ ...r, title: e.target.value }))
                            }
                            placeholder="Resource title"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={newResource.file_type}
                            onValueChange={(val) =>
                              setNewResource((r) => ({ ...r, file_type: val }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="slide">Slide</SelectItem>
                              <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                              <SelectItem value="link">Link</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="audio">Audio</SelectItem>
                              <SelectItem value="zip">ZIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 border-t pt-2 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewResource((prev) => ({ ...prev, file_url: "" }))}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAdd}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={saving}
                        >
                          Add Resource
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Drive Explorer Body */
                    <div className="border rounded-xl flex flex-col overflow-hidden bg-background max-h-[350px]">
                      {/* Explorer Header */}
                      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-muted/40 border-b">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search files..."
                            className="h-8 text-xs pl-8 pr-3"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => fetchDriveFiles(folderStack[folderStack.length - 1].id, searchQuery)}
                          title="Refresh Drive"
                        >
                          <IconRefresh className="size-4" />
                        </Button>
                      </div>

                      {/* Breadcrumbs */}
                      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b text-[10px] text-muted-foreground bg-muted/10 overflow-x-auto whitespace-nowrap">
                        {folderStack.map((folder, index) => (
                          <React.Fragment key={folder.id}>
                            {index > 0 && <IconChevronRight className="size-3 text-muted-foreground/50" />}
                            <button
                              type="button"
                              onClick={() => handleBreadcrumbClick(index)}
                              className={cn(
                                "hover:text-foreground hover:underline font-medium",
                                index === folderStack.length - 1 && "text-foreground font-semibold"
                              )}
                            >
                              {folder.name}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Files list */}
                      <div className="flex-1 overflow-y-auto min-h-[180px] divide-y divide-border/60">
                        {driveLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                            <IconLoader2 className="size-6 animate-spin text-emerald-500" />
                            <span className="text-[11px]">Loading folder content...</span>
                          </div>
                        ) : driveFiles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-1 text-muted-foreground text-center px-4">
                            <IconFolderOpen className="size-8 text-muted-foreground/75 mb-1" />
                            <p className="text-xs font-semibold">No compatible files found</p>
                            <p className="text-[10px] text-muted-foreground/80 max-w-xs">
                              Make sure you have PDFs, Docs, Slides, Sheets, or images in this Google Drive folder.
                            </p>
                          </div>
                        ) : (
                          driveFiles.map((file) => {
                            const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                            const resType = mapMimeTypeToResourceType(file.mimeType);
                            const fileIcon = isFolder ? "📁" : (fileTypeIcons[resType] || "📄");

                            return (
                              <div
                                key={file.id}
                                className={cn(
                                  "flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/30 transition-colors text-xs",
                                  isFolder ? "cursor-pointer" : ""
                                )}
                                onClick={isFolder ? () => handleFolderClick({ id: file.id, name: file.name }) : undefined}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-base shrink-0">{fileIcon}</span>
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate max-w-[280px] md:max-w-[450px]">
                                      {file.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {isFolder ? "Folder" : resType.toUpperCase()}
                                      {file.size && ` • ${(Number(file.size) / (1024 * 1024)).toFixed(1)} MB`}
                                    </p>
                                  </div>
                                </div>

                                {!isFolder && (
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImportDriveFile(file);
                                    }}
                                    disabled={importingFileId !== null}
                                    className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                  >
                                    {importingFileId === file.id ? (
                                      <IconLoader2 className="size-3 animate-spin mr-1" />
                                    ) : (
                                      <IconUpload className="size-3 mr-1" />
                                    )}
                                    Import
                                  </Button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!showForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="border-dashed w-full h-9 gap-1.5"
        >
          <IconPlus className="size-4" />
          Add Resource Note
        </Button>
      )}
    </div>
  );
}

