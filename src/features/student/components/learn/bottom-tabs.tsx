"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconDownload, IconFile, IconNotes } from "@tabler/icons-react";
import type { LectureWithResources } from "@/features/student/types/learn";

interface BottomTabsProps {
  userId: string;
  lectureId: string | null;
  resources: LectureWithResources["resources"];
  lectureDescription: string | null;
}

export function BottomTabs({
  userId,
  lectureId,
  resources,
  lectureDescription,
}: BottomTabsProps) {
  const storageKey = useMemo(() => {
    if (!lectureId) return null;
    return `evoke_notes_${userId}_${lectureId}`;
  }, [lectureId, userId]);

  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    setNotes(saved ?? "");
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, notes);
  }, [notes, storageKey]);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="resources">
          Resources{resources.length > 0 && ` (${resources.length})`}
        </TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <Card>
          <CardContent className="p-4">
            {lectureDescription ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {lectureDescription}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No overview provided for this lecture.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resources" className="mt-4">
        {resources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <IconFile className="size-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No resources available for this lecture
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col divide-y divide-border">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconFile className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">
                        {resource.title}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={resource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <IconDownload data-icon="inline-start" />
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="notes" className="mt-4">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <IconNotes data-icon="inline-start" />
              Personal notes
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your notes here…"
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              Saved locally on this device.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
