'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { StreamStatsCard } from '@/components/live-streams/StreamStatsCard';
import { LiveNowBanner } from '@/components/live-streams/LiveNowBanner';
import { StreamTable } from '@/components/live-streams/StreamTable';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface Stream {
  id: string;
  title: string;
  program?: string;
  course?: string;
  scheduledAt?: string;
  startedAt?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  currentViewers?: number;
  peakViewers?: number;
  durationSec?: number;
  totalChatMsgs?: number;
}

interface Stats {
  totalStreams: number;
  totalViewers: number;
  avgDuration: string;
  totalChatMessages: number;
  liveCount: number;
}

export default function LiveStreamsDashboard() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStreams: 0,
    totalViewers: 0,
    avgDuration: '0h 0m',
    totalChatMessages: 0,
    liveCount: 0,
  });
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSync = async () => {
    setSyncing(true);
    setAuthError(false);
    try {
      const response = await fetch('/api/youtube/broadcasts/sync', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error?.includes('invalid_grant')) {
          setAuthError(true);
          toast.error('YouTube account needs reconnection');
        } else {
          toast.error(data.error || 'Sync failed');
        }
        return;
      }

      if (data.success && data.count > 0) {
        toast.success(`Synced ${data.count} stream(s) from YouTube`);
      } else if (data.success) {
        toast.info('No active streams found on YouTube');
      }
    } catch (error) {
      console.error('Failed to sync from YouTube:', error);
      toast.error('Network error during sync');
    } finally {
      setSyncing(false);
    }
  };

  // Fetch streams
  useEffect(() => {
    const fetchStreams = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select(`
            id,
            title,
            status,
            scheduled_at,
            started_at,
            ended_at,
            concurrent_viewers,
            peak_viewers,
            duration_sec,
            total_chat_msgs,
            courses (
              id,
              title,
              subject:subjects (
                name,
                program_level:program_levels (
                  label
                )
              )
            )
          `)
          .order('scheduled_at', { ascending: false });

        if (error) {
          console.error('Supabase error fetching streams:', error);
          throw error;
        }

        const formattedStreams: Stream[] = (data || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          scheduledAt: s.scheduled_at,
          startedAt: s.started_at,
          currentViewers: s.concurrent_viewers,
          peakViewers: s.peak_viewers,
          durationSec: s.duration_sec,
          totalChatMsgs: s.total_chat_msgs,
          program: s.courses?.subject?.program_level?.label,
          course: s.courses?.subject?.name,
        }));

        setStreams(formattedStreams);

        // Calculate stats
        const totalViewers = formattedStreams.reduce(
          (acc, s) => acc + (s.currentViewers || s.peakViewers || 0),
          0
        );
        const totalDuration = formattedStreams.reduce((acc, s) => acc + (s.durationSec || 0), 0);
        const avgDuration = totalDuration / (formattedStreams.length || 1);
        const avgHours = Math.floor(avgDuration / 3600);
        const avgMinutes = Math.floor((avgDuration % 3600) / 60);
        const liveCount = formattedStreams.filter((s) => s.status === 'live').length;

        setStats({
          totalStreams: formattedStreams.length,
          totalViewers,
          avgDuration: `${avgHours}h ${avgMinutes}m`,
          totalChatMessages: formattedStreams.reduce((acc, s) => acc + (s.totalChatMsgs || 0), 0),
          liveCount,
        });

        setLiveStreams(formattedStreams.filter((s) => s.status === 'live'));
      } catch (error: any) {
        console.error('Failed to fetch streams:', error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    handleSync();

    // Subscribe to live_streams changes
    const channel = supabase
      .channel('live-streams-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => {
        fetchStreams();
      })
      .subscribe();

    // Handle success messages from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'connected') {
      toast.success('YouTube account connected successfully!');
      router.replace('/admin/live-streams');
    }
    if (params.get('error') === 'oauth_failed') {
      toast.error('Failed to connect YouTube account');
      router.replace('/admin/live-streams');
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  // Apply filters
  useEffect(() => {
    let filtered = streams;

    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (programFilter !== 'all') {
      filtered = filtered.filter((s) => s.program === programFilter);
    }

    setFilteredStreams(filtered);
  }, [streams, searchTerm, statusFilter, programFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;

    try {
      const { error } = await supabase.from('live_streams').delete().eq('id', id);
      if (error) throw error;
      setStreams(streams.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete stream:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to cancel stream:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/live-streams/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate stream');
      }

      const data = await response.json();
      router.push(`/admin/live-streams/${data.streamId}/edit`);
    } catch (error) {
      console.error('Failed to duplicate stream:', error);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/live-streams/${id}/edit`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Streams</h1>
          <p className="text-muted-foreground">Manage live classes across all programs</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            variant="outline"
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync YouTube
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/admin/live-streams/new">
              <Plus className="w-4 h-4" />
              Schedule Stream
            </Link>
          </Button>
        </div>
      </div>

      {/* YouTube Auth Alert */}
      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>YouTube Authentication Expired</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Your YouTube access has expired. Please reconnect your account to sync live streams.</span>
            <Button size="sm" variant="outline" className="gap-2" asChild>
              <Link href="/api/youtube/oauth/authorize">
                <ExternalLink className="w-4 h-4" />
                Reconnect YouTube
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Live Count Badge */}
      {stats.liveCount > 0 && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          Live: {stats.liveCount}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StreamStatsCard
          label="Total Streams"
          value={stats.totalStreams}
          trend={{ direction: 'up', text: '+3 this week' }}
        />
        <StreamStatsCard
          label="Total Viewers"
          value={stats.totalViewers.toLocaleString()}
          trend={{ direction: 'up', text: '+842 this month' }}
        />
        <StreamStatsCard
          label="Avg Duration"
          value={stats.avgDuration}
          trend={{ direction: 'up', text: '▲ 4 min' }}
        />
        <StreamStatsCard
          label="Chat Messages"
          value={stats.totalChatMessages.toLocaleString()}
          trend={{ direction: 'up', text: '+1,240 today' }}
        />
      </div>

      {/* Live Now Banner */}
      {liveStreams.length > 0 && <LiveNowBanner streams={liveStreams} />}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search streams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="Applied Knowledge">ACCA - Applied Knowledge</SelectItem>
            <SelectItem value="Applied Skills">ACCA - Applied Skills</SelectItem>
            <SelectItem value="Level 1">CFA - Level 1</SelectItem>
            <SelectItem value="Part 1">CMA - Part 1</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stream Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading streams...</p>
        </div>
      ) : filteredStreams.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No streams found</p>
          <Button asChild variant="outline">
            <Link href="/admin/live-streams/new">Create your first stream</Link>
          </Button>
        </div>
      ) : (
        <StreamTable
          streams={filteredStreams}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
