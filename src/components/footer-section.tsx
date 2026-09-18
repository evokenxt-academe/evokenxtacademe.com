"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Mail, Phone } from "lucide-react";

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61579211965653",
    icon: (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/evokenxt_academe/",
    icon: (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@evokenxtacademe",
    icon: (
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
];

const footerLinks = {
  company: [
    { name: "About Us", href: "/about" },
    { name: "Tutors", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Success Stories", href: "#" },
    { name: "Support", href: "#" },
  ],
  certifications: [
    { name: "Skill Level", href: "#" },
    { name: "Professional Level", href: "#" },
    { name: "Foundation Modules", href: "#" },
    { name: "Basic Concepts", href: "#" },
  ],
  resources: [
    { name: "Courses", href: "/courses" },
    { name: "Blog", href: "#" },
    { name: "Affiliations", href: "#" },
    { name: "Subscriptions", href: "#" },
  ],
};

export function FooterSection() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:px-6 lg:px-8 lg:pt-20">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="flex flex-col gap-5 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative size-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Evokenxt Logo" className="size-full object-contain" />
              </div>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Empowering global leaders through world-class ACCA and
              professional certifications. Join 10,000+ students building
              high-impact careers.
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <Mail className="size-4" />
                <span>support@evokenxtacademe.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4" />
                <span>+91 9653365799</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-200 hover:border-foreground/20 hover:text-foreground"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Company
              </h4>
              <ul className="flex flex-col gap-2.5">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Certifications
              </h4>
              <ul className="flex flex-col gap-2.5">
                {footerLinks.certifications.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                Resources
              </h4>
              <ul className="flex flex-col gap-2.5">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Evokenxt. All rights
            reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
