/**
 * ScrapSaathi API Client
 *
 * This is the ONLY place in the frontend that performs network calls.
 * All other files must import from here — never call fetch() directly.
 *
 * Base URL is read from:
 *   - import.meta.env.VITE_API_BASE_URL  (Vite/browser)
 *   - process.env.API_BASE_URL           (Node.js / tests)
 *   - fallback: http://localhost:4000
 */

import type {
  CreatePinRequest,
  CreatePinResponse,
  ListPinsParams,
  ListPinsResponse,
  ClaimPinRequest,
  ClaimPinResponse,
  CollectPinRequest,
  CollectPinResponse,
  OptimizeRouteRequest,
  OptimizeRouteResponse,
  CreateRatingRequest,
  CreateRatingResponse,
  AggregatorRollupResponse,
  SetRatesRequest,
  SetRatesResponse,
  DailyImpactParams,
  DailyImpactResponse,
  ApiErrorBody,
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  OtpRequest,
  OtpVerifyRequest,
  UserRole,
} from "./types.js";

export { ApiError } from "./types.js";
export type * from "./types.js";

// ---- Base URL & Auth Token resolution ----

let currentAuthToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentAuthToken = token;
  if (typeof localStorage !== "undefined") {
    if (token) localStorage.setItem("scrapsaathi_auth_token", token);
    else localStorage.removeItem("scrapsaathi_auth_token");
  }
}

export function getAuthToken(): string | null {
  if (!currentAuthToken && typeof localStorage !== "undefined") {
    currentAuthToken = localStorage.getItem("scrapsaathi_auth_token");
  }
  return currentAuthToken;
}

function getBaseUrl(): string {
  const metaEnv = (typeof import.meta !== "undefined" ? (import.meta as unknown as { env?: Record<string, string> })?.env : undefined);
  if (metaEnv?.VITE_API_BASE_URL) {
    return metaEnv.VITE_API_BASE_URL.replace(/\/$/, "");
  }
  if (typeof process !== "undefined" && process.env.API_BASE_URL) {
    return process.env.API_BASE_URL.replace(/\/$/, "");
  }
  return "http://localhost:4000";
}

// ---- Internal fetch helper ----

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new (await import("./types.js")).ApiError(
      "PARSE_ERROR",
      "Failed to parse server response",
      res.status
    );
  }

  if (!res.ok) {
    const errData = data as { error?: ApiErrorBody };
    const code = errData?.error?.code ?? "UNKNOWN_ERROR";
    const message = errData?.error?.message ?? `HTTP ${res.status}`;
    const { ApiError } = await import("./types.js");
    throw new ApiError(code, message, res.status);
  }

  return data as T;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ============================================================
// Public API functions — one per endpoint
// ============================================================

/** POST /pins — Create a new scrap pin */
export async function createPin(req: CreatePinRequest): Promise<CreatePinResponse> {
  return request<CreatePinResponse>("POST", "/pins", req);
}

/** GET /pins — List pins, optionally filtered by zoneId and/or status */
export async function listPins(params: ListPinsParams = {}): Promise<ListPinsResponse> {
  const qs = buildQuery({ zoneId: params.zoneId, status: params.status });
  return request<ListPinsResponse>("GET", `/pins${qs}`);
}

/** POST /pins/{pinId}/claim — Claim a pin */
export async function claimPin(
  pinId: string,
  req: ClaimPinRequest
): Promise<ClaimPinResponse> {
  return request<ClaimPinResponse>("POST", `/pins/${pinId}/claim`, req);
}

/** POST /pins/{pinId}/collect — Mark a pin as collected */
export async function collectPin(
  pinId: string,
  req: CollectPinRequest
): Promise<CollectPinResponse> {
  return request<CollectPinResponse>("POST", `/pins/${pinId}/collect`, req);
}

/** POST /routes/optimize — Get an optimised pickup route */
export async function optimizeRoute(
  req: OptimizeRouteRequest
): Promise<OptimizeRouteResponse> {
  return request<OptimizeRouteResponse>("POST", "/routes/optimize", req);
}

/** POST /ratings — Submit a rating */
export async function createRating(
  req: CreateRatingRequest
): Promise<CreateRatingResponse> {
  return request<CreateRatingResponse>("POST", "/ratings", req);
}

/** GET /aggregator/{aggregatorId}/rollup — Get aggregator daily rollup */
export async function getAggregatorRollup(
  aggregatorId: string
): Promise<AggregatorRollupResponse> {
  return request<AggregatorRollupResponse>(
    "GET",
    `/aggregator/${aggregatorId}/rollup`
  );
}

/** POST /aggregator/{aggregatorId}/rates — Set material rates */
export async function setRates(
  aggregatorId: string,
  req: SetRatesRequest
): Promise<SetRatesResponse> {
  return request<SetRatesResponse>(
    "POST",
    `/aggregator/${aggregatorId}/rates`,
    req
  );
}

/** GET /impact/daily — Get daily impact data */
export async function getDailyImpact(
  params: DailyImpactParams = {}
): Promise<DailyImpactResponse> {
  const qs = buildQuery({ zoneId: params.zoneId, range: params.range });
  return request<DailyImpactResponse>("GET", `/impact/daily${qs}`);
}

/** POST /__reset — Reset mock API to seed data (only works against mock-api) */
export async function resetMock(): Promise<{ message: string }> {
  return request<{ message: string }>("POST", "/__reset");
}

// ============================================================
// Authentication API Functions
// ============================================================

/** POST /api/auth/login — Login with phone/email and password */
export async function login(req: LoginRequest): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/login", req);
  setAuthToken(res.token);
  return res;
}

/** POST /api/auth/register — Register a new account */
export async function register(req: RegisterRequest): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/register", req);
  setAuthToken(res.token);
  return res;
}

/** POST /api/auth/otp-request — Request an OTP for phone number login */
export async function requestOtp(req: OtpRequest): Promise<{ message: string; simulatedOtp?: string }> {
  return request<{ message: string; simulatedOtp?: string }>("POST", "/api/auth/otp-request", req);
}

/** POST /api/auth/otp-verify — Verify OTP and login */
export async function verifyOtp(req: OtpVerifyRequest): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/otp-verify", req);
  setAuthToken(res.token);
  return res;
}

/** GET /api/auth/me — Retrieve currently logged-in user profile */
export async function getMe(): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("GET", "/api/auth/me");
}

/** POST /api/auth/demo-login — Instant login for demonstration/development */
export async function demoLogin(role: UserRole): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/demo-login", { role });
  setAuthToken(res.token);
  return res;
}

/** Logout and clear auth token */
export function logout(): void {
  setAuthToken(null);
}

