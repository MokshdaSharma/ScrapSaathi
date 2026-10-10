/**
 * ScrapSaathi Route Optimizer
 *
 * Pure functions for computing optimised pickup routes.
 * Algorithm: cluster pins within 150m → nearest-neighbour from current location → haversine
 *
 * This module has ZERO network calls; it is the local fallback.
 * For the API-backed version (with offline fallback), use getOptimizedRoute().
 */

import type { OptimizeRouteResponse } from "@scrapsaathi/api-client";

export interface PinLocation {
  pinId: string;
  lat: number;
  lng: number;
}

/** Cluster radius in kilometres */
const CLUSTER_RADIUS_KM = 0.15; // 150 metres

/**
 * Haversine distance between two lat/lng points, in kilometres.
 * Must match the AWS Lambda implementation exactly.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Cluster {
  centroidLat: number;
  centroidLng: number;
  pins: PinLocation[];
}

/** Group pins into clusters of radius ≤ CLUSTER_RADIUS_KM */
function clusterPins(pins: PinLocation[]): Cluster[] {
  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  for (const pin of pins) {
    if (assigned.has(pin.pinId)) continue;

    // Find existing cluster within radius
    let targetCluster: Cluster | null = null;
    for (const cluster of clusters) {
      const d = haversineKm(
        pin.lat,
        pin.lng,
        cluster.centroidLat,
        cluster.centroidLng
      );
      if (d <= CLUSTER_RADIUS_KM) {
        targetCluster = cluster;
        break;
      }
    }

    if (targetCluster) {
      targetCluster.pins.push(pin);
      // Update centroid to average of all pins in cluster
      const n = targetCluster.pins.length;
      targetCluster.centroidLat =
        targetCluster.pins.reduce((s, p) => s + p.lat, 0) / n;
      targetCluster.centroidLng =
        targetCluster.pins.reduce((s, p) => s + p.lng, 0) / n;
    } else {
      clusters.push({
        centroidLat: pin.lat,
        centroidLng: pin.lng,
        pins: [pin],
      });
    }
    assigned.add(pin.pinId);
  }

  return clusters;
}

/**
 * Optimise a route locally using:
 * 1. 150 m clustering
 * 2. Nearest-neighbour from current location (visiting clusters)
 * 3. Within each cluster, visit pins in ascending distance from centroid
 *
 * Returns orderedPinIds and estimatedDistanceKm (rounded to 2 decimal places).
 */
export function optimizeRouteLocally(
  currentLat: number,
  currentLng: number,
  pins: PinLocation[]
): OptimizeRouteResponse {
  if (pins.length === 0) {
    return { orderedPinIds: [], estimatedDistanceKm: 0 };
  }

  const clusters = clusterPins(pins);
  const visitedClusters = new Set<number>();
  const orderedPinIds: string[] = [];
  let totalDistanceKm = 0;
  let curLat = currentLat;
  let curLng = currentLng;

  while (visitedClusters.size < clusters.length) {
    // Find the nearest unvisited cluster centroid
    let nearestIdx = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      if (visitedClusters.has(i)) continue;
      const d = haversineKm(
        curLat,
        curLng,
        clusters[i].centroidLat,
        clusters[i].centroidLng
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    visitedClusters.add(nearestIdx);
    const cluster = clusters[nearestIdx];

    // Within the cluster, sort pins by distance from centroid
    const sortedPins = [...cluster.pins].sort((a, b) => {
      const da = haversineKm(
        a.lat,
        a.lng,
        cluster.centroidLat,
        cluster.centroidLng
      );
      const db = haversineKm(
        b.lat,
        b.lng,
        cluster.centroidLat,
        cluster.centroidLng
      );
      return da - db;
    });

    // Visit each pin in the cluster
    for (const pin of sortedPins) {
      const legDist = haversineKm(curLat, curLng, pin.lat, pin.lng);
      totalDistanceKm += legDist;
      orderedPinIds.push(pin.pinId);
      curLat = pin.lat;
      curLng = pin.lng;
    }
  }

  return {
    orderedPinIds,
    estimatedDistanceKm: Math.round(totalDistanceKm * 100) / 100,
  };
}

/**
 * Get optimised route — tries the API first, falls back to local algorithm.
 * Use this in the picker app to support offline operation.
 */
export async function getOptimizedRoute(
  pickerId: string,
  currentLat: number,
  currentLng: number,
  pins: PinLocation[]
): Promise<OptimizeRouteResponse> {
  try {
    const { optimizeRoute } = await import("@scrapsaathi/api-client");
    return await optimizeRoute({
      pickerId,
      currentLat,
      currentLng,
      pinIds: pins.map((p) => p.pinId),
    });
  } catch {
    // API unavailable or offline — use local algorithm
    return optimizeRouteLocally(currentLat, currentLng, pins);
  }
}

// ============================================================
// Live Street Routing & Navigation
// ============================================================

export interface StreetRouteResult {
  coordinates: [number, number][]; // [lat, lng] points for Leaflet polyline
  distanceKm: number;
  durationMinutes: number;
  isRoadSnapped: boolean;
}

/**
 * Fetch real street-snapped road geometry from OSRM (Open Source Routing Machine),
 * with instant fallback to direct waypoints when offline or on network delay.
 */
export async function fetchStreetRoute(
  origin: { lat: number; lng: number },
  orderedPins: PinLocation[]
): Promise<StreetRouteResult> {
  if (orderedPins.length === 0) {
    return {
      coordinates: [[origin.lat, origin.lng]],
      distanceKm: 0,
      durationMinutes: 0,
      isRoadSnapped: true,
    };
  }

  // Construct coordinates for OSRM: lng,lat;lng,lat
  const allPoints = [{ lat: origin.lat, lng: origin.lng }, ...orderedPins];
  const coordString = allPoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        // OSRM returns [lng, lat], convert to [lat, lng] for Leaflet
        const leafCoords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        return {
          coordinates: leafCoords,
          distanceKm: Math.round((route.distance / 1000) * 100) / 100,
          durationMinutes: Math.round(route.duration / 60),
          isRoadSnapped: true,
        };
      }
    }
  } catch {
    // Fall back to direct waypoint path if offline or timed out
  }

  // Fallback: direct waypoints with haversine distance
  let totalDist = 0;
  for (let i = 0; i < allPoints.length - 1; i++) {
    totalDist += haversineKm(
      allPoints[i].lat,
      allPoints[i].lng,
      allPoints[i + 1].lat,
      allPoints[i + 1].lng
    );
  }

  return {
    coordinates: allPoints.map((p) => [p.lat, p.lng]),
    distanceKm: Math.round(totalDist * 100) / 100,
    durationMinutes: Math.round((totalDist / 15) * 60), // estimated at 15 km/h for bike/e-rickshaw
    isRoadSnapped: false,
  };
}

/**
 * Generate a Google Maps turn-by-turn navigation URL with multiple waypoints
 * that can be opened on Android / iOS devices directly in the Google Maps app.
 */
export function getGoogleMapsNavigationUrl(
  origin: { lat: number; lng: number },
  orderedPins: { lat: number; lng: number }[]
): string {
  if (orderedPins.length === 0) return "";

  const destination = orderedPins[orderedPins.length - 1];
  const waypoints = orderedPins
    .slice(0, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");

  const waypointsParam = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypointsParam}&travelmode=bicycling`;
}

