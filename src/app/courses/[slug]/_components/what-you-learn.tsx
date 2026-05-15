"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface WhatYouLearnProps {
  items: string[];
}

export function WhatYouLearn({ items }: WhatYouLearnProps) {
  if (!items || items.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">What You&apos;ll Learn</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="h-[18px] w-[18px] text-green-600 mt-0.5 shrink-0" />
              <span className="text-sm leading-relaxed text-foreground/90">
                {item}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
