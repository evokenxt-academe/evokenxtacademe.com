"use client";

import { IconBook2, IconSearchOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface CourseEmptyStateProps {
  hasFilters: boolean;
  onReset?: () => void;
}

export function CourseEmptyState({ hasFilters, onReset }: CourseEmptyStateProps) {
  return (
    <div className="py-12 flex justify-center">
      <Empty className="max-w-md border border-dashed rounded-xl bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-muted/50 text-muted-foreground ring-1 ring-border/50">
            {hasFilters ? <IconSearchOff /> : <IconBook2 />}
          </EmptyMedia>
          <EmptyTitle>
            {hasFilters ? "No matches found" : "No courses available"}
          </EmptyTitle>
          <EmptyDescription>
            {hasFilters 
              ? "We couldn't find any courses matching your current filters. Try adjusting your search criteria."
              : "Check back later! We are currently working on adding new professional courses."}
          </EmptyDescription>
        </EmptyHeader>
        {hasFilters && onReset && (
          <EmptyContent>
            <Button variant="outline" onClick={onReset}>
              Clear all filters
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}
