/**
 * Student Detail Sheet
 * ====================
 * View student profile with tabs for enrollments, certificates, watch hours
 */

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import {
  getStudentEnrollments,
  getStudentCertificates,
  type StudentRow,
} from "@/lib/supabase/queries/students";

interface StudentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRow | null;
}

export function StudentDetailSheet({
  open,
  onOpenChange,
  student,
}: StudentDetailSheetProps) {
  const supabase = createClient();

  // ──────────────────────────────────────────
  // QUERIES
  // ──────────────────────────────────────────

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["student-enrollments", student?.id],
    queryFn: () =>
      student
        ? getStudentEnrollments(supabase, student.id)
        : Promise.resolve([]),
    enabled: !!student && open,
  });

  const { data: certificates = [], isLoading: certificatesLoading } = useQuery({
    queryKey: ["student-certificates", student?.id],
    queryFn: () =>
      student
        ? getStudentCertificates(supabase, student.id)
        : Promise.resolve([]),
    enabled: !!student && open,
  });

  if (!student) return null;

  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl">
        <SheetHeader>
          <SheetTitle>Student Profile</SheetTitle>
          <SheetDescription>
            View student details and academic progress
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              <AvatarImage src={student.avatar || ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="rounded-sm">
                  {student.target_exam_body}
                </Badge>
                <Badge
                  variant={student.is_active ? "default" : "secondary"}
                  className="rounded-sm"
                >
                  {student.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="text-sm font-medium">{student.country}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">{student.joined_at}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Enrolled Courses</p>
              <p className="text-sm font-medium">{student.enrolled_courses}</p>
            </div>
            {student.graduated_year && (
              <div>
                <p className="text-xs text-muted-foreground">Graduation Year</p>
                <p className="text-sm font-medium">{student.graduated_year}</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="enrollments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enrollments">
                Enrollments ({enrollments.length})
              </TabsTrigger>
              <TabsTrigger value="certificates">
                Certificates ({certificates.length})
              </TabsTrigger>
            </TabsList>

            {/* Enrollments Tab */}
            <TabsContent value="enrollments" className="space-y-4">
              {enrollmentsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : enrollments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Progress</TableHead>
                      <TableHead className="text-xs">Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="text-sm">
                          {enrollment.course_title}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge
                            variant={
                              enrollment.status === "active"
                                ? "default"
                                : enrollment.status === "completed"
                                  ? "default"
                                  : "secondary"
                            }
                            className="rounded-sm text-xs"
                          >
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {enrollment.progress} lessons
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {enrollment.enrolled_at}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No enrollments yet
                </p>
              )}
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-4">
              {certificatesLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : certificates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Cert Number</TableHead>
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs">Issued</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="text-sm font-mono">
                          {cert.cert_number}
                        </TableCell>
                        <TableCell className="text-sm">
                          {cert.course_title}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {cert.issued_at}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No certificates yet
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
