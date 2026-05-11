"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useStreamRealtime(streamId: string) {
  const [viewers, setViewers] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!streamId) return;

    let mounted = true;
    let channel: any = null;
    const channelName = `stream:${streamId}`;

    const setup = async () => {
      // Remove any existing channels with the same name to prevent the "after subscribe()" error
      const existingChannels = supabase.getChannels().filter(c => c.topic === `realtime:${channelName}` || c.topic === channelName);
      for (const c of existingChannels) {
        await supabase.removeChannel(c);
      }

      if (!mounted) return;

      channel = supabase.channel(channelName);
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setViewers(count);
        })
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
            const newMsg = payload.new;
            if (newMsg.user_id) {
              supabase
                .from("users")
                .select("name, avatar")
                .eq("id", newMsg.user_id)
                .single()
                .then(({ data }) => {
                  if (data) newMsg.users = data;
                  setChatMessages((prev) => [...prev, newMsg]);
                });
            } else {
              setChatMessages((prev) => [...prev, newMsg]);
            }
          },
        )
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && mounted) {
            await channel.track({
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setup();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
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
