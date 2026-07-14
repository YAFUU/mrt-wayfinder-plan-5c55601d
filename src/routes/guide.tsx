import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";
import { storage } from "@/services/storageService";
import {
  UserPlus,
  Wallet,
  Search,
  MapPin,
  Activity,
  CreditCard,
  ScanLine,
  DoorOpen,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/guide")({ component: GuidePage });

const STEP_ICONS = [UserPlus, Wallet, Search, MapPin, Activity, CreditCard, ScanLine, DoorOpen];

function GuidePage() {
  const { t } = useTranslation();

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
      <PageHeader title={t("guide.title")} subtitle={t("guide.subtitle")} />

      <div className="grid gap-3">
        {STEP_ICONS.map((Icon, i) => {
          const step = i + 1;
          return (
            <Card
              key={step}
              className="p-4 flex gap-4 items-start hover:shadow-md transition-shadow"
            >
              <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">{t(`guide.steps.${step}.title`)}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {t(`guide.steps.${step}.description`)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button asChild className="flex-1">
          <Link to="/auth/register">{t("guide.register")}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="flex-1"
          onClick={() => storage.updateProfile({ hasSeenTour: true })}
        >
          <Link to="/">{t("guide.continue")}</Link>
        </Button>
      </div>
    </div>
  );
}
