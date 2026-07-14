import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin, Database, FileWarning, ScrollText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, DemoDisclaimer } from "@/components/common";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/policy")({ component: PolicyPage });

const SECTION_ICONS = [Database, MapPin, UserRound, FileWarning, ScrollText];

function PolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-5">
      <PageHeader
        title={t("policy.title")}
        subtitle={t("policy.subtitle")}
        action={
          <Button asChild variant="outline">
            <Link to="/">{t("policy.backHome")}</Link>
          </Button>
        }
      />

      <Card className="p-5 lg:p-6 border-primary/20 bg-primary/5">
        <div className="flex gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{t("policy.demoTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("policy.demoDescription")}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTION_ICONS.map((Icon, index) => (
          <Card key={index} className="p-5">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">{t(`policy.sections.${index + 1}.title`)}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(`policy.sections.${index + 1}.body`)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DemoDisclaimer tone="warn">{t("policy.disclaimer")}</DemoDisclaimer>
    </div>
  );
}
