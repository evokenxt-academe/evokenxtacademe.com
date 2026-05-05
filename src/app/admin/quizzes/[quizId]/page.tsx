"use client";

import { use, useEffect, useState } from "react";
import { useQuizzes, useUpdateQuiz } from "@/hooks/useQuizzes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Layers, ArrowLeft } from "lucide-react";
import type { QuizType, ShowAnswersAfter } from "@/types/quiz";

const QUIZ_TYPE_INFO = [
  { value: "practice", label: "Practice", desc: "Ungraded practice. No score tracking." },
  { value: "graded", label: "Graded", desc: "Scored quiz. Results saved to gradebook." },
  { value: "mock_exam", label: "Mock Exam", desc: "Timed, graded. Simulates exam conditions." },
  { value: "final_exam", label: "Final Exam", desc: "High-stakes. Limited attempts, no retries." },
];

export default function EditQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const router = useRouter();
  const { quizId } = use(params);
  const { data: quizzes, isLoading } = useQuizzes();
  const updateMutation = useUpdateQuiz();
  
  const quiz = quizzes?.find((q) => q.id === quizId);
  
  const [form, setForm] = useState({
    title: "", description: "", instructions: "",
    type: "practice" as QuizType, passing_marks: "" as number | "",
    time_limit_sec: "" as number | "", max_attempts: "" as number | "",
    shuffle_questions: false, shuffle_options: false,
    show_answers_after: "submit" as ShowAnswersAfter,
    is_published: false,
  });

  useEffect(() => {
    if (quiz) {
      setForm({
        title: quiz.title, description: quiz.description || "", instructions: quiz.instructions || "",
        type: quiz.type, passing_marks: quiz.passing_marks ?? "",
        time_limit_sec: quiz.time_limit_sec ? quiz.time_limit_sec / 60 : "", // Store as minutes in form
        max_attempts: quiz.max_attempts ?? "",
        shuffle_questions: quiz.shuffle_questions, shuffle_options: quiz.shuffle_options,
        show_answers_after: quiz.show_answers_after, is_published: quiz.is_published,
      });
    }
  }, [quiz]);

  const handleSave = () => {
    if (!quiz) return;
    updateMutation.mutate({
      id: quiz.id,
      data: {
        title: form.title, description: form.description || null, instructions: form.instructions || null,
        type: form.type, passing_marks: form.passing_marks || null,
        time_limit_sec: form.time_limit_sec ? (form.time_limit_sec as number) * 60 : null,
        max_attempts: form.max_attempts || null,
        shuffle_questions: form.shuffle_questions, shuffle_options: form.shuffle_options,
        show_answers_after: form.show_answers_after, is_published: form.is_published,
      }
    });
  };

  if (isLoading || !quiz) {
    return <div className="space-y-4 max-w-4xl mx-auto"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/admin">Admin</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/admin/quizzes">Quizzes</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{quiz.title}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Quiz Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure parameters for {quiz.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/quizzes/${quiz.id}/builder`)}>
            <Layers className="mr-2 h-4 w-4" />Open Builder
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />{updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <Label>Quiz Type</Label>
                <RadioGroup value={form.type} onValueChange={(v) => setForm({ ...form, type: v as QuizType })}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {QUIZ_TYPE_INFO.map((t) => (
                      <label key={t.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${form.type === t.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                        <RadioGroupItem value={t.value} className="mt-0.5" />
                        <div><div className="text-sm font-medium">{t.label}</div><div className="text-xs text-muted-foreground">{t.desc}</div></div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg border bg-card shadow-sm">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div><Label>Publish Status</Label><p className="text-xs text-muted-foreground">Visible to students</p></div>
                <Switch checked={form.is_published} onCheckedChange={(c) => setForm({ ...form, is_published: c })} />
              </div>
              
              <Separator />

              <div className="space-y-2">
                <Label>Passing Marks</Label>
                <Input type="number" value={form.passing_marks} onChange={(e) => setForm({ ...form, passing_marks: e.target.value ? Number(e.target.value) : "" })} placeholder="e.g., 40" />
              </div>
              
              <div className="space-y-2">
                <Label>Time Limit (minutes)</Label>
                <Input type="number" value={form.time_limit_sec} onChange={(e) => setForm({ ...form, time_limit_sec: e.target.value ? Number(e.target.value) : "" })} placeholder="Leave blank for untimed" />
              </div>
              
              <div className="space-y-2">
                <Label>Max Attempts</Label>
                <Input type="number" value={form.max_attempts} onChange={(e) => setForm({ ...form, max_attempts: e.target.value ? Number(e.target.value) : "" })} placeholder="Leave blank for unlimited" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div><Label>Shuffle Questions</Label></div>
                <Switch checked={form.shuffle_questions} onCheckedChange={(c) => setForm({ ...form, shuffle_questions: c })} />
              </div>

              <div className="flex items-center justify-between">
                <div><Label>Shuffle Options</Label></div>
                <Switch checked={form.shuffle_options} onCheckedChange={(c) => setForm({ ...form, shuffle_options: c })} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Show Answers</Label>
                <Select value={form.show_answers_after} onValueChange={(v) => setForm({ ...form, show_answers_after: v as ShowAnswersAfter })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submit">On Submit</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="pass">Only if Passed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
