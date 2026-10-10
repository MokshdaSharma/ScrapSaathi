import React from "react";
import type { MaterialType } from "@scrapsaathi/api-client";

interface ScrapTypeIconProps {
  material: MaterialType;
  size?: number;
  className?: string;
}

const iconPaths: Record<MaterialType, React.ReactElement> = {
  plastic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6l1 4H8L9 2z" />
      <rect x="6" y="6" width="12" height="14" rx="2" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  ),
  paper: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  ),
  metal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5.22 5.22l1.42 1.42M17.36 17.36l1.42 1.42M5.22 18.78l1.42-1.42M17.36 6.64l1.42-1.42" />
    </svg>
  ),
  glass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2h10l-2 10H9L7 2z" />
      <path d="M9 12v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6" />
      <path d="M7 18h10" />
    </svg>
  ),
  ewaste: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h4M6 14h.01M10 14h2" />
      <circle cx="18" cy="10" r="1" />
      <circle cx="18" cy="14" r="1" />
    </svg>
  ),
  mixed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  ),
};

const colorClasses: Record<MaterialType, string> = {
  plastic: "text-blue-400",
  paper: "text-yellow-400",
  metal: "text-slate-400",
  glass: "text-teal-400",
  ewaste: "text-purple-400",
  mixed: "text-orange-400",
};

export function ScrapTypeIcon({ material, size = 24, className = "" }: ScrapTypeIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${colorClasses[material]} ${className}`}
      style={{ width: size, height: size }}
      aria-label={material}
      role="img"
    >
      {React.cloneElement(iconPaths[material], {
        width: size,
        height: size,
      })}
    </span>
  );
}
