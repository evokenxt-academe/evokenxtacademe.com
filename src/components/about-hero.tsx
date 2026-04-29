"use client";

import React from "react";

export function AboutHero() {
  return (
    <section className="relative w-full h-[350px] md:h-[450px] overflow-hidden bg-slate-900">
      {/* New High-End Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80"
          alt="Modern Professional Learning"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Expansive Full-Width Content */}
      <div className="container mx-auto px-8 h-full flex flex-col justify-center relative z-10">
        <div className="max-w-5xl">
          <h1 className="text-5xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            About Us
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl font-light opacity-90">
            A descriptive paragraph that tells clients how good you are and proves that you are the best choice that they&apos;ve made for their professional journey. 
            Our platform is built on excellence, technology, and a commitment to your professional success.
          </p>
        </div>
      </div>
    </section>
  );
}

