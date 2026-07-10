import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, DemoDisclaimer, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Share2, LogIn, LogOut, HelpCircle, Receipt, Sparkles, Radio } from "lucide-react";
import { useSharedLiveLocation } from "@/components/LocationProvider";
import { getStation } from "@/services/routeService";
import { generateQrToken, QR_ROTATE_MS } from "@/lib/qr";
import { storage } from "@/services/storageService";
import { useProfile } from "@/hooks/useStore";
import { useTickets } from "@/hooks/useStore";
import type { Ticket, TicketStatus } from "@/types/mrt";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const profile = useProfile();
  const nav = useNavigate();
  const live = useSharedLiveLocation();

  // Rotate QR token every 20s
  useEffect(() => {
    if (!ticket) return;
    if (ticket.status !== "ready_to_enter" && ticket.status !== "in_journey") return;
    const t0 = Date.now();
    setToken(generateQrToken(ticket.id, t0));
    storage.updateTicket(ticket.id, { qrToken: generateQrToken(ticket.id, t0) });
    const iv = setInterval(() => {
      const t1 = Date.now();
      const fresh = generateQrToken(ticket.id, t1);
      setToken(fresh);
      storage.updateTicket(ticket.id, { qrToken: fresh });
    }, QR_ROTATE_MS);
    return () => clearInterval(iv);
  }, [ticket?.id, ticket?.status]);

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
    // rough: rotate every 20s from a Date.now() base
    return Math.max(0, QR_ROTATE_MS - (now % QR_ROTATE_MS)) / 1000;
  }, [now, token, ticket]);

  if (!ticket) {
    return (
      <div className="p-4 lg:p-8">
        <PageHeader title={t("ticket.notFound")} />
        <EmptyState title={t("ticket.notFound")} action={<Button asChild><Link to="/tickets">{t("ticket.myTickets")}</Link></Button>} />
      </div>
    );
  }

  const origin = getStation(ticket.originStationId)!;
  const destination = getStation(ticket.destinationStationId)!;
  const validUntil = new Date(ticket.validUntil);
  const isActive = ticket.status === "ready_to_enter" || ticket.status === "in_journey";

  const distTo = (s: { lat: number; lng: number }) => {
    if (!live.coords) return null;
    const R = 6371000, rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(s.lat - live.coords.lat), dLng = rad(s.lng - live.coords.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(live.coords.lat)) * Math.cos(rad(s.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  const GATE_RADIUS = 250;
  const dOrigin = distTo(origin);
  const dDest = distTo(destination);
  const atOrigin = dOrigin != null && dOrigin <= GATE_RADIUS;
  const atDestination = dDest != null && dDest <= GATE_RADIUS;

  const scanIn = () => {
    if (ticket.status !== "ready_to_enter") return;
    if (live.status === "watching" && !atOrigin) {
      toast.error(`บัตร RFID ใช้ได้เฉพาะที่สถานี ${origin.nameTh} เท่านั้น`);
      return;
    }
    storage.setTicketStatus(ticket.id, "in_journey");
    toast.success(`แตะบัตร RFID เข้าสถานี ${origin.nameTh} สำเร็จ (Demo)`);
  };
  const scanOut = () => {
    if (ticket.status !== "in_journey") return;
    if (live.status === "watching" && !atDestination) {
      toast.error(`ออกได้เฉพาะสถานีปลายทาง ${destination.nameTh} เท่านั้น`);
      return;
    }
    storage.setTicketStatus(ticket.id, "completed");
    toast.success(`แตะบัตร RFID ออกสถานี ${destination.nameTh} สำเร็จ (Demo)`);
  };
  const boost = async () => {
    try {
      const anyDoc = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
      if (anyDoc.requestFullscreen) await anyDoc.requestFullscreen();
      toast.success("เข้าโหมดเต็มจอ");
    } catch { /* ignore */ }
  };
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: "MRT Ticket", url });
      else { await navigator.clipboard.writeText(url); toast.success("คัดลอกลิงก์แล้ว"); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <Card className={cn("overflow-hidden shadow-xl border-0", isActive ? "bg-primary text-primary-foreground" : "")}>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLOR[ticket.status], isActive && "bg-white/20 text-white")}>
              ● {t(`ticket.${camelize(ticket.status)}`)}
            </span>
            <span className="text-xs opacity-80">{ticket.id}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className={cn("text-[10px] uppercase opacity-70")}>{t("checkout.origin")}</p>
              <p className="font-bold text-lg truncate">{origin.nameTh}</p>
              <p className="text-xs opacity-70 truncate">{origin.code}</p>
            </div>
            <div className="opacity-70">→</div>
            <div className="flex-1 min-w-0 text-right">
              <p className={cn("text-[10px] uppercase opacity-70")}>{t("checkout.destination")}</p>
              <p className="font-bold text-lg truncate">{destination.nameTh}</p>
              <p className="text-xs opacity-70 truncate">{destination.code}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div key={token.slice(0, 8)} initial={{ opacity: 0.3, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: profile.reduceMotion ? 0 : 0.25 }}>
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
              <Sparkles className="size-3" /> {t("ticket.tokenRotate")} {Math.ceil(countdown)}s
            </p>
          )}
        </div>

        <div className="p-4 bg-white text-foreground text-xs space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.validUntil")}</span><span>{validUntil.toLocaleString(i18n.language, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.passengers")}</span><span>{ticket.passengerCount} · {ticket.passengerName ?? "-"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("route.fare")}</span><span>฿{ticket.amount}</span></div>
        </div>
      </Card>

      {isActive && (
        <Card className="mt-4 p-4 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 grid place-items-center">
            <Radio className={`size-5 text-primary ${live.status === "watching" ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-sm">บัตร RFID · ใช้ได้เฉพาะสถานีที่เลือก</p>
            {live.status === "watching" ? (
              ticket.status === "ready_to_enter" ? (
                <p className="text-muted-foreground">
                  {atOrigin
                    ? `พร้อมแตะเข้าที่ ${origin.nameTh}`
                    : `เดินไปยัง ${origin.nameTh} เพื่อเข้า (ห่าง ${Math.round(dOrigin ?? 0)} ม.)`}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {atDestination
                    ? `พร้อมแตะออกที่ ${destination.nameTh}`
                    : `ออกได้เฉพาะ ${destination.nameTh} (ห่าง ${Math.round(dDest ?? 0)} ม.)`}
                </p>
              )
            ) : (
              <p className="text-muted-foreground">เปิดตำแหน่งเพื่อให้ระบบตรวจว่าคุณอยู่สถานีที่ถูกต้อง</p>
            )}
          </div>
          {live.status !== "watching" && (
            <Button size="sm" variant="outline" onClick={live.start}>เปิด GPS</Button>
          )}
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={scanIn} disabled={ticket.status !== "ready_to_enter"}><LogIn className="size-4 mr-1" /> แตะเข้า (RFID)</Button>
        <Button onClick={scanOut} disabled={ticket.status !== "in_journey"} variant="secondary"><LogOut className="size-4 mr-1" /> แตะออก (RFID)</Button>
        <Button variant="outline" onClick={boost}><Sun className="size-4 mr-1" /> {t("ticket.brightness")}</Button>
        <Button variant="outline" onClick={share}><Share2 className="size-4 mr-1" /> {t("common.share")}</Button>
        <Button variant="outline" asChild><Link to="/help"><HelpCircle className="size-4 mr-1" /> {t("ticket.help")}</Link></Button>
        <Button variant="outline" onClick={() => nav({ to: "/tickets" })}><Receipt className="size-4 mr-1" /> {t("ticket.myTickets")}</Button>
      </div>


      <div className="mt-4"><DemoDisclaimer tone="warn">{t("demo.qrTicket")}</DemoDisclaimer></div>
    </div>
  );
}

function camelize(s: string) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
