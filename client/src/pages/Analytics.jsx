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
        if (active) setAnalytics(response.data);
      } catch (err) {
        if (active) setError("Failed to load analytics");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAnalytics();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!analytics) return undefined;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", { withCredentials: true });
    socket.emit("poll:join", id);

    socket.on("response:new", (payload) => {
      setAnalytics((prev) => {
        if (!prev) return prev;
        const nextTotalResponses = payload.totalResponses ?? prev.totalResponses + 1;
        const viewCount = prev.viewCount || 0;
        const completionRate = viewCount ? Math.round((nextTotalResponses / viewCount) * 1000) / 10 : 0;
        const next = { ...prev, totalResponses: nextTotalResponses, completionRate };
        const answers = payload.answers || [];
        next.questions = prev.questions.map((question) => {
          const match = answers.find(a => String(a.questionId) === String(question.questionId));
          if (!match) return question;
          const options = question.options.map(opt => String(opt.optionId) === String(match.selectedOptionId) ? { ...opt, count: opt.count + 1 } : opt);
          const totalAnswered = question.totalAnswered + 1;
          const withPercent = options.map(opt => ({ ...opt, percentage: totalAnswered ? Math.round((opt.count / totalAnswered) * 1000) / 10 : 0 }));
          const leader = withPercent.reduce((l, c) => (c.count > l.count ? c : l), withPercent[0] || { text: "", count: 0 });
          return { ...question, options: withPercent, totalAnswered, skippedCount: Math.max(0, nextTotalResponses - totalAnswered), leadingOption: { text: leader.text, count: leader.count } };
        });
        if (payload.isAnonymous) next.anonymousCount = (prev.anonymousCount || 0) + 1;
        else next.authenticatedCount = (prev.authenticatedCount || 0) + 1;
        if (payload.device) next.deviceBreakdown = { ...prev.deviceBreakdown, [payload.device]: (prev.deviceBreakdown?.[payload.device] || 0) + 1 };
        if (payload.submittedAt) {
          const key = new Date(payload.submittedAt).toISOString().slice(0, 10);
          const updatedByDay = prev.responsesByDay.map(e => ({ ...e }));
          const existing = updatedByDay.find(e => e.date === key);
          if (existing) existing.count += 1;
          else { updatedByDay.push({ date: key, count: 1 }); updatedByDay.sort((a, b) => a.date > b.date ? 1 : -1); }
          next.responsesByDay = updatedByDay;
        }
        next.recentResponses = [{ id: `${payload.submittedAt || Date.now()}-${nextTotalResponses}`, submittedAt: payload.submittedAt || new Date().toISOString(), isAnonymous: Boolean(payload.isAnonymous), answersCount: answers.length }, ...(prev.recentResponses || [])].slice(0, 5);
        return next;
      });
    });

    return () => { socket.emit("poll:leave", id); socket.disconnect(); };
  }, [analytics, id]);

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-rose-500">
      {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] theme-transition pb-20">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] mb-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-sm font-semibold">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <img src="/pollforge-logo.png" alt="Logo" className="h-8 w-8" />
            <h1 className="font-display text-xl font-bold gradient-text hidden sm:block">Analytics</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black">{analytics.title || 'Poll Analytics'}</h2>
            <p className="mt-2 text-[var(--text-muted)]">Live updates enabled • Tracking {totalResponses} responses</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsQRModalOpen(true)} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors shadow-sm">
              Share & QR
            </button>
            {analytics.status === 'active' && (
              <button onClick={handlePublish} disabled={isPublishing} className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white hover:opacity-90 shadow-lg">
                {isPublishing ? '...' : 'Publish Results'}
              </button>
            )}
            {analytics.status === 'published' && <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 text-sm font-bold text-emerald-500">Results Live</span>}
          </div>
        </div>

        <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} pollId={id} pollSlug={analytics.slug} />

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Responses', val: totalResponses },
            { label: 'Views', val: analytics.viewCount || 0 },
            { label: 'Completion', val: `${completion}%` },
            { label: 'Avg Time', val: `${Math.round(analytics.avgCompletionTime || 0)}s` },
            { label: 'Health', val: analytics.pollHealthScore, health: true },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.val}</p>
              {s.health && (
                <div className="mt-3 h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${s.val}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 lg:col-span-2 shadow-sm">
            <h3 className="font-display font-bold mb-6">Responses Timeline</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.responsesByDay}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm text-center">
            <h3 className="font-display font-bold mb-6">Participation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={participationData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {participationData.map((e, idx) => (
                      <Cell key={idx} fill={idx === 0 ? 'var(--primary)' : 'var(--accent)'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Details Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
            <h3 className="font-display font-bold mb-6">Device Usage</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 lg:col-span-2 shadow-sm">
            <h3 className="font-display font-bold mb-6">Recent Activity</h3>
            <div className="space-y-3">
              {analytics.recentResponses.length > 0 ? analytics.recentResponses.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${r.isAnonymous ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-sm font-medium">{r.isAnonymous ? 'Anonymous' : 'Authenticated'}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{new Date(r.submittedAt).toLocaleTimeString()}</span>
                </div>
              )) : <p className="text-sm text-[var(--text-muted)] italic">Waiting for responses...</p>}
            </div>
          </section>
        </div>

        {/* Question Breakdown */}
        <div className="mt-12 space-y-8">
          <h3 className="font-display text-2xl font-bold">Question Detailed Breakdown</h3>
          <div className="grid gap-6">
            {analytics.questions.map((q, idx) => (
              <section key={idx} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                  <div>
                    <h4 className="text-lg font-bold">{idx + 1}. {q.text}</h4>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{q.totalAnswered} answered • {q.skippedCount} skipped</p>
                  </div>
                  <div className="bg-[var(--primary-glow)] border border-[var(--primary)]/20 px-4 py-2 rounded-xl">
                    <p className="text-[10px] uppercase font-black text-[var(--text-muted)]">Leading Answer</p>
                    <p className="text-sm font-bold text-[var(--primary)]">{q.leadingOption.text || 'N/A'}</p>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={q.options} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="text" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'var(--surface-hover)', opacity: 0.5 }} />
                      <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
