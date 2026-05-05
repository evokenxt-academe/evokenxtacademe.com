"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getImportJob } from "@/lib/supabase/queries/imports";
import { useEffect, useState } from "react";
import type { BankImportJob } from "@/types/quiz";

export function useImportJob(jobId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [liveJob, setLiveJob] = useState<BankImportJob | null>(null);

  const query = useQuery({
    queryKey: ["import-job", jobId],
    queryFn: () => getImportJob(supabase, jobId!),
    enabled: !!jobId,
  });

  // Realtime subscription for live updates
  useEffect(() => {
    if (!jobId) return;
    const channel = supabase
      .channel(`import-job-${jobId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "bank_import_jobs",
        filter: `id=eq.${jobId}`,
      }, (payload) => {
        setLiveJob(payload.new as BankImportJob);
        queryClient.setQueryData(["import-job", jobId], payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, supabase, queryClient]);

  const job = liveJob || query.data;
  const status = job?.status ?? "pending";
  const progress = {
    found: job?.total_found ?? 0,
    imported: job?.total_imported ?? 0,
    failed: job?.total_failed ?? 0,
    duplicates: job?.total_duplicates ?? 0,
  };

  return { job, status, progress, isLoading: query.isLoading };
}
