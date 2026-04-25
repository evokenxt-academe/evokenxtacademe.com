import { FaqSection } from "@/components/faq-section";

export default function ResourcesPage() {
  const bodyTheme = {
    backgroundColor: "#F8FAFC",
    backgroundImage: `
      radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(251, 146, 60, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.12) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(255, 255, 255, 0.8) 0px, transparent 50%)
    `,
  } as const;

  const resources = [
    { title: "ACCA Syllabus Guide", type: "PDF", size: "1.2 MB" },
    { title: "Study Planner 2026", type: "XLSX", size: "450 KB" },
    { title: "Sample Exam Papers", type: "ZIP", size: "5.8 MB" },
    { title: "Student Roadmap", type: "Image", size: "2.1 MB" },
  ];

  return (
    <main className="relative min-h-screen " style={bodyTheme}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 tracking-tight">Learning Resources</h1>
        <p className="text-lg text-slate-600 mb-12 max-w-2xl">
          Everything you need to support your learning journey. From syllabus guides to exam samples, we've got you covered.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            {resources.map((res, i) => (
                <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 18 15 15"></polyline></svg>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{res.title}</h3>
                    <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>{res.type}</span>
                        <span>{res.size}</span>
                    </div>
                </div>
            ))}
        </div>

        <FaqSection />
      </div>
    </main>
  );
}
