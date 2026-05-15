import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <header className="border-b border-[#1E1E2E] bg-[#13131A]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Creator dashboard
            </p>
            <h1 className="text-2xl font-semibold text-slate-50">
              Welcome back, {user?.name || "Creator"}
            </h1>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-[#1E1E2E] px-4 py-2 text-sm text-slate-200"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-3">
        <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-50">Your polls</h2>
          <p className="mt-2 text-sm text-slate-400">
            Stage 2 will bring the poll builder, list, and live status badges here.
          </p>
        </section>
        <aside className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
          <h3 className="text-sm font-semibold text-slate-200">Profile snapshot</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>Score: {user?.creatorScore ?? 0}</p>
            <p>Polls created: {user?.pollsCreated ?? 0}</p>
            <p>Total responses: {user?.totalResponsesCollected ?? 0}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
