import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Ticket as TicketIcon, Timer, Radar, Activity } from "lucide-react";
import { nearestStations, allStations } from "@/services/routeService";
import { useProfile, useTickets, useSavedTrips } from "@/hooks/useStore";
import { useQueueStore } from "@/stores/queueStore";
import { getStation } from "@/services/routeService";
import { useTripStore } from "@/stores/tripStore";
import { LINES } from "@/data/network";
import { useNavigate } from "@tanstack/react-router";
import { useLiveLocation } from "@/hooks/useLiveLocation";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t, i18n } = useTranslation();
  const profile = useProfile();
  const tickets = useTickets();
  const savedTrips = useSavedTrips();
  const queue = useQueueStore((s) => s.items);
  const nav = useNavigate();
  const setOrigin = useTripStore((s) => s.setOrigin);
  const [q, setQ] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locErr, setLocErr] = useState(false);

  const nearby = useMemo(() => {
    const point = coords ?? { lat: 13.7378, lng: 100.5613 }; // Sukhumvit fallback
    return nearestStations(point, 3);
  }, [coords]);

  const ready = tickets.find((tk) => tk.status === "ready_to_enter");
  const worstQueue = [...queue].sort((a, b) => b.estimatedWaitMinutes - a.estimatedWaitMinutes)[0];
  const worstStation = worstQueue ? getStation(worstQueue.stationId) : null;

  const today = new Date().toLocaleDateString(i18n.language === "th" ? "th-TH" : "en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocErr(true); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setLocErr(true),
      { timeout: 8000 },
    );
  };

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

      {/* Main search card */}
      <Card className="p-5 lg:p-6 bg-gradient-to-br from-primary to-mrt-blue text-primary-foreground border-0 shadow-lg">
        <p className="text-xs uppercase tracking-widest opacity-80">{t("home.plan")}</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-70" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder={t("home.searchPlaceholder")}
              className="pl-9 h-12 bg-white/95 text-foreground border-0"
              aria-label={t("home.searchPlaceholder")}
            />
          </div>
          <Button onClick={submitSearch} size="lg" variant="secondary" className="h-12">
            {t("home.findRoute")}
          </Button>
        </div>
        <button
          onClick={requestLocation}
          className="mt-3 inline-flex items-center gap-1.5 text-xs opacity-90 hover:opacity-100"
        >
          <MapPin className="size-3.5" /> {t("home.useMyLocation")}
        </button>
      </Card>

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

      {/* Nearby */}
      <section>
        <h2 className="text-lg font-semibold mb-2">{t("home.nearbyStations")}</h2>
        {locErr && <p className="text-xs text-muted-foreground mb-2">{t("home.noLocation")}</p>}
        <div className="grid gap-2 sm:grid-cols-3">
          {nearby.map(({ station, meters }) => {
            const line = LINES.find((l) => l.id === station.lineId);
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

      {/* Saved trips */}
      {savedTrips.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("home.quickTrips")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {savedTrips.slice(0, 3).map((tr) => {
              const o = getStation(tr.originStationId); const d = getStation(tr.destinationStationId);
              return (
                <Link key={tr.id} to="/plan" search={{ from: tr.originStationId, to: tr.destinationStationId }}>
                  <Card className="p-3 hover:bg-accent transition">
                    <p className="text-sm font-medium">{tr.icon} {tr.nickname}</p>
                    <p className="text-xs text-muted-foreground">{o?.nameTh} → {d?.nameTh}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Queue alert */}
      {worstStation && (
        <Card className="p-4 flex items-center gap-3">
          <div className="size-10 rounded-full bg-warning/20 grid place-items-center"><Timer className="size-5 text-warning" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t("home.queueAlert")}</p>
            <p className="text-xs text-muted-foreground truncate">
              {worstStation.nameTh} · {t(`queue.${worstQueue.queueStatus}`)} · ~{worstQueue.estimatedWaitMinutes} {t("common.min")}
            </p>
          </div>
          <Button asChild size="sm" variant="outline"><Link to="/queue">{t("home.seeAllQueue")}</Link></Button>
        </Card>
      )}

      <DemoDisclaimer>{t("demo.notReal")}</DemoDisclaimer>
    </div>
  );
}
