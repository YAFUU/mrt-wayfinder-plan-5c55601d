import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { PageHeader, DemoDisclaimer, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { useTripStore } from "@/stores/tripStore";
import { planRoute, getStation } from "@/services/routeService";
import { createPaymentIntent, confirmPayment } from "@/services/paymentService";
import { toast } from "sonner";
import { getLocalizedName } from "@/lib/display";

export const Route = createFileRoute("/checkout")({ component: Checkout });

type Method = "promptpay" | "card" | "banking" | "wallet";

function Checkout() {
  const { t, i18n } = useTranslation();
  const { originId, destinationId, passengers, setPassengers, preference } = useTripStore();
  const nav = useNavigate();
  const [method, setMethod] = useState<Method>("promptpay");
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: passengers }, (_, i) =>
      i === 0 ? t("checkout.primaryPassenger") : t("checkout.passenger", { number: i + 1 }),
    ),
  );
  const [processing, setProcessing] = useState(false);

  const result = useMemo(
    () => (originId && destinationId ? planRoute(originId, destinationId, preference) : null),
    [originId, destinationId, preference],
  );

  if (!result || !result.fareAvailable) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <PageHeader title={t("checkout.title")} />
        <EmptyState
          title={result ? t("route.fareUnavailable") : t("route.selectOD")}
          action={
            <Button asChild>
              <Link to="/search">{t("common.search")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const origin = getStation(originId!)!;
  const destination = getStation(destinationId!)!;
  const perPassenger = result.totalFare!;
  const total = perPassenger * passengers;

  const changePassengers = (n: number) => {
    const clamped = Math.min(6, Math.max(1, n));
    setPassengers(clamped);
    setNames((prev) => {
      const arr = [...prev];
      while (arr.length < clamped) {
        arr.push(t("checkout.passenger", { number: arr.length + 1 }));
      }
      return arr.slice(0, clamped);
    });
  };

  const doPay = async (outcome: "success" | "fail") => {
    setProcessing(true);
    try {
      const input = {
        originStationId: origin.id,
        destinationStationId: destination.id,
        passengers: names.map((n) => ({ name: n.trim() || t("checkout.passengerFallback") })),
        amountPerPassenger: perPassenger,
        method,
      };
      const intent = await createPaymentIntent(input);
      const res = await confirmPayment(intent.transactionId, input, outcome);
      if (res.status === "paid" && res.ticketIds[0]) {
        toast.success(t("checkout.success"));
        nav({ to: "/ticket/$ticketId", params: { ticketId: res.ticketIds[0] } });
      } else {
        toast.error(t("checkout.failed"));
      }
    } catch {
      toast.error(t("checkout.failed"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
      <PageHeader title={t("checkout.title")} />

      <Card className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("checkout.origin")}</span>
          <span className="font-medium">{getLocalizedName(origin, i18n.resolvedLanguage)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("checkout.destination")}</span>
          <span className="font-medium">
            {getLocalizedName(destination, i18n.resolvedLanguage)}
          </span>
        </div>
      </Card>

      <Card className="p-4">
        <Label>{t("checkout.passengers")}</Label>
        <div className="flex items-center gap-3 mt-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => changePassengers(passengers - 1)}
            disabled={passengers <= 1}
            aria-label="−"
          >
            <Minus className="size-4" />
          </Button>
          <span className="text-xl font-bold w-8 text-center">{passengers}</span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => changePassengers(passengers + 1)}
            disabled={passengers >= 6}
            aria-label="+"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {passengers > 1 && (
          <div className="mt-3 space-y-2">
            {names.map((n, i) => (
              <Input
                key={i}
                value={n}
                onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={t("checkout.passenger", { number: i + 1 })}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <Label>{t("checkout.method")}</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {(["promptpay", "card", "banking", "wallet"] as Method[]).map((m) => (
            <Button
              key={m}
              variant={method === m ? "default" : "outline"}
              onClick={() => setMethod(m)}
              className="justify-start"
            >
              {t(`checkout.methods.${m}`)}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-mrt-light">
        <div className="flex justify-between text-sm">
          <span>{t("checkout.farePerPassenger")}</span>
          <span>฿{perPassenger}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>× {passengers}</span>
        </div>
        <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t">
          <span>{t("checkout.total")}</span>
          <span>฿{total}</span>
        </div>
      </Card>

      <DemoDisclaimer tone="warn">
        {t("demo.payment")} · {t("demo.qrTicket")}
      </DemoDisclaimer>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          className="flex-1 h-12 text-base"
          onClick={() => doPay("success")}
          disabled={processing}
        >
          {processing ? t("checkout.processing") : t("checkout.pay")}
        </Button>
        <Button variant="outline" onClick={() => doPay("fail")} disabled={processing}>
          {t("checkout.simulateFail")}
        </Button>
      </div>
    </div>
  );
}
