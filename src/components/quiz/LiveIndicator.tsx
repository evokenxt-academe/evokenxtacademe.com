"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LiveIndicator({ table }: { table: string }) {
  const [status, setStatus] = useState<"connecting" | "connected" | "closed">("connecting");

  useEffect(() => {
    const supabase = createClient();
    const channelId = `live-${table}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {})
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setStatus("connected");
        else if (state === "CLOSED" || state === "CHANNEL_ERROR") setStatus("closed");
        else setStatus("connecting");
      });

    return () => { supabase.removeChannel(channel); };
  }, [table]);

  if (status === "closed") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
      <span>{status === "connected" ? "Live" : "Connecting..."}</span>
    </div>
  );
}
