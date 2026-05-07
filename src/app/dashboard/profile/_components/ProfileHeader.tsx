"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card>
      <CardHeader className="gap-4 border-b p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar className="size-16">
              <AvatarImage
                src={profile.user.avatar ?? undefined}
                alt={profile.user.name ?? profile.user.email}
              />
              <AvatarFallback className="text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl leading-tight">
                  {profile.user.name?.trim() || "Student"}
                </CardTitle>
                <Badge variant="secondary">Student</Badge>
              </div>

              <CardDescription className="truncate">
                {profile.user.email}
              </CardDescription>

              {examLabel ? (
                <Badge variant="outline" className="w-fit">
                  {examLabel}
                </Badge>
              ) : null}
            </div>
          </div>

          <CardAction>
            <Button variant="outline" onClick={onEditClick} type="button">
              Edit Profile
            </Button>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
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
