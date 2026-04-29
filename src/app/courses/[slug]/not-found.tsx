import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { IconBook } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center px-4 py-16">
      <Empty className="w-full rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBook />
          </EmptyMedia>
          <EmptyTitle>Course not found</EmptyTitle>
          <EmptyDescription>
            The course you are looking for is unavailable or unpublished.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/courses">Back to catalog</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
