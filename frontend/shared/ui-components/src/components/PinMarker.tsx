import type { PinStatus, MaterialType, QuantityBucket } from "@scrapsaathi/api-client";

interface PinMarkerProps {
  pinId: string;
  materialType: MaterialType;
  quantityBucket: QuantityBucket;
  status: PinStatus;
  onClick?: () => void;
}

const statusColors: Record<PinStatus, string> = {
  open: "#22C55E",
  claimed: "#F97316",
  collected: "#64748B",
  expired: "#EF4444",
};

const materialColors: Record<MaterialType, string> = {
  plastic: "#3B82F6",
  paper: "#EAB308",
  metal: "#9CA3AF",
  glass: "#14B8A6",
  ewaste: "#8B5CF6",
  mixed: "#F97316",
};

const quantitySizes: Record<QuantityBucket, number> = {
  small: 10,
  medium: 14,
  large: 18,
};

/**
 * PinMarker renders as an SVG circle suitable for use as a Leaflet
 * DivIcon or as a standalone element in lists.
 */
export function PinMarker({
  pinId,
  materialType,
  quantityBucket,
  status,
  onClick,
}: PinMarkerProps) {
  const outerSize = quantitySizes[quantityBucket] + 12;
  const innerSize = quantitySizes[quantityBucket];
  const statusColor = statusColors[status];
  const matColor = materialColors[materialType];

  return (
    <button
      type="button"
      id={`pin-marker-${pinId}`}
      onClick={onClick}
      aria-label={`${materialType} scrap, ${quantityBucket} amount, status: ${status}`}
      className="inline-flex items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white"
      style={{
        width: outerSize,
        height: outerSize,
        backgroundColor: matColor,
        borderColor: statusColor,
        boxShadow: `0 0 0 2px ${statusColor}40`,
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: innerSize / 2,
          height: innerSize / 2,
          backgroundColor: statusColor,
        }}
      />
    </button>
  );
}
