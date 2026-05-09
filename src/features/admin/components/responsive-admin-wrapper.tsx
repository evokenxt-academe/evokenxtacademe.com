/**
 * Responsive Admin Wrapper Component
 * Provides mobile-friendly layout switching for admin pages
 */

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveAdminWrapperProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  children: React.ReactNode;
  desktopView: React.ReactNode;
  mobileView: React.ReactNode;
}

export function ResponsiveAdminWrapper({
  title,
  description,
  actions,
  filters,
  loading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyAction,
  desktopView,
  mobileView,
}: ResponsiveAdminWrapperProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (loading) {
    return <AdminSkeleton />;
  }

  if (isEmpty) {
    return (
      <EmptyAdminState
        title={emptyTitle || "No items found"}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      {/* Filters */}
      {filters && <div className="space-y-3">{filters}</div>}

      {/* Content - Desktop or Mobile */}
      {isMobile ? mobileView : desktopView}
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────

function AdminSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────

interface EmptyAdminStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyAdminState({
  title,
  description,
  action,
  icon,
}: EmptyAdminStateProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-8 sm:p-12 text-center">
        {icon && <div className="mb-4 flex justify-center">{icon}</div>}
        <h3 className="mb-2 text-lg sm:text-xl font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed mx-auto">
            {description}
          </p>
        )}
        {action && <div className="flex justify-center gap-2">{action}</div>}
      </CardContent>
    </Card>
  );
}

// ─── Mobile Card View Helper ────────────────────────────────

export function MobileCardView({
  items,
  renderCard,
}: {
  items: any[];
  renderCard: (item: any) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id || index}>{renderCard(item)}</div>
      ))}
    </div>
  );
}

// ─── Admin Filter Bar (Mobile + Desktop) ───────────────────

interface AdminFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  additionalFilters?: React.ReactNode;
}

export function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  additionalFilters,
}: AdminFilterBarProps) {
  return (
    <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
      <div className="flex-1 relative">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      {additionalFilters && (
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          {additionalFilters}
        </div>
      )}
    </div>
  );
}

import { Input } from "@/components/ui/input";
