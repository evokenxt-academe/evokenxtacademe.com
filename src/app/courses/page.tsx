import { createClient } from "@/utils/supabase/server";
import { Header } from "@/components/header";
import {
  IconBook2,
  IconClock,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";

type CatalogCourse = {
  id: string;
  slug: string;
  thumbnail_url: string | null;
  level: string | null;
  name: string;
  description: string | null;
  total_duration_sec: number;
  discount_price: number | null;
  price: number;
  instructor?: {
    name: string | null;
    avatar: string | null;
  } | null;
};

export default async function CoursesCatalogPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
      *,
      instructor:users!instructor_id(name, avatar)
    `,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const courseList = (courses ?? []) as CatalogCourse[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-24 pt-28 md:px-6">
        <section className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit">
            Professional training
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Master your learning journey
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Browse the catalog and move courses into your cart when you are
              ready to enroll.
            </p>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Find a course</CardTitle>
            <CardDescription>
              Search, filter, and compare courses with a simple catalog layout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="What do you want to learn today?"
                  className="pl-9"
                />
              </div>
              <Button variant="outline">Category</Button>
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courseList.length ? (
            courseList.map((course) => (
              <Link href={`/courses/${course.slug}`} key={course.id}>
                <Card className="h-full">
                  <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                    {course.thumbnail_url ? (
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${course.thumbnail_url})`,
                        }}
                        aria-label={course.name}
                        role="img"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <IconBook2 />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">
                        {course.level || "professional"}
                      </Badge>
                      <Badge variant="secondary">Bestseller</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">
                      {course.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description ||
                        "Comprehensive preparation with structured learning paths."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconSparkles />
                      {course.instructor?.name || "Expert Faculty"}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconClock />
                      {Math.floor(course.total_duration_sec / 3600)}h{" "}
                      {Math.floor((course.total_duration_sec % 3600) / 60)}m
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ₹{course.discount_price || course.price}
                      </div>
                      {course.discount_price ? (
                        <div className="text-sm text-muted-foreground line-through">
                          ₹{course.price}
                        </div>
                      ) : null}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))
          ) : (
            <Empty className="rounded-lg border md:col-span-2 xl:col-span-3">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconBook2 />
                </EmptyMedia>
                <EmptyTitle>No courses found</EmptyTitle>
                <EmptyDescription>
                  Try another search or come back when more courses are
                  published.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </section>
      </main>
    </div>
  );
}
