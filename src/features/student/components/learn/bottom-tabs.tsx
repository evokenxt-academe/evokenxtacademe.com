"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconDownload, IconFile, IconNotes } from "@tabler/icons-react";
import type { ResourceRow } from "@/features/student/types/learn";

interface BottomTabsProps {
  resources: ResourceRow[];
  lectureDescription: string | null;
}

export function BottomTabs({ resources, lectureDescription }: BottomTabsProps) {
  return (
    <Tabs defaultValue="resources" className="w-full">
      <TabsList>
        <TabsTrigger value="resources">
          Resources{resources.length > 0 && ` (${resources.length})`}
        </TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="discussion">Discussion</TabsTrigger>
      </TabsList>

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
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <IconNotes className="size-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Notes feature coming soon
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Take personal notes while watching lectures
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="discussion" className="mt-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Discussion feature coming soon
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ask questions and interact with peers
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
