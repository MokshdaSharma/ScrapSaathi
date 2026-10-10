import React, { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { Navbar } from "./components/Navbar.js";
import { BottomNav } from "./components/BottomNav.js";
import { AuthModal } from "./components/AuthModal.js";
import { OfflineBanner } from "@scrapsaathi/ui-components";

// Household Pages
import { HouseholdDashboard } from "./pages/household/HouseholdDashboard.js";
import { PostPinPage } from "./pages/household/PostPinPage.js";
import { MyPinsPage } from "./pages/household/MyPinsPage.js";
import { HouseholdImpactPage } from "./pages/household/HouseholdImpactPage.js";

// Picker Pages
import { PickerMapPage } from "./pages/picker/PickerMapPage.js";
import { PickerRoutePage } from "./pages/picker/PickerRoutePage.js";
import { PickerStatsPage } from "./pages/picker/PickerStatsPage.js";

// Aggregator Pages
import { AggregatorDashboard } from "./pages/aggregator/AggregatorDashboard.js";
import { RateManagementPage } from "./pages/aggregator/RateManagementPage.js";
import { PickerLeaderboardPage } from "./pages/aggregator/PickerLeaderboardPage.js";

function MainPortal() {
  const { role, isAuthModalOpen, closeAuthModal } = useAuth();
  const [locale, setLocale] = useState<"en" | "hi">("en");
  const [tab, setTab] = useState<string>("home");

  const toggleLocale = useCallback(() => {
    setLocale((l) => (l === "en" ? "hi" : "en"));
  }, []);

  // When role changes, switch to default tab for that role if necessary
  const handleSelectTab = useCallback((newTab: string) => {
    setTab(newTab);
  }, []);

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      <OfflineBanner />

      {/* Top Header Navbar */}
      <Navbar
        currentTab={tab}
        onSelectTab={handleSelectTab}
        locale={locale}
        onToggleLocale={toggleLocale}
      />

      {/* Main Content Area (supports Laptop wide screen & Mobile scroll) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-20 pb-24 md:pb-12">
        {/* Role: Household */}
        {role === "household" && (
          <>
            {tab === "home" && <HouseholdDashboard onNavigate={handleSelectTab} locale={locale} />}
            {tab === "post-pin" && <PostPinPage onNavigate={handleSelectTab} locale={locale} />}
            {tab === "my-pins" && <MyPinsPage onNavigate={handleSelectTab} locale={locale} />}
            {tab === "impact" && <HouseholdImpactPage onNavigate={handleSelectTab} locale={locale} />}
          </>
        )}

        {/* Role: Picker (Kabadiwala) */}
        {role === "picker" && (
          <>
            {(tab === "picker-map" || tab === "home") && (
              <PickerMapPage onNavigate={handleSelectTab} locale={locale} />
            )}
            {tab === "picker-route" && (
              <PickerRoutePage onNavigate={handleSelectTab} locale={locale} />
            )}
            {tab === "picker-stats" && (
              <PickerStatsPage onNavigate={handleSelectTab} locale={locale} />
            )}
          </>
        )}

        {/* Role: Aggregator */}
        {role === "aggregator" && (
          <>
            {(tab === "aggregator-rollup" || tab === "home") && (
              <AggregatorDashboard onNavigate={handleSelectTab} locale={locale} />
            )}
            {tab === "aggregator-rates" && (
              <RateManagementPage onNavigate={handleSelectTab} locale={locale} />
            )}
            {tab === "aggregator-pickers" && (
              <PickerLeaderboardPage onNavigate={handleSelectTab} locale={locale} />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Thumb Navigation */}
      <BottomNav currentTab={tab} onSelectTab={handleSelectTab} locale={locale} />

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}
