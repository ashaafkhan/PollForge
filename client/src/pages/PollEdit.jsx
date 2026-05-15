import { useEffect, useMemo, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api.js";

const createId = () => Math.random().toString(36).slice(2, 10);
const emptyQuestion = () => ({
  id: createId(),
  text: "",
  required: false,
  options: [{ text: "" }, { text: "" }]
});

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function validateQuestions(list) {
  if (!Array.isArray(list) || list.length < 1) {
    return "Add at least one question";
  }

  for (let index = 0; index < list.length; index += 1) {
    const question = list[index];
    if (!question.text || question.text.trim().length === 0) {
      return `Question ${index + 1} needs text`;
    }
    if (!Array.isArray(question.options) || question.options.length < 2) {
      return `Question ${index + 1} needs at least two options`;
    }
    for (let optIndex = 0; optIndex < question.options.length; optIndex += 1) {
      const option = question.options[optIndex];
      if (!option.text || option.text.trim().length === 0) {
        return `Option ${optIndex + 1} in question ${index + 1} is empty`;
      }
    }
  }

  return null;
}

function SortableQuestion({ id, title, showRemove, onRemove, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-500">Minimum two options</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-xs uppercase text-slate-400"
            {...listeners}
            {...attributes}
          >
            Drag
          </button>
          {showRemove && (
            <button type="button" onClick={onRemove} className="text-xs uppercase text-rose-400">
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function PollEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [expiresAt, setExpiresAt] = useState("");
  const [requireAuth, setRequireAuth] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [maxResponses, setMaxResponses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);

  useEffect(() => {
    let active = true;

    const loadPoll = async () => {
      try {
        const response = await api.get(`/api/polls/id/${id}`);
        if (!active) return;
        const poll = response.data;
        setTitle(poll.title || "");
        setDescription(poll.description || "");
        setExpiresAt(poll.expiresAt ? toLocalDateTime(poll.expiresAt) : "");
        setRequireAuth(Boolean(poll.requireAuth));
        setAllowAnonymous(Boolean(poll.allowAnonymous));
        setMaxResponses(poll.settings?.maxResponses ?? 0);
        setQuestions(
          poll.questions?.length
            ? poll.questions.map((q) => ({
                id: q._id || createId(),
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

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    if (expiresAt) {
      const expires = new Date(expiresAt);
      if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
        setError("Expiry must be in the future");
        return;
      }
    }

    if (Number.isNaN(maxResponses) || maxResponses < 0) {
      setError("Max responses must be 0 or higher");
      return;
    }

    const questionError = validateQuestions(questions);
    if (questionError) {
      setError(questionError);
      return;
    }

    const payload = {
      title: trimmedTitle,
      description,
      allowAnonymous: requireAuth ? false : allowAnonymous,
      requireAuth,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      settings: {
        maxResponses: maxResponses || 0
      },
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

          <section className="rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6">
            <h2 className="text-sm font-semibold text-slate-200">Settings</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase text-slate-500">Expiry</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500">Max responses</label>
                <input
                  type="number"
                  min="0"
                  value={maxResponses}
                  onChange={(event) => setMaxResponses(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">0 means unlimited.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-400">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={requireAuth}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setRequireAuth(nextValue);
                    if (nextValue) {
                      setAllowAnonymous(false);
                    }
                  }}
                />
                Require authentication to respond
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowAnonymous}
                  onChange={(event) => setAllowAnonymous(event.target.checked)}
                  disabled={requireAuth}
                />
                Allow anonymous responses
              </label>
            </div>
          </section>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              setQuestions((prev) => {
                const oldIndex = prev.findIndex((question) => question.id === active.id);
                const newIndex = prev.findIndex((question) => question.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
              });
            }}
          >
            <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
              {questions.map((question, qIndex) => (
                <SortableQuestion
                  key={question.id}
                  id={question.id}
                  title={`Question ${qIndex + 1}`}
                  showRemove={questions.length > 1}
                  onRemove={() => removeQuestion(qIndex)}
                >
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
                      <div key={`option-${question.id}-${oIndex}`} className="flex items-center gap-3">
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
                </SortableQuestion>
              ))}
            </SortableContext>
          </DndContext>

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
