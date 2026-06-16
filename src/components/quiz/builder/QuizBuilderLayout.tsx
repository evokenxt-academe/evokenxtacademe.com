"use client";

import { useState } from "react";
import { QuestionList } from "./QuestionList";
import { ManualEditor } from "./tabs/ManualEditor";
import { FormattedTextEditor } from "./tabs/FormattedTextEditor";
import { PdfImportEditor } from "./tabs/PdfImportEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PenLine, FileText, FileUp, Settings, List } from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface QuizBuilderLayoutProps {
  quizId: string;
}

export function QuizBuilderLayout({ quizId }: QuizBuilderLayoutProps) {
  const router = useRouter();
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const { data: questions } = useQuestions(quizId);

  const activeQuestion =
    questions?.find((q) => q.id === activeQuestionId) ?? null;
  const questionCount = questions?.length ?? 0;

  function handleSelectQuestion(id: string | null) {
    setActiveQuestionId(id);
    setQuestionsOpen(false);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm md:h-[calc(100vh-180px)]">
      {/* Mobile: quick access to question list */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5 md:hidden">
        <Sheet open={questionsOpen} onOpenChange={setQuestionsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <List className="h-4 w-4" />
              Questions
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1.5 text-[10px] font-medium"
              >
                {questionCount}
              </Badge>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100vw-1rem,360px)] p-0 sm:max-w-sm">
            <SheetHeader className="sr-only">
              <SheetTitle>Quiz questions</SheetTitle>
            </SheetHeader>
            <QuestionList
              quizId={quizId}
              activeId={activeQuestionId}
              onSelect={handleSelectQuestion}
              className="h-full border-0"
            />
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => router.push(`/admin/quizzes/${quizId}`)}
          aria-label="Quiz settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Desktop sidebar */}
        <div className="hidden min-h-0 w-full shrink-0 md:flex md:w-[min(100%,340px)] md:max-w-[340px] md:flex-col md:overflow-hidden lg:w-[360px] lg:max-w-[360px]">
          <QuestionList
            quizId={quizId}
            activeId={activeQuestionId}
            onSelect={setActiveQuestionId}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t md:border-t-0 md:border-l">
          <Tabs
            defaultValue="manual"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/20 px-3 py-2 md:px-4">
              <TabsList className="h-9 w-full justify-start gap-0.5 overflow-x-auto bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] md:w-auto [&::-webkit-scrollbar]:hidden">
                <TabsTrigger
                  value="manual"
                  className="shrink-0 gap-1.5 rounded-md px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Write
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="shrink-0 gap-1.5 rounded-md px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Paste
                </TabsTrigger>
                <TabsTrigger
                  value="pdf"
                  className="shrink-0 gap-1.5 rounded-md px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  PDF
                </TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                size="sm"
                className="hidden h-8 shrink-0 md:inline-flex"
                onClick={() => router.push(`/admin/quizzes/${quizId}`)}
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Settings
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              <TabsContent value="manual" className="mt-0 outline-none">
                <div className="mx-auto max-w-3xl">
                  <p className="mb-4 text-sm text-muted-foreground">
                    {activeQuestion
                      ? "Edit the selected question below."
                      : "Create a new question or pick one from the list."}
                  </p>
                  <ManualEditor
                    quizId={quizId}
                    question={activeQuestion}
                    onSaved={() => setActiveQuestionId(null)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-0 outline-none">
                <div className="mx-auto max-w-3xl">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Paste structured text to add multiple questions at once.
                  </p>
                  <FormattedTextEditor quizId={quizId} />
                </div>
              </TabsContent>

              <TabsContent value="pdf" className="mt-0 outline-none">
                <div className="mx-auto max-w-3xl">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Upload a PDF to extract and import questions.
                  </p>
                  <PdfImportEditor quizId={quizId} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
