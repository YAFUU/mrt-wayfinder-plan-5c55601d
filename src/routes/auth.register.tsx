import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/auth/register")({ component: RegisterPage });

function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("กรุณากรอกชื่อ"); return; }
    if (!email.trim()) { toast.error("กรุณากรอกอีเมล"); return; }
    if (password.length < 6) { toast.error("รหัสผ่านอย่างน้อย 6 ตัวอักษร"); return; }
    if (password !== confirm) { toast.error("รหัสผ่านไม่ตรงกัน"); return; }
    setBusy(true);
    const res = storage.register(email, password, name.trim());
    setBusy(false);
    if (!res.ok) { toast.error(res.error ?? "สมัครสมาชิกไม่สำเร็จ"); return; }
    toast.success("สมัครสมาชิกสำเร็จ");
    nav({ to: "/guide" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <PageHeader title="สมัครสมาชิก" description="สร้างบัญชีเพื่อใช้กระเป๋าเงินและติดตามการเดินทางของคุณ" />
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">ชื่อที่แสดง</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </div>
          <div>
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="pw">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="pw2">ยืนยันรหัสผ่าน</Label>
            <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            <UserPlus className="size-4 mr-1.5" /> {busy ? "กำลังสมัคร…" : "สมัครสมาชิก"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          มีบัญชีอยู่แล้ว? <Link to="/auth/login" className="text-primary font-medium hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </Card>
      <div className="mt-4"><DemoDisclaimer>ข้อมูลจะถูกเก็บไว้บนอุปกรณ์นี้เท่านั้น (โหมดสาธิต)</DemoDisclaimer></div>
    </div>
  );
}
