"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Custom SVGs for consistent branding & reliability
const IconInstagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const IconWhatsApp = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-12.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>
);

const teamMembers = [
  {
    name: "Joel Wish",
    role: "LMS Tech Lead",
    image: "https://i.pravatar.cc/400?img=53",
    bio: "Visionary leader dedicated to democratizing global education access via advanced LMS.",
    instagram: "#",
    whatsapp: "#",
  },
  {
    name: "Amara Okeke",
    role: "Top Academic Achiever",
    image: "https://i.pravatar.cc/400?img=26",
    bio: "Consistent top performer and peer mentor in advanced computer science.",
    instagram: "#",
    whatsapp: "#",
  },
  {
    name: "Gavin Blair",
    role: "Operations Expert",
    image: "https://i.pravatar.cc/400?img=54",
    bio: "Software Architect specializing in scalable learning ecosystems.",
    instagram: "#",
    whatsapp: "#",
  },
  {
    name: "Emmy Bush",
    role: "Community Growth",
    image: "https://i.pravatar.cc/400?img=47",
    bio: "Connecting thousands of students through innovative global study groups.",
    instagram: "#",
    whatsapp: "#",
  },
  {
    name: "David Chen",
    role: "AI Research Junior",
    image: "https://i.pravatar.cc/400?img=33",
    bio: "Implementing next-gen student assistant bots into the platform.",
    instagram: "#",
    whatsapp: "#",
  },
  {
    name: "Zoe Martinez",
    role: "Student Experience Lead",
    image: "https://i.pravatar.cc/400?img=56",
    bio: "Designing the most intuitive and engaging mobile learning pathways.",
    instagram: "#",
    whatsapp: "#",
  },
  {
    name: "Marcus Thorne",
    role: "Infrastructure Junior",
    image: "https://i.pravatar.cc/400?img=13",
    bio: "Ensuring 99.9% uptime for world-wide student lectures.",
    instagram: "#",
    whatsapp: "#",
  },
  {
    name: "Aria Kim",
    role: "Course Content Creator",
    image: "https://i.pravatar.cc/400?img=44",
    bio: "Building high-fidelity workshop content for creative professionals.",
    instagram: "#",
    whatsapp: "#",
  },
];

export function TeamSection() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section className="py-24 bg-[#F9F6F3] relative overflow-hidden text-slate-900 leading-normal">
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header - Condensed LMS Content */}
        <div className="max-w-5xl mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[0.65rem] font-[800] text-slate-500 uppercase tracking-[0.3em] mb-6">Our Experts</h2>
            <h3 className="text-3xl md:text-5xl font-[500] text-slate-900 mb-6 tracking-tighter max-w-4xl leading-[1.1]">
              World-class experts providing the tools, technology, and mentorship for your educational success.
            </h3>
          </motion.div>
        </div>

        {/* Team Grid - Dense & Professional 4-Column Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="group cursor-pointer max-w-[300px] mx-auto md:mx-0"
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
            >
              <div className="relative aspect-[1/1] overflow-hidden mb-4 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Social Overlay on Hover/Touch */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: activeIdx === idx ? 1 : 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center gap-4"
                >
                  <a href={member.instagram} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-all transform hover:scale-110 shadow-lg">
                    <IconInstagram className="w-5 h-5" />
                  </a>
                  <a href={member.whatsapp} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-all transform hover:scale-110 shadow-lg">
                    <IconWhatsApp className="w-5 h-5" />
                  </a>
                </motion.div>
              </div>

              <div className="space-y-1 px-1 text-left">
                <h4 className="text-lg font-[600] text-slate-900 tracking-tight leading-tight">{member.name}</h4>
                <p className="text-[0.6rem] font-[800] text-slate-500 uppercase tracking-[0.12em] leading-tight line-clamp-1">
                  {member.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
