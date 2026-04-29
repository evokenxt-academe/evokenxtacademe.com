"use client";

import { useState } from "react";
import { IconLoader2, IconUpload, IconX, IconFile } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Folder =
  | "course-thumbnails"
  | "course-resources"
  | "avatars"
  | "certificates";

interface FileUploaderProps {
  accept: string;
  maxSizeMB: number;
  folder: Folder;
  onUploadComplete: (url: string) => void;
}

export function FileUploader({
  accept,
  maxSizeMB,
  folder,
  onUploadComplete,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be less than ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const presignedResponse = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          folder,
        }),
      });

      const presignedData = await presignedResponse.json();
      if (!presignedResponse.ok) {
        setError(presignedData.error || "Failed to get upload URL");
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      };

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
      });

      xhr.open("PUT", presignedData.presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);

      await uploadPromise;
      setProgress(100);
      onUploadComplete(presignedData.publicUrl);
      setFile(null);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {!file ? (
          <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition hover:bg-accent/50">
            <IconUpload className="mb-2 size-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </span>
            <span className="mt-1 text-xs text-muted-foreground">Max {maxSizeMB}MB</span>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-accent p-3">
              <div className="flex items-center gap-3">
                <IconFile className="size-5" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
                disabled={uploading}
              >
                <IconX className="size-4" />
              </Button>
            </div>

            {uploading ? <Progress value={progress} /> : null}

            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <IconLoader2 data-icon="inline-start" className="animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload File"
              )}
            </Button>
          </div>
        )}

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
