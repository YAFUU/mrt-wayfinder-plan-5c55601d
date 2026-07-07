import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/services/storageService";
import {
  UserPlus, Wallet, Search, MapPin, Activity, CreditCard, ScanLine, DoorOpen,
  ArrowRight, PlayCircle, X, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/guide")({ component: GuidePage });

interface Step {
  icon: typeof Search;
  title: string;
  desc: string;
  tag: string;
}

const STEPS: Step[] = [
  { tag: "เริ่มต้น", icon: UserPlus, title: "สมัคร / เข้าสู่ระบบ", desc: "สร้างบัญชีเพื่อบันทึกกระเป๋าเงิน ประวัติการเดินทาง และตั๋วของคุณไว้กับบัญชีเดียว" },
  { tag: "กระเป๋า", icon: Wallet, title: "เติมเงินเข้ากระเป๋า", desc: "เติมเงินไว้ล่วงหน้าในกระเป๋าของเว็บ แล้วจ่ายค่าโดยสารได้ทันที ไม่ต้องกรอกวิธีชำระเงินใหม่ทุกครั้ง" },
  { tag: "ค้นหา", icon: Search, title: "ค้นหาและวางแผนเส้นทาง", desc: "พิมพ์ชื่อสถานีหรือสถานที่ ระบบจะแนะนำเส้นทาง MRT ที่เร็วที่สุดพร้อมค่าโดยสารโดยประมาณ" },
  { tag: "เรียลไทม์", icon: MapPin, title: "ตำแหน่งของคุณแบบสด", desc: "หน้าแรกจะบอกว่าคุณอยู่ใกล้สถานีไหน เพื่อช่วยเลือกจุดเริ่มต้นได้ง่ายและไม่หลง" },
  { tag: "เรียลไทม์", icon: Activity, title: "ดูความหนาแน่นของผู้คน", desc: "แต่ละสถานีมีตัวชี้วัดความหนาแน่นและเวลารอโดยประมาณที่อัปเดตอัตโนมัติทุกไม่กี่วินาที" },
  { tag: "ชำระเงิน", icon: CreditCard, title: "ชำระเงินด้วยกระเป๋า", desc: "เลือกวิธีชำระเป็น e-Wallet เพื่อหักจากยอดคงเหลือได้ทันที ไม่ต้องกรอกบัตรใหม่" },
  { tag: "RFID", icon: ScanLine, title: "รับบัตร RFID สำหรับผ่านประตู", desc: "เมื่อชำระเงินสำเร็จ ระบบจะออกบัตร RFID (แสดงเป็น QR/รหัส) สำหรับใช้ผ่านประตูสถานี" },
  { tag: "RFID", icon: DoorOpen, title: "เข้า-ออกได้เฉพาะสถานีที่เลือก", desc: "บัตรใช้ได้เฉพาะสถานีต้นทางและปลายทางที่ชำระไว้ เพื่อป้องกันการลงผิดสถานีโดยไม่ตั้งใจ" },
];

function GuidePage() {
  const [tourOpen, setTourOpen] = useState(false);
  const [i, setI] = useState(0);
  const startTour = () => { setI(0); setTourOpen(true); };
  const restartFirstTime = () => {
    storage.updateProfile({ hasSeenTour: false });
    window.location.assign("/");
  };
  const last = i === STEPS.length - 1;
  const Icon = STEPS[i].icon;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/8 via-background to-background p-6 lg:p-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 backdrop-blur px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="size-3 text-primary" /> คู่มือฉบับย่อ
        </div>
        <h1 className="mt-4 text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
          ดูวิธีใช้สั้น ๆ<span className="text-primary">_</span><br className="hidden sm:block" />
          <span className="text-muted-foreground text-2xl lg:text-3xl font-bold">
            ก่อนเริ่มใช้งาน MRT QuickPass
          </span>
        </h1>
        <p className="mt-3 text-sm lg:text-base text-muted-foreground max-w-xl leading-relaxed">
          ไม่กี่ขั้นก็เข้าใจ ตั้งแต่สมัครสมาชิก เติมเงินเข้ากระเป๋า วางแผนเส้นทาง
          ไปจนถึงใช้บัตร RFID ผ่านประตูสถานี
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button size="lg" className="gap-2" onClick={startTour}>
            <PlayCircle className="size-4" /> ดูทัวร์
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link to="/">ข้ามไปเลย <ArrowRight className="size-4" /></Link>
          </Button>
          <Button size="lg" variant="ghost" onClick={restartFirstTime}>
            เปิดทัวร์ครั้งแรกอีกครั้ง
          </Button>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Numbered steps */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">ขั้นตอนการใช้งาน</h2>
            <p className="text-sm text-muted-foreground">ทั้งหมด {STEPS.length} ขั้นตอน</p>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">อ่านจากบนลงล่าง</span>
        </div>

        <ol className="relative border-l border-dashed border-border/70 ml-4 space-y-4">
          {STEPS.map((s, idx) => {
            const StepIcon = s.icon;
            return (
              <li key={idx} className="relative pl-6">
                <span className="absolute -left-[17px] top-2 grid place-items-center size-8 rounded-full bg-background border-2 border-primary text-primary text-xs font-bold shadow-sm">
                  {idx + 1}
                </span>
                <Card className="group p-4 flex gap-4 items-start transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40">
                  <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <StepIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase font-semibold tracking-wide text-primary/80 bg-primary/10 rounded px-1.5 py-0.5">
                        {s.tag}
                      </span>
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-2xl border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">พร้อมเริ่มต้นแล้วใช่ไหม?</h3>
          <p className="text-sm text-muted-foreground">สร้างบัญชีเพื่อบันทึกกระเป๋าเงินและตั๋วของคุณ</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/auth/login">เข้าสู่ระบบ</Link></Button>
          <Button asChild><Link to="/auth/register">สมัครสมาชิก</Link></Button>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        อ่านเงื่อนไขการใช้งานและความเป็นส่วนตัวได้ที่{" "}
        <Link to="/policy" className="text-primary hover:underline font-medium">นโยบายของเรา</Link>
      </p>

      {/* Bottom-sheet tour overlay (flow_ style) */}
      {tourOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <Card className="w-full sm:max-w-md m-0 sm:m-4 p-5 rounded-t-2xl sm:rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setTourOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="ปิด"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="grid place-items-center size-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-primary">
                  <Icon className="size-4" />
                  <span className="text-[10px] uppercase font-semibold tracking-wide">{STEPS[i].tag}</span>
                </div>
                <h3 className="font-bold text-base mt-0.5">{STEPS[i].title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{STEPS[i].desc}</p>
              </div>
            </div>

            {/* progress bar */}
            <div className="mt-4 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((i + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{i + 1} of {STEPS.length}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={i === 0}
                  onClick={() => setI(i - 1)}
                  className={cn(i === 0 && "opacity-50")}
                >
                  <ChevronLeft className="size-4" /> ย้อน
                </Button>
                {!last ? (
                  <Button size="sm" onClick={() => setI(i + 1)}>
                    ต่อ <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setTourOpen(false)}>
                    เริ่มใช้งานเลย
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
