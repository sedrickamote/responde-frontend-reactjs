export default function About() {
  return (
    <section
      id="about"
      className="min-h-[80vh] flex flex-col justify-center px-6 py-24 bg-[#111625] border-b border-slate-800 text-slate-100"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/50 border border-sky-800/60 rounded-full">
          Placeholder Section
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          About
        </h2>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          RESPONDE is designed to empower barangay officials and residents with immediate reporting tools and incident tracking. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-semibold text-lg text-white mb-2">Our Mission</h3>
            <p className="text-sm text-slate-400">
              Provide real-time dispatch and seamless citizen communication during critical incidents and calamities.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-semibold text-lg text-white mb-2">Community First</h3>
            <p className="text-sm text-slate-400">
              Ensuring every household has accessible, direct lines to local emergency personnel and automated alerts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
