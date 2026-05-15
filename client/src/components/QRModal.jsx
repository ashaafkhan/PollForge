import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function QRModal({ isOpen, onClose, pollId, pollSlug }) {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const pollUrl = `${window.location.origin}/p/${pollSlug}`;
  const embedCode = `<iframe src="${pollUrl}" width="100%" height="600px" frameborder="0"></iframe>`;

  useEffect(() => {
    if (isOpen && pollId && !qrCode) {
      const fetchQR = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/api/polls/${pollId}/qr`, { responseType: 'blob' });
          const url = URL.createObjectURL(res.data);
          setQrCode(url);
        } catch (err) {
          console.error("Failed to load QR code");
        } finally {
          setLoading(false);
        }
      };
      fetchQR();
    }
  }, [isOpen, pollId, qrCode]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Share Poll</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-[#1E1E2E] bg-[#0F0F15]">
              <span className="text-sm text-slate-500">Loading QR...</span>
            </div>
          ) : qrCode ? (
            <img src={qrCode} alt="Poll QR Code" className="h-48 w-48 rounded-lg bg-white p-2" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-[#1E1E2E] bg-[#0F0F15]">
              <span className="text-sm text-slate-500">No QR Available</span>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase text-slate-500">Poll Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pollUrl}
                className="w-full rounded-lg border border-[#1E1E2E] bg-[#0F0F15] px-3 py-2 text-sm text-slate-300 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="rounded-lg border border-[#1E1E2E] bg-[#1E1E2E] px-3 py-2 text-sm text-slate-200 hover:bg-[#2A2A3A]"
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-slate-500">Embed Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={embedCode}
                className="w-full rounded-lg border border-[#1E1E2E] bg-[#0F0F15] px-3 py-2 text-sm text-slate-300 outline-none"
              />
              <button
                onClick={copyEmbedCode}
                className="rounded-lg border border-[#1E1E2E] bg-[#1E1E2E] px-3 py-2 text-sm text-slate-200 hover:bg-[#2A2A3A]"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {copied && (
          <p className="mt-4 text-center text-xs text-[#10B981]">Copied to clipboard!</p>
        )}
      </div>
    </div>
  );
}
