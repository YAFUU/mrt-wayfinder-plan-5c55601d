import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LINES, STATIONS, FUTURE_NETWORK } from "@/data/network";
import type { LineId, MrtStation } from "@/types/mrt";
import { getStation } from "@/services/routeService";
import { useTripStore } from "@/stores/tripStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const BKK_CENTER: [number, number] = [13.78, 100.55];

function linePolyline(lineId: LineId): [number, number][] {
  return STATIONS.filter((s) => s.lineId === lineId).sort((a, b) => a.order - b.order).map((s) => [s.lat, s.lng]);
}

function FitToStations({ ids }: { ids: string[] }) {
  const map = useMap();
  useEffect(() => {
    if (!ids.length) return;
    const pts = ids.map(getStation).filter(Boolean).map((s) => [s!.lat, s!.lng] as [number, number]);
    if (pts.length) map.fitBounds(pts, { padding: [40, 40] });
  }, [ids, map]);
  return null;
}

export function InteractiveMrtMap({ routeStations = [] as string[] }: { routeStations?: string[] }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const trip = useTripStore();
  const [visible, setVisible] = useState<Record<LineId, boolean>>({
    blue: true, purple: true, yellow: true, pink: true, orange: false, brown: false,
  });
  const [selected, setSelected] = useState<MrtStation | null>(null);

  const toggle = (id: LineId) => setVisible((v) => ({ ...v, [id]: !v[id] }));

  const routeSet = useMemo(() => new Set(routeStations), [routeStations]);

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] lg:h-[calc(100dvh-6rem)] w-full">
      <MapContainer center={BKK_CENTER} zoom={11} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Operational lines */}
        {LINES.filter((l) => l.status === "operational").map((line) => visible[line.id] && (
          <Polyline
            key={line.id}
            positions={linePolyline(line.id)}
            pathOptions={{ color: line.color, weight: routeSet.size ? 3 : 5, opacity: 0.9 }}
          />
        ))}

        {/* Selected route polyline (thicker) */}
        {routeStations.length > 1 && (
          <Polyline
            positions={
              routeStations
                .map((id) => getStation(id))
                .filter((s): s is NonNullable<typeof s> => Boolean(s))
                .map((s) => [s.lat, s.lng] as [number, number])
            }
            pathOptions={{ color: "#0B2344", weight: 7, opacity: 0.9 }}
          />
        )}

        {/* Future network dashed */}
        {(["orange", "brown"] as const).map((id) => visible[id] && (
          <Polyline
            key={id}
            positions={FUTURE_NETWORK[id].stations.map((s) => [s.lat, s.lng])}
            pathOptions={{ color: FUTURE_NETWORK[id].color, weight: 3, dashArray: "6 6", opacity: 0.8 }}
          />
        ))}

        {/* Stations */}
        {STATIONS.filter((s) => visible[s.lineId]).map((s) => {
          const line = LINES.find((l) => l.id === s.lineId)!;
          const inRoute = routeSet.has(s.id);
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={s.isInterchange ? 7 : inRoute ? 6 : 4}
              pathOptions={{
                color: inRoute ? "#0B2344" : line.color,
                fillColor: inRoute ? "#0B2344" : "white",
                fillOpacity: 1,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelected(s) }}
            >
              <Tooltip>{s.nameTh} ({s.code})</Tooltip>
            </CircleMarker>
          );
        })}

        {routeStations.length > 0 && <FitToStations ids={routeStations} />}
      </MapContainer>

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

      {/* Attribution notice */}
      <div className="absolute bottom-1 left-2 z-[400] text-[10px] bg-white/80 px-1.5 rounded">
        © OpenStreetMap contributors
      </div>

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
            <Button size="sm" className="flex-1" onClick={() => { trip.setDestination(selected.id); setSelected(null); nav({ to: "/route" }); }}>{t("map.setDestination")}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
