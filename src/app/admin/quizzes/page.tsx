"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Quizzes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Quizzes & Tests
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage assessments across all certification programs
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LiveIndicator table="quizzes" />
          <Button
            onClick={() => router.push("/admin/quizzes/new")}
            className="gap-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Quiz
          </Button>
        </div>
      </div>

      <QuizStatsRow />
      <QuizAnalyticsRow />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={program} onValueChange={setProgram}>
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="ACCA">ACCA</SelectItem>
            <SelectItem value="CFA">CFA</SelectItem>
            <SelectItem value="CMA">CMA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="mock_exam">Mock Exam</SelectItem>
            <SelectItem value="final_exam">Final Exam</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-30">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
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
