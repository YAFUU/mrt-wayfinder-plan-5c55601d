import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ClientOnly } from "@/components/ClientOnly";
import { InteractiveMrtMap } from "@/components/InteractiveMrtMap";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MRT_LINE_GEOMETRY_IS_VERIFIED,
  MRT_LINE_GEOMETRY_SOURCE,
  geometryPathForLine,
  geometryPathForRouteStationIds,
  validateMrtLineGeometry,
} from "@/data/mrt-line-geometry";
import { LINES, STATIONS } from "@/data/network";
import {
  type SupportedMapLineId,
  isSupportedMapLineId,
  stationCoordinatesById,
  stationPointById,
} from "@/data/mrt-station-coordinates";
import { type RouteResult, planRoute } from "@/services/routeService";
import { useTripStore } from "@/stores/tripStore";
import type { MrtStation } from "@/types/mrt";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export const Route = createFileRoute("/map")({ component: MapPage });

const supportedLineIds = [
  "blue",
  "purple",
  "yellow",
  "pink",
] as const satisfies readonly SupportedMapLineId[];
const defaultCenter = { lat: 13.795, lng: 100.575 };
let googleMapsPromise: Promise<void> | null = null;

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
    if (!import.meta.env.DEV) return;
    const warnings = validateMrtLineGeometry();
    console.info("MRT /map geometry source", {
      source: MRT_LINE_GEOMETRY_SOURCE,
      verified: MRT_LINE_GEOMETRY_IS_VERIFIED,
      mainLineOverlayDefault: MRT_LINE_GEOMETRY_IS_VERIFIED ? "visible" : "hidden",
    });
    if (warnings.length) console.warn("MRT map geometry warnings", warnings);
  }, []);

  if (!apiKey || forceFallback || loadError) {
    return (
      <div>
        {(loadError || !apiKey) && (
          <Card className="mx-4 mb-3 flex items-center justify-between gap-3 border-warning/50 bg-warning/10 p-3 text-sm lg:mx-8">
            <div>
              <p className="font-semibold">Google Maps โหลดไม่ได้</p>
              <p className="text-xs text-muted-foreground">กำลังใช้ Local Demo Map แทน</p>
            </div>
            {loadError && (
              <Button size="sm" variant="outline" onClick={() => setLoadError(false)}>
                {t("common.retry")}
              </Button>
            )}
          </Card>
        )}
        <InteractiveMrtMap routeStations={routeStations} />
      </div>
    );
  }

  return (
    <GoogleMapContent
      routeStations={routeStations}
      routeResult={routeResult}
      apiKey={apiKey}
      mapId={mapId?.trim() || undefined}
      language={i18n.language.startsWith("th") ? "th" : "en"}
      onLoadError={() => setLoadError(true)}
      onUseFallback={() => setForceFallback(true)}
    />
  );
}

function GoogleMapContent({
  routeStations,
  routeResult,
  apiKey,
  mapId,
  language,
  onLoadError,
  onUseFallback,
}: {
  routeStations: string[];
  routeResult: RouteResult | null;
  apiKey: string;
  mapId?: string;
  language: string;
  onLoadError: () => void;
  onUseFallback: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { originId, destinationId, setOrigin, setDestination, reset } = useTripStore();
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<{
    markers: google.maps.Marker[];
    polylines: google.maps.Polyline[];
    infoWindows: google.maps.InfoWindow[];
  }>({ markers: [], polylines: [], infoWindows: [] });
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<MrtStation | null>(null);
  const [calibrationEnabled] = useState(
    () => import.meta.env.DEV || isCalibrationRequestedFromUrl(),
  );
  const [calibrationStationId, setCalibrationStationId] = useState("BL19");
  const [calibrationPoint, setCalibrationPoint] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [copiedCalibration, setCopiedCalibration] = useState<string | null>(null);
  const [visibleLines, setVisibleLines] = useState<Record<SupportedMapLineId, boolean>>({
    blue: true,
    purple: true,
    yellow: true,
    pink: true,
  });
  const [showSimulatedLines, setShowSimulatedLines] = useState(MRT_LINE_GEOMETRY_IS_VERIFIED);

  const origin = originId ? STATIONS.find((station) => station.id === originId) : null;
  const destination = destinationId
    ? STATIONS.find((station) => station.id === destinationId)
    : null;
  const routeSet = useMemo(() => new Set(routeStations), [routeStations]);
  const routeLineIds = useMemo(() => {
    const ids = new Set<SupportedMapLineId>();
    for (const stationId of routeStations) {
      const station = STATIONS.find((item) => item.id === stationId);
      if (station && isSupportedMapLineId(station.lineId)) ids.add(station.lineId);
    }
    return ids;
  }, [routeStations]);
  const selectedCoordinate = selected ? stationCoordinatesById[selected.id] : null;
  const isThaiLanguage = i18n.language.startsWith("th");
  const calibrationStation = useMemo(
    () => STATIONS.find((station) => station.id === calibrationStationId) ?? STATIONS[0],
    [calibrationStationId],
  );
  const calibrationCoordinateText = calibrationPoint
    ? `${calibrationPoint.lat.toFixed(6)}, ${calibrationPoint.lng.toFixed(6)}`
    : "";
  const calibrationTsObject =
    calibrationPoint && calibrationStation
      ? formatCalibrationTsObject(calibrationStation, calibrationPoint)
      : "";
  const calibrationJsonPatch =
    calibrationPoint && calibrationStation
      ? formatCalibrationJsonPatch(calibrationStation, calibrationPoint)
      : "";

  const fitPoints = (points: Array<{ lat: number; lng: number } | null>) => {
    if (!mapRef.current || typeof google === "undefined" || !google.maps) return;
    const valid = points.filter((point): point is { lat: number; lng: number } => Boolean(point));
    if (!valid.length) return;
    const bounds = new google.maps.LatLngBounds();
    valid.forEach((point) => bounds.extend(point));
    mapRef.current.fitBounds(bounds, 72);
  };

  useEffect(() => {
    let cancelled = false;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      onLoadError();
    };

    loadGoogleMaps(apiKey, language)
      .then(() => {
        if (cancelled || !mapNode.current) return;
        const googleApi = google;
        mapRef.current = new googleApi.maps.Map(mapNode.current, {
          center: defaultCenter,
          zoom: 11,
          mapId,
          gestureHandling: "greedy",
          clickableIcons: false,
          disableDefaultUI: true,
        });
        fitPoints(Object.keys(stationCoordinatesById).map(stationPointById));
        setReady(true);
      })
      .catch(() => onLoadError());

    return () => {
      cancelled = true;
      window.gm_authFailure = previousAuthFailure;
      clearOverlays(overlaysRef.current);
    };
  }, [apiKey, language, mapId, onLoadError]);

  useEffect(() => {
    if (!ready || !mapRef.current || !calibrationEnabled) return;
    const listener = mapRef.current.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      setCalibrationPoint({
        lat: Number(event.latLng.lat().toFixed(6)),
        lng: Number(event.latLng.lng().toFixed(6)),
      });
      setCopiedCalibration(null);
    });
    return () => listener.remove();
  }, [ready, calibrationEnabled]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const googleApi = google;
    const map = mapRef.current;
    clearOverlays(overlaysRef.current);
    const markers: google.maps.Marker[] = [];
    const polylines: google.maps.Polyline[] = [];
    const infoWindows: google.maps.InfoWindow[] = [];

    if (showSimulatedLines || MRT_LINE_GEOMETRY_IS_VERIFIED) {
      for (const lineId of supportedLineIds) {
        const line = LINES.find((item) => item.id === lineId);
        if (!line || !visibleLines[lineId]) continue;
        const routeActive = routeLineIds.size > 0;
        const inRoute = routeLineIds.has(lineId);
        polylines.push(
          new googleApi.maps.Polyline({
            map,
            path: geometryPathForLine(lineId),
            strokeColor: line.color,
            strokeOpacity: MRT_LINE_GEOMETRY_IS_VERIFIED
              ? routeActive && !inRoute
                ? 0.28
                : 0.72
              : 0,
            strokeWeight: MRT_LINE_GEOMETRY_IS_VERIFIED ? 5 : 2,
            icons: MRT_LINE_GEOMETRY_IS_VERIFIED
              ? undefined
              : prototypeLineIcons(googleApi, line.color, 0.32, 2),
            zIndex: routeActive && inRoute ? 20 : 10,
            geodesic: false,
          }),
        );
      }
    }

    if (showSimulatedLines || MRT_LINE_GEOMETRY_IS_VERIFIED) {
      routeResult?.segments.forEach((segment, index) => {
        if (!isSupportedMapLineId(segment.lineId)) return;
        const line = LINES.find((item) => item.id === segment.lineId);
        const path = geometryPathForRouteStationIds(segment.stations, segment.lineId);
        if (!line || path.length < 2) return;
        polylines.push(
          new googleApi.maps.Polyline({
            map,
            path,
            strokeColor: line.color,
            strokeOpacity: MRT_LINE_GEOMETRY_IS_VERIFIED ? 0.95 : 0,
            strokeWeight: MRT_LINE_GEOMETRY_IS_VERIFIED ? 10 : 3,
            icons: MRT_LINE_GEOMETRY_IS_VERIFIED
              ? undefined
              : prototypeLineIcons(googleApi, line.color, 0.72, 3),
            zIndex: 90 + index,
            geodesic: false,
          }),
        );
      });
    }

    for (const station of STATIONS) {
      if (!isSupportedMapLineId(station.lineId)) continue;
      if (!visibleLines[station.lineId] && !routeSet.has(station.id)) continue;
      const point = stationPointById(station.id);
      const line = LINES.find((item) => item.id === station.lineId);
      if (!point || !line) continue;
      const marker = new googleApi.maps.Marker({
        map,
        position: point,
        title: `${station.code} ${stationLabel(station, i18n.language)}`,
        opacity: routeSet.size > 0 && !routeSet.has(station.id) ? 0.55 : 1,
        label: { text: station.code, color: "#0A2B57", fontSize: "10px", fontWeight: "700" },
        icon: markerIcon(line.color, originId === station.id, destinationId === station.id),
        zIndex:
          routeSet.has(station.id) || originId === station.id || destinationId === station.id
            ? 80
            : 40,
      });
      marker.addListener("click", () => setSelected(station));
      markers.push(marker);
    }

    if (origin) {
      const point = stationPointById(origin.id);
      if (point) {
        const info = new googleApi.maps.InfoWindow({
          content: `<div style="font-family:system-ui,sans-serif;font-weight:700;color:#0A2B57">คุณอยู่ที่นี่<br><span style="font-weight:600">${origin.code} ${escapeHtml(stationLabel(origin, i18n.language))}</span></div>`,
          position: point,
          pixelOffset: new googleApi.maps.Size(0, -18),
        });
        info.open({ map });
        infoWindows.push(info);
      }
    }

    if (calibrationEnabled && calibrationPoint) {
      markers.push(
        new googleApi.maps.Marker({
          map,
          position: calibrationPoint,
          title: "Calibration click point",
          label: { text: "CAL", color: "#DC2626", fontSize: "10px", fontWeight: "800" },
          icon: markerIcon("#DC2626", false, true),
          zIndex: 120,
        }),
      );
    }

    overlaysRef.current = { markers, polylines, infoWindows };
  }, [
    ready,
    visibleLines,
    routeLineIds,
    routeResult,
    routeSet,
    showSimulatedLines,
    originId,
    destinationId,
    origin,
    calibrationEnabled,
    calibrationPoint,
    i18n.language,
  ]);

  const toggleLine = (lineId: SupportedMapLineId) =>
    setVisibleLines((current) => ({ ...current, [lineId]: !current[lineId] }));

  const copyCalibrationText = async (label: string, value: string) => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopiedCalibration(label);
  };

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] w-full overflow-hidden bg-[#eef3f8] lg:h-[calc(100dvh-6rem)]">
      <div ref={mapNode} className="absolute inset-0" />

      <Card className="absolute left-3 top-3 z-[420] w-[340px] max-w-[calc(100vw-1.5rem)] p-3 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {origin ? "เลือกปลายทาง" : "เลือกต้นทาง"}
        </p>
        <p className="mt-1 text-sm font-semibold">
          {origin
            ? `คุณอยู่ที่นี่: ${origin.code} ${stationLabel(origin, i18n.language)}`
            : "กดสถานีบนแผนที่เพื่อเลือกต้นทาง"}
        </p>
        {destination && (
          <p className="mt-1 text-xs text-muted-foreground">
            ปลายทาง: {destination.code} {stationLabel(destination, i18n.language)}
          </p>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Google Maps ใช้เป็นแผนที่พื้นหลังเท่านั้น การคำนวณเส้นทางยังใช้ MRT QuickPass
        </p>
      </Card>

      {!MRT_LINE_GEOMETRY_IS_VERIFIED && showSimulatedLines && (
        <Card className="absolute left-3 top-[8.5rem] z-[420] w-[340px] max-w-[calc(100vw-1.5rem)] border-warning/50 bg-warning/10 p-3 text-xs shadow-xl">
          <p className="font-semibold">
            {isThaiLanguage
              ? "เส้นสีเป็นข้อมูลจำลองสำหรับ Prototype ไม่ใช่แนวรางจริง"
              : "Prototype line overlay only, not exact rail alignment."}
          </p>
          <p className="mt-1 text-muted-foreground">
            {isThaiLanguage
              ? "ใช้ Google Maps เป็นบริบทหลัก และใช้ marker สถานีเป็นตำแหน่งที่เชื่อถือได้"
              : "Google Maps remains the accurate base map. Station markers are the trusted layer."}
          </p>
        </Card>
      )}

      <Card className="absolute bottom-3 left-3 z-[420] w-[310px] max-w-[calc(100vw-1.5rem)] p-3 shadow-xl">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("map.filters")}
        </p>
        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
          {isThaiLanguage ? "Google Maps Accurate Marker Mode" : "Google Maps Accurate Marker Mode"}
        </p>
        <div className="grid gap-2">
          {!MRT_LINE_GEOMETRY_IS_VERIFIED && (
            <label className="mb-1 flex min-h-8 items-center gap-2 rounded-md bg-muted px-2 text-xs">
              <input
                type="checkbox"
                checked={showSimulatedLines}
                onChange={() => setShowSimulatedLines((current) => !current)}
                className="size-4 accent-primary"
              />
              <span className="font-medium">
                {isThaiLanguage ? "แสดงเส้นจำลอง" : "Show prototype lines"}
              </span>
            </label>
          )}
          {supportedLineIds.map((lineId) => {
            const line = LINES.find((item) => item.id === lineId);
            if (!line) return null;
            return (
              <label key={lineId} className="flex min-h-8 items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={visibleLines[lineId]}
                  onChange={() => toggleLine(lineId)}
                  className="size-4 accent-primary"
                />
                <span className="h-1.5 w-7 rounded-full" style={{ background: line.color }} />
                <span className="truncate">{line.nameTh}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fitPoints(Object.keys(stationCoordinatesById).map(stationPointById))}
          >
            ดูทุกสาย
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fitPoints(routeStations.map(stationPointById))}
            disabled={!routeResult}
          >
            ดูเส้นทาง
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            ล้างเส้นทาง
          </Button>
          <Button size="sm" variant="outline" onClick={onUseFallback}>
            Local Map
          </Button>
        </div>
      </Card>

      {calibrationEnabled && (
        <Card className="absolute right-3 top-3 z-[440] w-[380px] max-w-[calc(100vw-1.5rem)] border-primary/40 p-4 shadow-xl">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Map Coordinate Calibration
          </p>
          <p className="mt-1 text-sm font-semibold">Click Google Maps to capture lat/lng</p>
          <label className="mt-3 block text-xs font-semibold text-muted-foreground">
            Station ID
            <select
              value={calibrationStationId}
              onChange={(event) => {
                setCalibrationStationId(event.target.value);
                setCopiedCalibration(null);
              }}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"
            >
              {STATIONS.filter((station) => isSupportedMapLineId(station.lineId)).map((station) => (
                <option key={station.id} value={station.id}>
                  {station.code} {station.nameEn}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 rounded-lg bg-muted p-3 text-xs">
            <p className="font-semibold">
              {calibrationStation?.code} {calibrationStation?.nameEn}
            </p>
            <p className="mt-1 text-muted-foreground">
              {calibrationPoint
                ? `lat ${calibrationPoint.lat.toFixed(6)}, lng ${calibrationPoint.lng.toFixed(6)}`
                : "No point selected yet"}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!calibrationCoordinateText}
              onClick={() => copyCalibrationText("coordinate", calibrationCoordinateText)}
            >
              Copy coordinate
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!calibrationTsObject}
              onClick={() => copyCalibrationText("TS object", calibrationTsObject)}
            >
              Copy TS object
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!calibrationJsonPatch}
              onClick={() => copyCalibrationText("JSON patch", calibrationJsonPatch)}
            >
              Copy JSON patch
            </Button>
          </div>
          {copiedCalibration && (
            <p className="mt-2 text-xs font-medium text-primary">Copied {copiedCalibration}</p>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Output uses stationId as the key and marks the coordinate as Google Maps manual
            calibration.
          </p>
        </Card>
      )}

      {selected && (
        <Card className="absolute bottom-3 right-3 z-[430] w-[360px] max-w-[calc(100vw-1.5rem)] p-4 shadow-xl">
          <p className="text-xs text-muted-foreground">{selected.code}</p>
          <p className="text-lg font-bold">{stationLabel(selected, i18n.language)}</p>
          <p className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            ข้อมูลสถานีสาธิต ใช้สำหรับเลือกต้นทาง/ปลายทางและดูเส้นทางใน Prototype
          </p>
          {selectedCoordinate && (
            <div className="mt-2 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
              <p>
                {isThaiLanguage ? "ความมั่นใจพิกัด" : "Coordinate confidence"}:{" "}
                <span className="font-semibold text-foreground">
                  {selectedCoordinate.coordinateConfidence}
                </span>
              </p>
              <p className="mt-1">{selectedCoordinate.coordinateSource}</p>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => setOrigin(selected.id)}>
              {t("map.setOrigin")}
            </Button>
            <Button size="sm" onClick={() => setDestination(selected.id)}>
              {t("map.setDestination")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function stationLabel(station: MrtStation, language: string) {
  return language.startsWith("th") ? station.nameTh : station.nameEn;
}

function isCalibrationRequestedFromUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("calibrate") === "1";
}

function formatCalibrationTsObject(station: MrtStation, point: { lat: number; lng: number }) {
  return `${station.id}: {
  id: "${station.id}",
  nameTh: "${station.nameTh}",
  nameEn: "${station.nameEn}",
  latitude: ${point.lat.toFixed(6)},
  longitude: ${point.lng.toFixed(6)},
  coordinateConfidence: "verified",
  coordinateSource: "Google Maps manual calibration"
}`;
}

function formatCalibrationJsonPatch(station: MrtStation, point: { lat: number; lng: number }) {
  return JSON.stringify(
    {
      [station.id]: {
        id: station.id,
        nameTh: station.nameTh,
        nameEn: station.nameEn,
        latitude: Number(point.lat.toFixed(6)),
        longitude: Number(point.lng.toFixed(6)),
        coordinateConfidence: "verified",
        coordinateSource: "Google Maps manual calibration",
      },
    },
    null,
    2,
  );
}

function loadGoogleMaps(apiKey: string, language: string) {
  if (typeof google !== "undefined" && google.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const callback = `__mrtGoogleMapsReady_${Date.now()}`;
    (window as unknown as Record<string, () => void>)[callback] = () => {
      delete (window as unknown as Record<string, unknown>)[callback];
      resolve();
    };
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.mrtGoogleMaps = "true";
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&region=TH&language=${language}&callback=${callback}`;
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function clearOverlays(overlays: {
  markers: google.maps.Marker[];
  polylines: google.maps.Polyline[];
  infoWindows: google.maps.InfoWindow[];
}) {
  overlays.markers.forEach((marker) => marker.setMap(null));
  overlays.polylines.forEach((polyline) => polyline.setMap(null));
  overlays.infoWindows.forEach((infoWindow) => infoWindow.close());
}

function markerIcon(color: string, origin: boolean, destination: boolean) {
  const border = origin ? "#0A2B57" : destination ? "#DC2626" : color;
  const size = origin || destination ? 30 : 18;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="white" stroke="${border}" stroke-width="4"/>${origin || destination ? `<circle cx="${size / 2}" cy="${size / 2}" r="5" fill="${border}"/>` : ""}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function prototypeLineIcons(
  googleApi: typeof google,
  color: string,
  opacity: number,
  scale: number,
): google.maps.IconSequence[] {
  return [
    {
      icon: {
        path: "M 0,-1 0,1",
        strokeColor: color,
        strokeOpacity: opacity,
        strokeWeight: 2,
        scale,
      },
      offset: "0",
      repeat: "16px",
    },
  ];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[char] ?? char;
  });
}
