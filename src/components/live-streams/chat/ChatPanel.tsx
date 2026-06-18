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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Pin, 
  Trash2, 
  Loader2, 
  Send, 
  MoreVertical, 
  Users, 
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Megaphone,
  Bell,
  X,
  PinOff,
  Copy,
  Flag,
  Eye,
  EyeOff,
} from "lucide-react";
import { 
  IconBrandYoutube,
  IconMessage,
  IconAlertCircle,
  IconPin,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { formatDistanceToNow, format } from "date-fns";
import { useStreamChat } from "@/hooks/useStreamChat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  streamId: string;
  isAdmin?: boolean;
  activeViewersCount?: number;
  chatModeration?: boolean;
  filterType?: "all" | "question";
}

type FilterType = "all" | "announcement" | "question" | "flagged";

export function ChatPanel({
  streamId,
  isAdmin = false,
  activeViewersCount = 0,
  chatModeration = false,
  filterType = "all",
}: ChatPanelProps) {
  const {
    messages,
    pendingMessages,
    approvedMessages,
    pinnedMessages,
    loading,
    sendMessage,
    pinMessage,
    deleteMessage,
    approveMessage,
    markAsQuestion,
  } = useStreamChat(streamId, chatModeration);

  const [messageInput, setMessageInput] = useState("");
  const [messageType, setMessageType] = useState<
    "message" | "announcement" | "system"
  >("message");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPinned, setShowPinned] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && autoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Handle scroll detection to pause auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
  };

  const baseMessages = isAdmin
    ? [...approvedMessages, ...pendingMessages.filter((m) => !approvedMessages.some((a) => a.id === m.id))]
    : approvedMessages;

  const filteredMessages = (filterType === "question"
    ? baseMessages.filter((m) => m.type === "question")
    : baseMessages
  ).filter((msg) => {
    if (isAdmin && filter !== "all" && msg.type !== filter) return false;
    if (
      searchTerm &&
      !msg.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !msg.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    setSending(true);
    try {
      await sendMessage(messageInput, messageType, isAdmin);
      setMessageInput("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
      toast.success(
        messageType === "announcement" 
          ? "Announcement sent to all viewers" 
          : "Message sent"
      );
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
    if (!confirm("Delete this message? This action cannot be undone.")) return;
    
    try {
      await deleteMessage(messageId);
      toast.success("Message deleted");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard");
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case "announcement":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
            <Megaphone className="w-3 h-3 mr-1" />
            Announcement
          </Badge>
        );
      case "system":
        return (
          <Badge variant="secondary" className="text-xs">
            <Bell className="w-3 h-3 mr-1" />
            System
          </Badge>
        );
      case "question":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Question
          </Badge>
        );
      default:
        return null;
    }
  };

  const getMessageTypeColor = (type: string, isPinned: boolean = false) => {
    if (isPinned) {
      return "bg-amber-50/80 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800";
    }
    switch (type) {
      case "announcement":
        return "bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900";
      case "system":
        return "bg-muted/50 border-muted dark:bg-muted/20";
      case "question":
        return "bg-blue-50/50 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900";
      default:
        return "bg-card border-border hover:border-border/60";
    }
  };

  const getAuthorInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeFiltersCount = (filter !== "all" ? 1 : 0) + (searchTerm ? 1 : 0);

  return (
    <Card className="h-full flex flex-col border-border/50 shadow-lg">
      {/* Header */}
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Live Chat</CardTitle>
              <CardDescription className="text-xs">
                {filteredMessages.length} {filteredMessages.length === 1 ? "message" : "messages"}
                {isAdmin && activeFiltersCount > 0 && ` • ${activeFiltersCount} filter${activeFiltersCount > 1 ? "s" : ""} active`}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Active Viewers Badge */}
            <Badge variant="outline" className="gap-1.5 bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <Users className="w-3 h-3" />
              <span className="text-xs font-semibold">{activeViewersCount}</span>
            </Badge>
          </div>
        </div>

        {/* Search and Filter Bar - ADMIN ONLY */}
        {isAdmin && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="announcement">Announcements</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pinned Messages Toggle */}
        {pinnedMessages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            onClick={() => setShowPinned(!showPinned)}
          >
            {showPinned ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPinned ? "Hide" : "Show"} {pinnedMessages.length} Pinned Message{pinnedMessages.length !== 1 ? "s" : ""}
          </Button>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="relative flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
        {/* Pinned Messages Section */}
        {showPinned && pinnedMessages.length > 0 && (
          <div className="border-b bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <div className="p-4 space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Pinned Messages
                </span>
              </div>
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white/60 dark:bg-black/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                          {msg.author_name || "Anonymous"}
                        </p>
                      </div>
                      <p className="text-sm text-amber-800 dark:text-amber-200 break-words mt-0.5">
                        {msg.message}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => handlePinMessage(msg.id)}
                      >
                        <PinOff className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        >
          <div className="space-y-3 pb-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    {searchTerm || filter !== "all" ? "No messages found" : "No messages yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || filter !== "all" 
                      ? "Try adjusting your filters" 
                      : "Be the first to send a message!"}
                  </p>
                </div>
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isPinned = pinnedMessages.some((p) => p.id === msg.id);
                const showDateSeparator = index === 0 || 
                  format(new Date(msg.created_at), "PPP") !== 
                  format(new Date(filteredMessages[index - 1].created_at), "PPP");

                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-2 my-4">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground font-medium">
                          {format(new Date(msg.created_at), "PPP")}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "group relative border rounded-lg p-3 transition-all duration-200",
                        getMessageTypeColor(msg.type, isPinned),
                        "hover:shadow-sm"
                      )}
                    >
                      {/* Pin Indicator */}
                      {isPinned && (
                        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                          <Pin className="h-3 w-3" />
                        </div>
                      )}

                      {/* Message Header */}
                      <div className="flex items-start gap-3 mb-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          {msg.author_avatar ? (
                            <AvatarImage src={msg.author_avatar} alt={msg.author_name || "User"} />
                          ) : null}
                          <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300">
                            {getAuthorInitials(msg.author_name ?? null)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="break-words text-sm font-semibold text-foreground">
                              {msg.author_name || "Anonymous"}
                            </span>
                            {getMessageTypeBadge(msg.type)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(msg.created_at), "p")}</span>
                          </div>
                        </div>

                        {/* Actions Menu */}
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handlePinMessage(msg.id)}>
                                {isPinned ? (
                                  <>
                                    <PinOff className="w-4 h-4 mr-2" />
                                    Unpin Message
                                  </>
                                ) : (
                                  <>
                                    <Pin className="w-4 h-4 mr-2" />
                                    Pin Message
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyMessage(msg.message)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Message
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    await markAsQuestion(msg.id);
                                    toast.success("Marked as question");
                                  } catch {
                                    toast.error("Failed to mark as question");
                                  }
                                }}
                              >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Mark as Question
                              </DropdownMenuItem>
                              {!msg.is_approved && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await approveMessage(msg.id);
                                      toast.success("Message approved");
                                    } catch {
                                      toast.error("Failed to approve");
                                    }
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Message
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="pl-11">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        {!autoScroll && (
          <div className="pointer-events-none absolute inset-x-0 bottom-36 flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto rounded-full shadow-lg"
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              New Messages
            </Button>
          </div>
        )}

        <Separator />

        {/* Message Input Section */}
        <div className="p-4 space-y-3 bg-muted/30">
          {isAdmin && (
            <Select
              value={messageType}
              onValueChange={(v) => setMessageType(v as any)}
            >
              <SelectTrigger className="w-full h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message">
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Regular Message
                  </div>
                </SelectItem>
                <SelectItem value="announcement">
                  <div className="flex items-center">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Announcement
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center">
                    <Bell className="w-4 h-4 mr-2" />
                    System Message
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              placeholder={
                messageType === "announcement"
                  ? "Send an announcement to all viewers..."
                  : "Type your message..."
              }
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                // Auto-resize textarea
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending}
              className="resize-none min-h-[40px] max-h-[120px]"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !messageInput.trim()}
              size="lg"
              className={cn(
                "shrink-0 px-4",
                messageType === "announcement" && "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>

          {messageType === "announcement" && (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              This will be sent as a highlighted announcement to all viewers
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
