"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/utils/video";
import type { UseFormReturn } from "react-hook-form";
import type { CourseFormValues } from "@/lib/validators/course";

interface StepMediaProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CourseFormValues, any, any>;
}

export function StepMedia({ form }: StepMediaProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const thumbnailUrl = form.watch("thumbnail_url");
  const previewVideoUrl = form.watch("preview_video_url") || "";

  const ytId = previewVideoUrl ? extractYouTubeId(previewVideoUrl) : null;

  const handleFileSelect = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPG, PNG, or WebP files are allowed");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress (replace with real Supabase storage upload)
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 10;
      });
    }, 200);

    try {
      // For now, create a local object URL as preview
      // In production, upload to Supabase Storage bucket 'course-thumbnails'
      const objectUrl = URL.createObjectURL(file);
      form.setValue("thumbnail_url", objectUrl, { shouldValidate: true });
      setUploadProgress(100);
    } catch {
      alert("Upload failed");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Thumbnail Upload */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Course Thumbnail</Label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          {thumbnailUrl ? (
            <>
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    form.setValue("thumbnail_url", "");
                  }}
                  className="rounded-full bg-white p-2"
                >
                  <IconTrash className="size-5 text-destructive" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <IconUpload className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG up to 2MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
        {uploading && (
          <Progress value={uploadProgress} className="h-1" />
        )}
      </div>

      {/* Preview Video URL */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Preview Video URL</Label>
        <Input
          {...form.register("preview_video_url")}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="text-xs text-muted-foreground">
          Free preview visible before enrollment
        </p>
        {ytId && (
          <div className="mt-2 overflow-hidden rounded-lg border">
            <img
              src={getYouTubeThumbnail(ytId)}
              alt="Video thumbnail"
              className="aspect-video w-full object-cover"
            />
            <div className="bg-muted px-3 py-2">
              <p className="font-mono text-xs text-muted-foreground">
                Video ID: {ytId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
