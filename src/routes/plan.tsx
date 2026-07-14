import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { z } from "zod";
import { PageHeader, EmptyState, DemoDisclaimer } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRightLeft,
  ArrowRight,
  Save,
  Share2,
  Map as MapIcon,
  Ticket as TicketIcon,
  Timer,
  Route as RouteIcon,
} from "lucide-react";
import { useTripStore } from "@/stores/tripStore";
import { planRoute, getStation, type RoutePreference } from "@/services/routeService";
import { LINES, EXITS, NEARBY_PLACES } from "@/data/network";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { getLocalizedName } from "@/lib/display";

const search = z.object({ from: z.string().optional(), to: z.string().optional() });
export const Route = createFileRoute("/plan")({ validateSearch: search, component: RoutePage });

function RoutePage() {
  const { t, i18n } = useTranslation();
  const { from, to } = Route.useSearch();
  const trip = useTripStore();
  const nav = useNavigate();

  const originId = from ?? trip.originId;
  const destinationId = to ?? trip.destinationId;

  const result = useMemo(() => {
    if (!originId || !destinationId) return null;
    return planRoute(originId, destinationId, trip.preference);
  }, [originId, destinationId, trip.preference]);

  if (!originId || !destinationId) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <PageHeader title={t("route.title")} />
        <EmptyState
          title={t("route.selectOD")}
          action={
            <Button asChild>
              <Link to="/search">{t("common.search")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <PageHeader title={t("route.title")} />
        <EmptyState
          title={t("route.noRoute")}
          action={
            <Button asChild variant="outline">
              <Link to="/search">{t("common.search")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const origin = getStation(originId)!;
  const destination = getStation(destinationId)!;
  const suggestedExits = EXITS.filter((e) => e.stationId === destinationId);
  const nearbyDest = NEARBY_PLACES.filter((p) => p.nearestStationId === destinationId);
  const totalMin = Math.round(result.totalTimeSeconds / 60);
  const language = i18n.resolvedLanguage;

  const prefBtn = (p: RoutePreference, label: string) => (
    <Button
      key={p}
      size="sm"
      variant={trip.preference === p ? "default" : "outline"}
      onClick={() => trip.setPreference(p)}
    >
      {label}
    </Button>
  );

  const buy = () => {
    if (!result.fareAvailable) {
      toast.error(t("route.fareUnavailable"));
      return;
    }
    nav({ to: "/checkout" });
  };

  const save = () => {
    storage.addSavedTrip({
      id: "TR-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      userId: storage.getProfile().id,
      nickname: `${getLocalizedName(origin, language)} → ${getLocalizedName(destination, language)}`,
      icon: "⭐",
      originStationId: origin.id,
      destinationStationId: destination.id,
      createdAt: new Date().toISOString(),
    });
    toast.success(t("route.saved"));
  };

  const share = async () => {
    const url = `${location.origin}/route?from=${origin.id}&to=${destination.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "MRT QuickPass Route", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("route.linkCopied"));
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
      <PageHeader
        title={`${getLocalizedName(origin, language)} → ${getLocalizedName(destination, language)}`}
        subtitle={`${result.totalStations} ${t("route.stations")} · ~${totalMin} ${t("common.min")} · ${result.transfers} ${t("route.transfers")}`}
        action={
          <Button variant="ghost" size="icon" onClick={trip.swap} aria-label={t("route.swap")}>
            <ArrowRightLeft className="size-4" />
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {prefBtn("fastest", t("route.fastest"))}
        {prefBtn("fewest_transfers", t("route.fewestTransfers"))}
        {prefBtn("least_walking", t("route.leastWalking"))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <RouteIcon className="size-4" /> {t("route.timeline")}
        </h3>
        <ol className="relative pl-4">
          {result.segments.map((seg, si) => {
            const line = LINES.find((l) => l.id === seg.lineId)!;
            return (
              <li key={si} className="relative mb-4">
                <div
                  className="absolute -left-4 top-0 bottom-0 w-1"
                  style={{ background: line.color }}
                />
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                    style={{ background: line.color, color: "white" }}
                  >
                    {line.code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {seg.stations.length - 1} {t("route.stations")}
                  </span>
                </div>
                <ul className="space-y-1">
                  {seg.stations.map((sid, i) => {
                    const s = getStation(sid)!;
                    const isTransfer =
                      i === seg.stations.length - 1 && si < result.segments.length - 1;
                    return (
                      <li key={sid} className="flex items-center gap-2 text-sm">
                        <span className="size-2 rounded-full" style={{ background: line.color }} />
                        <span
                          className={i === 0 || i === seg.stations.length - 1 ? "font-medium" : ""}
                        >
                          {getLocalizedName(s, language)}
                        </span>
                        {isTransfer && (
                          <span className="text-[10px] text-warning uppercase">
                            {t("route.changeAt")}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">{t("route.fare")}</span>
          {result.fareAvailable ? (
            <span className="text-2xl font-bold">฿{result.totalFare}</span>
          ) : (
            <span className="text-sm text-warning">{t("route.fareUnavailable")}</span>
          )}
        </div>
        {result.fareAvailable && (
          <p className="text-[11px] text-muted-foreground mt-1">{t("demo.fareEstimate")}</p>
        )}
        {result.fareByOperator.length > 1 && (
          <div className="mt-2 space-y-1 text-xs">
            {result.fareByOperator.map((f, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>
                  {f.operator} ({f.lineId})
                </span>
                <span>฿{f.fare}</span>
              </div>
            ))}
            <p className="text-[11px] text-warning">{t("route.operatorNote")}</p>
          </div>
        )}
      </Card>

      {suggestedExits.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">
            {t("exit.recommended")} · {getLocalizedName(destination, language)}
          </h3>
          <div className="space-y-2">
            {suggestedExits.map((e) => (
              <div key={e.exitCode} className="flex items-start gap-2 text-sm">
                <span className="grid place-items-center size-6 rounded bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {e.exitCode}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{getLocalizedName(e, language)}</p>
                  <p className="text-xs text-muted-foreground">
                    {[e.hasElevator && t("exit.elevator"), e.hasRamp && t("exit.ramp")]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {suggestedExits.length === 0 && (
        <DemoDisclaimer tone="warn">
          {t("exit.unavailable")} · {getLocalizedName(destination, language)}
        </DemoDisclaimer>
      )}

      {nearbyDest.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">{t("route.nearbyDestination")}</h3>
          <div className="space-y-1 text-sm">
            {nearbyDest.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span>{getLocalizedName(p, language)}</span>
                <span className="text-xs text-muted-foreground">
                  {p.suggestedExit && `Exit ${p.suggestedExit} · `}
                  {t("search.walkDistance", { distance: p.walkingMeters })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={buy} disabled={!result.fareAvailable} className="gap-1">
          <TicketIcon className="size-4" /> {t("route.buyTicket")}
        </Button>
        <Button variant="outline" onClick={save}>
          <Save className="size-4 mr-1" /> {t("route.savedTrip")}
        </Button>
        <Button variant="outline" onClick={share}>
          <Share2 className="size-4 mr-1" /> {t("route.shareRoute")}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/map">
            <MapIcon className="size-4 mr-1" /> {t("route.viewOnMap")}
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/queue">
            <Timer className="size-4 mr-1" /> {t("nav.queue")}
          </Link>
        </Button>
      </div>

      <DemoDisclaimer>{t("demo.notReal")}</DemoDisclaimer>
    </div>
  );
}
