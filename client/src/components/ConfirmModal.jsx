export default function ConfirmModal({ isOpen, title, description, confirmLabel = "Confirm", onConfirm, onCancel, danger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 shadow-xl animate-fade-in-up">
        <h2 className="text-base font-semibold text-slate-50">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-[#1E1E2E] px-4 py-2 text-sm text-slate-300 hover:bg-[#1E1E2E]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              danger
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                : "bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30 hover:bg-[#22D3EE]/20"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
