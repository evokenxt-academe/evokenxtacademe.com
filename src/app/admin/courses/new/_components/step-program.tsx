"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  fetchPrograms,
  fetchProgramLevels,
  fetchSubjects,
  fetchInstructors,
  type Program,
  type ProgramLevel,
  type Subject,
  type Instructor,
} from "@/lib/supabase/queries/courses-admin";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import type { CourseFormValues } from "@/lib/validators/course";

interface StepProgramProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CourseFormValues, any, any>;
}

export function StepProgram({ form }: StepProgramProps) {
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [levels, setLevels] = React.useState<ProgramLevel[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [instructors, setInstructors] = React.useState<Instructor[]>([]);
  const [selectedProgram, setSelectedProgram] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState("");

  React.useEffect(() => {
    fetchPrograms().then(setPrograms).catch(console.error);
    fetchInstructors().then(setInstructors).catch(console.error);
  }, []);

  // If form has existing subject_id, try to resolve program/level
  React.useEffect(() => {
    // On initial render, load based on existing values if editing
  }, []);

  const handleProgramChange = async (programId: string) => {
    setSelectedProgram(programId);
    setSelectedLevel("");
    setSubjects([]);
    form.setValue("subject_id", "" as unknown as string);
    try {
      const data = await fetchProgramLevels(programId);
      setLevels(data);
    } catch {
      console.error("Failed to load levels");
    }
  };

  const handleLevelChange = async (levelId: string) => {
    setSelectedLevel(levelId);
    form.setValue("subject_id", "" as unknown as string);
    try {
      const data = await fetchSubjects(levelId);
      setSubjects(data);
    } catch {
      console.error("Failed to load subjects");
    }
  };

  const subjectId = form.watch("subject_id");
  const instructorId = form.watch("instructor_id");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Select Program</Label>
        <Select value={selectedProgram || undefined} onValueChange={handleProgramChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a certification program" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.body} — {p.full_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the certification body this course belongs to
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Select Level</Label>
        <Select
          value={selectedLevel || undefined}
          onValueChange={handleLevelChange}
          disabled={!selectedProgram}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a level" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Level within the selected program
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Select Subject / Paper</Label>
        <Select
          value={subjectId || undefined}
          onValueChange={(val) => {
            form.setValue("subject_id", val, { shouldValidate: true, shouldDirty: true });
            const selectedSubject = subjects.find(s => s.id === val);
            if (selectedSubject) {
              form.setValue("title", selectedSubject.name, { shouldValidate: true, shouldDirty: true });
            }
          }}
          disabled={!selectedLevel}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {form.formState.errors.subject_id && (
          <p className="text-xs text-destructive">
            {form.formState.errors.subject_id.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Select Instructor</Label>
        <Select
          value={instructorId || undefined}
          onValueChange={(val) => form.setValue("instructor_id", val, { shouldValidate: true, shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an instructor" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {instructors.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5">
                      <AvatarImage src={i.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {i.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{i.name}</span>
                    <span className="text-xs text-muted-foreground">{i.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {form.formState.errors.instructor_id && (
          <p className="text-xs text-destructive">
            {form.formState.errors.instructor_id.message}
          </p>
        )}
      </div>
    </div>
  );
}
