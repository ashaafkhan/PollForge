import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
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
        if (active) {
          setError(err.response?.data?.message || "Failed to load poll");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPoll();
    return () => {
      active = false;
    };
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
    const visibleIds = new Set(
      poll.questions.filter((question) => isQuestionVisible(question)).map((q) => q._id)
    );
    setAnswers((prev) => {
      const next = Object.entries(prev).filter(([key]) => visibleIds.has(key));
      if (next.length === Object.keys(prev).length) {
        return prev;
      }
      return Object.fromEntries(next);
    });
  }, [answers, poll]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!poll) return;
    setError("");

    const requiredMissing = poll.questions.some(
      (question) => question.required && isQuestionVisible(question) && !answers[question._id]
    );
    if (requiredMissing) {
      setError("Please answer all required questions");
      return;
    }

    try {
      setSubmitting(true);
      const submittedAt = Date.now();
      const completionTime = startedAt ? Math.round((submittedAt - startedAt) / 1000) : 0;
      await api.post("/api/responses", {
        pollId: poll._id,
        answers: poll.questions
          .filter((question) => answers[question._id] && isQuestionVisible(question))
          .map((question) => ({
            questionId: question._id,
            selectedOptionId: answers[question._id]
          })),
        metadata: {
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          submittedAt: new Date(submittedAt).toISOString(),
          completionTime
        }
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10 text-slate-400">Loading poll...</div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-rose-400">{error}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-[#22D3EE]">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  if (poll.status === 'published') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-6 flex flex-col items-start gap-2">
            <span className="rounded-full bg-[#10B981]/20 px-3 py-1 text-xs uppercase text-[#10B981]">
              Results Published
            </span>
            <h1 className="text-3xl font-bold text-slate-50">{poll.title}</h1>
            {poll.description && <p className="mt-2 text-sm text-slate-400">{poll.description}</p>}
          </div>
          <ResultsDisplay 
            pollId={poll._id} 
            pollTitle={poll.title} 
            aiInsights={poll.aiInsights} 
          />
        </div>
      </div>
    );
  }

  if (poll.requireAuth && !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-slate-50">Sign in required</h1>
          <p className="mt-2 text-sm text-slate-400">
            This poll requires authentication. Please sign in to respond.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/login"
              state={{ from: location }}
              className="rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE]"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-[#1E1E2E] px-4 py-2 text-sm text-slate-200"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (hasResponded) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-slate-50">You already responded</h1>
          <p className="mt-2 text-sm text-slate-400">
            Thanks for participating. You have already submitted a response.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-slate-50">Response submitted</h1>
          <p className="mt-2 text-sm text-slate-400">
            {poll.settings?.confirmationMessage || "Thanks for your response."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-50">{poll.title}</h1>
        {poll.description && <p className="mt-2 text-sm text-slate-400">{poll.description}</p>}

        {poll.settings?.showProgressBar && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{answeredCount} answered</span>
              <span>{poll.questions.length} total</span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-[#1E1E2E]">
              <div
                className="h-1 rounded-full bg-[#22D3EE]"
                style={{ width: `${(answeredCount / poll.questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {poll.questions.filter(isQuestionVisible).map((question, index) => (
            <section
              key={question._id}
              className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">
                  {index + 1}. {question.text}
                </h2>
                {question.required && (
                  <span className="text-xs uppercase text-amber-400">Required</span>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option._id}
                    className="flex items-center gap-3 rounded-lg border border-[#1E1E2E] bg-[#0F0F15] px-3 py-2 text-sm text-slate-200"
                  >
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={option._id}
                      checked={answers[question._id] === option._id}
                      onChange={() => handleSelect(question._id, option._id)}
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            </section>
          ))}

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE]"
          >
            {submitting ? "Submitting..." : "Submit response"}
          </button>
        </form>
      </div>
    </div>
  );
}
