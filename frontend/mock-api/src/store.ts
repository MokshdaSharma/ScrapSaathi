/**
 * In-memory data store for the mock API.
 * Seeded with ~15 pins across 3 zones.
 * Call resetToSeed() to restore initial state.
 */


export type MaterialType = "plastic" | "paper" | "metal" | "glass" | "ewaste" | "mixed";
export type QuantityBucket = "small" | "medium" | "large";
export type PinStatus = "open" | "claimed" | "collected" | "expired";
export type RaterRole = "household" | "picker";

export interface Pin {
  pinId: string;
  householdId: string;
  lat: number;
  lng: number;
  zoneId: string;
  materialType: MaterialType;
  quantityBucket: QuantityBucket;
  photoUrl?: string;
  pickupWindow: string;
  status: PinStatus;
  claimedBy?: string;
  claimExpiresAt?: string;
  collectedAt?: string;
  actualMaterialType?: MaterialType;
  actualWeightKg?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  ratingId: string;
  pinId: string;
  raterId: string;
  raterRole: RaterRole;
  score: number;
  note?: string;
  createdAt: string;
}

export interface Aggregator {
  aggregatorId: string;
  zoneId: string;
  name: string;
  rates: Partial<Record<MaterialType, number>>;
  ratesUpdatedAt: string;
}

export interface ImpactDay {
  date: string;
  zoneId: string;
  kgDiverted: Partial<Record<MaterialType, number>>;
}

export interface User {
  id: string;
  name: string;
  identifier: string; // phone or email
  phone?: string;
  email?: string;
  passwordHash?: string;
  role: "household" | "picker" | "aggregator";
  zoneId: string;
  createdAt: string;
  reliabilityScore?: number;
  totalCollections?: number;
}

// Seed Users for 1-click login and testing
export const seedUsers: User[] = [
  {
    id: "user_household_1",
    name: "Priya Sharma",
    identifier: "9876543210",
    phone: "+91 9876543210",
    email: "priya@example.com",
    role: "household",
    zoneId: "zone_delhi_south",
    createdAt: new Date().toISOString(),
  },
  {
    id: "picker_1",
    name: "Ramu Bhai",
    identifier: "9876543211",
    phone: "+91 9876543211",
    role: "picker",
    zoneId: "zone_delhi_south",
    createdAt: new Date().toISOString(),
    reliabilityScore: 4.85,
    totalCollections: 142,
  },
  {
    id: "aggregator_delhi_south",
    name: "Delhi Green Recyclers (Sanjay Gupta)",
    identifier: "9876543212",
    phone: "+91 9876543212",
    email: "sanjay@delhigreen.in",
    role: "aggregator",
    zoneId: "zone_delhi_south",
    createdAt: new Date().toISOString(),
  },
];

function makeSeedPins(): Pin[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const window = `${now.toISOString()}/${new Date(now.getTime() + 3 * 3600000).toISOString()}`;

  return [
    // Zone: zone_delhi_south
    { pinId: "pin_ds_001", householdId: "hh_001", lat: 28.6200, lng: 77.2100, zoneId: "zone_delhi_south", materialType: "plastic", quantityBucket: "medium", pickupWindow: window, status: "open", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
    { pinId: "pin_ds_002", householdId: "hh_002", lat: 28.6220, lng: 77.2080, zoneId: "zone_delhi_south", materialType: "paper", quantityBucket: "large", pickupWindow: window, status: "open", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
    { pinId: "pin_ds_003", householdId: "hh_003", lat: 28.6180, lng: 77.2120, zoneId: "zone_delhi_south", materialType: "metal", quantityBucket: "small", pickupWindow: window, status: "claimed", claimedBy: "picker_001", claimExpiresAt: new Date(now.getTime() + 15 * 60000).toISOString(), createdAt: yesterday.toISOString(), updatedAt: now.toISOString() },
    { pinId: "pin_ds_004", householdId: "hh_004", lat: 28.6150, lng: 77.2090, zoneId: "zone_delhi_south", materialType: "glass", quantityBucket: "small", pickupWindow: window, status: "collected", collectedAt: yesterday.toISOString(), actualMaterialType: "glass", actualWeightKg: 2.5, createdAt: new Date(yesterday.getTime() - 86400000).toISOString(), updatedAt: yesterday.toISOString() },
    { pinId: "pin_ds_005", householdId: "hh_005", lat: 28.6240, lng: 77.2050, zoneId: "zone_delhi_south", materialType: "ewaste", quantityBucket: "small", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { pinId: "pin_ds_006", householdId: "hh_006", lat: 28.6160, lng: 77.2130, zoneId: "zone_delhi_south", materialType: "mixed", quantityBucket: "medium", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },

    // Zone: zone_delhi_north
    { pinId: "pin_dn_001", householdId: "hh_007", lat: 28.7100, lng: 77.2200, zoneId: "zone_delhi_north", materialType: "plastic", quantityBucket: "large", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { pinId: "pin_dn_002", householdId: "hh_008", lat: 28.7080, lng: 77.2180, zoneId: "zone_delhi_north", materialType: "paper", quantityBucket: "medium", pickupWindow: window, status: "open", createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString() },
    { pinId: "pin_dn_003", householdId: "hh_009", lat: 28.7120, lng: 77.2250, zoneId: "zone_delhi_north", materialType: "metal", quantityBucket: "small", pickupWindow: window, status: "collected", collectedAt: yesterday.toISOString(), actualMaterialType: "metal", actualWeightKg: 5.0, createdAt: new Date(yesterday.getTime() - 3600000).toISOString(), updatedAt: yesterday.toISOString() },
    { pinId: "pin_dn_004", householdId: "hh_010", lat: 28.7150, lng: 77.2270, zoneId: "zone_delhi_north", materialType: "ewaste", quantityBucket: "medium", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { pinId: "pin_dn_005", householdId: "hh_011", lat: 28.7060, lng: 77.2160, zoneId: "zone_delhi_north", materialType: "glass", quantityBucket: "large", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },

    // Zone: zone_mumbai_west
    { pinId: "pin_mw_001", householdId: "hh_012", lat: 19.0800, lng: 72.8300, zoneId: "zone_mumbai_west", materialType: "plastic", quantityBucket: "small", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { pinId: "pin_mw_002", householdId: "hh_013", lat: 19.0820, lng: 72.8280, zoneId: "zone_mumbai_west", materialType: "paper", quantityBucket: "large", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { pinId: "pin_mw_003", householdId: "hh_014", lat: 19.0790, lng: 72.8320, zoneId: "zone_mumbai_west", materialType: "mixed", quantityBucket: "medium", pickupWindow: window, status: "claimed", claimedBy: "picker_002", claimExpiresAt: new Date(now.getTime() + 10 * 60000).toISOString(), createdAt: yesterday.toISOString(), updatedAt: now.toISOString() },
    { pinId: "pin_mw_004", householdId: "hh_015", lat: 19.0840, lng: 72.8310, zoneId: "zone_mumbai_west", materialType: "metal", quantityBucket: "medium", pickupWindow: window, status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString() },
  ];
}

function makeSeedImpact(): ImpactDay[] {
  const days: ImpactDay[] = [];
  const zones = ["zone_delhi_south", "zone_delhi_north", "zone_mumbai_west"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    for (const zoneId of zones) {
      days.push({
        date: dateStr,
        zoneId,
        kgDiverted: {
          plastic: +(Math.random() * 20 + 5).toFixed(1),
          paper: +(Math.random() * 15 + 3).toFixed(1),
          metal: +(Math.random() * 10 + 2).toFixed(1),
          glass: +(Math.random() * 5 + 1).toFixed(1),
          ewaste: +(Math.random() * 3).toFixed(1),
          mixed: +(Math.random() * 8 + 2).toFixed(1),
        },
      });
    }
  }

  return days;
}

const seedAggregators: Aggregator[] = [
  {
    aggregatorId: "agg_south_delhi",
    zoneId: "zone_delhi_south",
    name: "South Delhi Kabadi Centre",
    rates: { plastic: 15, paper: 12, metal: 45, glass: 8, ewaste: 25, mixed: 10 },
    ratesUpdatedAt: new Date().toISOString(),
  },
  {
    aggregatorId: "agg_north_delhi",
    zoneId: "zone_delhi_north",
    name: "North Delhi Recyclers",
    rates: { plastic: 14, paper: 11, metal: 42, glass: 7, ewaste: 22, mixed: 9 },
    ratesUpdatedAt: new Date().toISOString(),
  },
  {
    aggregatorId: "agg_mumbai_west",
    zoneId: "zone_mumbai_west",
    name: "Mumbai West Kabadi",
    rates: { plastic: 16, paper: 13, metal: 48, glass: 9, ewaste: 28, mixed: 11 },
    ratesUpdatedAt: new Date().toISOString(),
  },
];

// ---- Mutable in-memory state ----

export let users: User[] = [...seedUsers];
export let pins: Pin[] = makeSeedPins();
export let ratings: Rating[] = [];
export let aggregators: Aggregator[] = [...seedAggregators];
export let impactDays: ImpactDay[] = makeSeedImpact();

export function findUserByIdentifier(identifier: string): User | undefined {
  const clean = identifier.trim().toLowerCase().replace(/\s+/g, "");
  return users.find((u) => {
    if (u.identifier.toLowerCase() === clean) return true;
    if (u.phone && u.phone.replace(/\D/g, "") === clean.replace(/\D/g, "")) return true;
    if (u.email && u.email.toLowerCase() === clean) return true;
    return false;
  });
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function resetToSeed() {
  users = [...seedUsers];
  pins = makeSeedPins();
  ratings = [];
  aggregators = [...seedAggregators];
  impactDays = makeSeedImpact();
}

// ---- Helper: expire stale claims ----

export function expireStaleClaimsFromStore() {
  const now = new Date().toISOString();
  for (const pin of pins) {
    if (
      pin.status === "claimed" &&
      pin.claimExpiresAt &&
      pin.claimExpiresAt < now
    ) {
      pin.status = "open";
      pin.claimedBy = undefined;
      pin.claimExpiresAt = undefined;
      pin.updatedAt = now;
    }
  }
}

// ---- Zone assignment from lat/lng ----

export function assignZone(lat: number, lng: number): string {
  if (lat >= 28.50 && lat <= 28.65 && lng >= 77.15 && lng <= 77.25) {
    return "zone_delhi_south";
  }
  if (lat >= 28.65 && lat <= 28.80 && lng >= 77.15 && lng <= 77.30) {
    return "zone_delhi_north";
  }
  if (lat >= 19.00 && lat <= 19.15 && lng >= 72.78 && lng <= 72.95) {
    return "zone_mumbai_west";
  }
  return "zone_unknown";
}
