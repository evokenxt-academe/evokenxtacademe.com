"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { IconBrandWhatsapp } from "@tabler/icons-react";

export function WhatsAppFloat() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Hide on dashboard, admin, and learn routes
  const shouldHide =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/learn");

  useEffect(() => {
    if (shouldHide) return;

    // Show the button after a short scroll (100px) so it doesn't appear instantly
    const handleScroll = () => {
      setVisible(window.scrollY > 100);
    };

    // Also show after 2 seconds even without scroll
    const timer = setTimeout(() => setVisible(true), 2000);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // check initial position

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [shouldHide]);

  if (shouldHide) return null;

  return (
    <>
      <style>{`
        @keyframes whatsapp-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); }
          50% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); }
        }
      `}</style>

      <a
        href="https://wa.me/" // ← Replace with your WhatsApp number like https://wa.me/919876543210
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={`
          fixed z-50 bottom-24 sm:bottom-8 right-5 sm:right-6
          size-14 rounded-full
          bg-[#25D366] hover:bg-[#20BD5A]
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          transition-all duration-500 ease-out
          hover:scale-110
          ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"}
        `}
        style={{
          animation: visible
            ? "whatsapp-pulse 2.5s ease-in-out infinite"
            : "none",
        }}
      >
        <IconBrandWhatsapp className="size-7 text-white" stroke={1.75} />
      </a>
    </>
  );
}
