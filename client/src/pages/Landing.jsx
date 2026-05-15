import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <header className="border-b border-[#1E1E2E] bg-[#13131A]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              PollForge
            </p>
            <h1 className="text-3xl font-semibold text-slate-50">
              Not just polls. Intelligence.
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-full border border-[#1E1E2E] px-4 py-2 text-sm text-slate-200"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE]"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3">
        <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-50">Stage 1 is live</h2>
          <p className="mt-3 text-sm text-slate-400">
            Authentication groundwork, protected routes, and a secure token refresh
            flow are ready to wire into the rest of PollForge.
          </p>
        </section>
        <aside className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
          <h3 className="text-sm font-semibold text-slate-200">Next up</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>Register + login forms</li>
            <li>Creator dashboard shell</li>
            <li>API client + refresh logic</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
