import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface InstructorCardProps {
  name: string;
  avatar: string | null;
  subjectName: string;
  totalStudents: number;
}

// Teacher Profile Dictionary for dynamic credentials and stats
interface TeacherProfile {
  credentials: string[];
  yearsExperience: string;
  positionsCount: string;
  fallbackStudents: string;
  roleBadge: string;
}

const TEACHER_PROFILES: Record<string, TeacherProfile> = {
  "Amar Biradar": {
    credentials: [
      "18+ years of teaching experience.",
      "20+ global and nationwide positions.",
      "Expertise in bridging complex accounting theories with practical business applications.",
    ],
    yearsExperience: "18+",
    positionsCount: "60+",
    fallbackStudents: "10,000+",
    roleBadge: "Teacher",
  },
};

const DEFAULT_PROFILE: TeacherProfile = {
  credentials: [
    "Certified industry professional.",
    "Extensive teaching and hands-on professional experience.",
    "Expertise in bridging complex theories with practical business applications.",
  ],
  yearsExperience: "5+",
  positionsCount: "10+",
  fallbackStudents: "1,000+",
  roleBadge: "Instructor",
};

export function InstructorCard({
  name,
  avatar,
  subjectName,
  totalStudents,
}: InstructorCardProps) {
  // Safe, case-insensitive profile lookup
  const profileKey = Object.keys(TEACHER_PROFILES).find(
    (k) => k.toLowerCase() === name?.trim().toLowerCase()
  ) || "";
  const profile = TEACHER_PROFILES[profileKey] || DEFAULT_PROFILE;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Meet Your Teacher</h2>

      <Card className="bg-card/50 border-border/40 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <Avatar className="h-20 w-20 shrink-0 ring-2 ring-primary/20">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {name?.charAt(0).toUpperCase() || "T"}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {name}
              </h3>
              <Badge
                variant="secondary"
                className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border-amber-500/20"
              >
                {profile.roleBadge}
              </Badge>
            </div>

            {subjectName && (
              <p className="text-sm text-cyan-400/80">
                Subject Specialist – {subjectName}
              </p>
            )}

            {/* Credentials */}
            <ul className="space-y-1.5 pt-1">
              {profile.credentials.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="text-cyan-400 mt-1.5 shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-sm font-semibold text-foreground pt-1 cursor-pointer hover:underline underline-offset-2">
              See Full Profile
            </p>
          </div>
        </div>

        <Separator className="my-6 bg-border/30" />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }} className="text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{profile.yearsExperience}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Years of Experience
            </p>
          </div>
          <div className="relative space-y-1">
            <div className="absolute left-0 top-1 bottom-1 w-px bg-border/30" />
            <div className="absolute right-0 top-1 bottom-1 w-px bg-border/30" />
            <p className="text-2xl font-bold text-foreground">
              {totalStudents > 0
                ? `${totalStudents.toLocaleString()}+`
                : profile.fallbackStudents}
            </p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              No of Students
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{profile.positionsCount}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Position Count
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

