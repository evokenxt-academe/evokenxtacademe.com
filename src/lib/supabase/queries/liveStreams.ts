/**
 * Supabase queries for live streaming features
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Get all live streams
 */
export async function getStreams(status?: string) {
  let query = supabase
    .from('live_streams')
    .select(`
      *,
      course:courses(id, title, subject_id),
      instructor:users(id, name, avatar)
    `)
    .order('scheduled_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get single stream with full details
 */
export async function getStream(streamId: string) {
  const { data, error } = await supabase
    .from('live_streams')
    .select(`
      *,
      course:courses(id, title, subject_id),
      instructor:users(id, name, avatar)
    `)
    .eq('id', streamId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get live stream chat messages
 */
export async function getStreamChat(streamId: string, limit = 100) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      user:users(id, name, avatar)
    `)
    .eq('live_stream_id', streamId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data?.reverse() || [];
}

/**
 * Create chat message
 */
export async function createChatMessage(
  streamId: string,
  message: string,
  type = 'message',
  userId?: string
) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      live_stream_id: streamId,
      user_id: userId,
      message,
      type,
      is_approved: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get stream analytics
 */
export async function getStreamAnalytics(streamId: string) {
  const { data, error } = await supabase
    .from('stream_analytics')
    .select('*')
    .eq('live_stream_id', streamId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get stream polls
 */
export async function getStreamPolls(streamId: string) {
  const { data, error } = await supabase
    .from('stream_polls')
    .select(`
      *,
      options:stream_poll_options(
        id,
        option_text,
        position
      )
    `)
    .eq('live_stream_id', streamId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create poll
 */
export async function createPoll(
  streamId: string,
  question: string,
  options: string[],
  anonymous = false
) {
  // Create poll
  const { data: poll, error: pollError } = await supabase
    .from('stream_polls')
    .insert({
      live_stream_id: streamId,
      question,
      anonymous_votes: anonymous,
      is_active: true,
    })
    .select()
    .single();

  if (pollError) throw pollError;

  // Create options
  const pollOptions = options.map((text, i) => ({
    poll_id: poll.id,
    option_text: text,
    position: i,
  }));

  const { error: optionsError } = await supabase
    .from('stream_poll_options')
    .insert(pollOptions);

  if (optionsError) throw optionsError;

  return poll;
}

/**
 * Vote on poll
 */
export async function votePoll(optionId: string, pollId: string, userId?: string) {
  const { error } = await supabase
    .from('stream_poll_votes')
    .insert({
      option_id: optionId,
      poll_id: pollId,
      user_id: userId,
    });

  if (error) throw error;
}

/**
 * Get poll results
 */
export async function getPollResults(pollId: string) {
  const { data, error } = await supabase
    .from('stream_poll_votes')
    .select(`
      id,
      option_id,
      option:stream_poll_options(id, option_text)
    `)
    .eq('poll_id', pollId);

  if (error) throw error;

  // Count votes per option
  const results = new Map<string, { text: string; votes: number }>();
  data?.forEach((vote: any) => {
    const key = vote.option.id;
    if (!results.has(key)) {
      results.set(key, { text: vote.option.option_text, votes: 0 });
    }
    const curr = results.get(key)!;
    curr.votes += 1;
  });

  return Array.from(results.values());
}
