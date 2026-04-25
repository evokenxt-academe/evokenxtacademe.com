"use client";

import React from "react";
import { BookOpen, Globe, Calculator, Award, TrendingUp, MonitorPlay, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "ACCA Global",
    topics: "(1,226)",
    icon: <Globe className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#3A82F7]", // Blue
  },
  {
    title: "US CMA",
    topics: "(2,366)",
    icon: <MonitorPlay className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#25CBE5]", // Cyan/Teal
  },
  {
    title: "Chartered Accountancy",
    topics: "(766)",
    icon: <Calculator className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#18C360]", // Green
  },
  {
    title: "IFRS Excellence",
    topics: "(4,500)",
    icon: <Award className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#EA4C9B]", // Pink
  },
  {
    title: "Financial Accounting",
    topics: "(975)",
    icon: <TrendingUp className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#F3AC3D]", // Yellow/Orange
  },
  {
    title: "Perf. Management",
    topics: "(3,340)",
    icon: <BookOpen className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#5EBC90]", // Muted green
    hasBackground: true,
  },
  {
    title: "Audit & Assurance",
    topics: "(2,100)",
    icon: <Globe className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#9B51E0]", // Purple
  }
];

// Let's ensure we only have 6 categories to maintain the grid perfectly.
// Slicing out IFRS Excellence to fit the requested 3 into the original 6 blocks.
const categoriesList = [
  {
    title: "ACCA Global",
    topics: "(1,226)",
    icon: <Globe className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#3A82F7]", // Blue
  },
  {
    title: "US CMA",
    topics: "(2,366)",
    icon: <MonitorPlay className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#25CBE5]", // Cyan/Teal
  },
  {
    title: "Chartered Accountancy",
    topics: "(766)",
    icon: <Calculator className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#18C360]", // Green
  },
  {
    title: "Financial Accounting",
    topics: "(975)",
    icon: <TrendingUp className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#EA4C9B]", // Pink
  },
  {
    title: "Perf. Management",
    topics: "(3,340)",
    icon: <BookOpen className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#F3AC3D]", // Yellow/Orange
  },
  {
    title: "Audit & Assurance",
    topics: "(2,100)",
    icon: <Award className="w-12 h-12 mb-4 text-white" strokeWidth={1.5} />,
    bgColor: "bg-[#5EBC90]", // Muted green
    hasBackground: true,
  }
];

const trendingCourses = [
  {
    title: "Professional ACCA Masterclass",
    rating: "4.5",
    reviews: "(23,890)",
    author: "BY JAY SINGH",
    image: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=200&h=200"
  },
  {
    title: "US CMA Elite Preparation",
    rating: "4.5",
    reviews: "(23,890)",
    author: "BY JAY SINGH",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&h=200"
  },
  {
    title: "CA Foundation Intensive",
    rating: "4.5",
    reviews: "(23,890)",
    author: "BY JAY SINGH",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200&h=200"
  }
];

export function TeacherCoursesSection() {
  return (
    <section className="py-20 bg-[#F9FAFB]">
      <div className="container mx-auto px-6 max-w-7xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          
          {/* LEFT: Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoriesList.map((cat, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "relative flex flex-col items-center justify-center text-center p-8 h-[180px] transition-transform hover:-translate-y-1 cursor-pointer overflow-hidden",
                  cat.bgColor,
                  "rounded-none" // Enforced sharp corners
                )}
              >
                {/* Specific subtle background for the 6th element to match reference */}
                {cat.hasBackground && (
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                  {cat.icon}
                  <h3 className="text-white font-bold text-xl tracking-wide mb-1 drop-shadow-sm">
                    {cat.title}
                  </h3>
                  <p className="text-white/90 text-sm font-medium">
                    {cat.topics} Topics
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Trending Courses Sidebar */}
          <div className="flex flex-col rounded-none overflow-hidden shadow-[0_5px_20px_-5px_rgba(0,0,0,0.1)] bg-white border border-slate-100 self-start sticky top-32">
            {/* Dark Navy Header */}
            <div className="bg-[#0B1D3A] text-white p-5">
              <h3 className="text-lg font-bold tracking-wide">
                Trending Courses
              </h3>
            </div>

            {/* Course List */}
            <div className="flex flex-col flex-grow">
              {trendingCourses.map((course, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer",
                    idx !== trendingCourses.length - 1 ? "border-b border-slate-100" : ""
                  )}
                >
                  {/* Thumbnail */}
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-16 h-16 object-cover shrink-0 rounded-none shadow-sm"
                  />
                  
                  {/* Info */}
                  <div className="flex flex-col justify-center">
                    <h4 className="text-[#0B1D3A] font-bold leading-tight mb-2 pr-2">
                      {course.title}
                    </h4>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        {/* Half star approx */}
                        <div className="relative w-4 h-4">
                          <Star className="absolute inset-0 w-4 h-4 text-yellow-400" />
                          <div className="absolute inset-0 w-[50%] overflow-hidden">
                             <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 ml-1">
                        {course.rating} {course.reviews}
                      </span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <User className="w-3 h-3" />
                      {course.author}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Link */}
            <div className="p-5 border-t border-slate-100 flex items-center">
               <a href="/courses" className="text-[#0B1D3A] text-xs font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2">
                 BROWSE ALL COURSES <span className="text-base leading-none">»</span>
               </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
