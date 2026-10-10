interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  label?: string;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 32,
  label = "Rating",
}: StarRatingProps) {
  return (
    <div
      className="inline-flex items-center gap-1"
      role={readonly ? "img" : "radiogroup"}
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role={readonly ? undefined : "radio"}
          aria-checked={readonly ? undefined : value === star}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={[
            "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded",
            readonly
              ? "cursor-default"
              : "cursor-pointer hover:scale-125 active:scale-95",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ width: size, height: size, padding: 0, background: "none", border: "none" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill={star <= value ? "#EAB308" : "none"}
            stroke={star <= value ? "#EAB308" : "#475569"}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            width={size}
            height={size}
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}
