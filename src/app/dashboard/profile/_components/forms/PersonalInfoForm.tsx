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
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
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
      phone: profile.user.phone ?? undefined,
      date_of_birth: profile.studentProfile?.date_of_birth ?? undefined,
      gender: profile.studentProfile?.gender ?? undefined,
      bio: profile.studentProfile?.bio ?? undefined,
      linkedin_url: profile.studentProfile?.linkedin_url ?? undefined,
    },
  });

  React.useEffect(() => {
    form.reset({
      name: profile.user.name ?? "",
      phone: profile.user.phone ?? undefined,
      date_of_birth: profile.studentProfile?.date_of_birth ?? undefined,
      gender: profile.studentProfile?.gender ?? undefined,
      bio: profile.studentProfile?.bio ?? undefined,
      linkedin_url: profile.studentProfile?.linkedin_url ?? undefined,
    });
  }, [form, profile]);

  const onSubmit = form.handleSubmit(async (values) => {
    const [userResult, profileResult] = await Promise.all([
      supabase
        .from("users")
        .update({
          name: values.name.trim(),
          phone: normalizeOptionalString(values.phone),
        })
        .eq("id", profile.user.id),
      supabase.from("student_profiles").upsert(
        {
          user_id: profile.user.id,
          date_of_birth: normalizeOptionalString(values.date_of_birth),
          gender: values.gender ?? null,
          bio: normalizeOptionalString(values.bio),
          linkedin_url: normalizeOptionalString(values.linkedin_url),
        },
        { onConflict: "user_id" },
      ),
    ]);

    if (userResult.error) {
      toast.error(userResult.error.message || "Could not update profile");
      return;
    }

    if (profileResult.error) {
      toast.error(profileResult.error.message || "Could not update profile");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Info</CardTitle>
        <CardDescription>
          Update your basic account and identity details.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your full name" />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || undefined)
                      }
                      placeholder="+91 98765 43210"
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
                  <FormLabel>Date of birth</FormLabel>
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
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(value || undefined)
                      }
                    >
                      <SelectTrigger className="w-full">
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
                    <FormLabel>Bio</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {field.value?.length ?? 0}/300
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || undefined)
                      }
                      maxLength={300}
                      placeholder="A short professional summary"
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
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || undefined)
                      }
                      placeholder="https://www.linkedin.com/in/your-profile"
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
