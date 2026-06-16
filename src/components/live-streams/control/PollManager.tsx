"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart3, Loader2, Plus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useStreamPolls } from "@/hooks/useStreamPolls";
import { toast } from "sonner";

type PollManagerProps = {
  streamId: string;
};

export function PollManager({ streamId }: PollManagerProps) {
  const { polls, activePoll, loading, createPoll, closePoll } = useStreamPolls(streamId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [creating, setCreating] = useState(false);

  const closedPolls = polls.filter((p) => !p.is_active);

  const getTotalVotes = (poll: (typeof polls)[0]) =>
    poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;

  const getPct = (votes: number, total: number) =>
    total === 0 ? 0 : Math.round((votes / total) * 100);

  const handleCreate = async () => {
    const filled = options.filter((o) => o.trim());
    if (!question.trim()) {
      toast.error("Enter a question");
      return;
    }
    if (filled.length < 2) {
      toast.error("Add at least 2 options");
      return;
    }

    setCreating(true);
    try {
      await createPoll(question, filled, isAnonymous);
      setQuestion("");
      setOptions(["", ""]);
      setDialogOpen(false);
      toast.success("Poll is live");
    } catch {
      toast.error("Failed to create poll");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <Button size="sm" className="w-full gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5" />
          Create Poll
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {activePoll ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                  Active poll
                </span>
                <p className="mt-1 text-sm font-medium">{activePoll.question}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                onClick={() => closePoll(activePoll.id)}
              >
                End poll
              </Button>
            </div>

            <div className="space-y-2.5">
              {activePoll.options?.map((opt) => {
                const total = getTotalVotes(activePoll);
                const pct = getPct(opt.votes || 0, total);
                return (
                  <div key={opt.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{opt.text ?? (opt as any).option_text}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {pct}% · {opt.votes || 0}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              {getTotalVotes(activePoll)} votes · started{" "}
              {formatDistanceToNow(new Date(activePoll.created_at), { addSuffix: true })}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <BarChart3 className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No active poll</p>
            <p className="text-xs text-muted-foreground/70">
              Create a poll to engage your viewers
            </p>
          </div>
        )}

        {closedPolls.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Past polls
            </p>
            {closedPolls.map((poll) => {
              const total = getTotalVotes(poll);
              const top = [...(poll.options || [])].sort(
                (a, b) => (b.votes || 0) - (a.votes || 0),
              )[0];
              return (
                <div
                  key={poll.id}
                  className="rounded-lg border border-border/60 px-3 py-2.5"
                >
                  <p className="text-sm font-medium line-clamp-2">{poll.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {total} votes
                    {top && ` · top: ${top.text ?? (top as any).option_text} (${getPct(top.votes || 0, total)}%)`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create poll</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="poll-question">Question</Label>
              <Input
                id="poll-question"
                placeholder="What do you want to ask?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setOptions([...options, ""])}
                >
                  <Plus className="mr-1 size-3.5" />
                  Add option
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="poll-anon"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="poll-anon" className="text-sm font-normal">
                Anonymous voting
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : "Launch poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
