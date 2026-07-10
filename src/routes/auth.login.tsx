import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { toast.error("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    setBusy(true);
    const res = storage.login(email, password);
    setBusy(false);
    if (!res.ok) { toast.error(res.error ?? "เข้าสู่ระบบไม่สำเร็จ"); return; }
    toast.success("เข้าสู่ระบบสำเร็จ");
    nav({ to: "/" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <PageHeader title="เข้าสู่ระบบ" subtitle="ใช้บัญชีของคุณเพื่อเก็บกระเป๋าเงินและตั๋วไว้กับบัญชี" />
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="pw">รหัสผ่าน</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <Link to="/auth/forgot-password" className="font-medium text-primary hover:underline">
              ลืมรหัสผ่าน?
            </Link>
            <Link to="/policy" className="text-muted-foreground hover:text-primary hover:underline">
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            <LogIn className="size-4 mr-1.5" /> {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          ยังไม่มีบัญชี? <Link to="/auth/register" className="text-primary font-medium hover:underline">สมัครสมาชิก</Link>
        </p>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          การใช้งานต่อถือว่าคุณรับทราบ <Link to="/policy" className="text-primary hover:underline">นโยบายและเงื่อนไข</Link>
        </p>
      </Card>
      <div className="mt-4"><DemoDisclaimer>บัญชีถูกเก็บบนอุปกรณ์นี้เพื่อการสาธิตเท่านั้น</DemoDisclaimer></div>
    </div>
  );
}
