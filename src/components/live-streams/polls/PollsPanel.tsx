'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useStreamPolls } from '@/hooks/useStreamPolls';
import { toast } from 'sonner';

interface PollsPanelProps {
  streamId: string;
  isAdmin?: boolean;
}

export function PollsPanel({ streamId, isAdmin = false }: PollsPanelProps) {
  const { polls, activePoll, loading, createPoll, votePoll, closePoll } = useStreamPolls(streamId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const filledOptions = options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    setCreating(true);
    try {
      await createPoll(question, filledOptions, isAnonymous);
      setQuestion('');
      setOptions(['', '', '', '']);
      setIsAnonymous(false);
      setShowCreateForm(false);
      toast.success('Poll created!');
    } catch (error) {
      console.error('Failed to create poll:', error);
      toast.error('Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId: string, optionId: number) => {
    setVotingPollId(pollId);
    try {
      await votePoll(pollId, optionId);
      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error('Failed to vote');
    } finally {
      setVotingPollId(null);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await closePoll(pollId);
      toast.success('Poll closed');
    } catch (error) {
      console.error('Failed to close poll:', error);
      toast.error('Failed to close poll');
    }
  };

  const getTotalVotes = (poll: any) => {
    return poll.options?.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0) || 0;
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total === 0 ? 0 : Math.round((votes / total) * 100);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Polls</CardTitle>
            <CardDescription>{polls.length} total polls</CardDescription>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Create Poll Form */}
        {isAdmin && showCreateForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <div>
              <Label htmlFor="question" className="text-sm">
                Question
              </Label>
              <Input
                id="question"
                placeholder="What's your question?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Options</Label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="text-sm"
                  />
                  {options.length > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveOption(idx)}
                      className="w-8 h-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button size="sm" variant="outline" onClick={handleAddOption} className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Anonymous votes
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setQuestion('');
                  setOptions(['', '', '', '']);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreatePoll}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Launch Poll'}
              </Button>
            </div>
          </div>
        )}

        {/* Active Poll */}
        {activePoll && (
          <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Badge className="bg-green-600 hover:bg-green-700 mb-2">ACTIVE</Badge>
                <h4 className="font-semibold text-foreground">{activePoll.question}</h4>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleClosePoll(activePoll.id)}
                >
                  Close Poll
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {activePoll.options?.map((opt: any) => {
                const total = getTotalVotes(activePoll);
                const percentage = getVotePercentage(opt.votes || 0, total);

                return (
                  <div
                    key={opt.id}
                    className="cursor-pointer"
                    onClick={() => handleVote(activePoll.id, opt.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{opt.text ?? opt.option_text}</span>
                      <span className="text-xs font-semibold">
                        {percentage}% ({opt.votes || 0})
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-muted-foreground mt-3 space-x-2">
              <span>{getTotalVotes(activePoll)} votes</span>
              <span>·</span>
              <span>Started {formatDistanceToNow(new Date(activePoll.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        )}

        {/* Closed Polls */}
        {polls.filter((p) => !p.is_active).length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-muted-foreground">
              Closed Polls ({polls.filter((p) => !p.is_active).length})
            </h5>
            {polls
              .filter((p) => !p.is_active)
              .slice(0, 3)
              .map((poll) => (
                <div key={poll.id} className="border rounded p-3 bg-muted/30">
                  <p className="text-sm font-medium mb-2 line-clamp-2">{poll.question}</p>
                  <div className="text-xs space-y-1">
                    {poll.options?.slice(0, 2).map((opt: any) => (
                      <div key={opt.id} className="flex justify-between">
                        <span>{opt.text ?? opt.option_text}</span>
                        <span className="font-semibold">
                          {getVotePercentage(opt.votes || 0, getTotalVotes(poll))}%
                        </span>
                      </div>
                    ))}
                    {poll.options?.length > 2 && (
                      <p className="text-muted-foreground">+{poll.options.length - 2} more options</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Empty State */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading polls...</div>
        ) : polls.length === 0 && !showCreateForm ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {isAdmin ? 'Create a poll to get started' : 'No active polls'}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
