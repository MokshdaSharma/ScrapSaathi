import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { createPin, type MaterialType, type QuantityBucket } from "@scrapsaathi/api-client";
import { QuantityPicker } from "@scrapsaathi/ui-components";

interface PostPinPageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const PostPinPage: React.FC<PostPinPageProps> = ({ onNavigate, locale }) => {
  const { user } = useAuth();
  const [material, setMaterial] = useState<MaterialType>("paper");
  const [quantity, setQuantity] = useState<QuantityBucket>("medium");
  const [windowSlot, setWindowSlot] = useState<"morning" | "afternoon" | "evening">("morning");
  const [lat, setLat] = useState<number>(28.6185);
  const [lng, setLng] = useState<number>(27.2115);
  const [address, setAddress] = useState<string>("B-42, Hauz Khas Enclave, New Delhi");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successPinId, setSuccessPinId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Material rates estimate
  const ratesEstimate: Record<MaterialType, { min: number; max: number; unit: string }> = {
    plastic: { min: 14, max: 18, unit: "kg" },
    paper: { min: 12, max: 16, unit: "kg" },
    metal: { min: 38, max: 55, unit: "kg" },
    glass: { min: 4, max: 8, unit: "kg" },
    ewaste: { min: 30, max: 120, unit: "kg" },
    mixed: { min: 10, max: 15, unit: "kg" },
  };

  const weightMultiplier: Record<QuantityBucket, number> = {
    small: 5,
    medium: 18,
    large: 45,
  };

  const estimatedMin = ratesEstimate[material].min * weightMultiplier[quantity];
  const estimatedMax = ratesEstimate[material].max * weightMultiplier[quantity];

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
          setAddress("GPS Location detected (South Delhi)");
        },
        () => {
          setLat(28.6212);
          setLng(77.2145);
          setAddress("Sector 4, RK Puram, New Delhi (Simulated GPS)");
        }
      );
    } else {
      setLat(28.6212);
      setLng(77.2145);
      setAddress("Sector 4, RK Puram, New Delhi (Simulated GPS)");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const pickupWindow = `${startTime}/${endTime}`;

    try {
      const res = await createPin({
        householdId: user?.id || "user_household_1",
        lat,
        lng,
        materialType: material,
        quantityBucket: quantity,
        photoUrl: photoPreview || undefined,
        pickupWindow,
      });

      setSuccessPinId(res.pinId);
    } catch (err: any) {
      setError(err.message || "Failed to post scrap pickup pin");
    } finally {
      setSubmitting(false);
    }
  };

  if (successPinId) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 text-4xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {locale === "hi" ? "स्क्रैप पिन सफलतापूर्वक दर्ज हुई!" : "Scrap Pickup Request Posted!"}
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          {locale === "hi"
            ? `अनुरोध आईडी: ${successPinId}। निकटवर्ती कबाड़ीवालों को सूचित कर दिया गया है।`
            : `Request ID: ${successPinId}. Nearby verified kabadiwalas have been notified on the live map.`}
        </p>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left mb-6 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Material:</span>
            <span className="text-white font-semibold uppercase">{material}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Estimated Weight:</span>
            <span className="text-white font-semibold capitalize">{quantity} ({weightMultiplier[quantity]} kg)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Expected Payout:</span>
            <span className="text-emerald-400 font-bold">₹{estimatedMin} - ₹{estimatedMax}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Location:</span>
            <span className="text-white truncate max-w-[200px]">{address}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onNavigate("my-pins")}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition-all"
          >
            {locale === "hi" ? "मेरे अनुरोध ट्रैक करें" : "Track My Request →"}
          </button>
          <button
            onClick={() => {
              setSuccessPinId(null);
              setPhotoPreview(null);
            }}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold"
          >
            {locale === "hi" ? "एक और पिन डालें" : "Post Another"}
          </button>
        </div>
      </div>
    );
  }

  const materials: { id: MaterialType; label: string; hi: string; icon: string }[] = [
    { id: "paper", label: "Paper & Cardboard", hi: "रद्दी व अखबार", icon: "📰" },
    { id: "plastic", label: "Plastic & Bottles", hi: "प्लास्टिक व बोतल", icon: "🧴" },
    { id: "metal", label: "Metal & Iron", hi: "लोहा व तांबा", icon: "🔩" },
    { id: "glass", label: "Glass Bottles", hi: "कांच की बोतलें", icon: "🍾" },
    { id: "ewaste", label: "Electronics / E-Waste", hi: "ई-कचरा", icon: "💻" },
    { id: "mixed", label: "Mixed / Assorted Scrap", hi: "मिश्रित स्क्रैप", icon: "📦" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {locale === "hi" ? "स्क्रैप पिकअप बुक करें" : "Post Scrap Pickup Request"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "hi"
              ? "कबाड़ीवाला आपके दिए पते पर आकर वजन करेगा व तुरंत नकद/UPI भुगतान करेगा।"
              : "A verified local kabadiwala will claim your request and collect at your doorstep."}
          </p>
        </div>
        <button
          onClick={() => onNavigate("home")}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700"
        >
          ✕ Cancel
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Scrap Material Selector */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            1. {locale === "hi" ? "स्क्रैप का प्रकार चुनें" : "Select Scrap Type"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {materials.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMaterial(m.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  material === m.id
                    ? "bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-950"
                    : "bg-slate-800/80 border-slate-700/80 hover:border-slate-600"
                }`}
              >
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="text-xs font-bold text-white">
                  {locale === "hi" ? m.hi : m.label}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
                  ~₹{ratesEstimate[m.id].min}-{ratesEstimate[m.id].max}/kg
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Quantity Picker */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            2. {locale === "hi" ? "अनुमानित मात्रा (वजन)" : "Estimated Quantity"}
          </label>
          <QuantityPicker value={quantity} onChange={setQuantity} />
        </div>

        {/* Expected Earnings Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              {locale === "hi" ? "अनुमानित कमाई" : "Estimated Value to You"}
            </div>
            <div className="text-xl font-extrabold text-white mt-0.5">
              ₹{estimatedMin} - ₹{estimatedMax}
            </div>
            <div className="text-[11px] text-slate-400">
              Paid directly to you upon weighing at pickup
            </div>
          </div>
          <div className="text-3xl">💵</div>
        </div>

        {/* Step 3: Location Selection */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              3. {locale === "hi" ? "पिकअप का पता व स्थान" : "Pickup Location"}
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>📍</span>
              <span>{locale === "hi" ? "वर्तमान GPS उपयोग करें" : "Use GPS"}</span>
            </button>
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address, house number, area..."
            required
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-emerald-500"
          />
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Coordinates:</span>
            <span className="font-mono text-slate-300">{lat}, {lng}</span>
            <span className="text-slate-500">• Zone: Delhi South</span>
          </div>
        </div>

        {/* Step 4: Preferred Pickup Window */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            4. {locale === "hi" ? "सुविधाजनक समय स्लॉट" : "Preferred Pickup Time"}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "morning", label: "Morning", time: "9 AM - 12 PM" },
              { id: "afternoon", label: "Afternoon", time: "12 PM - 4 PM" },
              { id: "evening", label: "Evening", time: "4 PM - 7 PM" },
            ].map((slot) => (
              <button
                type="button"
                key={slot.id}
                onClick={() => setWindowSlot(slot.id as any)}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  windowSlot === slot.id
                    ? "bg-emerald-950/60 border-emerald-500 text-white"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs font-bold">{slot.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{slot.time}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Optional Photo */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            5. {locale === "hi" ? "स्क्रैप की फोटो जोड़ें (वैकल्पिक)" : "Photo of Scrap (Optional)"}
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2">
              <span>📷</span>
              <span>{photoPreview ? "Change Photo" : "Upload / Take Photo"}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Scrap Preview"
                  className="w-14 h-14 object-cover rounded-xl border border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <span>Posting to Live Map...</span>
          ) : (
            <>
              <span>♻</span>
              <span>{locale === "hi" ? "पिकअप अनुरोध दर्ज करें" : "Confirm & Post Scrap Pickup"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
