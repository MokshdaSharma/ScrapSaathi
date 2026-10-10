// ============================================================
// ScrapSaathi API Types — single source of truth for the frontend
// Changes here must be reflected in mock-api routes as well
// ============================================================

export type MaterialType = "plastic" | "paper" | "metal" | "glass" | "ewaste" | "mixed";
export type QuantityBucket = "small" | "medium" | "large";
export type PinStatus = "open" | "claimed" | "collected" | "expired";
export type RaterRole = "household" | "picker";
export type UserRole = "household" | "picker" | "aggregator";

// ---- Authentication Types ----

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  zoneId: string;
  createdAt: string;
  reliabilityScore?: number;
  totalCollections?: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginRequest {
  identifier: string; // phone or email
  password?: string;
}

export interface RegisterRequest {
  name: string;
  identifier: string;
  password?: string;
  role: UserRole;
  zoneId?: string;
}

export interface OtpRequest {
  phone: string;
}

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
}

// ---- Shared error envelope ----

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ---- Pin ----

export interface Pin {
  pinId: string;
  lat: number;
  lng: number;
  materialType: MaterialType;
  quantityBucket: QuantityBucket;
  status: PinStatus;
  createdAt: string;
}

export interface CreatePinRequest {
  householdId: string;
  lat: number;
  lng: number;
  materialType: MaterialType;
  quantityBucket: QuantityBucket;
  photoUrl?: string;
  pickupWindow: string; // ISO 8601 interval: startISO/endISO
}

export interface CreatePinResponse {
  pinId: string;
  status: "open";
  createdAt: string;
}

export interface ListPinsParams {
  zoneId?: string;
  status?: PinStatus | string;
}

export interface ListPinsResponse {
  pins: Pin[];
}

export interface ClaimPinRequest {
  pickerId: string;
}

export interface ClaimPinResponse {
  pinId: string;
  status: "claimed";
  claimedBy: string;
  claimExpiresAt: string;
}

export interface CollectPinRequest {
  pickerId: string;
  actualMaterialType: MaterialType;
  actualWeightKg: number;
}

export interface CollectPinResponse {
  pinId: string;
  status: "collected";
  collectedAt: string;
}

// ---- Route ----

export interface OptimizeRouteRequest {
  pickerId: string;
  currentLat: number;
  currentLng: number;
  pinIds: string[];
}

export interface OptimizeRouteResponse {
  orderedPinIds: string[];
  estimatedDistanceKm: number;
}

// ---- Ratings ----

export interface CreateRatingRequest {
  pinId: string;
  raterId: string;
  raterRole: RaterRole;
  score: number; // 1-5
  note?: string;
}

export interface CreateRatingResponse {
  ratingId: string;
  createdAt: string;
}

// ---- Aggregator ----

export type KgByMaterial = Partial<Record<MaterialType, number>>;

export interface AggregatorRollupResponse {
  aggregatorId: string;
  zoneId: string;
  expectedVolumeKg: KgByMaterial;
  activePickers: number;
}

export interface SetRatesRequest {
  rates: Partial<Record<MaterialType, number>>;
}

export interface SetRatesResponse {
  updatedAt: string;
}

// ---- Impact ----

export interface DailyImpactParams {
  zoneId?: string;
  range?: "7d" | "30d" | "90d";
}

export interface DailyImpactDay {
  date: string; // YYYY-MM-DD
  kgDiverted: KgByMaterial;
}

export interface DailyImpactResponse {
  zoneId: string;
  days: DailyImpactDay[];
}
