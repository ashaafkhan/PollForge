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
      className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-main)] transition-colors"
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
  draft: "text-[var(--text-muted)]",
  active: "text-[var(--primary)]",
  expired: "text-amber-500",
  published: "text-emerald-500",
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] theme-transition">
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete poll?"
        description={`"${deleteTarget?.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/pollforge-logo.png" alt="Logo" className="h-8 w-8" />
            <h1 className="font-display text-xl font-bold gradient-text hidden sm:block">PollForge</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
            <Link
              to="/polls/new"
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              + Create Poll
            </Link>
            <div className="h-8 w-px bg-[var(--border)]" />
            <button
              onClick={handleLogout}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        {/* Poll list */}
        <section className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Your Polls</h2>
            <p className="text-sm text-[var(--text-muted)]">{polls.length} total</p>
          </div>

          {location.state?.createdPoll && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-500">
              ✓ Draft created successfully: <strong>{location.state.createdPoll.title}</strong>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : polls.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--border)] py-20 text-center">
              <div className="mb-4 text-5xl opacity-20">📊</div>
              <h3 className="text-lg font-bold">No polls yet</h3>
              <p className="mt-1 text-[var(--text-muted)]">Create your first poll and start collecting insights.</p>
              <Link
                to="/polls/new"
                className="mt-6 rounded-full border border-[var(--primary)] px-6 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
              >
                Create your first poll →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <div
                  key={poll._id}
                  className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 hover:border-[var(--primary)]/30 transition-all shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold">{poll.title}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">/{poll.slug}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] uppercase tracking-widest font-black ${STATUS_COLOR[poll.status] || "text-[var(--text-muted)]"}`}>
                      {poll.status}
                    </span>
                    <div className="h-4 w-px bg-[var(--border)]" />
                    <div className="flex items-center gap-3">
                      <Link to={`/polls/${poll._id}/edit`} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]">
                        Edit
                      </Link>
                      <Link to={`/polls/${poll._id}/analytics`} className="text-sm text-[var(--primary)] font-semibold">
                        Results
                      </Link>
                      {poll.status === "draft" && (
                        <button
                          onClick={() => activatePoll(poll._id)}
                          disabled={actionLoading === poll._id}
                          className="text-sm text-[var(--primary)] hover:underline disabled:opacity-50"
                        >
                          {actionLoading === poll._id ? "..." : "Activate"}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget({ id: poll._id, title: poll.title })}
                        className="text-sm text-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Profile aside */}
        <aside className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
            <h3 className="font-display text-lg font-bold mb-6">Profile Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Creator Score</span>
                <span className="font-mono text-[var(--primary)] font-bold">{user?.creatorScore ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Total Polls</span>
                <span className="font-mono">{user?.pollsCreated ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Responses</span>
                <span className="font-mono">{user?.totalResponsesCollected ?? 0}</span>
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Earned Badges</h4>
              <div className="flex flex-wrap gap-2">
                {user?.badges?.length > 0 ? (
                  user.badges.map((badge, i) => (
                    <span key={i} className="rounded-full bg-[var(--primary-glow)] border border-[var(--primary)]/20 px-3 py-1 text-[10px] text-[var(--primary)] font-bold">
                      🏆 {badge}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic">Participate to earn badges.</p>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              className="mt-8 block text-center text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              View Full Profile →
            </Link>
          </section>
        </aside>
      </main>
    </div>
  );
}
