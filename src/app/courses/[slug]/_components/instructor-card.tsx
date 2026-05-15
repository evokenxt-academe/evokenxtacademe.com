"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface InstructorSectionProps {
  name: string;
  avatar: string | null;
}

export function InstructorSection({ name, avatar }: InstructorSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Instructor</h2>

      <div className="flex items-start gap-5">
        <Avatar className="h-16 w-16 border">
          {avatar && <AvatarImage src={avatar} alt={name} />}
          <AvatarFallback className="text-xl font-bold bg-muted">
            {name?.charAt(0).toUpperCase() || "I"}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 pt-0.5">
          <h3 className="text-lg font-semibold leading-snug">{name}</h3>
          <p className="text-sm text-muted-foreground">Instructor</p>
          <p className="text-sm text-muted-foreground leading-relaxed pt-1">
            Expert instructor at Evoke EduGlobal
          </p>
        </div>
      </div>
    </div>
  );
}
