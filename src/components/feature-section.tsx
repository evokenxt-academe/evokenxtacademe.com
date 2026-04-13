"use client";

import { useEffect, useRef, useState } from "react";

/* ──────────────── data ──────────────── */

const instructors = [
    {
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        name: "Alex",
    },
    {
        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
        name: "James",
    },
    {
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        name: "Sarah",
    },
    {
        img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
        name: "Michael",
        bg: "#e8daf5",
    },
    {
        img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
        name: "David",
    },
    {
        img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face",
        name: "Tom",
    },
];

const roles = [
    "Logo designers",
    "Web developers",
    "SEO experts",
    "UX designers",
    "Data analysts",
    "Content writers",
];

const categories = [
    { label: "UI/UX", count: "12 courses", type: "palette" },
    { label: "Development", count: "23 courses", type: "code" },
    { label: "Marketing", count: "08 courses", type: "briefcase" },
    { label: "Development", count: "15 courses", type: "code" },
    { label: "Data Analytics", count: "04 courses", type: "chart" },
    { label: "Cyber Security", count: "03 courses", type: "monitor" },
];

/* ──────── category icon SVGs ──────── */

function CategoryIcon({ type }: { type: string }) {
    const iconStyle = {
        width: 18,
        height: 18,
        strokeWidth: 1.5,
        stroke: "currentColor",
        fill: "none",
    };

    switch (type) {
        case "palette":
            return (
                <svg {...iconStyle} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 1 0 20c-1.5 0-3-.5-4-1.5a3 3 0 0 1 0-4.5 2 2 0 0 0-2-3.5A10 10 0 0 1 12 2z" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="13" cy="6" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="17" cy="10" r="1.5" fill="currentColor" stroke="none" />
                </svg>
            );
        case "code":
            return (
                <svg {...iconStyle} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                </svg>
            );
        case "briefcase":
            return (
                <svg {...iconStyle} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
            );
        case "chart":
            return (
                <svg {...iconStyle} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M7 17V13" />
                    <path d="M12 17V9" />
                    <path d="M17 17V11" />
                </svg>
            );
        case "monitor":
            return (
                <svg {...iconStyle} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
            );
        default:
            return null;
    }
}

/* ──────── dotted globe canvas ──────── */

function DottedGlobe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener("resize", resize);

        let rotation = 0;

        const draw = () => {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            ctx.clearRect(0, 0, w, h);

            const cx = w * 0.52;
            const cy = h * 0.48;
            const R = Math.min(w, h) * 0.42;
            const dotSpacing = 7;
            const cols = Math.floor(w / dotSpacing);
            const rows = Math.floor(h / dotSpacing);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = c * dotSpacing + dotSpacing / 2;
                    const y = r * dotSpacing + dotSpacing / 2;

                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > R + 15) continue;

                    const normalDist = dist / R;
                    const depthFade =
                        normalDist < 1
                            ? Math.sqrt(1 - normalDist * normalDist)
                            : 0;

                    const angle = Math.atan2(dy, dx) + rotation;
                    const lonMod = Math.sin(angle * 3) * 0.3 + 0.7;
                    const latMod =
                        Math.cos((dy / R) * Math.PI) * 0.3 + 0.7;

                    const continentNoise =
                        Math.sin(x * 0.04 + rotation * 30 + y * 0.03) *
                        Math.cos(y * 0.05 - x * 0.02) *
                        lonMod *
                        latMod;

                    const isContinentDot =
                        continentNoise > 0.1 && normalDist < 1;

                    if (normalDist < 1) {
                        const alpha = isContinentDot
                            ? 0.18 + depthFade * 0.28
                            : 0.03 + depthFade * 0.04;
                        const radius = isContinentDot ? 1.2 : 0.7;

                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(150, 150, 150, ${alpha})`;
                        ctx.fill();
                    }
                }
            }

            /* Orange highlighted markers */
            const markers = [
                { lat: 0.15, lon: 0.5 },
                { lat: -0.25, lon: 0.35 },
                { lat: 0.35, lon: -0.12 },
            ];

            markers.forEach((m) => {
                const mx = cx + m.lon * R;
                const my = cy + m.lat * R;
                const mDist =
                    Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) / R;
                if (mDist < 0.95) {
                    // Outer glow
                    ctx.beginPath();
                    ctx.arc(mx, my, 12, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255, 130, 40, 0.10)";
                    ctx.fill();

                    // Mid ring
                    ctx.beginPath();
                    ctx.arc(mx, my, 6, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255, 120, 30, 0.55)";
                    ctx.fill();

                    // Core dot
                    ctx.beginPath();
                    ctx.arc(mx, my, 3, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255, 100, 0, 1)";
                    ctx.fill();
                }
            });

            rotation += 0.0006;
            frameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(frameRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
        />
    );
}

/* ──────── scrolling role tags ──────── */

function RoleTicker() {
    return (
        <div className="features-ticker-wrap">
            {/* Fade edges */}
            <div className="features-ticker-fade features-ticker-fade--left" />
            <div className="features-ticker-fade features-ticker-fade--right" />

            <div className="features-ticker-track">
                {[...roles, ...roles].map((role, i) => (
                    <span key={`${role}-${i}`} className="features-role-badge">
                        {role}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ──────── rocket illustration ──────── */

function RocketIllustration() {
    return (
        <div className="features-rocket-wrap">
            {/* Decorative dots / lines */}
            <svg
                className="features-rocket-deco"
                viewBox="0 0 200 60"
                fill="none"
            >
                {/* dotted arc line */}
                <path
                    d="M20 50 C60 10, 140 10, 180 50"
                    stroke="#d0d5dd"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    fill="none"
                />
                {/* small circles along the arc */}
                <circle cx="40" cy="28" r="2" fill="#d0d5dd" />
                <circle cx="100" cy="12" r="2.5" fill="#c0c5d0" />
                <circle cx="160" cy="28" r="2" fill="#d0d5dd" />
            </svg>
            {/* Rocket emoji */}
            <span className="features-rocket-emoji">🚀</span>
        </div>
    );
}

/* ──────── main section ──────── */

export function FeaturesSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.08 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="features"
            ref={sectionRef}
            className="features-section"
        >
            <div className="features-container">
                {/* ── Section header ── */}
                <div
                    className={`features-header ${
                        isVisible ? "features-visible" : "features-hidden"
                    }`}
                >
                    <span className="features-label">Benefits</span>
                    <h2 className="features-title">
                        How Our Learning Platform
                        <br />
                        Helps You
                    </h2>
                    <p className="features-subtitle">
                        It&apos;s designed to make learning simple, structured,
                        and effective so you can focus on progress, not
                        complexity.
                    </p>
                </div>

                {/* ── Bento grid — 3 columns ── */}
                <div className="features-grid">
                    {/* ━━━ Column 1: Trusted Instructors ━━━ */}
                    <div
                        className={`features-card features-card--instructors ${
                            isVisible ? "features-visible" : "features-hidden"
                        }`}
                    >
                        <h3 className="features-card-title">
                            Learn from Trusted Instructors
                        </h3>
                        <p className="features-card-desc">
                            Access courses created by experienced professionals
                            and educators, ensuring structured content and
                            practical learning.
                        </p>

                        {/* Avatar grid 3×2 */}
                        <div className="features-avatar-grid">
                            {instructors.map((inst, i) => (
                                <div
                                    key={i}
                                    className="features-avatar-cell"
                                    style={
                                        inst.bg
                                            ? { backgroundColor: inst.bg }
                                            : undefined
                                    }
                                >
                                    {inst.img ? (
                                        <img
                                            src={inst.img}
                                            alt={inst.name}
                                            className="features-avatar-img"
                                            loading="lazy"
                                        />
                                    ) : null}
                                </div>
                            ))}
                        </div>

                        {/* Role ticker */}
                        <RoleTicker />
                    </div>

                    {/* ━━━ Column 2: Middle column ━━━ */}
                    <div className="features-col-middle">
                        {/* Rocket card */}
                        <div
                            className={`features-card features-card--rocket ${
                                isVisible
                                    ? "features-visible features-delay-1"
                                    : "features-hidden"
                            }`}
                        >
                            <RocketIllustration />
                            <h3 className="features-card-title">
                                Learn Faster, Stay Consistent
                            </h3>
                            <p className="features-card-desc">
                                Follow a guided learning flow with bite sized
                                lessons, clear objectives, and progress driven
                                content that helps you stay motivated.
                            </p>
                        </div>

                        {/* Categories card */}
                        <div
                            className={`features-card features-card--categories ${
                                isVisible
                                    ? "features-visible features-delay-2"
                                    : "features-hidden"
                            }`}
                        >
                            <div className="features-categories-grid">
                                {categories.map((cat, i) => (
                                    <div
                                        key={`${cat.label}-${i}`}
                                        className="features-category-pill"
                                    >
                                        <span className="features-category-icon">
                                            <CategoryIcon type={cat.type} />
                                        </span>
                                        <div className="features-category-text">
                                            <span className="features-category-label">
                                                {cat.label}
                                            </span>
                                            <span className="features-category-count">
                                                {cat.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Learning Progress card */}
                        <div
                            className={`features-card features-card--progress ${
                                isVisible
                                    ? "features-visible features-delay-3"
                                    : "features-hidden"
                            }`}
                        >
                            <h3 className="features-card-title">
                                Learning Progress
                            </h3>
                            <p className="features-card-desc">
                                Enhance productivity through task-based
                                learning, enabling you to learn in a structured
                                way and reach your full potential effectively.
                            </p>
                        </div>
                    </div>

                    {/* ━━━ Column 3: Learn Anywhere + Globe ━━━ */}
                    <div
                        className={`features-card features-card--globe ${
                            isVisible
                                ? "features-visible features-delay-2"
                                : "features-hidden"
                        }`}
                    >
                        <h3 className="features-card-title">
                            Learn Anytime, Anywhere
                        </h3>
                        <p className="features-card-desc">
                            Study at your own pace with flexible access to
                            courses from any device, wherever you are in the
                            world.
                        </p>
                        <div className="features-globe-area">
                            <DottedGlobe />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Scoped styles ── */}
            <style jsx>{`
                /* ── Section ── */
                .features-section {
                    position: relative;
                    padding: 6rem 0 7rem;
                    overflow: hidden;
                    background: #f7f8fa;
                }

                .features-container {
                    max-width: 1320px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                /* ── Header ── */
                .features-header {
                    max-width: 640px;
                    margin-bottom: 3.5rem;
                    transition: all 0.9s cubic-bezier(0.22, 1, 0.36, 1);
                }

                .features-label {
                    display: inline-block;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: #888;
                    margin-bottom: 1rem;
                    font-family: var(--font-mono, monospace);
                }

                .features-title {
                    font-size: clamp(1.75rem, 4vw, 2.75rem);
                    font-weight: 600;
                    line-height: 1.15;
                    letter-spacing: -0.02em;
                    margin: 0 0 1rem;
                    color: #111;
                }

                .features-subtitle {
                    font-size: 1rem;
                    color: #666;
                    line-height: 1.65;
                    margin: 0;
                }

                /* ── Grid ── */
                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                @media (min-width: 1024px) {
                    .features-grid {
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 1.1rem;
                    }
                }

                /* ── Cards ── */
                .features-card {
                    background: #fff;
                    border-radius: 1rem;
                    padding: 1.75rem;
                    transition: all 0.7s cubic-bezier(0.22, 1, 0.36, 1);
                    border: 1px solid rgba(0, 0, 0, 0.04);
                }

                .features-card-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                    color: #111;
                    margin: 0 0 0.5rem;
                    line-height: 1.35;
                }

                .features-card-desc {
                    font-size: 0.875rem;
                    color: #777;
                    line-height: 1.65;
                    margin: 0 0 1.25rem;
                }

                /* ── Visibility animation ── */
                .features-visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .features-hidden {
                    opacity: 0;
                    transform: translateY(24px);
                }

                .features-delay-1 {
                    transition-delay: 0.1s;
                }
                .features-delay-2 {
                    transition-delay: 0.2s;
                }
                .features-delay-3 {
                    transition-delay: 0.3s;
                }

                /* ── Instructors card ── */
                .features-card--instructors {
                    display: flex;
                    flex-direction: column;
                }

                .features-avatar-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.6rem;
                    margin-bottom: 1.25rem;
                    flex: 1;
                }

                .features-avatar-cell {
                    aspect-ratio: 1;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    background: #f0f0f0;
                }

                .features-avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    filter: grayscale(20%);
                    transition: filter 0.3s ease;
                }

                .features-avatar-cell:hover .features-avatar-img {
                    filter: grayscale(0%);
                }

                /* ── Role ticker ── */
                .features-ticker-wrap {
                    position: relative;
                    overflow: hidden;
                    padding: 0.25rem 0;
                }

                .features-ticker-fade {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 2.5rem;
                    z-index: 2;
                    pointer-events: none;
                }

                .features-ticker-fade--left {
                    left: 0;
                    background: linear-gradient(
                        to right,
                        #fff,
                        transparent
                    );
                }

                .features-ticker-fade--right {
                    right: 0;
                    background: linear-gradient(
                        to left,
                        #fff,
                        transparent
                    );
                }

                .features-ticker-track {
                    display: flex;
                    gap: 0.5rem;
                    animation: ticker-scroll 18s linear infinite;
                }

                .features-role-badge {
                    flex-shrink: 0;
                    padding: 0.35rem 0.85rem;
                    border-radius: 999px;
                    border: 1px solid #e2e5ea;
                    font-size: 0.78rem;
                    color: #666;
                    white-space: nowrap;
                    background: #fff;
                }

                @keyframes ticker-scroll {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                /* ── Middle column ── */
                .features-col-middle {
                    display: flex;
                    flex-direction: column;
                    gap: 1.1rem;
                }

                /* ── Rocket illustration ── */
                .features-card--rocket {
                    text-align: left;
                }

                .features-rocket-wrap {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 1rem;
                    height: 70px;
                }

                .features-rocket-deco {
                    width: 160px;
                    height: 50px;
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .features-rocket-emoji {
                    font-size: 2.2rem;
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%) rotate(-25deg);
                }

                /* ── Categories ── */
                .features-card--categories {
                    padding: 1.25rem;
                }

                .features-categories-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                }

                .features-category-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 0.75rem;
                    border-radius: 0.6rem;
                    border: 1px solid #eaedf2;
                    background: #fff;
                    cursor: default;
                    transition: background 0.2s ease;
                }

                .features-category-pill:hover {
                    background: #f5f6f8;
                }

                .features-category-icon {
                    color: #888;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                }

                .features-category-text {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .features-category-label {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #333;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .features-category-count {
                    font-size: 0.7rem;
                    color: #999;
                    line-height: 1.3;
                }

                /* ── Learning Progress ── */
                .features-card--progress .features-card-desc {
                    margin-bottom: 0;
                }

                /* ── Globe card ── */
                .features-card--globe {
                    display: flex;
                    flex-direction: column;
                }

                .features-globe-area {
                    flex: 1;
                    min-height: 250px;
                    position: relative;
                    border-radius: 0.75rem;
                    overflow: hidden;
                }

                /* ── Responsive ── */
                @media (max-width: 767px) {
                    .features-section {
                        padding: 3.5rem 0 4rem;
                    }

                    .features-header {
                        margin-bottom: 2rem;
                    }

                    .features-card {
                        padding: 1.5rem;
                    }

                    .features-categories-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .features-globe-area {
                        min-height: 220px;
                    }
                }

                @media (min-width: 768px) and (max-width: 1023px) {
                    .features-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .features-card--globe {
                        grid-column: 1 / -1;
                    }
                }
            `}</style>
        </section>
    );
}
