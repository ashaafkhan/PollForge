import { useMemo, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
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

export default function PollBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [expiresAt, setExpiresAt] = useState("");
  const [requireAuth, setRequireAuth] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [maxResponses, setMaxResponses] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);

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
        const options = q.options.map((opt, idx) =>
          idx === oIndex ? { ...opt, text: value } : opt
        );
        return { ...q, options };
      })
    );
  };

  const addOption = (qIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, { id: createId(), text: "" }] } : q
      )
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

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (question.conditionalLogic?.enabled) {
        const showIf = question.conditionalLogic.showIf || {};
        if (!showIf.questionId || !showIf.selectedOptionId) {
          setError(`Conditional logic for question ${index + 1} is incomplete`);
          return;
        }
      }
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
      questions: questions.map((q, index) => {
        return {
        _id: q.id,
        text: q.text,
        required: q.required,
        order: index,
        options: q.options.map((opt, oIndex) => ({ _id: opt.id, text: opt.text, order: oIndex })),
        conditionalLogic: q.conditionalLogic?.enabled
          ? {
              enabled: true,
              showIf: {
                questionId: q.conditionalLogic.showIf.questionId,
                selectedOptionId: q.conditionalLogic.showIf.selectedOptionId
              }
            }
          : { enabled: false }
        };
      })
    };

    try {
      setSaving(true);
      const response = await api.post("/api/polls", payload);
      navigate("/dashboard", { state: { createdPoll: response.data } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create poll");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-50">Create a poll</h1>
        <p className="mt-2 text-sm text-slate-400">
          Build your draft. Activation comes next once questions are finalized.
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

                  {qIndex > 0 && (
                    <div className="mt-4 rounded-lg border border-[#1E1E2E] bg-[#0F0F15] p-3">
                      <label className="flex items-center gap-2 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={question.conditionalLogic?.enabled}
                          onChange={(event) =>
                            updateQuestion(qIndex, {
                              conditionalLogic: {
                                ...question.conditionalLogic,
                                enabled: event.target.checked
                              }
                            })
                          }
                        />
                        Show only if
                      </label>

                      {question.conditionalLogic?.enabled && (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="text-[11px] uppercase text-slate-500">
                              Question
                            </label>
                            <select
                              value={question.conditionalLogic.showIf.questionId}
                              onChange={(event) =>
                                updateQuestion(qIndex, {
                                  conditionalLogic: {
                                    ...question.conditionalLogic,
                                    showIf: {
                                      ...question.conditionalLogic.showIf,
                                      questionId: event.target.value,
                                      selectedOptionId: ""
                                    }
                                  }
                                })
                              }
                              className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-xs"
                            >
                              <option value="">Select question</option>
                              {questions.slice(0, qIndex).map((prevQuestion) => (
                                <option key={prevQuestion.id} value={prevQuestion.id}>
                                  {prevQuestion.text || "Untitled question"}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] uppercase text-slate-500">
                              Option
                            </label>
                            <select
                              value={question.conditionalLogic.showIf.selectedOptionId}
                              onChange={(event) =>
                                updateQuestion(qIndex, {
                                  conditionalLogic: {
                                    ...question.conditionalLogic,
                                    showIf: {
                                      ...question.conditionalLogic.showIf,
                                      selectedOptionId: event.target.value
                                    }
                                  }
                                })
                              }
                              className="mt-2 w-full rounded-lg border border-[#1E1E2E] bg-transparent px-3 py-2 text-xs"
                              disabled={!question.conditionalLogic.showIf.questionId}
                            >
                              <option value="">Select option</option>
                              {questions
                                .slice(0, qIndex)
                                .find(
                                  (prevQuestion) =>
                                    prevQuestion.id === question.conditionalLogic.showIf.questionId
                                )
                                ?.options.map((option, optionIndex) => (
                                  <option key={option.id} value={option.id}>
                                    {option.text || `Option ${optionIndex + 1}`}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
              {saving ? "Saving..." : "Save draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
