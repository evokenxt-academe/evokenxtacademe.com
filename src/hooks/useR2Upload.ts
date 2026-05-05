"use client";

import { useState, useCallback } from "react";

export function useR2Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, folder: string): Promise<string> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Get presigned URL
      const res = await fetch("/api/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, folder }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      // Upload with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setProgress(100);
      return publicUrl;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const remove = useCallback(async (url: string) => {
    try {
      await fetch("/api/r2/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: url.replace(`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/`, "") }),
      });
    } catch (e) {
      console.error("Failed to delete file:", e);
    }
  }, []);

  return { upload, remove, isUploading, progress, error };
}
