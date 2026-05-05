"use client";

import { useState } from "react";
import { useBankImport } from "@/hooks/useBankImport";
import { useBatchInsertQuestions } from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Info, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function AiImportEditor({ quizId, subjectId }: { quizId: string; subjectId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("idle"); // idle, uploading, extracting, parsing, complete
  const [parsed, setParsed] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  
  const batchInsert = useBatchInsertQuestions(quizId);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setJobStatus("uploading");
    
    try {
      // 1. Presign URL
      const presignRes = await fetch("/api/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type || "application/pdf", folder: "quiz-imports" }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await presignRes.json();

      // 2. Upload to R2
      const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/pdf" }, body: file });
      if (!uploadRes.ok) throw new Error("File upload failed");

      // 3. Create dummy job record for processing
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const { data: newJob, error } = await supabase.from("bank_import_jobs").insert([{
        created_by: user.id,
        subject_id: subjectId,
        original_file_name: file.name,
        file_type: file.name.split(".").pop()?.toLowerCase() ?? "txt",
        r2_file_url: publicUrl,
        file_size_bytes: file.size,
        status: "pending",
      }]).select("id").single();
      if (error) throw new Error(error.message);
      setJobId(newJob.id);

      setJobStatus("extracting");

      // 4. Extract
      const extractRes = await fetch("/api/quiz/import/extract", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: newJob.id })
      });
      if (!extractRes.ok) {
        const errorData = await extractRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Extraction failed");
      }

      setJobStatus("parsing");

      // We need to poll the job status because parsing is async
      const poll = setInterval(async () => {
        const { data: job } = await supabase.from("bank_import_jobs").select("*").eq("id", newJob.id).single();
        if (job && (job.status === "completed" || job.status === "failed" || job.status === "partial")) {
          clearInterval(poll);
          setJobStatus(job.status);
          if (job.status === "completed" || job.status === "partial") {
            const questions = job.extracted_json as any[];
            setParsed(questions);
            setSelected(new Set(questions.map((_, i) => i)));
          }
          if (job.error_message) toast.error(job.error_message);
        }
      }, 2000);

    } catch (e: any) {
      toast.error(e.message);
      setJobStatus("idle");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = () => {
    const toImport = parsed.filter((_, i) => selected.has(i)).map(q => ({
      type: q.type, question_text: q.question_text, marks: q.marks || 1,
      negative_marks: q.negative_marks || 0, is_mandatory: true, explanation: q.explanation,
      assertion_text: q.assertion_text, reason_text: q.reason_text,
      numerical_answer: q.numerical_answer, numerical_tolerance: q.numerical_tolerance,
      model_answer: q.model_answer,
      options: q.options?.map((o: any, i: number) => ({ option_text: o.text || o.option_text, is_correct: o.is_correct, position: i })) ?? [],
    }));
    batchInsert.mutate(toImport);
  };

  if (parsed.length > 0) {
    return (
      <div className="space-y-4 p-1">
        <div className="flex items-center justify-between">
          <Alert className="w-auto m-0"><CheckCircle className="h-4 w-4" /><AlertDescription>Extracted {parsed.length} questions successfully.</AlertDescription></Alert>
          <Button variant="outline" onClick={() => { setParsed([]); setFile(null); setJobStatus("idle"); }}>Start Over</Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selected.size === parsed.length} onCheckedChange={(c) => setSelected(c ? new Set(parsed.map((_, i) => i)) : new Set())} />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="text-center">Marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsed.map((q, i) => (
                <TableRow key={i}>
                  <TableCell><Checkbox checked={selected.has(i)} onCheckedChange={(c) => { const next = new Set(selected); if (c) next.add(i); else next.delete(i); setSelected(next); }} /></TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{q.type}</Badge></TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">{q.question_text}</TableCell>
                  <TableCell className="text-center font-mono">{q.marks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button onClick={handleImport} disabled={selected.size === 0 || batchInsert.isPending}>
          {batchInsert.isPending ? "Importing..." : `Add ${selected.size} Questions to Quiz`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <Alert><Info className="h-4 w-4" /><AlertDescription>Upload a PDF, Word document, or image. Gemini AI will automatically extract questions, options, and explanations.</AlertDescription></Alert>

      {!file ? (
        <div 
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf,.docx,.doc,.txt,.csv,.xlsx"; i.onchange = (e) => setFile((e.target as HTMLInputElement).files?.[0] || null); i.click(); }}
        >
          <Upload className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium">Click to select a file</p>
          <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOCX, TXT</p>
        </div>
      ) : (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {jobStatus === "idle" && (
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
            )}
          </div>

          {jobStatus === "idle" ? (
            <Button className="w-full" onClick={handleUpload} disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" /> Start AI Extraction
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Status</span>
                <span className="text-primary">{jobStatus}</span>
              </div>
              <Progress value={jobStatus === "uploading" ? 30 : jobStatus === "extracting" ? 60 : jobStatus === "parsing" ? 90 : 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {jobStatus === "uploading" && "Uploading to secure storage..."}
                {jobStatus === "extracting" && "Extracting raw text from document..."}
                {jobStatus === "parsing" && "Gemini AI is analyzing and structuring questions..."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
