'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Undo2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DebuggerContent() {
  const callbackUrl = useSearchParams().get('callbackUrl') || '/';
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40" />

      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-start gap-3 pb-0">
            <Badge variant="outline" className="w-fit">
              Security Lock
            </Badge>

            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Debugger access is blocked
            </h1>
          </CardHeader>

          <CardContent className="pt-5">
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              This page appears when inspect tools are opened. Close developer
              tools and refresh the site to continue using the app.
            </p>

            <div className="mt-6 flex flex-col gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">
                  1
                </span>
                Close all developer tool panels
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">
                  2
                </span>
                Refresh the page to restore access
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">
                  3
                </span>
                Continue using the app normally
              </div>
            </div>

            <div className="mt-6">
              <Button variant="destructive" className="w-full" asChild>
                <Link
                  href={callbackUrl}
                  className="flex items-center justify-center gap-2"
                >
                  <Undo2 className="size-4" />
                  <span>Go to back</span>
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Need help? Contact support if this appears by mistake.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default function DebuggerPage() {
  return (
    <Suspense>
      <DebuggerContent />
    </Suspense>
  );
}
