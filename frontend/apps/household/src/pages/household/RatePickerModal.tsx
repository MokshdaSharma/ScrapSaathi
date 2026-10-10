import React, { useState } from "react";
import { StarRating } from "@scrapsaathi/ui-components";
import { createRating } from "@scrapsaathi/api-client";
import { useAuth } from "../../context/AuthContext.js";

interface RatePickerModalProps {
  pinId: string;
  onClose: () => void;
  onSuccess: () => void;
  locale: "en" | "hi";
}

export const RatePickerModal: React.FC<RatePickerModalProps> = ({
  pinId,
  onClose,
  onSuccess,
  locale,
}) => {
  const { user } = useAuth();
  const [score, setScore] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Fair Weighing", "On-Time"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tags = [
    "Fair Weighing",
    "On-Time",
    "Polite Behavior",
    "Instant Payment",
    "Eco Hero",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fullNote = selectedTags.length > 0 ? `${selectedTags.join(", ")}. ${note}` : note;

    try {
      await createRating({
        pinId,
        raterId: user?.id || "user_household_1",
        raterRole: "household",
        score,
        note: fullNote.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-1"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-3xl mb-2">⭐</div>
          <h2 className="text-xl font-bold text-white">
            {locale === "hi" ? "कबाड़ीवाले को रेटिंग दें" : "Rate Your Pickup Experience"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "hi"
              ? "आपकी रेटिंग से ईमानदार कबाड़ीवालों का विश्वास और काम बढ़ता है।"
              : "Help build trust and reward reliable kabadiwalas in your neighborhood."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center justify-center py-2 bg-slate-800/50 rounded-2xl border border-slate-700/60">
            <span className="text-xs text-slate-400 mb-2">Tap stars to rate:</span>
            <StarRating value={score} onChange={setScore} size={36} />
            <span className="text-xs font-bold text-amber-400 mt-2">
              {score === 5 ? "⭐⭐⭐⭐⭐ Outstanding" : `${score} / 5 Stars`}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              What went great?
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ✓ {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Feedback note (optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ramu bhai was very polite and brought a certified digital scale..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
