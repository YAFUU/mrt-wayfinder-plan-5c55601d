import { useTranslation } from "react-i18next";
import { AlertTriangle, Inbox, Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-muted-foreground p-6">
      <Loader2 className="size-4 animate-spin" /> {label ?? t("common.loading")}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12">
      <div className="grid place-items-center size-14 rounded-full bg-muted"><Inbox className="size-6 text-muted-foreground" /></div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ title, description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10">
      <div className="grid place-items-center size-14 rounded-full bg-destructive/10"><AlertTriangle className="size-6 text-destructive" /></div>
      <div>
        <h3 className="font-semibold">{title ?? t("common.error")}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      </div>
      {onRetry && <Button onClick={onRetry} size="sm">{t("common.retry")}</Button>}
    </div>
  );
}

export function DemoDisclaimer({ children, tone = "info", className }: { children: ReactNode; tone?: "info" | "warn"; className?: string }) {
  return (
    <div className={cn(
      "flex gap-2 items-start rounded-lg border p-3 text-xs",
      tone === "warn" ? "border-warning/50 bg-warning/10" : "border-border bg-muted/50",
      className
    )}>
      <ShieldAlert className="size-4 text-warning shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function SourceBadge({ label = "Curated Data" }: { label?: string }) {
  return <span className="inline-flex items-center rounded-full bg-mrt-light text-mrt-blue text-[10px] font-medium px-2 py-0.5">{label}</span>;
}
