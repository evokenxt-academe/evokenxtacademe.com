"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  IconDownload,
  IconEye,
  IconFile,
  IconExternalLink,
  IconBook,
  IconFileText,
  IconPhoto,
  IconVideo,
  IconVolume,
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

  const getResourceIconAndMeta = (resource: typeof resources[number]) => {
    const type = resource.file_type.toLowerCase();
    const url = resource.file_url.toLowerCase();
    
    if (type.includes("pdf") || url.includes(".pdf")) {
      return {
        icon: <IconFileText className="size-5 text-red-500" stroke={1.8} />,
        label: "PDF Document"
      };
    }
    if (type.includes("image") || /\.(png|jpe?g|jpg|gif|webp|svg)/.test(url)) {
      return {
        icon: <IconPhoto className="size-5 text-blue-500" stroke={1.8} />,
        label: "Image Asset"
      };
    }
    if (type.includes("video") || /\.(mp4|webm|mov|m4v)/.test(url)) {
      return {
        icon: <IconVideo className="size-5 text-purple-500" stroke={1.8} />,
        label: "Video File"
      };
    }
    if (type.includes("audio") || /\.(mp3|wav|m4a|aac)/.test(url)) {
      return {
        icon: <IconVolume className="size-5 text-amber-500" stroke={1.8} />,
        label: "Audio Track"
      };
    }
    return {
      icon: <IconFile className="size-5 text-muted-foreground" stroke={1.8} />,
      label: "Resource File"
    };
  };

  if (!lectureId) {
    return null;
  }

  return (
    <div className="w-full mt-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="line" className="w-full justify-start border-b border-border/80 rounded-none h-11 bg-transparent p-0 gap-6">
          <TabsTrigger
            value="overview"
            className="group px-1 pb-3 pt-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent hover:text-foreground/80"
          >
            <IconBook className="size-4 mr-1.5 text-muted-foreground/80 group-data-[state=active]:text-primary transition-colors" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="resources"
            className="group px-1 pb-3 pt-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none bg-transparent hover:text-foreground/80"
          >
            <IconFile className="size-4 mr-1.5 text-muted-foreground/80 group-data-[state=active]:text-primary transition-colors" />
            Resources
            {resources.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary">
                {resources.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="py-5">
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="outline-none">
            <Card className="border border-border/60 bg-muted/[0.02] shadow-2xs">
              <CardContent className="p-5 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">About this lecture</h4>
                {lectureDescription ? (
                  <p className="text-sm leading-relaxed text-muted-foreground/90 max-w-4xl whitespace-pre-wrap">
                    {lectureDescription}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/75 italic">
                    No lecture description is available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RESOURCES TAB */}
          <TabsContent value="resources" className="outline-none">
            {resources.length === 0 ? (
              <Card className="border border-dashed border-border/70 bg-muted/[0.01]">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/70 mb-3">
                    <IconFile className="size-6" stroke={1.5} />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">No Resources</h4>
                  <p className="text-xs text-muted-foreground/75 mt-1 max-w-[280px]">
                    There are no reference materials or downloadable files attached to this lecture.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => {
                  const { icon, label } = getResourceIconAndMeta(resource);
                  return (
                    <div
                      key={resource.id}
                      className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:shadow-xs transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/80">
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground leading-snug">
                            {resource.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                            {label}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7.5 text-xs font-medium bg-background"
                          onClick={() => setSelectedResource(resource)}
                        >
                          <IconEye className="mr-1.5 size-3.5" stroke={1.8} />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7.5 text-xs font-medium"
                          asChild
                        >
                          <a
                            href={resource.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <IconDownload className="mr-1.5 size-3.5" stroke={1.8} />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

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
