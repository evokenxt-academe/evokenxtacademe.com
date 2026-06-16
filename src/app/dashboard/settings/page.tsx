import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function DashboardSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and learning profile.
        </p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Account</CardTitle>
          <CardDescription>Profile, security, and notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Personal profile</p>
              <p className="text-sm text-muted-foreground">Name, photo, academic details</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/profile">Edit profile</Link>
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Payments & billing</p>
              <p className="text-sm text-muted-foreground">Invoices and instalment schedule</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/payments">View payments</Link>
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Certificates</p>
              <p className="text-sm text-muted-foreground">Download and share earned certificates</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/certificates">My certificates</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
