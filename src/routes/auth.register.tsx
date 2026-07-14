import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/auth/register")({ component: RegisterPage });

function RegisterPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("auth.errors.nameRequired"));
      return;
    }
    if (!email.trim()) {
      toast.error(t("auth.errors.emailRequired"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.errors.passwordLength"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.errors.passwordMismatch"));
      return;
    }
    if (!acceptedPolicy) {
      toast.error(t("auth.errors.policyRequired"));
      return;
    }
    setBusy(true);
    const res = storage.register(email, password, name.trim());
    setBusy(false);
    if (!res.ok) {
      toast.error(t("auth.errors.registerFailed"));
      return;
    }
    toast.success(t("auth.register.success"));
    nav({ to: "/guide" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <PageHeader title={t("auth.register.title")} subtitle={t("auth.register.subtitle")} />
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("auth.displayName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
            />
          </div>
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
            <Label htmlFor="pw">{t("auth.register.passwordLabel")}</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <Label htmlFor="pw2">{t("auth.confirmPassword")}</Label>
            <Input
              id="pw2"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <label className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm leading-relaxed">
            <Checkbox
              checked={acceptedPolicy}
              onCheckedChange={(checked) => setAcceptedPolicy(checked === true)}
              className="mt-0.5"
            />
            <span>
              {t("auth.register.acceptPrefix")}{" "}
              <Link to="/policy" className="font-medium text-primary hover:underline">
                {t("auth.privacyAndTerms")}
              </Link>
            </span>
          </label>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            <UserPlus className="size-4 mr-1.5" />{" "}
            {busy ? t("auth.register.busy") : t("auth.register.action")}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {t("auth.register.hasAccount")}{" "}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">
            {t("auth.login.action")}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {t("auth.register.readMore")}{" "}
          <Link to="/policy" className="text-primary hover:underline">
            {t("auth.privacyPolicy")}
          </Link>
        </p>
      </Card>
      <div className="mt-4">
        <DemoDisclaimer>{t("auth.register.demoDisclaimer")}</DemoDisclaimer>
      </div>
    </div>
  );
}
