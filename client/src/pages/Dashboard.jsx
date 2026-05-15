import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    let active = true;

    const loadPolls = async () => {
      try {
        const response = await api.get("/api/polls/my");
        if (active) {
          setPolls(response.data);
        }
      } catch (err) {
        if (active) {
          setError("Failed to load polls");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPolls();
    return () => {
      active = false;
    };
  }, []);

  const activatePoll = async (pollId) => {
    setActionError("");
    setActionLoading(pollId);
    try {
      const response = await api.patch(`/api/polls/${pollId}/activate`);
      setPolls((prev) => prev.map((poll) => (poll._id === pollId ? response.data : poll)));
    } catch (err) {
      setActionError("Failed to activate poll");
    } finally {
      setActionLoading(null);
    }
  };

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
          <div className="flex items-center gap-3">
            <Link
              to="/polls/new"
              className="rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE]"
            >
              New poll
            </Link>
            <button
              onClick={logout}
              className="rounded-full border border-[#1E1E2E] px-4 py-2 text-sm text-slate-200"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-3">
        <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-50">Your polls</h2>
          {location.state?.createdPoll && (
            <p className="mt-2 text-sm text-emerald-400">
              Draft created: {location.state.createdPoll.title}
            </p>
          )}
          {loading && <p className="mt-4 text-sm text-slate-400">Loading polls...</p>}
          {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
          {actionError && <p className="mt-4 text-sm text-rose-400">{actionError}</p>}
          {!loading && !error && polls.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">
              No polls yet. Create your first draft.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {polls.map((poll) => (
              <div
                key={poll._id}
                className="flex items-center justify-between rounded-xl border border-[#1E1E2E] bg-[#0F0F15] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{poll.title}</p>
                  <p className="text-xs text-slate-500">/{poll.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase text-slate-400">{poll.status}</span>
                  <Link
                    to={`/polls/${poll._id}/edit`}
                    className="text-xs uppercase text-slate-300"
                  >
                    Edit
                  </Link>
                  {poll.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => activatePoll(poll._id)}
                      disabled={actionLoading === poll._id}
                      className="text-xs uppercase text-[#22D3EE]"
                    >
                      {actionLoading === poll._id ? "Activating..." : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
