import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useStore";
import { storage } from "@/services/storageService";
import { setLanguage } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/accessibility")({ component: Accessibility });

function Accessibility() {
  const { t } = useTranslation();
  const p = useProfile();

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
      <PageHeader title={t("accessibility.title")} />

      <Card className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium">{t("accessibility.fontSize")}</label>
          <div className="mt-2 flex gap-2">
            {(["normal", "large", "xlarge"] as const).map((s) => (
              <Button key={s} size="sm" variant={p.fontSize === s ? "default" : "outline"} onClick={() => storage.updateProfile({ fontSize: s })}>
                {t(`accessibility.${s}`)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t("accessibility.highContrast")}</label>
          <Switch checked={p.highContrast} onCheckedChange={(v) => storage.updateProfile({ highContrast: v })} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t("accessibility.reduceMotion")}</label>
          <Switch checked={p.reduceMotion} onCheckedChange={(v) => storage.updateProfile({ reduceMotion: v })} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t("accessibility.autoBrightness")}</label>
          <Switch checked={p.autoBrightnessOnQr} onCheckedChange={(v) => storage.updateProfile({ autoBrightnessOnQr: v })} />
        </div>

        <div>
          <label className="text-sm font-medium">{t("accessibility.language")}</label>
          <div className="mt-2 flex gap-2">
            {(["th", "en"] as const).map((l) => (
              <Button key={l} size="sm" variant={p.preferredLanguage === l ? "default" : "outline"} onClick={() => { storage.updateProfile({ preferredLanguage: l }); setLanguage(l); }}>
                {t(`common.${l}`)}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
