"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { usePWA } from "@/context/PWAContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Share,
  PlusSquare,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ArrowDown,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

const IOS_DISMISSED_KEY = "evokenxt_ios_install_dismissed_at";
const COOLDOWN_DAYS = 3;

export function IOSInstallOverlay() {
  const { isIOS, isIOSSafari, isInstalled, showIOSOverlay, setShowIOSOverlay } =
    usePWA();
  const [activeStep, setActiveStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Check standalone mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);
    setIsStandalone(standalone);
  }, []);

  // Auto-show for first-time iOS visitors on Safari after a short 2.5s delay
  useEffect(() => {
    if (!isIOS || isInstalled || isStandalone) return;

    try {
      const dismissedAt = localStorage.getItem(IOS_DISMISSED_KEY);
      if (dismissedAt) {
        const lastDismissed = parseInt(dismissedAt, 10);
        const now = Date.now();
        const daysSince = (now - lastDismissed) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS) {
          return;
        }
      }

      // Small delay on first load to allow page to settle
      const timer = setTimeout(() => {
        setShowIOSOverlay(true);
      }, 2500);

      return () => clearTimeout(timer);
    } catch {
      // LocalStorage error fallback
    }
  }, [isIOS, isInstalled, isStandalone, setShowIOSOverlay]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(IOS_DISMISSED_KEY, Date.now().toString());
    } catch {
      // ignore
    }
    setShowIOSOverlay(false);
  }, [setShowIOSOverlay]);

  const copyUrl = async () => {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied! Open Safari and paste to install.");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isIOS || isInstalled || isStandalone || !showIOSOverlay) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md transition-all">
        {/* Backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={handleDismiss}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl bg-zinc-950/95 border-t border-zinc-800/90 shadow-2xl p-6 pb-10 flex flex-col gap-5 text-white"
        >
          {/* Top Grab Handle */}
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto -mt-2 mb-1 opacity-70" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative size-12 rounded-2xl overflow-hidden border border-emerald-500/30 bg-zinc-900 flex items-center justify-center p-0.5 shadow-lg shadow-emerald-500/10">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="EvokeNxt Logo"
                  width={48}
                  height={48}
                  className="rounded-xl object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Install EvokeNxt App
                  </h3>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-bold px-2 py-0"
                  >
                    iOS PWA
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Add to iPhone Home Screen for the full app experience
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Non-Safari Warning on iOS */}
          {!isIOSSafari ? (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <Smartphone className="size-4 shrink-0" />
                <span>Safari Browser Required for Installation</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                iOS only supports installing PWAs directly from Apple Safari. Please copy the link and open it in Safari:
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUrl}
                  className="flex-1 bg-zinc-900 border-zinc-700 text-xs font-bold text-white hover:bg-zinc-800"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 mr-1.5 text-emerald-400" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1.5" />
                      Copy Link for Safari
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Step-by-Step Interactive Guide */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div
                  onClick={() => setActiveStep(1)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeStep === 1
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-md shadow-emerald-500/5"
                      : "bg-zinc-900/50 border-zinc-800/80 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        activeStep === 1
                          ? "bg-emerald-500 text-zinc-950"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      1
                    </span>
                    <div className="flex-1 text-xs">
                      <span className="font-semibold text-white">
                        Tap Safari&apos;s Share button
                      </span>{" "}
                      <span className="text-zinc-300">
                        at the bottom bar of your screen.
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-800/90 border border-zinc-700 text-emerald-400">
                      <Share className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div
                  onClick={() => setActiveStep(2)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeStep === 2
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-md shadow-emerald-500/5"
                      : "bg-zinc-900/50 border-zinc-800/80 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        activeStep === 2
                          ? "bg-emerald-500 text-zinc-950"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      2
                    </span>
                    <div className="flex-1 text-xs">
                      <span className="font-semibold text-white">
                        Scroll down and tap
                      </span>{" "}
                      <span className="font-bold text-emerald-400">
                        &quot;Add to Home Screen&quot;
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-zinc-800/90 border border-zinc-700 text-emerald-400">
                      <PlusSquare className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  onClick={() => setActiveStep(3)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeStep === 3
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-md shadow-emerald-500/5"
                      : "bg-zinc-900/50 border-zinc-800/80 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        activeStep === 3
                          ? "bg-emerald-500 text-zinc-950"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      3
                    </span>
                    <div className="flex-1 text-xs">
                      <span className="font-semibold text-white">
                        Tap &quot;Add&quot; in the top-right corner
                      </span>{" "}
                      <span className="text-zinc-300">to complete setup.</span>
                    </div>
                    <Badge className="bg-emerald-500 text-zinc-950 text-[10px] font-extrabold px-2 py-0.5 rounded">
                      Add
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bouncing Guidance Pointer pointing to the bottom toolbar */}
              <div className="flex flex-col items-center justify-center pt-2 text-center">
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center gap-1 text-emerald-400"
                >
                  <span className="text-[11px] font-bold tracking-wide uppercase">
                    Tap Share button below
                  </span>
                  <div className="p-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                    <ArrowDown className="size-4 animate-pulse" />
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="flex-1 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl h-11"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleDismiss}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl h-11 shadow-lg shadow-emerald-500/20"
            >
              Got It!
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
