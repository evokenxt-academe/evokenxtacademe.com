import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/features/student/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, avatar, phone, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(`[profile] fetch: ${error.message}`);
  }

  const record = data as {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    phone: string | null;
    role: string | null;
    created_at: string | null;
  } | null;

  const profile = record
    ? {
        id: record.id,
        name: record.name,
        email: record.email,
        avatar: record.avatar,
        phone: record.phone,
        role: record.role,
        createdAt: record.created_at,
      }
    : {
        id: user.id,
        name: user.user_metadata?.full_name ?? null,
        email: user.email ?? "",
        avatar: user.user_metadata?.avatar_url ?? null,
        phone: null,
        role: "student",
        createdAt: null,
      };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information.
        </p>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
