"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminChatPanel } from "./AdminChatPanel";
import { PollManager } from "./PollManager";
import { BarChart3, HelpCircle, MessageSquare, Search, Users, X } from "lucide-react";

type ControlRoomChatProps = {
  streamId: string;
  chatModeration: boolean;
  activeViewers?: number;
  messageCount?: number;
};

export function ControlRoomChat({
  streamId,
  chatModeration,
  activeViewers = 0,
}: ControlRoomChatProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-semibold">Live Chat</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-36 pl-7 text-xs sm:w-48"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchTerm("");
                }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-3.5" />
            </Button>
          )}

          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Users className="size-3" />
            {activeViewers}
          </span>
        </div>
      </div>

      {/* Tabs + content */}
      <Tabs defaultValue="messages" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 grid h-9 shrink-0 grid-cols-3">
          <TabsTrigger value="messages" className="gap-1.5 text-xs">
            <MessageSquare className="size-3.5" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-1.5 text-xs">
            <HelpCircle className="size-3.5" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="polls" className="gap-1.5 text-xs">
            <BarChart3 className="size-3.5" />
            Polls
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="messages"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <AdminChatPanel
            streamId={streamId}
            chatModeration={chatModeration}
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent
          value="questions"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <AdminChatPanel
            streamId={streamId}
            chatModeration={chatModeration}
            filterType="question"
            searchTerm={searchTerm}
          />
        </TabsContent>

        <TabsContent
          value="polls"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <PollManager streamId={streamId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
