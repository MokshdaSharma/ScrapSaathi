import React, { useEffect, useState } from "react";
import { getAggregatorRollup, type AggregatorRollupResponse } from "@scrapsaathi/api-client";

interface AggregatorDashboardProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const AggregatorDashboard: React.FC<AggregatorDashboardProps> = ({ onNavigate, locale }) => {
  const [rollup, setRollup] = useState<AggregatorRollupResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRollup() {
      try {
        const res = await getAggregatorRollup("agg_delhi_south");
        setRollup(res);
      } catch (err) {
        console.error("Failed to load rollup", err);
      } finally {
        setLoading(false);
      }
    }
    loadRollup();
  }, []);

  const totalExpectedKg = rollup
    ? Object.values(rollup.expectedVolumeKg).reduce((a: number, b = 0) => a + (b || 0), 0)
    : 165;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {locale === "hi" ? "रीसाइक्लिंग एग्रीगेटर हब" : "Aggregator Recycling Hub"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
              Zone: Delhi South
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "hi"
              ? "दैनिक स्क्रैप आवक, रीसाइक्लिंग वॉल्यूम और पंजीकृत कबाड़ीवालों का प्रबंधन।"
              : "Monitor daily scrap inflow volume, active field pickers, and wholesale dispatch readiness."}
          </p>
        </div>

        <button
          onClick={() => onNavigate("aggregator-rates")}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <span>💰</span>
          <span>Set Today's Buy Rates →</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Today's Inflow Volume</div>
          <div className="text-3xl font-extrabold text-blue-400 mt-1">
            {totalExpectedKg} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From claimed & collected pins</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Active Field Pickers</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {rollup?.activePickers ?? 3}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Currently operating in zone</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Wholesale Value</div>
          <div className="text-3xl font-extrabold text-white mt-1">
            ₹{Math.round(totalExpectedKg * 22.5)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Estimated smelter/mill price</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Baling Machine State</div>
          <div className="text-3xl font-extrabold text-teal-400 mt-1">Active</div>
          <div className="text-[11px] text-emerald-400 font-medium">Baling PET & Cardboard</div>
        </div>
      </div>

      {/* Material Inflow Distribution */}
      <div className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Expected Inflow by Material Category
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading rollup volume...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { key: "paper", label: "Paper/Cardboard", icon: "📰", color: "text-amber-400" },
              { key: "plastic", label: "Plastic/PET", icon: "🧴", color: "text-blue-400" },
              { key: "metal", label: "Metals/Iron", icon: "🔩", color: "text-zinc-300" },
              { key: "glass", label: "Glass Bottles", icon: "🍾", color: "text-emerald-400" },
              { key: "ewaste", label: "E-Waste Items", icon: "💻", color: "text-purple-400" },
              { key: "mixed", label: "Mixed Scrap", icon: "📦", color: "text-slate-300" },
            ].map((mat) => {
              const kg = (rollup?.expectedVolumeKg as any)?.[mat.key] ?? 15;
              return (
                <div
                  key={mat.key}
                  className="p-4 rounded-2xl bg-slate-800 border border-slate-700/60 text-center"
                >
                  <div className="text-2xl mb-1">{mat.icon}</div>
                  <div className={`text-base font-bold ${mat.color}`}>{kg} kg</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{mat.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispatch Truck Readiness */}
      <div className="rounded-3xl bg-slate-800/40 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚛</span>
            <h3 className="text-sm font-bold text-white">Daily Wholesale Mill Dispatch</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Truck dispatched daily at 6:30 PM to Okhla Industrial Area Smelting & Pulp Mills.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
          Capacity: 72% full (Bales staged)
        </div>
      </div>
    </div>
  );
};
