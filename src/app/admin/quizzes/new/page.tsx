"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  usePrograms,
  useProgramLevels,
  useSubjects,
  useCoursesBySubject,
  useChapters,
} from "@/hooks/useTopics";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { QuizType, ShowAnswersAfter } from "@/types/quiz";

const QUIZ_TYPE_INFO = [
  {
    value: "practice",
    label: "Practice",
    desc: "Ungraded practice. No score tracking.",
  },
  {
    value: "graded",
    label: "Graded",
    desc: "Scored quiz. Results saved to gradebook.",
  },
  {
    value: "mock_exam",
    label: "Mock Exam",
    desc: "Timed, graded. Simulates exam conditions.",
  },
  {
    value: "final_exam",
    label: "Final Exam",
    desc: "High-stakes. Limited attempts, no retries.",
  },
];

export default function NewQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [chapterId, setChapterId] = useState("none");
  const [quizType, setQuizType] = useState<QuizType>("practice");
  const [instructions, setInstructions] = useState("");

  // Step 2
  const [passingMarks, setPassingMarks] = useState<number | "">("");
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitMin, setTimeLimitMin] = useState(60);
  const [maxAttemptsEnabled, setMaxAttemptsEnabled] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showAnswersAfter, setShowAnswersAfter] =
    useState<ShowAnswersAfter>("submit");

  const { data: programs } = usePrograms();
  const { data: levels } = useProgramLevels(programId || undefined);
  const { data: subjects } = useSubjects(levelId || undefined);
  const { data: courses } = useCoursesBySubject(subjectId || undefined);
  const { data: chapters } = useChapters(courseId || undefined);

  const handleCreate = async () => {
    if (!title || !courseId) {
      toast.error("Title and Course are required");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quizzes")
        .insert([
          {
            title,
            description: description || null,
            instructions: instructions || null,
            course_id: courseId,
            chapter_id: chapterId === "none" ? null : chapterId || null,
            type: quizType,
            passing_marks: passingMarks || 0,
            time_limit_sec: timeLimitEnabled ? timeLimitMin * 60 : null,
            shuffle_questions: shuffleQuestions,
            shuffle_options: shuffleOptions,
            max_attempts: maxAttemptsEnabled ? maxAttempts : null,
            show_answers_after: showAnswersAfter,
            is_published: false,
          },
        ])
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      toast.success("Quiz created!");
      router.push(`/admin/quizzes/${data.id}/builder`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/quizzes">Quizzes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Quiz</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Quiz</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up a new assessment in 3 steps
        </p>
      </div>

      {/* Step indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          {["Quiz Info", "Settings", "Review"].map((s, i) => (
            <span
              key={s}
              className={`${step >= i + 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="h-1.5" />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., ACCA BT Chapter 1 Practice Quiz"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program</Label>
                <Select
                  value={programId}
                  onValueChange={(v) => {
                    setProgramId(v);
                    setLevelId("");
                    setSubjectId("");
                    setCourseId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {(programs ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.body}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={levelId}
                  onValueChange={(v) => {
                    setLevelId(v);
                    setSubjectId("");
                    setCourseId("");
                  }}
                  disabled={!programId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {(levels ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course *</Label>
                <Select
                  value={courseId}
                  onValueChange={(v) => {
                    setCourseId(v);
                    setChapterId("none");
                  }}
                  disabled={!subjectId && (courses ?? []).length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chapter (optional)</Label>
                <Select
                  value={chapterId}
                  onValueChange={setChapterId}
                  disabled={!courseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Course-level (no chapter)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Course-level (no chapter)
                    </SelectItem>
                    {(chapters ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Need to add subject select between level and course */}
            {levelId && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={subjectId}
                  onValueChange={(v) => {
                    setSubjectId(v);
                    setCourseId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {(subjects ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label>Quiz Type</Label>
              <RadioGroup
                value={quizType}
                onValueChange={(v) => setQuizType(v as QuizType)}
              >
                <div className="grid grid-cols-2 gap-3">
                  {QUIZ_TYPE_INFO.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${quizType === t.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    >
                      <RadioGroupItem value={t.value} className="mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Instructions (optional)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Special instructions shown to students before starting..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Passing Marks</Label>
              <Input
                type="number"
                value={passingMarks}
                onChange={(e) =>
                  setPassingMarks(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="e.g., 40"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for no passing threshold
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Time Limit</Label>
                <p className="text-xs text-muted-foreground">
                  Set a countdown timer
                </p>
              </div>
              <Switch
                checked={timeLimitEnabled}
                onCheckedChange={setTimeLimitEnabled}
              />
            </div>
            {timeLimitEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={timeLimitMin}
                  onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Max Attempts</Label>
                <p className="text-xs text-muted-foreground">
                  Limit number of attempts
                </p>
              </div>
              <Switch
                checked={maxAttemptsEnabled}
                onCheckedChange={setMaxAttemptsEnabled}
              />
            </div>
            {maxAttemptsEnabled && (
              <Input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-32"
              />
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Shuffle Questions</Label>
                <p className="text-xs text-muted-foreground">
                  Randomize question order per attempt
                </p>
              </div>
              <Switch
                checked={shuffleQuestions}
                onCheckedChange={setShuffleQuestions}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Shuffle Options</Label>
                <p className="text-xs text-muted-foreground">
                  Randomize MCQ option order
                </p>
              </div>
              <Switch
                checked={shuffleOptions}
                onCheckedChange={setShuffleOptions}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Show Answers After</Label>
              <Select
                value={showAnswersAfter}
                onValueChange={(v) =>
                  setShowAnswersAfter(v as ShowAnswersAfter)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submit">On Submit</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="pass">Only if Passed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Review & Create</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Title</dt>
                <dd className="font-medium">{title || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd>
                  <Badge variant="secondary">
                    {quizType.replace("_", " ")}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Passing Marks</dt>
                <dd>{passingMarks || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Time Limit</dt>
                <dd>{timeLimitEnabled ? `${timeLimitMin} min` : "Untimed"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max Attempts</dt>
                <dd>{maxAttemptsEnabled ? maxAttempts : "Unlimited"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Shuffle Questions</dt>
                <dd>{shuffleQuestions ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Shuffle Options</dt>
                <dd>{shuffleOptions ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Show Answers</dt>
                <dd>
                  {showAnswersAfter === "submit"
                    ? "On Submit"
                    : showAnswersAfter === "never"
                      ? "Never"
                      : "If Passed"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          disabled={saving}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && (!title || !courseId)}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={saving}>
            <Check className="mr-2 h-4 w-4" />
            {saving ? "Creating..." : "Create Quiz & Go to Builder"}
          </Button>
        )}
      </div>
    </div>
  );
}
