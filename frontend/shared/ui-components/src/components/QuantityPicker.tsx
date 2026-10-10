import type { QuantityBucket } from "@scrapsaathi/api-client";

interface QuantityPickerProps {
  value: QuantityBucket | null;
  onChange: (value: QuantityBucket) => void;
  labels?: { small: string; medium: string; large: string };
}

const buckets: QuantityBucket[] = ["small", "medium", "large"];

const defaultLabels = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const descriptions = {
  small: "< 5 kg",
  medium: "5–20 kg",
  large: "> 20 kg",
};

function BagIcon({ size }: { size: "small" | "medium" | "large" }) {
  const scales = { small: 1, medium: 1.35, large: 1.7 };
  const s = scales[size];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 32 * s, height: 32 * s, maxWidth: 56, maxHeight: 56 }}
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function QuantityPicker({ value, onChange, labels = defaultLabels }: QuantityPickerProps) {
  return (
    <div className="flex gap-3 justify-center" role="group" aria-label="Quantity">
      {buckets.map((bucket) => {
        const isSelected = value === bucket;
        return (
          <button
            key={bucket}
            type="button"
            onClick={() => onChange(bucket)}
            aria-pressed={isSelected}
            aria-label={`${labels[bucket]} — ${descriptions[bucket]}`}
            className={[
              "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 min-w-[80px] flex-1",
              "focus:outline-none focus:ring-2 focus:ring-green-500",
              isSelected
                ? "border-green-500 bg-green-900/30 text-green-400 shadow-lg shadow-green-900/30 scale-105"
                : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <BagIcon size={bucket} />
            <span className="text-sm font-semibold">{labels[bucket]}</span>
            <span className="text-xs opacity-70">{descriptions[bucket]}</span>
          </button>
        );
      })}
    </div>
  );
}
