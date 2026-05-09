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
  value: string | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeCountry(value: string | undefined): string {
  return value?.trim() || "India";
}

export function LocationNotifForm({ profile }: LocationNotifFormProps) {
  const supabase = React.useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  const form = useForm<LocationNotifValues>({
    resolver: zodResolver(locationNotifSchema),
    defaultValues: {
      city: profile.studentProfile?.city ?? undefined,
      state: profile.studentProfile?.state ?? undefined,
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
      city: profile.studentProfile?.city ?? undefined,
      state: profile.studentProfile?.state ?? undefined,
      country: profile.studentProfile?.country ?? "India",
      preferred_language: profile.studentProfile?.preferred_language ?? "en",
      notification_email: profile.studentProfile?.notification_email ?? true,
      notification_sms: profile.studentProfile?.notification_sms ?? false,
      notification_whatsapp:
        profile.studentProfile?.notification_whatsapp ?? false,
    });
  }, [form, profile]);

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.from("student_profiles").upsert(
      {
        user_id: profile.user.id,
        city: normalizeOptionalString(values.city),
        state: normalizeOptionalString(values.state),
        country: normalizeCountry(values.country),
        preferred_language: values.preferred_language,
        notification_email: values.notification_email,
        notification_sms: values.notification_sms,
        notification_whatsapp: values.notification_whatsapp,
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
        <CardTitle>Location & Notifications</CardTitle>
        <CardDescription>
          Set your location and notification preferences.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
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
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
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
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? "India"}
                      onChange={(event) =>
                        field.onChange(event.target.value || "India")
                      }
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
                  <FormLabel>Preferred language</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? "en"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
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

            <FormField
              control={form.control}
              name="notification_email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                  <div className="space-y-1">
                    <FormLabel>Email notifications</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Receive updates by email.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                  <div className="space-y-1">
                    <FormLabel>SMS notifications</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Receive updates by text message.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                  <div className="space-y-1">
                    <FormLabel>WhatsApp notifications</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Receive updates on WhatsApp.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
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
