import React from "react";
import { useAuth } from "../context/AuthContext.js";

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  locale: "en" | "hi";
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, locale }) => {
  const { role, openAuthModal } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 safe-bottom">
      <div className="flex items-center justify-around">
        {role === "household" && (
          <>
            <button
              onClick={() => onSelectTab("home")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "home" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">🏠</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "होम" : "Home"}</span>
            </button>
            <button
              onClick={() => onSelectTab("post-pin")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "post-pin" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-950 -mt-3 mb-0.5">
                ➕
              </div>
              <span className="text-[10px] font-semibold text-emerald-400">{locale === "hi" ? "स्क्रैप" : "Post"}</span>
            </button>
            <button
              onClick={() => onSelectTab("my-pins")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "my-pins" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">📋</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "अनुरोध" : "Pins"}</span>
            </button>
            <button
              onClick={() => onSelectTab("impact")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "impact" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">🌱</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "इम्पैक्ट" : "Impact"}</span>
            </button>
            <button
              onClick={openAuthModal}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200"
            >
              <span className="text-xl">👤</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "प्रोफाइल" : "Profile"}</span>
            </button>
          </>
        )}

        {role === "picker" && (
          <>
            <button
              onClick={() => onSelectTab("picker-map")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "picker-map" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">🗺</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "मैप" : "Live Map"}</span>
            </button>
            <button
              onClick={() => onSelectTab("picker-route")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "picker-route" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 text-lg shadow-lg shadow-amber-950 -mt-3 mb-0.5 font-bold">
                ⚡
              </div>
              <span className="text-[10px] font-semibold text-amber-400">{locale === "hi" ? "रूट" : "Route"}</span>
            </button>
            <button
              onClick={() => onSelectTab("picker-stats")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "picker-stats" ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">🔥</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "स्ट्रीक" : "Streak"}</span>
            </button>
            <button
              onClick={openAuthModal}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200"
            >
              <span className="text-xl">👤</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "खाता" : "Account"}</span>
            </button>
          </>
        )}

        {role === "aggregator" && (
          <>
            <button
              onClick={() => onSelectTab("aggregator-rollup")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "aggregator-rollup" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">📊</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "रोलअप" : "Rollup"}</span>
            </button>
            <button
              onClick={() => onSelectTab("aggregator-rates")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "aggregator-rates" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">💰</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "दाम" : "Rates"}</span>
            </button>
            <button
              onClick={() => onSelectTab("aggregator-pickers")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === "aggregator-pickers" ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-xl">👥</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "पिकर्स" : "Pickers"}</span>
            </button>
            <button
              onClick={openAuthModal}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200"
            >
              <span className="text-xl">⚙</span>
              <span className="text-[10px] mt-0.5">{locale === "hi" ? "सेटिंग" : "Portal"}</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
