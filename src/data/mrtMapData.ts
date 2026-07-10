import { FUTURE_NETWORK, LINES, STATIONS } from "@/data/network";
import type { LineId, LineStatus, MrtStation } from "@/types/mrt";

export interface MrtMapStation {
  id: string;
  stationId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  lineId: LineId;
  lineIds: LineId[];
  order: number;
  lat: number;
  lng: number;
  diagramLat: number;
  diagramLng: number;
  isInterchange: boolean;
  operational: boolean;
  labelAnchor: "left" | "right" | "top" | "bottom";
  labelPriority: number;
}

export interface MrtMapLine {
  id: LineId;
  nameTh: string;
  nameEn: string;
  color: string;
  status: LineStatus;
  stations: MrtMapStation[];
}

function samePhysicalStation(a: MrtStation, b: MrtStation) {
  return (
    a.nameTh === b.nameTh && Math.abs(a.lat - b.lat) < 0.0002 && Math.abs(a.lng - b.lng) < 0.0002
  );
}

function lineIdsForStation(station: MrtStation) {
  const ids = STATIONS.filter((candidate) => samePhysicalStation(candidate, station)).map(
    (candidate) => candidate.lineId,
  );
  return Array.from(new Set(ids));
}

const DIAGRAM_ORIGIN = { lng: 100.55, lat: 13.78 };
const DIAGRAM_STEP = 0.018;

function diagramPoint(x: number, y: number) {
  return {
    diagramLng: DIAGRAM_ORIGIN.lng + x * DIAGRAM_STEP,
    diagramLat: DIAGRAM_ORIGIN.lat + y * DIAGRAM_STEP,
  };
}

function blueDiagram(order: number) {
  if (order <= 7) return diagramPoint(-7 + (order - 1) * 0.85, -5.6 + Math.max(0, order - 5) * 0.3);
  if (order <= 16) return diagramPoint(-1.9, -4.7 + (order - 8) * 0.72);
  if (order <= 21) return diagramPoint(-1.2 + (order - 17) * 1, 1.05 + (order - 17) * 0.32);
  if (order <= 28) return diagramPoint(3.4, 2.0 - (order - 22) * 0.72);
  if (order <= 34) return diagramPoint(3.0 - (order - 29) * 0.78, -3.0);
  return diagramPoint(-1.0 - (order - 35) * 0.3, -3.4 - (order - 35) * 0.42);
}

function purpleDiagram(order: number) {
  if (order <= 9) return diagramPoint(-8.7 + (order - 1) * 0.8, 5.4);
  return diagramPoint(-1.8 + (order - 10) * 0.18, 4.85 - (order - 10) * 0.5);
}

function yellowDiagram(order: number) {
  return diagramPoint(2.8 + Math.max(0, order - 1) * 0.24, 2.65 - Math.max(0, order - 1) * 0.55);
}

function pinkDiagram(order: number) {
  if (order <= 9) return diagramPoint(0.0 + (order - 1) * 0.68, 4.25 + (order - 1) * 0.14);
  if (order <= 15) return diagramPoint(4.25 + (order - 10) * 0.5, 4.5 - (order - 10) * 0.35);
  return diagramPoint(7.0 + (order - 16) * 0.2, 2.35 - (order - 16) * 0.36);
}

function orangeDiagram(order: number) {
  return diagramPoint(3.4 + (order - 1) * 0.82, -0.2 - (order - 1) * 0.42);
}

function brownDiagram(order: number) {
  return diagramPoint(0.0 + (order - 1) * 1.8, 4.25 - (order - 1) * 1.05);
}

function diagramFor(lineId: LineId, order: number) {
  switch (lineId) {
    case "blue":
      return blueDiagram(order);
    case "purple":
      return purpleDiagram(order);
    case "yellow":
      return yellowDiagram(order);
    case "pink":
      return pinkDiagram(order);
    case "orange":
      return orangeDiagram(order);
    case "brown":
      return brownDiagram(order);
  }
}

const INTERCHANGE_DIAGRAM_POINTS: Record<string, ReturnType<typeof diagramPoint>> = {
  BL16: diagramPoint(-1.9, 1.05),
  PP16: diagramPoint(-1.9, 1.05),
  BL21: diagramPoint(2.8, 2.65),
  YL01: diagramPoint(2.8, 2.65),
  PP11: diagramPoint(0, 4.25),
  PK01: diagramPoint(0, 4.25),
  BL25: diagramPoint(3.4, -0.2),
  OR01: diagramPoint(3.4, -0.2),
  PK29: diagramPoint(9.6, -2.35),
  OR07: diagramPoint(9.6, -2.35),
  YL09: diagramPoint(4.72, -1.75),
  BR04: diagramPoint(4.72, -1.75),
};

function diagramCoordinate(lineId: LineId, order: number, stationId: string) {
  return INTERCHANGE_DIAGRAM_POINTS[stationId] ?? diagramFor(lineId, order);
}

function labelAnchorFor(lineId: LineId, order: number): MrtMapStation["labelAnchor"] {
  if (lineId === "blue") {
    if (order <= 7) return "bottom";
    if (order <= 16) return order % 2 === 0 ? "left" : "right";
    if (order <= 21) return "top";
    if (order <= 28) return "right";
    if (order <= 34) return "bottom";
    return "left";
  }
  if (lineId === "purple") return order <= 9 ? "top" : "left";
  if (lineId === "yellow") return "right";
  if (lineId === "pink") return order <= 9 ? "top" : "right";
  if (lineId === "brown") return "bottom";
  return "top";
}

function labelPriorityFor(station: MrtStation) {
  if (station.isInterchange) return 3;
  if (
    [
      "BL05",
      "BL07",
      "BL16",
      "BL21",
      "BL28",
      "BL32",
      "PP11",
      "YL11",
      "YL23",
      "PK13",
      "PK15",
      "PK29",
    ].includes(station.id)
  ) {
    return 2;
  }
  return 1;
}

function toMapStation(station: MrtStation): MrtMapStation {
  const order = station.order;
  const diagram = diagramCoordinate(station.lineId, order, station.id);
  return {
    id: station.id,
    stationId: station.id,
    code: station.code,
    nameTh: station.nameTh,
    nameEn: station.nameEn,
    lineId: station.lineId,
    lineIds: lineIdsForStation(station),
    order: station.order,
    lat: station.lat,
    lng: station.lng,
    diagramLat: diagram.diagramLat,
    diagramLng: diagram.diagramLng,
    isInterchange: Boolean(station.isInterchange),
    operational: station.operational,
    labelAnchor: labelAnchorFor(station.lineId, order),
    labelPriority: labelPriorityFor(station),
  };
}

function futureStationsFor(lineId: "orange" | "brown"): MrtMapStation[] {
  return FUTURE_NETWORK[lineId].stations.map((station, index) => {
    const order = index + 1;
    const diagram = diagramCoordinate(lineId, order, station.code);
    return {
      id: `${station.code}`,
      stationId: `${station.code}`,
      code: station.code,
      nameTh: station.nameTh,
      nameEn: station.nameEn,
      lineId,
      lineIds: [lineId],
      order,
      lat: station.lat,
      lng: station.lng,
      diagramLat: diagram.diagramLat,
      diagramLng: diagram.diagramLng,
      isInterchange: Boolean(INTERCHANGE_DIAGRAM_POINTS[station.code]),
      operational: false,
      labelAnchor: labelAnchorFor(lineId, order),
      labelPriority: INTERCHANGE_DIAGRAM_POINTS[station.code] ? 3 : 1,
    };
  });
}

export const MRT_MAP_STATIONS: MrtMapStation[] = STATIONS.map(toMapStation);

export const MRT_MAP_LINES: MrtMapLine[] = LINES.map((line) => ({
  id: line.id,
  nameTh: line.nameTh,
  nameEn: line.nameEn,
  color: line.color,
  status: line.status,
  stations:
    line.status === "operational"
      ? MRT_MAP_STATIONS.filter((station) => station.lineId === line.id).sort(
          (a, b) => a.order - b.order,
        )
      : futureStationsFor(line.id as "orange" | "brown"),
}));
