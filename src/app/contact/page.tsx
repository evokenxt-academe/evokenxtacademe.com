"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { 
  IconBrandX, 
  IconBrandLinkedin, 
  IconBrandYoutube, 
  IconBrandInstagram 
} from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours.",
    });
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-32">
        {/* Page Header */}
        <div className="max-w-2xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Contact</span>
          </nav>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Have a question about your course, billing, or a partnership? We typically respond within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out fill-mode-both">
            <div className="space-y-4">
              <ContactCard
                icon={<Mail className="w-5 h-5 text-primary" />}
                label="Email Support"
                value="support@evokenxt.com"
              />
              <ContactCard
                icon={<Phone className="w-5 h-5 text-primary" />}
                label="Phone"
                value="+91 98765 43210"
              />
              <ContactCard
                icon={<MapPin className="w-5 h-5 text-primary" />}
                label="Location"
                value="Mumbai, Maharashtra, India"
              />
              <ContactCard
                icon={<Clock className="w-5 h-5 text-primary" />}
                label="Response Time"
                value="Monday–Friday, 9am–6pm IST"
              />
            </div>

            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-6">
                For partnership inquiries:{" "}
                <a
                  href="mailto:partnerships@evokenxt.com"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  partnerships@evokenxt.com
                </a>
              </p>
              <div className="flex items-center space-x-4">
                <SocialIcon href="#" icon={<IconBrandX className="w-4 h-4" />} label="Twitter" />
                <SocialIcon href="#" icon={<IconBrandLinkedin className="w-4 h-4" />} label="LinkedIn" />
                <SocialIcon href="#" icon={<IconBrandYoutube className="w-4 h-4" />} label="YouTube" />
                <SocialIcon href="#" icon={<IconBrandInstagram className="w-4 h-4" />} label="Instagram" />
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-7 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 ease-out fill-mode-both">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative bg-card text-card-foreground border border-border backdrop-blur-md rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      required
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select required name="subject">
                      <SelectTrigger>
                        <SelectValue placeholder="How can we help you?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Course Support</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="partnership">Partnership / B2B</SelectItem>
                        <SelectItem value="general">General Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      required
                      placeholder="Please describe your issue or inquiry in detail..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group"
                    size="lg"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    {!isSubmitting && (
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    We respect your privacy. Your data is never shared with third parties.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - FAQ */}
        <div className="mt-32 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 ease-out fill-mode-both">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Quick answers to our most common inquiries.</p>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border bg-card px-6 rounded-xl">
              <AccordionTrigger className="hover:text-primary hover:no-underline text-left">
                How long does support take to respond?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                We aim to respond to all inquiries within 24 hours during regular business days. For urgent technical issues with course access, our team often responds within 2-4 hours.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border bg-card px-6 rounded-xl">
              <AccordionTrigger className="hover:text-primary hover:no-underline text-left">
                Can I request a refund for a course?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Yes, we offer a 14-day money-back guarantee on most of our courses, provided you have not completed more than 20% of the curriculum. Please select "Billing & Payments" in the contact form to initiate a request.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border bg-card px-6 rounded-xl">
              <AccordionTrigger className="hover:text-primary hover:no-underline text-left">
                Do you offer institutional or bulk licensing?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                Absolutely. We work with universities and corporations to provide bulk access to our learning platform. Please select "Partnership / B2B" in the form above and provide details about your organization's size and needs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="group flex items-start p-4 -ml-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all cursor-default relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
      <div className="flex-shrink-0 mt-1 p-3 bg-muted rounded-lg border border-border group-hover:border-primary/20 transition-colors">
        {icon}
      </div>
      <div className="ml-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{label}</h3>
        <p className="text-base font-medium">{value}</p>
      </div>
    </div>
  );
}

function SocialIcon({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="p-2.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
    >
      {icon}
    </a>
  );
}
