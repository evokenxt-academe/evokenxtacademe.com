"use client";

import { useState } from "react";
import { usePrograms, useProgramLevels, useSubjects, useTopics, useSubTopics } from "@/hooks/useTopics";
import { useBankImport } from "@/hooks/useBankImport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, Info, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, Database } from "lucide-react";
import { useRouter } from "next/navigation";

export function BankImportWorkflow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Step 1
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subTopicId, setSubTopicId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: programs } = usePrograms();
  const { data: levels } = useProgramLevels(programId || undefined);
  const { data: subjects } = useSubjects(levelId || undefined);
  const { data: topics } = useTopics(subjectId || undefined);
  const { data: subTopics } = useSubTopics(topicId || undefined);

  const { job, status, progress, isLoading, startImport, commitImport } = useBankImport();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isCommitting, setIsCommitting] = useState(false);

  const handleStart = async () => {
    if (!subjectId || !file) return;
    try {
      await startImport({ subject_id: subjectId, topic_id: topicId || null, sub_topic_id: subTopicId || null, file });
      setStep(2);
    } catch {}
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      await commitImport(Array.from(selected));
      setStep(3);
    } catch {}
    setIsCommitting(false);
  };

  const parsedQuestions = job?.extracted_json as any[] | undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          {["Taxonomy & Upload", "AI Extraction & Review", "Import Complete"].map((s, i) => (
            <span key={s} className={`${step >= i + 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{i + 1}. {s}</span>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="h-1.5" />
      </div>

      {step === 1 && (
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader><CardTitle>Context & File Upload</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program *</Label>
                <Select value={programId} onValueChange={(v) => { setProgramId(v); setLevelId(""); setSubjectId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>{(programs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.body}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level *</Label>
                <Select value={levelId} onValueChange={(v) => { setLevelId(v); setSubjectId(""); }} disabled={!programId}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>{(levels ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setTopicId(""); }} disabled={!levelId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{(subjects ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Topic (optional)</Label>
                <Select value={topicId} onValueChange={(v) => { setTopicId(v); setSubTopicId(""); }} disabled={!subjectId}>
                  <SelectTrigger><SelectValue placeholder="Auto-detect using AI" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-detect using AI</SelectItem>
                    {(topics ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">AI will attempt to match questions to topics automatically.</p>
              </div>
              <div className="space-y-2">
                <Label>Default Sub-Topic (optional)</Label>
                <Select value={subTopicId} onValueChange={setSubTopicId} disabled={!topicId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(subTopics ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Upload Question File *</Label>
              <Alert className="mb-4"><Info className="h-4 w-4" /><AlertDescription>Upload past papers, revision kits, or assignments. Gemini will extract structure, text, and metadata automatically.</AlertDescription></Alert>
              
              {!file ? (
                <div 
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf,.docx,.txt,.csv"; i.onchange = (e) => setFile((e.target as HTMLInputElement).files?.[0] || null); i.click(); }}
                >
                  <Upload className="h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">Click to select file</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, CSV (Max 10MB)</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/20">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleStart} disabled={!subjectId || !file || isLoading}>
                {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Start Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Extraction Pipeline</CardTitle>
              <Badge variant="outline" className="capitalize">{status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {(status === "pending" || status === "processing") && (
              <div className="py-12 space-y-4 max-w-md mx-auto text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                <h3 className="font-semibold text-lg">AI is processing your document...</h3>
                <p className="text-sm text-muted-foreground">This involves extracting raw text and parsing it into structured questions, mapping to topics, and identifying duplicate candidates.</p>
                <Progress value={status === "pending" ? 30 : 60} className="h-2 mt-4" />
              </div>
            )}

            {(status === "completed" || status === "partial") && parsedQuestions && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Extraction Complete</p>
                    <p className="text-xs text-muted-foreground mt-1">Found {parsedQuestions.length} questions. Review and map them before final import.</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xl font-bold">{parsedQuestions.filter(q => q._isDuplicate).length}</div>
                      <div className="text-xs text-muted-foreground">Duplicates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{parsedQuestions.length}</div>
                      <div className="text-xs text-muted-foreground">Total Found</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={selected.size === parsedQuestions.length} 
                            onCheckedChange={(c) => setSelected(c ? new Set(parsedQuestions.map((_, i) => i)) : new Set())} 
                          />
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Question Preview</TableHead>
                        <TableHead>Auto-mapped Topic</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedQuestions.map((q, i) => {
                        const isDup = q._isDuplicate;
                        // Select by default unless it's a duplicate
                        if (selected.size === 0 && !isDup && !selected.has(i)) {
                          setSelected(prev => new Set(prev).add(i));
                        }
                        
                        return (
                          <TableRow key={i} className={isDup ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                            <TableCell><Checkbox checked={selected.has(i)} onCheckedChange={(c) => { const next = new Set(selected); if (c) next.add(i); else next.delete(i); setSelected(next); }} /></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{q.type.replace("_", " ")}</Badge></TableCell>
                            <TableCell className="max-w-[300px] truncate text-sm">{q.question_text}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{q.topic_name || <span className="italic text-muted-foreground/50">Unmapped</span>}</TableCell>
                            <TableCell>
                              {isDup ? <Badge variant="destructive" className="text-[10px]">Duplicate</Badge> : <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 text-[10px]">New</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-muted-foreground">{selected.size} questions selected for import</span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} disabled={isCommitting}>Cancel</Button>
                    <Button onClick={handleCommit} disabled={selected.size === 0 || isCommitting}>
                      {isCommitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                      Import {selected.size} Questions to Bank
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {status === "failed" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Extraction Failed</p>
                  <p className="text-sm">{job?.error_message || "An unknown error occurred during AI processing."}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-lg border bg-card shadow-sm border-green-500/20">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Import Successful</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Successfully imported <span className="font-medium text-foreground">{progress.imported}</span> new questions to the Question Bank. 
              {progress.duplicates > 0 && ` Skipped ${progress.duplicates} potential duplicates.`}
              {progress.failed > 0 && ` Failed to insert ${progress.failed} items.`}
            </p>
            <div className="flex justify-center gap-3 pt-6">
              <Button variant="outline" onClick={() => { setStep(1); setFile(null); setSelected(new Set()); }}>Import Another</Button>
              <Button onClick={() => router.push("/admin/bank")}>Go to Question Bank <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
