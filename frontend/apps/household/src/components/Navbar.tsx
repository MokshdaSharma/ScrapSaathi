import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import type { UserRole } from "@scrapsaathi/api-client";

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  locale: "en" | "hi";
  onToggleLocale: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  locale,
  onToggleLocale,
}) => {
  const { user, role, switchRole, logout, openAuthModal } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roleMeta = {
    household: {
      label: "Household",
      hindiLabel: "नागरिक",
      icon: "🏡",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    picker: {
      label: "Kabadiwala Picker",
      hindiLabel: "कबाड़ीवाला",
      icon: "🚲",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    aggregator: {
      label: "Aggregator Hub",
      hindiLabel: "रीसाइक्लिंग हब",
      icon: "🏭",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
  }[role];

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-950 font-bold">
            ♻
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Scrap<span className="text-emerald-400">Saathi</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                PROD
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              India's Clean Recycling Marketplace
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-2xl border border-slate-700/60">
          {role === "household" && (
            <>
              <button
                onClick={() => onSelectTab("home")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "home"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                🏠 {locale === "hi" ? "होम" : "Dashboard"}
              </button>
              <button
                onClick={() => onSelectTab("post-pin")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "post-pin"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                ➕ {locale === "hi" ? "स्क्रैप डालें" : "Post Scrap Pin"}
              </button>
              <button
                onClick={() => onSelectTab("my-pins")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "my-pins"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                📋 {locale === "hi" ? "मेरे अनुरोध" : "My Pins"}
              </button>
              <button
                onClick={() => onSelectTab("impact")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "impact"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                🌱 {locale === "hi" ? "इम्पैक्ट" : "Green Impact"}
              </button>
            </>
          )}

          {role === "picker" && (
            <>
              <button
                onClick={() => onSelectTab("picker-map")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "picker-map"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                🗺 {locale === "hi" ? "लाइव मैप" : "Live Map"}
              </button>
              <button
                onClick={() => onSelectTab("picker-route")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "picker-route"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                ⚡ {locale === "hi" ? "रूट ऑप्टिमाइज़र" : "Route Optimizer"}
              </button>
              <button
                onClick={() => onSelectTab("picker-stats")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "picker-stats"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                🔥 {locale === "hi" ? "मेरी कमाई व स्ट्रीक" : "Streak & Stats"}
              </button>
            </>
          )}

          {role === "aggregator" && (
            <>
              <button
                onClick={() => onSelectTab("aggregator-rollup")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "aggregator-rollup"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                📊 {locale === "hi" ? "दैनिक इनफ्लो" : "Daily Rollup"}
              </button>
              <button
                onClick={() => onSelectTab("aggregator-rates")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "aggregator-rates"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                💰 {locale === "hi" ? "दाम तय करें" : "Set Market Rates"}
              </button>
              <button
                onClick={() => onSelectTab("aggregator-pickers")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentTab === "aggregator-pickers"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                👥 {locale === "hi" ? "कबाड़ीवाले" : "Active Pickers"}
              </button>
            </>
          )}
        </nav>

        {/* Right side controls: Role switcher, Language, User profile */}
        <div className="flex items-center gap-2">
          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${roleMeta.color}`}
              title="Click to switch role perspective"
            >
              <span>{roleMeta.icon}</span>
              <span className="font-semibold">{locale === "hi" ? roleMeta.hindiLabel : roleMeta.label}</span>
              <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Portal
                </div>
                <button
                  onClick={() => {
                    switchRole("household");
                    onSelectTab("home");
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center gap-2 text-xs text-left hover:bg-slate-700/70 ${
                    role === "household" ? "text-emerald-400 font-semibold" : "text-slate-300"
                  }`}
                >
                  <span>🏡</span>
                  <span>Household (Priya Sharma)</span>
                </button>
                <button
                  onClick={() => {
                    switchRole("picker");
                    onSelectTab("picker-map");
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center gap-2 text-xs text-left hover:bg-slate-700/70 ${
                    role === "picker" ? "text-amber-400 font-semibold" : "text-slate-300"
                  }`}
                >
                  <span>🚲</span>
                  <span>Kabadiwala (Ramu Bhai)</span>
                </button>
                <button
                  onClick={() => {
                    switchRole("aggregator");
                    onSelectTab("aggregator-rollup");
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center gap-2 text-xs text-left hover:bg-slate-700/70 ${
                    role === "aggregator" ? "text-blue-400 font-semibold" : "text-slate-300"
                  }`}
                >
                  <span>🏭</span>
                  <span>Aggregator (Delhi Green)</span>
                </button>
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <button
            onClick={onToggleLocale}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            title="Toggle English / Hindi"
          >
            {locale === "en" ? "हिन्दी" : "EN"}
          </button>

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors"
                title="Account Settings"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs text-slate-200 hidden lg:inline max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>
              <button
                onClick={logout}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1.5 transition-colors"
                title="Log Out"
              >
                🚪
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
