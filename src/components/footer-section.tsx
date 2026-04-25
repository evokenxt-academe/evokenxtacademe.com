"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, Mail, Phone, MapPin } from "lucide-react";

// Reusing same clean SVGs for pure branding match
const IconTwitter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);
const IconInstagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const IconLinkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);
const IconYoutube = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);

const socialLinks = [
  { name: "Twitter", icon: IconTwitter, href: "#", color: "hover:text-sky-400" },
  { name: "Instagram", icon: IconInstagram, href: "https://www.instagram.com/ethnic_elegance_1110/?hl=en", color: "hover:text-pink-500" },
  { name: "LinkedIn", icon: IconLinkedin, href: "#", color: "hover:text-blue-600" },
  { name: "YouTube", icon: IconYoutube, href: "https://www.youtube.com/@EthnicElegance_1110", color: "hover:text-red-600" },
];

const footerLinks = {
  certifications: [
    { name: "Skill Level", href: "#" },
    { name: "Professional Level", href: "#" },
    { name: "Foundation Modules", href: "#" },
    { name: "Basic Concepts", href: "#" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Tutor list", href: "#" },
    { name: "Career", href: "#" },
    { name: "Success Stories", href: "#" },
    { name: "Support", href: "#" },
  ],
  careers: [
    { name: "Financial Auditor", href: "#" },
    { name: "Tax Consultant", href: "#" },
    { name: "Chief Financial Officer", href: "#" },
    { name: "Accounting Manager", href: "#" },
  ],
  others: [
    { name: "Courses", href: "#" },
    { name: "Affiliation Program", href: "#" },
    { name: "Blog List", href: "#" },
    { name: "Subscriptions", href: "#" },
  ]
};

const popularCourses = [
  {
    title: "ACCA Knowledge Level",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&q=80&fit=crop",
    desc: "Start your professional journey."
  },
  {
    title: "Financial Accounting",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=120&q=80&fit=crop",
    desc: "Master the numbers."
  }
];

export function FooterSection() {
  return (
    <footer className="relative bg-white pt-24 pb-12 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-20">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-[900] text-slate-900 tracking-tight">Evoke EduGlobal</span>
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              Empowering global leaders through world-class ACCA and professional certifications. Join 10k+ students building high-impact careers.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium">contact@evokeedu.global</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium">+1 (234) 567-890</span>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={cn(
                    "w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-all duration-300 hover:bg-white hover:shadow-md",
                    social.color
                  )}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Group */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-4">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Certifications</h4>
              <ul className="space-y-4">
                {footerLinks.certifications.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Popular Courses Column */}
          <div className="lg:col-span-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Popular Courses</h4>
            <div className="space-y-6">
              {popularCourses.map((course) => (
                <div key={course.title} className="group flex gap-4 items-center cursor-pointer">
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{course.title}</h5>
                    <p className="text-xs text-slate-400 font-medium">{course.desc}</p>
                  </div>
                </div>
              ))}
              <Link href="#" className="inline-block pt-4 text-indigo-600 font-bold text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                View all courses →
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Evoke EduGlobal. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">Privacy Policy</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
