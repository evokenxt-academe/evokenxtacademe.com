"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { QuizBuilderLayout } from "./QuizBuilderLayout";

type Props = {
  quizId: string;
  subjectId?: string;
};

export function QuizBuilderLayoutWithProvider({ quizId, subjectId }: Props) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <QuizBuilderLayout quizId={quizId} subjectId={subjectId} />
    </QueryClientProvider>
  );
}

