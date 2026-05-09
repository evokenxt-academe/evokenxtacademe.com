"use client";

import { useEffect, useMemo, useState } from "react";
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

  if (!lectureId) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/70">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">About this lecture</p>
          {lectureDescription ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {lectureDescription}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No lecture description is available yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Resources</p>
            <span className="text-xs text-muted-foreground">
              {resources.length} file{resources.length === 1 ? "" : "s"}
            </span>
          </div>

          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconFile className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No resources available for this lecture.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex justify-between w-full gap-3 px-4 py-3 flex-row "
                >
                  <div className="flex min-w-0 w-full items-center gap-3">
                    <IconFile className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{resource.title}</span>
                  </div>
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setSelectedResource(resource)}
                    >
                      <IconEye data-icon="inline-start" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
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
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedResource)}
        onOpenChange={(open) => {
          if (!open) setSelectedResource(null);
        }}
      >
        <DialogContent className="my-6 flex h-[calc(100vh-3rem)] w-[95vw] max-w-[95vw] mb-4 flex-col overflow-hidden rounded-xl  sm:h-[calc(100vh-4rem)] sm:max-w-6xl">
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
    </div>
  );
}
