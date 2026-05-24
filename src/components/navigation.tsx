"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, X, BookOpen, Sun, Moon } from "lucide-react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Courses", href: "/courses" },
  { name: "Contact", href: "/contact" },
];

function ThemeToggle({
  scrolled,
  isLanding,
}: {
  scrolled: boolean;
  isLanding: boolean;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        aria-label="Toggle theme"
      >
        <span className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "size-9 shrink-0 transition-colors duration-200",
        scrolled
          ? "text-muted-foreground hover:bg-accent hover:text-foreground"
          : isLanding
            ? "text-white/70 hover:bg-white/10 hover:text-white"
            : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white",
      )}
    >
      {isDark ? (
        <Sun className="size-4 transition-transform duration-300" />
      ) : (
        <Moon className="size-4 transition-transform duration-300" />
      )}
    </Button>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed z-50 w-full transition-all duration-500 ease-in-out",
          isScrolled ? "top-3 px-4" : "top-0 px-0",
        )}
      >
        <nav
          className={cn(
            "mx-auto transition-all duration-500 ease-in-out",
            isScrolled
              ? "max-w-6xl rounded-2xl bg-background/85 shadow-md backdrop-blur-md"
              : "max-w-6xl bg-transparent",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between px-4 md:px-6 lg:px-8 transition-all duration-500 ease-in-out",
              isScrolled ? "h-14" : "h-16 md:h-20",
            )}
          >
            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
              aria-label="Evokenxt home"
            >
              <div className="relative size-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/evoke-logo.svg"
                  alt="Evoke EduGlobal Logo"
                  className="rounded-lg object-contain"
                />
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    isScrolled
                      ? "text-muted-foreground hover:text-foreground"
                      : isLanding
                        ? "text-white/80 hover:text-white"
                        : "text-foreground/80 hover:text-foreground dark:text-white/80 dark:hover:text-white",
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* ── Desktop CTA + Theme Toggle ── */}
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle scrolled={isScrolled} isLanding={isLanding} />

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "transition-all duration-200",
                  isScrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : isLanding
                      ? "text-white/80 hover:bg-white/10 hover:text-white"
                      : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white",
                )}
                asChild
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>

              <Button
                size="sm"
                className="rounded-lg transition-all duration-200"
                asChild
              >
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>

            {/* ── Mobile Controls ── */}
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle
                scrolled={isScrolled || isMobileMenuOpen}
                isLanding={isLanding}
              />

              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                className={cn(
                  "rounded-md p-2 transition-colors duration-200",
                  isScrolled || isMobileMenuOpen
                    ? "text-foreground hover:bg-accent"
                    : isLanding
                      ? "text-white hover:bg-white/10"
                      : "text-foreground hover:bg-foreground/5 dark:text-white dark:hover:bg-white/10",
                )}
              >
                {isMobileMenuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      <div
        aria-hidden={!isMobileMenuOpen}
        className={cn(
          "fixed inset-0 z-30 flex flex-col bg-background transition-all duration-300 ease-in-out md:hidden",
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div
          className={cn(
            "flex flex-1 flex-col px-6 pb-8 pt-24 transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? "translate-y-0" : "-translate-y-4",
          )}
        >
          {/* Nav Links */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  transitionDelay: isMobileMenuOpen ? `${i * 40}ms` : "0ms",
                }}
                className={cn(
                  "rounded-lg px-3 py-3 text-lg font-medium text-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  isMobileMenuOpen
                    ? "translate-x-0 opacity-100"
                    : "translate-x-4 opacity-0",
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <Separator className="my-6" />

          {/* CTA Buttons */}
          <div className="mt-60 flex flex-col gap-3">
            <Button
              variant="outline"
              className="h-12 w-full text-base"
              onClick={() => setIsMobileMenuOpen(false)}
              asChild
            >
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button
              className="h-12 w-full text-base"
              onClick={() => setIsMobileMenuOpen(false)}
              asChild
            >
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
