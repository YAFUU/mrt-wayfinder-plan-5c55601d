import { createFileRoute } from "@tanstack/react-router";
import { APIProvider, Map, Marker, Polyline, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ClientOnly } from "@/components/ClientOnly";
import { InteractiveMrtMap } from "@/components/InteractiveMrtMap";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LINES, STATIONS } from "@/data/network";
import {
  MRT_MAP_LINE_SEQUENCES,
  type SupportedMapLineId,
  isSupportedMapLineId,
  pathForLine,
  pathForRouteStationIds,
  stationCoordinatesById,
  stationPointById,
} from "@/data/mrt-station-coordinates";
import { stationLabel } from "@/lib/display";
import { type RouteResult, planRoute } from "@/services/routeService";
import { useTripStore } from "@/stores/tripStore";
import type { LineId, MrtStation } from "@/types/mrt";

export const Route = createFileRoute("/map")({ component: MapPage });

const supportedLineIds = ["blue", "purple", "yellow", "pink"] as const satisfies readonly SupportedMapLineId[];
const defaultCenter = { lat: 13.795, lng: 100.575 };

function MapPage() {
  const { t } = useTranslation();
  const { originId, destinationId, preference } = useTripStore();
  const routeResult = useMemo(() => {
    if (!originId || !destinationId) return null;
    return planRoute(originId, destinationId, preference);
  }, [originId, destinationId, preference]);
  const stations = useMemo(
    () =>
      routeResult
        ? routeResult.segments
            .flatMap((s) => s.stations)
            .filter((id, i, arr) => arr.indexOf(id) === i)
        : [],
    [routeResult],
  );

  return (
    <div>
      <div className="px-4 pt-4 lg:px-8 lg:pt-6">
        <PageHeader title={t("map.title")} />
      </div>
      <ClientOnly fallback={<div className="p-8 text-muted-foreground">{t("common.loading")}</div>}>
        <GoogleMapOrFallback routeStations={stations} routeResult={routeResult} />
      </ClientOnly>
    </div>
  );
}

function GoogleMapOrFallback({
  routeStations,
  routeResult,
}: {
  routeStations: string[];
  routeResult: RouteResult | null;
}) {
  const { t, i18n } = useTranslation();
  const [loadError, setLoadError] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapId = import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined;

  useEffect(() => {
    if (!apiKey || forceFallback) return undefined;
    const win = window as Window & { gm_authFailure?: () => void };
    const previousAuthFailure = win.gm_authFailure;
    win.gm_authFailure = () => {
      previousAuthFailure?.();
      setLoadError(true);
    };
    const errorWatcher = window.setInterval(() => {
      const text = document.body.innerText || "";
      if (document.querySelector(".gm-err-container") || text.includes("Oops! Something went wrong")) {
        setLoadError(true);
      }
    }, 1000);
    const loadTimeout = window.setTimeout(() => {
      if (!document.querySelector(".gm-style")) setLoadError(true);
    }, 9000);
    return () => {
      window.clearInterval(errorWatcher);
      window.clearTimeout(loadTimeout);
      win.gm_authFailure = previousAuthFailure;
    };
  }, [apiKey, forceFallback]);

  if (!apiKey || forceFallback || loadError) {
    return (
      <div>
        {loadError && (
          <Card className="mx-4 mb-3 flex items-center justify-between gap-3 border-warning/50 bg-warning/10 p-3 text-sm lg:mx-8">
            <div>
              <p className="font-semibold">Google Maps โหลดไม่ได้</p>
              <p className="text-xs text-muted-foreground">กำลังใช้ Local Demo Map แทน</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setLoadError(false)}>
              {t("common.retry")}
            </Button>
          </Card>
        )}
        {!apiKey && (
          <Card className="mx-4 mb-3 border-warning/50 bg-warning/10 p-3 text-sm lg:mx-8">
            Google Maps ยังไม่ได้ตั้งค่า กำลังใช้ Local Demo Map แทน
          </Card>
        )}
        <InteractiveMrtMap routeStations={routeStations} />
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      language={i18n.language.startsWith("th") ? "th" : "en"}
      region="TH"
      disableUsageAttribution
      onError={() => setLoadError(true)}
    >
      <GoogleMapContent
        routeStations={routeStations}
        routeResult={routeResult}
        mapId={mapId?.trim() || undefined}
        onUseFallback={() => setForceFallback(true)}
      />
    </APIProvider>
  );
}

function GoogleMapContent({
  routeStations,
  routeResult,
  mapId,
  onUseFallback,
}: {
  routeStations: string[];
  routeResult: RouteResult | null;
  mapId?: string;
  onUseFallback: () => void;
}) {
  const { t, i18n } = useTranslation();
  const map = useMap();
  const { originId, destinationId, setOrigin, setDestination, reset } = useTripStore();
  const [selected, setSelected] = useState<MrtStation | null>(null);
  const [visibleLines, setVisibleLines] = useState<Record<SupportedMapLineId, boolean>>({
    blue: true,
    purple: true,
    yellow: true,
    pink: true,
  });

  const origin = originId ? STATIONS.find((station) => station.id === originId) : null;
  const destination = destinationId ? STATIONS.find((station) => station.id === destinationId) : null;
  const routeSet = useMemo(() => new Set(routeStations), [routeStations]);
  const routeLineIds = useMemo(() => {
    const ids = new Set<SupportedMapLineId>();
    for (const stationId of routeStations) {
      const station = STATIONS.find((item) => item.id === stationId);
      if (station && isSupportedMapLineId(station.lineId)) ids.add(station.lineId);
    }
    return ids;
  }, [routeStations]);

  const fitAll = () => map?.fitBounds(boundsForPoints(Object.keys(stationCoordinatesById).map(stationPointById)), 72);
  const fitRoute = () => {
    if (!routeStations.length) return;
    map?.fitBounds(boundsForPoints(routeStations.map(stationPointById)), 88);
  };
  const toggleLine = (lineId: SupportedMapLineId) =>
    setVisibleLines((current) => ({ ...current, [lineId]: !current[lineId] }));

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] w-full overflow-hidden bg-[#eef3f8] lg:h-[calc(100dvh-6rem)]">
      <div className="absolute inset-0">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={10}
          defaultBounds={{ ...boundsForPoints(Object.keys(stationCoordinatesById).map(stationPointById)), padding: 72 }}
          mapId={mapId}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          reuseMaps
          style={{ width: "100%", height: "100%" }}
        >
          {supportedLineIds.map((lineId) => {
            const line = LINES.find((item) => item.id === lineId);
            if (!line || !visibleLines[lineId]) return null;
            const routeActive = routeLineIds.size > 0;
            const inRoute = routeLineIds.has(lineId);
            return (
              <Polyline
                key={lineId}
                path={pathForLine(lineId)}
                strokeColor={line.color}
                strokeOpacity={routeActive && !inRoute ? 0.34 : 0.9}
                strokeWeight={7}
                geodesic={false}
                zIndex={routeActive && inRoute ? 20 : 10}
              />
            );
          })}
          {routeResult?.segments.map((segment, index) => {
            if (!isSupportedMapLineId(segment.lineId)) return null;
            const line = LINES.find((item) => item.id === segment.lineId);
            const path = pathForRouteStationIds(segment.stations, segment.lineId);
            if (!line || path.length < 2) return null;
            return (
              <Polyline
                key={`${segment.fromStationId}-${segment.toStationId}-${index}`}
                path={path}
                strokeColor={line.color}
                strokeOpacity={1}
                strokeWeight={13}
                geodesic={false}
                zIndex={90 + index}
              />
            );
          })}
          {STATIONS.map((station) => {
            if (!isSupportedMapLineId(station.lineId)) return null;
            if (!visibleLines[station.lineId] && !routeSet.has(station.id)) return null;
            const point = stationPointById(station.id);
            const line = LINES.find((item) => item.id === station.lineId);
            if (!point || !line) return null;
            return (
              <Marker
                key={station.id}
                position={point}
                title={`${station.code} ${stationLabel(station, i18n.language)}`}
                clickable
                opacity={routeSet.size > 0 && !routeSet.has(station.id) ? 0.55 : 1}
                label={{ text: station.code, color: "#0A2B57", fontSize: "10px", fontWeight: "700" }}
                icon={markerIcon(line.color, originId === station.id, destinationId === station.id)}
                onClick={() => setSelected(station)}
              />
            );
          })}
        </Map>
      </div>

      <Card className="absolute left-3 top-3 z-[420] w-[340px] max-w-[calc(100vw-1.5rem)] p-3 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {origin ? "เลือกปลายทาง" : "เลือกต้นทาง"}
        </p>
        <p className="mt-1 text-sm font-semibold">
          {origin ? `คุณอยู่ที่นี่: ${origin.code} ${stationLabel(origin, i18n.language)}` : "กดสถานีบนแผนที่เพื่อเลือกต้นทาง"}
        </p>
        {destination && <p className="mt-1 text-xs text-muted-foreground">ปลายทาง: {destination.code} {stationLabel(destination, i18n.language)}</p>}
        <p className="mt-2 text-[11px] text-muted-foreground">Google Maps ใช้เป็นแผนที่พื้นหลังเท่านั้น การคำนวณเส้นทางยังใช้ MRT QuickPass</p>
      </Card>

      <Card className="absolute bottom-3 left-3 z-[420] w-[310px] max-w-[calc(100vw-1.5rem)] p-3 shadow-xl">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("map.filters")}</p>
        <div className="grid gap-2">
          {supportedLineIds.map((lineId) => {
            const line = LINES.find((item) => item.id === lineId);
            if (!line) return null;
            return (
              <label key={lineId} className="flex min-h-8 items-center gap-2 text-xs">
                <input type="checkbox" checked={visibleLines[lineId]} onChange={() => toggleLine(lineId)} className="size-4 accent-primary" />
                <span className="h-1.5 w-7 rounded-full" style={{ background: line.color }} />
                <span className="truncate">{line.nameTh}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={fitAll}>ดูทุกสาย</Button>
          <Button size="sm" variant="outline" onClick={fitRoute} disabled={!routeResult}>ดูเส้นทาง</Button>
          <Button size="sm" variant="outline" onClick={reset}>ล้างเส้นทาง</Button>
          <Button size="sm" variant="outline" onClick={onUseFallback}>Local Map</Button>
        </div>
      </Card>

      {selected && (
        <Card className="absolute bottom-3 right-3 z-[430] w-[360px] max-w-[calc(100vw-1.5rem)] p-4 shadow-xl">
          <p className="text-xs text-muted-foreground">{selected.code}</p>
          <p className="text-lg font-bold">{stationLabel(selected, i18n.language)}</p>
          <p className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">ข้อมูลสถานีสาธิต ใช้สำหรับเลือกต้นทาง/ปลายทางและดูเส้นทางใน Prototype</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => setOrigin(selected.id)}>{t("map.setOrigin")}</Button>
            <Button size="sm" onClick={() => setDestination(selected.id)}>{t("map.setDestination")}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function markerIcon(color: string, origin: boolean, destination: boolean) {
  const border = origin ? "#0A2B57" : destination ? "#DC2626" : color;
  const size = origin || destination ? 30 : 18;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="white" stroke="${border}" stroke-width="4"/>${origin || destination ? `<circle cx="${size / 2}" cy="${size / 2}" r="5" fill="${border}"/>` : ""}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function boundsForPoints(points: Array<{ lat: number; lng: number } | null>) {
  const valid = points.filter((point): point is { lat: number; lng: number } => Boolean(point));
  if (!valid.length) return { north: defaultCenter.lat, south: defaultCenter.lat, east: defaultCenter.lng, west: defaultCenter.lng };
  return valid.reduce(
    (bounds, point) => ({
      north: Math.max(bounds.north, point.lat),
      south: Math.min(bounds.south, point.lat),
      east: Math.max(bounds.east, point.lng),
      west: Math.min(bounds.west, point.lng),
    }),
    { north: -Infinity, south: Infinity, east: -Infinity, west: Infinity },
  );
}
