import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Interaction",
    desc: "Engage your audience with live results that update instantly. No more refreshing pages.",
    color: "#22D3EE",
  },
  {
    icon: "🤝",
    title: "Seamless Collaboration",
    desc: "Build polls with your team and share results privately or publicly with one click.",
    color: "#6366F1",
  },
  {
    icon: "🔀",
    title: "Smart Conditional Logic",
    desc: "Create dynamic surveys that adapt to respondent answers for a personalized experience.",
    color: "#10B981",
  },
  {
    icon: "📱",
    title: "Multi-Channel Sharing",
    desc: "Share your polls via QR codes, direct links, or embed them directly into your website.",
    color: "#F59E0B",
  },
  {
    icon: "📈",
    title: "Powerful Analytics",
    desc: "Visualize your data with professional charts and deep-dive into respondent demographics.",
    color: "#EC4899",
  },
  {
    icon: "🛡️",
    title: "Secure & Reliable",
    desc: "Enterprise-grade security with IP-based rate limiting and optional authentication.",
    color: "#22D3EE",
  },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] theme-transition">
      {/* ── Navbar ──────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/pollforge-logo.png" alt="PollForge Logo" className="h-8 w-8" />
            <span className="font-display text-xl font-black gradient-text">PollForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-[var(--primary)] px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Background mesh */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        </div>

        <div className="relative animate-fade-in-up">
          <p className="mb-4 inline-block rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-1 text-xs uppercase tracking-widest text-[var(--primary)]">
            Modern Survey Platform
          </p>
          <h1 className="font-display text-5xl font-black leading-tight sm:text-7xl">
            Collect opinions.
            <br />
            <span className="gradient-text">Drive Decisions.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--text-muted)]">
            Build beautiful, real-time polls in seconds. Analyze results with professional tools 
            and share them with anyone, anywhere.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] px-8 py-4 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              Create Your First Poll
            </Link>
            <a
              href="#features"
              className="rounded-full border border-[var(--border)] px-8 py-4 text-sm text-[var(--text-main)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ── Feature grid ────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-bold">
            Everything you need for better feedback
          </h2>
          <p className="mt-4 text-[var(--text-muted)] max-w-2xl mx-auto">
            Powerful tools designed for teams that value real-time insights and professional presentation.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-all duration-300 hover:border-[var(--primary)]/30 hover:-translate-y-1 hover:shadow-xl animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ background: `${f.color}15` }}
              >
                {f.icon}
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────── */}
      <section className="mx-auto mb-24 max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--primary)]/20 bg-[var(--surface)] p-12 text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-[var(--primary)]/5 pointer-events-none" />
          <h2 className="relative font-display text-3xl font-black">
            Ready to hear what your audience thinks?
          </h2>
          <p className="relative mt-4 text-[var(--text-muted)]">
            Join thousands of creators building better experiences with PollForge.
          </p>
          <Link
            to="/register"
            className="relative mt-8 inline-block rounded-full bg-[var(--primary)] px-8 py-4 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Get Started for Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10">
          <div className="flex items-center gap-3">
            <img src="/pollforge-logo.png" alt="Logo" className="h-6 w-6 opacity-80" />
            <p className="font-display text-sm font-semibold text-[var(--text-muted)]">
              PollForge — <span className="gradient-text">Empowering Collective Decisions.</span>
            </p>
          </div>
          <div className="flex gap-8 text-sm text-[var(--text-muted)]">
            <Link to="/login" className="hover:text-[var(--primary)] transition-colors">Login</Link>
            <Link to="/register" className="hover:text-[var(--primary)] transition-colors">Register</Link>
            <a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
