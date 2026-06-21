"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { formatExamHeaderLabel, getInitials, type ProfileData } from "./types";

interface ProfileHeaderProps {
  profile: ProfileData;
  onEditClick: () => void;
}

export function ProfileHeader({ profile, onEditClick }: ProfileHeaderProps) {
  const initials = getInitials(profile.user.name, profile.user.email);
  const examLabel = formatExamHeaderLabel(
    profile.studentProfile?.target_exam_body,
    profile.studentProfile?.target_exam_level,
  );

  return (
    <Card className="overflow-hidden rounded-2xl border border-zinc-200/80 shadow-sm dark:border-zinc-800/80">
      <CardContent className="p-6 relative mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between -mt-16 md:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="flex flex-col items-center">
              <div className="relative size-24 md:size-28 rounded-full border-4 border-background shadow-md overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage
                    src={profile.user.avatar ?? undefined}
                    alt={profile.user.name ?? profile.user.email}
                    className="object-cover h-full w-full"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center h-full w-full">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  {profile.user.name?.trim() || "Student"}
                </h2>
                <Badge
                  variant="secondary"
                  className="font-semibold bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-xs uppercase px-2.5 py-0.5"
                >
                  Student
                </Badge>
              </div>

              <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {profile.user.email}
              </div>

              {examLabel ? (
                <Badge
                  variant="outline"
                  className="w-fit border-indigo-100 bg-indigo-50/50 text-indigo-700 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-300 font-medium"
                >
                  {examLabel}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="pt-2 sm:pt-16 flex justify-center w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onEditClick}
              type="button"
              className="w-full"
            >
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
            {profile.user.role ?? "student"}
          </span>
          <span>•</span>
          <span>{profile.studentProfile?.city?.trim() || "City not set"}</span>
          <span>•</span>
          <span>
            {profile.studentProfile?.country?.trim() || "Country not set"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
