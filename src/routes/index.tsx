import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Radar, Search, Ticket as TicketIcon } from "lucide-react";
import { DemoDisclaimer } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nearestStations, getStation } from "@/services/routeService";
import { useProfile, useTickets, useSavedTrips } from "@/hooks/useStore";
import { useTripStore } from "@/stores/tripStore";
import { LINES } from "@/data/network";
import { useSharedLiveLocation } from "@/components/LocationProvider";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t, i18n } = useTranslation();
  const profile = useProfile();
  const tickets = useTickets();
  const savedTrips = useSavedTrips();
  const nav = useNavigate();
  const setOrigin = useTripStore((s) => s.setOrigin);
  const live = useSharedLiveLocation();
  const [q, setQ] = useState("");

  const nearby = useMemo(() => {
    const point = live.coords ?? { lat: 13.7378, lng: 100.5613 };
    return nearestStations(point, 3);
  }, [live.coords]);

  const ready = tickets.find((tk) => tk.status === "ready_to_enter");
  const today = new Date().toLocaleDateString(i18n.language === "th" ? "th-TH" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const submitSearch = () => {
    if (q.trim()) nav({ to: "/search", search: { q: q.trim() } });
    else nav({ to: "/search" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">{today}</p>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          {t("home.greeting")}, {profile.displayName}
        </h1>
        <p className="text-muted-foreground mt-1">{t("home.prompt")}</p>
      </div>

      <Card className="p-5 lg:p-6 bg-gradient-to-br from-primary to-mrt-blue text-primary-foreground border-0 shadow-lg">
        <p className="text-xs uppercase tracking-widest opacity-80">{t("home.plan")}</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-70" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submitSearch()}
              placeholder={t("home.searchPlaceholder")}
              className="pl-9 h-12 bg-white/95 text-foreground border-0"
              aria-label={t("home.searchPlaceholder")}
            />
          </div>
          <Button onClick={submitSearch} size="lg" variant="secondary" className="h-12">
            {t("home.findRoute")}
          </Button>
        </div>
      </Card>

      {live.status !== "idle" && (
        <Card className="p-4 flex items-center gap-3">
          <div className="size-11 rounded-full bg-primary/10 grid place-items-center shrink-0">
            <Radar className={`size-5 text-primary ${live.status === "watching" ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">ตำแหน่งของคุณ</p>
            {live.status === "watching" && live.nearestStation ? (
              <>
                <p className="font-semibold truncate">
                  {live.distanceMeters != null && live.distanceMeters <= 150
                    ? `คุณน่าจะอยู่ที่สถานี ${live.nearestStation.nameTh}`
                    : `สถานีที่ใกล้ที่สุดคือ ${live.nearestStation.nameTh}`}
                  <span className="text-xs text-muted-foreground ml-1">({live.nearestStation.code})</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ระยะห่างประมาณ {Math.round(live.distanceMeters ?? 0)} ม.
                </p>
              </>
            ) : live.status === "denied" ? (
              <p className="text-sm text-muted-foreground">ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาต Location ในเบราว์เซอร์</p>
            ) : live.status === "unsupported" ? (
              <p className="text-sm text-muted-foreground">เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง</p>
            ) : (
              <p className="text-sm text-muted-foreground">กำลังเตรียมข้อมูลตำแหน่งแบบ Real-time</p>
            )}
          </div>
          {live.status === "watching" && (
            <Button size="sm" variant="outline" onClick={live.stop}>หยุด</Button>
          )}
        </Card>
      )}

      {ready && (
        <Card className="p-5 bg-primary text-primary-foreground border-0">
          <p className="text-xs uppercase tracking-widest opacity-80">{t("home.readyTicket")}</p>
          <p className="mt-1 text-xl font-semibold">
            {getStation(ready.originStationId)?.nameTh} → {getStation(ready.destinationStationId)?.nameTh}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t("checkout.validUntil")}: {new Date(ready.validUntil).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
          </p>
          <Button asChild variant="secondary" className="mt-3">
            <Link to="/ticket/$ticketId" params={{ ticketId: ready.id }}>
              <TicketIcon className="size-4 mr-1.5" /> {t("home.openTicket")}
            </Link>
          </Button>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">{t("home.nearbyStations")}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {nearby.map(({ station, meters }) => {
            const line = LINES.find((item) => item.id === station.lineId);
            return (
              <Card key={station.id} className="p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: line?.color }} />
                  <span className="text-[10px] uppercase text-muted-foreground">{station.code}</span>
                </div>
                <p className="font-semibold text-sm">{station.nameTh}</p>
                <p className="text-xs text-muted-foreground">{Math.round(meters)} {t("common.m")}</p>
                <Button size="sm" variant="outline" className="mt-1" onClick={() => { setOrigin(station.id); nav({ to: "/search" }); }}>
                  {t("search.setOrigin")}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {savedTrips.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("home.quickTrips")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {savedTrips.slice(0, 3).map((trip) => {
              const origin = getStation(trip.originStationId);
              const destination = getStation(trip.destinationStationId);
              return (
                <Link key={trip.id} to="/plan" search={{ from: trip.originStationId, to: trip.destinationStationId }}>
                  <Card className="p-3 hover:bg-accent transition">
                    <p className="text-sm font-medium">{trip.icon} {trip.nickname}</p>
                    <p className="text-xs text-muted-foreground">{origin?.nameTh} → {destination?.nameTh}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <DemoDisclaimer>{t("demo.notReal")}</DemoDisclaimer>
    </div>
  );
}
