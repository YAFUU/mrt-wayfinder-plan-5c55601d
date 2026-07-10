import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import mapLibreCss from "maplibre-gl/dist/maplibre-gl.css?url";
import "@/lib/i18n";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/AppShell";
import { useApplyProfile } from "@/hooks/useApplyProfile";
import { EmptyState, ErrorState } from "@/components/common";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

function NotFound() {
  return (
    <AppShell>
      <div className="p-8">
        <EmptyState
          title="404 · ไม่พบหน้านี้"
          description="ลิงก์อาจไม่ถูกต้องหรือถูกย้าย"
          action={
            <Button asChild>
              <Link to="/">กลับหน้าแรก</Link>
            </Button>
          }
        />
      </div>
    </AppShell>
  );
}

function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportLovableError(error, { boundary: "root" });
  }, [error]);
  return (
    <AppShell>
      <div className="p-8">
        <ErrorState title="เกิดข้อผิดพลาด" description={error.message} onRetry={reset} />
      </div>
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "MRT QuickPass — ซื้อตั๋วล่วงหน้า" },
      {
        name: "description",
        content:
          "MRT QuickPass ช่วยวางแผนเส้นทาง MRT ทั้ง 4 สาย ค้นหาสถานี ดูค่าโดยสาร และรับ Demo QR Ticket สำหรับสาธิต",
      },
      { property: "og:title", content: "MRT QuickPass" },
      {
        property: "og:description",
        content: "Plan MRT trips, check queues and get Demo QR tickets — a functional prototype.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0B2344" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: mapLibreCss },
      { rel: "icon", href: "/mrt-logo.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useApplyProfile();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  );
}
