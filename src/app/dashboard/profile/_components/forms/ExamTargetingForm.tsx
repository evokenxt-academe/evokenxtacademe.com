"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalNumber(
  value: number | undefined,
): number | null | undefined {
  return value === undefined || Number.isNaN(value) ? undefined : value;
}

export function ExamTargetingForm({ profile }: ExamTargetingFormProps) {
  const supabase = React.useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const form = useForm<ExamTargetingValues>({
    resolver: zodResolver(examTargetingSchema),
    defaultValues: {
      target_exam_body: profile.studentProfile?.target_exam_body ?? undefined,
      target_exam_level: profile.studentProfile?.target_exam_level ?? undefined,
      target_exam_date: profile.studentProfile?.target_exam_date ?? undefined,
      exam_attempt_number:
        profile.studentProfile?.exam_attempt_number ?? undefined,
    },
  });

  const selectedBody = form.watch("target_exam_body") as ExamBody | undefined;

  React.useEffect(() => {
    form.reset({
      target_exam_body: profile.studentProfile?.target_exam_body ?? undefined,
      target_exam_level: profile.studentProfile?.target_exam_level ?? undefined,
      target_exam_date: profile.studentProfile?.target_exam_date ?? undefined,
      exam_attempt_number:
        profile.studentProfile?.exam_attempt_number ?? undefined,
    });
  }, [form, profile]);

  React.useEffect(() => {
    const allowedLevels = new Set(getExamLevelOptions(selectedBody));
    const currentLevel = form.getValues("target_exam_level");

    if (currentLevel && !allowedLevels.has(currentLevel)) {
      form.setValue("target_exam_level", undefined);
    }
  }, [form, selectedBody]);

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.from("student_profiles").upsert(
      {
        user_id: profile.user.id,
        target_exam_body: values.target_exam_body ?? null,
        target_exam_level: normalizeOptionalString(values.target_exam_level),
        target_exam_date: normalizeOptionalString(values.target_exam_date),
        exam_attempt_number: normalizeOptionalNumber(
          values.exam_attempt_number,
        ),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      toast.error(error.message || "Could not update profile");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  });

  const levelOptions = getExamLevelOptions(selectedBody);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Targeting</CardTitle>
        <CardDescription>
          Set your certification path and target timeline.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="target_exam_body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target exam body</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value || undefined);
                        form.setValue("target_exam_level", undefined);
                      }}
                    >
                      <SelectTrigger className="w-full">
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
                  <FormLabel>Target exam level</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(value || undefined)
                      }
                      disabled={!selectedBody}
                    >
                      <SelectTrigger className="w-full">
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
                  <FormLabel>Target exam date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || undefined)
                      }
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
                  <FormLabel>Exam attempt number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        field.onChange(
                          nextValue === "" ? undefined : Number(nextValue),
                        );
                      }}
                      min={1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
