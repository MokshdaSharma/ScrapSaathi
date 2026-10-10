import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.js";
import {
  listPins,
  claimPin,
  collectPin,
  type Pin,
  type MaterialType,
} from "@scrapsaathi/api-client";
import {
  fetchStreetRoute,
  optimizeRouteLocally,
  getGoogleMapsNavigationUrl,
  type StreetRouteResult,
} from "@scrapsaathi/route-optimizer";
import { MapView, StatusBadge } from "@scrapsaathi/ui-components";

interface PickerMapPageProps {
  onNavigate: (tab: string) => void;
  locale: "en" | "hi";
}

export const PickerMapPage: React.FC<PickerMapPageProps> = ({ onNavigate, locale }) => {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [filterMaterial, setFilterMaterial] = useState<string>("all");

  // Live Location & GPS
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 28.6185,
    lng: 77.2115,
  });
  const [isGpsActive, setIsGpsActive] = useState(false);

  // Live Routing State (Google Maps Style)
  const [isLiveRouteMode, setIsLiveRouteMode] = useState<boolean>(true);
  const [routeModeType, setRouteModeType] = useState<"claimed" | "suggested">("claimed");
  const [streetRoute, setStreetRoute] = useState<StreetRouteResult | null>(null);
  const [orderedStops, setOrderedStops] = useState<Pin[]>([]);
  const [stopOrderMap, setStopOrderMap] = useState<Record<string, number>>({});
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [isRouting, setIsRouting] = useState(false);

  // Claim & Collect Actions
  const [claiming, setClaiming] = useState(false);
  const [collectingPin, setCollectingPin] = useState<Pin | null>(null);
  const [actualMaterial, setActualMaterial] = useState<MaterialType>("paper");
  const [actualWeightKg, setActualWeightKg] = useState<number>(14);
  const [submittingCollect, setSubmittingCollect] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Aggregator prices for estimated payout
  const materialPrices: Record<MaterialType, number> = {
    plastic: 16,
    paper: 14,
    metal: 45,
    glass: 6,
    ewaste: 50,
    mixed: 12,
  };

  // 1. Fetch Pins from Backend
  const fetchPins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listPins({ zoneId: user?.zoneId || "zone_delhi_south" });
      setPins(res.pins);
    } catch (err) {
      console.error("Failed to load map pins", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  // 2. Setup Live Geolocation Tracker
  useEffect(() => {
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsGpsActive(true);
        },
        () => {
          // Fallback to simulated Delhi South coordinates
          setIsGpsActive(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 3. Compute Live Street Route (Snapped to Roads via OSRM + TSP)
  const calculateRoute = useCallback(
    async (currentPins: Pin[], mode: "claimed" | "suggested", origin: { lat: number; lng: number }) => {
      setIsRouting(true);
      try {
        let candidatePins = currentPins;
        if (mode === "claimed") {
          candidatePins = currentPins.filter((p) => p.status === "claimed");
          // If no claimed pins, fallback to suggested open pins so route is never empty
          if (candidatePins.length === 0) {
            candidatePins = currentPins.filter((p) => p.status === "open").slice(0, 5);
          }
        } else {
          // Suggested patrol route: pick up to 6 open pins in the area
          candidatePins = currentPins.filter((p) => p.status === "open").slice(0, 6);
        }

        if (candidatePins.length === 0) {
          setStreetRoute(null);
          setOrderedStops([]);
          setStopOrderMap({});
          setIsRouting(false);
          return;
        }

        // Run TSP Nearest-Neighbour sequence from current GPS location
        const tspResult = optimizeRouteLocally(origin.lat, origin.lng, candidatePins);
        const pinMap = new Map(candidatePins.map((p) => [p.pinId, p]));
        const ordered: Pin[] = [];
        const orderMap: Record<string, number> = {};

        tspResult.orderedPinIds.forEach((id, index) => {
          const pin = pinMap.get(id);
          if (pin) {
            ordered.push(pin);
            orderMap[id] = index + 1;
          }
        });

        // Query OSRM Street Navigation API for road-snapped polyline
        const routeResult = await fetchStreetRoute(origin, ordered);

        setOrderedStops(ordered);
        setStopOrderMap(orderMap);
        setStreetRoute(routeResult);
        setActiveStopIndex(0);
      } catch (err) {
        console.error("Error computing street route:", err);
      } finally {
        setIsRouting(false);
      }
    },
    []
  );

  // Trigger route computation when pins, mode, or route toggle changes
  useEffect(() => {
    if (isLiveRouteMode && pins.length > 0) {
      calculateRoute(pins, routeModeType, userLocation);
    } else {
      setStreetRoute(null);
      setStopOrderMap({});
      setOrderedStops([]);
    }
  }, [isLiveRouteMode, routeModeType, pins, calculateRoute, userLocation]);

  // Handle Pin Claiming
  const handleClaim = async (pinId: string) => {
    try {
      setClaiming(true);
      await claimPin(pinId, { pickerId: user?.id || "picker_1" });
      setNotification({
        text: `✓ Pin ${pinId} claimed! Route updated with 45m hold.`,
        type: "success",
      });
      await fetchPins();
    } catch (err: any) {
      setNotification({
        text: err.message || "Failed to claim pin.",
        type: "error",
      });
    } finally {
      setClaiming(false);
    }
  };

  // Handle Pin Collection & Dynamic Reroute
  const handleCompleteCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingPin) return;

    try {
      setSubmittingCollect(true);
      await collectPin(collectingPin.pinId, {
        pickerId: user?.id || "picker_1",
        actualMaterialType: actualMaterial,
        actualWeightKg: Number(actualWeightKg),
      });

      const earned = Math.round(Number(actualWeightKg) * materialPrices[actualMaterial]);
      setNotification({
        text: `✓ Stop complete! Collected ${actualWeightKg} kg • Earned: ₹${earned}. Rerouting to next stop...`,
        type: "success",
      });
      setCollectingPin(null);

      // Re-fetch pins and auto-recalculate the remaining route
      await fetchPins();
    } catch (err: any) {
      setNotification({
        text: err.message || "Failed to mark collection.",
        type: "error",
      });
    } finally {
      setSubmittingCollect(false);
    }
  };

  // Filter Pins for Display
  const filteredPins = pins.filter((p) => {
    if (filterMaterial !== "all" && p.materialType !== filterMaterial) return false;
    return true;
  });

  const openPins = filteredPins.filter((p) => p.status === "open");
  const claimedPins = filteredPins.filter((p) => p.status === "claimed");

  // Current active next stop on the live itinerary
  const currentNextStop: Pin | undefined = orderedStops[activeStopIndex];

  // Google Maps Universal Navigation URL
  const googleMapsUrl = getGoogleMapsNavigationUrl(
    userLocation,
    orderedStops.map((p) => ({ lat: p.lat, lng: p.lng }))
  );

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {locale === "hi" ? "लाइव स्क्रैप रडार व नेविगेशन" : "Live Scrap Radar & Navigation"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isGpsActive ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
              <span>{isGpsActive ? "Live GPS Connected" : "Delhi South GPS"}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === "hi"
              ? "सड़क मार्ग से रीयल-टाइम रूट मार्गदर्शन (गूगल मैप्स की तरह)।"
              : "Turn-by-turn road-snapped route guidance directly on your collection round."}
          </p>
        </div>

        {/* Live Route Toggle Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsLiveRouteMode(!isLiveRouteMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
              isLiveRouteMode
                ? "bg-amber-500 text-slate-950 shadow-amber-950/40"
                : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            }`}
          >
            <span>🧭</span>
            <span>{isLiveRouteMode ? "Route Guidance: ON" : "Turn On Route"}</span>
          </button>

          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950 flex items-center gap-1.5 transition-all"
              title="Open full turn-by-turn route in Google Maps app"
            >
              <span>🗺</span>
              <span>Open in Google Maps</span>
            </a>
          )}
        </div>
      </div>

      {/* Mode Sub-Selector (Claimed vs Suggested Patrol) */}
      {isLiveRouteMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Route Mode:</span>
            <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => setRouteModeType("claimed")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  routeModeType === "claimed"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Claimed Pickups ({claimedPins.length})
              </button>
              <button
                onClick={() => setRouteModeType("suggested")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  routeModeType === "suggested"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Suggested Patrol Loop ({openPins.length})
              </button>
            </div>
          </div>

          {streetRoute && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                Total Route: <b className="text-white">{streetRoute.distanceKm} km</b>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                Est. Time: <b className="text-amber-400">~{streetRoute.durationMinutes} mins</b>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-semibold">
                {streetRoute.isRoadSnapped ? "⚡ Street-Snapped (OSRM)" : "Geodesic Path"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Material Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {["all", "plastic", "paper", "metal", "glass", "ewaste", "mixed"].map((m) => (
          <button
            key={m}
            onClick={() => setFilterMaterial(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              filterMaterial === m
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            {m === "all" ? "All Materials" : m}
          </button>
        ))}
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
              : "bg-red-950/70 border border-red-800 text-red-300"
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Map Container & Navigation HUD */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950">
        {/* Floating Google Maps-Style Turn-by-Turn HUD Banner */}
        {isLiveRouteMode && currentNextStop && (
          <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-[1000] p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-xl shadow">
                #{activeStopIndex + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Next Stop • {currentNextStop.materialType} ({currentNextStop.quantityBucket})
                  </span>
                  <StatusBadge status={currentNextStop.status} />
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  B-42 Hauz Khas Enclave (Delhi South)
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>~350m ahead</span>
                  <span>•</span>
                  <span>Est. Pickup: 2-3 mins</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    ~₹{materialPrices[currentNextStop.materialType] * 15} value
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <a
                href="tel:+919876543210"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                title="Call citizen for gate code / address directions"
              >
                <span>📞</span>
                <span className="hidden sm:inline">Call</span>
              </a>

              {currentNextStop.status === "claimed" ? (
                <button
                  onClick={() => {
                    setCollectingPin(currentNextStop);
                    setActualMaterial(currentNextStop.materialType);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
                >
                  <span>✓</span>
                  <span>Mark Collected</span>
                </button>
              ) : (
                <button
                  onClick={() => handleClaim(currentNextStop.pinId)}
                  disabled={claiming}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950 transition-all"
                >
                  {claiming ? "Claiming..." : "⚡ Claim This Pin"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Leaflet Map with Polyline and Numbered Badges */}
        <div className="h-[460px] sm:h-[540px] w-full">
          <MapView
            pins={filteredPins}
            center={[userLocation.lat, userLocation.lng]}
            zoom={14}
            routeCoordinates={isLiveRouteMode ? streetRoute?.coordinates : undefined}
            userLocation={userLocation}
            stopOrderMap={isLiveRouteMode ? stopOrderMap : undefined}
            activeStopPinId={currentNextStop?.pinId}
            onPinClick={(pin) => setSelectedPin(pin)}
            className="w-full h-full"
          />
        </div>

        {/* Map Floating Footer: Quick Stats & Re-centering */}
        <div className="absolute bottom-3 inset-x-3 z-[1000] flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700 text-xs font-medium text-slate-200 shadow-xl flex items-center gap-2">
            <span className="text-emerald-400">●</span>
            <span>
              {isLiveRouteMode
                ? `${orderedStops.length} Stops on Route`
                : `${openPins.length} Open Pins Nearby`}
            </span>
            {isRouting && <span className="text-amber-400 animate-pulse">• Calculating road path...</span>}
          </div>

          <button
            onClick={() => {
              setUserLocation({ lat: 28.6185, lng: 77.2115 });
              if (pins.length > 0) calculateRoute(pins, routeModeType, { lat: 28.6185, lng: 77.2115 });
            }}
            className="pointer-events-auto px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur border border-slate-700 text-xs font-semibold text-white shadow-xl flex items-center gap-1.5 transition-all"
            title="Re-center map on my current live location"
          >
            <span>🎯</span>
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>
      </div>

      {/* Bottom Itinerary Drawer / Pin Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Ordered Stops Checklist */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                {locale === "hi" ? "आज के स्टॉप्स (क्रमबद्ध)" : "Live Collection Itinerary"}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                {orderedStops.length} Stops
              </span>
            </div>

            <button
              onClick={() => onNavigate("picker-route")}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Advanced Optimizer →
            </button>
          </div>

          {orderedStops.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No stops on route. Tap pins on the map above to claim scrap pickups!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {orderedStops.map((pin, idx) => {
                const isActive = idx === activeStopIndex;
                return (
                  <div
                    key={pin.pinId}
                    onClick={() => {
                      setSelectedPin(pin);
                      setActiveStopIndex(idx);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/30"
                        : "bg-slate-800 border-slate-700/80 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isActive
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
                          <span>{pin.materialType}</span>
                          <span className="text-slate-400 font-normal">({pin.quantityBucket})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {pin.pinId} • Lat: {pin.lat.toFixed(3)}, Lng: {pin.lng.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={pin.status} />
                      {pin.status === "claimed" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCollectingPin(pin);
                            setActualMaterial(pin.materialType);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all"
                        >
                          Collect
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(pin.pinId);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs transition-all"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Selected Pin Inspector */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Selected Scrap Details
            </div>

            {selectedPin ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <div className="text-sm font-bold text-white capitalize">
                    {selectedPin.materialType} Scrap
                  </div>
                  <StatusBadge status={selectedPin.status} />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantity Bucket:</span>
                    <span className="text-white font-semibold capitalize">
                      {selectedPin.quantityBucket}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. Payout Value:</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{materialPrices[selectedPin.materialType] * 15}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-white font-mono text-[11px]">
                      {selectedPin.lat}, {selectedPin.lng}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  {selectedPin.status === "open" ? (
                    <button
                      onClick={() => handleClaim(selectedPin.pinId)}
                      disabled={claiming}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                    >
                      {claiming ? "Claiming..." : "⚡ Claim Pin (45m Hold)"}
                    </button>
                  ) : selectedPin.status === "claimed" ? (
                    <button
                      onClick={() => {
                        setCollectingPin(selectedPin);
                        setActualMaterial(selectedPin.materialType);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      ✓ Mark as Collected
                    </button>
                  ) : (
                    <div className="text-center p-2 rounded-xl bg-slate-700/40 text-slate-400 text-xs">
                      Already Collected
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Tap any pin on the map to inspect scrap category, estimated weight, and claim options.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Aggregator: Delhi South Hub</span>
            <span className="text-amber-400 font-semibold">Active Round</span>
          </div>
        </div>
      </div>

      {/* Collection Dialog Modal */}
      {collectingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setCollectingPin(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-1"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="text-3xl mb-1">⚖</div>
              <h2 className="text-lg font-bold text-white">Record Scrap Collection</h2>
              <p className="text-xs text-slate-400 font-mono">Pin ID: {collectingPin.pinId}</p>
            </div>

            <form onSubmit={handleCompleteCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Actual Material Verified
                </label>
                <select
                  value={actualMaterial}
                  onChange={(e) => setActualMaterial(e.target.value as MaterialType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs capitalize"
                >
                  <option value="plastic">Plastic (₹16/kg)</option>
                  <option value="paper">Paper & Cardboard (₹14/kg)</option>
                  <option value="metal">Metal & Iron (₹45/kg)</option>
                  <option value="glass">Glass (₹6/kg)</option>
                  <option value="ewaste">E-Waste (₹50/kg)</option>
                  <option value="mixed">Mixed (₹12/kg)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Actual Weighed Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-bold text-center focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Purchase Value:</span>
                <span className="text-base font-extrabold text-emerald-400">
                  ₹{Math.round(actualWeightKg * materialPrices[actualMaterial])}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCollectingPin(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCollect}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  {submittingCollect ? "Saving..." : "Confirm & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
