"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pin, CheckCircle2, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useStreamQuestions } from "@/hooks/useStreamQuestions";
import { toast } from "sonner";

interface QuestionsPanelProps {
  streamId: string;
  isAdmin?: boolean;
}

export function QuestionsPanel({
  streamId,
  isAdmin = false,
}: QuestionsPanelProps) {
  const { questions, unansweredCount, loading, markAnswered, pinQuestion } =
    useStreamQuestions(streamId);

  const handleMarkAnswered = async (questionId: string) => {
    try {
      await markAnswered(questionId);
      toast.success("Question marked as answered");
    } catch (error) {
      console.error("Failed to mark question as answered:", error);
      toast.error("Failed to mark question as answered");
    }
  };

  const handlePinQuestion = async (questionId: string) => {
    try {
      await pinQuestion(questionId);
      toast.success("Question pinned");
    } catch (error) {
      console.error("Failed to pin question:", error);
      toast.error("Failed to pin question");
    }
  };

  const unansweredQuestions = questions.filter((q) => !q.is_answered);
  const answeredQuestions = questions.filter((q) => q.is_answered);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Student Questions</CardTitle>
        <CardDescription>
          {unansweredCount} unanswered · {questions.length} total
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 border rounded-lg">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading questions...
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No questions yet
              </div>
            ) : (
              <>
                {/* Unanswered Questions */}
                {unansweredQuestions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      Unanswered ({unansweredQuestions.length})
                    </h4>
                    <div className="space-y-2">
                      {unansweredQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="border border-amber-200 bg-amber-50 rounded p-3 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {q.author_name || "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(q.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              ❓
                            </Badge>
                          </div>

                          <p className="text-foreground mb-2">{q.message}</p>

                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs"
                                onClick={() => handleMarkAnswered(q.id)}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Mark Answered
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handlePinQuestion(q.id)}
                                title="Pin question"
                              >
                                <Pin className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answered Questions */}
                {answeredQuestions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      Answered ({answeredQuestions.length})
                    </h4>
                    <div className="space-y-2">
                      {answeredQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="border border-green-200 bg-green-50 rounded p-3 text-sm opacity-75"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {q.author_name || "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(q.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                              ✓ Answered
                            </Badge>
                          </div>

                          <p className="text-foreground line-clamp-2">
                            {q.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
