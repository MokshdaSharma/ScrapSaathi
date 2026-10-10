import React, { useEffect, useState } from "react";
import { getDailyImpact, type DailyImpactDay } from "@scrapsaathi/api-client";

interface HouseholdImpactPageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const HouseholdImpactPage: React.FC<HouseholdImpactPageProps> = ({ locale }) => {
  const [days, setDays] = useState<DailyImpactDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImpact() {
      try {
        const res = await getDailyImpact({ zoneId: "zone_delhi_south", range: "7d" });
        setDays(res.days);
      } catch (err) {
        console.error("Failed to load impact", err);
      } finally {
        setLoading(false);
      }
    }
    loadImpact();
  }, []);

  const totalKg = 84.5;
  const co2AvoidedKg = Math.round(totalKg * 1.68);
  const treesEquiv = (totalKg * 0.045).toFixed(1);
  const waterSavedLiters = Math.round(totalKg * 26);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {locale === "hi" ? "आपका हरित प्रभाव (इम्पैक्ट स्कोर)" : "Your Green Impact Scorecard"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {locale === "hi"
            ? "हर किलो स्क्रैप जो आपने रिसाइकिल किया, उसने हमारी हवा, पानी और धरती को बचाया।"
            : "Every kilogram of recyclable scrap you sell saves landfill space and prevents carbon emissions."}
        </p>
      </div>

      {/* Main Impact Badge Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-800 to-slate-900 border border-emerald-500/30 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <span>🏅</span>
              <span>Green Citizen Tier 2</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-white">
              {totalKg} <span className="text-lg font-bold text-emerald-400">kg Recycled</span>
            </div>
            <p className="text-xs text-slate-300 max-w-md">
              You are among the top 15% eco-friendly households in South Delhi this month!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <div className="text-2xl mb-1">💨</div>
              <div className="text-base font-bold text-white">{co2AvoidedKg} kg</div>
              <div className="text-[10px] text-slate-400">CO2 Avoided</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <div className="text-2xl mb-1">🌳</div>
              <div className="text-base font-bold text-emerald-400">{treesEquiv}</div>
              <div className="text-[10px] text-slate-400">Trees Equiv.</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
              <div className="text-2xl mb-1">💧</div>
              <div className="text-base font-bold text-cyan-400">{waterSavedLiters} L</div>
              <div className="text-[10px] text-slate-400">Water Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Material */}
      <div className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Material Diversion Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Paper & Cardboard", kg: 38.2, pct: 45, icon: "📰", color: "bg-amber-500" },
            { label: "Plastic Bottles", kg: 24.5, pct: 29, icon: "🧴", color: "bg-blue-500" },
            { label: "Iron & Metals", kg: 14.8, pct: 18, icon: "🔩", color: "bg-zinc-400" },
            { label: "E-Waste / Glass", kg: 7.0, pct: 8, icon: "💻", color: "bg-purple-500" },
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-800 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-xl">{m.icon}</span>
                <span className="font-bold text-white">{m.kg} kg</span>
              </div>
              <div className="text-xs font-semibold text-slate-300">{m.label}</div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{m.pct}% of total</div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Impact Timeline */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
          Zone Daily Rollup (Past 7 Days)
        </h2>
        {loading ? (
          <div className="text-xs text-slate-400 py-6 text-center">Loading community impact...</div>
        ) : (
          <div className="space-y-2">
            {days.map((day) => {
              const total = Object.values(day.kgDiverted).reduce((a: number, b = 0) => a + (b || 0), 0);
              return (
                <div
                  key={day.date}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-slate-300">{day.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      Plastic: <b className="text-white">{day.kgDiverted.plastic ?? 0} kg</b>
                    </span>
                    <span className="text-slate-400">
                      Paper: <b className="text-white">{day.kgDiverted.paper ?? 0} kg</b>
                    </span>
                    <span className="text-emerald-400 font-bold">{total} kg total</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
