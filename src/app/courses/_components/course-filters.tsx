"use client";

import { IconSearch, IconFilter, IconArrowsSort } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CourseFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  level: string;
  onLevelChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
  totalResults: number;
}

export function CourseFilters({
  search,
  onSearchChange,
  level,
  onLevelChange,
  sort,
  onSortChange,
  totalResults,
}: CourseFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Results count (hidden on very small screens) */}
        <span className="hidden sm:inline-flex text-sm text-muted-foreground">
          {totalResults} {totalResults === 1 ? "course" : "courses"}
        </span>

        {/* Level Filter */}
        <Select value={level} onValueChange={onLevelChange}>
          <SelectTrigger className="w-[140px] bg-background">
            <IconFilter className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="knowledge">Knowledge</SelectItem>
            <SelectItem value="skills">Skills</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px] bg-background">
            <IconArrowsSort className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
