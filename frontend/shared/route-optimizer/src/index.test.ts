import { describe, it, expect } from "vitest";
import {
  haversineKm,
  optimizeRouteLocally,
  fetchStreetRoute,
  getGoogleMapsNavigationUrl,
  type PinLocation,
} from "../src/index.js";
import fixtures from "../src/fixtures/route-fixtures.json";

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineKm(28.61, 77.20, 28.61, 77.20)).toBe(0);
  });

  it("computes distance between two known points (Delhi landmarks)", () => {
    // India Gate to Connaught Place ~3.5 km
    const d = haversineKm(28.6129, 77.2295, 28.6315, 77.2167);
    expect(d).toBeGreaterThan(2);
    expect(d).toBeLessThan(5);
  });

  it("is symmetric", () => {
    const d1 = haversineKm(28.61, 77.20, 28.62, 77.21);
    const d2 = haversineKm(28.62, 77.21, 28.61, 77.20);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.0001);
  });
});

describe("optimizeRouteLocally", () => {
  it("fixture1 — straight line ordering", () => {
    const f = fixtures.fixture1;
    const result = optimizeRouteLocally(
      f.input.currentLat,
      f.input.currentLng,
      f.input.pins as PinLocation[]
    );
    expect(result.orderedPinIds).toEqual(f.expected.orderedPinIds);
    // Distance within 0.5 km of fixture
    expect(Math.abs(result.estimatedDistanceKm - f.expected.estimatedDistanceKm)).toBeLessThan(0.5);
  });

  it("fixture2 — clustering two nearby pins together", () => {
    const f = fixtures.fixture2;
    const result = optimizeRouteLocally(
      f.input.currentLat,
      f.input.currentLng,
      f.input.pins as PinLocation[]
    );
    // pin_Z should be first (nearest to start)
    expect(result.orderedPinIds[0]).toBe("pin_Z");
    // pin_X and pin_Y are clustered — both come after Z
    expect(result.orderedPinIds).toContain("pin_X");
    expect(result.orderedPinIds).toContain("pin_Y");
    expect(result.orderedPinIds).toHaveLength(3);
  });

  it("fixture3 — single pin", () => {
    const f = fixtures.fixture3;
    const result = optimizeRouteLocally(
      f.input.currentLat,
      f.input.currentLng,
      f.input.pins as PinLocation[]
    );
    expect(result.orderedPinIds).toEqual(["pin_1"]);
    expect(result.estimatedDistanceKm).toBeGreaterThan(0);
  });

  it("fixture4 — empty list returns zero", () => {
    const result = optimizeRouteLocally(28.61, 77.20, []);
    expect(result.orderedPinIds).toEqual([]);
    expect(result.estimatedDistanceKm).toBe(0);
  });

  it("orders pins by nearest-first from current location", () => {
    const currentLat = 28.600;
    const currentLng = 77.200;
    const pins: PinLocation[] = [
      { pinId: "far", lat: 28.700, lng: 77.300 },
      { pinId: "near", lat: 28.602, lng: 77.202 },
    ];
    const result = optimizeRouteLocally(currentLat, currentLng, pins);
    expect(result.orderedPinIds[0]).toBe("near");
    expect(result.orderedPinIds[1]).toBe("far");
  });

  it("returns total distance > 0 for multiple non-co-located pins", () => {
    const pins: PinLocation[] = [
      { pinId: "A", lat: 28.61, lng: 77.20 },
      { pinId: "B", lat: 28.62, lng: 77.21 },
      { pinId: "C", lat: 28.63, lng: 77.22 },
    ];
    const result = optimizeRouteLocally(28.60, 77.19, pins);
    expect(result.estimatedDistanceKm).toBeGreaterThan(0);
    expect(result.orderedPinIds).toHaveLength(3);
  });

  it("clusters pins within 150m into the same visit", () => {
    // Two pins 100m apart should be clustered
    const pins: PinLocation[] = [
      { pinId: "cluster_1", lat: 28.6100, lng: 77.2000 },
      { pinId: "cluster_2", lat: 28.6101, lng: 77.2001 }, // ~15m away
      { pinId: "distant", lat: 28.650, lng: 77.250 }, // ~6km away
    ];
    const result = optimizeRouteLocally(28.600, 77.195, pins);
    // Clustered pins should be visited before the distant one
    const idx1 = result.orderedPinIds.indexOf("cluster_1");
    const idx2 = result.orderedPinIds.indexOf("cluster_2");
    const idxDistant = result.orderedPinIds.indexOf("distant");
    expect(Math.abs(idx1 - idx2)).toBe(1); // adjacent in output
    expect(idxDistant).toBe(2); // last
  });
});

describe("getGoogleMapsNavigationUrl", () => {
  it("generates a valid bicycling navigation link with origin, destination, and waypoints", () => {
    const origin = { lat: 28.618, lng: 77.21 };
    const pins = [
      { lat: 28.62, lng: 77.215 },
      { lat: 28.625, lng: 77.22 },
    ];
    const url = getGoogleMapsNavigationUrl(origin, pins);
    expect(url).toContain("https://www.google.com/maps/dir/");
    expect(url).toContain("travelmode=bicycling");
    expect(url).toContain("origin=28.618,77.21");
    expect(url).toContain("destination=28.625,77.22");
    expect(url).toContain("waypoints=28.62%2C77.215");
  });

  it("returns empty string if pins array is empty", () => {
    expect(getGoogleMapsNavigationUrl({ lat: 28.6, lng: 77.2 }, [])).toBe("");
  });
});

describe("fetchStreetRoute", () => {
  it("parses OSRM GeoJSON road coordinates when API succeeds", async () => {
    const origin = { lat: 28.618, lng: 77.21 };
    const pins = [{ pinId: "p1", lat: 28.62, lng: 77.215 }];

    const fakeOsrmResponse = {
      routes: [
        {
          distance: 1250,
          duration: 300,
          geometry: {
            coordinates: [
              [77.21, 28.618],
              [77.212, 28.619],
              [77.215, 28.62],
            ],
          },
        },
      ],
    };

    const originalFetch = global.fetch;
    global.fetch = async () =>
      ({
        ok: true,
        json: async () => fakeOsrmResponse,
      } as any);

    try {
      const res = await fetchStreetRoute(origin, pins);
      expect(res.isRoadSnapped).toBe(true);
      expect(res.coordinates).toEqual([
        [28.618, 77.21],
        [28.619, 77.212],
        [28.62, 77.215],
      ]);
      expect(res.distanceKm).toBe(1.25);
      expect(res.durationMinutes).toBe(5);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("returns fallback coordinates and distance when offline", async () => {
    const origin = { lat: 28.618, lng: 77.21 };
    const pins = [
      { pinId: "p1", lat: 28.62, lng: 77.215 },
      { pinId: "p2", lat: 28.625, lng: 77.22 },
    ];

    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error("Network unreachable");
    };

    try {
      const res = await fetchStreetRoute(origin, pins);
      expect(res.isRoadSnapped).toBe(false);
      expect(res.coordinates).toBeDefined();
      expect(res.coordinates.length).toBe(3);
      expect(res.distanceKm).toBeGreaterThan(0);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

