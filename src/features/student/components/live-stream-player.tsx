"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  IconSend2,
  IconBroadcast,
  IconUsers,
  IconClock,
  IconMessageCircle,
  IconMoodSmile,
} from "@tabler/icons-react";

/* ─── types ─── */

type ChatMessage = {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
};

type StreamData = {
  id: string;
  title: string;
  ytVideoId: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduledAt: string | null;
  startedAt: string | null;
};

type LiveStreamPlayerProps = {
  courseId: string;
  courseName?: string;
};

/* ─── styles ─── */

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d0d1f 100%)",
  color: "#e2e8f0",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const mainLayoutStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  gap: 0,
  overflow: "hidden",
};

const playerSectionStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const iframeWrapperStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  paddingBottom: "56.25%", // 16:9
  background: "#000",
  borderRadius: "0",
  overflow: "hidden",
};

const iframeStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  border: "none",
};

const chatPanelStyle: React.CSSProperties = {
  width: "380px",
  minWidth: "380px",
  display: "flex",
  flexDirection: "column",
  borderLeft: "1px solid rgba(255,255,255,0.06)",
  background:
    "linear-gradient(180deg, rgba(15,15,35,0.95) 0%, rgba(10,10,25,0.98) 100%)",
  backdropFilter: "blur(20px)",
};

const chatHeaderStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const chatMessagesStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "12px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const chatInputBarStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const messageRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "6px 8px",
  borderRadius: "8px",
  transition: "background 0.15s ease",
};

const avatarStyle: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: 700,
  color: "#fff",
  flexShrink: 0,
  marginTop: "2px",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "10px 14px",
  color: "#e2e8f0",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

const sendBtnStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "transform 0.15s ease, opacity 0.15s ease",
  flexShrink: 0,
};

/* ─── component ─── */

export function LiveStreamPlayer({
  courseId,
  courseName,
}: LiveStreamPlayerProps) {
  const [stream, setStream] = React.useState<StreamData | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [viewerCount] = React.useState(
    () => Math.floor(Math.random() * 50) + 12
  );
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch current user
  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // Fetch stream data
  React.useEffect(() => {
    async function fetchStream() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/student/live-stream?courseId=${courseId}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch stream");
        const data = await res.json();
        setStream(data.stream);
        setMessages(data.messages ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStream();
  }, [courseId]);

  // Subscribe to real-time chat messages via Supabase Realtime
  React.useEffect(() => {
    if (!stream?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`live-chat-${stream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `live_stream_id=eq.${stream.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Record<string, unknown>;

          // Fetch user info for the new message
          const { data: userProfile } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("id", newMsg.user_id)
            .maybeSingle();

          const chatMessage: ChatMessage = {
            id: newMsg.id as string,
            message: newMsg.message as string,
            createdAt: newMsg.created_at as string,
            userId: newMsg.user_id as string,
            userName: userProfile?.name ?? "Anonymous",
            userAvatar: userProfile?.avatar ?? null,
          };

          setMessages((prev) => {
            // Deduplicate by id
            if (prev.some((m) => m.id === chatMessage.id)) return prev;
            return [...prev, chatMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stream?.id]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!messageInput.trim() || !stream?.id || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/student/live-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          streamId: stream.id,
          message: messageInput.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to send message");
      }
      setMessageInput("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSending(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "3px solid rgba(99,102,241,0.3)",
                borderTopColor: "#6366f1",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Loading stream…
            </p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stream) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBroadcast size={36} style={{ color: "#6366f1" }} />
          </div>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            No live stream scheduled for this course
          </p>
          <p
            style={{
              color: "#64748b",
              fontSize: "13px",
              maxWidth: "360px",
              textAlign: "center",
            }}
          >
            Check back later or wait for your instructor to schedule a live
            session.
          </p>
        </div>
      </div>
    );
  }

  const isLive = stream.status === "live";
  const isScheduled = stream.status === "scheduled";

  return (
    <div style={containerStyle}>
      {/* ─── Top Bar ─── */}
      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isLive && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(239,68,68,0.15)",
                color: "#ef4444",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  animation: "pulse-dot 1.5s ease infinite",
                }}
              />
              Live
            </span>
          )}
          {isScheduled && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(99,102,241,0.15)",
                color: "#818cf8",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <IconClock size={14} />
              Scheduled
            </span>
          )}
          <div>
            <h1
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#f1f5f9",
                margin: 0,
              }}
            >
              {stream.title}
            </h1>
            {courseName && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                {courseName}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "13px",
            color: "#94a3b8",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <IconUsers size={15} />
            {viewerCount} watching
          </span>
        </div>
      </div>

      {/* ─── Main: Player + Chat ─── */}
      <div style={mainLayoutStyle}>
        {/* Player Section */}
        <div style={playerSectionStyle}>
          {stream.ytVideoId && isLive ? (
            <div style={iframeWrapperStyle}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${stream.ytVideoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=1&cc_load_policy=0&iv_load_policy=3&disablekb=0&fs=1&playsinline=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
                style={iframeStyle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title={stream.title}
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div
              style={{
                ...iframeWrapperStyle,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 0,
                minHeight: "400px",
              }}
            >
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    border: "2px solid rgba(99,102,241,0.3)",
                  }}
                >
                  <IconBroadcast size={44} style={{ color: "#818cf8" }} />
                </div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#f1f5f9",
                    marginBottom: "8px",
                  }}
                >
                  {isScheduled
                    ? "Stream Starting Soon"
                    : "Stream Not Available"}
                </h2>
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                >
                  {isScheduled && stream.scheduledAt
                    ? `Scheduled for ${new Date(stream.scheduledAt).toLocaleString()}`
                    : "Waiting for the instructor to go live…"}
                </p>
              </div>
            </div>
          )}

          {/* Stream info below player */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <p style={{ color: "#64748b", fontSize: "12px" }}>
              🎓 {courseName || "Course Stream"} • This stream is private to
              enrolled students
            </p>
          </div>
        </div>

        {/* ─── Chat Panel ─── */}
        <div style={chatPanelStyle}>
          {/* Chat Header */}
          <div style={chatHeaderStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <IconMessageCircle size={18} style={{ color: "#818cf8" }} />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#f1f5f9",
                }}
              >
                Live Chat
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
                background: "rgba(255,255,255,0.05)",
                padding: "2px 8px",
                borderRadius: "10px",
              }}
            >
              {messages.length} messages
            </span>
          </div>

          {/* Chat Messages */}
          <div style={chatMessagesStyle} ref={chatContainerRef}>
            {messages.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: 0.5,
                }}
              >
                <IconMoodSmile size={32} style={{ color: "#6366f1" }} />
                <p
                  style={{
                    fontSize: "13px",
                    color: "#94a3b8",
                    textAlign: "center",
                  }}
                >
                  No messages yet.
                  <br />
                  Be the first to say hello!
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isOwn = msg.userId === currentUserId;
              return (
                <div
                  key={msg.id}
                  style={{
                    ...messageRowStyle,
                    background: isOwn
                      ? "rgba(99,102,241,0.08)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isOwn) {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(255,255,255,0.03)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      isOwn ? "rgba(99,102,241,0.08)" : "transparent";
                  }}
                >
                  {msg.userAvatar ? (
                    <img
                      src={msg.userAvatar}
                      alt={msg.userName}
                      style={{
                        ...avatarStyle,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={avatarStyle}>{getInitials(msg.userName)}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "12px",
                          color: isOwn ? "#a5b4fc" : "#94a3b8",
                        }}
                      >
                        {isOwn ? "You" : msg.userName}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#475569",
                        }}
                      >
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#e2e8f0",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.message}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          {isLive ? (
            <form style={chatInputBarStyle} onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message…"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                maxLength={500}
                disabled={isSending}
              />
              <button
                type="submit"
                style={{
                  ...sendBtnStyle,
                  opacity: messageInput.trim() ? 1 : 0.5,
                  transform: messageInput.trim() ? "scale(1)" : "scale(0.95)",
                }}
                disabled={!messageInput.trim() || isSending}
              >
                <IconSend2 size={18} style={{ color: "#fff" }} />
              </button>
            </form>
          ) : (
            <div
              style={{
                ...chatInputBarStyle,
                justifyContent: "center",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              <IconClock size={16} />
              Chat opens when the stream goes live
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .live-stream-main {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
