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
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(t("auth.errors.emailPasswordRequired"));
      return;
    }
    setBusy(true);
    const res = storage.login(email, password);
    setBusy(false);
    if (!res.ok) {
      toast.error(t("auth.errors.loginFailed"));
      return;
    }
    toast.success(t("auth.login.success"));
    nav({ to: "/" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <PageHeader title={t("auth.login.title")} subtitle={t("auth.login.subtitle")} />
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="pw">{t("auth.password")}</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <Link to="/auth/forgot-password" className="font-medium text-primary hover:underline">
              {t("auth.login.forgotPassword")}
            </Link>
            <Link to="/policy" className="text-muted-foreground hover:text-primary hover:underline">
              {t("auth.privacyPolicy")}
            </Link>
          </div>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            <LogIn className="size-4 mr-1.5" />{" "}
            {busy ? t("auth.login.busy") : t("auth.login.action")}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {t("auth.login.noAccount")}{" "}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">
            {t("auth.register.action")}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {t("auth.login.continueNotice")}{" "}
          <Link to="/policy" className="text-primary hover:underline">
            {t("auth.policyAndTerms")}
          </Link>
        </p>
      </Card>
      <div className="mt-4">
        <DemoDisclaimer>{t("auth.login.demoDisclaimer")}</DemoDisclaimer>
      </div>
    </div>
  );
}
