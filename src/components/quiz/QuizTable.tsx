"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Pencil, Eye, BarChart3, Copy, Trash2, Layers } from "lucide-react";
import { usePublishQuiz, useDeleteQuiz } from "@/hooks/useQuizzes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { QuizSummary } from "@/types/quiz";

const TYPE_BADGE: Record<string, string> = {
  practice: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  graded: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  mock_exam: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  final_exam: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

interface QuizTableProps {
  data: (QuizSummary & { subject_name?: string | null })[];
  isLoading: boolean;
}

export function QuizTable({ data, isLoading }: QuizTableProps) {
  const router = useRouter();
  const publishMutation = usePublishQuiz();
  const deleteMutation = useDeleteQuiz();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selected.size === data.length) setSelected(new Set());
    else setSelected(new Set(data.map((q) => q.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Layers className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold">No quizzes yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Create your first quiz to get started.</p>
        <Button className="mt-4" onClick={() => router.push("/admin/quizzes/new")}>+ New Quiz</Button>
      </div>
    );
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 mb-4">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button variant="outline" size="sm" onClick={() => { selected.forEach((id) => publishMutation.mutate({ id, published: true })); setSelected(new Set()); }}>Publish Selected</Button>
          <Button variant="outline" size="sm" onClick={() => { selected.forEach((id) => publishMutation.mutate({ id, published: false })); setSelected(new Set()); }}>Unpublish Selected</Button>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={selected.size === data.length && data.length > 0} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Questions</TableHead>
              <TableHead className="text-center">Marks</TableHead>
              <TableHead className="text-center">Attempts</TableHead>
              <TableHead className="text-center">Avg Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((quiz) => (
              <TableRow key={quiz.id} className="group">
                <TableCell><Checkbox checked={selected.has(quiz.id)} onCheckedChange={() => toggleOne(quiz.id)} /></TableCell>
                <TableCell>
                  <button className="text-sm font-medium hover:underline text-left" onClick={() => router.push(`/admin/quizzes/${quiz.id}`)}>
                    {quiz.title}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground">
                    {quiz.program_body} · {quiz.level_label}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{quiz.course_title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={TYPE_BADGE[quiz.type] ?? ""}>
                    {quiz.type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">{quiz.question_count}</TableCell>
                <TableCell className="text-center font-mono text-sm">{quiz.total_marks}</TableCell>
                <TableCell className="text-center font-mono text-sm">{quiz.attempt_count}</TableCell>
                <TableCell className="text-center">
                  {quiz.avg_score != null ? (
                    <span className={`font-mono text-sm ${quiz.avg_score >= 70 ? "text-green-600" : quiz.avg_score >= 40 ? "text-amber-600" : "text-red-600"}`}>
                      {quiz.avg_score}%
                    </span>
                  ) : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={quiz.is_published}
                    onCheckedChange={(checked) => publishMutation.mutate({ id: quiz.id, published: checked })}
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/quizzes/${quiz.id}`)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/quizzes/${quiz.id}/builder`)}><Layers className="mr-2 h-4 w-4" />Builder</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/quizzes/${quiz.id}/preview`)}><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/quizzes/${quiz.id}/results`)}><BarChart3 className="mr-2 h-4 w-4" />Results</DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        const res = await fetch(`/api/quiz/${quiz.id}/duplicate`, { method: "POST" });
                        if (res.ok) { const { newQuizId } = await res.json(); toast.success("Quiz duplicated"); router.push(`/admin/quizzes/${newQuizId}`); }
                        else toast.error("Duplication failed");
                      }}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete "{quiz.title}" and all its questions. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(quiz.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
