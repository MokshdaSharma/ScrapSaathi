import { Router, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import {
  pins,
  ratings,
  aggregators,
  impactDays,
  resetToSeed,
  expireStaleClaimsFromStore,
  assignZone,
  type MaterialType,
  type QuantityBucket,
} from "../store.js";
import authRouter from "./auth.js";

const router = Router();

// Mount authentication router
router.use("/api/auth", authRouter);

function err(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

// ---- POST /pins ----
router.post("/pins", (req: Request, res: Response) => {
  const { householdId, lat, lng, materialType, quantityBucket, photoUrl, pickupWindow } = req.body as {
    householdId?: string;
    lat?: number;
    lng?: number;
    materialType?: MaterialType;
    quantityBucket?: QuantityBucket;
    photoUrl?: string;
    pickupWindow?: string;
  };

  if (!householdId || lat === undefined || lng === undefined || !materialType || !quantityBucket || !pickupWindow) {
    return err(res, 400, "INVALID_BODY", "Missing required fields: householdId, lat, lng, materialType, quantityBucket, pickupWindow");
  }

  const validMaterials = ["plastic", "paper", "metal", "glass", "ewaste", "mixed"];
  const validBuckets = ["small", "medium", "large"];
  if (!validMaterials.includes(materialType)) {
    return err(res, 400, "INVALID_BODY", `Invalid materialType. Must be one of: ${validMaterials.join(", ")}`);
  }
  if (!validBuckets.includes(quantityBucket)) {
    return err(res, 400, "INVALID_BODY", `Invalid quantityBucket. Must be one of: ${validBuckets.join(", ")}`);
  }

  const now = new Date().toISOString();
  const pinId = `pin_${uuid().slice(0, 8)}`;
  const zoneId = assignZone(lat, lng);

  const newPin = {
    pinId,
    householdId,
    lat,
    lng,
    zoneId,
    materialType,
    quantityBucket,
    ...(photoUrl ? { photoUrl } : {}),
    pickupWindow,
    status: "open" as const,
    createdAt: now,
    updatedAt: now,
  };

  pins.push(newPin);

  return res.status(201).json({ pinId, status: "open", createdAt: now });
});

// ---- GET /pins ----
router.get("/pins", (req: Request, res: Response) => {
  expireStaleClaimsFromStore();

  const { zoneId, status } = req.query as { zoneId?: string; status?: string };

  let filtered = [...pins];

  if (zoneId) {
    filtered = filtered.filter((p) => p.zoneId === zoneId);
  }

  if (status) {
    const statuses = status.split(",").map((s) => s.trim());
    filtered = filtered.filter((p) => statuses.includes(p.status));
  }

  return res.json({
    pins: filtered.map(({ pinId, lat, lng, materialType, quantityBucket, status, createdAt }) => ({
      pinId, lat, lng, materialType, quantityBucket, status, createdAt,
    })),
  });
});

// ---- POST /pins/:pinId/claim ----
router.post("/pins/:pinId/claim", (req: Request, res: Response) => {
  expireStaleClaimsFromStore();

  const { pinId } = req.params;
  const { pickerId } = req.body as { pickerId?: string };

  if (!pickerId) {
    return err(res, 400, "INVALID_BODY", "pickerId is required");
  }

  const pin = pins.find((p) => p.pinId === pinId);
  if (!pin) {
    return err(res, 404, "PIN_NOT_FOUND", `Pin ${pinId} not found`);
  }

  if (pin.status === "claimed") {
    return err(res, 409, "PIN_ALREADY_CLAIMED", "This pin has already been claimed by another picker.");
  }
  if (pin.status !== "open") {
    return err(res, 409, "PIN_NOT_CLAIMABLE", `Pin is ${pin.status} and cannot be claimed.`);
  }

  const now = new Date();
  const claimExpiresAt = new Date(now.getTime() + 20 * 60 * 1000).toISOString();

  pin.status = "claimed";
  pin.claimedBy = pickerId;
  pin.claimExpiresAt = claimExpiresAt;
  pin.updatedAt = now.toISOString();

  return res.json({
    pinId,
    status: "claimed",
    claimedBy: pickerId,
    claimExpiresAt,
  });
});

// ---- POST /pins/:pinId/collect ----
router.post("/pins/:pinId/collect", (req: Request, res: Response) => {
  const { pinId } = req.params;
  const { pickerId, actualMaterialType, actualWeightKg } = req.body as {
    pickerId?: string;
    actualMaterialType?: MaterialType;
    actualWeightKg?: number;
  };

  if (!pickerId || !actualMaterialType || actualWeightKg === undefined) {
    return err(res, 400, "INVALID_BODY", "pickerId, actualMaterialType, and actualWeightKg are required");
  }

  const pin = pins.find((p) => p.pinId === pinId);
  if (!pin) {
    return err(res, 404, "PIN_NOT_FOUND", `Pin ${pinId} not found`);
  }

  if (pin.status === "collected") {
    return err(res, 409, "PIN_ALREADY_COLLECTED", "This pin has already been collected.");
  }

  const now = new Date().toISOString();
  pin.status = "collected";
  pin.collectedAt = now;
  pin.actualMaterialType = actualMaterialType;
  pin.actualWeightKg = actualWeightKg;
  pin.updatedAt = now;

  return res.json({ pinId, status: "collected", collectedAt: now });
});

// ---- POST /routes/optimize ----
router.post("/routes/optimize", (req: Request, res: Response) => {
  const { currentLat, currentLng, pinIds } = req.body as {
    pickerId?: string;
    currentLat?: number;
    currentLng?: number;
    pinIds?: string[];
  };

  if (currentLat === undefined || currentLng === undefined || !Array.isArray(pinIds)) {
    return err(res, 400, "INVALID_BODY", "currentLat, currentLng, and pinIds[] are required");
  }

  // Fetch pin locations from store
  const pinLocations = pinIds
    .map((id) => pins.find((p) => p.pinId === id))
    .filter(Boolean)
    .map((p) => ({ pinId: p!.pinId, lat: p!.lat, lng: p!.lng }));

  // Simple nearest-neighbour (reuse the same algorithm as the frontend)
  const CLUSTER_RADIUS_KM = 0.15;

  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  interface PinLoc { pinId: string; lat: number; lng: number; }
  interface Cluster { centroidLat: number; centroidLng: number; pins: PinLoc[]; }

  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  for (const pin of pinLocations) {
    if (assigned.has(pin.pinId)) continue;
    let targetCluster: Cluster | null = null;
    for (const cluster of clusters) {
      if (haversineKm(pin.lat, pin.lng, cluster.centroidLat, cluster.centroidLng) <= CLUSTER_RADIUS_KM) {
        targetCluster = cluster;
        break;
      }
    }
    if (targetCluster) {
      targetCluster.pins.push(pin);
      const n = targetCluster.pins.length;
      targetCluster.centroidLat = targetCluster.pins.reduce((s, p) => s + p.lat, 0) / n;
      targetCluster.centroidLng = targetCluster.pins.reduce((s, p) => s + p.lng, 0) / n;
    } else {
      clusters.push({ centroidLat: pin.lat, centroidLng: pin.lng, pins: [pin] });
    }
    assigned.add(pin.pinId);
  }

  const visited = new Set<number>();
  const orderedPinIds: string[] = [];
  let totalDist = 0;
  let curLat = currentLat;
  let curLng = currentLng;

  while (visited.size < clusters.length) {
    let nearestIdx = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      if (visited.has(i)) continue;
      const d = haversineKm(curLat, curLng, clusters[i].centroidLat, clusters[i].centroidLng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    visited.add(nearestIdx);
    const cluster = clusters[nearestIdx];
    const sorted = [...cluster.pins].sort((a, b) =>
      haversineKm(a.lat, a.lng, cluster.centroidLat, cluster.centroidLng) -
      haversineKm(b.lat, b.lng, cluster.centroidLat, cluster.centroidLng)
    );
    for (const pin of sorted) {
      totalDist += haversineKm(curLat, curLng, pin.lat, pin.lng);
      orderedPinIds.push(pin.pinId);
      curLat = pin.lat;
      curLng = pin.lng;
    }
  }

  return res.json({
    orderedPinIds,
    estimatedDistanceKm: Math.round(totalDist * 100) / 100,
  });
});

// ---- POST /ratings ----
router.post("/ratings", (req: Request, res: Response) => {
  const { pinId, raterId, raterRole, score, note } = req.body as {
    pinId?: string;
    raterId?: string;
    raterRole?: string;
    score?: number;
    note?: string;
  };

  if (!pinId || !raterId || !raterRole || score === undefined) {
    return err(res, 400, "INVALID_BODY", "pinId, raterId, raterRole, and score are required");
  }

  if (!["household", "picker"].includes(raterRole)) {
    return err(res, 400, "INVALID_BODY", "raterRole must be 'household' or 'picker'");
  }

  if (typeof score !== "number" || score < 1 || score > 5 || !Number.isInteger(score)) {
    return err(res, 400, "INVALID_BODY", "score must be an integer between 1 and 5");
  }

  const now = new Date().toISOString();
  const ratingId = `rating_${uuid().slice(0, 8)}`;

  ratings.push({ ratingId, pinId, raterId, raterRole: raterRole as "household" | "picker", score, note, createdAt: now });

  return res.status(201).json({ ratingId, createdAt: now });
});

// ---- GET /aggregator/:aggregatorId/rollup ----
router.get("/aggregator/:aggregatorId/rollup", (req: Request, res: Response) => {
  const { aggregatorId } = req.params;
  const agg = aggregators.find((a) => a.aggregatorId === aggregatorId);
  if (!agg) {
    return err(res, 404, "AGGREGATOR_NOT_FOUND", `Aggregator ${aggregatorId} not found`);
  }

  // Calculate expected volume from collected pins in the zone
  const zonePins = pins.filter((p) => p.zoneId === agg.zoneId && p.status === "collected");
  const expectedVolumeKg: Partial<Record<MaterialType, number>> = {};
  for (const pin of zonePins) {
    if (pin.actualWeightKg && pin.actualMaterialType) {
      expectedVolumeKg[pin.actualMaterialType] = (expectedVolumeKg[pin.actualMaterialType] ?? 0) + pin.actualWeightKg;
    }
  }

  // Count active pickers (those who claimed or collected in this zone)
  const activePickers = new Set(
    pins
      .filter((p) => p.zoneId === agg.zoneId && (p.status === "claimed" || p.status === "collected"))
      .map((p) => p.claimedBy)
      .filter(Boolean)
  ).size;

  return res.json({
    aggregatorId,
    zoneId: agg.zoneId,
    expectedVolumeKg,
    activePickers,
  });
});

// ---- POST /aggregator/:aggregatorId/rates ----
router.post("/aggregator/:aggregatorId/rates", (req: Request, res: Response) => {
  const { aggregatorId } = req.params;
  const { rates } = req.body as { rates?: Partial<Record<MaterialType, number>> };

  if (!rates || typeof rates !== "object") {
    return err(res, 400, "INVALID_BODY", "rates object is required");
  }

  const agg = aggregators.find((a) => a.aggregatorId === aggregatorId);
  if (!agg) {
    return err(res, 404, "AGGREGATOR_NOT_FOUND", `Aggregator ${aggregatorId} not found`);
  }

  const now = new Date().toISOString();
  agg.rates = { ...agg.rates, ...rates };
  agg.ratesUpdatedAt = now;

  return res.json({ updatedAt: now });
});

// ---- GET /impact/daily ----
router.get("/impact/daily", (req: Request, res: Response) => {
  const { zoneId, range = "7d" } = req.query as { zoneId?: string; range?: string };
  const days = parseInt(range) || 7;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  let filtered = impactDays.filter((d) => d.date >= cutoffStr);
  if (zoneId) filtered = filtered.filter((d) => d.zoneId === zoneId);

  // Group by date, merge zones if no zoneId filter
  const grouped: Record<string, { date: string; zoneId: string; kgDiverted: Partial<Record<MaterialType, number>> }> = {};
  for (const day of filtered) {
    const key = zoneId ? day.date : `${day.date}:${day.zoneId}`;
    if (!grouped[key]) {
      grouped[key] = { date: day.date, zoneId: day.zoneId, kgDiverted: {} };
    }
    for (const [mat, kg] of Object.entries(day.kgDiverted)) {
      const m = mat as MaterialType;
      grouped[key].kgDiverted[m] = (grouped[key].kgDiverted[m] ?? 0) + (kg ?? 0);
    }
  }

  const sortedDays = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

  return res.json({ zoneId: zoneId ?? "all", days: sortedDays });
});

// ---- POST /__reset ----
router.post("/__reset", (_req: Request, res: Response) => {
  resetToSeed();
  return res.json({ message: "Seed data restored" });
});

export default router;
