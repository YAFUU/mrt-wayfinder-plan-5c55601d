import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueueStore } from "@/stores/queueStore";
import { getStation } from "@/services/routeService";
import { LINES } from "@/data/network";
import type { LineId, QueueDemo } from "@/types/mrt";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export const Route = createFileRoute("/queue")({ component: QueuePage });

const STATUS_STYLE: Record<QueueDemo["queueStatus"], string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-warning/25 text-warning",
  very_high: "bg-destructive/15 text-destructive",
};

function QueuePage() {
  const { t, i18n } = useTranslation();
  const { items, history, tick } = useQueueStore();
  const [q, setQ] = useState("");
  const [lineFilter, setLineFilter] = useState<LineId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<QueueDemo["queueStatus"] | "all">("all");

  useEffect(() => { const id = setInterval(tick, 15000); return () => clearInterval(id); }, [tick]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const s = getStation(it.stationId);
      if (!s) return false;
      if (lineFilter !== "all" && s.lineId !== lineFilter) return false;
      if (statusFilter !== "all" && it.queueStatus !== statusFilter) return false;
      const term = q.trim().toLowerCase();
      if (term && !s.nameTh.toLowerCase().includes(term) && !s.nameEn.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, q, lineFilter, statusFilter]);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-4">
      <PageHeader title={t("queue.title")} />
      <DemoDisclaimer tone="warn">{t("demo.queue")}</DemoDisclaimer>

      <Card className="p-3 flex flex-col sm:flex-row gap-2 items-stretch">
        <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <select value={lineFilter} onChange={(e) => setLineFilter(e.target.value as LineId | "all")} className="border rounded-md bg-background px-2 py-1 text-sm">
          <option value="all">— {t("queue.filterLine")} —</option>
          {LINES.filter((l) => l.status === "operational").map((l) => (
            <option key={l.id} value={l.id}>{i18n.language === "th" ? l.nameTh : l.nameEn}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as QueueDemo["queueStatus"] | "all")} className="border rounded-md bg-background px-2 py-1 text-sm">
          <option value="all">— {t("queue.filterStatus")} —</option>
          {(["low", "medium", "high", "very_high"] as const).map((s) => <option key={s} value={s}>{t(`queue.${s}`)}</option>)}
        </select>
      </Card>

      <div className="space-y-3">
        {filtered.map((it) => {
          const st = getStation(it.stationId)!;
          const line = LINES.find((l) => l.id === st.lineId)!;
          const hist = (history[it.stationId] ?? []).map((h) => ({ t: new Date(h.t).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" }), wait: h.wait }));
          const TrendIcon = it.trend === "up" ? TrendingUp : it.trend === "down" ? TrendingDown : Minus;
          return (
            <Card key={it.stationId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ background: line.color }} />
                    <span className="font-semibold truncate">{st.nameTh}</span>
                    <span className="text-xs text-muted-foreground">{st.code}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 items-center text-sm">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_STYLE[it.queueStatus])}>{t(`queue.${it.queueStatus}`)}</span>
                    <span>{t("queue.estimatedWait")} <b>{it.estimatedWaitMinutes}</b> {t("common.min")}</span>
                    <span className="text-muted-foreground text-xs">{t("queue.activeMachines")}: {it.activeMachines} {t("queue.of")} {it.totalMachines}</span>
                    <span className="text-muted-foreground text-xs inline-flex items-center gap-1"><TrendIcon className="size-3" /> {t(`queue.trend${it.trend === "up" ? "Up" : it.trend === "down" ? "Down" : "Stable"}`)}</span>
                  </div>
                </div>
                <Button size="sm" asChild><Link to="/search">{t("queue.buy")}</Link></Button>
              </div>
              <div className="mt-3 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hist}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={24} />
                    <Tooltip />
                    <Line type="monotone" dataKey="wait" stroke={line.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{t("queue.updated")}: {new Date(it.updatedAt).toLocaleTimeString(i18n.language)}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
