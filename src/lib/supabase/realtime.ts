/**
 * Supabase Realtime Channel Helpers
 */
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export function subscribeToTable(
  supabase: SupabaseClient,
  channelName: string,
  table: string,
  callback: (payload: any) => void,
  filter?: string
): RealtimeChannel {
  const channelConfig: any = { event: "*", schema: "public", table };
  if (filter) channelConfig.filter = filter;

  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", channelConfig, callback)
    .subscribe();

  return channel;
}

export function subscribeToRow(
  supabase: SupabaseClient,
  channelName: string,
  table: string,
  column: string,
  value: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `${column}=eq.${value}` },
      callback
    )
    .subscribe();
}

export function removeChannel(supabase: SupabaseClient, channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
