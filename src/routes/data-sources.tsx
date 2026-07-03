import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LINES, STATIONS, FARE_RULES, EXITS, NEARBY_PLACES, INITIAL_QUEUE, FUTURE_NETWORK, SOURCES } from "@/data/network";

export const Route = createFileRoute("/data-sources")({ component: DataSources });

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const DATASETS = [
  { name: "MRT Lines", data: () => LINES, meta: SOURCES.MRTA_SOURCE },
  { name: "MRT Stations (Blue/Purple/Yellow/Pink)", data: () => STATIONS, meta: SOURCES.MRTA_SOURCE },
  { name: "Fare Rules", data: () => FARE_RULES, meta: SOURCES.MRTA_SOURCE },
  { name: "Station Exits (Curated)", data: () => EXITS, meta: SOURCES.MRTA_SOURCE },
  { name: "Nearby Places (Curated)", data: () => NEARBY_PLACES, meta: SOURCES.MRTA_SOURCE },
  { name: "Queue Demo Data", data: () => INITIAL_QUEUE, meta: SOURCES.DEMO_SOURCE },
  { name: "Future Network (Orange, Brown)", data: () => FUTURE_NETWORK, meta: SOURCES.MRTA_SOURCE },
];

function DataSources() {
  const { t } = useTranslation();
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
      <PageHeader title={t("data.title")} />
      <DemoDisclaimer>{t("demo.notReal")}</DemoDisclaimer>
      <div className="space-y-3">
        {DATASETS.map((ds) => (
          <Card key={ds.name} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{ds.name}</p>
                <p className="text-xs text-muted-foreground">{ds.meta.sourceName}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">{t("data.type")}:</span> {ds.meta.sourceType}</div>
                  <div><span className="text-muted-foreground">{t("data.confidence")}:</span> {ds.meta.confidence ? t(`data.${ds.meta.confidence}`) : "-"}</div>
                  <div><span className="text-muted-foreground">{t("data.lastUpdated")}:</span> {ds.meta.lastUpdated ?? "-"}</div>
                </div>
                {ds.meta.notes && <p className="text-[11px] text-muted-foreground mt-2">{ds.meta.notes}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => download(`${ds.name}.json`, ds.data())}>{t("data.download")}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
