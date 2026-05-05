"use client";

import { useState } from "react";
import { useImportJob } from "./useImportJob";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useBankImport() {
  const [jobId, setJobId] = useState<string | null>(null);
  const { job, status, progress, isLoading } = useImportJob(jobId);

  const startImport = async (fileData: {
    subject_id: string;
    topic_id?: string | null;
    sub_topic_id?: string | null;
    file: File;
  }) => {
    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileData.file.name,
          fileType: fileData.file.type || "application/octet-stream",
          folder: "bank-imports",
        }),
      });

      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await presignRes.json();

      // 2. Upload file to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": fileData.file.type || "application/octet-stream" },
        body: fileData.file,
      });

      if (!uploadRes.ok) throw new Error("File upload failed");

      // 3. Create import job
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const ext = fileData.file.name.split(".").pop()?.toLowerCase() ?? "txt";
      const { data: newJob, error } = await supabase
        .from("bank_import_jobs")
        .insert([{
          created_by: user.id,
          subject_id: fileData.subject_id,
          topic_id: fileData.topic_id ?? null,
          sub_topic_id: fileData.sub_topic_id ?? null,
          original_file_name: fileData.file.name,
          file_type: ext,
          r2_file_url: publicUrl,
          file_size_bytes: fileData.file.size,
          status: "pending",
        }])
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      setJobId(newJob.id);

      // 4. Trigger extraction
      const extractRes = await fetch("/api/bank/import/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newJob.id }),
      });

      if (!extractRes.ok) {
        const errorData = await extractRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Extraction failed");
      }

      toast.success("Import started");
      return newJob.id;
    } catch (e: any) {
      toast.error(`Import failed: ${e.message}`);
      throw e;
    }
  };

  const commitImport = async (selectedIndices: number[]) => {
    if (!jobId) return;

    try {
      const res = await fetch("/api/bank/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, selectedIndices }),
      });

      if (!res.ok) throw new Error("Commit failed");
      const result = await res.json();

      toast.success(`${result.imported} questions imported`);
      return result;
    } catch (e: any) {
      toast.error(`Commit failed: ${e.message}`);
      throw e;
    }
  };

  return { jobId, job, status, progress, isLoading, startImport, commitImport, setJobId };
}
