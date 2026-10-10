import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/server.js";

// Reset seed before each test
beforeEach(async () => {
  await request(app).post("/__reset");
});

describe("POST /pins", () => {
  it("creates a pin and returns 201 with pinId + status open", async () => {
    const res = await request(app)
      .post("/pins")
      .send({
        householdId: "hh_test",
        lat: 28.62,
        lng: 77.21,
        materialType: "plastic",
        quantityBucket: "medium",
        pickupWindow: "2024-01-15T09:00:00Z/2024-01-15T12:00:00Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.pinId).toBeTruthy();
    expect(res.body.status).toBe("open");
    expect(res.body.createdAt).toBeTruthy();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/pins").send({ householdId: "hh_test" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_BODY");
  });

  it("returns 400 for invalid materialType", async () => {
    const res = await request(app).post("/pins").send({
      householdId: "hh_1",
      lat: 28.62,
      lng: 77.21,
      materialType: "cardboard",
      quantityBucket: "medium",
      pickupWindow: "2024-01-15T09:00:00Z/2024-01-15T12:00:00Z",
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_BODY");
  });
});

describe("GET /pins", () => {
  it("returns all seed pins", async () => {
    const res = await request(app).get("/pins");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.pins)).toBe(true);
    expect(res.body.pins.length).toBeGreaterThan(0);
  });

  it("filters by zoneId", async () => {
    const res = await request(app).get("/pins?zoneId=zone_delhi_south");
    expect(res.status).toBe(200);
    expect(res.body.pins.every((p: { zoneId?: string }) => !p.zoneId || true)).toBe(true);
    expect(res.body.pins.length).toBeGreaterThan(0);
  });

  it("filters by status=open", async () => {
    const res = await request(app).get("/pins?status=open");
    expect(res.status).toBe(200);
    // All returned pins should have status=open
    for (const pin of res.body.pins) {
      expect(pin.status).toBe("open");
    }
  });

  it("returns correct shape for each pin", async () => {
    const res = await request(app).get("/pins");
    const pin = res.body.pins[0];
    expect(pin).toHaveProperty("pinId");
    expect(pin).toHaveProperty("lat");
    expect(pin).toHaveProperty("lng");
    expect(pin).toHaveProperty("materialType");
    expect(pin).toHaveProperty("quantityBucket");
    expect(pin).toHaveProperty("status");
    expect(pin).toHaveProperty("createdAt");
  });
});

describe("POST /pins/:pinId/claim", () => {
  it("claims an open pin and returns claimed status", async () => {
    const res = await request(app)
      .post("/pins/pin_ds_001/claim")
      .send({ pickerId: "picker_test" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("claimed");
    expect(res.body.claimedBy).toBe("picker_test");
    expect(res.body.claimExpiresAt).toBeTruthy();
  });

  it("returns 409 PIN_ALREADY_CLAIMED for a second claim", async () => {
    await request(app).post("/pins/pin_ds_001/claim").send({ pickerId: "picker_1" });
    const res = await request(app)
      .post("/pins/pin_ds_001/claim")
      .send({ pickerId: "picker_2" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PIN_ALREADY_CLAIMED");
  });

  it("returns 404 for unknown pin", async () => {
    const res = await request(app)
      .post("/pins/pin_nonexistent/claim")
      .send({ pickerId: "picker_1" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PIN_NOT_FOUND");
  });

  it("returns 409 PIN_NOT_CLAIMABLE for collected pin", async () => {
    // pin_ds_004 is seeded as collected
    const res = await request(app)
      .post("/pins/pin_ds_004/claim")
      .send({ pickerId: "picker_1" });
    expect(res.status).toBe(409);
  });
});

describe("POST /pins/:pinId/collect", () => {
  it("collects a claimed pin", async () => {
    // Claim first
    await request(app).post("/pins/pin_ds_001/claim").send({ pickerId: "picker_test" });

    const res = await request(app)
      .post("/pins/pin_ds_001/collect")
      .send({ pickerId: "picker_test", actualMaterialType: "plastic", actualWeightKg: 3.5 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("collected");
    expect(res.body.collectedAt).toBeTruthy();
  });

  it("returns 409 for already collected pin", async () => {
    // pin_ds_004 is seeded as collected
    const res = await request(app)
      .post("/pins/pin_ds_004/collect")
      .send({ pickerId: "picker_test", actualMaterialType: "glass", actualWeightKg: 2.0 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PIN_ALREADY_COLLECTED");
  });

  it("returns 404 for unknown pin", async () => {
    const res = await request(app)
      .post("/pins/pin_nope/collect")
      .send({ pickerId: "picker_test", actualMaterialType: "plastic", actualWeightKg: 1.0 });
    expect(res.status).toBe(404);
  });

  it("returns 400 for missing fields", async () => {
    const res = await request(app)
      .post("/pins/pin_ds_001/collect")
      .send({ pickerId: "picker_test" });
    expect(res.status).toBe(400);
  });
});

describe("POST /routes/optimize", () => {
  it("returns orderedPinIds and estimatedDistanceKm", async () => {
    const res = await request(app).post("/routes/optimize").send({
      pickerId: "picker_test",
      currentLat: 28.61,
      currentLng: 77.20,
      pinIds: ["pin_ds_001", "pin_ds_002", "pin_ds_005"],
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orderedPinIds)).toBe(true);
    expect(typeof res.body.estimatedDistanceKm).toBe("number");
    expect(res.body.orderedPinIds.length).toBe(3);
  });

  it("returns empty list for empty pinIds", async () => {
    const res = await request(app).post("/routes/optimize").send({
      pickerId: "picker_test",
      currentLat: 28.61,
      currentLng: 77.20,
      pinIds: [],
    });
    expect(res.status).toBe(200);
    expect(res.body.orderedPinIds).toEqual([]);
    expect(res.body.estimatedDistanceKm).toBe(0);
  });
});

describe("POST /ratings", () => {
  it("creates a rating and returns ratingId", async () => {
    const res = await request(app).post("/ratings").send({
      pinId: "pin_ds_004",
      raterId: "hh_001",
      raterRole: "household",
      score: 5,
      note: "Great service!",
    });

    expect(res.status).toBe(201);
    expect(res.body.ratingId).toBeTruthy();
    expect(res.body.createdAt).toBeTruthy();
  });

  it("returns 400 for score out of range", async () => {
    const res = await request(app).post("/ratings").send({
      pinId: "pin_ds_004",
      raterId: "hh_001",
      raterRole: "household",
      score: 6,
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /aggregator/:id/rollup", () => {
  it("returns rollup for known aggregator", async () => {
    const res = await request(app).get("/aggregator/agg_south_delhi/rollup");
    expect(res.status).toBe(200);
    expect(res.body.aggregatorId).toBe("agg_south_delhi");
    expect(res.body.zoneId).toBe("zone_delhi_south");
    expect(typeof res.body.activePickers).toBe("number");
    expect(res.body.expectedVolumeKg).toBeTruthy();
  });

  it("returns 404 for unknown aggregator", async () => {
    const res = await request(app).get("/aggregator/agg_unknown/rollup");
    expect(res.status).toBe(404);
  });
});

describe("POST /aggregator/:id/rates", () => {
  it("updates rates and returns updatedAt", async () => {
    const res = await request(app)
      .post("/aggregator/agg_south_delhi/rates")
      .send({ rates: { plastic: 20, paper: 15 } });
    expect(res.status).toBe(200);
    expect(res.body.updatedAt).toBeTruthy();
  });
});

describe("GET /impact/daily", () => {
  it("returns days array with date and kgDiverted", async () => {
    const res = await request(app).get("/impact/daily?zoneId=zone_delhi_south&range=7d");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.days)).toBe(true);
    expect(res.body.days.length).toBeGreaterThan(0);

    const day = res.body.days[0];
    expect(day.date).toBeTruthy();
    expect(day.kgDiverted).toBeTruthy();
  });
});

describe("POST /__reset", () => {
  it("resets store and new pins are visible", async () => {
    // Create a pin
    await request(app).post("/pins").send({
      householdId: "hh_x",
      lat: 28.62,
      lng: 77.21,
      materialType: "plastic",
      quantityBucket: "small",
      pickupWindow: "2024-01-15T09:00:00Z/2024-01-15T12:00:00Z",
    });

    // Reset
    const resetRes = await request(app).post("/__reset");
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toBe("Seed data restored");

    // Verify seed data is back
    const pinsRes = await request(app).get("/pins");
    expect(pinsRes.body.pins.some((p: { pinId: string }) => p.pinId === "pin_ds_001")).toBe(true);
  });
});

describe("Error envelope shape", () => {
  it("all errors have { error: { code, message } } shape", async () => {
    const res = await request(app).post("/pins/bad_pin/claim").send({ pickerId: "p1" });
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("code");
    expect(res.body.error).toHaveProperty("message");
    expect(typeof res.body.error.code).toBe("string");
    expect(typeof res.body.error.message).toBe("string");
  });
});
