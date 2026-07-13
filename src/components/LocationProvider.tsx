import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLiveLocation, type LiveLocationState } from "@/hooks/useLiveLocation";

const POLICY_ACCEPTED_KEY = "mrt_policy_accepted";
const POLICY_DO_NOT_SHOW_KEY = "mrt_policy_do_not_show_again";
const POLICY_SESSION_SEEN_KEY = "mrt_policy_seen_this_session";

const LiveLocationContext = createContext<LiveLocationState | null>(null);

export function useSharedLiveLocation() {
  const value = useContext(LiveLocationContext);
  if (!value) throw new Error("useSharedLiveLocation must be used within LocationProvider");
  return value;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const live = useLiveLocation(false);
  const [mounted, setMounted] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyResolved, setPolicyResolved] = useState(false);
  const [policyDontShowAgain, setPolicyDontShowAgain] = useState(false);
  const [gpsOpen, setGpsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const accepted = window.localStorage.getItem(POLICY_ACCEPTED_KEY) === "true";
    const doNotShow = window.localStorage.getItem(POLICY_DO_NOT_SHOW_KEY) === "true";
    const seenThisSession = window.sessionStorage.getItem(POLICY_SESSION_SEEN_KEY) === "true";
    if (!(accepted && doNotShow) && !seenThisSession) {
      setPolicyOpen(true);
      return;
    }
    setPolicyResolved(true);
  }, []);

  useEffect(() => {
    if (!mounted || !policyResolved) return;
    setGpsOpen(true);
  }, [mounted, policyResolved]);

  useEffect(() => {
    if (live.status === "watching" && gpsOpen) {
      toast.success("เปิดตำแหน่งเรียบร้อย ระบบจะคำนวณสถานีที่ใกล้คุณแบบ Real-time");
      setGpsOpen(false);
    }
  }, [gpsOpen, live.status]);

  const locationMessage = useMemo(() => {
    if (live.status === "unsupported") return "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง";
    if (live.status === "denied") return "ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาต Location ในเบราว์เซอร์";
    if (live.status === "error") return live.error ?? "ไม่สามารถอ่านตำแหน่งได้ กรุณาลองอีกครั้ง";
    if (live.status === "requesting") return "กำลังขอสิทธิ์ตำแหน่งจากเบราว์เซอร์...";
    return "ระบบจะถามสิทธิ์ Location หลังจากคุณกดปุ่มเปิดตำแหน่งเท่านั้น";
  }, [live.error, live.status]);

  const resolvePolicy = (accepted: boolean) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(POLICY_SESSION_SEEN_KEY, "true");
      if (accepted) window.localStorage.setItem(POLICY_ACCEPTED_KEY, "true");
      if (accepted && policyDontShowAgain) {
        window.localStorage.setItem(POLICY_DO_NOT_SHOW_KEY, "true");
      }
    }
    setPolicyOpen(false);
    setPolicyResolved(true);
  };

  return (
    <LiveLocationContext.Provider value={live}>
      {children}

      {mounted && (
        <>
          <Dialog open={policyOpen} onOpenChange={(open) => {
            if (!open) resolvePolicy(false);
            else setPolicyOpen(true);
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="mb-2 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <DialogTitle>นโยบายและความเป็นส่วนตัว</DialogTitle>
                <DialogDescription className="leading-relaxed">
                  เว็บไซต์นี้เป็นโปรเจกต์ต้นแบบ มีการจัดเก็บข้อมูลบัญชีในเครื่องของผู้ใช้
                  และอาจใช้ตำแหน่งเพื่อค้นหาสถานีใกล้เคียง
                </DialogDescription>
              </DialogHeader>
              <label className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm leading-relaxed">
                <Checkbox
                  checked={policyDontShowAgain}
                  onCheckedChange={(checked) => setPolicyDontShowAgain(checked === true)}
                  className="mt-0.5"
                />
                <span>ไม่ต้องแสดงอีก</span>
              </label>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button asChild variant="outline">
                  <Link to="/policy" onClick={() => resolvePolicy(false)}>อ่านนโยบาย</Link>
                </Button>
                <Button onClick={() => resolvePolicy(true)}>ยอมรับ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={gpsOpen} onOpenChange={setGpsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="mb-2 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </div>
                <DialogTitle>เปิดตำแหน่งแบบ Real-time</DialogTitle>
                <DialogDescription className="leading-relaxed">
                  เปิดตำแหน่งเพื่อค้นหาสถานี MRT ที่อยู่ใกล้คุณแบบ Real-time
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {locationMessage}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setGpsOpen(false)}>ข้าม</Button>
                <Button onClick={live.start} disabled={live.status === "requesting"}>
                  เปิดตำแหน่ง
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </LiveLocationContext.Provider>
  );
}
