'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { StreamStatsCard } from '@/components/live-streams/StreamStatsCard';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LiveStream {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  concurrent_viewers?: number;
  peak_viewers?: number;
  duration_sec?: number;
  total_chat_msgs?: number;
}

interface AnalyticsSnapshot {
  id: string;
  live_stream_id: string;
  concurrent_viewers: number;
  chat_rate: number;
  created_at: string;
}

export default function StreamAnalyticsPage() {
  const params = useParams();
  const streamId = params.streamId as string;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot[]>([]);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [pollResponses, setPollResponses] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch stream
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stream
        const { data: streamData, error: streamError } = await supabase
          .from('live_streams')
          .select('*')
          .eq('id', streamId)
          .single();

        if (streamError) throw streamError;
        setStream(streamData);

        // Fetch analytics snapshots
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('stream_analytics')
          .select('*')
          .eq('live_stream_id', streamId)
          .order('created_at', { ascending: true });

        if (analyticsError) throw analyticsError;
        setAnalytics(analyticsData || []);

        // Fetch questions count
        const { count: questionsCountData, error: questionsError } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: 0 })
          .eq('live_stream_id', streamId)
          .eq('type', 'question');

        if (!questionsError) {
          setQuestionsCount(questionsCountData || 0);
        }

        // Fetch poll responses
        const { count: pollResponsesData, error: pollError } = await supabase
          .from('stream_poll_votes')
          .select('*', { count: 'exact', head: 0 })
          .eq('live_stream_id', streamId);

        if (!pollError) {
          setPollResponses(pollResponsesData || 0);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [streamId, supabase]);

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (!stream || stream.status !== 'ended') {
    return <div className="text-center py-12">Analytics available only for ended streams</div>;
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Calculate average watch time (rough estimate)
  const calculateAvgWatchTime = () => {
    if (analytics.length === 0) return '0m';
    const totalMinutes = analytics.length; // 1 minute per snapshot
    return totalMinutes < 60 ? `${totalMinutes}m` : `${(totalMinutes / 60).toFixed(1)}h`;
  };

  // Transform analytics data for charts
  const chartData = analytics.map((snapshot, index) => ({
    time: index,
    viewers: snapshot.concurrent_viewers,
    chatRate: Math.round(snapshot.chat_rate || 0),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">{stream.title}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {format(new Date(stream.scheduled_at), 'PPP p')} · Duration: {formatDuration(stream.duration_sec)} ·
          Peak: {stream.peak_viewers?.toLocaleString() || 0} viewers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StreamStatsCard label="Total Viewers" value={stream.concurrent_viewers || 0} />
        <StreamStatsCard label="Peak Concurrent" value={stream.peak_viewers || 0} />
        <StreamStatsCard label="Avg Watch Time" value={calculateAvgWatchTime()} />
        <StreamStatsCard label="Chat Messages" value={stream.total_chat_msgs || 0} />
        <StreamStatsCard label="Questions Asked" value={questionsCount} />
        <StreamStatsCard label="Poll Responses" value={pollResponses} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Viewer Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Viewer Timeline</CardTitle>
            <CardDescription>Concurrent viewers over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{ value: 'Minutes', position: 'insideBottomRight', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Viewers', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="viewers"
                    stroke="#3b82f6"
                    dot={false}
                    strokeWidth={2}
                    name="Concurrent Viewers"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 bg-muted/50 rounded flex items-center justify-center">
                <p className="text-muted-foreground">No analytics data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>Chat activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{ value: 'Minutes', position: 'insideBottomRight', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Messages/min', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="chatRate" fill="#10b981" name="Chat Rate (msg/min)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 bg-muted/50 rounded flex items-center justify-center">
                <p className="text-muted-foreground">No engagement data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chat Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Total Messages</span>
                <span className="font-semibold">{stream.total_chat_msgs || 0}</span>
              </div>
              {stream.duration_sec && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Avg Rate</span>
                  <span className="font-semibold">
                    {stream.total_chat_msgs && stream.duration_sec
                      ? ((stream.total_chat_msgs / (stream.duration_sec / 60)).toFixed(1) + ' msg/min')
                      : '0 msg/min'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Peak Rate</span>
                <span className="font-semibold">
                  {analytics.length > 0
                    ? Math.max(...analytics.map((a) => a.chat_rate || 0)).toFixed(1) + ' msg/min'
                    : '0 msg/min'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Viewership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Peak Viewers</span>
                <span className="font-semibold">{stream.peak_viewers?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Duration</span>
                <span className="font-semibold">{formatDuration(stream.duration_sec)}</span>
              </div>
              {analytics.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Snapshots</span>
                  <span className="font-semibold">{analytics.length}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Questions</span>
                <span className="font-semibold">{questionsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Poll Votes</span>
                <span className="font-semibold">{pollResponses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Engagement</span>
                <Badge variant="outline">
                  {((questionsCount + pollResponses) / Math.max(stream.peak_viewers || 1, 1) * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
