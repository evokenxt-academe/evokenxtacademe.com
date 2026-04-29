"use client";

import { FileBadge, GraduationCap, Presentation, BookOpen, ChevronRight } from "lucide-react";

const features = [
  {
    icon: <FileBadge className="w-12 h-12 text-slate-800" strokeWidth={1.5} />,
    title: "Certification Guarantee",
    description: "Aliquam arcu mauris, consequat ut ante sit amet, iaculis suscipit ipsum.",
  },
  {
    icon: <GraduationCap className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />,
    title: "Graduate Admission",
    description: "Aliquam arcu mauris, consequat ut ante sit amet, iaculis suscipit ipsum.",
  },
  {
    icon: <Presentation className="w-12 h-12 text-slate-800" strokeWidth={1.5} />,
    title: "Skilled Lecturers",
    description: "Aliquam arcu mauris, consequat ut ante sit amet, iaculis suscipit ipsum.",
  },
  {
    icon: <BookOpen className="w-12 h-12 text-slate-800" strokeWidth={1.5} />,
    title: "Why Study At Eduplus",
    description: "Aliquam arcu mauris, consequat ut ante sit amet, iaculis suscipit ipsum.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="relative py-24 bg-white overflow-hidden font-sans">
      {/* Decorative Dots Background */}
      <div className="absolute top-10 left-10 opacity-[0.15] hidden lg:block">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="2" fill="currentColor" />
          <circle cx="30" cy="10" r="2" fill="currentColor" />
          <circle cx="50" cy="10" r="2" fill="currentColor" />
          <circle cx="70" cy="10" r="2" fill="currentColor" />
          <circle cx="90" cy="10" r="2" fill="currentColor" />
          <circle cx="10" cy="30" r="2" fill="currentColor" />
          <circle cx="30" cy="30" r="2" fill="currentColor" />
          <circle cx="50" cy="30" r="2" fill="currentColor" />
          <circle cx="10" cy="50" r="2" fill="currentColor" />
          <circle cx="30" cy="50" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 opacity-[0.15] hidden lg:block rotate-180">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {[...Array(6)].map((_, i) => 
            [...Array(6)].map((_, j) => (
              <circle key={`${i}-${j}`} cx={10 + i * 20} cy={10 + j * 20} r="2" fill="currentColor" />
            ))
          )}
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-3xl p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col items-center text-center"
            >
              <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6 font-light">
                {feature.description}
              </p>
              <button className="text-blue-600 font-bold text-sm tracking-wide group-hover:underline transition-all flex items-center gap-1">
                Learn More..
              </button>
            </div>
          ))}
        </div>

        {/* Pagination Dots (Simulator) */}
        <div className="flex justify-center gap-3 mt-16">
          <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
          <div className="w-3 h-3 rounded-full bg-slate-200" />
        </div>

        {/* Footer Link */}
        <div className="text-center mt-12">
          <a 
            href="#" 
            className="inline-flex items-center gap-2 text-slate-600 font-medium hover:text-blue-600 transition-colors border-b border-blue-600/30 pb-1"
          >
            Trusted by The Worlds <span className="text-blue-600 font-bold ml-1">Best University</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
