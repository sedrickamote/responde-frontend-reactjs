export default function Footer() {
  return (
    <footer
      id="footer"
      className="px-6 py-16 bg-[#080B11] border-t border-slate-800 text-slate-400"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-white tracking-wide">Footer</h4>
          <p className="text-sm text-slate-500 mt-1">
            RESPONDE • Barangay Emergency Incident Reporting System
          </p>
        </div>
        <p className="text-xs text-slate-600 text-center md:text-right">
          © {new Date().getFullYear()} RESPONDE. All rights reserved. Temporary placeholder footer.
        </p>
      </div>
    </footer>
  );
}
