// Simplified chart wrapper compatible with recharts v3.
// The default shadcn chart.tsx targets an older recharts API; we use recharts
// components directly in our QueueTrendChart and don't rely on this file.
import * as React from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string; icon?: React.ComponentType }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within <ChartContainer />");
  return ctx;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactElement;
  }
>(({ id, className, children, config, ...props }, ref) => (
  <ChartContext.Provider value={{ config }}>
    <div
      ref={ref}
      className={cn("flex aspect-video justify-center text-xs", className)}
      {...props}
    >
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </ChartContext.Provider>
));
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;
export const ChartTooltipContent: React.FC<Record<string, unknown>> = () => null;
export const ChartLegend: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;
export const ChartLegendContent: React.FC<Record<string, unknown>> = () => null;
export const ChartStyle: React.FC<{ id: string; config: ChartConfig }> = () => null;
