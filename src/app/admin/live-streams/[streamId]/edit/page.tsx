'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, Save, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  tags?: string[];
  notes?: string;
  course_id: string;
}

export default function EditStreamPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.streamId as string;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch stream
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const { data, error } = await supabase
          .from('live_streams')
          .select('*')
          .eq('id', streamId)
          .single();

        if (error) throw error;
        setStream(data);

        // Populate form
        setTitle(data.title);
        setDescription(data.description || '');
        setTags(data.tags || []);
        setNotes(data.notes || '');
      } catch (error) {
        console.error('Failed to fetch stream:', error);
        toast.error('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [streamId, supabase]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          title: title.trim(),
          description: description.trim(),
          tags,
          notes: notes.trim(),
        })
        .eq('id', streamId);

      if (error) throw error;

      toast.success('Stream updated successfully');
      router.push(`/admin/live-streams/${streamId}`);
    } catch (error) {
      console.error('Failed to update stream:', error);
      toast.error('Failed to update stream');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!stream) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Stream not found</p>
      </div>
    );
  }

  if (stream.status !== 'scheduled') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Edit Stream</AlertTitle>
          <AlertDescription>
            You can only edit streams that are in 'scheduled' status. This stream is currently {stream.status}.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Edit Stream</h1>
            <Badge variant="outline">{stream.status}</Badge>
          </div>
          <p className="text-muted-foreground">{stream.title}</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Details</CardTitle>
          <CardDescription>Update the stream information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Stream title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Stream description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 h-32"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mt-2 mb-3">
              <Input
                id="tags"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} variant="outline" className="px-3">
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Private notes about this stream (not visible to students)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 h-32"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/live-streams/${streamId}`)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
