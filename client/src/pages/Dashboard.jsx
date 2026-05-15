import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../lib/api.js";
import NotificationBell from "../components/NotificationBell.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title="Toggle theme"
      className="rounded-full p-2 text-slate-400 hover:bg-[#1E1E2E] hover:text-slate-200 transition-colors"
    >
      {theme === "dark" ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.36-.71.71M6.34 17.66l-.71.71m12.73 0-.71-.71M6.34 6.34l-.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

const STATUS_COLOR = {
  draft: "text-slate-400",
  active: "text-[#22D3EE]",
  expired: "text-amber-400",
  published: "text-[#10B981]",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/api/polls/my")
      .then((r) => { if (active) setPolls(r.data); })
      .catch(() => { if (active) toast.error("Failed to load polls"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const activatePoll = async (pollId) => {
    setActionLoading(pollId);
    try {
      const r = await api.patch(`/api/polls/${pollId}/activate`);
      setPolls((prev) => prev.map((p) => (p._id === pollId ? r.data : p)));
      toast.success("Poll activated!");
    } catch {
      toast.error("Failed to activate poll");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    setDeleteTarget(null);
    const loadingToast = toast.loading(`Deleting "${title}"...`);
    try {
      await api.delete(`/api/polls/${id}`);
      setPolls((prev) => prev.filter((p) => p._id !== id));
      toast.success("Poll deleted", { id: loadingToast });
    } catch {
      toast.error("Failed to delete poll", { id: loadingToast });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete poll?"
        description={`"${deleteTarget?.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      <header className="border-b border-[#1E1E2E] bg-[#13131A]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Creator dashboard</p>
            <h1 className="font-display text-2xl font-bold text-slate-50">
              Welcome back, {user?.name?.split(" ")[0] || "Creator"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <Link
              to="/polls/new"
              className="rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors"
            >
              + New poll
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-[#1E1E2E] px-4 py-2 text-sm text-slate-300 hover:bg-[#1E1E2E] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-3">
        {/* Poll list */}
        <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 md:col-span-2">
          <h2 className="font-display text-lg font-semibold text-slate-50">Your polls</h2>
          {location.state?.createdPoll && (
            <p className="mt-2 text-sm text-emerald-400">
              ✓ Draft created: {location.state.createdPoll.title}
            </p>
          )}

          {loading ? (
            <div className="mt-4 space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : polls.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-[#1E1E2E] py-14 text-center">
              <span className="text-4xl">📊</span>
              <h3 className="mt-4 text-base font-semibold text-slate-300">No polls yet</h3>
              <p className="mt-1 text-sm text-slate-500">Create your first poll and start collecting responses.</p>
              <Link
                to="/polls/new"
                className="mt-4 rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors"
              >
                Create your first poll →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {polls.map((poll) => (
                <div
                  key={poll._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1E1E2E] bg-[#0F0F15] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{poll.title}</p>
                    <p className="text-xs text-slate-500">/{poll.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs uppercase font-medium ${STATUS_COLOR[poll.status] || "text-slate-400"}`}>
                      {poll.status}
                    </span>
                    <Link to={`/polls/${poll._id}/edit`} className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                      Edit
                    </Link>
                    <Link to={`/polls/${poll._id}/analytics`} className="text-xs text-[#22D3EE] hover:underline">
                      Analytics
                    </Link>
                    {poll.status === "draft" && (
                      <button
                        onClick={() => activatePoll(poll._id)}
                        disabled={actionLoading === poll._id}
                        className="text-xs text-[#22D3EE] hover:underline disabled:opacity-50"
                      >
                        {actionLoading === poll._id ? "Activating…" : "Activate"}
                      </button>
                    )}
                    {poll.status === "published" && (
                      <Link to={`/p/${poll.slug}`} className="text-xs text-[#10B981] hover:underline">
                        View Results
                      </Link>
                    )}
                    <button
                      onClick={() => setDeleteTarget({ id: poll._id, title: poll.title })}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Profile aside */}
        <aside className="space-y-4 self-start">
          <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
            <h3 className="font-display text-sm font-semibold text-slate-200">Profile snapshot</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p>Score: <span className="font-mono text-[#22D3EE]">{user?.creatorScore ?? 0}</span></p>
              <p>Polls created: <span className="font-mono">{user?.pollsCreated ?? 0}</span></p>
              <p>Total responses: <span className="font-mono">{user?.totalResponsesCollected ?? 0}</span></p>
            </div>

            <div className="mt-5 border-t border-[#1E1E2E] pt-4">
              <h4 className="text-xs font-semibold uppercase text-slate-500">Badges</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {user?.badges?.length > 0 ? (
                  user.badges.map((badge, i) => (
                    <span key={i} className="rounded bg-[#1E1E2E] px-2 py-1 text-xs text-[#22D3EE]">
                      🏆 {badge}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-600">No badges yet.</p>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              className="mt-5 block text-center text-xs text-slate-500 hover:text-[#22D3EE] transition-colors"
            >
              View full profile →
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
