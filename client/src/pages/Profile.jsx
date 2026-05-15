import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";
import { SkeletonCard, SkeletonStat } from "../components/Skeleton.jsx";

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
          stroke="#1E1E2E"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#22D3EE"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-lg font-bold text-[#22D3EE]">{score}</span>
        <span className="text-[10px] uppercase text-slate-500">pts</span>
      </div>
    </div>
  );
}

function AvatarCircle({ name }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#22D3EE] text-2xl font-bold text-white shadow-lg">
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
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <header className="border-b border-[#1E1E2E] bg-[#13131A]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-300">
              ← Dashboard
            </Link>
          </div>
          <h1 className="font-display text-lg font-semibold text-slate-50">Creator Profile</h1>
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Identity card */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-8 text-center sm:flex-row sm:text-left animate-fade-in-up">
          <AvatarCircle name={user?.name} />
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-slate-50">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <ScoreRing score={user?.creatorScore ?? 0} />
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {[
            { label: "Polls Created", value: user?.pollsCreated ?? 0 },
            { label: "Total Responses", value: user?.totalResponsesCollected ?? 0 },
            { label: "Published", value: publishedCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4 text-center">
              <p className="text-xs uppercase text-slate-500">{stat.label}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-50">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <section className="mt-6 rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="font-display text-sm font-semibold text-slate-200">Badges</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {user?.badges?.length > 0 ? (
              user.badges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/5 px-4 py-2"
                >
                  <span className="text-lg">{BADGE_ICONS[badge] ?? "🏆"}</span>
                  <span className="text-sm font-medium text-[#22D3EE]">{badge}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No badges yet — keep creating and collecting responses!</p>
            )}
          </div>
        </section>

        {/* Polls */}
        <section className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <h3 className="font-display text-sm font-semibold text-slate-200 mb-4">Your Polls</h3>
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : polls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1E1E2E] p-8 text-center">
              <p className="text-sm text-slate-500">No polls yet.</p>
              <Link to="/polls/new" className="mt-3 inline-block text-sm text-[#22D3EE] hover:underline">
                Create your first poll →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {polls.map((poll) => (
                <div key={poll._id} className="flex items-center justify-between rounded-xl border border-[#1E1E2E] bg-[#13131A] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{poll.title}</p>
                    <p className="text-xs text-slate-500">/{poll.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs uppercase ${poll.status === "published" ? "text-[#10B981]" : "text-slate-500"}`}>
                      {poll.status}
                    </span>
                    <Link
                      to={`/polls/${poll._id}/analytics`}
                      className="text-xs text-[#22D3EE] hover:underline"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
