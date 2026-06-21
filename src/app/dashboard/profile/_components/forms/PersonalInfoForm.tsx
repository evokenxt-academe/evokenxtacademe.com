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
import { Textarea } from "@/components/ui/textarea";

import type { Database } from "@/types/database.v2.types";

import { personalInfoSchema, type PersonalInfoValues } from "../schema";
import { genderOptions, type ProfileData } from "../types";

interface PersonalInfoFormProps {
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

export function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const supabase = React.useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: profile.user.name ?? "",
      phone: profile.user.phone ?? null,
      date_of_birth: profile.studentProfile?.date_of_birth ?? null,
      gender: profile.studentProfile?.gender ?? null,
      bio: profile.studentProfile?.bio ?? null,
      linkedin_url: profile.studentProfile?.linkedin_url ?? null,
    },
  });

  React.useEffect(() => {
    form.reset({
      name: profile.user.name ?? "",
      phone: profile.user.phone ?? null,
      date_of_birth: profile.studentProfile?.date_of_birth ?? null,
      gender: profile.studentProfile?.gender ?? null,
      bio: profile.studentProfile?.bio ?? null,
      linkedin_url: profile.studentProfile?.linkedin_url ?? null,
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
          name: values.name,
          phone: normalizeOptionalString(values.phone),
          date_of_birth: normalizeOptionalString(values.date_of_birth),
          gender: values.gender ?? null,
          bio: normalizeOptionalString(values.bio),
          linkedin_url: normalizeOptionalString(values.linkedin_url),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Could not update profile");
      }

      toast.success("Profile updated");
      router.refresh();
    } catch (err: any) {
      console.error("[personal_form] submit error:", err);
      toast.error(err.message || "Could not update profile");
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Personal Info</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Update your basic account and identity details.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-6 md:grid-cols-2 p-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Your full name" 
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || null)
                      }
                      placeholder="+91 98765 43210"
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
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Date of birth</FormLabel>
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
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Gender</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(value || null)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full rounded-lg border-zinc-200/80 dark:border-zinc-800/80">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender.replace(/_/g, " ")}
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
              name="bio"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="flex items-end justify-between gap-3">
                    <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Bio</FormLabel>
                    <span className="text-xs text-zinc-400">
                      {field.value?.length ?? 0}/300
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || null)
                      }
                      maxLength={300}
                      placeholder="A short professional summary about yourself"
                      disabled={isSubmitting}
                      className="rounded-lg border-zinc-200/80 dark:border-zinc-800/80 min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || null)
                      }
                      placeholder="https://www.linkedin.com/in/your-profile"
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
