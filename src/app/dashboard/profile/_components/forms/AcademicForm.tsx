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

import type { Database } from "@/types/database.v2.types";

import { academicSchema, type AcademicValues } from "../schema";
import type { ProfileData } from "../types";

interface AcademicFormProps {
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

export function AcademicForm({ profile }: AcademicFormProps) {
  const supabase = React.useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const form = useForm<AcademicValues>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      college_name: profile.studentProfile?.college_name ?? null,
      university: profile.studentProfile?.university ?? null,
      degree: profile.studentProfile?.degree ?? null,
      graduation_year: profile.studentProfile?.graduation_year ?? null,
      field_of_study: profile.studentProfile?.field_of_study ?? null,
      current_employer: profile.studentProfile?.current_employer ?? null,
      job_title: profile.studentProfile?.job_title ?? null,
      years_of_experience:
        profile.studentProfile?.years_of_experience ?? null,
    },
  });

  React.useEffect(() => {
    form.reset({
      college_name: profile.studentProfile?.college_name ?? null,
      university: profile.studentProfile?.university ?? null,
      degree: profile.studentProfile?.degree ?? null,
      graduation_year: profile.studentProfile?.graduation_year ?? null,
      field_of_study: profile.studentProfile?.field_of_study ?? null,
      current_employer: profile.studentProfile?.current_employer ?? null,
      job_title: profile.studentProfile?.job_title ?? null,
      years_of_experience:
        profile.studentProfile?.years_of_experience ?? null,
    });
  }, [form, profile]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          college_name: normalizeOptionalString(values.college_name),
          university: normalizeOptionalString(values.university),
          degree: normalizeOptionalString(values.degree),
          graduation_year: normalizeOptionalNumber(values.graduation_year),
          field_of_study: normalizeOptionalString(values.field_of_study),
          current_employer: normalizeOptionalString(values.current_employer),
          job_title: normalizeOptionalString(values.job_title),
          years_of_experience: normalizeOptionalNumber(
            values.years_of_experience,
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
      console.error("[academic_form] submit error:", err);
      toast.error(err.message || "Could not update profile");
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Academic & Professional</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Share your education and work background.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-6 md:grid-cols-2 p-6">
            <FormField
              control={form.control}
              name="college_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">College name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">University</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Degree</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="graduation_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Graduation year</FormLabel>
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
              name="field_of_study"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Field of study</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="current_employer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Current employer</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Job title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="years_of_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Years of experience</FormLabel>
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
