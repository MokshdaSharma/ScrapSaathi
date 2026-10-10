import type { PinStatus } from "@scrapsaathi/api-client";

interface StatusBadgeProps {
  status: PinStatus;
  label?: string;
}

const statusConfig: Record<PinStatus, { label: string; classes: string; dot: string }> = {
  open: {
    label: "Open",
    classes: "bg-green-900/40 text-green-400 border border-green-700/50",
    dot: "bg-green-400 animate-pulse",
  },
  claimed: {
    label: "Claimed",
    classes: "bg-orange-900/40 text-orange-400 border border-orange-700/50",
    dot: "bg-orange-400 animate-pulse",
  },
  collected: {
    label: "Collected",
    classes: "bg-slate-800 text-slate-400 border border-slate-700",
    dot: "bg-slate-400",
  },
  expired: {
    label: "Expired",
    classes: "bg-red-900/30 text-red-400 border border-red-800/50",
    dot: "bg-red-400",
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.classes}`}
      aria-label={`Status: ${label ?? config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label ?? config.label}
    </span>
  );
}
