"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconBook,
  IconCalendar,
  IconCalendarEvent,
  IconSearch,
  IconUserPlus,
  IconUsers,
  IconShieldLock,
  IconCheck,
  IconX,
  IconClock,
  IconInfinity,
  IconAlertTriangle,
  IconClockOff,
  IconRefresh,
  IconPencil,
  IconLayoutList,
  IconLayoutGrid,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminResourceTable } from "@/features/admin/components/admin-resource-table";
import { adminApi } from "@/features/admin/lib/admin-api";
import { formatDate, getInitials } from "@/features/admin/lib/formatters";
import { createClient } from "@/utils/supabase/client";
import type { AdminEnrollment } from "@/features/admin/data/admin-sample-data";

// ── Types ───────────────────────────────────────────────

type Role = "student" | "instructor" | "admin";
type EnrollmentStatus = "active" | "expired" | "refunded";
type ExpiryFilter = "all" | "active" | "expiring-soon" | "expired" | "lifetime";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface EnrollmentInput {
  userIds: string[];
  courseIds: string[];
  expiresAt: string | null;
}

interface EnrollmentAssignmentResult {
  created: number;
  reactivated: number;
  skippedActive: number;
}

interface CourseGroup {
  courseId: string;
  courseName: string;
  courseSlug: string;
  enrollments: AdminEnrollment[];
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  lifetimeCount: number;
}

// ── Helpers ─────────────────────────────────────────────

function formatEnrollmentError(message: string): string {
  if (
    message.includes("enrollments_user_id_course_id_key") ||
    message.includes("duplicate key")
  ) {
    return "One or more users are already enrolled in the selected courses.";
  }
  return message || "Failed to create enrollments";
}

function buildAssignmentToast(result: EnrollmentAssignmentResult): {
  type: "success" | "warning";
  title: string;
  description?: string;
} {
  const assigned = result.created + result.reactivated;

  if (assigned === 0 && result.skippedActive > 0) {
    return {
      type: "warning",
      title: "Already enrolled",
      description:
        result.skippedActive === 1
          ? "This user already has active access to the selected course."
          : "All selected users already have active access to the chosen courses.",
    };
  }

  if (result.skippedActive > 0) {
    const assignedLabel = `${assigned} enrollment${assigned === 1 ? "" : "s"} assigned`;
    const skippedLabel = `${result.skippedActive} already had active access and ${result.skippedActive === 1 ? "was" : "were"} skipped`;
    return {
      type: "success",
      title: assignedLabel,
      description: skippedLabel,
    };
  }

  if (result.reactivated > 0 && result.created > 0) {
    return {
      type: "success",
      title: `${assigned} enrollment${assigned === 1 ? "" : "s"} assigned`,
      description: `${result.created} new, ${result.reactivated} reactivated from expired or refunded access.`,
    };
  }

  if (result.reactivated > 0) {
    return {
      type: "success",
      title: `${result.reactivated} enrollment${result.reactivated === 1 ? "" : "s"} reactivated`,
      description: "Access was restored for previously expired or refunded enrollments.",
    };
  }

  return {
    type: "success",
    title: `${result.created} enrollment${result.created === 1 ? "" : "s"} created`,
  };
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isExpiringSoon(expiresAt: string | null): boolean {
  const days = getDaysUntilExpiry(expiresAt);
  return days !== null && days > 0 && days <= 30;
}

function isLifetime(expiresAt: string | null): boolean {
  return expiresAt === null;
}

function isExpiredDate(expiresAt: string | null): boolean {
  const days = getDaysUntilExpiry(expiresAt);
  return days !== null && days <= 0;
}

// ── UI Styles ───────────────────────────────────────────

const enrollmentStyles: Record<EnrollmentStatus, string> = {
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  expired: "border-muted-foreground/20 bg-muted text-muted-foreground",
  refunded:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const userRoleStyles: Record<Role, string> = {
  student: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  instructor:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  admin:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

// ── Supabase Queries ────────────────────────────────────

function useUsers() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["supabase-users-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .eq("role", "student")
        .order("name");

      if (error) throw new Error(error.message);
      return (data ?? []) as User[];
    },
  });
}

function useCourses() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["supabase-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug")
        .order("title");

      if (error) throw new Error(error.message);
      return data as Course[];
    },
  });
}

function useExistingActiveEnrollments(
  userIds: string[],
  courseIds: string[],
  enabled: boolean,
) {
  const supabase = createClient();
  return useQuery({
    queryKey: [
      "enrollment-pairs-active",
      [...userIds].sort(),
      [...courseIds].sort(),
    ],
    enabled: enabled && userIds.length > 0 && courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("user_id, course_id")
        .in("user_id", userIds)
        .in("course_id", courseIds)
        .eq("status", "active");

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

function useCreateEnrollments() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EnrollmentInput): Promise<EnrollmentAssignmentResult> => {
      if (!input.userIds.length || !input.courseIds.length) {
        throw new Error("Select at least one user and one course.");
      }

      const { data: existing, error: existingError } = await supabase
        .from("enrollments")
        .select("user_id, course_id, status")
        .in("user_id", input.userIds)
        .in("course_id", input.courseIds);

      if (existingError) {
        throw new Error(formatEnrollmentError(existingError.message));
      }

      const existingByPair = new Map(
        (existing ?? []).map((row: any) => [
          `${row.user_id}:${row.course_id}`,
          row.status as EnrollmentStatus,
        ]),
      );

      let created = 0;
      let reactivated = 0;
      let skippedActive = 0;
      const payloads: Array<{
        user_id: string;
        course_id: string;
        status: EnrollmentStatus;
        enrolled_at: string;
        expires_at: string | null;
      }> = [];

      for (const userId of input.userIds) {
        for (const courseId of input.courseIds) {
          const existingStatus = existingByPair.get(`${userId}:${courseId}`);

          if (existingStatus === "active") {
            skippedActive++;
            continue;
          }

          if (existingStatus === "expired" || existingStatus === "refunded") {
            reactivated++;
          } else {
            created++;
          }

          payloads.push({
            user_id: userId,
            course_id: courseId,
            status: "active",
            enrolled_at: new Date().toISOString(),
            expires_at: input.expiresAt,
          });
        }
      }

      if (payloads.length === 0) {
        return { created: 0, reactivated: 0, skippedActive };
      }

      const { error } = await supabase.from("enrollments").upsert(payloads as any, {
        onConflict: "user_id,course_id",
      });

      if (error) {
        throw new Error(formatEnrollmentError(error.message));
      }

      return { created, reactivated, skippedActive };
    },
    onSuccess: (result) => {
      const message = buildAssignmentToast(result);
      if (message.type === "warning") {
        toast.warning(message.title, { description: message.description });
      } else {
        toast.success(message.title, { description: message.description });
      }

      if (result.created + result.reactivated > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
        queryClient.invalidateQueries({
          queryKey: ["enrollment-pairs-active"],
        });
      }
    },
    onError: (error: Error) => {
      toast.error(formatEnrollmentError(error.message));
    },
  });
}

// ── Expiry Display Component ────────────────────────────

function ExpiryBadge({ expiresAt, status }: { expiresAt: string | null; status: EnrollmentStatus }) {
  if (status === "refunded") {
    return (
      <Badge className="gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-rose-700 dark:text-rose-300">
        <IconClockOff className="size-3" />
        Refunded
      </Badge>
    );
  }

  if (expiresAt === null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
              <IconInfinity className="size-3" />
              Lifetime Access
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Never expires</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const days = getDaysUntilExpiry(expiresAt);
  if (days === null) return <span className="text-sm text-muted-foreground">—</span>;

  if (days <= 0) {
    const absDays = Math.abs(days);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="gap-1 rounded-full border border-muted-foreground/20 bg-muted px-2.5 py-1 text-muted-foreground">
              <IconClockOff className="size-3" />
              Expired {absDays === 0 ? "today" : `${absDays}d ago`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{formatDate(expiresAt)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (days <= 7) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-red-700 dark:text-red-400">
              <IconAlertTriangle className="size-3" />
              {days}d left
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Expires {formatDate(expiresAt)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (days <= 30) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400">
              <IconClock className="size-3" />
              {days}d left
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Expires {formatDate(expiresAt)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // More than 30 days
  const months = Math.floor(days / 30);
  const label = months >= 12
    ? `${Math.floor(months / 12)}y ${months % 12}m`
    : `${months}m ${days % 30}d`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sky-700 dark:text-sky-300">
            <IconClock className="size-3" />
            {label} left
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Expires {formatDate(expiresAt)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── KPI Stat Card ───────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-border hover:shadow-sm ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex size-8 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="size-4" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold tabular-nums tracking-tight">
        {value.toLocaleString("en-IN")}
      </span>
    </button>
  );
}

// ── Extend Expiry Modal ─────────────────────────────────

function ExtendExpiryModal({
  enrollment,
  open,
  onOpenChange,
}: {
  enrollment: AdminEnrollment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [extensionType, setExtensionType] = React.useState<
    "30d" | "90d" | "180d" | "1y" | "lifetime" | "custom"
  >("30d");
  const [customDate, setCustomDate] = React.useState("");

  const updateMutation = useMutation({
    mutationFn: (payload: { expiresAt?: string | null; status?: EnrollmentStatus }) =>
      adminApi.updateEnrollment(enrollment!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success("Enrollment updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update enrollment");
    },
  });

  const handleExtend = () => {
    if (!enrollment) return;

    let newExpiry: string | null = null;

    if (extensionType === "lifetime") {
      newExpiry = null;
    } else if (extensionType === "custom") {
      if (!customDate) return;
      newExpiry = new Date(customDate).toISOString();
    } else {
      const base = enrollment.expiresAt
        ? new Date(Math.max(new Date(enrollment.expiresAt).getTime(), Date.now()))
        : new Date();
      const daysMap: Record<string, number> = {
        "30d": 30,
        "90d": 90,
        "180d": 180,
        "1y": 365,
      };
      base.setDate(base.getDate() + (daysMap[extensionType] ?? 30));
      newExpiry = base.toISOString();
    }

    updateMutation.mutate({
      expiresAt: newExpiry,
      status: "active",
    });
  };

  React.useEffect(() => {
    if (open) {
      setExtensionType("30d");
      setCustomDate("");
    }
  }, [open]);

  if (!enrollment) return null;

  const presets: { value: string; label: string; description: string }[] = [
    { value: "30d", label: "+30 days", description: "Extend by one month" },
    { value: "90d", label: "+90 days", description: "Extend by three months" },
    { value: "180d", label: "+6 months", description: "Extend by half a year" },
    { value: "1y", label: "+1 year", description: "Extend by one full year" },
    { value: "lifetime", label: "Lifetime", description: "Remove expiry entirely" },
    { value: "custom", label: "Custom date", description: "Pick a specific expiry date" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Extend / Edit Expiry
          </DialogTitle>
          <DialogDescription>
            Update access duration for{" "}
            <span className="font-medium text-foreground">{enrollment.user}</span>{" "}
            in{" "}
            <span className="font-medium text-foreground">{enrollment.course}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current expiry
            </p>
            <div className="mt-1.5">
              <ExpiryBadge expiresAt={enrollment.expiresAt} status={enrollment.status} />
            </div>
          </div>

          <RadioGroup
            value={extensionType}
            onValueChange={(val) => setExtensionType(val as typeof extensionType)}
            className="grid grid-cols-2 gap-2"
          >
            {presets.map((preset) => (
              <label
                key={preset.value}
                htmlFor={`ext-${preset.value}`}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors hover:bg-muted/30 ${
                  extensionType === preset.value
                    ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/70 bg-background"
                }`}
              >
                <RadioGroupItem
                  value={preset.value}
                  id={`ext-${preset.value}`}
                  className="mt-0.5"
                />
                <div>
                  <span className="block text-sm font-medium">{preset.label}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {preset.description}
                  </span>
                </div>
              </label>
            ))}
          </RadioGroup>

          {extensionType === "custom" && (
            <Input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-10"
            />
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg"
            disabled={
              updateMutation.isPending ||
              (extensionType === "custom" && !customDate)
            }
            onClick={handleExtend}
          >
            {updateMutation.isPending ? "Updating..." : "Update Expiry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Student Avatar & Helpers ────────────────────────────

const AVATAR_COLOR_PALETTES = [
  "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOR_PALETTES[Math.abs(hash) % AVATAR_COLOR_PALETTES.length];
}

function sanitizeAvatarUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return undefined;
}

function StudentAvatar({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar?: string | null;
  className?: string;
}) {
  const validUrl = sanitizeAvatarUrl(avatar);
  const palette = getAvatarPalette(name);

  return (
    <Avatar className={`size-9 shrink-0 border ${palette} ${className ?? ""}`}>
      {validUrl ? (
        <AvatarImage
          src={validUrl}
          alt={name}
          className="aspect-square size-full object-cover"
        />
      ) : null}
      <AvatarFallback className={`size-full text-xs font-semibold ${palette}`}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

// ── Student Table Row in Subject View ───────────────────

function StudentTableRow({
  index,
  enrollment,
  onExtend,
  onRevoke,
}: {
  index: number;
  enrollment: AdminEnrollment;
  onExtend: (enrollment: AdminEnrollment) => void;
  onRevoke: (enrollment: AdminEnrollment) => void;
}) {
  return (
    <tr className="group transition-colors hover:bg-muted/30">
      {/* 1. Index # */}
      <td className="w-12 px-4 py-3.5 text-center font-mono text-xs text-muted-foreground">
        {index}
      </td>

      {/* 2. Student Avatar + Name + Email */}
      <td className="min-w-[220px] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <StudentAvatar name={enrollment.user} avatar={enrollment.userAvatar} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight text-foreground">
              {enrollment.user}
            </p>
            {enrollment.userEmail ? (
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {enrollment.userEmail}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      {/* 3. Enrolled Date */}
      <td className="w-36 px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
        {formatDate(enrollment.enrolledAt)}
      </td>

      {/* 4. Expiry Badge */}
      <td className="w-48 px-4 py-3.5 whitespace-nowrap">
        <ExpiryBadge expiresAt={enrollment.expiresAt} status={enrollment.status} />
      </td>

      {/* 5. Status Badge */}
      <td className="w-28 px-4 py-3.5 whitespace-nowrap">
        <Badge
          className={`rounded-full border px-2.5 py-0.5 text-[11px] capitalize ${enrollmentStyles[enrollment.status]}`}
        >
          {enrollment.status}
        </Badge>
      </td>

      {/* 6. Actions */}
      <td className="w-24 px-4 py-3.5 text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 rounded-lg p-0 text-muted-foreground hover:bg-accent hover:text-primary"
                  onClick={() => onExtend(enrollment)}
                >
                  <IconPencil className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit / Extend Expiry</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 rounded-lg p-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  onClick={() => onRevoke(enrollment)}
                >
                  <IconShieldLock className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Revoke Access</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>
    </tr>
  );
}

// ── Component ───────────────────────────────────────────

export default function EnrollmentsPage() {
  const enrollmentsQuery = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: adminApi.getEnrollments,
  });

  const enrollments = React.useMemo(
    () =>
      (enrollmentsQuery.data?.enrollments ?? []).filter(
        (e) => e.userRole !== "admin" && e.userRole !== "instructor",
      ),
    [enrollmentsQuery.data?.enrollments],
  );

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | EnrollmentStatus>("all");
  const [expiryFilter, setExpiryFilter] = React.useState<ExpiryFilter>("all");
  const [courseFilter, setCourseFilter] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"subject" | "table">("subject");

  const [enrollOpen, setEnrollOpen] = React.useState(false);
  const [revokeEnrollment, setRevokeEnrollment] = React.useState<AdminEnrollment | null>(null);
  const [extendEnrollment, setExtendEnrollment] = React.useState<AdminEnrollment | null>(null);

  // Assignment modal hooks
  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const createEnrollment = useCreateEnrollments();

  // Multi-select Form State
  const [userSearch, setUserSearch] = React.useState("");
  const [courseSearch, setCourseSearch] = React.useState("");
  const [selectedUserIds, setSelectedUserIds] = React.useState<Set<string>>(new Set());
  const [selectedCourseIds, setSelectedCourseIds] = React.useState<Set<string>>(new Set());
  const [expiryType, setExpiryType] = React.useState<"never" | "5years" | "custom">("never");
  const [customExpiry, setCustomExpiry] = React.useState("");

  const selectedUserIdList = React.useMemo(() => Array.from(selectedUserIds), [selectedUserIds]);
  const selectedCourseIdList = React.useMemo(() => Array.from(selectedCourseIds), [selectedCourseIds]);

  const existingActiveQuery = useExistingActiveEnrollments(
    selectedUserIdList,
    selectedCourseIdList,
    enrollOpen,
  );

  const totalPairCount = selectedUserIds.size * selectedCourseIds.size;
  const alreadyActiveCount = existingActiveQuery.data?.length ?? 0;
  const newAssignmentCount = Math.max(0, totalPairCount - alreadyActiveCount);
  const allAlreadyEnrolled = totalPairCount > 0 && alreadyActiveCount >= totalPairCount;

  const resetForm = () => {
    setUserSearch("");
    setCourseSearch("");
    setSelectedUserIds(new Set());
    setSelectedCourseIds(new Set());
    setExpiryType("never");
    setCustomExpiry("");
  };

  const handleOpenChange = (open: boolean) => {
    setEnrollOpen(open);
    if (!open) resetForm();
  };

  const handleEnroll = () => {
    let calculatedExpiry: string | null = null;
    if (expiryType === "5years") {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 5);
      calculatedExpiry = expiryDate.toISOString();
    } else if (expiryType === "custom") {
      calculatedExpiry = customExpiry ? new Date(customExpiry).toISOString() : null;
    }

    createEnrollment.mutate(
      {
        userIds: selectedUserIdList,
        courseIds: selectedCourseIdList,
        expiresAt: calculatedExpiry,
      },
      {
        onSuccess: (result) => {
          if (result.created + result.reactivated > 0) {
            setEnrollOpen(false);
            resetForm();
          }
        },
      },
    );
  };

  const queryClient = useQueryClient();
  const revokeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      adminApi.revokeEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success("Enrollment revoked");
      setRevokeEnrollment(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to revoke enrollment");
    },
  });

  // ── Computed Data ───────────────────────────────────────

  const filteredEnrollments = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrollments.filter((enrollment) => {
      const matchesQuery =
        !query ||
        enrollment.user.toLowerCase().includes(query) ||
        (enrollment.userEmail?.toLowerCase().includes(query) ?? false) ||
        enrollment.course.toLowerCase().includes(query) ||
        (enrollment.courseSlug?.toLowerCase().includes(query) ?? false);

      const matchesStatus =
        statusFilter === "all" || enrollment.status === statusFilter;

      const matchesCourse =
        courseFilter === "all" || enrollment.courseId === courseFilter;

      let matchesExpiry = true;
      if (expiryFilter === "lifetime") {
        matchesExpiry = isLifetime(enrollment.expiresAt);
      } else if (expiryFilter === "expiring-soon") {
        matchesExpiry = isExpiringSoon(enrollment.expiresAt);
      } else if (expiryFilter === "expired") {
        matchesExpiry = isExpiredDate(enrollment.expiresAt) || enrollment.status === "expired";
      } else if (expiryFilter === "active") {
        matchesExpiry =
          enrollment.status === "active" &&
          (isLifetime(enrollment.expiresAt) || !isExpiredDate(enrollment.expiresAt));
      }

      return matchesQuery && matchesStatus && matchesCourse && matchesExpiry;
    });
  }, [enrollments, search, statusFilter, courseFilter, expiryFilter]);

  // KPI Stats
  const stats = React.useMemo(() => {
    const total = enrollments.length;
    const active = enrollments.filter((e) => e.status === "active").length;
    const expiringSoon = enrollments.filter(
      (e) => e.status === "active" && isExpiringSoon(e.expiresAt),
    ).length;
    const expired = enrollments.filter(
      (e) => e.status === "expired" || (e.expiresAt && isExpiredDate(e.expiresAt)),
    ).length;
    const lifetime = enrollments.filter(
      (e) => e.status === "active" && isLifetime(e.expiresAt),
    ).length;
    return { total, active, expiringSoon, expired, lifetime };
  }, [enrollments]);

  // Group by course for subject-wise view
  const courseGroups = React.useMemo<CourseGroup[]>(() => {
    const map = new Map<string, CourseGroup>();

    for (const enrollment of filteredEnrollments) {
      if (!map.has(enrollment.courseId)) {
        map.set(enrollment.courseId, {
          courseId: enrollment.courseId,
          courseName: enrollment.course,
          courseSlug: enrollment.courseSlug || "",
          enrollments: [],
          activeCount: 0,
          expiringSoonCount: 0,
          expiredCount: 0,
          lifetimeCount: 0,
        });
      }

      const group = map.get(enrollment.courseId)!;
      group.enrollments.push(enrollment);

      if (enrollment.status === "active") group.activeCount++;
      if (enrollment.status === "active" && isExpiringSoon(enrollment.expiresAt))
        group.expiringSoonCount++;
      if (
        enrollment.status === "expired" ||
        (enrollment.expiresAt && isExpiredDate(enrollment.expiresAt))
      )
        group.expiredCount++;
      if (enrollment.status === "active" && isLifetime(enrollment.expiresAt))
        group.lifetimeCount++;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.courseName.localeCompare(b.courseName),
    );
  }, [filteredEnrollments]);

  // Unique course list for filter dropdown
  const uniqueCourses = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const e of enrollments) {
      if (!map.has(e.courseId)) map.set(e.courseId, e.course);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [enrollments]);

  // Table columns
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "user",
        header: "Student",
        cell: ({ row }) => {
          const e = row.original as AdminEnrollment;
          return (
            <div className="flex items-center gap-2.5">
              <StudentAvatar name={e.user} avatar={e.userAvatar} className="size-8 text-[10px]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.user}</p>
                {e.userEmail && (
                  <p className="truncate text-xs text-muted-foreground">{e.userEmail}</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "course",
        header: "Subject",
        cell: ({ row }) => {
          const e = row.original as AdminEnrollment;
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{e.course}</p>
              {e.courseSlug && (
                <p className="truncate text-xs font-mono text-muted-foreground">{e.courseSlug}</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status as EnrollmentStatus;
          return (
            <Badge
              className={`rounded-full border px-2.5 py-1 capitalize ${enrollmentStyles[status]}`}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "enrolledAt",
        header: "Enrolled",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.enrolledAt)}
          </span>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expiry",
        cell: ({ row }) => {
          const e = row.original as AdminEnrollment;
          return <ExpiryBadge expiresAt={e.expiresAt} status={e.status} />;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const e = row.original as AdminEnrollment;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-muted-foreground hover:text-primary"
                onClick={() => setExtendEnrollment(e)}
              >
                <IconPencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setRevokeEnrollment(e)}
              >
                <IconShieldLock className="size-3.5" />
                Revoke
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <AdminPageShell
      title="Enrollments"
      description="Subject-wise student roster with access tracking, expiry management, and quick enrollment tools."
      actions={
        <Dialog open={enrollOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <IconUserPlus />
              Assign access
            </Button>
          </DialogTrigger>
          <DialogContent className="flex h-[min(90vh,820px)] w-[calc(100%-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
            <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-5 pr-14">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Bulk Course Assignment
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Select users and courses, then set an optional expiry. Each
                user–course pair creates one enrollment.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                {/* 1. STUDENTS */}
                <section className="flex min-h-0 flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <IconUsers className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold leading-none">
                          Select students
                        </h3>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Search by name or email, then pick one or more.
                        </p>
                      </div>
                    </div>
                    {selectedUserIds.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
                      >
                        {selectedUserIds.size} selected
                      </Badge>
                    )}
                  </div>

                  <div className="flex min-h-[260px] md:min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                    <Command className="flex h-full flex-col bg-transparent" shouldFilter={false}>
                      <CommandInput
                        placeholder="Search students by name or email..."
                        className="h-11 border-0 border-b border-border/60 bg-background/80 px-4"
                        value={userSearch}
                        onValueChange={setUserSearch}
                      />
                      <CommandList className="max-h-none flex-1 overflow-y-auto">
                        {!userSearch.trim() ? (
                          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                            <IconSearch className="size-5 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                              Type a name or email to search students
                            </p>
                          </div>
                        ) : loadingUsers ? (
                          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                            Loading students...
                          </div>
                        ) : (
                          <CommandGroup className="p-2">
                            {users
                              .filter(
                                (u) =>
                                  u.name
                                    .toLowerCase()
                                    .includes(userSearch.toLowerCase()) ||
                                  u.email
                                    .toLowerCase()
                                    .includes(userSearch.toLowerCase()),
                              )
                              .map((user) => {
                                const isSelected = selectedUserIds.has(user.id);
                                return (
                                  <CommandItem
                                    key={user.id}
                                    value={`${user.name} ${user.email}`}
                                    onSelect={() => {
                                      const next = new Set(selectedUserIds);
                                      if (isSelected) next.delete(user.id);
                                      else next.add(user.id);
                                      setSelectedUserIds(next);
                                    }}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-accent"
                                  >
                                    <div
                                      className={`flex size-5 shrink-0 items-center justify-center rounded border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                                    >
                                      {isSelected && (
                                        <IconCheck className="size-3.5" />
                                      )}
                                    </div>
                                    <StudentAvatar
                                      name={user.name}
                                      avatar={(user as any).avatar}
                                      className="size-8 text-[10px]"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium leading-tight">
                                        {user.name}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                      </p>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            {users.filter(
                              (u) =>
                                !userSearch.trim() ||
                                u.name
                                  .toLowerCase()
                                  .includes(userSearch.toLowerCase()) ||
                                u.email
                                  .toLowerCase()
                                  .includes(userSearch.toLowerCase()),
                            ).length === 0 && (
                              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                No students found matching &ldquo;{userSearch}&rdquo;
                              </div>
                            )}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </div>

                  {selectedUserIds.size > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Selected students
                      </p>
                      <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                        {Array.from(selectedUserIds).map((id) => {
                          const u = users.find((x) => x.id === id);
                          if (!u) return null;
                          return (
                            <Badge
                              key={u.id}
                              variant="secondary"
                              className="gap-1.5 rounded-full py-1 pl-2.5 pr-1.5"
                            >
                              <span className="max-w-[140px] truncate">
                                {u.name}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${u.name}`}
                                className="rounded-full p-0.5 hover:bg-muted"
                                onClick={() => {
                                  const next = new Set(selectedUserIds);
                                  next.delete(u.id);
                                  setSelectedUserIds(next);
                                }}
                              >
                                <IconX className="size-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. COURSES */}
                <section className="flex min-h-0 flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <IconBook className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold leading-none">
                          Select courses
                        </h3>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Choose every course to grant access to.
                        </p>
                      </div>
                    </div>
                    {selectedCourseIds.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
                      >
                        {selectedCourseIds.size} selected
                      </Badge>
                    )}
                  </div>

                  <div className="flex min-h-[260px] md:min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                    <Command className="flex h-full flex-col bg-transparent" shouldFilter={false}>
                      <CommandInput
                        placeholder="Search courses by title or slug..."
                        className="h-11 border-0 border-b border-border/60 bg-background/80 px-4"
                        value={courseSearch}
                        onValueChange={setCourseSearch}
                      />
                      <CommandList className="max-h-none flex-1 overflow-y-auto">
                        {loadingCourses ? (
                          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                            Loading courses...
                          </div>
                        ) : (
                          <CommandGroup className="p-2">
                            {courses
                              .filter(
                                (c) =>
                                  !courseSearch.trim() ||
                                  c.title
                                    .toLowerCase()
                                    .includes(courseSearch.toLowerCase()) ||
                                  c.slug
                                    .toLowerCase()
                                    .includes(courseSearch.toLowerCase()),
                              )
                              .map((course) => {
                                const isSelected = selectedCourseIds.has(course.id);
                                return (
                                  <CommandItem
                                    key={course.id}
                                    value={`${course.title} ${course.slug}`}
                                    onSelect={() => {
                                      const next = new Set(selectedCourseIds);
                                      if (isSelected) next.delete(course.id);
                                      else next.add(course.id);
                                      setSelectedCourseIds(next);
                                    }}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-accent"
                                  >
                                    <div
                                      className={`flex size-5 shrink-0 items-center justify-center rounded border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                                    >
                                      {isSelected && (
                                        <IconCheck className="size-3.5" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium leading-tight">
                                        {course.title}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground font-mono mt-0.5">
                                        {course.slug}
                                      </p>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            {courses.filter(
                              (c) =>
                                !courseSearch.trim() ||
                                c.title
                                  .toLowerCase()
                                  .includes(courseSearch.toLowerCase()) ||
                                c.slug
                                  .toLowerCase()
                                  .includes(courseSearch.toLowerCase()),
                            ).length === 0 && (
                              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                                No courses found matching &ldquo;{courseSearch}&rdquo;
                              </div>
                            )}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </div>

                  {selectedCourseIds.size > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Selected courses
                      </p>
                      <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg border border-dashed border-border/70 bg-muted/10 p-3">
                        {Array.from(selectedCourseIds).map((id) => {
                          const c = courses.find((x) => x.id === id);
                          if (!c) return null;
                          return (
                            <Badge
                              key={c.id}
                              variant="secondary"
                              className="gap-1.5 rounded-full py-1 pl-2.5 pr-1.5 bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20"
                            >
                              <span className="max-w-[140px] truncate">
                                {c.title}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${c.title}`}
                                className="rounded-full p-0.5 hover:bg-muted"
                                onClick={() => {
                                  const next = new Set(selectedCourseIds);
                                  next.delete(c.id);
                                  setSelectedCourseIds(next);
                                }}
                              >
                                <IconX className="size-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <Separator className="my-8" />

              {/* 3. EXPIRY */}
              <section className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <IconCalendarEvent className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-none">
                      Access expiry
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Control how long enrolled users can access the courses.
                    </p>
                  </div>
                </div>

                <RadioGroup
                  value={expiryType}
                  onValueChange={(val: "never" | "5years" | "custom") => setExpiryType(val)}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  <label
                    htmlFor="never"
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 ${expiryType === "never" ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border/70 bg-background"}`}
                  >
                    <RadioGroupItem value="never" id="never" className="mt-0.5" />
                    <div className="space-y-1">
                      <span className="block text-sm font-medium">
                        Never expire
                      </span>
                      <span className="block text-xs leading-relaxed text-muted-foreground">
                        Lifetime access to all assigned courses
                      </span>
                    </div>
                  </label>

                  <label
                    htmlFor="5years"
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 ${expiryType === "5years" ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border/70 bg-background"}`}
                  >
                    <RadioGroupItem value="5years" id="5years" className="mt-0.5" />
                    <div className="space-y-1">
                      <span className="block text-sm font-medium">
                        5 years access
                      </span>
                      <span className="block text-xs leading-relaxed text-muted-foreground">
                        Access expires in 5 years from today
                      </span>
                    </div>
                  </label>

                  <label
                    htmlFor="custom"
                    className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 ${expiryType === "custom" ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border/70 bg-background"}`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="custom" id="custom" className="mt-0.5" />
                      <div className="space-y-1">
                        <span className="block text-sm font-medium">
                          Set expiry date
                        </span>
                        <span className="block text-xs leading-relaxed text-muted-foreground">
                          Access ends on chosen date
                        </span>
                      </div>
                    </div>
                    <Input
                      type="datetime-local"
                      value={customExpiry}
                      onChange={(e) => setCustomExpiry(e.target.value)}
                      disabled={expiryType !== "custom"}
                      className="mt-2 h-10 w-full shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                </RadioGroup>
              </section>
            </div>

            <DialogFooter className="-mx-0 -mb-0 shrink-0 flex-col gap-4 rounded-none border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 text-left">
                {totalPairCount > 0 ? (
                  allAlreadyEnrolled ? (
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      All selected students already have active access to these
                      courses.
                    </p>
                  ) : alreadyActiveCount > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {newAssignmentCount}
                      </span>{" "}
                      new enrollment
                      {newAssignmentCount === 1 ? "" : "s"} will be assigned
                      {" · "}
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        {alreadyActiveCount} already enrolled
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {totalPairCount}
                      </span>{" "}
                      enrollment
                      {totalPairCount === 1 ? "" : "s"} will be assigned
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select at least one student and one course to continue
                  </p>
                )}
                {allAlreadyEnrolled && (
                  <p className="text-xs text-muted-foreground">
                    Change your selection or revoke existing access before
                    assigning again.
                  </p>
                )}
              </div>
              <div className="flex w-full shrink-0 flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-lg"
                  disabled={
                    createEnrollment.isPending ||
                    selectedUserIds.size === 0 ||
                    selectedCourseIds.size === 0 ||
                    allAlreadyEnrolled ||
                    (expiryType === "custom" && !customExpiry)
                  }
                  onClick={handleEnroll}
                >
                  {createEnrollment.isPending
                    ? "Assigning access..."
                    : allAlreadyEnrolled
                      ? "Already enrolled"
                      : newAssignmentCount > 0
                        ? `Assign ${newAssignmentCount} enrollment${newAssignmentCount === 1 ? "" : "s"}`
                        : `Assign ${selectedCourseIds.size} course${selectedCourseIds.size === 1 ? "" : "s"} to ${selectedUserIds.size} student${selectedUserIds.size === 1 ? "" : "s"}`}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* ── KPI Summary Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total"
          value={stats.total}
          icon={IconUsers}
          accent="bg-primary/10 text-primary"
          onClick={() => {
            setExpiryFilter("all");
            setStatusFilter("all");
          }}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={IconCheck}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          onClick={() => {
            setExpiryFilter("active");
            setStatusFilter("all");
          }}
        />
        <StatCard
          label="Expiring Soon"
          value={stats.expiringSoon}
          icon={IconAlertTriangle}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          onClick={() => {
            setExpiryFilter("expiring-soon");
            setStatusFilter("all");
          }}
        />
        <StatCard
          label="Expired"
          value={stats.expired}
          icon={IconClockOff}
          accent="bg-muted text-muted-foreground"
          onClick={() => {
            setExpiryFilter("expired");
            setStatusFilter("all");
          }}
        />
        <StatCard
          label="Lifetime"
          value={stats.lifetime}
          icon={IconInfinity}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          onClick={() => {
            setExpiryFilter("lifetime");
            setStatusFilter("all");
          }}
        />
      </div>

      {/* ── Search & Filter Bar ────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 sm:max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-xl pl-9"
            placeholder="Search student, email, subject..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select
          value={courseFilter}
          onValueChange={setCourseFilter}
        >
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-48">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {uniqueCourses.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={expiryFilter}
          onValueChange={(value) => setExpiryFilter(value as ExpiryFilter)}
        >
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-44">
            <SelectValue placeholder="Expiry status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All expiry</SelectItem>
            <SelectItem value="active">Active access</SelectItem>
            <SelectItem value="expiring-soon">Expiring soon (&lt;30d)</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="lifetime">Lifetime access</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/60 p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "subject" ? "secondary" : "ghost"}
                  size="sm"
                  className="size-8 rounded-md p-0"
                  onClick={() => setViewMode("subject")}
                >
                  <IconLayoutGrid className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Subject-wise view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="size-8 rounded-md p-0"
                  onClick={() => setViewMode("table")}
                >
                  <IconLayoutList className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Table view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ── Subject-Wise View ──────────────────────────── */}
      {viewMode === "subject" ? (
        enrollmentsQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/30" />
            ))}
          </div>
        ) : courseGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-16 text-center">
            <IconBook className="size-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No enrollments found
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Change the filter or search term, or assign new access.
              </p>
            </div>
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={courseGroups.map((g) => g.courseId)}
            className="space-y-3"
          >
            {courseGroups.map((group) => (
              <AccordionItem
                key={group.courseId}
                value={group.courseId}
                className="overflow-hidden rounded-xl border border-border/60 not-last:border-b"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex flex-1 flex-wrap items-center gap-3 pr-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <IconBook className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold leading-tight">
                        {group.courseName}
                      </h3>
                      {group.courseSlug && (
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {group.courseSlug}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-0.5 text-xs">
                        <IconUsers className="size-3" />
                        {group.enrollments.length} student{group.enrollments.length !== 1 ? "s" : ""}
                      </Badge>
                      {group.activeCount > 0 && (
                        <Badge className="gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                          {group.activeCount} active
                        </Badge>
                      )}
                      {group.expiringSoonCount > 0 && (
                        <Badge className="gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                          <IconAlertTriangle className="size-2.5" />
                          {group.expiringSoonCount} expiring
                        </Badge>
                      )}
                      {group.lifetimeCount > 0 && (
                        <Badge className="gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-700 dark:text-sky-300">
                          {group.lifetimeCount} lifetime
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="overflow-x-auto border-t border-border/40">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border/30 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="w-12 px-4 py-3 text-center">#</th>
                          <th className="min-w-[220px] px-4 py-3">Student</th>
                          <th className="w-36 px-4 py-3">Enrolled</th>
                          <th className="w-48 px-4 py-3">Expiry</th>
                          <th className="w-28 px-4 py-3">Status</th>
                          <th className="w-24 px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {group.enrollments.map((enrollment, idx) => (
                          <StudentTableRow
                            key={enrollment.id}
                            index={idx + 1}
                            enrollment={enrollment}
                            onExtend={setExtendEnrollment}
                            onRevoke={setRevokeEnrollment}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      ) : (
        /* ── Table View ──────────────────────────────── */
        <AdminResourceTable
          columns={columns}
          data={filteredEnrollments}
          emptyTitle="No enrollments found"
          emptyDescription="Change the filter or search term to find the access record you're after."
          isLoading={enrollmentsQuery.isLoading}
        />
      )}

      {/* ── Extend Expiry Modal ────────────────────────── */}
      <ExtendExpiryModal
        enrollment={extendEnrollment}
        open={!!extendEnrollment}
        onOpenChange={(open) => !open && setExtendEnrollment(null)}
      />

      {/* ── Revoke Confirmation ────────────────────────── */}
      <AlertDialog
        open={!!revokeEnrollment}
        onOpenChange={(open) => !open && setRevokeEnrollment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{revokeEnrollment?.user}</span>{" "}
              from{" "}
              <span className="font-medium text-foreground">{revokeEnrollment?.course}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeEnrollmentMutation.isPending}
              onClick={() => {
                if (revokeEnrollment) {
                  revokeEnrollmentMutation.mutate(revokeEnrollment.id);
                }
              }}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {revokeEnrollmentMutation.isPending
                ? "Revoking..."
                : "Revoke access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
