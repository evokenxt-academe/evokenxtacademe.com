/**
 * Course Form Sheet
 * =================
 * Create/Edit course form in a side sheet
 */

"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createCourse,
  updateCourse,
  type CourseRow,
} from "@/lib/supabase/queries/courses";
import { toast } from "sonner";

const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  subject_id: z.string().min(1, "Please select a subject"),
  instructor_id: z.string().min(1, "Please select an instructor"),
  description: z.string().optional(),
  thumbnail_url: z.string().url().optional().or(z.literal("")),
  language: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: CourseRow | null;
  onSuccess?: () => void;
}

export function CourseFormSheet({
  open,
  onOpenChange,
  course,
  onSuccess,
}: CourseFormSheetProps) {
  const supabase = createClient();
  const isEditMode = !!course;

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: course?.title || "",
      slug: course?.slug || "",
      subject_id: course?.subject_id || "",
      instructor_id: course?.instructor_id || "",
      description: "",
      language: "en",
      status: (course?.status as any) || "draft",
    },
  });

  // Reset form when dialog opens/closes or course changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: course?.title || "",
        slug: course?.slug || "",
        subject_id: course?.subject_id || "",
        instructor_id: course?.instructor_id || "",
        description: "",
        language: "en",
        status: (course?.status as any) || "draft",
      });
    }
  }, [open, course, form]);

  const mutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      if (isEditMode) {
        const success = await updateCourse(supabase, course!.id, {
          title: values.title,
          status: values.status,
          description: values.description,
          thumbnail_url: values.thumbnail_url,
          language: values.language,
        });
        if (!success) throw new Error("Failed to update course");
        return { id: course!.id };
      } else {
        const result = await createCourse(supabase, {
          title: values.title,
          slug: values.slug,
          subject_id: values.subject_id,
          instructor_id: values.instructor_id,
          status: values.status,
          description: values.description,
          thumbnail_url: values.thumbnail_url,
          language: values.language,
        });
        if (!result) throw new Error("Failed to create course");
        return result;
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? "Course updated" : "Course created");
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? "Edit Course" : "Create Course"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update course details" : "Add a new course"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-6 mt-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ACCA F1 - Accountant in Business"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="acca-f1-accountant-business"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL-friendly course identifier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="subj_acca_f1">ACCA F1</SelectItem>
                      <SelectItem value="subj_acca_f2">ACCA F2</SelectItem>
                      <SelectItem value="subj_cfa_l1">CFA Level 1</SelectItem>
                      <SelectItem value="subj_cma">CMA Level 1</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instructor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="instr_1">John Smith</SelectItem>
                      <SelectItem value="instr_2">Jane Doe</SelectItem>
                      <SelectItem value="instr_3">Mike Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Course description..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="gap-2"
              >
                {mutation.isPending && (
                  <Loader className="size-4 animate-spin" />
                )}
                {isEditMode ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
