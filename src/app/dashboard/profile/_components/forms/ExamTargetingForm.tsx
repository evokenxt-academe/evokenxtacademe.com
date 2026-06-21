"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Database } from "@/types/database.v2.types";

import { examTargetingSchema, type ExamTargetingValues } from "../schema";
import {
  examBodies,
  getExamLevelOptions,
  type ExamBody,
  type ProfileData,
} from "../types";

interface ExamTargetingFormProps {
  profile: ProfileData;
}

function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalNumber(
  value: number | null | undefined,
): number | null {
  return value === null || value === undefined || Number.isNaN(value) ? null : value;
}

export function ExamTargetingForm({ profile }: ExamTargetingFormProps) {
  const supabase = React.useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const form = useForm<ExamTargetingValues>({
    resolver: zodResolver(examTargetingSchema),
    defaultValues: {
      target_exam_body: profile.studentProfile?.target_exam_body ?? null,
      target_exam_level: profile.studentProfile?.target_exam_level ?? null,
      target_exam_date: profile.studentProfile?.target_exam_date ?? null,
      exam_attempt_number:
        profile.studentProfile?.exam_attempt_number ?? null,
    },
  });

  const selectedBody = form.watch("target_exam_body") as ExamBody | null;

  React.useEffect(() => {
    form.reset({
      target_exam_body: profile.studentProfile?.target_exam_body ?? null,
      target_exam_level: profile.studentProfile?.target_exam_level ?? null,
      target_exam_date: profile.studentProfile?.target_exam_date ?? null,
      exam_attempt_number:
        profile.studentProfile?.exam_attempt_number ?? null,
    });
  }, [form, profile]);

  React.useEffect(() => {
    const allowedLevels = new Set(getExamLevelOptions(selectedBody));
    const currentLevel = form.getValues("target_exam_level");

    if (currentLevel && !allowedLevels.has(currentLevel)) {
      form.setValue("target_exam_level", null);
    }
  }, [form, selectedBody]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_exam_body: values.target_exam_body ?? null,
          target_exam_level: normalizeOptionalString(values.target_exam_level),
          target_exam_date: normalizeOptionalString(values.target_exam_date),
          exam_attempt_number: normalizeOptionalNumber(
            values.exam_attempt_number,
          ),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Could not update profile");
      }

      toast.success("Profile updated");
      router.refresh();
    } catch (err: any) {
      console.error("[exam_targeting_form] submit error:", err);
      toast.error(err.message || "Could not update profile");
    }
  });

  const levelOptions = getExamLevelOptions(selectedBody);
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Exam Targeting</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Set your certification path and target timeline.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-6 md:grid-cols-2 p-6">
            <FormField
              control={form.control}
              name="target_exam_body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Target exam body</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value || null);
                        form.setValue("target_exam_level", null);
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full rounded-lg border-zinc-200/80 dark:border-zinc-800/80">
                        <SelectValue placeholder="Select body" />
                      </SelectTrigger>
                      <SelectContent>
                        {examBodies.map((body) => (
                          <SelectItem key={body} value={body}>
                            {body}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_exam_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Target exam level</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(value || null)
                      }
                      disabled={!selectedBody || isSubmitting}
                    >
                      <SelectTrigger className="w-full rounded-lg border-zinc-200/80 dark:border-zinc-800/80">
                        <SelectValue
                          placeholder={
                            selectedBody ? "Select level" : "Choose body first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {levelOptions.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_exam_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Target exam date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || null)
                      }
                      disabled={isSubmitting}
                      className="rounded-lg border-zinc-200/80 dark:border-zinc-800/80"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exam_attempt_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Exam attempt number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        field.onChange(
                          nextValue === "" ? null : Number(nextValue),
                        );
                      }}
                      min={1}
                      disabled={isSubmitting}
                      className="rounded-lg border-zinc-200/80 dark:border-zinc-800/80"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="justify-end border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
