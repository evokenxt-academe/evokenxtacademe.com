"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProfileHeader } from "./ProfileHeader";
import { StatsStrip } from "./StatsStrip";
import type { ProfileData, ProfileStats, ProfileTabKey } from "./types";
import { AcademicForm } from "./forms/AcademicForm";
import { ExamTargetingForm } from "./forms/ExamTargetingForm";
import { LocationNotifForm } from "./forms/LocationNotifForm";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";

interface ProfileTabsProps {
  profile: ProfileData;
  stats: ProfileStats;
}

const tabItems: Array<{ value: ProfileTabKey; label: string }> = [
  { value: "personal", label: "Personal Info" },
  { value: "academic", label: "Academic" },
  { value: "exam", label: "Exam Targeting" },
  { value: "location", label: "Location & Notifications" },
];

export function ProfileTabs({ profile, stats }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = React.useState<ProfileTabKey>("personal");
  const tabsRef = React.useRef<HTMLDivElement | null>(null);

  const handleEditClick = React.useCallback(() => {
    setActiveTab("personal");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader profile={profile} onEditClick={handleEditClick} />
      <StatsStrip stats={stats} />

      <div ref={tabsRef}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ProfileTabKey)}
          className="flex flex-col gap-4"
        >
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              {tabItems.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="px-4">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="personal">
            <PersonalInfoForm profile={profile} />
          </TabsContent>

          <TabsContent value="academic">
            <AcademicForm profile={profile} />
          </TabsContent>

          <TabsContent value="exam">
            <ExamTargetingForm profile={profile} />
          </TabsContent>

          <TabsContent value="location">
            <LocationNotifForm profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
