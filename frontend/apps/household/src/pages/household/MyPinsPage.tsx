import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { listPins, type Pin } from "@scrapsaathi/api-client";
import { StatusBadge } from "@scrapsaathi/ui-components";
import { RatePickerModal } from "./RatePickerModal.js";

interface MyPinsPageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const MyPinsPage: React.FC<MyPinsPageProps> = ({ onNavigate, locale }) => {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingPinId, setRatingPinId] = useState<string | null>(null);

  const fetchPins = async () => {
    try {
      setLoading(true);
      const res = await listPins({ zoneId: user?.zoneId || "zone_delhi_south" });
      setPins(res.pins);
    } catch (err) {
      console.error("Failed to load user pins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPins();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {locale === "hi" ? "मेरे पिकअप अनुरोध" : "My Pickup Requests"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "hi"
              ? "लाइव स्थिति ट्रैक करें: खुला ➜ कबाड़ीवाला आ रहा है ➜ पूर्ण"
              : "Track live status: Open ➜ Claimed by Picker ➜ Collected"}
          </p>
        </div>
        <button
          onClick={() => onNavigate("post-pin")}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>{locale === "hi" ? "नया पिन जोड़ें" : "Post New Pickup"}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading your pickup requests...
        </div>
      ) : pins.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-base font-bold text-white mb-1">
            {locale === "hi" ? "कोई सक्रिय अनुरोध नहीं है" : "No pickup requests found"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            {locale === "hi"
              ? "घर में बचा हुआ रद्दी अखबार, प्लास्टिक बोतलें या ई-कचरा बेचने के लिए नया पिन डालें।"
              : "Post your sellable scrap now and get a verified kabadiwala at your door."}
          </p>
          <button
            onClick={() => onNavigate("post-pin")}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
          >
            Post Pickup Request Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pins.map((pin) => (
            <div
              key={pin.pinId}
              className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/20">
                    {pin.materialType === "plastic" && "🧴"}
                    {pin.materialType === "paper" && "📰"}
                    {pin.materialType === "metal" && "🔩"}
                    {pin.materialType === "glass" && "🍾"}
                    {pin.materialType === "ewaste" && "💻"}
                    {pin.materialType === "mixed" && "📦"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-wide">
                      {pin.materialType} Scrap
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ID: <span className="font-mono text-slate-300">{pin.pinId}</span> • Zone: Delhi South
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={pin.status} />
                  {pin.status === "open" && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300">
                      Looking for nearby picker...
                    </span>
                  )}
                  {pin.status === "claimed" && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium animate-pulse">
                      ⚡ Picker En Route (45m hold)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Quantity Bucket</span>
                  <span className="text-white font-medium capitalize">{pin.quantityBucket}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Created</span>
                  <span className="text-slate-300">
                    {new Date(pin.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Coordinates</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {pin.lat}, {pin.lng}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Action</span>
                  {pin.status === "collected" ? (
                    <button
                      onClick={() => setRatingPinId(pin.pinId)}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>⭐ Rate Picker</span>
                    </button>
                  ) : pin.status === "claimed" ? (
                    <span className="text-emerald-400 font-semibold">
                      Assigned to Ramu Bhai
                    </span>
                  ) : (
                    <span className="text-slate-400">Awaiting claim</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ratingPinId && (
        <RatePickerModal
          pinId={ratingPinId}
          onClose={() => setRatingPinId(null)}
          onSuccess={() => {
            setRatingPinId(null);
            fetchPins();
          }}
          locale={locale}
        />
      )}
    </div>
  );
};
