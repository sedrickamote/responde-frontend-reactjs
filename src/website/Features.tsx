export default function Features() {
  return (
    <section
      id="features"
      className="min-h-[85vh] flex flex-col justify-center px-6 py-24 bg-[#0D121F] border-b border-slate-800 text-slate-100"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 rounded-full">
            Placeholder Section
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Features
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Explore key capabilities built for fast response times and neighborhood emergency management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {[
            {
              title: "Instant Reporting",
              desc: "Citizens can report emergencies via web or messenger with automated geo-location and category tagging.",
            },
            {
              title: "Geospatial Dashboard",
              desc: "Barangay responders visualize all active reports on a real-time interactive community map.",
            },
            {
              title: "Automated Notifications",
              desc: "Instant SMS and webhook alerts dispatched to responders and affected zone leaders.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-900/40 text-violet-400 flex items-center justify-center font-bold mb-4 border border-violet-800/50">
                0{idx + 1}
              </div>
              <h3 className="font-semibold text-lg text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
