import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function ResultsDisplay({ pollId, pollTitle, aiInsights }) {
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
    return <div className="text-sm text-slate-400">Loading results...</div>;
  }

  if (!analytics) {
    return <div className="text-sm text-rose-400">Unable to load results.</div>;
  }

  return (
    <div className="space-y-8">
      {aiInsights && (
        <section className="rounded-2xl border border-[#22D3EE]/30 bg-[#22D3EE]/5 p-6 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
          <div className="flex items-center gap-3">
            <span className="text-xl">✨</span>
            <h2 className="text-sm font-semibold text-[#22D3EE]">AI Insights</h2>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {aiInsights}
          </p>
        </section>
      )}

      <div className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
        <h3 className="text-sm font-semibold text-slate-200">Participation Overview</h3>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-xs uppercase text-slate-500">Total Responses</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">
              {analytics.totalResponses}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Completion Rate</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">
              {analytics.completionRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-50">Question Breakdown</h3>
        {analytics.questions.map((q, idx) => (
          <section
            key={q.questionId}
            className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6"
          >
            <h4 className="text-sm font-semibold text-slate-200">
              {idx + 1}. {q.text}
            </h4>
            <div className="mt-4 space-y-3">
              {q.options.map((opt) => (
                <div key={opt.optionId}>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{opt.text}</span>
                    <span>{opt.percentage}% ({opt.count})</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[#1E1E2E]">
                    <div
                      className="h-2 rounded-full bg-[#22D3EE]"
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
  );
}
