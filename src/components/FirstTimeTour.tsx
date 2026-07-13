import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/services/storageService";
import { useProfile } from "@/hooks/useStore";
import { Search, Wallet, MapPin, Ticket as TicketIcon, X } from "lucide-react";

interface Slide { icon: typeof Search; title: string; desc: string; }
const SLIDES: Slide[] = [
  { icon: Search, title: "ค้นหาและวางแผนเส้นทาง", desc: "พิมพ์ชื่อสถานีหรือสถานที่ ระบบจะแนะนำเส้นทาง MRT ที่เร็วที่สุดให้อัตโนมัติ" },
  { icon: Wallet, title: "เติมเงินเข้ากระเป๋า", desc: "เติมเงินไว้ในกระเป๋าของเว็บครั้งเดียว จ่ายค่าโดยสารได้ทันทีไม่ต้องกรอกใหม่ทุกครั้ง" },
  { icon: MapPin, title: "ตำแหน่งแบบเรียลไทม์", desc: "ระบบจะบอกว่าคุณอยู่ใกล้สถานีไหน และแสดงความหนาแน่นของผู้คนแต่ละสถานีแบบสด" },
  { icon: TicketIcon, title: "ผ่านประตูด้วย RFID", desc: "เลือกต้นทาง–ปลายทางและชำระเงินก่อน จากนั้นแตะบัตร RFID เข้า-ออกได้เฉพาะสถานีที่เลือกไว้เท่านั้น" },
];

export function FirstTimeTour() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!profile.hasSeenTour) {
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, [profile.hasSeenTour]);

  if (!open) return null;

  const finish = () => {
    storage.updateProfile({ hasSeenTour: true });
    setOpen(false);
  };

  const slide = SLIDES[i];
  const Icon = slide.icon;
  const last = i === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm grid place-items-center p-4 animate-fade-in">
      <Card className="w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={finish}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="ข้าม"
        >
          <X className="size-4" />
        </button>

        <div className="size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
          <Icon className="size-7" />
        </div>
        <h2 className="text-xl font-bold">{slide.title}</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{slide.desc}</p>

        <div className="flex gap-1.5 mt-5">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-muted"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-5 gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>ข้าม</Button>
          <div className="flex gap-2">
            {i > 0 && (
              <Button variant="outline" size="sm" onClick={() => setI(i - 1)}>ย้อนกลับ</Button>
            )}
            {!last && (
              <Button size="sm" onClick={() => setI(i + 1)}>ถัดไป</Button>
            )}
            {last && (
              <>
                <Button asChild size="sm" variant="outline"><Link to="/guide" onClick={finish}>ดูคู่มือฉบับเต็ม</Link></Button>
                <Button size="sm" onClick={finish}>เริ่มใช้งาน</Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
