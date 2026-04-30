"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function AdminThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 rounded-xl"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-10 rounded-xl"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <IconSun /> : <IconMoon />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
