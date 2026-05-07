"use client";

import { useState } from "react";
import { QuestionList } from "./QuestionList";
import { ManualEditor } from "./tabs/ManualEditor";
import { FormattedTextEditor } from "./tabs/FormattedTextEditor";
import { PdfImportEditor } from "./tabs/PdfImportEditor";
import { QuestionBankSelector } from "./tabs/QuestionBankSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PenLine, FileText, FileUp, Database, Settings } from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface QuizBuilderLayoutProps {
  quizId: string;
  subjectId?: string;
}

export function QuizBuilderLayout({ quizId, subjectId }: QuizBuilderLayoutProps) {
  const router = useRouter();
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const { data: questions } = useQuestions(quizId);
  
  const activeQuestion = questions?.find(q => q.id === activeQuestionId) ?? null;

  return (
    <div className="grid h-[calc(100vh-140px)] grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden rounded-lg border bg-card shadow-sm">
      <QuestionList quizId={quizId} activeId={activeQuestionId} onSelect={setActiveQuestionId} />
      
      <div className="flex flex-col h-full overflow-hidden">
        <Tabs defaultValue="manual" className="flex-1 flex flex-col h-full">
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/20">
            <TabsList className="bg-transparent space-x-2">
              <TabsTrigger value="manual" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <PenLine className="mr-2 h-4 w-4" />Editor
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileText className="mr-2 h-4 w-4" />Text Import
              </TabsTrigger>
              <TabsTrigger value="pdf" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileUp className="mr-2 h-4 w-4" />PDF Import
              </TabsTrigger>
              <TabsTrigger value="bank" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Database className="mr-2 h-4 w-4" />Bank
              </TabsTrigger>
            </TabsList>
            
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/quizzes/${quizId}`)}>
              <Settings className="mr-2 h-4 w-4" />Quiz Settings
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
            <TabsContent value="manual" className="m-0 h-full">
              <div className="max-w-4xl mx-auto">
                <ManualEditor 
                  quizId={quizId} 
                  question={activeQuestion} 
                  onSaved={() => setActiveQuestionId(null)} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="m-0 h-full">
              <div className="max-w-4xl mx-auto">
                <FormattedTextEditor quizId={quizId} />
              </div>
            </TabsContent>
            
            <TabsContent value="pdf" className="m-0 h-full">
              <div className="max-w-4xl mx-auto">
                <Card className="p-5">
                  <PdfImportEditor quizId={quizId} />
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="bank" className="m-0 h-full">
              <div className="max-w-5xl mx-auto h-full">
                <QuestionBankSelector quizId={quizId} subjectId={subjectId} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
