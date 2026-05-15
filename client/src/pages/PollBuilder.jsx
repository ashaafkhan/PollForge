import { useMemo, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api.js";

const createId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)))
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("");

const emptyQuestion = () => ({
  id: createId(),
  text: "",
  required: false,
  options: [{ id: createId(), text: "" }, { id: createId(), text: "" }],
  conditionalLogic: {
    enabled: false,
    showIf: { questionId: "", selectedOptionId: "" }
  }
});

function validateQuestions(list) {
  if (!Array.isArray(list) || list.length < 1) {
    return "Add at least one question";
  }
  for (let index = 0; index < list.length; index += 1) {
    const question = list[index];
    if (!question.text || question.text.trim().length === 0) return `Question ${index + 1} needs text`;
    if (question.options.length < 2) return `Question ${index + 1} needs at least two options`;
    for (let oIdx = 0; oIdx < question.options.length; oIdx += 1) {
      if (!question.options[oIdx].text.trim()) return `Option ${oIdx + 1} in question ${index + 1} is empty`;
    }
  }
  return null;
}

function SortableQuestion({ id, title, showRemove, onRemove, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div {...listeners} {...attributes} className="cursor-grab p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-[var(--text-main)]">{title}</h3>
        </div>
        {showRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-bold uppercase text-rose-500 hover:opacity-80 transition-opacity">
            Remove
          </button>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function PollBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [expiresAt, setExpiresAt] = useState("");
  const [requireAuth, setRequireAuth] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [isResponseLimited, setIsResponseLimited] = useState(false);
  const [maxResponses, setMaxResponses] = useState(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index) => setQuestions((prev) => prev.filter((_, i) => i !== index));
  const updateQuestion = (index, updates) => setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...updates } : q)));

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const options = q.options.map((opt, idx) => idx === oIndex ? { ...opt, text: value } : opt);
      return { ...q, options };
    }));
  };

  const addOption = (qIndex) => {
    setQuestions((prev) => prev.map((q, i) => i === qIndex ? { ...q, options: [...q.options, { id: createId(), text: "" }] } : q));
  };

  const removeOption = (qIndex, oIndex) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIndex) return q;
      return { ...q, options: q.options.filter((_, idx) => idx !== oIndex) };
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (title.trim().length < 3) return setError("Title must be at least 3 characters");

    const qError = validateQuestions(questions);
    if (qError) return setError(qError);

    const payload = {
      title,
      description,
      allowAnonymous: requireAuth ? false : allowAnonymous,
      requireAuth,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      settings: {
        maxResponses: isResponseLimited ? maxResponses : 0
      },
      questions: questions.map((q, index) => ({
        _id: q.id,
        text: q.text,
        required: q.required,
        order: index,
        options: q.options.map((opt, oIndex) => ({ _id: opt.id, text: opt.text, order: oIndex })),
        conditionalLogic: q.conditionalLogic?.enabled ? q.conditionalLogic : { enabled: false }
      }))
    };

    try {
      setSaving(true);
      const res = await api.post("/api/polls", payload);
      navigate("/dashboard", { state: { createdPoll: res.data } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create poll");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] theme-transition pb-20">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] mb-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-semibold">Back to Dashboard</span>
          </Link>
          <img src="/pollforge-logo.png" alt="Logo" className="h-8 w-8" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-display text-4xl font-black">Create a New Poll</h1>
        <p className="mt-2 text-[var(--text-muted)]">Design your survey and set up your rules.</p>

        <form onSubmit={onSubmit} className="mt-12 space-y-8">
          {/* General Details */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-2 block">Poll Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your question?"
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-lg font-bold focus:border-[var(--primary)] outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-2 block">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Provide some context..."
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
              />
            </div>
          </section>

          {/* Configuration */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <h3 className="font-display text-lg font-bold mb-6">Rules & Logic</h3>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={requireAuth}
                    onChange={(e) => {
                      setRequireAuth(e.target.checked);
                      if (e.target.checked) setAllowAnonymous(false);
                    }}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">Require authentication</span>
                </label>
                <label className={`flex items-center gap-3 cursor-pointer group ${requireAuth ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={allowAnonymous}
                    onChange={(e) => setAllowAnonymous(e.target.checked)}
                    disabled={requireAuth}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">Allow anonymous responses</span>
                </label>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer group mb-3">
                    <input
                      type="checkbox"
                      checked={isResponseLimited}
                      onChange={(e) => setIsResponseLimited(e.target.checked)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-sm font-bold text-[var(--text-main)]">Limit total responses</span>
                  </label>
                  {isResponseLimited && (
                    <input
                      type="number"
                      min="1"
                      value={maxResponses}
                      onChange={(e) => setMaxResponses(Number(e.target.value))}
                      className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2 text-sm focus:border-[var(--primary)]"
                    />
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)] mb-2 block">Expiration Date</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2 text-sm focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Questions */}
          <DndContext collisionDetection={closestCenter} onDragEnd={(e) => {
            const { active, over } = e;
            if (!over || active.id === over.id) return;
            setQuestions((prev) => {
              const oldIndex = prev.findIndex((q) => q.id === active.id);
              const newIndex = prev.findIndex((q) => q.id === over.id);
              return arrayMove(prev, oldIndex, newIndex);
            });
          }}>
            <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {questions.map((q, qIndex) => (
                  <SortableQuestion key={q.id} id={q.id} title={`Question ${qIndex + 1}`} showRemove={questions.length > 1} onRemove={() => removeQuestion(qIndex)}>
                    <input
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                      placeholder="Type your question here..."
                      className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm font-semibold focus:border-[var(--primary)]"
                      required
                    />
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })} />
                      Required question
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      {q.options.map((opt, oIndex) => (
                        <div key={opt.id} className="flex items-center gap-3">
                          <input
                            value={opt.text}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1 rounded-xl border border-[var(--border)] bg-transparent px-4 py-2 text-sm focus:border-[var(--primary)]"
                            required
                          />
                          {q.options.length > 2 && (
                            <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="p-2 text-rose-500 hover:bg-rose-500/5 rounded-lg transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addOption(qIndex)} className="text-xs font-bold text-[var(--primary)] hover:opacity-80">+ Add Option</button>
                    </div>
                  </SortableQuestion>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="pt-6 flex items-center justify-between border-t border-[var(--border)]">
            <button type="button" onClick={addQuestion} className="rounded-full border border-[var(--primary)] px-6 py-2 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors">
              Add Question
            </button>
            <div className="flex gap-4">
              {error && <span className="text-sm text-rose-500 flex items-center">{error}</span>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--primary)] px-8 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Poll Draft"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
