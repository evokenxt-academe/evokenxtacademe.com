"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { usePWA } from "@/context/PWAContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share,
  PlusSquare,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  Bell,
  Zap,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export default function InstallPage() {
  const { isInstallable, isInstalled, triggerInstall } = usePWA();
  const [deviceOS, setDeviceOS] = useState<"ios" | "android" | "desktop" | "unknown">("unknown");
  const [browser, setBrowser] = useState<"safari" | "chrome" | "other">("other");
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIsStandaloneMode(isStandalone);

    // Detect User Agent
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /ipad|iphone|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);

    if (isIos) {
      setDeviceOS("ios");
    } else if (isAndroid) {
      setDeviceOS("android");
    } else {
      setDeviceOS("desktop");
    }

    if (/safari/.test(ua) && !/chrome|chromium|crios/.test(ua)) {
      setBrowser("safari");
    } else if (/chrome|chromium|crios/.test(ua)) {
      setBrowser("chrome");
    }
  }, []);

  const handleInstallClick = async () => {
    try {
      const success = await triggerInstall();
      if (success) {
        toast.success("Thank you for installing EvokeNxt!");
      } else {
        toast.error("Installation was cancelled.");
      }
    } catch (err) {
      console.error("Install prompt error:", err);
      toast.error("Failed to open install dialog. Please try manual installation.");
    }
  };

  // Automatically attempt native install or capture first interaction
  useEffect(() => {
    if (!isInstallable || isInstalled || isStandaloneMode) return;

    let hasAttempted = false;

    const attemptInstall = async () => {
      if (hasAttempted) return;
      hasAttempted = true;
      try {
        const success = await triggerInstall();
        if (success) {
          toast.success("Thank you for installing EvokeNxt!");
        }
      } catch (err) {
        console.warn("Auto-install attempt failed:", err);
      }
    };

    // Attempt immediately (browsers might block, but we try)
    attemptInstall();

    // Bind interaction event listeners for a one-time gesture auto-install trigger
    const handleInteraction = () => {
      attemptInstall();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return cleanup;
  }, [isInstallable, isInstalled, isStandaloneMode, triggerInstall]);

  // Staggered animation wrapper config
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <main className="relative min-h-screen bg-[#0b0b0b] text-foreground flex flex-col items-center justify-center py-20 px-6 overflow-hidden">
      {/* Background Gradients & Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[400px] bg-teal-500/[0.03] rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10">
        {/* Back Link */}
        <div className="mb-6 flex justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-emerald-400 transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          {/* Left Column - Main Interactive Card */}
          <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col">
            <Card className="flex-1 rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 shadow-2xl p-6 md:p-8 flex flex-col justify-between">
              <div>
                {/* Badge */}
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5">
                    PWA Platform
                  </Badge>
                  {isStandaloneMode && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-bold uppercase px-2.5 py-0.5">
                      Standalone Mode
                    </Badge>
                  )}
                </div>

                {/* App Brand Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden border border-zinc-700 shadow-xl bg-zinc-900 flex items-center justify-center p-0.5">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20" />
                    <Image
                      src="/logo.jpg"
                      alt="EvokeNxt Logo"
                      width={64}
                      height={64}
                      className="rounded-xl relative z-10 object-cover size-full"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-none">
                      EvokeNxt
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                      Premium ACCA Learning Platform
                    </p>
                  </div>
                </div>

                {/* Content switching based on install state */}
                <AnimatePresence mode="wait">
                  {isInstalled || isStandaloneMode ? (
                    <motion.div
                      key="installed"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <CheckCircle2 className="size-6 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">App Fully Installed!</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            EvokeNxt is installed and configured on this device.
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                        You can access the platform directly from your home screen or desktop with offline mode, immediate load times, and native window capabilities.
                      </p>
                    </motion.div>
                  ) : isInstallable ? (
                    <motion.div
                      key="installable"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                        Ready to Install on this Device
                      </h2>
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                        Get the full EvokeNxt app experience. Install for seamless offline reading, immediate dashboard access, and real-time updates.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="instructions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                        How to Install EvokeNxt
                      </h2>
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                        Your browser doesn&apos;t support direct one-click installation. You can easily add EvokeNxt to your home screen or dock manually.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Install Action Area */}
              <div className="mt-10">
                {isInstalled || isStandaloneMode ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-zinc-700 transition-all duration-200"
                  >
                    <Link href="/dashboard" className="flex items-center justify-center gap-2">
                      Go to Dashboard
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : isInstallable ? (
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                  >
                    <Download className="mr-2.5 size-5" />
                    Install App Now
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Visual Manual instructions */}
                    {deviceOS === "ios" ? (
                      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Smartphone className="size-4" />
                          iOS / Safari Instructions
                        </p>
                        <ol className="text-xs text-zinc-300 space-y-3 font-medium">
                          <li className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-zinc-800 text-white font-bold text-[10px] shrink-0 mt-0.5">1</span>
                            <span>Open this site in the default <span className="text-white font-semibold">Safari</span> browser.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-zinc-800 text-white font-bold text-[10px] shrink-0 mt-0.5">2</span>
                            <span className="flex flex-wrap items-center gap-1">
                              Tap the <span className="inline-flex items-center justify-center p-1 rounded bg-zinc-800 border border-zinc-700 text-emerald-400"><Share className="size-3.5" /></span> <span className="text-white font-semibold">Share</span> button in the navigation bar.
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-zinc-800 text-white font-bold text-[10px] shrink-0 mt-0.5">3</span>
                            <span className="flex flex-wrap items-center gap-1">
                              Scroll down and choose <span className="text-white font-semibold">Add to Home Screen</span> <span className="inline-flex items-center justify-center p-1 rounded bg-zinc-800 border border-zinc-700 text-emerald-400"><PlusSquare className="size-3.5" /></span>.
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-zinc-800 text-white font-bold text-[10px] shrink-0 mt-0.5">4</span>
                            <span>Tap <span className="text-emerald-400 font-bold">Add</span> in the top right corner.</span>
                          </li>
                        </ol>
                      </div>
                    ) : deviceOS === "desktop" && browser === "safari" ? (
                      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Laptop className="size-4" />
                          macOS / Safari Instructions
                        </p>
                        <ol className="text-xs text-zinc-300 space-y-3 font-medium">
                          <li className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-zinc-800 text-white font-bold text-[10px] shrink-0 mt-0.5">1</span>
                            <span className="flex flex-wrap items-center gap-1">
                              Click the <span className="inline-flex items-center justify-center p-1 rounded bg-zinc-800 border border-zinc-700 text-emerald-400"><Share className="size-3.5" /></span> <span className="text-white font-semibold">Share</span> button in Safari toolbar.
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-zinc-800 text-white font-bold text-[10px] shrink-0 mt-0.5">2</span>
                            <span>Select <span className="text-white font-semibold">Add to Dock</span> from the menu.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="flex items-center justify-center size-5 rounded-full bg-zinc-800 text-white font-bold text-[10px] shrink-0 mt-0.5">3</span>
                            <span>Confirm the name and click <span className="text-emerald-400 font-bold">Add</span>.</span>
                          </li>
                        </ol>
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <HelpCircle className="size-4" />
                          Manual Browser Instructions
                        </p>
                        <ul className="text-xs text-zinc-300 space-y-3 font-medium list-disc pl-4">
                          <li>
                            Open the browser menu (usually <span className="text-white font-semibold">three dots</span> or <span className="text-white font-semibold">three lines</span> in the corner).
                          </li>
                          <li>
                            Look for <span className="text-white font-semibold">Install App</span>, <span className="text-white font-semibold">Install EvokeNxt</span>, or <span className="text-white font-semibold">Add to Home screen</span>.
                          </li>
                          <li>
                            Follow the on-screen prompts to complete installation.
                          </li>
                        </ul>
                      </div>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-11 rounded-xl border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                    >
                      <Link href="/" className="flex items-center justify-center gap-1.5 text-xs font-bold">
                        Continue in Browser
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Features list */}
          <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-4">
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl bg-zinc-900/20 backdrop-blur-md border border-zinc-800/60 flex items-start gap-4 hover:border-zinc-800 transition-all duration-200">
              <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Zap className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Instant Load Times</h3>
                <p className="text-xs text-muted-foreground leading-normal font-medium">
                  Launches immediately with cached assets, avoiding reload cycles.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl bg-zinc-900/20 backdrop-blur-md border border-zinc-800/60 flex items-start gap-4 hover:border-zinc-800 transition-all duration-200">
              <div className="flex items-center justify-center size-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
                <BookOpen className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Structured Study</h3>
                <p className="text-xs text-muted-foreground leading-normal font-medium">
                  Designed for standalone focus. Free from address bars, tab clutters, or distractions.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl bg-zinc-900/20 backdrop-blur-md border border-zinc-800/60 flex items-start gap-4 hover:border-zinc-800 transition-all duration-200">
              <div className="flex items-center justify-center size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Bell className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Push Notifications</h3>
                <p className="text-xs text-muted-foreground leading-normal font-medium">
                  Stay updated with instant push alerts for lecture streams and course updates.
                </p>
              </div>
            </div>

            {/* Premium Stat Card */}
            <div className="flex-1 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/10 to-zinc-900/50 backdrop-blur-md border border-emerald-500/10 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 size-32 bg-emerald-500/[0.02] rounded-full blur-2xl" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-emerald-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Join 3,000+ Students
                </span>
              </div>
              <div className="space-y-1 mt-6">
                <p className="text-2xl font-black text-white">95% Pass Rate</p>
                <p className="text-xs text-zinc-400 font-medium">
                  Empower your ACCA exam prep and study on any device, anywhere.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
