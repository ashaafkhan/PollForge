import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../lib/api.js";
import QRModal from "../components/QRModal.jsx";

const accent = "#22D3EE";
const muted = "#64748B";

export default function Analytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const completion = analytics?.completionRate ?? 0;
  const totalResponses = analytics?.totalResponses ?? 0;
  const pollHealthScore = analytics?.pollHealthScore ?? 0;

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const res = await api.patch(`/api/polls/${id}/publish`);
      setAnalytics((prev) => ({ ...prev, status: res.data.status }));
    } catch (err) {
      console.error("Failed to publish poll", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const participationData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: "Authenticated", value: analytics.authenticatedCount || 0 },
      { name: "Anonymous", value: analytics.anonymousCount || 0 }
    ];
  }, [analytics]);

  const deviceData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: "Desktop", value: analytics.deviceBreakdown?.desktop || 0 },
      { name: "Mobile", value: analytics.deviceBreakdown?.mobile || 0 }
    ];
  }, [analytics]);

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      try {
        const response = await api.get(`/api/polls/${id}/analytics`);
        if (active) {
          setAnalytics(response.data);
        }
      } catch (err) {
        if (active) {
          setError("Failed to load analytics");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!analytics) return undefined;

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      withCredentials: true
    });
    socket.emit("poll:join", id);

    socket.on("response:new", (payload) => {
      setAnalytics((prev) => {
        if (!prev) return prev;
        const nextTotalResponses = payload.totalResponses ?? prev.totalResponses + 1;
        const viewCount = prev.viewCount || 0;
        const completionRate = viewCount
          ? Math.round((nextTotalResponses / viewCount) * 1000) / 10
          : 0;

        const next = {
          ...prev,
          totalResponses: nextTotalResponses,
          completionRate
        };

        const answers = payload.answers || [];
        next.questions = prev.questions.map((question) => {
          const match = answers.find(
            (answer) => String(answer.questionId) === String(question.questionId)
          );
          if (!match) return question;

          const options = question.options.map((option) => {
            if (String(option.optionId) !== String(match.selectedOptionId)) {
              return option;
            }
            return { ...option, count: option.count + 1 };
          });
          const totalAnswered = question.totalAnswered + 1;
          const withPercent = options.map((option) => ({
            ...option,
            percentage: totalAnswered
              ? Math.round((option.count / totalAnswered) * 1000) / 10
              : 0
          }));
          const leadingOption = withPercent.reduce(
            (leader, current) => (current.count > leader.count ? current : leader),
            withPercent[0] || { text: "", count: 0 }
          );
          return {
            ...question,
            options: withPercent,
            totalAnswered,
            skippedCount: Math.max(0, nextTotalResponses - totalAnswered),
            leadingOption: { text: leadingOption.text, count: leadingOption.count }
          };
        });

        if (payload.isAnonymous) {
          next.anonymousCount = (prev.anonymousCount || 0) + 1;
        } else {
          next.authenticatedCount = (prev.authenticatedCount || 0) + 1;
        }

        if (payload.device) {
          next.deviceBreakdown = {
            ...prev.deviceBreakdown,
            [payload.device]: (prev.deviceBreakdown?.[payload.device] || 0) + 1
          };
        }

        if (payload.submittedAt) {
          const key = new Date(payload.submittedAt).toISOString().slice(0, 10);
          const updatedByDay = prev.responsesByDay.map((entry) => ({ ...entry }));
          const existing = updatedByDay.find((entry) => entry.date === key);
          if (existing) {
            existing.count += 1;
          } else {
            updatedByDay.push({ date: key, count: 1 });
            updatedByDay.sort((a, b) => (a.date > b.date ? 1 : -1));
          }
          next.responsesByDay = updatedByDay;
        }

        const nextRecent = [
          {
            id: `${payload.submittedAt || Date.now()}-${nextTotalResponses}`,
            submittedAt: payload.submittedAt || new Date().toISOString(),
            isAnonymous: Boolean(payload.isAnonymous),
            answersCount: answers.length
          },
          ...(prev.recentResponses || [])
        ].slice(0, 5);
        next.recentResponses = nextRecent;

        return next;
      });
    });

    return () => {
      socket.emit("poll:leave", id);
      socket.disconnect();
    };
  }, [analytics, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="animate-shimmer h-7 w-48 rounded" />
              <div className="animate-shimmer h-4 w-64 rounded" />
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4">
                <div className="animate-shimmer h-3 w-20 rounded" />
                <div className="animate-shimmer mt-3 h-7 w-12 rounded" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="animate-shimmer h-72 rounded-2xl border border-[#1E1E2E] lg:col-span-2" />
            <div className="animate-shimmer h-72 rounded-2xl border border-[#1E1E2E]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-5xl px-6 py-10 text-rose-400">{error}</div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-4">
          <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-300">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Analytics</h1>
            <p className="mt-2 text-sm text-slate-400">Live updates as responses arrive.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="rounded-full border border-[#1E1E2E] bg-[#1E1E2E] px-4 py-2 text-sm text-slate-200 hover:bg-[#2A2A3A]"
            >
              Share & QR
            </button>
            {analytics.status === 'active' && (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="rounded-full border border-[#10B981] bg-[#10B981]/10 px-4 py-2 text-sm text-[#10B981] hover:bg-[#10B981]/20"
              >
                {isPublishing ? 'Publishing...' : 'Publish Results'}
              </button>
            )}
            {analytics.status === 'published' && (
              <span className="rounded-full bg-[#10B981]/20 px-4 py-2 text-sm text-[#10B981]">
                Published
              </span>
            )}
            <div className="rounded-full border border-[#1E1E2E] bg-[#13131A] px-4 py-2 text-sm">
              {totalResponses} responses
            </div>
          </div>
        </div>

        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          pollId={id}
          pollSlug={analytics.slug}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4">
            <p className="text-xs uppercase text-slate-500">Total responses</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">{totalResponses}</p>
          </div>
          <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4">
            <p className="text-xs uppercase text-slate-500">View count</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">
              {analytics.viewCount || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4">
            <p className="text-xs uppercase text-slate-500">Completion rate</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">{completion}%</p>
          </div>
          <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4">
            <p className="text-xs uppercase text-slate-500">Avg completion</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">
              {Math.round(analytics.avgCompletionTime || 0)}s
            </p>
          </div>
          <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-4">
            <p className="text-xs uppercase text-slate-500">Poll health</p>
            <p className="mt-2 text-xl font-semibold text-slate-50">{pollHealthScore}</p>
            <div className="mt-3 h-1 rounded-full bg-[#1E1E2E]">
              <div
                className="h-1 rounded-full bg-[#10B981]"
                style={{ width: `${pollHealthScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-200">Responses over time</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.responsesByDay}>
                  <XAxis dataKey="date" tick={{ fill: muted, fontSize: 12 }} />
                  <YAxis tick={{ fill: muted, fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke={accent} fill={accent} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
            <h2 className="text-sm font-semibold text-slate-200">Participation</h2>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={participationData} dataKey="value" innerRadius={40} outerRadius={70}>
                    {participationData.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? accent : "#6366F1"} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
            <h2 className="text-sm font-semibold text-slate-200">Device breakdown</h2>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: muted, fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-200">Recent responses</h2>
            <div className="mt-4 space-y-3">
              {analytics.recentResponses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between rounded-lg border border-[#1E1E2E] bg-[#0F0F15] px-3 py-2 text-xs text-slate-400"
                >
                  <span>
                    {response.isAnonymous ? "Anonymous" : "Authenticated"} • {response.answersCount}
                    {" "}answers
                  </span>
                  <span>{new Date(response.submittedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 space-y-6">
          {analytics.questions.map((question) => (
            <section
              key={question.questionId}
              className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{question.text}</h3>
                  <p className="text-xs text-slate-500">
                    {question.totalAnswered} answered • {question.skippedCount} skipped
                  </p>
                </div>
                <span className="text-xs uppercase text-amber-400">
                  Leading: {question.leadingOption.text || "N/A"}
                </span>
              </div>
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={question.options} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="text" type="category" tick={{ fill: muted, fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={accent} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
