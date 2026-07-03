import { STATIONS, INTERCHANGES, FARE_RULES } from "@/data/network";
import type { MrtStation, LineId, FareRule } from "@/types/mrt";

const STATION_MAP = new Map(STATIONS.map((s) => [s.id, s]));
const BY_LINE = new Map<LineId, MrtStation[]>();
for (const s of STATIONS) {
  const arr = BY_LINE.get(s.lineId) ?? [];
  arr.push(s);
  BY_LINE.set(s.lineId, arr);
}
for (const arr of BY_LINE.values()) arr.sort((a, b) => a.order - b.order);

export function getStation(id: string): MrtStation | undefined {
  return STATION_MAP.get(id);
}
export function stationsForLine(id: LineId): MrtStation[] {
  return BY_LINE.get(id) ?? [];
}
export function allStations(): MrtStation[] {
  return STATIONS;
}

/** Adjacency: [neighborId, timeSeconds] */
type Edge = [string, number, "ride" | "transfer"];
const GRAPH = new Map<string, Edge[]>();

const TIME_PER_STATION = 120; // 2 minutes
for (const [line, list] of BY_LINE.entries()) {
  void line;
  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i].id;
    const b = list[i + 1].id;
    (GRAPH.get(a) ?? GRAPH.set(a, []).get(a)!).push([b, TIME_PER_STATION, "ride"]);
    (GRAPH.get(b) ?? GRAPH.set(b, []).get(b)!).push([a, TIME_PER_STATION, "ride"]);
  }
}
for (const [a, b, walk] of INTERCHANGES) {
  (GRAPH.get(a) ?? GRAPH.set(a, []).get(a)!).push([b, walk, "transfer"]);
  (GRAPH.get(b) ?? GRAPH.set(b, []).get(b)!).push([a, walk, "transfer"]);
}

export interface RouteSegment {
  fromStationId: string;
  toStationId: string;
  lineId: LineId;
  stations: string[]; // includes from + to
  timeSeconds: number;
}

export interface RouteResult {
  originId: string;
  destinationId: string;
  segments: RouteSegment[];
  totalTimeSeconds: number;
  totalStations: number;
  transfers: number;
  fareByOperator: Array<{ operator: string; lineId: LineId; fare: number; source: FareRule["source"] }>;
  totalFare: number | null; // null when any leg is unavailable
  fareAvailable: boolean;
}

export type RoutePreference = "fastest" | "fewest_transfers" | "least_walking";

/** Dijkstra with cost blending based on preference. */
export function planRoute(
  originId: string,
  destinationId: string,
  preference: RoutePreference = "fastest",
): RouteResult | null {
  if (!STATION_MAP.has(originId) || !STATION_MAP.has(destinationId)) return null;
  if (originId === destinationId) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, { id: string; via: "ride" | "transfer" }>();
  const visited = new Set<string>();
  const queue = new Set<string>(STATIONS.map((s) => s.id));
  dist.set(originId, 0);

  while (queue.size) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of queue) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) {
        best = d;
        u = id;
      }
    }
    if (u === null || best === Infinity) break;
    queue.delete(u);
    visited.add(u);
    if (u === destinationId) break;
    for (const [v, t, kind] of GRAPH.get(u) ?? []) {
      if (visited.has(v)) continue;
      let cost = t;
      if (kind === "transfer") {
        if (preference === "fewest_transfers") cost += 600;
        else if (preference === "least_walking") cost += 300;
      }
      const alt = best + cost;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, { id: u, via: kind });
      }
    }
  }
  if (!dist.has(destinationId)) return null;

  // reconstruct
  const path: Array<{ id: string; via: "ride" | "transfer" | "start" }> = [
    { id: destinationId, via: "start" },
  ];
  let cur = destinationId;
  while (cur !== originId) {
    const p = prev.get(cur);
    if (!p) return null;
    path.unshift({ id: p.id, via: p.via });
    cur = p.id;
  }

  // Split into segments by line
  const segments: RouteSegment[] = [];
  let currentLine: LineId | null = null;
  let currentStations: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    const s = STATION_MAP.get(node.id)!;
    if (i === 0) {
      currentLine = s.lineId;
      currentStations = [s.id];
      continue;
    }
    if (node.via === "transfer" || s.lineId !== currentLine) {
      // close previous
      if (currentStations.length > 1 && currentLine) {
        segments.push({
          fromStationId: currentStations[0],
          toStationId: currentStations[currentStations.length - 1],
          lineId: currentLine,
          stations: [...currentStations],
          timeSeconds: (currentStations.length - 1) * TIME_PER_STATION,
        });
      }
      currentLine = s.lineId;
      currentStations = [s.id];
    } else {
      currentStations.push(s.id);
    }
  }
  if (currentStations.length > 1 && currentLine) {
    segments.push({
      fromStationId: currentStations[0],
      toStationId: currentStations[currentStations.length - 1],
      lineId: currentLine,
      stations: [...currentStations],
      timeSeconds: (currentStations.length - 1) * TIME_PER_STATION,
    });
  }

  const totalTimeSeconds = dist.get(destinationId)!;
  const totalStations = segments.reduce((n, s) => n + (s.stations.length - 1), 0);
  const transfers = Math.max(0, segments.length - 1);

  const fareByOperator = segments.map((seg) => {
    const rule = FARE_RULES.find((r) => r.lineId === seg.lineId);
    const stops = seg.stations.length - 1;
    let fare = 0;
    if (rule) {
      const band = rule.fareBands.find((b) => stops >= b.minStations && stops <= b.maxStations);
      fare = band ? band.fare : rule.maxFare;
    }
    return {
      operator: rule?.operator ?? "unknown",
      lineId: seg.lineId,
      fare,
      source: rule?.source ?? { sourceName: "unavailable", sourceType: "demo_only" as const },
    };
  });
  const fareAvailable = fareByOperator.every((f) => f.fare > 0);
  const totalFare = fareAvailable ? fareByOperator.reduce((n, f) => n + f.fare, 0) : null;

  return {
    originId,
    destinationId,
    segments,
    totalTimeSeconds,
    totalStations,
    transfers,
    fareByOperator,
    totalFare,
    fareAvailable,
  };
}

export function searchStations(query: string, limit = 12): MrtStation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: Array<{ s: MrtStation; score: number }> = [];
  for (const s of STATIONS) {
    const th = s.nameTh.toLowerCase();
    const en = s.nameEn.toLowerCase();
    const code = s.code.toLowerCase();
    let score = 0;
    if (th === q || en === q) score = 100;
    else if (th.startsWith(q) || en.startsWith(q) || code === q) score = 80;
    else if (th.includes(q) || en.includes(q) || code.includes(q)) score = 50;
    if (score > 0) scored.push({ s, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.s);
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function nearestStations(
  point: { lat: number; lng: number },
  limit = 5,
): Array<{ station: MrtStation; meters: number }> {
  return STATIONS.map((s) => ({ station: s, meters: haversineMeters(point, s) }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, limit);
}
