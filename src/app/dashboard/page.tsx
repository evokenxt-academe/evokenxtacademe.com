import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import {
  computeDaysToExam,
  computeStreak,
  fetchStudentDashboardV21,
} from "./_lib/dashboard-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WatchHoursChart } from "./_components/watch-hours-chart";
import { StudyStreakHeatmap } from "./_components/study-streak-heatmap";
import { LiveStreamList } from "@/components/live-stream/LiveStreamList";
import {
  IconArrowRight,
  IconCertificate,
  IconClockHour4,
  IconFlame,
  IconPlayerPlay,
  IconTrophy,
} from "@tabler/icons-react";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700"] });

function greeting(now = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function dayLabel(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function toYmdLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies; middleware refresh handles it.
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const data = await fetchStudentDashboardV21(supabase, user.id);

  const firstName = data.profile.name.split(" ")[0] || data.profile.name;
  const greetingName = firstName || "Amar";
  const streak = computeStreak(data.streakDays);
  const daysToExam = computeDaysToExam(data.profile.target_exam_date);

  const totalWatchHours = Math.round(
    (data.streakDays.reduce((s, d) => s + d.total_seconds, 0) / 3600) * 10,
  ) / 10;
  const coursesEnrolled = data.activeEnrollments.length;
  const quizzesPassed = data.recentAttempts.filter((a) => a.passed).length;
  const certCount = data.certificates.length;

  const watch7ByDay = (() => {
    const map = new Map<string, number>();
    for (const row of data.watchHours7d) {
      map.set(row.watch_date, (map.get(row.watch_date) ?? 0) + (row.total_seconds ?? 0));
    }
    const points: Array<{ dayLabel: string; hours: number }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = toYmdLocal(d);
      const seconds = map.get(dateKey) ?? 0;
      points.push({
        dayLabel: dayLabel(dateKey),
        hours: Math.round((seconds / 3600) * 10) / 10,
      });
    }
    return points;
  })();
  const watch7Total = Math.round(watch7ByDay.reduce((sum, point) => sum + point.hours, 0) * 10) / 10;
  const watch7Average = Math.round((watch7Total / 7) * 10) / 10;
  const watchTrend = watch7ByDay.length >= 2 ? watch7ByDay[watch7ByDay.length - 1].hours - watch7ByDay[0].hours : 0;
  const watchTrendPct = watch7ByDay[0]?.hours ? Math.round((watchTrend / watch7ByDay[0].hours) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.78_0.12_274/0.18),transparent_55%)]" />
        <div className="relative flex flex-col gap-6 p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className={`${plusJakarta.className} text-3xl leading-tight md:text-4xl`}>
                {greeting()}, {greetingName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {data.profile.target_exam_body && (
                  <Badge variant="secondary" className="capitalize">
                    {data.profile.target_exam_body}
                  </Badge>
                )}
                {data.profile.target_exam_level && (
                  <Badge variant="outline">{data.profile.target_exam_level}</Badge>
                )}
                {typeof daysToExam === "number" && (
                  <Badge variant="outline">{daysToExam} days</Badge>
                )}
                <Badge variant="secondary">
                  <IconFlame data-icon="inline-start" />
                  {streak}-day streak
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Command centre for watch time, quizzes, live sessions, and your next best action.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Watch Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-mono text-2xl font-semibold tabular-nums">
                  {totalWatchHours.toFixed(1)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Courses Enrolled
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-mono text-2xl font-semibold tabular-nums">
                  {coursesEnrolled}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Quizzes Passed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-mono text-2xl font-semibold tabular-nums">
                  {quizzesPassed}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Certificates Earned
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-mono text-2xl font-semibold tabular-nums">
                  {certCount}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* RESUME */}
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Resume learning</h2>
            <p className="text-sm text-muted-foreground">Pick up exactly where you left off.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/my-courses">
              View courses
              <IconArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {data.resume.map((r) => {
            const pct = r.duration_sec > 0 ? Math.min(100, Math.round((r.resume_at_seconds / r.duration_sec) * 100)) : 0;
            const href = `/learn/${r.course_slug}?lecture=${encodeURIComponent(r.lecture_id)}&t=${encodeURIComponent(String(r.resume_at_seconds))}`;
            return (
              <Card key={r.lecture_id} className="min-w-[280px] max-w-[320px] shrink-0 overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {r.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="text-sm font-medium text-white line-clamp-2">
                      {r.lecture_title}
                    </div>
                    <div className="mt-1 text-xs text-white/70">{r.chapter_title}</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-[color-mix(in_oklab,var(--chart-1),white_10%)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">{r.course_title}</p>
                    <p className="text-xs text-muted-foreground">Last: {formatRelative(r.last_watched_at)}</p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={href}>
                      <IconPlayerPlay data-icon="inline-start" />
                      Continue
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {data.resume.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <p className="text-sm font-medium">No in-progress lectures</p>
                <p className="text-sm text-muted-foreground">Start a course and your resume queue will appear here.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {/* WATCH HOURS */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle>Watch hours (7 days)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your learning momentum over the last week.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{watch7Total.toFixed(1)}h</p>
              </div>
              <div className="rounded-lg border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Daily avg</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{watch7Average.toFixed(1)}h</p>
              </div>
              <div className="rounded-lg border bg-background/80 p-3">
                <p className="text-xs text-muted-foreground">Trend</p>
                <p className="mt-1 flex items-center gap-1 text-xl font-semibold tabular-nums">
                  <IconClockHour4 className="size-4 text-muted-foreground" />
                  {watchTrendPct > 0 ? "+" : ""}
                  {watchTrendPct}%
                </p>
              </div>
            </div>
            <WatchHoursChart data={watch7ByDay} averageHours={watch7Average} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study streak</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <StudyStreakHeatmap days={data.streakDays.map((d) => ({ date: d.watch_date, seconds: d.total_seconds }))} />
          </CardContent>
        </Card>
      </section>

      {/* ACTIVE COURSES + LIVE */}
      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Active courses</h2>
              <p className="text-sm text-muted-foreground">Progress, last activity, and quick access.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.activeEnrollments.map((c) => {
              const total = c.total_lectures || 0;
              const pct = total > 0 ? Math.round((c.completed_lectures / total) * 100) : 0;
              return (
                <Card key={c.enrollment_id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-3">
                      <div className="h-16 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                        {c.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{c.program_body}</Badge>
                          <Badge variant="outline">{c.subject_code}</Badge>
                        </div>
                        <div className="mt-2 truncate font-medium">{c.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {c.subject_name} · {c.level_label}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 pb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {c.completed_lectures}/{c.total_lectures} lectures
                        </span>
                        <span className="font-mono tabular-nums">{pct}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-[color-mix(in_oklab,var(--chart-1),white_10%)]" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          Last activity: {formatRelative(c.last_activity)}
                        </span>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/learn/${c.slug}`}>Go to course</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming live sessions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data.liveStreams.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={s.instructor_avatar ?? undefined} alt={s.instructor_name} />
                      <AvatarFallback>{s.instructor_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{s.title}</p>
                        {s.status === "live" ? (
                          <Badge variant="destructive">LIVE</Badge>
                        ) : (
                          <Badge variant="secondary">Scheduled</Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{s.course_title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.status === "live"
                          ? "Happening now"
                          : s.scheduled_at
                            ? new Date(s.scheduled_at).toLocaleString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "—"}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link
                      href={
                        s.yt_video_id
                          ? `https://www.youtube.com/watch?v=${encodeURIComponent(s.yt_video_id)}`
                          : "/dashboard"
                      }
                    >
                      Join
                    </Link>
                  </Button>
                </div>
              ))}
              {data.liveStreams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scheduled sessions.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certificates</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3 overflow-x-auto pb-2">
              {data.certificates.map((c) => (
                <Card key={c.id} className="min-w-[260px] shrink-0 border-[color-mix(in_oklab,var(--chart-1),transparent_55%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.course_title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{c.program_body}</Badge>
                      <Badge variant="outline">{c.subject_name}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono">{c.cert_number}</span>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={c.cert_url}>
                        <IconCertificate data-icon="inline-start" />
                        View PDF
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {data.certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Live classes</h2>
          <p className="text-sm text-muted-foreground">
            Join live sessions now or plan upcoming classes.
          </p>
        </div>
        <LiveStreamList />
      </section>

      {/* RECENT QUIZ RESULTS */}
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recent quiz results</h2>
            <p className="text-sm text-muted-foreground">Your last 10 submitted attempts.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <div className="grid grid-cols-[1.4fr_.6fr_.5fr_.5fr_.6fr] gap-3 border-b px-4 py-3 text-xs text-muted-foreground">
                <div>Quiz</div>
                <div>Type</div>
                <div>Score</div>
                <div>%</div>
                <div>Date</div>
              </div>
              {data.recentAttempts.map((a) => (
                <div key={a.attempt_id} className="grid grid-cols-[1.4fr_.6fr_.5fr_.5fr_.6fr] gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.quiz_title}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.course_title}</div>
                  </div>
                  <div className="text-muted-foreground">{a.quiz_type}</div>
                  <div className="font-mono tabular-nums">
                    {a.score}/{a.total_marks}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.passed ? "default" : "destructive"}>
                      {a.passed ? <IconTrophy data-icon="inline-start" /> : null}
                      {a.percentage}%
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">{formatRelative(a.submitted_at)}</div>
                </div>
              ))}
              {data.recentAttempts.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No attempts yet.</div>
              ) : null}
            </div>

            <div className="flex flex-col md:hidden">
              {data.recentAttempts.map((a, idx) => (
                <div key={a.attempt_id}>
                  {idx > 0 ? <Separator /> : null}
                  <div className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.quiz_title}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.course_title}</div>
                      </div>
                      <Badge variant={a.passed ? "default" : "destructive"}>
                        {a.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{a.quiz_type}</span>
                      <span className="font-mono tabular-nums">
                        {a.score}/{a.total_marks} · {a.percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatRelative(a.submitted_at)}</div>
                  </div>
                </div>
              ))}
              {data.recentAttempts.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No attempts yet.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
