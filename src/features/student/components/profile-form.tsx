"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconLoader2, IconUser, IconMail, IconPhone } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ProfileFormProps {
  profile: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    phone: string | null;
    role: string | null;
    createdAt: string | null;
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(profile.name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile.email.slice(0, 2).toUpperCase();

  const handleSave = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/student/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          toast.error(payload?.error ?? "Could not update profile");
          return;
        }

        toast.success("Profile updated successfully");
        router.refresh();
      } catch {
        toast.error("Could not update profile");
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      {/* Avatar card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <Avatar className="size-20">
            <AvatarImage src={profile.avatar ?? undefined} />
            <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <div className="font-semibold">{profile.name || "Student"}</div>
            <div className="text-sm text-muted-foreground">{profile.email}</div>
          </div>
          <div className="w-full space-y-2 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{profile.role ?? "student"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                  : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your personal information. Email is linked to your auth provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={profile.email}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Managed by your authentication provider.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <IconCheck className="mr-2 size-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
