"use client";
import { useRef } from "react";

interface Feature {
    id: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    tag: string;
}

const IconLiveClasses = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
);

const IconCoursePlanner = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeWidth="2.4" />
    </svg>
);

const IconVirtualClass = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M9 10l2 2 4-4" />
    </svg>
);

const IconPerformance = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18M5 20V14M9 20V8M13 20v-5M17 20V4" />
        <path d="M17 4l-4 5-4-3-4 4" />
    </svg>
);

const IconLibrary = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <path d="M9 7h7M9 11h5" />
    </svg>
);

const IconCertificate = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="4" />
        <path d="M9.5 13.5L7 22l5-2 5 2-2.5-8.5" />
        <path d="M10.5 9l1 1L14 7.5" />
    </svg>
);

const IconDoubt = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M12 8c0-1 .667-1.5 1-1.5a1.5 1.5 0 010 3c-.5 0-1 .448-1 1v.5" strokeWidth="1.7" />
        <circle cx="12" cy="14" r=".6" fill="currentColor" stroke="none" />
    </svg>
);

const IconPace = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 3.5" />
    </svg>
);

const features: Feature[] = [
    { id: 1, icon: <IconLiveClasses />, title: "Live Classes", description: "Interactive sessions with real-time doubt resolution and expert-led instruction.", tag: "Live" },
    { id: 2, icon: <IconCoursePlanner />, title: "Course Planner", description: "Smart scheduling tools to keep your learning structured and entirely stress-free.", tag: "Organised" },
    { id: 3, icon: <IconVirtualClass />, title: "Virtual Classrooms", description: "Immersive digital environments built for focused, high-quality collaborative learning.", tag: "Immersive" },
    { id: 4, icon: <IconPerformance />, title: "Performance Tracking", description: "Granular analytics to surface strengths, pinpoint gaps, and drive measurable progress.", tag: "Analytics" },
    { id: 5, icon: <IconLibrary />, title: "Resource Library", description: "Curated notes, references, and materials available on-demand at any time.", tag: "On-demand" },
    { id: 6, icon: <IconCertificate />, title: "Certifications", description: "Industry-recognised credentials issued automatically upon successful completion.", tag: "Verified" },
    { id: 7, icon: <IconDoubt />, title: "Doubt Support", description: "Round-the-clock mentor access to resolve queries without breaking your momentum.", tag: "24 / 7" },
    { id: 8, icon: <IconPace />, title: "Self-Paced Learning", description: "Lifetime access to all recorded sessions so you learn entirely on your own terms.", tag: "Flexible" },
];

const FeatureCard = ({ feature }: { feature: Feature }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={cardRef}
            style={{
                minWidth: "280px",
                maxWidth: "280px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "4px",
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                transition: "all 0.25s ease",
                cursor: "default",
                flexShrink: 0,
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#94A3B8";
                el.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.05)";
                el.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#E2E8F0";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#0F172A",
                        flexShrink: 0,
                    }}
                >
                    {feature.icon}
                </div>
                <span
                    style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#64748B",
                    }}
                >
                    {feature.tag}
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3
                    style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#0F172A",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.4,
                        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    }}
                >
                    {feature.title}
                </h3>
                <p
                    style={{
                        margin: 0,
                        fontSize: "13.5px",
                        color: "#475569",
                        lineHeight: 1.6,
                        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    }}
                >
                    {feature.description}
                </p>
            </div>
        </div>
    );
};

export function FeaturesSection() {
    const trackRef = useRef<HTMLDivElement>(null);
    const duplicated = [...features, ...features];

    return (
        <section
            style={{
                width: "100%",
                backgroundColor: "transparent",
                padding: "80px 0 96px",
                overflow: "hidden",
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                borderTop: "1px solid #E2E8F0",
                borderBottom: "1px solid #E2E8F0",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "64px", padding: "0 24px" }}>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "24px",
                    }}
                >
                    <span style={{ width: "24px", height: "1px", background: "#0F172A", display: "inline-block" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748B" }}>
                        Platform Capabilities
                    </span>
                    <span style={{ width: "24px", height: "1px", background: "#0F172A", display: "inline-block" }} />
                </div>

                <h2
                    style={{
                        margin: "0 0 16px",
                        fontSize: "clamp(28px, 4vw, 42px)",
                        fontWeight: 600,
                        color: "#0F172A",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                    }}
                >
                    Everything you need to learn smarter.
                </h2>
                <p
                    style={{
                        margin: "0 auto",
                        maxWidth: "540px",
                        fontSize: "15px",
                        color: "#475569",
                        lineHeight: 1.6,
                    }}
                >
                    A complete, enterprise-grade learning platform built for serious educators and high-performing students.
                </p>
            </div>

            <div style={{ position: "relative" }}>
                <div
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        top: 0, bottom: 0, left: 0,
                        width: "180px",
                        background: "linear-gradient(to right, #F8FAFC 0%, transparent 100%)",
                        zIndex: 10,
                    }}
                />
                <div
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        top: 0, bottom: 0, right: 0,
                        width: "180px",
                        background: "linear-gradient(to left, #F8FAFC 0%, transparent 100%)",
                        zIndex: 10,
                    }}
                />

                <div
                    ref={trackRef}
                    style={{
                        display: "flex",
                        gap: "24px",
                        width: "max-content",
                        paddingLeft: "24px",
                        animation: "lms-scroll 50s linear infinite",
                    }}
                    onMouseEnter={() => {
                        if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
                    }}
                    onMouseLeave={() => {
                        if (trackRef.current) trackRef.current.style.animationPlayState = "running";
                    }}
                >
                    {duplicated.map((f, i) => (
                        <FeatureCard key={`${f.id}-${i}`} feature={f} />
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes lms-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </section>
    );
}