import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  IconCertificate,
  IconDownload,
  IconAward,
  IconCalendar,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CertificateRow {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string | null;
  certificate_url: string | null;
  courses: {
    name: string;
    slug: string;
    level: string | null;
    thumbnail_url: string | null;
  } | null;
}

export default async function CertificatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let certificates: CertificateRow[] = [];
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select(
        "id, user_id, course_id, issued_at, certificate_url, courses(name, slug, level, thumbnail_url)",
      )
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      certificates = data as unknown as CertificateRow[];
    }
  } catch {
    // certificates table may not exist yet
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Certificates</h1>
          <p className="text-sm text-muted-foreground">
            Your earned credentials. Complete courses to unlock certificates.
          </p>
        </div>
        <Card className="w-fit">
          <CardContent className="flex items-center gap-3 p-4">
            <IconAward className="size-5 text-amber-500" />
            <div>
              <div className="text-2xl font-semibold">{certificates.length}</div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {certificates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Certificates</CardTitle>
            <CardDescription>Download or share your credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium">
                      {cert.courses?.name ?? "Course"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {cert.courses?.level ?? "professional"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cert.issued_at
                        ? new Date(cert.issued_at).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {cert.certificate_url ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={cert.certificate_url} target="_blank" rel="noreferrer">
                            <IconDownload className="mr-1 size-4" />
                            Download
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-lg border-dashed">
          <CardContent className="space-y-4 py-12 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
              <IconCertificate className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-lg font-semibold">No certificates yet</h4>
              <p className="text-sm text-muted-foreground">
                Complete all lectures in a course to earn your certificate.
              </p>
            </div>
            <Button asChild>
              <Link href="/my-courses">Continue learning</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
