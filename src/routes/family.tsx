import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { PageHeader, DemoDisclaimer, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Ticket } from "lucide-react";
import { useTripStore } from "@/stores/tripStore";
import { planRoute, getStation } from "@/services/routeService";

export const Route = createFileRoute("/family")({ component: Family });

function Family() {
  const { t } = useTranslation();
  const { originId, destinationId, passengers, setPassengers, preference } = useTripStore();
  const [names, setNames] = useState<string[]>(() => Array.from({ length: passengers }, (_, i) => (i === 0 ? "ผู้ใช้หลัก" : `เพื่อนร่วมเดินทาง ${i + 1}`)));
  const nav = useNavigate();

  const result = useMemo(() => (originId && destinationId ? planRoute(originId, destinationId, preference) : null), [originId, destinationId, preference]);
  const perFare = result?.totalFare ?? null;
  const total = perFare != null ? perFare * passengers : null;

  const changePassengers = (n: number) => {
    const c = Math.min(6, Math.max(1, n));
    setPassengers(c);
    setNames((prev) => {
      const arr = [...prev];
      while (arr.length < c) arr.push(`ผู้โดยสาร ${arr.length + 1}`);
      return arr.slice(0, c);
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
      <PageHeader title={t("family.title")} />

      {!result || !perFare ? (
        <EmptyState title={t("route.selectOD")} action={<Button asChild><Link to="/search">{t("common.search")}</Link></Button>} />
      ) : (
        <>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">{t("checkout.origin")} → {t("checkout.destination")}</p>
            <p className="font-semibold">{getStation(originId!)!.nameTh} → {getStation(destinationId!)!.nameTh}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("family.passengers")}</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={() => changePassengers(passengers - 1)} disabled={passengers <= 1}><Minus className="size-4" /></Button>
                <span className="w-6 text-center font-bold">{passengers}</span>
                <Button size="icon" variant="outline" onClick={() => changePassengers(passengers + 1)} disabled={passengers >= 6}><Plus className="size-4" /></Button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {names.map((n, i) => (
                <Input key={i} value={n} onChange={(e) => setNames((prev) => prev.map((x, j) => j === i ? e.target.value : x))} placeholder={`${t("family.passengerName")} ${i + 1}`} />
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-mrt-light">
            <div className="flex justify-between text-sm"><span>{t("checkout.farePerPassenger")}</span><span>฿{perFare}</span></div>
            <div className="flex justify-between text-xl font-bold mt-1"><span>{t("checkout.total")}</span><span>฿{total}</span></div>
            <p className="text-[11px] text-muted-foreground mt-2">{t("family.totalNote")}</p>
          </Card>

          <DemoDisclaimer tone="warn">{t("family.warning")}</DemoDisclaimer>

          <Button className="w-full h-12" onClick={() => nav({ to: "/checkout" })}><Ticket className="size-4 mr-1.5" /> {t("route.buyTicket")}</Button>
        </>
      )}
    </div>
  );
}
