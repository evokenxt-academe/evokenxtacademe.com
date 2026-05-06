"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconDownload,
  IconEye,
  IconFile,
  IconNotes,
  IconExternalLink,
} from "@tabler/icons-react";
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
  const [selectedResource, setSelectedResource] = useState<
    LectureWithResources["resources"][number] | null
  >(null);

  const storageKey = useMemo(() => {
    if (!lectureId) return null;
    return `evoke_notes_${userId}_${lectureId}`;
  }, [lectureId, userId]);

  const [notes, setNotes] = useState("");

  const isImageResource = selectedResource
    ? /^(image|png|jpe?g|jpg|gif|webp|svg)$/i.test(selectedResource.file_type) ||
      /\.(png|jpe?g|jpg|gif|webp|svg)(\?.*)?$/i.test(selectedResource.file_url)
    : false;

  const isPdfResource = selectedResource
    ? /pdf/i.test(selectedResource.file_type) ||
      /\.pdf(\?.*)?$/i.test(selectedResource.file_url)
    : false;

  const isVideoResource = selectedResource
    ? /video/i.test(selectedResource.file_type) ||
      /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(selectedResource.file_url)
    : false;

  const isAudioResource = selectedResource
    ? /audio/i.test(selectedResource.file_type) ||
      /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(selectedResource.file_url)
    : false;

  const isTextResource = selectedResource
    ? /(txt|text|md|markdown|csv|json)/i.test(selectedResource.file_type) ||
      /\.(txt|md|csv|json)(\?.*)?$/i.test(selectedResource.file_url)
    : false;

  const canInlinePreview =
    isImageResource || isPdfResource || isVideoResource || isAudioResource || isTextResource;

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
      <TabsList className="grid h-auto w-full grid-cols-3">
        <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
        <TabsTrigger value="resources">
          Resources{resources.length > 0 && ` (${resources.length})`}
        </TabsTrigger>
        <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
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
                    className="flex flex-col items-start justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconFile className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">
                        {resource.title}
                      </span>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setSelectedResource(resource)}
                      >
                        <IconEye data-icon="inline-start" />
                        Preview
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto" asChild>
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

      <Dialog
        open={Boolean(selectedResource)}
        onOpenChange={(open) => {
          if (!open) setSelectedResource(null);
        }}
      >
        <DialogContent className="my-6 flex h-[calc(100vh-3rem)] w-[95vw] max-w-[95vw] min-h-0 flex-col overflow-hidden rounded-xl p-0 sm:my-8 sm:h-[calc(100vh-4rem)] sm:max-w-6xl">
          {selectedResource && (
            <>
              <DialogHeader className="border-b px-5 py-4">
                <DialogTitle>{selectedResource.title}</DialogTitle>
                <DialogDescription>
                  Preview lecture resource
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 bg-muted/30">
                {isImageResource ? (
                  <div className="flex min-h-full items-center justify-center p-4">
                    <img
                      src={selectedResource.file_url}
                      alt={selectedResource.title}
                      className="max-h-full max-w-full rounded-md object-contain"
                    />
                  </div>
                ) : isVideoResource ? (
                  <video
                    src={selectedResource.file_url}
                    controls
                    className="h-full w-full"
                  />
                ) : isAudioResource ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <audio src={selectedResource.file_url} controls className="w-full max-w-2xl" />
                  </div>
                ) : canInlinePreview ? (
                  <iframe
                    title={selectedResource.title}
                    src={selectedResource.file_url + (isPdfResource ? "#toolbar=0&navpanes=0" : "")}
                    className="block h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Preview is not available for this file type.
                    </p>
                    <Button asChild>
                      <a
                        href={selectedResource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconExternalLink data-icon="inline-start" />
                        Open in new tab
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
