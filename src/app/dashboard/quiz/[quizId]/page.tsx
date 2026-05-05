import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;
  redirect(`/quiz/${encodeURIComponent(quizId)}`);
}
