"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconX, IconFilterOff } from "@tabler/icons-react";
import type {
  Program,
  ProgramLevel,
  Subject,
  Instructor,
  CourseFilters,
} from "@/lib/supabase/queries/courses-admin";
import {
  fetchPrograms,
  fetchProgramLevels,
  fetchSubjects,
  fetchInstructors,
} from "@/lib/supabase/queries/courses-admin";

interface CourseFiltersBarProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
}

export function CourseFiltersBar({
  filters,
  onFiltersChange,
}: CourseFiltersBarProps) {
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [levels, setLevels] = React.useState<ProgramLevel[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [instructors, setInstructors] = React.useState<Instructor[]>([]);
  const [searchValue, setSearchValue] = React.useState(filters.search || "");
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  React.useEffect(() => {
    fetchPrograms().then(setPrograms).catch(console.error);
    fetchInstructors().then(setInstructors).catch(console.error);
  }, []);

  React.useEffect(() => {
    if (filters.programId) {
      fetchProgramLevels(filters.programId).then(setLevels).catch(console.error);
    } else {
      setLevels([]);
    }
  }, [filters.programId]);

  React.useEffect(() => {
    if (filters.levelId) {
      fetchSubjects(filters.levelId).then(setSubjects).catch(console.error);
    } else {
      setSubjects([]);
    }
  }, [filters.levelId]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value.trim() || undefined });
    }, 400);
  };

  const handleProgramChange = (value: string) => {
    onFiltersChange({
      ...filters,
      programId: value === "all" ? undefined : value,
      levelId: undefined,
      subjectId: undefined,
    });
  };

  const handleLevelChange = (value: string) => {
    onFiltersChange({
      ...filters,
      levelId: value === "all" ? undefined : value,
      subjectId: undefined,
    });
  };

  const handleSubjectChange = (value: string) => {
    onFiltersChange({
      ...filters,
      subjectId: value === "all" ? undefined : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : value,
    });
  };

  const handleInstructorChange = (value: string) => {
    onFiltersChange({
      ...filters,
      instructorId: value === "all" ? undefined : value,
    });
  };

  const resetFilters = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  const activeFilters: { key: string; label: string }[] = [];
  if (filters.search) {
    activeFilters.push({ key: "search", label: `Search: "${filters.search}"` });
  }
  if (filters.programId) {
    const p = programs.find((x) => x.id === filters.programId);
    if (p) activeFilters.push({ key: "programId", label: `Program: ${p.body}` });
  }
  if (filters.levelId) {
    const l = levels.find((x) => x.id === filters.levelId);
    if (l) activeFilters.push({ key: "levelId", label: `Level: ${l.label}` });
  }
  if (filters.subjectId) {
    const s = subjects.find((x) => x.id === filters.subjectId);
    if (s) activeFilters.push({ key: "subjectId", label: `Subject: ${s.name}` });
  }
  if (filters.status) {
    activeFilters.push({ key: "status", label: `Status: ${filters.status}` });
  }
  if (filters.instructorId) {
    const i = instructors.find((x) => x.id === filters.instructorId);
    if (i) activeFilters.push({ key: "instructorId", label: `Instructor: ${i.name}` });
  }

  const removeFilter = (key: string) => {
    const next = { ...filters };
    if (key === "search") {
      next.search = undefined;
      setSearchValue("");
    }
    if (key === "programId") {
      next.programId = undefined;
      next.levelId = undefined;
      next.subjectId = undefined;
    }
    if (key === "levelId") {
      next.levelId = undefined;
      next.subjectId = undefined;
    }
    if (key === "subjectId") next.subjectId = undefined;
    if (key === "status") next.status = undefined;
    if (key === "instructorId") next.instructorId = undefined;
    onFiltersChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Search courses..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full sm:w-[240px] md:w-[280px]"
        />

        <Select value={filters.programId || "all"} onValueChange={handleProgramChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.body}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={filters.levelId || "all"}
          onValueChange={handleLevelChange}
          disabled={!filters.programId}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={filters.subjectId || "all"}
          onValueChange={handleSubjectChange}
          disabled={!filters.levelId}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={filters.instructorId || "all"}
          onValueChange={handleInstructorChange}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Instructor" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Instructors</SelectItem>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="w-full sm:w-auto"
          >
            <IconFilterOff data-icon="inline-start" />
            Reset filters
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Badge key={f.key} variant="secondary" className="gap-1 pr-1">
              {f.label}
              <button
                type="button"
                onClick={() => removeFilter(f.key)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
