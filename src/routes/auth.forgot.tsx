import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/auth/forgot")({ component: ForgotPage });

function ForgotPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pw) { toast.error("กรุณากรอกอีเมลและรหัสผ่านใหม่"); return; }
    if (pw.length < 6) { toast.error("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร"); return; }
    if (pw !== pw2) { toast.error("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
    setBusy(true);
    const res = storage.resetPassword(email, pw);
    setBusy(false);
    if (!res.ok) { toast.error(res.error ?? "ไม่พบบัญชีนี้ในระบบ"); return; }
    toast.success("ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบ");
    nav({ to: "/auth/login" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <PageHeader title="ลืมรหัสผ่าน" subtitle="ตั้งรหัสผ่านใหม่ให้กับบัญชีเดโมของคุณ" />
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">อีเมลของบัญชี</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="pw">รหัสผ่านใหม่</Label>
            <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="pw2">ยืนยันรหัสผ่านใหม่</Label>
            <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
          </div>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            <KeyRound className="size-4 mr-1.5" /> {busy ? "กำลังตั้งรหัสผ่านใหม่…" : "ตั้งรหัสผ่านใหม่"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          จำรหัสผ่านได้แล้ว?{" "}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">กลับไปเข้าสู่ระบบ</Link>
        </p>
      </Card>
      <div className="mt-4">
        <DemoDisclaimer>
          เนื่องจากเป็นระบบสาธิต บัญชีทั้งหมดถูกเก็บบนอุปกรณ์นี้เท่านั้น
          จึงไม่มีการส่งอีเมลรีเซ็ตจริง คุณสามารถตั้งรหัสผ่านใหม่ได้ทันทีในหน้านี้
        </DemoDisclaimer>
      </div>
    </div>
  );
}
