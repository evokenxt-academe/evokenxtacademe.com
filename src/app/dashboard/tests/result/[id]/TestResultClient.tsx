"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bar, BarChart, RadialBar, RadialBarChart, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Trophy, Target,
  ChevronLeft, AlertTriangle, Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  AttemptMeta, QuestionResult, LeaderboardEntry, OptionRaw,
} from "@/types/test-result";

// ── Props ────────────────────────────────────────────────────────

interface TestResultClientProps {
  attemptMeta: AttemptMeta;
  questionResults: QuestionResult[];
  leaderboard: LeaderboardEntry[];
  currentUserRank: number;
  totalStudents: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getTypeBadgeClasses(type: AttemptMeta["quizType"]) {
  switch (type) {
    case "practice": return "border-border text-muted-foreground";
    case "graded": return "border-blue-500/40 text-blue-600 bg-blue-500/10 dark:text-blue-400";
    case "final": return "border-violet-500/40 text-violet-600 bg-violet-500/10 dark:text-violet-400";
  }
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Score Ring (SVG) ─────────────────────────────────────────────

function ScoreRing({ percent, passed, size = 140 }: {
  percent: number; passed: boolean; size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = passed ? "#22c55e" : "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="currentColor" strokeWidth={stroke}
        className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        className="fill-foreground text-3xl font-bold" style={{ fontSize: 32 }}>
        {percent}%
      </text>
    </svg>
  );
}

// ── Status Badge ─────────────────────────────────────────────────

function StatusBadge({ qr }: { qr: QuestionResult }) {
  if (qr.isSkipped) return (
    <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400 text-[10px]">
      <MinusCircle className="size-3 mr-1" /> Skipped
    </Badge>
  );
  if (qr.isCorrect) return (
    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 text-[10px]">
      <CheckCircle2 className="size-3 mr-1" /> Correct
    </Badge>
  );
  return (
    <Badge variant="outline" className="border-red-500/40 text-red-600 bg-red-500/10 dark:text-red-400 text-[10px]">
      <XCircle className="size-3 mr-1" /> Incorrect
    </Badge>
  );
}

// ── Option Row ───────────────────────────────────────────────────

function OptionRow({ opt, qr }: { opt: OptionRaw; qr: QuestionResult }) {
  const isSelected = opt.id === qr.selectedOptionId;
  const isCorrectOpt = opt.is_correct;
  let cls = "rounded-lg border px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ";

  if (isCorrectOpt) {
    cls += "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  } else if (isSelected && !isCorrectOpt) {
    cls += "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300";
  } else {
    cls += "border-border/50 bg-muted/30 text-muted-foreground";
  }

  return (
    <div className={cls}>
      {isCorrectOpt ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
      ) : isSelected ? (
        <XCircle className="size-4 shrink-0 text-red-500" />
      ) : (
        <div className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span className="flex-1">{opt.text}</span>
      {isCorrectOpt && qr.isSkipped && (
        <span className="text-[10px] font-medium text-emerald-500">Correct Answer</span>
      )}
    </div>
  );
}

// ── Question Card ────────────────────────────────────────────────

function QuestionCard({ qr, index }: { qr: QuestionResult; index: number }) {
  return (
    <Card className="border-border/50 shadow-none">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Q{index + 1}</span>
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
              {qr.marks} {qr.marks === 1 ? "mark" : "marks"}
            </Badge>
          </div>
          <StatusBadge qr={qr} />
        </div>
        <p className="text-sm text-foreground leading-relaxed">{qr.question}</p>
        <div className="space-y-2">
          {qr.options.map((opt) => (
            <OptionRow key={opt.id} opt={opt} qr={qr} />
          ))}
        </div>
        {qr.source && (
          <div className="pt-1">
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
              Source: {qr.source}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Tab 1: Review Answers ────────────────────────────────────────

function ReviewTab({ questionResults }: { questionResults: QuestionResult[] }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") return questionResults;
    if (filter === "correct") return questionResults.filter((q) => q.isCorrect);
    if (filter === "incorrect") return questionResults.filter((q) => !q.isCorrect && !q.isSkipped);
    return questionResults.filter((q) => q.isSkipped);
  }, [filter, questionResults]);

  if (questionResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">No questions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v)}
        variant="outline" className="justify-start">
        <ToggleGroupItem value="all" className="text-xs h-8 px-3">All ({questionResults.length})</ToggleGroupItem>
        <ToggleGroupItem value="correct" className="text-xs h-8 px-3">Correct ({questionResults.filter((q) => q.isCorrect).length})</ToggleGroupItem>
        <ToggleGroupItem value="incorrect" className="text-xs h-8 px-3">Incorrect ({questionResults.filter((q) => !q.isCorrect && !q.isSkipped).length})</ToggleGroupItem>
        <ToggleGroupItem value="skipped" className="text-xs h-8 px-3">Skipped ({questionResults.filter((q) => q.isSkipped).length})</ToggleGroupItem>
      </ToggleGroup>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No questions match this filter.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((qr) => {
            const origIdx = questionResults.indexOf(qr);
            return <QuestionCard key={qr.id} qr={qr} index={origIdx} />;
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Score Breakdown ───────────────────────────────────────

const radialConfig = { score: { label: "Score", color: "#22c55e" } } satisfies ChartConfig;
const barConfig = {
  earned: { label: "Earned", color: "#22c55e" },
  total: { label: "Total", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

function ScoreBreakdownTab({ attemptMeta, questionResults }: {
  attemptMeta: AttemptMeta; questionResults: QuestionResult[];
}) {
  const radialData = [{ score: attemptMeta.scorePercent, fill: attemptMeta.isPassed ? "#22c55e" : "#ef4444" }];
  const barData = questionResults.map((q, i) => ({
    name: `Q${i + 1}`, earned: q.earnedMarks, total: q.marks,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Radial Chart */}
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Overall Score</h3>
            <ChartContainer config={radialConfig} className="mx-auto h-[200px] w-[200px]">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData}
                startAngle={90} endAngle={-270} barSize={12}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
                <RadialBar dataKey="score" cornerRadius={6} background />
                <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
                  className="fill-foreground font-bold" style={{ fontSize: 24 }}>
                  {attemptMeta.scorePercent}%
                </text>
              </RadialBarChart>
            </ChartContainer>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {attemptMeta.score} / {attemptMeta.total_marks} marks
              {" · "}
              <span className={attemptMeta.isPassed ? "text-emerald-500" : "text-red-500"}>
                {attemptMeta.isPassed ? "Passed" : "Failed"}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Marks Per Question</h3>
            <ChartContainer config={barConfig} className="h-[220px] w-full">
              <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earned" fill="var(--color-earned)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="border-border/50 shadow-none">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Detailed Breakdown</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Your Answer</TableHead>
                <TableHead>Correct Answer</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionResults.map((qr, i) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-medium">Q{i + 1}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {qr.isSkipped ? "—" : (qr.selectedOption?.text ?? "—")}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {qr.correctOption?.text ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {qr.earnedMarks} / {qr.marks}
                  </TableCell>
                  <TableCell className="text-right"><StatusBadge qr={qr} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 3: Leaderboard ───────────────────────────────────────────

function LeaderboardTab({ leaderboard, currentUserRank, totalStudents }: {
  leaderboard: LeaderboardEntry[]; currentUserRank: number; totalStudents: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? leaderboard : leaderboard.slice(0, 20);

  function rankDisplay(rank: number) {
    if (rank === 1) return <span className="text-amber-500 font-bold">🥇 1</span>;
    if (rank === 2) return <span className="text-zinc-400 font-bold">🥈 2</span>;
    if (rank === 3) return <span className="text-amber-700 font-bold">🥉 3</span>;
    return <span className="text-muted-foreground font-medium">#{rank}</span>;
  }

  if (totalStudents <= 1) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Trophy className="size-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">You&apos;re the first to complete this quiz!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{totalStudents} students attempted this quiz</p>

      {currentUserRank > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="size-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-foreground">
              You ranked <span className="font-bold text-emerald-500">#{currentUserRank}</span> out of {totalStudents} students
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-none">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((entry) => (
                <TableRow key={entry.id} className={entry.isCurrentUser
                  ? "bg-muted/50 border-l-2 border-l-emerald-500" : ""}>
                  <TableCell>{rankDisplay(entry.rank)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        {entry.users?.avatar && <AvatarImage src={entry.users.avatar} />}
                        <AvatarFallback>{initials(entry.users?.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">
                        {entry.users?.name ?? "Anonymous"}
                        {entry.isCurrentUser && (
                          <span className="text-muted-foreground ml-1 text-xs">(You)</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <span className="text-sm font-medium">{entry.scorePercent}%</span>
                      <Progress value={entry.scorePercent}
                        className={`h-1 bg-muted ${
                          entry.scorePercent >= 60
                            ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                            : "[&>[data-slot=progress-indicator]]:bg-red-500"
                        }`} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {entry.score} / {entry.total_marks}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(entry.submitted_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!showAll && leaderboard.length > 20 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}
            className="text-xs text-muted-foreground hover:text-foreground">
            Show all {leaderboard.length} students
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export function TestResultClient({
  attemptMeta, questionResults, leaderboard, currentUserRank, totalStudents,
}: TestResultClientProps) {
  const correct = questionResults.filter((q) => q.isCorrect).length;
  const incorrect = questionResults.filter((q) => !q.isCorrect && !q.isSkipped).length;
  const skipped = questionResults.filter((q) => q.isSkipped).length;
  const accuracy = questionResults.length > 0 ? Math.round((correct / questionResults.length) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
        <Link href="/dashboard/tests"><ChevronLeft className="size-4" />Back to Tests</Link>
      </Button>

      {/* Status Alerts */}
      {attemptMeta.status === "in_progress" && (
        <Alert>
          <AlertTriangle className="size-4 text-amber-500" />
          <AlertTitle>In Progress</AlertTitle>
          <AlertDescription>This attempt is still in progress. Results are partial.</AlertDescription>
        </Alert>
      )}
      {attemptMeta.status === "timed_out" && (
        <Alert>
          <Timer className="size-4 text-muted-foreground" />
          <AlertTitle>Timed Out</AlertTitle>
          <AlertDescription>This attempt timed out. Showing answers submitted before timeout.</AlertDescription>
        </Alert>
      )}

      {/* Section 1 — Hero Banner */}
      <Card className="border-border/50 shadow-none overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left: Title */}
            <div className="flex flex-col gap-2 text-center md:text-left min-w-0 flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Badge variant="outline" className={`text-[10px] capitalize ${getTypeBadgeClasses(attemptMeta.quizType)}`}>
                  {attemptMeta.quizType}
                </Badge>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{attemptMeta.quizTitle}</h1>
              <p className="text-sm text-muted-foreground">{attemptMeta.courseName}</p>
            </div>

            {/* Center: Score Ring */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ScoreRing percent={attemptMeta.scorePercent} passed={attemptMeta.isPassed} />
              <p className="text-sm text-muted-foreground">
                {attemptMeta.score} / {attemptMeta.total_marks} marks
              </p>
              <Badge variant="outline" className={`text-xs font-medium ${
                attemptMeta.isPassed
                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                  : "border-red-500/40 text-red-600 bg-red-500/10 dark:text-red-400"
              }`}>
                {attemptMeta.isPassed ? "Passed" : "Failed"}
              </Badge>
            </div>

            {/* Right: Meta Pills */}
            <div className="flex flex-col gap-3 shrink-0">
              <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-4 py-2">
                <Clock className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Time Taken</p>
                  <p className="text-sm font-medium text-foreground">{attemptMeta.timeTakenLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-4 py-2">
                <Trophy className="size-4 text-amber-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rank</p>
                  <p className="text-sm font-medium text-foreground">
                    {currentUserRank > 0 ? `#${currentUserRank} of ${totalStudents}` : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-4 py-2">
                <Target className="size-4 text-emerald-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Passing Mark</p>
                  <p className="text-sm font-medium text-foreground">{attemptMeta.passingPercent}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Correct", value: correct, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Incorrect", value: incorrect, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Skipped", value: skipped, icon: MinusCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Accuracy", value: `${accuracy}%`, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50 shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex size-9 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`size-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="text-lg font-semibold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 3 — Tabs */}
      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">Review Answers</TabsTrigger>
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="review" className="mt-6">
          <ReviewTab questionResults={questionResults} />
        </TabsContent>
        <TabsContent value="breakdown" className="mt-6">
          <ScoreBreakdownTab attemptMeta={attemptMeta} questionResults={questionResults} />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-6">
          <LeaderboardTab leaderboard={leaderboard} currentUserRank={currentUserRank} totalStudents={totalStudents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
