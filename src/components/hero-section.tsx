"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Play } from "lucide-react";

const words = ["succeed", "excel", "qualify", "grow"];

function BlurWord({ word, trigger }: { word: string; trigger: number }) {
  const letters = word.split("");
  const STAGGER = 45; // ms between each letter
  const DURATION = 500; // blur+opacity fade duration per letter
  const GRADIENT_HOLD = STAGGER * letters.length + DURATION + 200;

  const [letterStates, setLetterStates] = useState<
    { opacity: number; blur: number }[]
  >(letters.map(() => ({ opacity: 0, blur: 20 })));
  const [showGradient, setShowGradient] = useState(true);
  const framesRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // reset
    framesRef.current.forEach(cancelAnimationFrame);
    timersRef.current.forEach(clearTimeout);
    framesRef.current = [];
    timersRef.current = [];

    setLetterStates(letters.map(() => ({ opacity: 0, blur: 20 })));
    setShowGradient(true);

    // stagger each letter
    letters.forEach((_, i) => {
      const t = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setLetterStates((prev) => {
            const next = [...prev];
            next[i] = { opacity: eased, blur: 20 * (1 - eased) };
            return next;
          });
          if (progress < 1) {
            const id = requestAnimationFrame(tick);
            framesRef.current.push(id);
          }
        };
        const id = requestAnimationFrame(tick);
        framesRef.current.push(id);
      }, i * STAGGER);
      timersRef.current.push(t);
    });

    // remove gradient once all letters are settled
    const gt = setTimeout(() => setShowGradient(false), GRADIENT_HOLD);
    timersRef.current.push(gt);

    return () => {
      framesRef.current.forEach(cancelAnimationFrame);
      timersRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  // gradient colours cycling across letter positions
  const gradientColors = [
    "#eca8d6",
    "#a78bfa",
    "#67e8f9",
    "#fbbf24",
    "#eca8d6",
  ];

  return (
    <>
      {letters.map((char, i) => {
        const colorIndex =
          (i / Math.max(letters.length - 1, 1)) * (gradientColors.length - 1);
        const lower = Math.floor(colorIndex);
        const upper = Math.min(lower + 1, gradientColors.length - 1);
        const t = colorIndex - lower;

        // lerp hex colours
        const hex2rgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return [r, g, b];
        };
        const [r1, g1, b1] = hex2rgb(gradientColors[lower]);
        const [r2, g2, b2] = hex2rgb(gradientColors[upper]);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: letterStates[i]?.opacity ?? 0,
              filter: `blur(${letterStates[i]?.blur ?? 20}px)`,
              color: showGradient ? `rgb(${r},${g},${b})` : "white",
              transition: "color 0.4s ease",
            }}
          >
            {char}
          </span>
        );
      })}
    </>
  );
}

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-[80vh] flex-col justify-center overflow-hidden bg-zinc-950">
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="size-full object-cover opacity-30"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/50 to-zinc-950" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
        <div className="lg:max-w-[55%]">
          {/* Eyebrow */}
          <div
            className={`mb-8 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-white/60">
              <span className="w-8 h-px bg-white/30" />
              Globally recognised ACCA qualification pathway
            </span>
          </div>

          {/* Main headline */}
          <div className="mb-10">
            <h1
              className={`text-left text-[clamp(2rem,6vw,7rem)] font-display leading-[0.92] tracking-tight text-white transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <span className="block whitespace-nowrap">
                Master your future,
              </span>
              <span className="block whitespace-nowrap">
                learn to{" "}
                <span className="relative inline-block">
                  <BlurWord word={words[wordIndex]} trigger={wordIndex} />
                </span>
              </span>
            </h1>
          </div>

          {/* Subtext and CTAs */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="mb-10 max-w-xl text-lg text-white/70 leading-relaxed font-medium">
              Expert-led ACCA courses with structured learning, dynamic mock
              exams, and personalized mentor support to guarantee your success.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="rounded-none h-12 px-8 text-base font-semibold"
                asChild
              >
                <Link href="/courses">
                  Explore Courses
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-none h-12 px-8 text-base font-semibold border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white"
              >
                <Play className="mr-2 size-5 fill-current" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className={`relative z-10 border-t border-white/10 transition-all duration-700 delay-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 lg:px-8">
          <div className="flex items-center gap-8 lg:gap-12">
            {[
              { value: "500+", label: "Students enrolled" },
              { value: "98%", label: "Exam pass rate" },
              { value: "13", label: "ACCA papers covered" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="flex items-center gap-8 lg:gap-12"
              >
                {i > 0 && (
                  <Separator
                    orientation="vertical"
                    className="h-8 bg-white/10"
                  />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-semibold tracking-tight text-white lg:text-2xl">
                    {stat.value}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
