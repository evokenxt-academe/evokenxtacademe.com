"use client"

import * as React from "react"
import { toast } from "sonner"
import { IconBroadcast } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { LiveChatPanel } from "@/components/live/live-chat-panel"
import { LiveVideoPanel } from "@/components/live/live-video-panel"
import { useAdminLiveStream } from "@/hooks/live/use-admin-live-stream"
import { useChatMessages } from "@/hooks/live/use-chat-messages"
import { useSendAdminMessage } from "@/hooks/live/use-send-admin-message"

export function LiveChatAdminPage({ streamId }: { streamId: string }) {
  const { currentStream, initialMessages, isLoading, error } =
    useAdminLiveStream(streamId)
    
  const { messages } = useChatMessages(
    currentStream?.id ?? null,
    initialMessages,
  )
  
  const { sendMessage, isSending } = useSendAdminMessage()
  const [inputMessage, setInputMessage] = React.useState("")

  const canChat = Boolean(currentStream && currentStream.status === "live")

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!currentStream || !canChat || !inputMessage.trim()) {
        return
      }

      try {
        await sendMessage({
          streamId: currentStream.id,
          message: inputMessage.trim(),
        })
        setInputMessage("")
      } catch (sendError) {
        toast.error(
          sendError instanceof Error
            ? sendError.message
            : "Failed to send message",
        )
      }
    },
    [canChat, currentStream, inputMessage, sendMessage],
  )

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
        <Skeleton className="min-h-[540px] w-full rounded-3xl" />
      </div>
    )
  }

  if (error || !currentStream) {
    return (
      <Empty className="min-h-[420px] border-border/60 bg-muted/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBroadcast />
          </EmptyMedia>
          <EmptyTitle>Unable to load live stream</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error
              ? error.message
              : "There was a problem loading this live class or it does not exist."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <LiveVideoPanel stream={currentStream} courseName={currentStream.courseName} />
      <LiveChatPanel
        streamId={currentStream.id}
        streamStatus={currentStream.status}
        messages={messages}
        inputMessage={inputMessage}
        onInputMessageChange={setInputMessage}
        onSubmit={handleSubmit}
        isSending={isSending}
        disabled={!canChat}
      />
    </div>
  )
}
