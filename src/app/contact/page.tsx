"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Headphones,
  Send,
  GraduationCap,
  BookOpen,
  Users,
  Zap,
} from "lucide-react";
import {
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandX,
} from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Message sent successfully!", {
      description: "Our team will get back to you within 24 hours.",
    });
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Self-contained dark section, works in both themes
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-zinc-950">
        {/* Background Photo */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1800&auto=format&fit=crop"
            alt="Modern classroom with students learning"
            className="size-full object-cover opacity-30 select-none"
          />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-28 md:pt-36 pb-14 md:pb-20">
          <div className="max-w-xl">
            <Badge
              variant="outline"
              className="mb-5 border-white/15 bg-white/5 text-white/80 backdrop-blur-sm text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full"
            >
              <Headphones className="size-3 mr-1.5 text-primary" />
              Support Center
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-md">
              Have questions about ACCA courses, enrollment, or platform access? Our academic advisors typically respond within 24 hours.
            </p>
          </div>
        </div>

        {/* Bottom fade to match any theme */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          MAIN — Two-column layout with proper card boundaries
      ═══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">

          {/* ── LEFT: Info Cards ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Contact Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Contact Details</CardTitle>
                <CardDescription className="text-xs">
                  Reach out through any of these channels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Mail, label: "Email", value: "support@evokeeduglobal.com", href: "mailto:support@evokeeduglobal.com" },
                  { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210" },
                  { icon: MapPin, label: "Location", value: "Mumbai, Maharashtra, India" },
                  { icon: Clock, label: "Hours", value: "Mon – Fri, 9 am – 6 pm IST" },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                      {href ? (
                        <a href={href} className="text-[13px] font-medium hover:text-primary transition-colors truncate block">{value}</a>
                      ) : (
                        <p className="text-[13px] font-medium truncate">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Quick Help</CardTitle>
                <CardDescription className="text-xs">
                  Common topics students ask about.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: GraduationCap, label: "Enrollment" },
                  { icon: BookOpen, label: "Courses" },
                  { icon: Users, label: "Live Classes" },
                  { icon: Zap, label: "Mock Tests" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-primary/[0.03] transition-all cursor-pointer group"
                  >
                    <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-semibold">{label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Social */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Connect With Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {[
                    { icon: IconBrandInstagram, href: "#", label: "Instagram" },
                    { icon: IconBrandLinkedin, href: "#", label: "LinkedIn" },
                    { icon: IconBrandX, href: "#", label: "Twitter" },
                    { icon: IconBrandYoutube, href: "#", label: "YouTube" },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="size-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <Icon className="size-[18px]" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Contact Form ── */}
          <div className="lg:col-span-3">
            <Card className="relative overflow-hidden">
              {/* Decorative accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Send a Message</CardTitle>
                <CardDescription className="text-xs">
                  Fill out the details below and our academic team will respond within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Name row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-first-name" className="text-xs font-semibold">First Name</Label>
                      <Input
                        id="contact-first-name"
                        required
                        placeholder="Your first name"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-last-name" className="text-xs font-semibold">Last Name</Label>
                      <Input
                        id="contact-last-name"
                        required
                        placeholder="Your last name"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Email + Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email" className="text-xs font-semibold">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-phone" className="text-xs font-semibold">Phone</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="+91 00000 00000"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Topic</Label>
                    <Select name="subject">
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Course Support</SelectItem>
                        <SelectItem value="enrollment">Enrollment Help</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="liveclass">Live Class Support</SelectItem>
                        <SelectItem value="general">General Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-message" className="text-xs font-semibold">Message</Label>
                    <Textarea
                      id="contact-message"
                      required
                      placeholder="Tell us how we can help you..."
                      className="min-h-[120px] resize-none text-sm"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full h-11 font-bold text-sm"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    {!isSubmitting && <Send className="size-3.5 ml-2" />}
                  </Button>

                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                    By submitting, you agree to be contacted regarding this inquiry.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          MAP — Minimal, clean
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold tracking-tight mb-0.5">Our Location</h2>
              <p className="text-xs text-muted-foreground">Mumbai, Maharashtra, India</p>
            </div>
            <Button variant="outline" size="sm" className="w-fit rounded-full text-xs" asChild>
              <a href="https://maps.google.com/?q=Mumbai,Maharashtra,India" target="_blank" rel="noopener noreferrer">
                Open in Maps <ArrowRight className="size-3 ml-1.5" />
              </a>
            </Button>
          </div>
          <div className="rounded-xl overflow-hidden border border-border h-[280px] md:h-[360px]">
            <iframe
              title="Evoke EduGlobal Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.11609823277!2d72.74109995709657!3d19.08219783948915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra%2C%20India!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
