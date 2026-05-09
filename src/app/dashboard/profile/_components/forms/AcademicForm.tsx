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
  value: string | undefined,
): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalNumber(
  value: number | undefined,
): number | null {
  return value === undefined || Number.isNaN(value) ? null : value;
}

export function AcademicForm({ profile }: AcademicFormProps) {
  const supabase = React.useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const form = useForm<AcademicValues>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      college_name: profile.studentProfile?.college_name ?? undefined,
      university: profile.studentProfile?.university ?? undefined,
      degree: profile.studentProfile?.degree ?? undefined,
      graduation_year: profile.studentProfile?.graduation_year ?? undefined,
      field_of_study: profile.studentProfile?.field_of_study ?? undefined,
      current_employer: profile.studentProfile?.current_employer ?? undefined,
      job_title: profile.studentProfile?.job_title ?? undefined,
      years_of_experience:
        profile.studentProfile?.years_of_experience ?? undefined,
    },
  });

  React.useEffect(() => {
    form.reset({
      college_name: profile.studentProfile?.college_name ?? undefined,
      university: profile.studentProfile?.university ?? undefined,
      degree: profile.studentProfile?.degree ?? undefined,
      graduation_year: profile.studentProfile?.graduation_year ?? undefined,
      field_of_study: profile.studentProfile?.field_of_study ?? undefined,
      current_employer: profile.studentProfile?.current_employer ?? undefined,
      job_title: profile.studentProfile?.job_title ?? undefined,
      years_of_experience:
        profile.studentProfile?.years_of_experience ?? undefined,
    });
  }, [form, profile]);

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.from("student_profiles").upsert(
      {
        user_id: profile.user.id,
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
      } as any,
      { onConflict: "user_id" },
    );

    if (error) {
      toast.error(error.message || "Could not update profile");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic & Professional</CardTitle>
        <CardDescription>
          Share your education and work background.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="college_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="graduation_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Graduation year</FormLabel>
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
                  <FormLabel>Field of study</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="current_employer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current employer</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
              name="years_of_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of experience</FormLabel>
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
