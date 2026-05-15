import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";
import { SkeletonCard } from "../components/Skeleton.jsx";

const BADGE_ICONS = {
  "First Poll": "🎯",
  "Viral": "🔥",
  "Data Wizard": "📊",
  "Speed Runner": "⚡",
};

function ScoreRing({ score, max = 1000 }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-lg font-bold text-[var(--primary)]">{score}</span>
        <span className="text-[10px] uppercase text-[var(--text-muted)]">pts</span>
      </div>
    </div>
  );
}

function AvatarCircle({ name }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] text-2xl font-bold text-white shadow-lg">
      {initials}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/api/polls/my")
      .then((r) => { if (active) setPolls(r.data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const publishedCount = polls.filter((p) => p.status === "published").length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] theme-transition pb-20">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] mb-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-sm font-semibold">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <img src="/pollforge-logo.png" alt="Logo" className="h-6 w-6" />
            <h1 className="font-display text-lg font-bold gradient-text">Creator Profile</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        {/* Identity card */}
        <div className="flex flex-col items-center gap-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center sm:flex-row sm:text-left animate-fade-in-up shadow-sm">
          <AvatarCircle name={user?.name} />
          <div className="flex-1">
            <h2 className="font-display text-3xl font-black">{user?.name}</h2>
            <p className="text-[var(--text-muted)] mt-1">{user?.email}</p>
          </div>
          <ScoreRing score={user?.creatorScore ?? 0} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {[
                { label: "Polls Created", value: user?.pollsCreated ?? 0 },
                { label: "Total Responses", value: user?.totalResponsesCollected ?? 0 },
                { label: "Published", value: publishedCount },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">{stat.label}</p>
                  <p className="mt-3 font-mono text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Polls */}
            <section className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <h3 className="font-display text-xl font-bold mb-6">Recent Activity</h3>
              {loading ? (
                <div className="space-y-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : polls.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center">
                  <p className="text-[var(--text-muted)]">No polls created yet.</p>
                  <Link to="/polls/new" className="mt-4 inline-block text-sm font-bold text-[var(--primary)]">
                    Create your first poll →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {polls.slice(0, 5).map((poll) => (
                    <div key={poll._id} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 shadow-sm">
                      <div>
                        <p className="font-bold text-sm">{poll.title}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">/{poll.slug}</p>
                      </div>
                      <Link
                        to={`/polls/${poll._id}/analytics`}
                        className="text-xs font-bold text-[var(--primary)] hover:underline"
                      >
                        Results →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </section>

          {/* Badges aside */}
          <aside className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
              <h3 className="font-display text-lg font-bold mb-6">Badges</h3>
              <div className="grid gap-3">
                {user?.badges?.length > 0 ? (
                  user.badges.map((badge) => (
                    <div
                      key={badge}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary-glow)] px-4 py-3"
                    >
                      <span className="text-xl">{BADGE_ICONS[badge] ?? "🏆"}</span>
                      <span className="text-sm font-bold text-[var(--primary)]">{badge}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-muted)] italic">Complete polls to earn badges!</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
