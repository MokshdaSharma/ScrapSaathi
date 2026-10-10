import { useEffect, useRef } from "react";
import type { Pin } from "@scrapsaathi/api-client";

export interface MapViewProps {
  pins: Pin[];
  center?: [number, number];
  zoom?: number;
  onPinClick?: (pin: Pin) => void;
  className?: string;
  routeCoordinates?: [number, number][]; // Street polyline points [lat, lng]
  userLocation?: { lat: number; lng: number }; // Picker live GPS point
  stopOrderMap?: Record<string, number>; // pinId -> 1-based stop number
  activeStopPinId?: string; // Currently targeted next stop
}

const materialColors: Record<string, string> = {
  plastic: "#3B82F6",
  paper: "#EAB308",
  metal: "#9CA3AF",
  glass: "#14B8A6",
  ewaste: "#8B5CF6",
  mixed: "#F97316",
};

const materialIcons: Record<string, string> = {
  plastic: "🧴",
  paper: "📰",
  metal: "🔩",
  glass: "🍾",
  ewaste: "💻",
  mixed: "📦",
};

const statusColors: Record<string, string> = {
  open: "#22C55E",
  claimed: "#F59E0B",
  collected: "#64748B",
  expired: "#EF4444",
};

const quantitySizes: Record<string, number> = {
  small: 26,
  medium: 34,
  large: 42,
};

/**
 * MapView — Leaflet map with OpenStreetMap tiles, live GPS marker,
 * road-snapped polyline routing, and numbered stops for live round navigation.
 */
export function MapView({
  pins,
  center = [28.6185, 77.2115],
  zoom = 14,
  onPinClick,
  className = "",
  routeCoordinates,
  userLocation,
  stopOrderMap,
  activeStopPinId,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const routePolylinesRef = useRef<import("leaflet").Polyline[]>([]);

  // 1. Initialize Map
  useEffect(() => {
    let destroyed = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;

      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (destroyed || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    void init();
    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Update Pins & Sequenced Stop Badges
  useEffect(() => {
    if (!mapRef.current) return;

    async function updatePins() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;

      // Remove previous markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const pin of pins) {
        const size = quantitySizes[pin.quantityBucket] ?? 30;
        const matColor = materialColors[pin.materialType] ?? "#888";
        const statusColor = statusColors[pin.status] ?? "#888";
        const stopNumber = stopOrderMap ? stopOrderMap[pin.pinId] : undefined;
        const isActive = activeStopPinId === pin.pinId;
        const matIcon = materialIcons[pin.materialType] || "♻";

        let iconHtml: string;

        if (stopNumber !== undefined) {
          // Numbered Route Stop Marker (Google Maps Style)
          iconHtml = `
            <div style="
              position:relative;
              display:flex;
              align-items:center;
              justify-content:center;
              width:${isActive ? size + 10 : size + 4}px;
              height:${isActive ? size + 10 : size + 4}px;
              border-radius:50%;
              background:${isActive ? "#F59E0B" : "#1E293B"};
              border:3px solid ${isActive ? "#FFFFFF" : matColor};
              box-shadow:0 4px 12px rgba(0,0,0,0.45)${isActive ? ", 0 0 0 4px rgba(245, 158, 11, 0.45)" : ""};
              cursor:pointer;
              transition:transform 0.15s ease;
            ">
              <span style="
                position:absolute;
                top:-8px;
                left:-6px;
                background:${isActive ? "#EF4444" : "#10B981"};
                color:white;
                font-weight:800;
                font-size:10px;
                line-height:1;
                padding:2px 5px;
                border-radius:10px;
                box-shadow:0 2px 4px rgba(0,0,0,0.3);
                border:1px solid white;
              ">
                #${stopNumber}
              </span>
              <span style="font-size:${size * 0.45}px;line-height:1;">${matIcon}</span>
            </div>
          `;
        } else {
          // Standard Pin Marker
          iconHtml = `
            <div style="
              width:${size}px;height:${size}px;border-radius:50%;
              background:${matColor};border:3px solid ${statusColor};
              box-shadow:0 0 0 2px ${statusColor}60, 0 3px 8px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;transition:transform 0.15s;
            ">
              <span style="font-size:${size * 0.42}px;line-height:1;">${matIcon}</span>
            </div>
          `;
        }

        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [size + 4, size + 4],
          iconAnchor: [(size + 4) / 2, (size + 4) / 2],
        });

        const marker = L.marker([pin.lat, pin.lng], { icon });
        marker.addTo(map);

        if (onPinClick) {
          marker.on("click", () => onPinClick(pin));
        }

        markersRef.current.push(marker);
      }
    }

    void updatePins();
  }, [pins, onPinClick, stopOrderMap, activeStopPinId]);

  // 3. Update User Live GPS Marker
  useEffect(() => {
    if (!mapRef.current) return;

    async function updateUserLocation() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (userLocation) {
        const userHtml = `
          <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#3B82F6;opacity:0.35;animation:pulse-dot 1.8s infinite;"></div>
            <div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);z-index:2;"></div>
          </div>
        `;

        const userIcon = L.divIcon({
          html: userHtml,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        userMarkerRef.current = marker;
      }
    }

    void updateUserLocation();
  }, [userLocation]);

  // 4. Update Street-Snapped Route Polyline
  useEffect(() => {
    if (!mapRef.current) return;

    async function updateRoute() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;

      // Clear existing polylines
      routePolylinesRef.current.forEach((p) => p.remove());
      routePolylinesRef.current = [];

      if (routeCoordinates && routeCoordinates.length >= 2) {
        // Outer glowing outline
        const glow = L.polyline(routeCoordinates, {
          color: "#F59E0B",
          weight: 8,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        // Core directional road line
        const core = L.polyline(routeCoordinates, {
          color: "#D97706",
          weight: 4.5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        routePolylinesRef.current = [glow, core];

        // Auto zoom & pan to show the route neatly
        try {
          map.fitBounds(core.getBounds(), { padding: [40, 40], maxZoom: 16 });
        } catch {
          // ignore if bounds zero
        }
      }
    }

    void updateRoute();
  }, [routeCoordinates]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-2xl overflow-hidden ${className}`}
      style={{ minHeight: 300 }}
      role="region"
      aria-label="Scrap pickup live map"
    />
  );
}
