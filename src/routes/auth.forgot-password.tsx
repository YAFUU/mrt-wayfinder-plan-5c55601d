import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { storage } from "@/services/storageService";

export const Route = createFileRoute("/auth/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const checkEmail = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("กรุณากรอกอีเมล");
      return;
    }
    if (!storage.accountExists(email)) {
      toast.error("ไม่พบบัญชีนี้ในระบบ");
      setEmailChecked(false);
      return;
    }
    setEmailChecked(true);
  };

  const reset = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      toast.error("รหัสผ่านยืนยันไม่ตรงกัน");
      return;
    }
    const result = storage.resetPassword(email, password);
    if (!result.ok) {
      toast.error(result.error ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      return;
    }
    toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    nav({ to: "/auth/login" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <PageHeader
        title="ลืมรหัสผ่าน"
        subtitle="รีเซ็ตรหัสผ่านสำหรับบัญชีสาธิตที่เก็บไว้ในเครื่องนี้"
      />

      <Card className="p-6">
        {!emailChecked ? (
          <form onSubmit={checkEmail} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11">ตรวจสอบบัญชี</Button>
          </form>
        ) : (
          <form onSubmit={reset} className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              พบบัญชี <strong>{email.trim().toLowerCase()}</strong>
            </div>
            <div>
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-9"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full h-11">เปลี่ยนรหัสผ่าน</Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          จำรหัสผ่านได้แล้ว?{" "}
          <Link to="/auth/login" className="font-medium text-primary hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </Card>

      <div className="mt-4">
        <DemoDisclaimer>
          ฟีเจอร์นี้เป็นโหมดทดลองสำหรับบัญชีที่เก็บในเครื่องเท่านั้น ไม่ใช่ระบบรีเซ็ตรหัสผ่านผ่านอีเมลจริง
        </DemoDisclaimer>
      </div>
    </div>
  );
}
