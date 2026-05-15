import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api.js";

const emptyQuestion = () => ({ text: "", required: false, options: [{ text: "" }, { text: "" }] });

export default function PollEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPoll = async () => {
      try {
        const response = await api.get(`/api/polls/id/${id}`);
        if (!active) return;
        const poll = response.data;
        setTitle(poll.title || "");
        setDescription(poll.description || "");
        setQuestions(
          poll.questions?.length
            ? poll.questions.map((q) => ({
                text: q.text || "",
                required: q.required || false,
                options: q.options?.length
                  ? q.options.map((opt) => ({ text: opt.text || "" }))
                  : [{ text: "" }, { text: "" }]
              }))
            : [emptyQuestion()]
        );
      } catch (err) {
        if (active) {
          setError("Failed to load poll");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPoll();
    return () => {
      active = false;
    };
  }, [id]);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, updates) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((opt, idx) => (idx === oIndex ? { text: value } : opt));
        return { ...q, options };
      })
    );
  };

  const addOption = (qIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, { text: "" }] } : q))
    );
  };

  const removeOption = (qIndex, oIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.filter((_, idx) => idx !== oIndex);
        return { ...q, options };
      })
    );
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      title,
      description,
      questions: questions.map((q, index) => ({
        text: q.text,
        required: q.required,
        order: index,
        options: q.options.map((opt, oIndex) => ({ text: opt.text, order: oIndex }))
      }))
    };

    try {
      setSaving(true);
      await api.put(`/api/polls/${id}`, payload);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update poll");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
        <div className="mx-auto max-w-4xl px-6 py-10 text-slate-400">Loading poll...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-50">Edit poll</h1>
        <p className="mt-2 text-sm text-slate-400">
          Update questions while the poll is still a draft.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
            <h2 className="text-sm font-semibold text-slate-200">Poll details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs uppercase text-slate-500">Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          {questions.map((question, qIndex) => (
            <section
              key={`question-${qIndex}`}
              className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Question {qIndex + 1}
                  </h3>
                  <p className="text-xs text-slate-500">Minimum two options</p>
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-xs uppercase text-rose-400"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <input
                  value={question.text}
                  onChange={(event) => updateQuestion(qIndex, { text: event.target.value })}
                  placeholder="Question text"
                  className="w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm"
                  required
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(event) => updateQuestion(qIndex, { required: event.target.checked })}
                  />
                  Required
                </div>

                <div className="space-y-3">
                  {question.options.map((option, oIndex) => (
                    <div key={`option-${qIndex}-${oIndex}`} className="flex items-center gap-3">
                      <input
                        value={option.text}
                        onChange={(event) => updateOption(qIndex, oIndex, event.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm"
                        required
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="text-xs uppercase text-rose-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="text-xs uppercase text-[#22D3EE]"
                  >
                    Add option
                  </button>
                </div>
              </div>
            </section>
          ))}

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-full border border-[#1E1E2E] px-4 py-2 text-sm text-slate-200"
            >
              Add question
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-[#22D3EE] px-4 py-2 text-sm text-[#22D3EE]"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
