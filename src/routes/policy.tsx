import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin, Database, FileWarning, ScrollText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, DemoDisclaimer } from "@/components/common";

export const Route = createFileRoute("/policy")({ component: PolicyPage });

const sections = [
  {
    icon: Database,
    title: "ข้อมูลที่จัดเก็บ",
    body:
      "MRT QuickPass เป็นโปรเจกต์ต้นแบบ ข้อมูลบัญชี ตั๋วทดลอง กระเป๋าเงินทดลอง และการตั้งค่าจะถูกจัดเก็บไว้ในเครื่องของผู้ใช้ผ่าน localStorage เท่านั้น",
  },
  {
    icon: MapPin,
    title: "การใช้ตำแหน่งแบบ Real-time",
    body:
      "ตำแหน่งของคุณจะถูกใช้เพื่อประมาณสถานี MRT ที่อยู่ใกล้ที่สุดเท่านั้น ระบบจะเริ่มอ่านตำแหน่งเมื่อคุณกดยืนยันในหน้าต่างขอสิทธิ์ และขึ้นอยู่กับการอนุญาต Location ของเบราว์เซอร์",
  },
  {
    icon: UserRound,
    title: "การจัดเก็บบัญชีในโหมดสาธิต",
    body:
      "บัญชีและรหัสผ่านในแอปนี้เป็นข้อมูลสาธิตที่เก็บในอุปกรณ์เดียวกัน ไม่ใช่ระบบบัญชีจริงของ MRTA/BEM และไม่ควรใช้รหัสผ่านจริงที่ใช้กับบริการอื่น",
  },
  {
    icon: FileWarning,
    title: "ข้อจำกัดความรับผิดชอบของข้อมูลรถไฟฟ้า",
    body:
      "ข้อมูลสถานี เส้นทาง ค่าโดยสาร คิว และตำแหน่งอาจไม่ใช่ข้อมูลทางการหรือข้อมูล Real-time จริง ควรตรวจสอบข้อมูลจากผู้ให้บริการอย่างเป็นทางการก่อนใช้งานจริง",
  },
  {
    icon: ScrollText,
    title: "เงื่อนไขการใช้งาน",
    body:
      "แอปนี้มีไว้เพื่อสาธิตแนวคิดและการออกแบบประสบการณ์ผู้ใช้เท่านั้น ห้ามใช้ตั๋วหรือข้อมูลในระบบนี้แทนการเดินทางจริงหรือการชำระเงินจริง",
  },
];

function PolicyPage() {
  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-5">
      <PageHeader
        title="นโยบายความเป็นส่วนตัว"
        subtitle="ข้อมูลนี้อธิบายการจัดเก็บข้อมูล การใช้ตำแหน่ง และข้อจำกัดของ MRT QuickPass ในโหมดต้นแบบ"
        action={
          <Button asChild variant="outline">
            <Link to="/">กลับหน้าแรก</Link>
          </Button>
        }
      />

      <Card className="p-5 lg:p-6 border-primary/20 bg-primary/5">
        <div className="flex gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">เว็บไซต์นี้เป็น Demo / Prototype</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              MRT QuickPass ยังไม่เชื่อมต่อกับระบบประตู ระบบตั๋ว ระบบชำระเงิน หรือฐานข้อมูลทางการของ MRTA/BEM
              ข้อมูลทั้งหมดมีไว้เพื่อทดสอบประสบการณ์การใช้งานและการออกแบบเท่านั้น
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="p-5">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                <section.icon className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">{section.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DemoDisclaimer tone="warn">
        ข้อมูลการเดินทาง แผนที่ และสถานีในโปรเจกต์นี้เป็นข้อมูลต้นแบบ อาจไม่ครบถ้วนหรือไม่ตรงกับสถานการณ์จริงแบบ Real-time
      </DemoDisclaimer>
    </div>
  );
}
