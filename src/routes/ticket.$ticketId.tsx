import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, DemoDisclaimer, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Share2, LogIn, LogOut, HelpCircle, Receipt, Sparkles, QrCode } from "lucide-react";
import { getStation } from "@/services/routeService";
import { generateQrToken, QR_ROTATE_MS } from "@/lib/qr";
import { storage } from "@/services/storageService";
import { useProfile } from "@/hooks/useStore";
import { useTickets } from "@/hooks/useStore";
import type { Ticket, TicketStatus } from "@/types/mrt";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getLocalizedName } from "@/lib/display";

export const Route = createFileRoute("/ticket/$ticketId")({ component: TicketPage });

const STATUS_COLOR: Record<TicketStatus, string> = {
  ready_to_enter: "bg-success/15 text-success",
  in_journey: "bg-mrt-blue/15 text-mrt-blue",
  completed: "bg-muted text-muted-foreground",
  expired: "bg-destructive/15 text-destructive",
  cancelled: "bg-destructive/15 text-destructive",
  payment_pending: "bg-warning/15 text-warning",
};

function TicketPage() {
  const { t, i18n } = useTranslation();
  const { ticketId } = Route.useParams();
  const tickets = useTickets();
  const ticket = tickets.find((t) => t.id === ticketId) ?? storage.getTicket(ticketId);
  const [now, setNow] = useState(Date.now());
  const [token, setToken] = useState(() => (ticket ? ticket.qrToken : ""));
  const [nextRotationAt, setNextRotationAt] = useState(Date.now() + QR_ROTATE_MS);
  const profile = useProfile();
  const nav = useNavigate();
  const activeTicketId = ticket?.id;
  const activeTicketStatus = ticket?.status;

  // Keep the ticket reference stable while rotating the short-lived demo QR payload.
  useEffect(() => {
    if (!activeTicketId) return;
    if (activeTicketStatus !== "ready_to_enter" && activeTicketStatus !== "in_journey") return;
    const t0 = Date.now();
    const initialToken = generateQrToken(activeTicketId, t0);
    setToken(initialToken);
    setNextRotationAt(t0 + QR_ROTATE_MS);
    storage.updateTicket(activeTicketId, { qrToken: initialToken });
    const iv = setInterval(() => {
      const t1 = Date.now();
      const fresh = generateQrToken(activeTicketId, t1);
      setToken(fresh);
      setNextRotationAt(t1 + QR_ROTATE_MS);
      storage.updateTicket(activeTicketId, { qrToken: fresh });
    }, QR_ROTATE_MS);
    return () => clearInterval(iv);
  }, [activeTicketId, activeTicketStatus]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Expire automatically
  useEffect(() => {
    if (!ticket) return;
    if (ticket.status === "ready_to_enter" && new Date(ticket.validUntil).getTime() < Date.now()) {
      storage.setTicketStatus(ticket.id, "expired");
    }
  }, [ticket, now]);

  const countdown = useMemo(() => {
    if (!ticket || !token) return 0;
    return Math.max(0, Math.ceil((nextRotationAt - now) / 1000));
  }, [nextRotationAt, now, token, ticket]);

  if (!ticket) {
    return (
      <div className="p-4 lg:p-8">
        <PageHeader title={t("ticket.notFound")} />
        <EmptyState
          title={t("ticket.notFound")}
          action={
            <Button asChild>
              <Link to="/tickets">{t("ticket.myTickets")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const origin = getStation(ticket.originStationId)!;
  const destination = getStation(ticket.destinationStationId)!;
  const validUntil = new Date(ticket.validUntil);
  const isActive = ticket.status === "ready_to_enter" || ticket.status === "in_journey";
  const originName = getLocalizedName(origin, i18n.resolvedLanguage);
  const destinationName = getLocalizedName(destination, i18n.resolvedLanguage);
  const groupTickets = ticket.groupId
    ? tickets
        .filter((candidate) => candidate.groupId === ticket.groupId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];
  const passengerLabel = (candidate: Ticket, index: number) => {
    const name = candidate.passengerName?.trim();
    if (name === "ผู้ใช้หลัก" || name === "Primary passenger") {
      return t("checkout.primaryPassenger");
    }
    if (name && /^(ผู้โดยสาร|Passenger)\s+\d+$/.test(name)) {
      return t("ticket.passengerNumber", { number: index + 1 });
    }
    return name || t("ticket.passengerNumber", { number: index + 1 });
  };
  const currentPassengerIndex = Math.max(
    0,
    groupTickets.findIndex((candidate) => candidate.id === ticket.id),
  );

  const scanIn = () => {
    if (ticket.status !== "ready_to_enter") return;
    storage.setTicketStatus(ticket.id, "in_journey");
    toast.success(t("ticket.scanInSuccess", { station: originName }));
  };
  const scanOut = () => {
    if (ticket.status !== "in_journey") return;
    storage.setTicketStatus(ticket.id, "completed");
    toast.success(t("ticket.scanOutSuccess", { station: destinationName }));
  };
  const boost = async () => {
    try {
      const anyDoc = document.documentElement as HTMLElement & {
        requestFullscreen?: () => Promise<void>;
      };
      if (anyDoc.requestFullscreen) await anyDoc.requestFullscreen();
      toast.success(t("ticket.fullscreenEnabled"));
    } catch {
      /* ignore */
    }
  };
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: "MRT Ticket", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("route.linkCopied"));
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      {groupTickets.length > 1 && (
        <Card className="mb-4 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t("ticket.groupTickets")}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {groupTickets.map((groupTicket, index) => (
              <Button
                key={groupTicket.id}
                asChild
                size="sm"
                variant={groupTicket.id === ticket.id ? "default" : "outline"}
                className="shrink-0"
              >
                <Link to="/ticket/$ticketId" params={{ ticketId: groupTicket.id }}>
                  {passengerLabel(groupTicket, index)}
                </Link>
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Card
        className={cn(
          "overflow-hidden shadow-xl border-0",
          isActive ? "bg-primary text-primary-foreground" : "",
        )}
      >
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold">{t("ticket.qrTicket")}</p>
              <span
                className={cn(
                  "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_COLOR[ticket.status],
                  isActive && "bg-white/20 text-white",
                )}
              >
                {t(`ticket.${camelize(ticket.status)}`)}
              </span>
            </div>
            <div className="text-right text-xs opacity-80">
              <p>{t("ticket.ticketId")}</p>
              <p className="font-medium">{ticket.id}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className={cn("text-[10px] uppercase opacity-70")}>{t("checkout.origin")}</p>
              <p className="font-bold text-lg truncate">{originName}</p>
              <p className="text-xs opacity-70 truncate">{origin.code}</p>
            </div>
            <div className="opacity-70">→</div>
            <div className="flex-1 min-w-0 text-right">
              <p className={cn("text-[10px] uppercase opacity-70")}>{t("checkout.destination")}</p>
              <p className="font-bold text-lg truncate">{destinationName}</p>
              <p className="text-xs opacity-70 truncate">{destination.code}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key={token.slice(0, 8)}
                initial={{ opacity: 0.3, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: profile.reduceMotion ? 0 : 0.25 }}
              >
                <QRCodeSVG value={token} size={220} level="M" includeMargin={false} />
              </motion.div>
            ) : (
              <div className="size-[220px] grid place-items-center bg-muted rounded text-muted-foreground text-sm px-4 text-center">
                {t(`ticket.${camelize(ticket.status)}`)}
              </div>
            )}
          </AnimatePresence>
          {isActive && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3" /> {t("ticket.tokenRotate", { seconds: countdown })}
            </p>
          )}
        </div>

        <div className="p-4 bg-white text-foreground text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("checkout.validUntil")}</span>
            <span>
              {validUntil.toLocaleString(i18n.language, {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("checkout.passengers")}</span>
            <span>
              {ticket.passengerCount} · {passengerLabel(ticket, currentPassengerIndex)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("route.fare")}</span>
            <span>฿{ticket.amount}</span>
          </div>
        </div>
      </Card>

      {isActive && (
        <Card className="mt-4 p-4 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 grid place-items-center">
            <QrCode className="size-5 text-primary" />
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-sm">{t("ticket.demoScanTitle")}</p>
            <p className="text-muted-foreground">{t("ticket.demoScanHint")}</p>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={scanIn} disabled={ticket.status !== "ready_to_enter"}>
          <LogIn className="size-4 mr-1" /> {t("ticket.scanIn")}
        </Button>
        <Button onClick={scanOut} disabled={ticket.status !== "in_journey"} variant="secondary">
          <LogOut className="size-4 mr-1" /> {t("ticket.scanOut")}
        </Button>
        <Button variant="outline" onClick={boost}>
          <Sun className="size-4 mr-1" /> {t("ticket.brightness")}
        </Button>
        <Button variant="outline" onClick={share}>
          <Share2 className="size-4 mr-1" /> {t("common.share")}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/help">
            <HelpCircle className="size-4 mr-1" /> {t("ticket.help")}
          </Link>
        </Button>
        <Button variant="outline" onClick={() => nav({ to: "/tickets" })}>
          <Receipt className="size-4 mr-1" /> {t("ticket.myTickets")}
        </Button>
      </div>

      <div className="mt-4">
        <DemoDisclaimer tone="warn">{t("demo.qrTicket")}</DemoDisclaimer>
      </div>
    </div>
  );
}

function camelize(s: string) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
