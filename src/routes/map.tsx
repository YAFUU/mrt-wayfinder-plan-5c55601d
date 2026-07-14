import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Component, type ErrorInfo, type ReactNode, useMemo } from "react";
import { PageHeader, ErrorState } from "@/components/common";
import { ClientOnly } from "@/components/ClientOnly";
import { InteractiveMrtMap } from "@/components/InteractiveMrtMap";
import { useTripStore } from "@/stores/tripStore";
import { planRoute } from "@/services/routeService";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/map")({ component: MapPage });

class MapErrorBoundary extends Component<
  { children: ReactNode; title: string; description: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MRT map failed to render", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-4 lg:p-8">
        <Card className="p-4">
          <ErrorState
            title={this.props.title}
            description={this.props.description}
            onRetry={() => this.setState({ error: null })}
          />
        </Card>
      </div>
    );
  }
}

function MapPage() {
  const { t } = useTranslation();
  const { originId, destinationId, preference } = useTripStore();
  const stations = useMemo(() => {
    if (!originId || !destinationId) return [];
    const r = planRoute(originId, destinationId, preference);
    if (!r) return [];
    return r.segments.flatMap((s) => s.stations).filter((id, i, arr) => arr.indexOf(id) === i);
  }, [originId, destinationId, preference]);

  return (
    <div>
      <div className="px-4 pt-4 lg:px-8 lg:pt-6">
        <PageHeader title={t("map.title")} />
      </div>
      <ClientOnly fallback={<div className="p-8 text-muted-foreground">{t("common.loading")}</div>}>
        <MapErrorBoundary
          title={t("map.renderErrorTitle")}
          description={t("map.renderErrorDescription")}
        >
          <InteractiveMrtMap routeStations={stations} />
        </MapErrorBoundary>
      </ClientOnly>
    </div>
  );
}
