import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Analytics",
    desc: "Live dashboards update as responses flow in — no refresh needed. Powered by Socket.io.",
    color: "#22D3EE",
  },
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    desc: "Claude AI analyzes your poll data and surfaces key findings, surprising patterns, and actionable takeaways.",
    color: "#6366F1",
  },
  {
    icon: "🔀",
    title: "Conditional Skip Logic",
    desc: "Show questions dynamically based on previous answers. Build intelligent, branching surveys.",
    color: "#10B981",
  },
  {
    icon: "🎭",
    title: "Results Theater",
    desc: "Publish beautiful public results pages with animated charts and AI-generated summaries.",
    color: "#F59E0B",
  },
  {
    icon: "🏆",
    title: "Creator Gamification",
    desc: "Earn score points, unlock badges, and grow your creator reputation with every poll you run.",
    color: "#EC4899",
  },
  {
    icon: "📱",
    title: "QR & Embed Share",
    desc: "Generate QR codes for physical events or embed polls directly into any website with one line of HTML.",
    color: "#22D3EE",
  },
];

const STATS = [
  { value: "12K+", label: "Responses Collected" },
  { value: "500+", label: "Polls Created" },
  { value: "99.9%", label: "Uptime" },
];

function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const num = parseInt(target.replace(/\D/g, ""), 10);
    const suffix = target.replace(/[\d.]/g, "");
    let start = 0;
    const step = Math.ceil(num / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= num) {
        setCount(num);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span className="font-display text-4xl font-black gradient-text">
      {count}{target.replace(/[\d]/g, "")}
    </span>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      {/* ── Navbar ──────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-[#13131A]/80 backdrop-blur-md border-b border-[#1E1E2E]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-black gradient-text">PollForge</span>
            <span className="hidden text-xs uppercase tracking-widest text-slate-600 sm:block">
              Intelligence
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Background mesh */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#6366F1]/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#22D3EE]/10 blur-3xl" />
        </div>

        <div className="relative animate-fade-in-up">
          <p className="mb-4 inline-block rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/5 px-4 py-1 text-xs uppercase tracking-widest text-[#22D3EE]">
            Built to Win · Hackathon Edition
          </p>
          <h1 className="font-display text-5xl font-black leading-tight text-slate-50 sm:text-7xl">
            Not just polls.
            <br />
            <span className="gradient-text">Intelligence.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            Real-time analytics, AI-powered insights, conditional logic, and a creator
            reputation system — all in one platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              Start for free
            </Link>
            <a
              href="#features"
              className="rounded-full border border-[#1E1E2E] px-6 py-3 text-sm text-slate-300 hover:bg-[#1E1E2E] transition-colors"
            >
              See features ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────── */}
      <section className="border-y border-[#1E1E2E] bg-[#13131A]">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-[#1E1E2E] px-6 py-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center px-6 text-center">
              <AnimatedCounter target={stat.value} />
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-50">
            Everything you need to run smarter polls
          </h2>
          <p className="mt-3 text-slate-500">
            Six layers of depth — each one a differentiator.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 transition-all duration-300 hover:border-[#22D3EE]/30 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.05)] animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
                style={{ background: `${f.color}15` }}
              >
                {f.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-slate-50">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────── */}
      <section className="mx-auto mb-24 max-w-3xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[#22D3EE]/20 bg-gradient-to-br from-[#6366F1]/10 via-[#13131A] to-[#22D3EE]/10 p-12 text-center">
          <div className="pointer-events-none absolute inset-0 gradient-bg-animated opacity-30" />
          <h2 className="relative font-display text-3xl font-black text-slate-50">
            Ready to build the future of polling?
          </h2>
          <p className="relative mt-3 text-slate-400">
            Join in seconds. No credit card required.
          </p>
          <Link
            to="/register"
            className="relative mt-6 inline-block rounded-full bg-[#22D3EE] px-7 py-3 text-sm font-semibold text-[#0A0A0F] hover:opacity-90 transition-opacity"
          >
            Create your first poll →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-[#1E1E2E] bg-[#13131A]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="font-display text-sm font-semibold text-slate-400">
            PollForge — <span className="gradient-text">Not just polls. Intelligence.</span>
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {["MERN", "Socket.io", "Recharts", "Claude AI", "TailwindCSS"].map((t) => (
              <span key={t} className="rounded bg-[#1E1E2E] px-2 py-1 text-slate-500">
                {t}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
