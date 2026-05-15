import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-6 text-center">
      <div className="relative select-none">
        <p
          className="font-display text-[160px] font-black leading-none text-[#1E1E2E]"
          style={{ letterSpacing: "-0.05em" }}
        >
          404
        </p>
        <p className="absolute inset-0 font-display text-[160px] font-black leading-none gradient-text opacity-20 blur-sm"
          style={{ letterSpacing: "-0.05em" }}>
          404
        </p>
      </div>

      <h1 className="mt-2 font-display text-2xl font-bold text-slate-50">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="rounded-full border border-[#22D3EE] px-5 py-2.5 text-sm text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          to="/dashboard"
          className="rounded-full border border-[#1E1E2E] px-5 py-2.5 text-sm text-slate-300 hover:bg-[#1E1E2E] transition-colors"
        >
          Dashboard
        </Link>
      </div>

      <div className="mt-16 flex gap-2 text-xs text-slate-600">
        <span>PollForge</span>
        <span>•</span>
        <span>Not just polls. Intelligence.</span>
      </div>
    </div>
  );
}
