import { Button } from "@/components/ui/button";

export default function ContactPage() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 tracking-tight">Get in Touch</h1>
                <p className="text-lg text-slate-600 mb-8">
                    Have questions about our courses or the ACCA qualification? We're here to help you every step of the way.
                </p>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Phone</h4>
                            <p className="text-slate-600">+91 98765 43210</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Email</h4>
                            <p className="text-slate-600">contact@evokenxt.com</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Location</h4>
                            <p className="text-slate-600">Mumbai, Maharashtra, India</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
                <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">First Name</label>
                            <input className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                            <input className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Doe" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="john@example.com" type="email" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Subject</label>
                        <select className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white">
                            <option>Course Inquiry</option>
                            <option>Fees & Admission</option>
                            <option>Technical Support</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Message</label>
                        <textarea className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-32" placeholder="Tell us how we can help..." />
                    </div>
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all">
                        Send Message
                    </Button>
                </form>
            </div>
        </div>
      </div>
    </main>
  );
}
