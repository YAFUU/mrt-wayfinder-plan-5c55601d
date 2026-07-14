import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueueStore } from "@/stores/queueStore";
import { getStation } from "@/services/routeService";
import { toast } from "sonner";
import { getLocalizedName } from "@/lib/display";

export const Route = createFileRoute("/admin-demo")({ component: Admin });

function Admin() {
  const { t, i18n } = useTranslation();
  const { items, updateStation, reset } = useQueueStore();

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-4">
      <PageHeader title={t("admin.title")} />
      <DemoDisclaimer tone="warn">{t("admin.warning")}</DemoDisclaimer>
      <Button
        variant="outline"
        onClick={() => {
          if (confirm("Reset demo data?")) {
            reset();
            toast.success("Reset");
          }
        }}
      >
        {t("admin.reset")}
      </Button>

      <div className="space-y-2">
        {items.map((it) => {
          const st = getStation(it.stationId)!;
          return (
            <Card key={it.stationId} className="p-3">
              <p className="font-semibold text-sm">
                {getLocalizedName(st, i18n.resolvedLanguage)} ({st.code})
              </p>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="space-y-1">
                  <span>Wait (min)</span>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={it.estimatedWaitMinutes}
                    onChange={(e) =>
                      updateStation(it.stationId, { estimatedWaitMinutes: +e.target.value })
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span>Active machines</span>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={it.activeMachines}
                    onChange={(e) =>
                      updateStation(it.stationId, { activeMachines: +e.target.value })
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span>Total machines</span>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={it.totalMachines}
                    onChange={(e) =>
                      updateStation(it.stationId, { totalMachines: +e.target.value })
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span>Trend</span>
                  <select
                    value={it.trend}
                    onChange={(e) =>
                      updateStation(it.stationId, {
                        trend: e.target.value as "up" | "down" | "stable",
                      })
                    }
                    className="w-full border rounded-md bg-background px-2 py-1"
                  >
                    <option value="up">up</option>
                    <option value="down">down</option>
                    <option value="stable">stable</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span>Status</span>
                  <select
                    value={it.queueStatus}
                    onChange={(e) =>
                      updateStation(it.stationId, {
                        queueStatus: e.target.value as "low" | "medium" | "high" | "very_high",
                      })
                    }
                    className="w-full border rounded-md bg-background px-2 py-1"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="very_high">very_high</option>
                  </select>
                </label>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
