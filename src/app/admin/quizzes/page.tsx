"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconBook2,
  IconEye,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconSearch,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { adminApi } from "@/features/admin/lib/admin-api";
import { type AdminQuiz } from "@/features/admin/data/admin-sample-data";

const quizStyles: Record<AdminQuiz["type"], string> = {
  practice: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  graded:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  final:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const questionSeed = [
  {
    question: "What is the key objective of strategic analysis?",
    options: [
      "Improve efficiency",
      "Formulate value creation",
      "Reduce budget",
      "Validate payroll",
    ],
  },
  {
    question: "Which control is most important in financial reporting?",
    options: [
      "Versioning",
      "Segmentation",
      "Accuracy checks",
      "Push notifications",
    ],
  },
];

export default function QuizzesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: adminApi.getQuizzes,
  });

  const quizzes = data?.quizzes ?? [];
  const [search, setSearch] = React.useState("");
  const [selectedQuiz, setSelectedQuiz] = React.useState<AdminQuiz | null>(
    null,
  );

  const filteredQuizzes = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return quizzes.filter(
      (quiz) =>
        !query ||
        quiz.title.toLowerCase().includes(query) ||
        quiz.section.toLowerCase().includes(query),
    );
  }, [search]);

  const columns = React.useMemo<ColumnDef<AdminQuiz>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Quiz",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.title}</p>
            <p className="text-sm text-muted-foreground">
              {row.original.section}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            className={`rounded-full border px-2.5 py-1 capitalize ${quizStyles[row.original.type]}`}
          >
            {row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "totalMarks",
        header: "Marks",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.totalMarks} total / {row.original.passingMarks} pass
          </span>
        ),
      },
      {
        accessorKey: "published",
        header: "Publish",
        cell: ({ row }) => (
          <Badge
            variant={row.original.published ? "default" : "secondary"}
            className="rounded-full px-2.5 py-1"
          >
            {row.original.published ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setSelectedQuiz(row.original)}
            >
              <IconEye />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => toast.success("Open quiz editor")}
            >
              <IconPencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() =>
                toast.success(
                  row.original.published
                    ? "Quiz unpublished"
                    : "Quiz published",
                )
              }
            >
              {row.original.published ? (
                <IconPlayerPause />
              ) : (
                <IconPlayerPlay />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <AdminPageShell
      title="Quizzes"
      description="Track quiz configuration, publication status, and question structure."
      actions={
        <Button
          className="rounded-xl"
          onClick={() =>
            toast.info("Quiz builder can hook into your content workflow")
          }
        >
          <IconBook2 />
          New quiz
        </Button>
      }
    >
      <AdminResourceTable
        columns={columns}
        data={filteredQuizzes}
        emptyTitle="No quizzes found"
        emptyDescription="Search by title or section to find the quiz you want to manage."
        isLoading={isLoading}
        toolbar={
          <>
            <div className="relative min-w-60 flex-1 md:max-w-md">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-xl pl-9"
                placeholder="Search quizzes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="h-10 rounded-xl md:w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <Dialog
        open={!!selectedQuiz}
        onOpenChange={(open) => !open && setSelectedQuiz(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.title}</DialogTitle>
            <DialogDescription>{selectedQuiz?.section}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {questionSeed.map((question, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border/70 p-4"
              >
                <p className="font-medium">
                  Q{index + 1}. {question.question}
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {question.options.map((option) => (
                    <div
                      key={option}
                      className="rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
