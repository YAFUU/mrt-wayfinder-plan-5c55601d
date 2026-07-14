import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTickets } from "@/hooks/useStore";
import { getStation } from "@/services/routeService";
import type { TicketStatus } from "@/types/mrt";
import { cn } from "@/lib/utils";
import { getLocalizedName } from "@/lib/display";

export const Route = createFileRoute("/tickets")({ component: TicketsPage });

const FILTERS: Array<{ id: TicketStatus | "all"; key: string }> = [
  { id: "all", key: "ticket.filterAll" },
  { id: "ready_to_enter", key: "ticket.readyToEnter" },
  { id: "in_journey", key: "ticket.inJourney" },
  { id: "completed", key: "ticket.completed" },
  { id: "expired", key: "ticket.expired" },
];

function TicketsPage() {
  const { t, i18n } = useTranslation();
  const all = useTickets();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const list = all.filter((t) => filter === "all" || t.status === filter);

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
      <PageHeader title={t("ticket.myTickets")} />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {t(f.key)}
          </Button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={t("ticket.emptyTitle")}
          description={t("ticket.emptyDesc")}
          action={
            <Button asChild>
              <Link to="/search">{t("common.search")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {list.map((tk) => {
            const o = getStation(tk.originStationId);
            const d = getStation(tk.destinationStationId);
            return (
              <Link key={tk.id} to="/ticket/$ticketId" params={{ ticketId: tk.id }}>
                <Card className="p-4 hover:bg-accent transition">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{tk.id}</p>
                      <p className="font-semibold truncate">
                        {getLocalizedName(o, i18n.resolvedLanguage)} →{" "}
                        {getLocalizedName(d, i18n.resolvedLanguage)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tk.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                        tk.status === "ready_to_enter"
                          ? "bg-success/15 text-success"
                          : tk.status === "in_journey"
                            ? "bg-mrt-blue/15 text-mrt-blue"
                            : tk.status === "completed"
                              ? "bg-muted text-muted-foreground"
                              : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {t(`ticket.${camelize(tk.status)}`)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
function camelize(s: string) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
