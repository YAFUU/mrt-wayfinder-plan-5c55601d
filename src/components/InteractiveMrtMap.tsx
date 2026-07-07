/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LINES, STATIONS, FUTURE_NETWORK } from "@/data/network";
import type { LineId, MrtStation } from "@/types/mrt";
import { getStation } from "@/services/routeService";
import { useTripStore } from "@/stores/tripStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const BKK_CENTER = { lat: 13.78, lng: 100.55 };
const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

// Clean schematic-style base map (white background, muted geography, colored MRT lines pop)
const SCHEMATIC_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f7f8fa" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a94a6" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#eef0f4" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#e6e9ef" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dde1e8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dfe8f0" }] },
  { featureType: "landscape", stylers: [{ color: "#f7f8fa" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
];


let loaderPromise: Promise<typeof google> | null = null;

function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (loaderPromise) return loaderPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Missing Google Maps key"));

  loaderPromise = new Promise((resolve, reject) => {
    const cbName = "__initMrtGmap";
    (window as any)[cbName] = () => resolve((window as any).google);
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: cbName,
      libraries: "geometry",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

function stationsFor(lineId: LineId): MrtStation[] {
  return STATIONS.filter((s) => s.lineId === lineId).sort((a, b) => a.order - b.order);
}

export function InteractiveMrtMap({ routeStations = [] as string[] }: { routeStations?: string[] }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const trip = useTripStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Array<google.maps.Polyline | google.maps.Marker>>([]);
  const routeOverlayRef = useRef<google.maps.Polyline | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<LineId, boolean>>({
    blue: true, purple: true, yellow: true, pink: true, orange: false, brown: false,
  });
  const [selected, setSelected] = useState<MrtStation | null>(null);

  const toggle = (id: LineId) => setVisible((v) => ({ ...v, [id]: !v[id] }));

  // Initialize map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new g.maps.Map(containerRef.current, {
          center: BKK_CENTER,
          zoom: 11,
          styles: SCHEMATIC_STYLE,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        setReady(true);
      })
      .catch((e) => setError(e.message || "Map load failed"));
    return () => {
      cancelled = true;
    };
  }, []);

  const routeSet = useMemo(() => new Set(routeStations), [routeStations]);

  // Redraw overlays when data or filters change
  useEffect(() => {
    const g = (window as any).google as typeof google | undefined;
    const map = mapRef.current;
    if (!ready || !g || !map) return;

    // Clear
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    // Operational lines — draw a white casing under the colored stroke for a schematic look
    LINES.filter((l) => l.status === "operational").forEach((line) => {
      if (!visible[line.id]) return;
      const path = stationsFor(line.id).map((s) => ({ lat: s.lat, lng: s.lng }));
      const casing = new g.maps.Polyline({
        path,
        strokeColor: "#ffffff",
        strokeOpacity: 1,
        strokeWeight: routeSet.size ? 7 : 9,
        map,
        zIndex: 1,
      });
      const poly = new g.maps.Polyline({
        path,
        strokeColor: line.color,
        strokeOpacity: 1,
        strokeWeight: routeSet.size ? 4 : 6,
        map,
        zIndex: 2,
      });
      overlaysRef.current.push(casing, poly);
    });


    // Future network dashed
    (["orange", "brown"] as const).forEach((id) => {
      if (!visible[id]) return;
      const cfg = FUTURE_NETWORK[id];
      const poly = new g.maps.Polyline({
        path: cfg.stations.map((s) => ({ lat: s.lat, lng: s.lng })),
        strokeOpacity: 0,
        icons: [
          {
            icon: { path: "M 0,-1 0,1", strokeOpacity: 0.9, strokeColor: cfg.color, scale: 3 },
            offset: "0",
            repeat: "12px",
          },
        ],
        map,
      });
      overlaysRef.current.push(poly);
    });

    // Stations — circular badge with code inside, mimicking the official MRT schematic
    STATIONS.filter((s) => visible[s.lineId]).forEach((s) => {
      const line = LINES.find((l) => l.id === s.lineId)!;
      const inRoute = routeSet.has(s.id);
      const isInterchange = s.isInterchange;
      const size = isInterchange ? 28 : inRoute ? 24 : 22;
      const stroke = inRoute ? "#0B2344" : line.color;
      const fill = inRoute ? line.color : "#ffffff";
      const textColor = inRoute ? "#ffffff" : "#0B2344";
      const label = s.code;
      const r = size / 2 - 2;
      const cx = size / 2;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${isInterchange ? `<circle cx="${cx}" cy="${cx}" r="${r + 1.5}" fill="#0B2344" opacity="0.15"/>` : ""}
  <circle cx="${cx}" cy="${cx}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${size >= 26 ? 8 : 7}" font-weight="800" fill="${textColor}">${label}</text>
</svg>`;
      const marker = new g.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map,
        title: `${s.code} · ${s.nameTh} (${s.nameEn})`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new g.maps.Size(size, size),
          anchor: new g.maps.Point(size / 2, size / 2),
        },
        label: (map.getZoom() ?? 11) >= 14
          ? { text: s.nameTh, color: "#0B2344", fontSize: "10px", fontWeight: "600", className: "mrt-station-label" }
          : undefined,
        zIndex: isInterchange ? 20 : inRoute ? 15 : 10,
      });
      marker.addListener("click", () => setSelected(s));
      overlaysRef.current.push(marker);
    });

  }, [ready, visible, routeSet]);

  // Selected route polyline + fit bounds
  useEffect(() => {
    const g = (window as any).google as typeof google | undefined;
    const map = mapRef.current;
    if (!ready || !g || !map) return;

    if (routeOverlayRef.current) {
      routeOverlayRef.current.setMap(null);
      routeOverlayRef.current = null;
    }
    if (routeStations.length < 2) return;

    const pts = routeStations
      .map((id) => getStation(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ lat: s.lat, lng: s.lng }));

    routeOverlayRef.current = new g.maps.Polyline({
      path: pts,
      strokeColor: "#0B2344",
      strokeOpacity: 0.9,
      strokeWeight: 7,
      map,
      zIndex: 999,
    });

    const bounds = new g.maps.LatLngBounds();
    pts.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 60);
  }, [ready, routeStations]);

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] lg:h-[calc(100dvh-6rem)] w-full">
      <div ref={containerRef} className="h-full w-full bg-muted" />

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-background/80 text-sm text-destructive p-4 text-center">
          {error}
        </div>
      )}

      {/* Line toggles */}
      <Card className="absolute top-2 left-2 z-[400] p-2 max-w-[220px] shadow-lg">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">{t("map.filters")}</p>
        <div className="space-y-1">
          {LINES.map((l) => (
            <label key={l.id} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={visible[l.id]} onChange={() => toggle(l.id)} />
              <span className="size-3 rounded-full" style={{ background: l.color }} />
              <span className="truncate">{l.nameTh}</span>
              {l.status !== "operational" && <span className="text-[9px] text-warning">({t("map.future")})</span>}
            </label>
          ))}
        </div>
      </Card>

      {/* Legend overlay — mimics the official MRT schematic legend panel */}
      <Card className="absolute bottom-3 right-3 z-[400] p-2.5 max-w-[240px] shadow-lg hidden md:block bg-card/95 backdrop-blur">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5 tracking-wide">สัญลักษณ์ · Legend</p>
        <div className="space-y-1">
          {LINES.map((l, idx) => (
            <div key={l.id} className="flex items-center gap-2 text-[11px]">
              <span className="grid place-items-center size-4 rounded-full text-[9px] font-bold text-white shrink-0" style={{ background: l.color }}>
                {idx + 1}
              </span>
              <span className="h-1 w-6 rounded-full shrink-0" style={{ background: l.color }} />
              <span className="truncate text-foreground/90">{l.nameTh}</span>
            </div>
          ))}
          <div className="pt-1 mt-1 border-t flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="grid place-items-center size-4 rounded-full bg-white border-2 border-primary text-[8px] font-bold text-primary shrink-0">◉</span>
            <span>สถานีร่วม / จุดเชื่อมต่อ</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-1 w-6 rounded-full shrink-0 bg-[repeating-linear-gradient(90deg,#94a3b8_0_3px,transparent_3px_6px)]" />
            <span>เส้นทางในอนาคต</span>
          </div>
        </div>
      </Card>

      {/* Station detail */}
      {selected && (
        <Card className="absolute bottom-3 inset-x-3 lg:right-3 lg:left-auto lg:w-80 z-[500] p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">{selected.code}</p>
              <p className="font-semibold text-base truncate">{selected.nameTh}</p>
              <p className="text-xs text-muted-foreground truncate">{selected.nameEn}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setSelected(null)} aria-label={t("common.close")}><X className="size-4" /></Button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => { trip.setOrigin(selected.id); setSelected(null); }}>{t("map.setOrigin")}</Button>
            <Button size="sm" className="flex-1" onClick={() => { trip.setDestination(selected.id); setSelected(null); nav({ to: "/plan" }); }}>{t("map.setDestination")}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
