"use client";

import { useState } from "react";
import {
  useBankStats,
  useBankQuestions,
  useVerifyBankQuestion,
} from "@/hooks/useBankQuestions";
import {
  usePrograms,
  useProgramLevels,
  useSubjects,
  useTopics,
  useSubTopics,
} from "@/hooks/useTopics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  ShieldCheck,
  Search,
  Plus,
  UploadCloud,
  CheckCircle,
  RefreshCw,
  Layers,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function QuestionBankPage() {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState("all");
  const [levelId, setLevelId] = useState("all");
  const [subjectId, setSubjectId] = useState("all");
  const [topicId, setTopicId] = useState("all");
  const [subTopicId, setSubTopicId] = useState("all");
  const [type, setType] = useState("all");
  const [verified, setVerified] = useState("all");

  // Taxonomy Data
  const { data: programs } = usePrograms();
  const { data: levels } = useProgramLevels(
    programId !== "all" ? programId : undefined,
  );
  const { data: subjects } = useSubjects(
    levelId !== "all" ? levelId : undefined,
  );
  const { data: topics } = useTopics(
    subjectId !== "all" ? subjectId : undefined,
  );
  const { data: subTopics } = useSubTopics(
    topicId !== "all" ? topicId : undefined,
  );

  // Bank Data
  const { data: stats, isLoading: statsLoading } = useBankStats(
    subjectId !== "all" ? subjectId : undefined,
  );

  const filters = {
    search: search || undefined,
    subject_id: subjectId !== "all" ? subjectId : undefined,
    topic_id: topicId !== "all" ? topicId : undefined,
    sub_topic_id: subTopicId !== "all" ? subTopicId : undefined,
    type: type !== "all" ? type : undefined,
    verified: verified !== "all" ? verified : undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useBankQuestions(filters);
  const questions = data?.pages.flatMap((p) => p.data) ?? [];
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const verifyMutation = useVerifyBankQuestion();

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized repository for all assessment items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/bank/import")}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => router.push("/admin/bank/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Question
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Questions
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalQuestions ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Verified Questions
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {stats?.verifiedCount ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  (
                  {stats?.totalQuestions
                    ? Math.round(
                        ((stats.verifiedCount ?? 0) / stats.totalQuestions) *
                          100,
                      )
                    : 0}
                  %)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Subjects
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.subjectCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search question bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={programId}
            onValueChange={(v) => {
              setProgramId(v);
              setLevelId("all");
              setSubjectId("all");
              setTopicId("all");
              setSubTopicId("all");
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {(programs ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.body}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={levelId}
            onValueChange={(v) => {
              setLevelId(v);
              setSubjectId("all");
              setTopicId("all");
              setSubTopicId("all");
            }}
            disabled={programId === "all"}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {(levels ?? []).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={subjectId}
            onValueChange={(v) => {
              setSubjectId(v);
              setTopicId("all");
              setSubTopicId("all");
            }}
            disabled={levelId === "all"}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {(subjects ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={topicId}
            onValueChange={(v) => {
              setTopicId(v);
              setSubTopicId("all");
            }}
            disabled={subjectId === "all"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {(topics ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={subTopicId}
            onValueChange={setSubTopicId}
            disabled={topicId === "all"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sub Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sub Topics</SelectItem>
              {(subTopics ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="multiple_select">Multi Select</SelectItem>
              <SelectItem value="numerical">Numerical</SelectItem>
              <SelectItem value="subjective">Subjective</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verified} onValueChange={setVerified}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {status === "pending" ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">No questions found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust your filters or import new questions.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {q.subject?.code ?? "N/A"}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">
                          {q.topic?.name || "Uncategorized"}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{q.question_text}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {q.type.replace("_", " ")}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {q.difficulty}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {q.marks} marks
                        </span>
                        {q.usage_count > 0 && (
                          <span className="text-[10px] text-muted-foreground ml-2 border px-1.5 py-0.5 rounded-sm">
                            Used in {q.usage_count} quizzes
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {q.is_verified ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            verifyMutation.mutate({ id: q.id, verified: true })
                          }
                          disabled={verifyMutation.isPending}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push(`/admin/bank/${q.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={ref} className="py-6 text-center">
                {isFetchingNextPage ? (
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                ) : hasNextPage ? (
                  "Scroll for more"
                ) : (
                  "End of results"
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
