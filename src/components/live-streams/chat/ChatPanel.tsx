"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Pin, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useStreamChat } from "@/hooks/useStreamChat";
import { toast } from "sonner";

interface ChatPanelProps {
  streamId: string;
  isAdmin?: boolean;
}

export function ChatPanel({ streamId, isAdmin = false }: ChatPanelProps) {
  const {
    messages,
    pinnedMessages,
    loading,
    sendMessage,
    pinMessage,
    deleteMessage,
  } = useStreamChat(streamId);

  const [messageInput, setMessageInput] = useState("");
  const [messageType, setMessageType] = useState<
    "message" | "announcement" | "system"
  >("message");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    setSending(true);
    try {
      await sendMessage(messageInput, messageType);
      setMessageInput("");
      toast.success("Message sent");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      await pinMessage(messageId);
      toast.success("Message pinned");
    } catch (error) {
      console.error("Failed to pin message:", error);
      toast.error("Failed to pin message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast.success("Message deleted");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case "announcement":
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
            📢 Announcement
          </Badge>
        );
      case "system":
        return <Badge variant="secondary">🔔 System</Badge>;
      default:
        return null;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "bg-yellow-50 border-yellow-200";
      case "system":
        return "bg-gray-50 border-gray-200";
      case "question":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Live Chat</CardTitle>
        <CardDescription>{messages.length} messages</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && (
          <div className="border-l-4 border-yellow-500 bg-yellow-50/50 p-3 rounded">
            <p className="text-xs font-semibold text-yellow-900 mb-2">
              📌 PINNED
            </p>
            {pinnedMessages.map((msg) => (
              <div key={msg.id} className="text-sm text-yellow-800 mb-1">
                <strong>{msg.author_name || "Admin"}</strong>: {msg.message}
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 border rounded-lg" ref={scrollRef}>
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No messages yet. Be the first to chat!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`border rounded p-3 text-sm ${getMessageTypeColor(msg.type)}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-foreground">
                          {msg.author_name || "Anonymous"}
                        </strong>
                        {msg.type === "question" && (
                          <Badge variant="outline" className="text-xs">
                            ❓
                          </Badge>
                        )}
                        {getMessageTypeBadge(msg.type)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <p className="text-foreground mb-2">{msg.message}</p>

                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handlePinMessage(msg.id)}
                        title="Pin message"
                      >
                        <Pin className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !messageInput.trim()}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
            </Button>
          </div>

          {isAdmin && (
            <Select
              value={messageType}
              onValueChange={(v) => setMessageType(v as any)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message">💬 Message</SelectItem>
                <SelectItem value="announcement">📢 Announcement</SelectItem>
                <SelectItem value="system">🔔 System</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
