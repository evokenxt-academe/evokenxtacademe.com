import { QuizBuilderLayoutWithProvider } from "@/components/quiz/builder/QuizBuilderLayoutWithProvider";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { LiveIndicator } from "@/components/quiz/LiveIndicator";
import { Badge } from "@/components/ui/badge";

async function getQuiz(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, course:courses(subject_id)")
    .eq("id", id)
    .single();
    
  if (error || !data) return null;
  return { ...data, subject_id: (data.course as any)?.subject_id };
}

export default async function BuilderPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const quiz = await getQuiz(quizId);
  
  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/admin">Admin</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/admin/quizzes">Quizzes</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link href={`/admin/quizzes/${quiz.id}`}>{quiz.title}</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Builder</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <LiveIndicator table={`quiz-builder-${quizId}`} />
      </div>

      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold tracking-tight truncate">{quiz.title}</h1>
        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Builder Mode</Badge>
      </div>

      <QuizBuilderLayoutWithProvider quizId={quiz.id} subjectId={quiz.subject_id} />
    </div>
  );
}
