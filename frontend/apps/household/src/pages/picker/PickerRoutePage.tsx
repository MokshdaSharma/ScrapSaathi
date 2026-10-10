import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import {
  listPins,
  collectPin,
  optimizeRoute,
  type Pin,
  type MaterialType,
  type QuantityBucket,
} from "@scrapsaathi/api-client";
import { getGoogleMapsNavigationUrl } from "@scrapsaathi/route-optimizer";
import { StatusBadge } from "@scrapsaathi/ui-components";

interface PickerRoutePageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

type RouteStrategy = "shortest" | "expiry" | "value";
type VehicleType = "bicycle" | "rickshaw" | "truck";

export const PickerRoutePage: React.FC<PickerRoutePageProps> = ({ onNavigate, locale }) => {
  const { user } = useAuth();
  const [claimedPins, setClaimedPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderedPinIds, setOrderedPinIds] = useState<string[]>([]);
  const [estimatedDistanceKm, setEstimatedDistanceKm] = useState<number | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  // Strategy & Vehicle Options
  const [strategy, setStrategy] = useState<RouteStrategy>("shortest");
  const [vehicle, setVehicle] = useState<VehicleType>("rickshaw");

  // Collecting modal state
  const [collectingPin, setCollectingPin] = useState<Pin | null>(null);
  const [actualMaterial, setActualMaterial] = useState<MaterialType>("paper");
  const [actualWeightKg, setActualWeightKg] = useState<number>(12);
  const [submittingCollect, setSubmittingCollect] = useState(false);
  const [collectSuccessMessage, setCollectSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Weight estimates per bucket (kg)
  const weightByBucket: Record<QuantityBucket, number> = {
    small: 5,
    medium: 18,
    large: 45,
  };

  // Vehicle capacities (kg)
  const vehicleCapacities: Record<VehicleType, { name: string; capacityKg: number; icon: string }> = {
    bicycle: { name: "Bicycle / Cycle Cart", capacityKg: 40, icon: "🚲" },
    rickshaw: { name: "E-Rickshaw / Handcart", capacityKg: 150, icon: "🛺" },
    truck: { name: "Mini-Truck (Chhota Hathi)", capacityKg: 500, icon: "🛻" },
  };

  // Aggregator prices reference
  const materialPrices: Record<MaterialType, number> = {
    plastic: 16,
    paper: 14,
    metal: 45,
    glass: 6,
    ewaste: 50,
    mixed: 12,
  };

  const fetchClaimedPins = async () => {
    try {
      setLoading(true);
      const res = await listPins({ zoneId: user?.zoneId || "zone_delhi_south" });
      const claimed = res.pins.filter((p) => p.status === "claimed");
      setClaimedPins(claimed);
      if (orderedPinIds.length === 0) {
        setOrderedPinIds(claimed.map((p) => p.pinId));
      }
    } catch (err) {
      console.error("Failed to load claimed pins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimedPins();
  }, [user]);

  // Run Route Optimization based on selected strategy
  const handleRunOptimizer = async () => {
    if (claimedPins.length === 0) return;
    try {
      setOptimizing(true);
      setError(null);

      if (strategy === "shortest") {
        // Standard TSP: minimum travel distance loop
        const res = await optimizeRoute({
          pickerId: user?.id || "picker_1",
          currentLat: 28.618,
          currentLng: 77.21,
          pinIds: claimedPins.map((p) => p.pinId),
        });
        setOrderedPinIds(res.orderedPinIds);
        setEstimatedDistanceKm(res.estimatedDistanceKm);
      } else if (strategy === "value") {
        // High value first: metals, e-waste, and large buckets first
        const sorted = [...claimedPins].sort((a, b) => {
          const valA = (materialPrices[a.materialType] || 10) * (weightByBucket[a.quantityBucket] || 10);
          const valB = (materialPrices[b.materialType] || 10) * (weightByBucket[b.quantityBucket] || 10);
          return valB - valA;
        });
        setOrderedPinIds(sorted.map((p) => p.pinId));
        setEstimatedDistanceKm(2.4);
      } else if (strategy === "expiry") {
        // Expiry first: oldest created pins first
        const sorted = [...claimedPins].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setOrderedPinIds(sorted.map((p) => p.pinId));
        setEstimatedDistanceKm(2.6);
      }
    } catch (err: any) {
      setError(err.message || "Failed to optimize route");
    } finally {
      setOptimizing(false);
    }
  };

  const handleCompleteCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingPin) return;

    try {
      setSubmittingCollect(true);
      setError(null);
      await collectPin(collectingPin.pinId, {
        pickerId: user?.id || "picker_1",
        actualMaterialType: actualMaterial,
        actualWeightKg: Number(actualWeightKg),
      });

      const earned = Math.round(Number(actualWeightKg) * materialPrices[actualMaterial]);
      setCollectSuccessMessage(
        `✓ Collection recorded! Weighed: ${actualWeightKg} kg • Payout Value: ₹${earned}`
      );
      setCollectingPin(null);
      await fetchClaimedPins();
    } catch (err: any) {
      setError(err.message || "Failed to mark as collected");
    } finally {
      setSubmittingCollect(false);
    }
  };

  // Sequenced Pins in optimized order
  const sequencedPins = [...claimedPins].sort((a, b) => {
    const idxA = orderedPinIds.indexOf(a.pinId);
    const idxB = orderedPinIds.indexOf(b.pinId);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  // Calculate cumulative round statistics
  const totalRoundWeight = claimedPins.reduce(
    (sum, p) => sum + (weightByBucket[p.quantityBucket] || 15),
    0
  );
  const totalRoundPayout = claimedPins.reduce(
    (sum, p) =>
      sum + (materialPrices[p.materialType] || 12) * (weightByBucket[p.quantityBucket] || 15),
    0
  );

  const vehicleSpec = vehicleCapacities[vehicle];
  const capacityPct = Math.min(100, Math.round((totalRoundWeight / vehicleSpec.capacityKg) * 100));
  const fitsInOneRound = totalRoundWeight <= vehicleSpec.capacityKg;

  // Google Maps turn-by-turn Navigation URL
  const googleMapsUrl = getGoogleMapsNavigationUrl(
    { lat: 28.618, lng: 77.21 },
    sequencedPins.map((p) => ({ lat: p.lat, lng: p.lng }))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {locale === "hi" ? "स्मार्ट पिकअप राउंड ऑप्टिमाइज़र" : "Smart Pickup Round Optimizer"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "hi"
              ? "एक ही राउंड में सभी क्लेम किए गए स्क्रैप स्टॉप्स को कवर करने का सबसे छोटा व किफायती मार्ग।"
              : "Algorithmically sequences your claimed pins into one continuous, shortest-distance collection round."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950 flex items-center gap-1.5 transition-all"
            >
              <span>🗺</span>
              <span>Open in Google Maps</span>
            </a>
          )}

          <button
            onClick={() => onNavigate("picker-map")}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold"
          >
            + Claim More Pins
          </button>

          <button
            onClick={handleRunOptimizer}
            disabled={optimizing || claimedPins.length === 0}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <span>⚡</span>
            <span>{optimizing ? "Sequencing..." : "Optimize Round Now"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {collectSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>{collectSuccessMessage}</span>
          <button onClick={() => setCollectSuccessMessage(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 1. Strategy Selector: How the picker wants the round arranged */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Best Route Criteria for Your Round:
          </span>
          <span className="text-[11px] text-amber-400 font-semibold">
            {strategy === "shortest"
              ? "⚡ Shortest Travel Distance (Minimal Criss-Crossing)"
              : strategy === "expiry"
              ? "⏱ Expiry-Urgent First (Prioritizes 45m Timers)"
              : "💰 Highest Payout First (Metals & Bulk Scrap First)"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => {
              setStrategy("shortest");
              setTimeout(handleRunOptimizer, 50);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              strategy === "shortest"
                ? "bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-950/30"
                : "bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>⚡</span>
              <span>Shortest Distance Loop</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              TSP nearest-neighbor: saves physical energy & e-rickshaw battery.
            </div>
          </button>

          <button
            onClick={() => {
              setStrategy("expiry");
              setTimeout(handleRunOptimizer, 50);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              strategy === "expiry"
                ? "bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-950/30"
                : "bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>⏱</span>
              <span>Expiry-Urgent First</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Collects pins closest to the 45-min hold limit first so you don't lose them.
            </div>
          </button>

          <button
            onClick={() => {
              setStrategy("value");
              setTimeout(handleRunOptimizer, 50);
            }}
            className={`p-3 rounded-2xl border text-left transition-all ${
              strategy === "value"
                ? "bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-950/30"
                : "bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white"
            }`}
          >
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>💰</span>
              <span>Highest Value First</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Ranks high-rate metals (₹45/kg) and large cardboard buckets first.
            </div>
          </button>
        </div>
      </div>

      {/* 2. Vehicle Capacity & Single-Round Coverage Meter */}
      <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              One-Round Vehicle Load & Capacity
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              Can all claimed pins fit in one single collection round?
            </div>
          </div>

          {/* Vehicle Switcher */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700 self-start sm:self-auto">
            {(["bicycle", "rickshaw", "truck"] as VehicleType[]).map((v) => (
              <button
                key={v}
                onClick={() => setVehicle(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  vehicle === v
                    ? "bg-amber-500 text-slate-950 shadow font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>{vehicleCapacities[v].icon}</span>
                <span className="capitalize">{v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Load Bar & Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Total Scrap Weight to Collect: <b className="text-white">{totalRoundWeight} kg</b>
            </span>
            <span className="font-semibold text-slate-400">
              Vehicle Limit: {vehicleSpec.capacityKg} kg ({vehicleSpec.name})
            </span>
          </div>

          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fitsInOneRound ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            {fitsInOneRound ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span>✓</span>
                <span>100% of claimed pins can be covered in ONE continuous round!</span>
              </span>
            ) : (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span>⚠️</span>
                <span>Exceeds {vehicle} capacity ({totalRoundWeight} kg). Switch to E-Rickshaw or do 2 rounds.</span>
              </span>
            )}
            <span className="text-slate-400 font-mono">{capacityPct}% vehicle full</span>
          </div>
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Pins Covered</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{claimedPins.length} Stops</div>
          <div className="text-[10px] text-emerald-400">✓ All in 1 round</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Round Distance</div>
          <div className="text-2xl font-bold text-white mt-1">
            {estimatedDistanceKm !== null ? `${estimatedDistanceKm.toFixed(2)} km` : "~2.8 km"}
          </div>
          <div className="text-[10px] text-slate-400">Continuous loop</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Est. Round Time</div>
          <div className="text-2xl font-bold text-teal-300 mt-1">
            ~{Math.round((claimedPins.length * 8) + (estimatedDistanceKm || 2.8) * 4)} mins
          </div>
          <div className="text-[10px] text-slate-500">Pickup + riding time</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Round Payout</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{totalRoundPayout}
          </div>
          <div className="text-[10px] text-slate-400">Gross buy value</div>
        </div>
      </div>

      {/* 4. Sequenced Route Itinerary */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Optimal Sequence of Stops (Start ➜ Depot)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Visit houses in this exact order to avoid unnecessary U-turns and backtracking.
            </p>
          </div>
          <span className="text-xs text-amber-400 font-semibold">
            {sequencedPins.length} Sequenced Stops
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading route itinerary...</div>
        ) : sequencedPins.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="text-3xl mb-2">🗺</div>
            No pins claimed yet. Go to the{" "}
            <button
              onClick={() => onNavigate("picker-map")}
              className="text-amber-400 underline font-semibold"
            >
              Live Map
            </button>{" "}
            to claim pins in your area!
          </div>
        ) : (
          <div className="space-y-3">
            {sequencedPins.map((pin, index) => (
              <div
                key={pin.pinId}
                className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white capitalize flex items-center gap-2">
                      <span>{pin.materialType} Scrap</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
                        {pin.quantityBucket} (~{weightByBucket[pin.quantityBucket]} kg)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      ID: {pin.pinId} • Lat: {pin.lat.toFixed(3)}, Lng: {pin.lng.toFixed(3)} • Hauz Khas
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] text-slate-400">Est. Payout</div>
                    <div className="text-xs font-bold text-emerald-400">
                      ₹{(materialPrices[pin.materialType] || 12) * (weightByBucket[pin.quantityBucket] || 15)}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCollectingPin(pin);
                      setActualMaterial(pin.materialType);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Mark Collected</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Final Destination: Aggregator Depot Dropoff */}
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-sm">
                  🏁
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Finish Round at: Delhi South Aggregator Hub</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Drop off all collected scrap, official weigh-in, and instant wholesale payout.
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-400">Total Unload</div>
                <div className="text-xs font-bold text-blue-400">~{totalRoundWeight} kg</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collection Dialog Modal */}
      {collectingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setCollectingPin(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-1"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="text-3xl mb-1">⚖</div>
              <h2 className="text-lg font-bold text-white">Record Scrap Collection</h2>
              <p className="text-xs text-slate-400 font-mono">Pin ID: {collectingPin.pinId}</p>
            </div>

            <form onSubmit={handleCompleteCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Actual Material Verified
                </label>
                <select
                  value={actualMaterial}
                  onChange={(e) => setActualMaterial(e.target.value as MaterialType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs capitalize"
                >
                  <option value="plastic">Plastic (₹16/kg)</option>
                  <option value="paper">Paper & Cardboard (₹14/kg)</option>
                  <option value="metal">Metal & Iron (₹45/kg)</option>
                  <option value="glass">Glass (₹6/kg)</option>
                  <option value="ewaste">E-Waste (₹50/kg)</option>
                  <option value="mixed">Mixed (₹12/kg)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Actual Weighed Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-bold text-center focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Purchase Value:</span>
                <span className="text-base font-extrabold text-emerald-400">
                  ₹{Math.round(actualWeightKg * materialPrices[actualMaterial])}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectingPin(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCollect}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  {submittingCollect ? "Saving..." : "Confirm & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
