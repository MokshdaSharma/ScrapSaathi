import React from "react";
import { useAuth } from "../../context/AuthContext.js";

interface PickerStatsPageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const PickerStatsPage: React.FC<PickerStatsPageProps> = ({ locale }) => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {locale === "hi" ? "कबाड़ीवाला प्रोफाइल व स्ट्रीक" : "Picker Performance & Streak"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {locale === "hi"
            ? "आपकी विश्वसनीयता रेटिंग, दैनिक स्ट्रीक और रीसाइक्लिंग आय का विवरण।"
            : "Your reliability score, daily collection streak, and monthly earnings breakdown."}
        </p>
      </div>

      {/* Main Performance Header */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-800 to-slate-900 border border-amber-500/30 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 text-3xl flex items-center justify-center font-bold border border-amber-500/30">
              🚲
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-1">
                <span>⭐ Verified Master Picker</span>
              </div>
              <h2 className="text-2xl font-black text-white">{user?.name || "Ramu Bhai"}</h2>
              <p className="text-xs text-slate-400">Delhi South Hub • Member for 8 months</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <div className="text-2xl font-black text-amber-400">🔥 14</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Day Streak</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <div className="text-2xl font-black text-emerald-400">⭐ 4.88</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Rating</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <div className="text-2xl font-black text-cyan-400">142</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Pickups</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/80">
          <div className="text-xs text-slate-400 font-medium">Today's Estimated Earnings</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">₹1,420</div>
          <div className="text-[11px] text-slate-500 mt-1">From 4 scrap collections</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/80">
          <div className="text-xs text-slate-400 font-medium">This Week's Tonnage</div>
          <div className="text-3xl font-extrabold text-white mt-1">
            286 <span className="text-sm font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Delivered to Delhi Green Aggregator</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/80">
          <div className="text-xs text-slate-400 font-medium">Punctuality Score</div>
          <div className="text-3xl font-extrabold text-teal-400 mt-1">98.2%</div>
          <div className="text-[11px] text-slate-500 mt-1">Arrived inside 45-minute window</div>
        </div>
      </div>

      {/* Customer Trust Badges */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Household Customer Reviews
        </h3>
        <div className="space-y-3">
          {[
            {
              author: "Priya Sharma (Hauz Khas)",
              rating: 5,
              text: "Ramu bhai arrived right on time with a certified digital scale. Weighed all our cardboard books and paid via UPI instantly!",
              date: "Yesterday",
            },
            {
              author: "Vikram Malhotra (Saket)",
              rating: 5,
              text: "Very polite and honest. Helped carry the heavy old metal air cooler down from the second floor.",
              date: "3 days ago",
            },
            {
              author: "Anita Roy (Green Park)",
              rating: 5,
              text: "Fair rates, no bargaining hassle. ScrapSaathi has made selling scrap so dignified and fast.",
              date: "5 days ago",
            },
          ].map((rev, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white">{rev.author}</span>
                <span className="text-amber-400 font-bold">{"⭐".repeat(rev.rating)}</span>
              </div>
              <p className="text-xs text-slate-300 italic">"{rev.text}"</p>
              <div className="text-[10px] text-slate-500 mt-1">{rev.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
