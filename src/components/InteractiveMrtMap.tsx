import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  LocateFixed,
  MapIcon,
  Navigation,
  Radio,
  X,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import { LINES } from "@/data/network";
import { MRT_LINES } from "@/data/mrtLines";
import { MRT_STATIONS, type MrtMapStation } from "@/data/mrtStations";
import type { LineId } from "@/types/mrt";
import { getStation } from "@/services/routeService";
import { useTripStore } from "@/stores/tripStore";
import { useSharedLiveLocation } from "@/components/LocationProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BKK_CENTER: [number, number] = [100.55, 13.78];
const EMPTY_POINTS: FeatureCollection<Point> = { type: "FeatureCollection", features: [] };
const EMPTY_LINES: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };
const EMPTY_POLYGONS: FeatureCollection<Polygon> = { type: "FeatureCollection", features: [] };

const SOURCE_IDS = {
  lines: "mrt-lines",
  stations: "mrt-stations",
  route: "mrt-route",
  selected: "mrt-selected-station",
  nearest: "mrt-nearest-station",
  user: "mrt-user-location",
  userAccuracy: "mrt-user-accuracy",
} as const;

type MapViewMode = "diagram" | "map";
type MapCoordinate = {
  lng: number;
  lat: number;
  diagramLng?: number;
  diagramLat?: number;
};

const LINE_COLORS: Record<LineId, string> = {
  blue: "#1E63B5",
  purple: "#6B3FA0",
  yellow: "#EAB308",
  pink: "#EC4899",
  orange: "#F97316",
  brown: "#8B5A2B",
};

const DEFAULT_VISIBLE: Record<LineId, boolean> = {
  blue: true,
  purple: true,
  yellow: true,
  pink: true,
  orange: false,
  brown: false,
};

const PANEL_STORAGE_KEYS = {
  line: "mrt_map_line_panel_collapsed",
  realtime: "mrt_map_realtime_panel_collapsed",
} as const;

const LABEL_PLACEMENTS = [
  { key: "left", textAnchor: "right", offset: [-1.45, 0] },
  { key: "right", textAnchor: "left", offset: [1.45, 0] },
  { key: "top", textAnchor: "bottom", offset: [0, -1.3] },
  { key: "bottom", textAnchor: "top", offset: [0, 1.3] },
] as const;

const IMPORTANT_STATIONS = new Set([
  "BL05",
  "BL07",
  "BL16",
  "BL17",
  "BL19",
  "BL21",
  "BL27",
  "BL28",
  "BL32",
  "BL34",
  "BL37",
  "PP11",
  "PP16",
  "YL01",
  "YL08",
  "YL11",
  "YL23",
  "PK01",
  "PK10",
  "PK14",
  "PK16",
  "PK30",
]);

const MAP_STATION_BY_ID = new Map(MRT_STATIONS.map((station) => [station.stationId, station]));
const BASE_SOURCE_IDS = new Set(["cartoLight", "osmFallback"]);

const MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    cartoLight: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
    osmFallback: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "mrt-background",
      type: "background",
      paint: { "background-color": "#eef3f8" },
    },
    {
      id: "osm-fallback-raster",
      type: "raster",
      source: "osmFallback",
      paint: {
        "raster-opacity": 0.2,
        "raster-saturation": -1,
        "raster-contrast": -0.22,
        "raster-brightness-min": 0.14,
        "raster-brightness-max": 1,
      },
    },
    {
      id: "carto-light-raster",
      type: "raster",
      source: "cartoLight",
      paint: {
        "raster-opacity": 0.82,
        "raster-saturation": -1,
        "raster-contrast": -0.08,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 1,
      },
    },
  ],
};

function colorFor(lineId: LineId) {
  return LINE_COLORS[lineId];
}

function lngLatFor(station: MapCoordinate, viewMode: MapViewMode = "map"): [number, number] {
  if (
    viewMode === "diagram" &&
    typeof station.diagramLng === "number" &&
    typeof station.diagramLat === "number"
  ) {
    return [station.diagramLng, station.diagramLat];
  }
  return [station.lng, station.lat];
}

function mapStationFor(id: string) {
  return MAP_STATION_BY_ID.get(id);
}

function stationCoordinateFor(id: string, viewMode: MapViewMode): [number, number] | null {
  const mapStation = mapStationFor(id);
  if (mapStation) return lngLatFor(mapStation, viewMode);
  const station = getStation(id);
  return station ? lngLatFor(station, "map") : null;
}

function isProbablySwapped(station: { lat: number; lng: number }) {
  return station.lng >= 5 && station.lng <= 25 && station.lat >= 90 && station.lat <= 110;
}

function hasValidLngLat(station: { lat: number; lng: number }) {
  return (
    Number.isFinite(station.lat) &&
    Number.isFinite(station.lng) &&
    station.lat >= -90 &&
    station.lat <= 90 &&
    station.lng >= -180 &&
    station.lng <= 180
  );
}

function validateMapData() {
  if (!import.meta.env.DEV) return;
  const missing = MRT_STATIONS.filter((station) => !hasValidLngLat(station));
  const missingNames = MRT_STATIONS.filter((station) => !station.nameTh || !station.nameEn);
  const swapped = MRT_STATIONS.filter((station) => isProbablySwapped(station));
  console.log("[MRT map] stations loaded:", MRT_STATIONS.length);
  console.log("[MRT map] lines loaded:", MRT_LINES.length);
  missing.forEach((station) => console.warn("[MRT map] invalid station coordinate:", station));
  missingNames.forEach((station) => console.warn("[MRT map] missing station label:", station));
  swapped.forEach((station) => console.warn("[MRT map] coordinate may be swapped:", station));
  MRT_LINES.forEach((line) => {
    if (line.stations.length < 2) console.warn("[MRT map] line has too few stations:", line.id);
  });
}

function pointFeature(
  station: MrtMapStation,
  viewMode: MapViewMode,
  props: Record<string, unknown> = {},
  lang: string = "th",
): Feature<Point> {
  const primary = lang.startsWith("en")
    ? station.nameEn || station.nameTh || station.code
    : station.nameTh || station.nameEn || station.code;
  const secondary = lang.startsWith("en")
    ? station.nameTh || ""
    : station.nameEn || "";
  return {
    type: "Feature",
    properties: {
      id: station.stationId,
      stationId: station.stationId,
      code: station.code,
      label: secondary ? `${primary}\n${secondary}` : primary,
      nameTh: station.nameTh,
      nameEn: station.nameEn,
      lineId: station.lineId,
      lineIds: station.lineIds.join(","),
      color: colorFor(station.lineId),
      isInterchange: station.isInterchange,
      labelAnchor: station.labelAnchor,
      labelPriority: station.labelPriority,
      ...props,
    },
    geometry: { type: "Point", coordinates: lngLatFor(station, viewMode) },
  };
}


function singlePointCollection(
  station: MrtMapStation | null | undefined,
  viewMode: MapViewMode,
  props: Record<string, unknown> = {},
  lang: string = "th",
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: station ? [pointFeature(station, viewMode, props, lang)] : [],
  };
}

function mrtLineFeatures(
  visible: Record<LineId, boolean>,
  viewMode: MapViewMode,
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: MRT_LINES.filter((line) => visible[line.id] && line.stations.length > 1).map(
      (line) => ({
        type: "Feature",
        properties: {
          lineId: line.id,
          nameTh: line.nameTh,
          color: line.color,
          future: line.status !== "operational",
        },
        geometry: {
          type: "LineString",
          coordinates: line.stations.map((station) => lngLatFor(station, viewMode)),
        },
      }),
    ),
  };
}

function shouldShowLabel(
  station: MrtMapStation,
  zoom: number,
  viewMode: MapViewMode,
  routeSet: Set<string>,
  selectedId?: string,
  nearestId?: string,
) {
  if (viewMode === "diagram") {
    return (
      station.stationId === selectedId ||
      station.stationId === nearestId ||
      routeSet.has(station.stationId) ||
      station.labelPriority >= 2 ||
      zoom >= 9.8 ||
      station.order % 2 === 0
    );
  }

  return (
    station.stationId === selectedId ||
    station.stationId === nearestId ||
    routeSet.has(station.stationId) ||
    station.labelPriority >= 2 ||
    IMPORTANT_STATIONS.has(station.stationId) ||
    zoom >= 13.1 ||
    (zoom >= 12.2 && station.order % 3 === 0)
  );
}

function stationFeatures(
  visible: Record<LineId, boolean>,
  zoom: number,
  viewMode: MapViewMode,
  routeSet: Set<string>,
  selectedId?: string,
  nearestId?: string,
  lang: string = "th",
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: MRT_STATIONS.filter((station) => visible[station.lineId]).map((station) =>
      pointFeature(
        station,
        viewMode,
        {
          inRoute: routeSet.has(station.stationId),
          isSelected: station.stationId === selectedId,
          isNearest: station.stationId === nearestId,
          showLabel: shouldShowLabel(station, zoom, viewMode, routeSet, selectedId, nearestId),
        },
        lang,
      ),
    ),
  };
}

function routeFeature(
  routeStations: string[],
  viewMode: MapViewMode,
): FeatureCollection<LineString> {
  const coordinates = routeStations
    .map((id) => stationCoordinateFor(id, viewMode))
    .filter((coordinate): coordinate is [number, number] => Boolean(coordinate));
  if (coordinates.length < 2) return EMPTY_LINES;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      },
    ],
  };
}

function circleFeature(lng: number, lat: number, radiusMeters: number): FeatureCollection<Polygon> {
  const points = 72;
  const coordinates: [number, number][] = [];
  const latRadius = radiusMeters / 110_574;
  const lngRadius = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));

  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    coordinates.push([lng + Math.cos(angle) * lngRadius, lat + Math.sin(angle) * latRadius]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [coordinates] },
      },
    ],
  };
}

function fitStationBounds(map: MapLibreMap, viewMode: MapViewMode, duration = 0) {
  const bounds = new maplibregl.LngLatBounds();
  MRT_STATIONS.forEach((station) => bounds.extend(lngLatFor(station, viewMode)));
  map.fitBounds(bounds, {
    padding: { top: 76, bottom: 96, left: 170, right: 150 },
    duration,
    maxZoom: viewMode === "diagram" ? 10.95 : 11.35,
  });
}

function applyBaseMapMode(map: MapLibreMap, viewMode: MapViewMode) {
  if (map.getLayer("mrt-background")) {
    map.setPaintProperty(
      "mrt-background",
      "background-color",
      viewMode === "map" ? "#eef3f8" : "#ffffff",
    );
  }
  if (map.getLayer("carto-light-raster")) {
    map.setPaintProperty("carto-light-raster", "raster-opacity", viewMode === "map" ? 0.82 : 0.02);
  }
  if (map.getLayer("osm-fallback-raster")) {
    map.setPaintProperty("osm-fallback-raster", "raster-opacity", viewMode === "map" ? 0.2 : 0);
  }
}

function setGeoJsonData(
  map: MapLibreMap,
  sourceId: string,
  data: FeatureCollection<Point> | FeatureCollection<LineString> | FeatureCollection<Polygon>,
) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
}

function addGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: FeatureCollection<Point> | FeatureCollection<LineString> | FeatureCollection<Polygon>,
) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: "geojson", data });
  }
}

function addMrtLayers(map: MapLibreMap) {
  if (map.getSource(SOURCE_IDS.lines)) return;

  addGeoJsonSource(map, SOURCE_IDS.lines, EMPTY_LINES);
  addGeoJsonSource(map, SOURCE_IDS.stations, EMPTY_POINTS);
  addGeoJsonSource(map, SOURCE_IDS.route, EMPTY_LINES);
  addGeoJsonSource(map, SOURCE_IDS.selected, EMPTY_POINTS);
  addGeoJsonSource(map, SOURCE_IDS.nearest, EMPTY_POINTS);
  addGeoJsonSource(map, SOURCE_IDS.user, EMPTY_POINTS);
  addGeoJsonSource(map, SOURCE_IDS.userAccuracy, EMPTY_POLYGONS);

  map.addLayer({
    id: "mrt-lines-casing",
    type: "line",
    source: SOURCE_IDS.lines,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#ffffff",
      "line-width": ["case", ["get", "future"], 10, 12],
      "line-opacity": 0.98,
    },
  });
  map.addLayer({
    id: "mrt-lines-operational",
    type: "line",
    source: SOURCE_IDS.lines,
    filter: ["==", ["get", "future"], false],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": 8,
      "line-opacity": 1,
    },
  });
  map.addLayer({
    id: "mrt-lines-future",
    type: "line",
    source: SOURCE_IDS.lines,
    filter: ["==", ["get", "future"], true],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": 5,
      "line-opacity": 0.95,
      "line-dasharray": [1.2, 1.4],
    },
  });

  map.addLayer({
    id: "mrt-route-casing",
    type: "line",
    source: SOURCE_IDS.route,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 15, "line-opacity": 1 },
  });
  map.addLayer({
    id: "mrt-route-color",
    type: "line",
    source: SOURCE_IDS.route,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#0B2344", "line-width": 8, "line-opacity": 0.96 },
  });

  map.addLayer({
    id: "mrt-user-accuracy-fill",
    type: "fill",
    source: SOURCE_IDS.userAccuracy,
    paint: { "fill-color": "#2563eb", "fill-opacity": 0.08 },
  });
  map.addLayer({
    id: "mrt-user-accuracy-line",
    type: "line",
    source: SOURCE_IDS.userAccuracy,
    paint: { "line-color": "#2563eb", "line-opacity": 0.28, "line-width": 1.5 },
  });

  map.addLayer({
    id: "mrt-nearest-station-halo",
    type: "circle",
    source: SOURCE_IDS.nearest,
    paint: {
      "circle-radius": 18,
      "circle-color": "#2563eb",
      "circle-opacity": 0.18,
      "circle-stroke-color": "#2563eb",
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.35,
    },
  });
  map.addLayer({
    id: "mrt-selected-station-halo",
    type: "circle",
    source: SOURCE_IDS.selected,
    paint: {
      "circle-radius": 17,
      "circle-color": "#0B2344",
      "circle-opacity": 0.16,
      "circle-stroke-color": "#0B2344",
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.28,
    },
  });

  map.addLayer({
    id: "mrt-station-outer",
    type: "circle",
    source: SOURCE_IDS.stations,
    paint: {
      "circle-radius": [
        "case",
        ["get", "isSelected"],
        12,
        ["get", "isNearest"],
        11.5,
        ["get", "isInterchange"],
        10.5,
        9,
      ],
      "circle-color": "#ffffff",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 3,
      "circle-opacity": 1,
    },
  });
  map.addLayer({
    id: "mrt-station-inner",
    type: "circle",
    source: SOURCE_IDS.stations,
    paint: {
      "circle-radius": [
        "case",
        ["get", "isSelected"],
        9,
        ["get", "isNearest"],
        8.5,
        ["get", "isInterchange"],
        8,
        6.5,
      ],
      "circle-color": ["case", ["get", "inRoute"], "#0B2344", "#ffffff"],
      "circle-stroke-color": ["case", ["get", "isInterchange"], "#111827", ["get", "color"]],
      "circle-stroke-width": ["case", ["get", "isInterchange"], 3, 2.5],
    },
  });
  map.addLayer({
    id: "mrt-station-interchange-ring",
    type: "circle",
    source: SOURCE_IDS.stations,
    filter: ["==", ["get", "isInterchange"], true],
    paint: {
      "circle-radius": 5.7,
      "circle-color": "#ffffff",
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": 2.2,
    },
  });
  map.addLayer({
    id: "mrt-station-codes",
    type: "symbol",
    source: SOURCE_IDS.stations,
    layout: {
      "text-field": ["get", "code"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["case", ["<", ["length", ["get", "code"]], 5], 9, 8],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": ["case", ["get", "inRoute"], "#ffffff", "#0B2344"],
      "text-halo-color": ["case", ["get", "inRoute"], "#0B2344", "#ffffff"],
      "text-halo-width": 0.5,
    },
  });
  LABEL_PLACEMENTS.forEach((placement) => {
    map.addLayer({
      id: `mrt-station-priority-labels-${placement.key}`,
      type: "symbol",
      source: SOURCE_IDS.stations,
      filter: [
        "all",
        [">=", ["get", "labelPriority"], 2],
        ["==", ["get", "labelAnchor"], placement.key],
      ],
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 8.2, 10.5, 9.6, 13, 11.4, 16, 12.8],
        "text-anchor": placement.textAnchor,
        "text-offset": [...placement.offset],
        "text-justify": "auto",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-padding": 2,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2.6,
        "text-halo-blur": 0.6,
      },
    });
  });

  LABEL_PLACEMENTS.forEach((placement) => {
    map.addLayer({
      id: `mrt-station-labels-${placement.key}`,
      type: "symbol",
      source: SOURCE_IDS.stations,
      minzoom: 9.6,
      filter: [
        "all",
        ["==", ["get", "showLabel"], true],
        ["<", ["get", "labelPriority"], 2],
        ["==", ["get", "labelAnchor"], placement.key],
      ],
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 8.2, 10.5, 9.6, 13, 11.4, 16, 12.8],
        "text-anchor": placement.textAnchor,
        "text-offset": [...placement.offset],
        "text-justify": "auto",
        "text-optional": true,
        "text-padding": 2,
      },
      paint: {
        "text-color": "#1f2937",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2.4,
        "text-halo-blur": 0.55,
      },
    });
  });

  LABEL_PLACEMENTS.forEach((placement) => {
    map.addLayer({
      id: `mrt-station-zoom-labels-${placement.key}`,
      type: "symbol",
      source: SOURCE_IDS.stations,
      minzoom: 12.75,
      filter: [
        "all",
        ["<", ["get", "labelPriority"], 2],
        ["==", ["get", "labelAnchor"], placement.key],
      ],
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 8.2, 10.5, 9.6, 13, 11.4, 16, 12.8],
        "text-anchor": placement.textAnchor,
        "text-offset": [...placement.offset],
        "text-justify": "auto",
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-padding": 1,
      },
      paint: {
        "text-color": "#334155",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
        "text-halo-blur": 0.5,
      },
    });
  });
  map.addLayer({
    id: "mrt-station-hit",
    type: "circle",
    source: SOURCE_IDS.stations,
    paint: {
      "circle-radius": 16,
      "circle-color": "#000000",
      "circle-opacity": 0,
    },
  });

  map.addLayer({
    id: "mrt-user-halo",
    type: "circle",
    source: SOURCE_IDS.user,
    paint: { "circle-radius": 20, "circle-color": "#2563eb", "circle-opacity": 0.18 },
  });
  map.addLayer({
    id: "mrt-user-dot",
    type: "circle",
    source: SOURCE_IDS.user,
    paint: {
      "circle-radius": 10,
      "circle-color": "#2563eb",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 4,
    },
  });
}

function stationFromFeature(event: MapLayerMouseEvent) {
  const feature = event.features?.[0];
  const stationId = feature?.properties?.stationId as string | undefined;
  return stationId ? mapStationFor(stationId) : undefined;
}

function formatDistance(meters: number | null) {
  if (meters == null) return "-";
  return `${Math.round(meters).toLocaleString("th-TH")} ม.`;
}

function formatLastUpdated(value: number | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function readCollapsedPreference(key: string) {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(key: string, value: boolean) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage failures so the map overlay still works in private/restricted modes.
  }
}

function describeMapLibreError(error: Error | null) {
  return {
    title: "โหลด MapLibre GL ไม่สำเร็จ",
    message:
      error?.message ?? "ระบบแผนที่ไม่สามารถเริ่ม WebGL ได้ แต่ส่วนอื่นของเว็บยังใช้งานต่อได้",
    tips: [
      "ตรวจว่าเบราว์เซอร์รองรับ WebGL และไม่ได้ปิด hardware acceleration",
      "ลอง refresh หน้าแผนที่อีกครั้ง",
      "ถ้า base map ไม่ขึ้น อาจเป็น tile ของ OpenStreetMap ถูกบล็อกหรืออินเทอร์เน็ตไม่ตอบ",
      "MapLibre GL ไม่ต้องใช้ Google Maps API key หรือ HTTP referrer",
    ],
  };
}

export function InteractiveMrtMap({
  routeStations = [] as string[],
}: {
  routeStations?: string[];
}) {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const trip = useTripStore();
  const live = useSharedLiveLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const baseSourceReadyRef = useRef<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [mapIssue, setMapIssue] = useState<string | null>(null);
  const [zoom, setZoom] = useState(11);
  const [visible, setVisible] = useState<Record<LineId, boolean>>(DEFAULT_VISIBLE);
  const [selected, setSelected] = useState<MrtMapStation | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>("map");
  const [isLinePanelCollapsed, setIsLinePanelCollapsed] = useState(() =>
    readCollapsedPreference(PANEL_STORAGE_KEYS.line),
  );
  const [isRealtimePanelCollapsed, setIsRealtimePanelCollapsed] = useState(() =>
    readCollapsedPreference(PANEL_STORAGE_KEYS.realtime),
  );

  const routeSet = useMemo(() => new Set(routeStations), [routeStations]);
  const nearestStationId = live.nearestStation?.id;
  const selectedLine = selected ? LINES.find((line) => line.id === selected.lineId) : null;
  const liveLat = live.coords?.lat;
  const liveLng = live.coords?.lng;

  const toggle = (id: LineId) => setVisible((current) => ({ ...current, [id]: !current[id] }));

  useEffect(() => {
    writeCollapsedPreference(PANEL_STORAGE_KEYS.line, isLinePanelCollapsed);
  }, [isLinePanelCollapsed]);

  useEffect(() => {
    writeCollapsedPreference(PANEL_STORAGE_KEYS.realtime, isRealtimePanelCollapsed);
  }, [isRealtimePanelCollapsed]);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    validateMapData();

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: BKK_CENTER,
        zoom: 10.6,
        minZoom: 9,
        maxZoom: 16,
        attributionControl: { compact: true },
        pitchWithRotate: false,
        dragRotate: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: false, showCompass: false }),
        "bottom-left",
      );

      const handleClick = (event: MapLayerMouseEvent) => {
        const station = stationFromFeature(event);
        if (station) setSelected(station);
      };
      const setPointer = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const clearPointer = () => {
        map.getCanvas().style.cursor = "";
      };

      map.on("load", () => {
        if (cancelled) return;
        mapRef.current = map;
        if (import.meta.env.DEV) {
          console.log("[MRT map] MapLibre style loaded:", Object.keys(map.getStyle().sources));
        }
        addMrtLayers(map);
        map.on("click", "mrt-station-hit", handleClick);
        map.on("mouseenter", "mrt-station-hit", setPointer);
        map.on("mouseleave", "mrt-station-hit", clearPointer);
        window.requestAnimationFrame(() => {
          map.resize();
          applyBaseMapMode(map, "map");
          fitStationBounds(map, "map", 0);
          setZoom(map.getZoom());
          setReady(true);
        });
      });
      map.on("zoomend", () => setZoom(map.getZoom()));
      map.on("sourcedata", (event) => {
        if (BASE_SOURCE_IDS.has(event.sourceId ?? "") && event.isSourceLoaded) {
          baseSourceReadyRef.current.add(event.sourceId ?? "");
          if (import.meta.env.DEV) {
            console.log("[MRT map] base source loaded:", event.sourceId);
          }
          setMapIssue(null);
        }
      });
      map.on("error", (event) => {
        const sourceId = (event as { sourceId?: string }).sourceId;
        const message = event.error?.message ?? "";
        const isBaseMapError =
          BASE_SOURCE_IDS.has(sourceId ?? "") ||
          /tile|carto|openstreetmap|raster|source/i.test(message);

        if (import.meta.env.DEV) {
          console.error("[MRT map] MapLibre style/tile error:", { sourceId, error: event.error });
        }

        if (isBaseMapError || !map.loaded()) {
          setMapIssue(
            "โหลดพื้นหลังแผนที่ไม่สำเร็จ แต่ยังแสดงเส้น MRT ได้ กรุณาตรวจอินเทอร์เน็ตหรือ tile provider",
          );
        }
      });

      if (typeof ResizeObserver !== "undefined") {
        resizeObserverRef.current = new ResizeObserver(() => map.resize());
        resizeObserverRef.current.observe(containerRef.current);
      } else {
        window.setTimeout(() => map.resize(), 0);
      }

      return () => {
        cancelled = true;
        map.off("click", "mrt-station-hit", handleClick);
        map.off("mouseenter", "mrt-station-hit", setPointer);
        map.off("mouseleave", "mrt-station-hit", clearPointer);
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error("MapLibre initialization failed"));
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    map.resize();
    applyBaseMapMode(map, viewMode);
    fitStationBounds(map, viewMode, 450);
  }, [ready, viewMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const lang = i18n.language;
    const lineData = mrtLineFeatures(visible, viewMode);
    const stationData = stationFeatures(
      visible,
      zoom,
      viewMode,
      routeSet,
      selected?.stationId,
      nearestStationId,
      lang,
    );
    setGeoJsonData(map, SOURCE_IDS.lines, lineData);
    setGeoJsonData(map, SOURCE_IDS.stations, stationData);
    setGeoJsonData(map, SOURCE_IDS.route, routeFeature(routeStations, viewMode));
    setGeoJsonData(
      map,
      SOURCE_IDS.selected,
      singlePointCollection(selected, viewMode, { selected: true }, lang),
    );
    setGeoJsonData(
      map,
      SOURCE_IDS.nearest,
      singlePointCollection(
        nearestStationId
          ? MRT_STATIONS.find((station) => station.stationId === nearestStationId)
          : null,
        viewMode,
        { nearest: true },
        lang,
      ),
    );

    if (import.meta.env.DEV) {
      console.log("[MRT map] rendered lines:", lineData.features.length);
      console.log("[MRT map] rendered stations:", stationData.features.length);
    }
  }, [nearestStationId, ready, routeSet, routeStations, selected, viewMode, visible, zoom, i18n.language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || routeStations.length < 2) return;
    const bounds = new maplibregl.LngLatBounds();
    routeStations
      .map((id) => stationCoordinateFor(id, viewMode))
      .filter((coordinate): coordinate is [number, number] => Boolean(coordinate))
      .forEach((coordinate) => bounds.extend(coordinate));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 88, bottom: 96, left: 170, right: 150 },
        duration: 550,
        maxZoom: viewMode === "diagram" ? 11.8 : 13.5,
      });
    }
  }, [ready, routeStations, viewMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    if (live.status !== "watching") {
      setGeoJsonData(map, SOURCE_IDS.user, EMPTY_POINTS);
      setGeoJsonData(map, SOURCE_IDS.userAccuracy, EMPTY_POLYGONS);
      return;
    }

    const diagramStation = nearestStationId ? mapStationFor(nearestStationId) : null;
    const userCoordinates =
      viewMode === "diagram" && diagramStation
        ? lngLatFor(diagramStation, "diagram")
        : liveLat != null && liveLng != null
          ? ([liveLng, liveLat] as [number, number])
          : null;

    if (!userCoordinates) {
      setGeoJsonData(map, SOURCE_IDS.user, EMPTY_POINTS);
      setGeoJsonData(map, SOURCE_IDS.userAccuracy, EMPTY_POLYGONS);
      return;
    }

    const userPoint: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: userCoordinates },
        },
      ],
    };
    setGeoJsonData(map, SOURCE_IDS.user, userPoint);
    setGeoJsonData(
      map,
      SOURCE_IDS.userAccuracy,
      viewMode === "diagram" || live.accuracy == null || liveLat == null || liveLng == null
        ? EMPTY_POLYGONS
        : circleFeature(liveLng, liveLat, live.accuracy),
    );
  }, [live.accuracy, live.status, liveLat, liveLng, nearestStationId, ready, viewMode]);

  const isEn = i18n.language.startsWith("en");
  const stationDisplayName = (s: { nameTh: string; nameEn: string }) =>
    isEn ? s.nameEn || s.nameTh : s.nameTh || s.nameEn;
  const locationStatus =
    live.status === "watching" && live.nearestStation
      ? live.distanceMeters != null && live.distanceMeters <= 150
        ? isEn
          ? `You are likely at ${stationDisplayName(live.nearestStation)} station`
          : `คุณน่าจะอยู่ที่สถานี ${stationDisplayName(live.nearestStation)}`
        : isEn
          ? `Nearest station is ${stationDisplayName(live.nearestStation)}`
          : `สถานีที่ใกล้ที่สุดคือ ${stationDisplayName(live.nearestStation)}`
      : null;

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] min-h-[520px] w-full overflow-hidden bg-slate-50 lg:h-[calc(100dvh-6rem)]">
      <div ref={containerRef} className="h-full w-full bg-slate-50" />

      {error && (
        <div className="absolute inset-0 z-[800] grid place-items-center bg-background/95 p-4">
          <Card className="max-w-xl border-destructive/30 p-5 text-left shadow-xl">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                !
              </div>
              <div className="min-w-0">
                {(() => {
                  const detail = describeMapLibreError(error);
                  return (
                    <>
                      <h2 className="text-lg font-bold text-destructive">{detail.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{detail.message}</p>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {detail.tips.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </>
                  );
                })()}
              </div>
            </div>
          </Card>
        </div>
      )}

      {mapIssue && (
        <Card className="absolute left-1/2 top-3 z-[420] w-[min(420px,calc(100%-1.5rem))] -translate-x-1/2 border-warning/40 bg-white/95 p-3 text-sm shadow-xl backdrop-blur">
          <p className="font-semibold text-warning">base map โหลดไม่ครบ</p>
          <p className="mt-1 text-muted-foreground">{mapIssue}</p>
        </Card>
      )}

      <div className="pointer-events-none absolute left-0 top-3 z-[400] w-[min(292px,calc(100vw-2rem))] md:left-3">
        <Card
          className={cn(
            "relative border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur transition-[transform,opacity] duration-300 ease-out will-change-transform motion-reduce:transition-none",
            isLinePanelCollapsed
              ? "pointer-events-none -translate-x-[calc(100%+0.75rem)] opacity-0"
              : "pointer-events-auto translate-x-0 opacity-100",
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary">ตัวเลือกแผนที่</p>
              <p className="truncate text-[10px] text-muted-foreground">สายรถไฟและโหมดแผนที่</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-10 shrink-0 rounded-full hover:bg-primary/10 focus-visible:ring-primary/30"
              onClick={() => setIsLinePanelCollapsed(true)}
              aria-label="ซ่อนตัวเลือกสายรถไฟ"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <Button
              size="sm"
              variant={viewMode === "map" ? "default" : "ghost"}
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="size-3.5" />
              แผนที่จริง
            </Button>
            <Button
              size="sm"
              variant={viewMode === "diagram" ? "default" : "ghost"}
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={() => setViewMode("diagram")}
            >
              <Layers className="size-3.5" />
              แผนผัง
            </Button>
          </div>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            {t("map.filters")}
          </p>
          <div className="mt-2 grid gap-1.5">
            {LINES.map((line) => (
              <label
                key={line.id}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  checked={visible[line.id]}
                  onChange={() => toggle(line.id)}
                  className="size-3.5 accent-primary"
                />
                <span
                  className="h-1.5 w-8 rounded-full"
                  style={{ background: colorFor(line.id) }}
                />
                <span className="min-w-0 flex-1 truncate">{isEn ? line.nameEn : line.nameTh}</span>
                {line.status !== "operational" && (
                  <span className="text-[10px] text-warning">{t("map.future")}</span>
                )}
              </label>
            ))}
          </div>
        </Card>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "pointer-events-auto absolute left-0 top-0 h-10 rounded-l-none rounded-r-full border-white/80 bg-white/95 px-3 text-primary shadow-xl backdrop-blur transition-[transform,opacity] duration-300 ease-out hover:bg-white focus-visible:ring-primary/30 motion-reduce:transition-none",
            isLinePanelCollapsed
              ? "translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-full opacity-0",
          )}
          onClick={() => setIsLinePanelCollapsed(false)}
          aria-label="แสดงตัวเลือกสายรถไฟ"
        >
          <Layers className="size-4" />
          <span className="ml-1.5 text-xs font-semibold">สายรถไฟ</span>
        </Button>
      </div>

      {live.status !== "idle" && (
        <div
          className={cn(
            "pointer-events-none absolute right-0 z-[410] w-[min(340px,calc(100vw-2rem))] transition-[top] duration-300 ease-out motion-reduce:transition-none md:right-3 md:top-3",
            isLinePanelCollapsed ? "top-3" : "top-[15.5rem] md:top-3",
          )}
        >
          <Card
            className={cn(
              "relative border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur transition-[transform,opacity] duration-300 ease-out will-change-transform motion-reduce:transition-none",
              isRealtimePanelCollapsed
                ? "pointer-events-none translate-x-[calc(100%+0.75rem)] opacity-0"
                : "pointer-events-auto translate-x-0 opacity-100",
            )}
          >
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 z-10 size-10 rounded-full hover:bg-primary/10 focus-visible:ring-primary/30"
              onClick={() => setIsRealtimePanelCollapsed(true)}
              aria-label="ซ่อนตำแหน่ง Real-time"
            >
              <ChevronRight className="size-4" />
            </Button>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <LocateFixed
                  className={`size-5 ${live.status === "watching" ? "animate-pulse" : ""}`}
                />
              </div>
              <div className="min-w-0 flex-1 pr-10">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  ตำแหน่ง Real-time
                </p>
                {locationStatus ? (
                  <>
                    <p className="mt-0.5 font-semibold leading-snug">{locationStatus}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ตอนนี้คุณอยู่ใกล้สถานี: {live.nearestStation?.nameTh}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ระยะห่างประมาณ: {formatDistance(live.distanceMeters)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      อัปเดตล่าสุด: {formatLastUpdated(live.updatedAt, i18n.language)}
                    </p>
                  </>
                ) : live.status === "denied" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาต Location ในเบราว์เซอร์
                  </p>
                ) : live.status === "unsupported" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง
                  </p>
                ) : live.status === "requesting" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    กำลังขอสิทธิ์ตำแหน่งจากเบราว์เซอร์...
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {live.error ?? "กำลังอ่านตำแหน่งของคุณ"}
                  </p>
                )}
                {live.status === "watching" && (
                  <Button size="sm" variant="outline" className="mt-2 h-8" onClick={live.stop}>
                    หยุดติดตามตำแหน่ง
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "pointer-events-auto absolute right-0 top-0 h-10 rounded-l-full rounded-r-none border-white/80 bg-white/95 px-3 text-primary shadow-xl backdrop-blur transition-[transform,opacity] duration-300 ease-out hover:bg-white focus-visible:ring-primary/30 motion-reduce:transition-none",
              isRealtimePanelCollapsed
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-full opacity-0",
            )}
            onClick={() => setIsRealtimePanelCollapsed(false)}
            aria-label="แสดงตำแหน่ง Real-time"
          >
            <LocateFixed className="size-4" />
            <span className="ml-1.5 text-xs font-semibold">ตำแหน่ง</span>
          </Button>
        </div>
      )}

      <Card className="absolute bottom-3 right-3 z-[390] hidden w-72 border-white/90 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur md:block">
        <div className="mb-2 flex items-center gap-2">
          <Navigation className="size-4 text-primary" />
          <div>
            <p className="text-sm font-bold">สัญลักษณ์ Legend</p>
            <p className="text-[10px] text-muted-foreground">MapLibre schematic overlay</p>
          </div>
        </div>
        <div className="grid gap-2 text-xs">
          {LINES.map((line) => (
            <div key={line.id} className="flex items-center gap-2">
              <span className="relative h-4 w-12">
                <span
                  className="absolute left-0 top-1/2 h-2 w-12 -translate-y-1/2 rounded-full"
                  style={{ background: colorFor(line.id) }}
                />
                <span
                  className="absolute left-1/2 top-1/2 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 bg-white text-[6px] font-bold"
                  style={{ borderColor: colorFor(line.id), color: "#0B2344" }}
                >
                  {line.code.replace("MRT-", "")}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate">{isEn ? line.nameEn : line.nameTh}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center gap-2 border-t pt-2">
            <span className="grid size-5 place-items-center rounded-full border-2 border-slate-900 bg-white text-[8px] font-bold">
              INT
            </span>
            <span>สถานีเชื่อมต่อ</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-blue-600" />
            <span>ตำแหน่งผู้ใช้แบบ Real-time</span>
          </div>
        </div>
      </Card>

      {selected && (
        <Card className="absolute inset-x-3 bottom-3 z-[500] border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur lg:left-3 lg:right-auto lg:w-[22rem]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-2 w-9 rounded-full"
                  style={{ background: selectedLine?.color ?? colorFor(selected.lineId) }}
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {selected.code}
                </p>
              </div>
              <p className="truncate text-lg font-bold">{isEn ? selected.nameEn : selected.nameTh}</p>
              <p className="truncate text-xs text-muted-foreground">{isEn ? selected.nameTh : selected.nameEn}</p>
              {selected.isInterchange && (
                <p className="mt-1 text-xs font-medium text-primary">
                  สถานีเชื่อมต่อ / Interchange
                </p>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelected(null)}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                trip.setOrigin(selected.id);
                setSelected(null);
              }}
            >
              {t("map.setOrigin")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                trip.setDestination(selected.id);
                setSelected(null);
                nav({ to: "/plan" });
              }}
            >
              {t("map.setDestination")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
