import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSavedTrips } from "@/hooks/useStore";
import { storage } from "@/services/storageService";
import { getStation } from "@/services/routeService";
import { Trash2, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/trips")({ component: Trips });

function Trips() {
  const { t } = useTranslation();
  const trips = useSavedTrips();

  if (trips.length === 0) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <PageHeader title={t("trips.title")} />
        <EmptyState title={t("trips.empty")} action={<Button asChild><Link to="/search">{t("common.search")}</Link></Button>} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-3">
      <PageHeader title={t("trips.title")} />
      {trips.map((tr) => {
        const o = getStation(tr.originStationId); const d = getStation(tr.destinationStationId);
        return (
          <Card key={tr.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg">{tr.icon} <span className="font-semibold">{tr.nickname}</span></p>
                <p className="text-xs text-muted-foreground truncate">{o?.nameTh} → {d?.nameTh}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" asChild>
                  <Link to="/route" search={{ from: tr.originStationId, to: tr.destinationStationId }}>
                    <Play className="size-3.5 mr-1" /> {t("trips.repeat")}
                  </Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { storage.removeSavedTrip(tr.id); toast.success("ลบแล้ว"); }} aria-label={t("common.delete")}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
