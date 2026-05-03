"use client";

import React from "react";
import { motion } from "motion/react";
import { Milestone, Calendar, Globe, Award, TrendingUp, Rocket, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TimelineItem {
  year: string;
  title: string;
  location?: string;
  description: string;
  icon: React.ReactNode;
}

const milestones: TimelineItem[] = [
  {
    year: "2019",
    title: "The Genesis",
    location: "Delhi Hub",
    description: "Founded with a singular mission to revolutionize accounting education across the subcontinent, starting with our core hub in Delhi.",
    icon: <Milestone className="w-4 h-4" />,
  },
  {
    year: "2020",
    title: "Digital Evolution",
    location: "LMS Launch",
    description: "Pivoted to a high-fidelity digital ecosystem, ensuring uninterrupted learning for thousands of students during global shifts.",
    icon: <Globe className="w-4 h-4" />,
  },
  {
    year: "2021",
    title: "National Scale",
    location: "Pan-India",
    description: "Reached a milestone of 50,000+ active learners, bridging the gap between local talent and international expertise.",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    year: "2022",
    title: "Global Excellence",
    location: "London Accredited",
    description: "Recognized by international bodies for our innovative pedagogy and commitment to world-class professional standards.",
    icon: <Award className="w-4 h-4" />,
  },
  {
    year: "2023",
    title: "Strategic Growth",
    location: "Impact Labs",
    description: "Introduced AI-driven progress tracking and personalized mentorship paths, resulting in record-breaking pass rates.",
    icon: <Rocket className="w-4 h-4" />,
  },
  {
    year: "2024",
    title: "National Leadership",
    location: "Global Reach",
    description: "Successfully connected 1 Lakh+ learners with global career opportunities, cementing our position as a subcontinent leader.",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    year: "2025",
    title: "The Future Defined",
    location: "Next Gen LMS",
    description: "Launching AI-driven personalized learning paths and augmented mentorship, setting a new global standard in professional education.",
    icon: <Rocket className="w-4 h-4" />,
  },
];

export function SuccessTimeline() {
  return (
    <section className="py-16 bg-muted/10 relative overflow-hidden border-y border-border">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="h-px w-8 bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Success Journey</span>
            <div className="h-px w-8 bg-primary" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4"
          >
            A Journey of <br /> 
            <span className="text-primary">Global Excellence</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-base font-medium leading-relaxed"
          >
            Dedicated to transforming the educational landscape across the subcontinent. Our ecosystem connects local talent with global expertise.
          </motion.p>
        </div>

        {/* Timeline - Alternating Left/Right */}
        <div className="relative">
          {/* Central Vertical Line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[1px] bg-border -translate-x-1/2" />

          <div className="space-y-8 md:space-y-12">
            {milestones.map((item, idx) => (
              <TimelineItem key={idx} item={item} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ item, index }: { item: TimelineItem; index: number }) {
  const isEven = index % 2 === 0;

  return (
    <div className={`relative flex items-center justify-center w-full group ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>
      {/* Central Node Dot */}
      <div className="absolute left-[20px] md:left-1/2 top-0 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-primary bg-background z-20 transition-all duration-300 group-hover:scale-125 group-hover:bg-primary" />

      {/* Content Container */}
      <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? "md:pr-12" : "md:pl-12"}`}>
        <motion.div
          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`w-full max-w-lg p-6 hover:shadow-md transition-shadow duration-300 border-border/50 ${isEven ? "md:items-end md:text-right" : "md:items-start md:text-left"}`}>
            {/* Year Badge */}
            <div className={`text-xs font-bold text-primary mb-3 flex items-center gap-2 ${isEven ? "md:justify-end" : "md:justify-start"}`}>
              <Calendar className="w-4 h-4" />
              {item.year}
            </div>

            <div className={`flex flex-col gap-3 ${isEven ? "md:items-end" : "md:items-start"}`}>
              <div className={`flex items-center gap-3 ${isEven ? "md:flex-row-reverse" : "md:flex-row"}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {item.title}
                </h3>
              </div>

              <div className={`flex items-center gap-2 text-xs font-medium text-muted-foreground ${isEven ? "md:flex-row-reverse" : "md:flex-row"}`}>
                <MapPin className="w-3 h-3 text-primary/70" />
                {item.location}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Spacer for Desktop Grid */}
      <div className="hidden md:block w-1/2" />
    </div>
  );
}
