import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPin,
  listPins,
  claimPin,
  collectPin,
  optimizeRoute,
  createRating,
  getAggregatorRollup,
  setRates,
  getDailyImpact,
  ApiError,
} from "../src/index.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

function mockError(status: number, code: string, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: { code, message } }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_BASE_URL = "http://localhost:4000";
});

describe("createPin", () => {
  it("posts to /pins and returns pinId + status", async () => {
    const now = new Date().toISOString();
    mockOk({ pinId: "pin_1", status: "open", createdAt: now });

    const res = await createPin({
      householdId: "hh_1",
      lat: 28.61,
      lng: 77.20,
      materialType: "plastic",
      quantityBucket: "medium",
      pickupWindow: `${now}/${now}`,
    });

    expect(res.pinId).toBe("pin_1");
    expect(res.status).toBe("open");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/pins",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("listPins", () => {
  it("calls GET /pins with no params", async () => {
    mockOk({ pins: [] });
    await listPins();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/pins",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("appends zoneId and status query params", async () => {
    mockOk({ pins: [] });
    await listPins({ zoneId: "zone_delhi_south", status: "open" });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/pins?zoneId=zone_delhi_south&status=open",
      expect.any(Object)
    );
  });
});

describe("claimPin", () => {
  it("posts to /pins/{pinId}/claim", async () => {
    const now = new Date().toISOString();
    mockOk({
      pinId: "pin_1",
      status: "claimed",
      claimedBy: "picker_1",
      claimExpiresAt: now,
    });

    const res = await claimPin("pin_1", { pickerId: "picker_1" });
    expect(res.status).toBe("claimed");
    expect(res.claimedBy).toBe("picker_1");
  });

  it("throws ApiError with PIN_ALREADY_CLAIMED on 409", async () => {
    mockError(409, "PIN_ALREADY_CLAIMED", "Pin already claimed");

    try {
      await claimPin("pin_1", { pickerId: "picker_2" });
      expect.fail("Expected claimPin to throw");
    } catch (e) {
      if (e instanceof ApiError) {
        expect(e.code).toBe("PIN_ALREADY_CLAIMED");
        expect(e.statusCode).toBe(409);
      } else {
        throw e;
      }
    }
  });
});

describe("collectPin", () => {
  it("posts to /pins/{pinId}/collect", async () => {
    const now = new Date().toISOString();
    mockOk({ pinId: "pin_1", status: "collected", collectedAt: now });

    const res = await collectPin("pin_1", {
      pickerId: "picker_1",
      actualMaterialType: "plastic",
      actualWeightKg: 3.5,
    });

    expect(res.status).toBe("collected");
  });
});

describe("optimizeRoute", () => {
  it("posts to /routes/optimize", async () => {
    mockOk({ orderedPinIds: ["pin_2", "pin_1"], estimatedDistanceKm: 1.23 });

    const res = await optimizeRoute({
      pickerId: "picker_1",
      currentLat: 28.61,
      currentLng: 77.20,
      pinIds: ["pin_1", "pin_2"],
    });

    expect(res.orderedPinIds).toEqual(["pin_2", "pin_1"]);
    expect(res.estimatedDistanceKm).toBe(1.23);
  });
});

describe("createRating", () => {
  it("posts to /ratings", async () => {
    const now = new Date().toISOString();
    mockOk({ ratingId: "rating_1", createdAt: now });

    const res = await createRating({
      pinId: "pin_1",
      raterId: "hh_1",
      raterRole: "household",
      score: 5,
    });

    expect(res.ratingId).toBe("rating_1");
  });
});

describe("getAggregatorRollup", () => {
  it("calls GET /aggregator/{id}/rollup", async () => {
    mockOk({
      aggregatorId: "agg_1",
      zoneId: "zone_delhi_south",
      expectedVolumeKg: { plastic: 10 },
      activePickers: 3,
    });

    const res = await getAggregatorRollup("agg_1");
    expect(res.aggregatorId).toBe("agg_1");
    expect(res.activePickers).toBe(3);
  });
});

describe("setRates", () => {
  it("posts to /aggregator/{id}/rates", async () => {
    const now = new Date().toISOString();
    mockOk({ updatedAt: now });

    const res = await setRates("agg_1", { rates: { plastic: 15 } });
    expect(res.updatedAt).toBe(now);
  });
});

describe("getDailyImpact", () => {
  it("calls GET /impact/daily with params", async () => {
    mockOk({ zoneId: "zone_delhi_south", days: [] });
    await getDailyImpact({ zoneId: "zone_delhi_south", range: "7d" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/impact/daily?zoneId=zone_delhi_south&range=7d",
      expect.any(Object)
    );
  });
});

describe("ApiError", () => {
  it("throws ApiError with correct code on any non-2xx", async () => {
    mockError(404, "PIN_NOT_FOUND", "Pin does not exist");

    try {
      await listPins({ zoneId: "bad_zone" });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      if (e instanceof ApiError) {
        expect(e.code).toBe("PIN_NOT_FOUND");
        expect(e.statusCode).toBe(404);
      }
    }
  });
});
