import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { listPins, type Pin } from "@scrapsaathi/api-client";
import { StatusBadge } from "@scrapsaathi/ui-components";

interface HouseholdDashboardProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const HouseholdDashboard: React.FC<HouseholdDashboardProps> = ({ onNavigate, locale }) => {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await listPins({ zoneId: user?.zoneId || "zone_delhi_south" });
        setPins(res.pins);
      } catch (err) {
        console.error("Failed to load pins", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const activePins = pins.filter((p) => p.status === "open" || p.status === "claimed");
  const collectedCount = pins.filter((p) => p.status === "collected").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/60 via-slate-800 to-slate-900 border border-emerald-500/20 p-6 md:p-8 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/30">
            <span>✨</span>
            <span>{locale === "hi" ? "स्वच्छ भारत • हरित भारत" : "Clean Cities • Fair Earnings"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {locale === "hi"
              ? "घर का स्क्रैप बेचें, घर बैठे कबाड़ीवाला बुलाएं!"
              : "Sell household scrap, get instant pickup from verified kabadiwalas."}
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-3 leading-relaxed">
            {locale === "hi"
              ? "प्लास्टिक, कागज, लोहा और ई-वेस्ट का सही वजन और उचित मूल्य। कबाड़ीवाला आपके दरवाजे पर आकर पिकअप करेगा।"
              : "Guaranteed fair weighing, transparent rates per kg, and direct pickup at your preferred time slot."}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate("post-pin")}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950 flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>♻</span>
              <span>{locale === "hi" ? "स्क्रैप पिकअप बुक करें" : "Post Scrap Pickup Now"}</span>
            </button>
            <button
              onClick={() => onNavigate("my-pins")}
              className="px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition-all"
            >
              {locale === "hi" ? "मेरे अनुरोध देखें" : "View My Requests"}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">
            {locale === "hi" ? "सक्रिय पिकअप" : "Active Pickups"}
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {activePins.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {locale === "hi" ? "रास्ते में या प्रतीक्षारत" : "In progress / open"}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">
            {locale === "hi" ? "सफल पिकअप" : "Completed Pickups"}
          </div>
          <div className="text-2xl font-bold text-teal-400 mt-1">
            {collectedCount + 12}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {locale === "hi" ? "रीसाइक्लिंग हेतु भेजा गया" : "Diverted from landfill"}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">
            {locale === "hi" ? "कुल वजन बचाया" : "Recycled Weight"}
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            84.5 <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {locale === "hi" ? "अनुमानित कुल मात्रा" : "Lifetime recycled"}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">
            {locale === "hi" ? "कार्बन कटौती (CO2)" : "Carbon Avoided"}
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">
            142 <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {locale === "hi" ? "पर्यावरण बचत" : "Eco Impact Score"}
          </div>
        </div>
      </div>

      {/* Accepted Scrap Categories */}
      <div className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-base font-bold text-white mb-3">
          {locale === "hi" ? "हम क्या-क्या स्क्रैप स्वीकार करते हैं?" : "What Scrap Materials Can You Post?"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: "Plastic", hi: "प्लास्टिक", rate: "₹14-18/kg", icon: "🧴", color: "from-blue-900/40 to-blue-950/20" },
            { name: "Paper / Books", hi: "कागज व रद्दी", rate: "₹12-16/kg", icon: "📰", color: "from-amber-900/40 to-amber-950/20" },
            { name: "Metal / Iron", hi: "लोहा व धातु", rate: "₹35-50/kg", icon: "🔩", color: "from-zinc-800 to-zinc-900" },
            { name: "Glass Bottles", hi: "कांच की बोतलें", rate: "₹4-8/kg", icon: "🍾", color: "from-emerald-900/40 to-emerald-950/20" },
            { name: "E-Waste", hi: "ई-कचरा", rate: "₹25-100/kg", icon: "💻", color: "from-purple-900/40 to-purple-950/20" },
            { name: "Mixed Scrap", hi: "मिश्रित स्क्रैप", rate: "₹10-15/kg", icon: "📦", color: "from-slate-800 to-slate-900" },
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => onNavigate("post-pin")}
              className={`cursor-pointer rounded-2xl p-3.5 bg-gradient-to-b ${item.color} border border-slate-700/60 hover:border-emerald-500 transition-all text-center hover:-translate-y-1`}
            >
              <div className="text-3xl mb-1">{item.icon}</div>
              <div className="text-xs font-bold text-white">
                {locale === "hi" ? item.hi : item.name}
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                {item.rate}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Recent Pins */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">
            {locale === "hi" ? "हाल के पिकअप अनुरोध" : "Recent Pickup Requests in Your Zone"}
          </h2>
          <button
            onClick={() => onNavigate("my-pins")}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            {locale === "hi" ? "सभी देखें →" : "View All →"}
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 py-6 text-center">Loading live pins...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pins.slice(0, 6).map((pin) => (
              <div
                key={pin.pinId}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {pin.materialType}
                    </span>
                    <StatusBadge status={pin.status} />
                  </div>
                  <div className="text-xs text-slate-400">
                    Quantity: <span className="text-white font-medium capitalize">{pin.quantityBucket}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Posted: {new Date(pin.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Zone: Delhi South</span>
                  <button
                    onClick={() => onNavigate("my-pins")}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Track →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
