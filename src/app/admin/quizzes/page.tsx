"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { QuizStatsRow } from "@/components/quiz/QuizStatsRow";
import { QuizAnalyticsRow } from "@/components/quiz/QuizAnalyticsRow";
import { QuizTable } from "@/components/quiz/QuizTable";
import { LiveIndicator } from "@/components/quiz/LiveIndicator";
import { useQuizzes } from "@/hooks/useQuizzes";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QuizDashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const filters = {
    search: search || undefined,
    program: program !== "all" ? program : undefined,
    type: type !== "all" ? type : undefined,
    status: status !== "all" ? status : undefined,
  };

  const { data: quizzes, isLoading } = useQuizzes(filters);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/admin">Admin</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Quizzes</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes & Tests</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage assessments across all certification programs</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator table="quizzes" />
          <Button onClick={() => router.push("/admin/quizzes/new")}>
            <Plus className="mr-2 h-4 w-4" />New Quiz
          </Button>
        </div>
      </div>

      <QuizStatsRow />
      <QuizAnalyticsRow />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search quizzes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={program} onValueChange={setProgram}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Program" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="ACCA">ACCA</SelectItem>
            <SelectItem value="CFA">CFA</SelectItem>
            <SelectItem value="CMA">CMA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="mock_exam">Mock Exam</SelectItem>
            <SelectItem value="final_exam">Final Exam</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <QuizTable data={quizzes ?? []} isLoading={isLoading} />
    </div>
  );
}
