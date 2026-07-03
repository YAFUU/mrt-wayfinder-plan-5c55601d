import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/common";
import { ClientOnly } from "@/components/ClientOnly";
import { InteractiveMrtMap } from "@/components/InteractiveMrtMap";
import { useTripStore } from "@/stores/tripStore";
import { planRoute } from "@/services/routeService";
import { useMemo } from "react";

export const Route = createFileRoute("/map")({ component: MapPage });

function MapPage() {
  const { t } = useTranslation();
  const { originId, destinationId, preference } = useTripStore();
  const stations = useMemo(() => {
    if (!originId || !destinationId) return [];
    const r = planRoute(originId, destinationId, preference);
    if (!r) return [];
    return r.segments.flatMap((s) => s.stations).filter((id, i, arr) => arr.indexOf(id) === i);
  }, [originId, destinationId, preference]);

  return (
    <div>
      <div className="px-4 pt-4 lg:px-8 lg:pt-6">
        <PageHeader title={t("map.title")} />
      </div>
      <ClientOnly fallback={<div className="p-8 text-muted-foreground">{t("common.loading")}</div>}>
        <InteractiveMrtMap routeStations={stations} />
      </ClientOnly>
    </div>
  );
}
