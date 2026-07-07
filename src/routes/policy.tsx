import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import { Shield, Lock, Database, Cookie, UserCheck, Mail, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/policy")({
  component: PolicyPage,
  head: () => ({
    meta: [
      { title: "นโยบายความเป็นส่วนตัวและเงื่อนไขการใช้งาน · MRT QuickPass" },
      { name: "description", content: "นโยบายความเป็นส่วนตัว การใช้ข้อมูล และเงื่อนไขการใช้งานของ MRT QuickPass" },
      { name: "robots", content: "index,follow" },
    ],
  }),
});

interface Section { icon: typeof Shield; title: string; body: string; }
const SECTIONS: Section[] = [
  {
    icon: Database, title: "ข้อมูลที่เราเก็บ",
    body: "MRT QuickPass เป็นต้นแบบ (prototype) เพื่อการสาธิตเท่านั้น ข้อมูลบัญชี กระเป๋าเงิน ประวัติการเดินทาง และตั๋วของคุณ ถูกจัดเก็บไว้ใน localStorage บนอุปกรณ์นี้เท่านั้น ไม่มีการส่งไปยังเซิร์ฟเวอร์ของเรา",
  },
  {
    icon: MapPinIconAlt(), title: "ตำแหน่งที่ตั้ง",
    body: "เมื่อคุณอนุญาตให้ใช้ตำแหน่ง (Geolocation) เราจะใช้พิกัดของคุณเฉพาะภายในเบราว์เซอร์เพื่อคำนวณสถานี MRT ที่ใกล้ที่สุดเท่านั้น ข้อมูลจะไม่ถูกบันทึกหรือส่งออกไปที่ใด และคุณสามารถปิดการเข้าถึงได้ทุกเมื่อจากการตั้งค่าเบราว์เซอร์",
  },
  {
    icon: Cookie, title: "คุกกี้และการติดตาม",
    body: "เราไม่ใช้คุกกี้เพื่อการโฆษณาหรือติดตามข้ามเว็บไซต์ มีการใช้ localStorage เพื่อจดจำภาษา ธีม และข้อมูลบัญชีเดโมของคุณเท่านั้น",
  },
  {
    icon: Lock, title: "ความปลอดภัย",
    body: "เนื่องจากเป็นระบบสาธิต โปรดอย่ากรอกรหัสผ่านที่คุณใช้กับบริการอื่นจริง ๆ ระบบใช้การเข้ารหัสอย่างง่าย (hash) เพื่อการเรียนรู้เท่านั้น และไม่ควรถือว่าเป็นระดับการปกป้องข้อมูลจริง",
  },
  {
    icon: UserCheck, title: "สิทธิของผู้ใช้",
    body: "คุณสามารถลบข้อมูลทั้งหมดของคุณได้ด้วยตนเองผ่านหน้าจัดการเดโม (Admin Demo) หรือโดยการล้าง localStorage ของเบราว์เซอร์",
  },
  {
    icon: AlertTriangle, title: "ข้อจำกัดการใช้งาน",
    body: "MRT QuickPass ไม่ใช่ผลิตภัณฑ์ทางการของ MRTA / BEM เส้นทาง ค่าโดยสาร เวลารอ และความหนาแน่นของสถานี ใช้เพื่อการสาธิตเท่านั้น อาจไม่ตรงกับข้อมูลจริง โปรดตรวจสอบข้อมูลอย่างเป็นทางการก่อนเดินทาง",
  },
  {
    icon: Mail, title: "ติดต่อเรา",
    body: "หากมีคำถามเกี่ยวกับความเป็นส่วนตัวหรือเงื่อนไขการใช้งานฉบับนี้ กรุณาติดต่อผู้จัดทำโครงการต้นแบบผ่านหน้าช่วยเหลือ",
  },
];

// Local wrapper to avoid an extra import
function MapPinIconAlt() {
  // Reuse lucide's MapPin at runtime by direct import to keep tree-shake friendly
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MapPin } = require("lucide-react");
  return MapPin;
}

function PolicyPage() {
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="นโยบายและเงื่อนไข"
        subtitle="ความเป็นส่วนตัว การใช้ข้อมูล และเงื่อนไขการใช้งาน MRT QuickPass"
      />

      <Card className="p-5 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold">โครงการต้นแบบเพื่อการสาธิต</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              MRT QuickPass เป็น prototype ที่จัดทำเพื่อการเรียนรู้และสาธิตเท่านั้น
              ไม่ได้เชื่อมต่อกับระบบจำหน่ายตั๋วหรือประตูจริงของ MRTA / BEM
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="p-4 flex gap-4 items-start transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40">
              <div className="size-10 rounded-lg bg-muted text-foreground grid place-items-center shrink-0">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">{i + 1}. {s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">
        ปรับปรุงล่าสุด: 7 กรกฎาคม 2569 ·{" "}
        <Link to="/help" className="text-primary hover:underline">ต้องการความช่วยเหลือ?</Link>
      </p>
    </div>
  );
}
