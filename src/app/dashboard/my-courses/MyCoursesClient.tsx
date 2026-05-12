"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowsSort,
  IconSearch,
  IconPlayerPlay,
  IconBolt,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MyCourseRow } from "./_lib/my-courses-data";
import { useStudentMyCourses } from "@/features/student/hooks/use-dashboard-queries";

type SortKey = "last_accessed" | "progress" | "name" | "enrolled_at";
type FilterKey = "all" | "ACCA" | "CFA" | "CMA";

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

export function MyCoursesClient({ rows: initialRows }: { rows: MyCourseRow[] }) {
  // Use TanStack Query cache — on first visit SSR data is used as initialData.
  // On tab re-visits, cached data is served instantly (no skeleton).
  const { data: rows = initialRows } = useStudentMyCourses(initialRows);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("last_accessed");
  const [query, setQuery] = useState("");
  const [overdueDismissed, setOverdueDismissed] = useState(false);

  const overdueCount = rows.reduce((s, r) => s + (r.overdue_instalments ?? 0), 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.program_body === filter);
    if (q) {
      list = list.filter((r) => {
        const a = r.title.toLowerCase();
        const b = r.subject_name.toLowerCase();
        return a.includes(q) || b.includes(q) || r.subject_code.toLowerCase().includes(q);
      });
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "last_accessed": {
          const am = a.last_activity ? Date.parse(a.last_activity) : 0;
          const bm = b.last_activity ? Date.parse(b.last_activity) : 0;
          return bm - am;
        }
        case "progress": {
          const ap = a.total_lectures > 0 ? a.completed_lectures / a.total_lectures : 0;
          const bp = b.total_lectures > 0 ? b.completed_lectures / b.total_lectures : 0;
          return bp - ap;
        }
        case "name":
          return a.title.localeCompare(b.title);
        case "enrolled_at":
          return Date.parse(b.enrolled_at) - Date.parse(a.enrolled_at);
      }
    });
    return sorted;
  }, [rows, filter, sort, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {rows.length} Active {rows.length === 1 ? "Course" : "Courses"}
          </h1>
          <p className="text-sm text-muted-foreground">Filter, sort, and continue instantly.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ACCA">ACCA</TabsTrigger>
              <TabsTrigger value="CFA">CFA</TabsTrigger>
              <TabsTrigger value="CMA">CMA</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[220px]">
              <IconSearch className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search course or subject…"
                className="pl-8"
              />
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[200px]">
                <IconArrowsSort data-icon="inline-start" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_accessed">Last Accessed</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="enrolled_at">Enrolled Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {overdueCount > 0 && !overdueDismissed ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-destructive">
                <IconAlertTriangle />
              </div>
              <div>
                <p className="font-medium">You have {overdueCount} overdue payment(s).</p>
                <p className="text-sm text-muted-foreground">
                  Complete payment to retain uninterrupted access.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOverdueDismissed(true)}>
                Dismiss
              </Button>
              <Button asChild>
                <Link href="/dashboard/payments">Go to Payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm text-muted-foreground">Try clearing filters or search.</p>
            <Button asChild className="mt-2">
              <Link href="/courses">Browse Programs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const total = c.total_lectures || 0;
            const pct = total > 0 ? Math.round((c.completed_lectures / total) * 100) : 0;
            const isDone = total > 0 && c.completed_lectures === total;
            return (
              <Card
                key={c.enrollment_id}
                className={cn(
                  "overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl",
                )}
              >
                <div className="relative aspect-video bg-muted">
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{c.program_body}</Badge>
                    <Badge variant="outline">{c.subject_code}</Badge>
                    {isDone ? <Badge variant="secondary">Certificate Ready</Badge> : null}
                    {c.has_payment_risk ? (
                      <Badge variant={c.overdue_instalments > 0 ? "destructive" : "secondary"}>
                        <IconBolt data-icon="inline-start" />
                        {c.overdue_instalments > 0 ? "Payment Overdue" : "Payment Pending"}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="font-medium text-white line-clamp-2">{c.title}</div>
                    <div className="mt-1 text-xs text-white/75">
                      {c.subject_name} · {c.level_label}
                    </div>
                  </div>
                </div>

                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {c.completed_lectures}/{c.total_lectures} lectures
                    </span>
                    <span className="font-mono tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[color-mix(in_oklab,var(--chart-1),white_10%)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last: {formatRelative(c.last_activity)}</span>
                    {c.next_due_date ? <span>Due: {c.next_due_date}</span> : <span />}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/learn/${c.slug}`}>
                        <IconPlayerPlay data-icon="inline-start" />
                        Continue
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/learn/${c.slug}#quizzes`}>Quiz</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

