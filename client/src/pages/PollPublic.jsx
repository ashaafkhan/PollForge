import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ResultsDisplay from "../components/ResultsDisplay.jsx";

export default function PollPublic() {
  const { slug } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [pollExpired, setPollExpired] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    let active = true;
    const fetchPoll = async () => {
      try {
        const response = await api.get(`/api/polls/${slug}`);
        if (!active) return;
        setPoll(response.data);
        setStartedAt(Date.now());
        const check = await api.get(`/api/responses/check/${response.data._id}`);
        if (!active) return;
        setHasResponded(Boolean(check.data.hasResponded));
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 410) setPollExpired(true);
        else setError(err.response?.data?.message || "Failed to load poll");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPoll();
    return () => { active = false; };
  }, [slug]);

  const handleSelect = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const isQuestionVisible = (question) => {
    if (!question.conditionalLogic?.enabled) return true;
    const showIf = question.conditionalLogic.showIf || {};
    if (!showIf.questionId || !showIf.selectedOptionId) return false;
    return String(answers[showIf.questionId]) === String(showIf.selectedOptionId);
  };

  useEffect(() => {
    if (!poll) return;
    const visibleIds = new Set(poll.questions.filter(isQuestionVisible).map((q) => q._id));
    setAnswers((prev) => {
      const next = Object.entries(prev).filter(([key]) => visibleIds.has(key));
      return next.length === Object.keys(prev).length ? prev : Object.fromEntries(next);
    });
  }, [answers, poll]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!poll) return;
    setError("");

    const requiredMissing = poll.questions.some(q => q.required && isQuestionVisible(q) && !answers[q._id]);
    if (requiredMissing) return setError("Please answer all required questions");

    try {
      setSubmitting(true);
      const submittedAt = Date.now();
      const completionTime = startedAt ? Math.round((submittedAt - startedAt) / 1000) : 0;
      await api.post("/api/responses", {
        pollId: poll._id,
        answers: poll.questions
          .filter(q => answers[q._id] && isQuestionVisible(q))
          .map(q => ({ questionId: q._id, selectedOptionId: answers[q._id] })),
        metadata: {
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          submittedAt: new Date(submittedAt).toISOString(),
          completionTime
        }
      });
      setSuccess(true);
      toast.success("Response submitted!");
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] theme-transition pb-20">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] mb-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/pollforge-logo.png" alt="Logo" className="h-8 w-8" />
            <span className="font-display text-xl font-black gradient-text">PollForge</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6">
        {pollExpired ? (
          <div className="py-20 text-center">
            <span className="text-5xl">⏳</span>
            <h1 className="mt-6 font-display text-3xl font-black">This poll has closed</h1>
            <p className="mt-3 text-[var(--text-muted)]">No more responses are being accepted.</p>
            <Link to="/" className="mt-8 inline-block rounded-full border border-[var(--primary)] px-8 py-3 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all">
              Back to Home
            </Link>
          </div>
        ) : success ? (
          <div className="py-20 text-center animate-fade-in-up">
            <div className="mb-6 mx-auto h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-4xl">✅</div>
            <h1 className="font-display text-3xl font-black">Response Submitted</h1>
            <p className="mt-4 text-[var(--text-muted)] text-lg">
              {poll.settings?.confirmationMessage || "Thank you for your participation!"}
            </p>
            <Link to="/" className="mt-10 inline-block text-sm font-bold text-[var(--primary)] hover:underline">
              Create your own poll with PollForge →
            </Link>
          </div>
        ) : poll.status === 'published' ? (
          <div className="animate-fade-in-up">
             <div className="mb-8 p-6 rounded-3xl bg-[var(--primary-glow)] border border-[var(--primary)]/20">
                <h1 className="text-2xl font-black">{poll.title}</h1>
                <p className="mt-2 text-[var(--text-muted)]">{poll.description}</p>
             </div>
             <ResultsDisplay pollId={poll._id} pollTitle={poll.title} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
            <div className="mb-10">
              <h1 className="font-display text-4xl font-black">{poll.title}</h1>
              {poll.description && <p className="mt-4 text-lg text-[var(--text-muted)] leading-relaxed">{poll.description}</p>}
              
              {poll.settings?.showProgressBar && (
                <div className="mt-8 space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">
                    <span>Progress</span>
                    <span>{Math.round((answeredCount / poll.questions.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500" 
                      style={{ width: `${(answeredCount / poll.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {poll.questions.filter(isQuestionVisible).map((q, idx) => (
              <section key={q._id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-lg font-bold">
                    <span className="text-[var(--primary)] mr-2">{idx + 1}.</span> {q.text}
                  </h2>
                  {q.required && <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Required</span>}
                </div>
                <div className="grid gap-3">
                  {q.options.map((opt) => (
                    <label key={opt._id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${answers[q._id] === opt._id ? 'border-[var(--primary)] bg-[var(--primary-glow)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]'}`}>
                      <input 
                        type="radio" 
                        name={q._id} 
                        value={opt._id} 
                        checked={answers[q._id] === opt._id}
                        onChange={() => handleSelect(q._id, opt._id)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                      <span className="text-sm font-medium">{opt.text}</span>
                    </label>
                  ))}
                </div>
              </section>
            ))}

            <div className="pt-6">
              {error && <p className="mb-4 text-sm font-bold text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[var(--primary)] py-4 text-sm font-black text-white shadow-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {submitting ? "Submitting..." : "Submit My Response"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
