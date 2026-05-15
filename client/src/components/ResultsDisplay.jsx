import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function ResultsDisplay({ pollId, pollTitle }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get(`/api/polls/${pollId}/analytics`);
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to load results", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [pollId]);

  if (loading) {
    return <div className="text-sm text-[var(--text-muted)] animate-pulse">Loading results...</div>;
  }

  if (!analytics) {
    return <div className="text-sm text-rose-500">Unable to load results.</div>;
  }

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <h3 className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-6">Participation Overview</h3>
        <div className="flex flex-wrap gap-12">
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)]">Total Responses</p>
            <p className="mt-1 text-4xl font-black text-[var(--text-main)]">
              {analytics.totalResponses}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)]">Completion Rate</p>
            <p className="mt-1 text-4xl font-black text-[var(--text-main)]">
              {analytics.completionRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="font-display text-2xl font-bold">Question Breakdown</h3>
        <div className="grid gap-6">
          {analytics.questions.map((q, idx) => (
            <section
              key={q.questionId}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm"
            >
              <h4 className="text-lg font-bold mb-6">
                <span className="text-[var(--primary)] mr-2">{idx + 1}.</span> {q.text}
              </h4>
              <div className="space-y-5">
                {q.options.map((opt) => (
                  <div key={opt.optionId}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{opt.text}</span>
                      <span className="text-[var(--text-muted)] font-mono">{opt.percentage}% ({opt.count})</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-700"
                        style={{ width: `${opt.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
