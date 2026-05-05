"use client";

import { useCallback, useState } from "react";
import { useR2Upload } from "@/hooks/useR2Upload";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadZoneProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}

export function ImageUploadZone({ value, onChange, folder = "question-images" }: ImageUploadZoneProps) {
  const { upload, remove, isUploading, progress } = useR2Upload();
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files are accepted"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size is 5MB"); return; }

    try {
      const url = await upload(file, folder);
      onChange(url);
      toast.success("Image uploaded");
    } catch { toast.error("Upload failed"); }
  }, [upload, folder, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(async () => {
    if (value) { await remove(value); onChange(null); toast.success("Image removed"); }
  }, [value, remove, onChange]);

  if (value) {
    return (
      <div className="relative inline-block rounded-lg border bg-muted/50 p-1">
        <img src={value} alt="Uploaded" className="h-24 w-auto rounded object-cover" />
        <Button variant="destructive" size="icon" className="absolute -right-2 -top-2 h-6 w-6 rounded-full" onClick={handleRemove}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); }; input.click(); }}
    >
      {isUploading ? (
        <div className="w-full space-y-2">
          <p className="text-sm text-center text-muted-foreground">Uploading...</p>
          <Progress value={progress} className="h-2" />
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
          <p className="text-xs text-muted-foreground/60">JPG, PNG, WebP, GIF · Max 5MB</p>
        </>
      )}
    </div>
  );
}
