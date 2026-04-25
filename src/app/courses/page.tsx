import { headers } from "next/headers";
import { Header } from "@/components/header";
import { IconBook2, IconSearch, IconFilter, IconUser } from "@tabler/icons-react";
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

import { createClient } from "@/utils/supabase/server";

type CatalogCourse = {
  id: string;
  slug: string;
  thumbnail_url: string | null;
  level: string | null;
  name: string;
  description: string | null;
  discount_price: number | null;
  price: number;
  instructor?: {
    name: string | null;
    avatar: string | null;
  } | null;
};

export default async function CoursesCatalogPage() {
  const supabase = await createClient();

  const { data: rawCourses, error } = await supabase
    .from("courses")
    .select(
      "id, slug, thumbnail_url, level, name, description, discount_price, price, instructor:users!instructor_id(name, avatar)",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses:", error.message);
  }

  // Typecast to handle the nested instructor join safely
  const courseList = (rawCourses || []) as unknown as CatalogCourse[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-24 pt-32 md:px-6 lg:pt-40">
        <section className="flex flex-col gap-4 text-center md:text-left">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Course Catalog
            </h1>
            <p className="text-muted-foreground">
              Browse professional courses designed to accelerate your career.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <IconFilter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courseList.length ? (
            courseList.map((course) => (
              <Link href={`/courses/${course.slug}`} key={course.id} className="outline-none">
                <Card className="flex h-full flex-col overflow-hidden transition-colors hover:bg-muted/50">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted border-b">
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
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <IconBook2 className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute left-3 top-3">
                      {course.level || "Professional"}
                    </Badge>
                  </div>
                  
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="line-clamp-2 text-lg">
                      {course.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {course.description || "Comprehensive preparation with structured learning paths."}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-5 py-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconUser className="h-4 w-4" />
                      {course.instructor?.name || "Expert Faculty"}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-5 pt-4 mt-auto border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {course.discount_price ? (
                        <>
                          <span className="font-semibold">
                            ₹{course.discount_price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{course.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold">
                          ₹{course.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Button variant="secondary" size="sm">
                      View details
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12">
              <Empty className="rounded-lg border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconBook2 />
                  </EmptyMedia>
                  <EmptyTitle>No courses found</EmptyTitle>
                  <EmptyDescription>
                    Try adjusting your search filters or check back later.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Go to dashboard</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
