export default function HeroSection() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-20 bg-[#0B0F17] border-b border-slate-800 text-slate-100"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400 bg-violet-950/50 border border-violet-800/60 rounded-full">
          Placeholder Section
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Hero Section
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Barangay Emergency Incident Reporting System. Fast, reliable response coordination and emergency reporting for community safety. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition">
            Report Incident
          </button>
          <button className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 font-medium border border-slate-700 hover:bg-slate-700 transition">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
