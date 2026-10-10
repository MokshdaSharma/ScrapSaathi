import React from "react";

interface PickerLeaderboardPageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const PickerLeaderboardPage: React.FC<PickerLeaderboardPageProps> = ({ locale }) => {
  const pickers = [
    {
      id: "picker_1",
      name: "Ramu Bhai",
      phone: "+91 98765 43211",
      rating: 4.88,
      streak: 14,
      collections: 142,
      tier: "Gold Tier",
      status: "Active on field",
    },
    {
      id: "picker_2",
      name: "Shyam Sundar",
      phone: "+91 98765 43222",
      rating: 4.75,
      streak: 8,
      collections: 98,
      tier: "Silver Tier",
      status: "Active on field",
    },
    {
      id: "picker_3",
      name: "Mohan Lal",
      phone: "+91 98765 43233",
      rating: 4.62,
      streak: 5,
      collections: 64,
      tier: "Bronze Tier",
      status: "Off duty",
    },
    {
      id: "picker_4",
      name: "Bablu Yadav",
      phone: "+91 98765 43244",
      rating: 4.91,
      streak: 21,
      collections: 210,
      tier: "Platinum Tier",
      status: "Active on field",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {locale === "hi" ? "पंजीकृत कबाड़ीवाले (पिकर डायरेक्टरी)" : "Registered Pickers Directory"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {locale === "hi"
            ? "कबाड़ीवालों की रेटिंग, दैनिक स्ट्रीक और रीसाइक्लिंग वॉल्यूम का विवरण।"
            : "Monitor reliability ratings, daily active streaks, and collection histories for kabadiwalas in your zone."}
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Picker Name & Contact</th>
                <th className="py-3.5 px-4">Reliability Rating</th>
                <th className="py-3.5 px-4">Daily Streak</th>
                <th className="py-3.5 px-4">Lifetime Pickups</th>
                <th className="py-3.5 px-4">Partner Tier</th>
                <th className="py-3.5 px-4">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {pickers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{p.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-amber-400">⭐ {p.rating}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white">🔥 {p.streak} days</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {p.collections} orders
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-600">
                      {p.tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                        p.status.includes("Active") ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          p.status.includes("Active") ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                      />
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
