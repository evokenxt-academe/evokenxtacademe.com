"use client";

import * as React from "react";
import { User, GraduationCap, Target, MapPin } from "lucide-react";

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

const tabItems: Array<{ 
  value: ProfileTabKey; 
  label: string; 
  icon: React.ComponentType<{ className?: string }> 
}> = [
  { value: "personal", label: "Personal Info", icon: User },
  { value: "academic", label: "Academic", icon: GraduationCap },
  { value: "exam", label: "Exam Targeting", icon: Target },
  { value: "location", label: "Location & Notifications", icon: MapPin },
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

      <div ref={tabsRef} className="mt-2">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ProfileTabKey)}
          className="flex flex-col gap-6"
        >
          <div className="overflow-x-auto pb-1 border-b border-zinc-200/60 dark:border-zinc-800/80">
            <TabsList className="min-w-max h-auto bg-transparent p-0 gap-6 border-none">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className={`px-1 py-3 flex items-center gap-2 rounded-none border-b-2 bg-transparent text-sm font-medium transition-all shadow-none
                      ${isActive 
                        ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold" 
                        : "border-transparent text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="focus-visible:outline-none">
            <TabsContent value="personal" className="mt-0">
              <PersonalInfoForm profile={profile} />
            </TabsContent>

            <TabsContent value="academic" className="mt-0">
              <AcademicForm profile={profile} />
            </TabsContent>

            <TabsContent value="exam" className="mt-0">
              <ExamTargetingForm profile={profile} />
            </TabsContent>

            <TabsContent value="location" className="mt-0">
              <LocationNotifForm profile={profile} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
