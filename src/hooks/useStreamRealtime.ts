"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useStreamRealtime(streamId: string) {
  const [viewers, setViewers] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const channelRef = useRef<any>(null);
  const channelKeyRef = useRef(`ch_${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!streamId) return;

    const channelName = `stream:${streamId}:${channelKeyRef.current}`;
    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_streams",
          filter: `id=eq.${streamId}`,
        },
        (payload: any) => {
          const stream = payload.new;
          if (!stream) return;
          setViewers(stream.concurrent_viewers ?? 0);
          setIsLive(stream.status === "live");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload: any) => {
          setChatMessages((prev) => [...prev, payload.new]);
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [streamId]);

  return { viewers, isLive, chatMessages, setChatMessages };
}

export function useLiveStreamsRealtime(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("live_streams_list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_streams",
        },
        () => onUpdate(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
