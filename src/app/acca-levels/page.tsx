import { HowProcessSection } from "@/components/how-process-section";

export default function AccaLevelsPage() {
  const bodyTheme = {
    backgroundColor: "#F8FAFC",
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(251, 146, 60, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.12) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(255, 255, 255, 0.8) 0px, transparent 50%)
    `,
  } as const;

  return (
    <main className="relative min-h-screen " style={bodyTheme}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 tracking-tight">ACCA Qualification Levels</h1>
        <p className="text-lg text-slate-600 mb-12 max-w-2xl">
          Complete your ACCA journey with our structured approach to all three levels: Applied Knowledge, Applied Skills, and Strategic Professional.
        </p>
        
        <HowProcessSection />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Applied Knowledge</h3>
                <p className="text-slate-600">The first step into the world of finance, covering fundamental accounting techniques and business concepts.</p>
            </div>
            <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Applied Skills</h3>
                <p className="text-slate-600">Building on knowledge with deeper practical application in auditing, taxation, and financial management.</p>
            </div>
            <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Strategic Professional</h3>
                <p className="text-slate-600">The final level focusing on leadership, technical excellence, and professional ethics at a strategic level.</p>
            </div>
        </div>
      </div>
    </main>
  );
}
