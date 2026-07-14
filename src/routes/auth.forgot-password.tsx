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
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/auth/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const checkEmail = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error(t("auth.errors.emailRequired"));
      return;
    }
    if (!storage.accountExists(email)) {
      toast.error(t("auth.errors.accountNotFound"));
      setEmailChecked(false);
      return;
    }
    setEmailChecked(true);
  };

  const reset = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth.errors.passwordLength"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.errors.passwordMismatch"));
      return;
    }
    const result = storage.resetPassword(email, password);
    if (!result.ok) {
      toast.error(t("auth.errors.resetFailed"));
      return;
    }
    toast.success(t("auth.forgot.success"));
    nav({ to: "/auth/login" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <PageHeader title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")} />

      <Card className="p-6">
        {!emailChecked ? (
          <form onSubmit={checkEmail} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">{t("auth.email")}</Label>
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
            <Button type="submit" className="w-full h-11">
              {t("auth.forgot.checkAccount")}
            </Button>
          </form>
        ) : (
          <form onSubmit={reset} className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              {t("auth.forgot.accountFound")} <strong>{email.trim().toLowerCase()}</strong>
            </div>
            <div>
              <Label htmlFor="new-password">{t("auth.forgot.newPassword")}</Label>
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
              <Label htmlFor="confirm-password">{t("auth.forgot.confirmNewPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full h-11">
              {t("auth.forgot.action")}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.forgot.remembered")}{" "}
          <Link to="/auth/login" className="font-medium text-primary hover:underline">
            {t("auth.login.action")}
          </Link>
        </p>
      </Card>

      <div className="mt-4">
        <DemoDisclaimer>{t("auth.forgot.demoDisclaimer")}</DemoDisclaimer>
      </div>
    </div>
  );
}
