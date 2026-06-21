"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";

import type { Database } from "@/types/database.v2.types";

import { locationNotifSchema, type LocationNotifValues } from "../schema";
import { languageOptions, type ProfileData } from "../types";

interface LocationNotifFormProps {
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

function normalizeCountry(value: string | null | undefined): string {
  return value?.trim() || "India";
}

export function LocationNotifForm({ profile }: LocationNotifFormProps) {
  const supabase = React.useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const form = useForm<LocationNotifValues>({
    resolver: zodResolver(locationNotifSchema),
    defaultValues: {
      city: profile.studentProfile?.city ?? null,
      state: profile.studentProfile?.state ?? null,
      country: profile.studentProfile?.country ?? "India",
      preferred_language: profile.studentProfile?.preferred_language ?? "en",
      notification_email: profile.studentProfile?.notification_email ?? true,
      notification_sms: profile.studentProfile?.notification_sms ?? false,
      notification_whatsapp:
        profile.studentProfile?.notification_whatsapp ?? false,
    },
  });

  React.useEffect(() => {
    form.reset({
      city: profile.studentProfile?.city ?? null,
      state: profile.studentProfile?.state ?? null,
      country: profile.studentProfile?.country ?? "India",
      preferred_language: profile.studentProfile?.preferred_language ?? "en",
      notification_email: profile.studentProfile?.notification_email ?? true,
      notification_sms: profile.studentProfile?.notification_sms ?? false,
      notification_whatsapp:
        profile.studentProfile?.notification_whatsapp ?? false,
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
          city: normalizeOptionalString(values.city),
          state: normalizeOptionalString(values.state),
          country: normalizeCountry(values.country),
          preferred_language: values.preferred_language,
          notification_email: values.notification_email,
          notification_sms: values.notification_sms,
          notification_whatsapp: values.notification_whatsapp,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Could not update profile");
      }

      toast.success("Profile updated");
      router.refresh();
    } catch (err: any) {
      console.error("[location_notif_form] submit error:", err);
      toast.error(err.message || "Could not update profile");
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Location & Preferences</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Set your location and notification preferences.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-6 md:grid-cols-2 p-6">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">City</FormLabel>
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
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">State</FormLabel>
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
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Country</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? "India"}
                      onChange={(event) =>
                        field.onChange(event.target.value || "India")
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
              name="preferred_language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300 font-semibold">Preferred language</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? "en"}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full rounded-lg border-zinc-200/80 dark:border-zinc-800/80">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">Notification Channels</h3>

              <FormField
                control={form.control}
                name="notification_email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-200/85 dark:border-zinc-800/85 p-4 space-y-0">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-zinc-500" />
                        <FormLabel className="font-semibold text-zinc-800 dark:text-zinc-200">Email notifications</FormLabel>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Receive system, course progress, and grading updates by email.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notification_sms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-200/85 dark:border-zinc-800/85 p-4 space-y-0">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="size-4 text-zinc-500" />
                        <FormLabel className="font-semibold text-zinc-800 dark:text-zinc-200">SMS notifications</FormLabel>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Receive important updates and urgent alerts via mobile text messages.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notification_whatsapp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-200/85 dark:border-zinc-800/85 p-4 space-y-0">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        {/* Custom SVG icon for WhatsApp to keep layout clean */}
                        <svg className="size-4 text-zinc-500 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
                        </svg>
                        <FormLabel className="font-semibold text-zinc-800 dark:text-zinc-200">WhatsApp notifications</FormLabel>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Receive instant reminders, quiz reports, and streaming session announcements on WhatsApp.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
