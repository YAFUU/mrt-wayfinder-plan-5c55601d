import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";
import { storage } from "@/services/storageService";
import {
  UserPlus, Wallet, Search, MapPin, Activity, CreditCard, ScanLine, DoorOpen,
} from "lucide-react";

export const Route = createFileRoute("/guide")({ component: GuidePage });

interface Step { icon: typeof Search; title: string; desc: string; }
const STEPS: Step[] = [
  { icon: UserPlus, title: "1. สมัครสมาชิก / เข้าสู่ระบบ", desc: "สร้างบัญชีเพื่อบันทึกกระเป๋าเงิน ประวัติการเดินทาง และตั๋วของคุณ" },
  { icon: Wallet, title: "2. เติมเงินเข้ากระเป๋า", desc: "เติมเงินไว้ล่วงหน้าในกระเป๋าของเว็บ จ่ายค่าโดยสารได้ทันทีโดยไม่ต้องกรอกวิธีชำระเงินใหม่ทุกครั้ง" },
  { icon: Search, title: "3. ค้นหาและวางแผนเส้นทาง", desc: "พิมพ์ชื่อสถานีหรือสถานที่ ระบบจะแนะนำเส้นทาง MRT ที่เร็วที่สุดพร้อมค่าโดยสาร" },
  { icon: MapPin, title: "4. ตำแหน่งของคุณแบบเรียลไทม์", desc: "หน้าแรกจะแสดงสถานีที่คุณอยู่ใกล้ที่สุดแบบสด เพื่อช่วยให้เลือกจุดเริ่มต้นได้ง่าย" },
  { icon: Activity, title: "5. ดูความหนาแน่นของผู้คน", desc: "แต่ละสถานีมีตัวชี้วัดความหนาแน่นและเวลารอโดยประมาณที่อัปเดตอัตโนมัติ" },
  { icon: CreditCard, title: "6. ชำระเงินด้วยกระเป๋า", desc: "เลือกวิธีชำระเป็น 'e-Wallet' เพื่อหักจากยอดคงเหลือได้ทันที" },
  { icon: ScanLine, title: "7. รับบัตร RFID สำหรับผ่านประตู", desc: "เมื่อชำระเงินสำเร็จ ระบบจะออกบัตร RFID (แสดงเป็น QR/รหัส) สำหรับใช้ผ่านประตูสถานี" },
  { icon: DoorOpen, title: "8. เข้าและออกได้เฉพาะสถานีที่เลือก", desc: "บัตรใช้ได้เฉพาะสถานีต้นทางและปลายทางที่ชำระเงินไว้ เพื่อป้องกันการลงผิดสถานี" },
];

function GuidePage() {
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
      <PageHeader title="คู่มือการใช้งาน" subtitle="ทำความรู้จักกับ MRT QuickPass ภายในไม่กี่นาที" />

      <div className="grid gap-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
              <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button asChild className="flex-1"><Link to="/auth/register">เริ่มต้นด้วยการสมัครสมาชิก</Link></Button>
        <Button asChild variant="outline" className="flex-1" onClick={() => storage.updateProfile({ hasSeenTour: true })}>
          <Link to="/">เข้าใช้งานเลย</Link>
        </Button>
      </div>
    </div>
  );
}
