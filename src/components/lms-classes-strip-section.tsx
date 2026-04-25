const lmsStats = [
  { id: 1, value: "92%", label: "ACCA Pass Rate", avatar: "https://i.pravatar.cc/100?img=24" },
  { id: 2, value: "150+", label: "Global Mentors", avatar: "https://i.pravatar.cc/100?img=31" },
  { id: 3, value: "500K+", label: "Learning Hours", avatar: "https://i.pravatar.cc/100?img=12" },
  { id: 4, value: "25+", label: "Countries Reached", avatar: "https://i.pravatar.cc/100?img=47" },
  { id: 5, value: "AI-DRIVEN", label: "Learning Path", avatar: "✨" },
];

export function LmsClassesStripSection() {
  const marqueeItems = [...lmsStats, ...lmsStats];

  return (
    <section
      style={{
        padding: "20px 0 84px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%" }}>
        <div
          className="lms-strip-wrap"
          style={{
            marginTop: "0",
            transform: "none",
            borderRadius: "0",
            background:
              "linear-gradient(95deg, #4F46E5 0%, #4F5DF2 38%, #5C6CFA 70%, #4F46E5 100%)",
            borderTop: "1px solid rgba(255,255,255,0.3)",
            borderBottom: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 18px 42px -28px rgba(37, 99, 235, 0.58)",
            padding: "14px 0",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.22,
              backgroundImage:
                "radial-gradient(circle at 12% 35%, #FFFFFF 0px, transparent 65px), radial-gradient(circle at 82% 70%, #FFFFFF 0px, transparent 75px)",
              pointerEvents: "none",
            }}
          />

          <div
            className="lms-marquee-track"
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
              width: "max-content",
              animation: "lms-marquee 22s linear infinite",
              padding: "0 16px",
            }}
          >
            {marqueeItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                style={{
                  borderRadius: "0",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 16px 6px 8px",
                  minHeight: "44px",
                  minWidth: "200px",
                }}
              >
                {item.avatar.startsWith('http') ? (
                  <img
                    src={item.avatar}
                    alt={item.label}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.9)",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                    border: "2px solid rgba(255,255,255,0.9)",
                  }}>
                    {item.avatar}
                  </div>
                )}
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: "18px",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    {item.value}
                  </p>
                  <p
                    style={{
                      margin: "1px 0 0",
                      color: "rgba(255,255,255,0.82)",
                      fontWeight: 500,
                      fontSize: "11px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lms-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 7px));
          }
        }

        .lms-strip-wrap:hover .lms-marquee-track {
          animation-play-state: paused;
        }

        @media (max-width: 960px) {
          .lms-strip-wrap {
            transform: none !important;
          }
          .lms-marquee-track > div {
            min-width: 280px !important;
          }
        }

        @media (max-width: 680px) {
          .lms-strip-wrap {
            transform: none !important;
            border-radius: 0 !important;
          }
          .lms-marquee-track {
            animation-duration: 18s !important;
            gap: 10px !important;
            padding: 0 10px !important;
          }
          .lms-marquee-track > div {
            min-width: 250px !important;
            min-height: 58px !important;
          }
          .lms-marquee-track p:first-child {
            font-size: 28px !important;
          }
          .lms-marquee-track p:last-child {
            font-size: 14px !important;
          }
        }
      `}</style>
    </section>
  );
}
