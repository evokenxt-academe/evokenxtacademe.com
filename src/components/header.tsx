"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { UserDropdown } from "@/components/user-dropdown";
import { useUserSession } from "@/features/auth/store/use-user-session";

const navLinks = [
  { name: "Courses", href: "#courses" },
  { name: "ACCA Levels", href: "#acca-levels" },
  { name: "About", href: "#about" },
  { name: "Resources", href: "#resources" },
  { name: "Contact", href: "#contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { user, isLoading } = useUserSession();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 100; // Max scroll distance for full effect
      
      setIsScrolled(scrollY > 20);
      setScrollProgress(Math.min(scrollY / maxScroll, 1));
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate dynamic values based on scroll progress
  const headerPadding = 16 - scrollProgress * 8; // 16px -> 8px
  const navHeight = 80 - scrollProgress * 16; // 80px -> 64px
  const logoScale = 1 - scrollProgress * 0.15; // 1 -> 0.85
  const borderRadius = scrollProgress * 20; // 0 -> 20px
  const maxWidth = 1400 - scrollProgress * 200; // 1400px -> 1200px

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-border/30 z-[60]">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out"
        style={{ 
          paddingTop: `${headerPadding}px`,
          paddingLeft: `${headerPadding}px`,
          paddingRight: `${headerPadding}px`,
        }}
      >
        <nav
          className="mx-auto transition-all duration-500 ease-out border border-transparent backdrop-blur-xl"
          style={{
            maxWidth: `${maxWidth}px`,
            borderRadius: `${borderRadius}px`,
            backgroundColor: isScrolled 
              ? 'hsl(var(--background) / 0.85)' 
              : 'hsl(var(--background))',
            borderColor: isScrolled 
              ? 'hsl(var(--border))' 
              : 'transparent',
            borderBottomColor: !isScrolled 
              ? 'hsl(var(--border))' 
              : 'hsl(var(--border))',
            boxShadow: isScrolled 
              ? '0 4px 24px -8px hsl(var(--foreground) / 0.08)' 
              : 'none',
          }}
        >
          <div
            className="flex items-center justify-between px-6 lg:px-8 transition-all duration-500"
            style={{ height: `${navHeight}px` }}
          >
            {/* Logo */}
            <a 
              href="/" 
              className="flex items-center gap-2.5 group relative"
              style={{ 
                transform: `scale(${logoScale})`,
                transformOrigin: 'left center',
              }}
            >
              <div className="relative">
                <span className="font-display font-bold tracking-tighter text-foreground text-2xl">
                  EVOKE
                </span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </div>
              <span className="font-mono text-[11px] font-medium text-muted-foreground mt-1 tracking-wide">
                EDU
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground group rounded-lg hover:bg-accent/50"
                >
                  {link.name}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all duration-300 group-hover:w-8 bg-primary rounded-full" />
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-9 rounded-full bg-accent/50 animate-pulse" />
                  <div className="w-24 h-9 rounded-full bg-accent/50 animate-pulse" />
                </div>
              ) : user ? (
                <UserDropdown />
              ) : (
                <>
                  <a 
                    href="/login" 
                    className="px-4 py-2 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50"
                  >
                    Login
                  </a>
                  <Button
                    size="sm"
                    className="rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300 px-6 h-9"
                  >
                    Enroll Now
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-all duration-300 text-foreground hover:bg-accent/50 active:scale-95"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background/98 backdrop-blur-2xl z-[60] transition-all duration-500 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-6 p-3 rounded-full transition-all duration-300 text-foreground hover:bg-accent active:scale-95"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col h-full px-8 pt-24 pb-8">
          {/* Logo in Mobile Menu */}
          <div className="flex items-center gap-2.5 mb-12">
            <span className="font-display font-bold tracking-tighter text-foreground text-3xl">
              EVOKE
            </span>
            <span className="font-mono text-xs font-medium text-muted-foreground mt-1.5 tracking-wide">
              EDU
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col gap-2">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-4xl font-display font-bold tracking-tight text-foreground hover:text-primary transition-all duration-500 py-3 border-b border-border/50 hover:border-primary/30 ${
                  isMobileMenuOpen
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                }`}
                style={{ 
                  transitionDelay: isMobileMenuOpen ? `${i * 60}ms` : "0ms" 
                }}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Bottom CTAs */}
          <div
            className={`flex flex-col gap-3 pt-8 border-t border-border transition-all duration-500 ${
              isMobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? "350ms" : "0ms" }}
          >
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <div className="w-full h-14 rounded-full bg-accent/50 animate-pulse" />
                <div className="w-full h-14 rounded-full bg-accent/50 animate-pulse" />
              </div>
            ) : user ? (
              <UserDropdown />
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full rounded-full h-14 text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Button>
                <Button
                  className="w-full rounded-full h-14 text-base font-medium shadow-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Enroll Now
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[59]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}