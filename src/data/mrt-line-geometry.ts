import {
  MRT_MAP_LINE_SEQUENCES,
  type LatLngPoint,
  type SupportedMapLineId,
  stationPointById,
} from "@/data/mrt-station-coordinates";

export type LineGeometrySegment = {
  lineId: SupportedMapLineId;
  fromStationId: string;
  toStationId: string;
  points: LatLngPoint[];
  verification: "demo";
};

export const MRT_LINE_GEOMETRY_SOURCE = "src/data/mrt-line-geometry.ts demo station-id geometry";
export const MRT_LINE_GEOMETRY_IS_VERIFIED = false;

export const MRT_LINE_GEOMETRY_SEGMENTS = Object.fromEntries(
  Object.entries(MRT_MAP_LINE_SEQUENCES).map(([lineId, stationIds]) => [
    lineId,
    buildLineGeometry(lineId as SupportedMapLineId, stationIds),
  ]),
) as Record<SupportedMapLineId, LineGeometrySegment[]>;

export function geometryPathForLine(lineId: SupportedMapLineId): LatLngPoint[] {
  return pointsForSequence(lineId, MRT_MAP_LINE_SEQUENCES[lineId]);
}

export function geometryPathForRouteStationIds(
  stationIds: string[],
  lineId: SupportedMapLineId,
): LatLngPoint[] {
  if (stationIds.length < 2) return pathForStationIds(stationIds);
  const lineSequence = MRT_MAP_LINE_SEQUENCES[lineId];
  const startIndex = lineSequence.indexOf(stationIds[0]);
  const endIndex = lineSequence.indexOf(stationIds[stationIds.length - 1]);
  if (startIndex < 0 || endIndex < 0) return pathForStationIds(stationIds);
  const routeSequence =
    startIndex <= endIndex
      ? lineSequence.slice(startIndex, endIndex + 1)
      : lineSequence.slice(endIndex, startIndex + 1).reverse();
  return pointsForSequence(lineId, routeSequence);
}

export function validateMrtLineGeometry(): string[] {
  const warnings: string[] = [];

  for (const lineId of Object.keys(MRT_MAP_LINE_SEQUENCES) as SupportedMapLineId[]) {
    const stationIds = MRT_MAP_LINE_SEQUENCES[lineId];
    const seen = new Set<string>();

    for (const stationId of stationIds) {
      if (seen.has(stationId)) warnings.push(`Duplicate station in ${lineId}: ${stationId}`);
      seen.add(stationId);
      const point = stationPointById(stationId);
      if (!point) {
        warnings.push(`Missing coordinate for ${lineId} station ${stationId}`);
        continue;
      }
      if (
        !Number.isFinite(point.lat) ||
        !Number.isFinite(point.lng) ||
        point.lat < 13 ||
        point.lat > 14.2 ||
        point.lng < 100.2 ||
        point.lng > 100.9
      ) {
        warnings.push(`Suspicious coordinate for ${lineId} station ${stationId}`);
      }
    }

    for (const segment of MRT_LINE_GEOMETRY_SEGMENTS[lineId]) {
      if (segment.points.length < 3) {
        warnings.push(
          `Missing intermediate geometry for ${segment.fromStationId}-${segment.toStationId}`,
        );
      }
    }
  }

  return warnings;
}

function buildLineGeometry(
  lineId: SupportedMapLineId,
  stationIds: string[],
): LineGeometrySegment[] {
  return stationIds
    .slice(0, -1)
    .map((stationId, index) =>
      createGeometrySegment(lineId, stationId, stationIds[index + 1], index),
    )
    .filter((segment): segment is LineGeometrySegment => Boolean(segment));
}

function createGeometrySegment(
  lineId: SupportedMapLineId,
  fromStationId: string,
  toStationId: string,
  _index: number,
): LineGeometrySegment | null {
  const start = stationPointById(fromStationId);
  const end = stationPointById(toStationId);
  if (!start || !end) return null;
  return {
    lineId,
    fromStationId,
    toStationId,
    points: interpolatePoints(start, end),
    verification: "demo",
  };
}

function pointsForSequence(lineId: SupportedMapLineId, stationIds: string[]): LatLngPoint[] {
  if (stationIds.length < 2) return pathForStationIds(stationIds);
  const path: LatLngPoint[] = [];

  for (let index = 0; index < stationIds.length - 1; index += 1) {
    const fromStationId = stationIds[index];
    const toStationId = stationIds[index + 1];
    const segment = findSegment(lineId, fromStationId, toStationId);
    const points = segment ?? pathForStationIds([fromStationId, toStationId]);
    appendPoints(path, points);
  }

  return path;
}

function findSegment(
  lineId: SupportedMapLineId,
  fromStationId: string,
  toStationId: string,
): LatLngPoint[] | null {
  const segment = MRT_LINE_GEOMETRY_SEGMENTS[lineId].find(
    (item) =>
      (item.fromStationId === fromStationId && item.toStationId === toStationId) ||
      (item.fromStationId === toStationId && item.toStationId === fromStationId),
  );
  if (!segment) return null;
  return segment.fromStationId === fromStationId ? segment.points : [...segment.points].reverse();
}

function appendPoints(path: LatLngPoint[], points: LatLngPoint[]) {
  for (const point of points) {
    const previous = path[path.length - 1];
    if (previous && previous.lat === point.lat && previous.lng === point.lng) continue;
    path.push(point);
  }
}

function pathForStationIds(stationIds: string[]): LatLngPoint[] {
  return stationIds.map(stationPointById).filter((point): point is LatLngPoint => Boolean(point));
}

function interpolatePoints(start: LatLngPoint, end: LatLngPoint): LatLngPoint[] {
  return [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => ({
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  }));
}
