"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  return (
    <section id="team" className="py-16 bg-muted/20 border-y">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-4">Meet Our Experts</h2>
            <p className="text-muted-foreground text-sm">
              World-class professionals providing the tools, technology, and mentorship for your educational success.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold text-base">{member.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{member.role}</p>
                  
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground" asChild>
                      <a href={member.instagram}><IconInstagram className="w-4 h-4" /></a>
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground" asChild>
                      <a href={member.whatsapp}><IconWhatsApp className="w-4 h-4" /></a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
