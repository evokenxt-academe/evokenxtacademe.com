import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/icons/icon-192x192.png";

type AppSidebarLogoProps = {
  size?: number;
  className?: string;
};

export function AppSidebarLogo({ size = 32, className }: AppSidebarLogoProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background ring-1 ring-border/60",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={LOGO_SRC}
        alt="Evoke EduGlobal"
        width={size}
        height={size}
        className="size-full object-contain p-0.5"
        priority
      />
    </div>
  );
}
