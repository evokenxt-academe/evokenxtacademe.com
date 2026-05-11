import { LoginCard } from "@/features/auth/components/login";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 px-4 py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
