import { QuizBuilderLayoutWithProvider } from "@/components/quiz/builder/QuizBuilderLayoutWithProvider";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { LiveIndicator } from "@/components/quiz/LiveIndicator";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

async function getQuiz(id: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from("quizzes")
    .select("id, title")
    .eq("id", id)
    .single() as any);

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
  };
}

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const quiz = await getQuiz(quizId);

  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumb className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="hidden sm:inline-flex">
              <BreadcrumbLink asChild>
                <Link href="/admin">Admin</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:inline-flex" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/quizzes">Quizzes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/admin/quizzes/${quiz.id}`} className="max-w-[140px] truncate sm:max-w-none">
                  {quiz.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Builder</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <LiveIndicator table={`quiz-builder-${quizId}`} />
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 sm:inline-flex"
            asChild
          >
            <Link href={`/admin/quizzes/${quiz.id}`}>
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Quiz settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
          {quiz.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Add, edit, and reorder questions for this quiz.
        </p>
      </div>

      <QuizBuilderLayoutWithProvider quizId={quiz.id} />
    </div>
  );
}
