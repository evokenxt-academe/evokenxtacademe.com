"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Camera, Video, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const featuredCourses = [
  {
    id: 1,
    title: "ACCA Global Professional",
    tag: "FEATURED COURSES",
    description: "Master the global gold standard in accounting. Our program is meticulously designed from Knowledge to Professional levels, ensuring you grasp complex financial reporting and strategic business leadership concepts effortlessly.",
    outcomes: [
      "Over 400+ Interactive Video Lectures",
      "Comprehensive Practice Kits & Mock Exams",
      "Course Content Aligned With Latest Syllabus",
      "Practical Assignments At The End Of Every Session"
    ],
    author: "JAY SINGH",
    students: "12,455",
    rating: 5,
    image: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=800&h=800"
  },
  {
    id: 2,
    title: "US CMA Elite Program",
    tag: "TRENDING NOW",
    description: "Accelerate your career in management and finance. This intensive course covers both foundational concepts and advanced decision analysis, preparing you for immediate corporate success worldwide.",
    outcomes: [
      "Extensive Coverage Of All 12 Core Competencies",
      "Real-time AI Feedback On Practice Tests",
      "Live Saturday Revision Sessions",
      "Direct Mentorship & Strategic Study Planning"
    ],
    author: "JAY SINGH",
    students: "8,920",
    rating: 5,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&h=800"
  },
  {
    id: 3,
    title: "Chartered Accountancy",
    tag: "HIGHEST RATED",
    description: "Join the elite league of national finance professionals. We deliver exhaustive coverage of CA Foundation, Inter, and Final subjects with intense focus on practical application and recent tax law updates.",
    outcomes: [
      "Deep Dive Into Corporate Laws & Taxation",
      "Advanced Auditing Case Studies",
      "High-Yield Summary Notes Provided",
      "Rigorous Evaluation & Continuous Assessment"
    ],
    author: "JAY SINGH",
    students: "15,100",
    rating: 5,
    image: "https://images.unsplash.com/photo-1554200876-0f8a37daec06?q=80&w=800&h=800"
  }
];

export function FeaturedCourseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextCourse = () => {
    setCurrentIndex((prev) => (prev === featuredCourses.length - 1 ? 0 : prev + 1));
  };

  const prevCourse = () => {
    setCurrentIndex((prev) => (prev === 0 ? featuredCourses.length - 1 : prev - 1));
  };

  const currentCourse = featuredCourses[currentIndex];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative">
        
        {/* Navigation Arrows Container */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 w-full flex justify-between px-2 md:px-0 pointer-events-none z-20">
           {/* We use negative margins on larger screens to push arrows outside the content wrapper just like the reference */}
           <button 
             onClick={prevCourse}
             className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 hover:text-indigo-600 transition-colors pointer-events-auto md:-ml-6"
           >
              <ChevronLeft className="w-6 h-6" />
           </button>
           <button 
             onClick={nextCourse}
             className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 hover:text-indigo-600 transition-colors pointer-events-auto md:-mr-6"
           >
              <ChevronRight className="w-6 h-6" />
           </button>
        </div>

        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center"
            >
              
              {/* Left Image Area */}
              <div className="relative aspect-square w-full shadow-2xl rounded-none group overflow-hidden">
                <img 
                  src={currentCourse.image} 
                  alt={currentCourse.title}
                  className="w-full h-full object-cover rounded-none transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#0B1D3A]/10 pointer-events-none" />
                
                {/* Top Right Icons (as in reference image) */}
                <div className="absolute top-4 right-4 flex gap-2">
                   <div className="p-2 bg-white/20 backdrop-blur-md rounded border border-white/30 text-white">
                      <Camera className="w-4 h-4" />
                   </div>
                   <div className="p-2 bg-white/20 backdrop-blur-md rounded border border-white/30 text-white">
                      <Video className="w-4 h-4" />
                   </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex flex-col h-full justify-center">
                 <h2 className="text-4xl md:text-5xl font-[900] text-[#0B1D3A] tracking-tight mb-4">
                   {currentCourse.title}
                 </h2>
                 <p className="text-[#FFB800] font-bold text-sm tracking-widest uppercase mb-6">
                   {currentCourse.tag}
                 </p>
                 
                 <p className="text-slate-600 leading-relaxed mb-8">
                   {currentCourse.description}
                 </p>

                 <div className="mb-8">
                   <h4 className="text-lg font-black text-black mb-4 uppercase tracking-wider">Learning Outcomes</h4>
                   <ul className="space-y-3">
                     {currentCourse.outcomes.map((outcome, idx) => (
                       <li key={idx} className="flex flex-start gap-3 text-slate-700 font-medium">
                         <div className="mt-1 flex-shrink-0">
                           <Check className="w-4 h-4 text-[#FFB800]" strokeWidth={4} />
                         </div>
                         {outcome}
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div>
                    <button className="bg-[#FFB800] hover:bg-[#F2A900] text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-none transition-transform hover:scale-105">
                       Enroll Now
                     </button>
                 </div>

                 {/* Bottom Stats Footer */}
                 <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Author</p>
                      <p className="text-sm sm:text-base font-bold text-black uppercase">{currentCourse.author}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Students Enrolled</p>
                      <p className="text-sm sm:text-base font-medium text-black">{currentCourse.students}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Rating</p>
                      <div className="flex text-[#FFB800]">
                         {[...Array(currentCourse.rating)].map((_, i) => (
                           <Star key={i} className="w-4 h-4 fill-current" />
                         ))}
                      </div>
                    </div>
                 </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
