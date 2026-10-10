import React, { useState } from "react";
import { setRates, type MaterialType } from "@scrapsaathi/api-client";

interface RateManagementPageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const RateManagementPage: React.FC<RateManagementPageProps> = ({ locale }) => {
  const [rates, setRatesState] = useState<Record<MaterialType, number>>({
    plastic: 16,
    paper: 14,
    metal: 46,
    glass: 7,
    ewaste: 55,
    mixed: 12,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRateChange = (mat: MaterialType, val: string) => {
    const num = parseFloat(val) || 0;
    setRatesState((prev) => ({ ...prev, [mat]: num }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await setRates("agg_delhi_south", { rates });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update rates");
    } finally {
      setSaving(false);
    }
  };

  const items: { key: MaterialType; label: string; hi: string; icon: string; typical: string }[] = [
    { key: "plastic", label: "PET Bottles & Rigid Plastics", hi: "प्लास्टिक व बोतल", icon: "🧴", typical: "₹14 - ₹18/kg" },
    { key: "paper", label: "Newspaper, Books & Cardboard", hi: "रद्दी अखबार व गत्ता", icon: "📰", typical: "₹12 - ₹16/kg" },
    { key: "metal", label: "Iron, Steel & Aluminium", hi: "लोहा, स्टील व एल्युमिनियम", icon: "🔩", typical: "₹38 - ₹55/kg" },
    { key: "glass", label: "Beer & Glass Bottles", hi: "कांच की बोतलें", icon: "🍾", typical: "₹5 - ₹8/kg" },
    { key: "ewaste", label: "Circuit Boards & Small Appliances", hi: "ई-कचरा व उपकरण", icon: "💻", typical: "₹30 - ₹120/kg" },
    { key: "mixed", label: "Assorted Dry Scrap", hi: "मिश्रित सूखा स्क्रैप", icon: "📦", typical: "₹10 - ₹14/kg" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {locale === "hi" ? "स्क्रैप खरीद दरें (बाजार भाव)" : "Daily Scrap Buy Rates Board"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "hi"
              ? "दैनिक मूल्य सेट करें। ये दरें कबाड़ीवालों और नागरिकों को तुरंत दिखाई देंगी।"
              : "Update wholesale purchase rates. These rates instantly calculate household earnings and picker margins."}
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold self-start sm:self-auto">
          Hub: Delhi South Aggregator
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
          <span>✓</span>
          <span>Rates updated and broadcast to all zone pickers and households!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-700 text-red-300 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Scrap Material
            </span>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Buy Rate (₹ per Kilogram)
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {locale === "hi" ? item.hi : item.label}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Benchmark: {item.typical}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    value={rates[item.key]}
                    onChange={(e) => handleRateChange(item.key, e.target.value)}
                    required
                    className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm text-right focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400 font-medium">/ kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {saving ? "Broadcasting Rates..." : "⚡ Save & Publish Today's Buy Rates"}
        </button>
      </form>
    </div>
  );
};
