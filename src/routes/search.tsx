import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStation, searchStations } from "@/services/routeService";
import { NEARBY_PLACES, LINES } from "@/data/network";
import { useTripStore } from "@/stores/tripStore";
import { storage } from "@/services/storageService";
import { getLocalizedName, getSecondaryLocalizedName } from "@/lib/display";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: Search,
});

function Search() {
  const { t, i18n } = useTranslation();
  const { q: initQ } = Route.useSearch();
  const [q, setQ] = useState(initQ ?? "");
  const [debounced, setDebounced] = useState(q);
  const nav = useNavigate();
  const { setOrigin, setDestination } = useTripStore();
  const [recent, setRecent] = useState<string[]>(() => storage.getRecentSearches());
  const language = i18n.resolvedLanguage;

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const stationResults = useMemo(
    () => (debounced.trim() ? searchStations(debounced, 20) : []),
    [debounced],
  );
  const placeResults = useMemo(() => {
    const s = debounced.trim().toLowerCase();
    if (!s) return [];
    return NEARBY_PLACES.filter(
      (p) => p.nameTh.toLowerCase().includes(s) || p.nameEn.toLowerCase().includes(s),
    ).slice(0, 12);
  }, [debounced]);

  const commitSearch = (term: string) => {
    if (term.trim()) {
      storage.addRecentSearch(term.trim());
      setRecent(storage.getRecentSearches());
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
      <PageHeader title={t("search.title")} subtitle={t("search.placeholder")} />

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => commitSearch(q)}
          placeholder={t("search.placeholder")}
          className="pl-9 h-12"
          aria-label={t("search.title")}
        />
      </div>

      {!debounced.trim() && (
        <>
          {recent.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("search.sectionRecent")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <Button key={r} size="sm" variant="outline" onClick={() => setQ(r)}>
                    {r}
                  </Button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("search.sectionSuggested")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {NEARBY_PLACES.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setQ(getLocalizedName(p, language))}
                  className="text-left group"
                >
                  <Card className="relative overflow-hidden p-3 border border-border/70 bg-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:border-primary/40 group-hover:bg-accent/40">
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <p className="text-sm font-medium transition-colors duration-300 group-hover:text-primary">
                      {getLocalizedName(p, language)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getSecondaryLocalizedName(p, language)
                        ? `${getSecondaryLocalizedName(p, language)} · `
                        : ""}
                      {p.category}
                    </p>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {debounced.trim() && (
        <>
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("search.sectionStations")}
            </h3>
            {stationResults.length === 0 ? (
              <EmptyState title={t("search.empty")} />
            ) : (
              <div className="space-y-2">
                {stationResults.map((s) => {
                  const line = LINES.find((l) => l.id === s.lineId);
                  return (
                    <Card key={s.id} className="p-3 flex items-center gap-3">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ background: line?.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getLocalizedName(s, language)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getSecondaryLocalizedName(s, language)
                            ? `${getSecondaryLocalizedName(s, language)} · `
                            : ""}
                          {s.code}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setOrigin(s.id);
                            commitSearch(q);
                            nav({ to: "/plan" });
                          }}
                        >
                          {t("search.setOrigin")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setDestination(s.id);
                            commitSearch(q);
                            nav({ to: "/plan" });
                          }}
                        >
                          {t("search.setDestination")}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {placeResults.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("search.sectionPlaces")}
              </h3>
              <div className="space-y-2">
                {placeResults.map((p) => {
                  const nearestStation = getStation(p.nearestStationId);
                  const stationLabel = nearestStation
                    ? `${nearestStation.code} ${getLocalizedName(nearestStation, language)}`
                    : p.nearestStationId;

                  return (
                    <Card key={p.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{getLocalizedName(p, language)}</p>
                          <p className="text-xs text-muted-foreground">
                            {getSecondaryLocalizedName(p, language)
                              ? `${getSecondaryLocalizedName(p, language)} · `
                              : ""}
                            {t("search.nearStation", { station: stationLabel })} ·{" "}
                            {t("search.walkDistance", { distance: p.walkingMeters })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setDestination(p.nearestStationId);
                            commitSearch(q);
                            nav({ to: "/plan" });
                          }}
                        >
                          {t("search.setDestination")}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
