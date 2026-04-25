"use client";

const studentFeedback = [
  {
    name: "Ayesha Khan",
    role: "ACCA Skill Level",
    avatar: "https://i.pravatar.cc/100?u=ayesha",
    review:
      "The LMS made my preparation structured and stress-free. Mock tests, recordings, and mentor support helped me clear PM1 confidently.",
  },
  {
    name: "Hamza Ali",
    role: "Financial Reporting",
    avatar: "https://i.pravatar.cc/100?u=hamza",
    review:
      "I could track progress weekly and focus on weak topics quickly. The platform quality and tutor guidance feel truly premium.",
  },
  {
    name: "Rida Noor",
    role: "Business & Technology",
    avatar: "https://i.pravatar.cc/100?u=rida",
    review:
      "Classes are easy to follow, and every lecture has practical examples. The LMS dashboard keeps everything in one place.",
  },
  {
    name: "Usman Tariq",
    role: "Audit & Assurance",
    avatar: "https://i.pravatar.cc/100?u=usman",
    review:
      "The doubt-solving workflow is excellent. I posted questions anytime and got clear, quick responses from mentors.",
  },
  {
    name: "Sana Iqbal",
    role: "Management Accounting",
    avatar: "https://i.pravatar.cc/100?u=sana",
    review:
      "The learning journey feels professional from start to finish. Progress analytics and topic-wise quizzes are very useful.",
  },
  {
    name: "Bilal Ahmed",
    role: "Financial Accounting",
    avatar: "https://i.pravatar.cc/100?u=bilal",
    review:
      "Recorded lectures and revision notes saved me during exams. I improved speed and accuracy in a few weeks.",
  },
];

const StarRow = () => (
  <div style={{ display: "inline-flex", gap: "4px", marginBottom: "14px" }}>
    {Array.from({ length: 5 }).map((_, index) => (
      <span key={index} style={{ color: "#6366F1", fontSize: "12px", lineHeight: 1 }}>
        ★
      </span>
    ))}
  </div>
);

const FeedbackCard = ({ item }: { item: (typeof studentFeedback)[number] }) => (
  <article
    style={{
      width: "320px",
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: "12px",
      padding: "18px",
      boxShadow: "0 10px 24px -20px rgba(15, 23, 42, 0.4)",
      flexShrink: 0,
    }}
  >
    <StarRow />
    <p
      style={{
        margin: "0 0 16px",
        color: "#475569",
        fontSize: "13px",
        lineHeight: 1.7,
        minHeight: "88px",
      }}
    >
      {item.review}
    </p>
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <img
        src={item.avatar}
        alt={item.name}
        style={{ width: "30px", height: "30px", borderRadius: "999px", objectFit: "cover" }}
      />
      <div>
        <p style={{ margin: 0, color: "#0F172A", fontSize: "13px", fontWeight: 700 }}>{item.name}</p>
        <p style={{ margin: "2px 0 0", color: "#64748B", fontSize: "11px" }}>{item.role}</p>
      </div>
    </div>
  </article>
);

export function TestimonialsSection() {
  const rowOne = [...studentFeedback, ...studentFeedback];
  const rowTwo = [...studentFeedback.slice().reverse(), ...studentFeedback.slice().reverse()];

  return (
    <>
      <style>{`
        .feedback-track {
          display: flex;
          gap: 18px;
          width: max-content;
        }
        .feedback-track-forward {
          animation: feedback-marquee 42s linear infinite;
        }
        .feedback-track-reverse {
          animation: feedback-marquee-reverse 44s linear infinite;
        }
        .feedback-window:hover .feedback-track-forward,
        .feedback-window:hover .feedback-track-reverse {
          animation-play-state: paused;
        }
        @keyframes feedback-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes feedback-marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .feedback-track-forward,
          .feedback-track-reverse {
            animation-duration: 34s;
          }
        }
      `}</style>

      <section
        style={{
          backgroundColor: "transparent",
          padding: "96px 0",
          borderTop: "1px solid #E2E8F0",
          overflow: "hidden",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <p style={{ margin: "0 0 10px", color: "#64748B", fontSize: "13px", fontWeight: 700 }}>
              Our Testimonial
            </p>
            <h2
              style={{
                margin: 0,
                color: "#0F172A",
                fontSize: "clamp(30px, 4vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              LMS Students Feedback
            </h2>
          </div>

          <div className="feedback-window" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="feedback-track feedback-track-forward">
              {rowOne.map((item, index) => (
                <FeedbackCard key={`top-${item.name}-${index}`} item={item} />
              ))}
            </div>
            <div className="feedback-track feedback-track-reverse">
              {rowTwo.map((item, index) => (
                <FeedbackCard key={`bottom-${item.name}-${index}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
