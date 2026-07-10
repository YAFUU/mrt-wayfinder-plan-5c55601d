import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Home,
  Search,
  Map,
  Ticket,
  Timer,
  Repeat,
  Users,
  HelpCircle,
  Accessibility as A11y,
  Database,
  Settings2,
  Languages,
  Wallet,
  BookOpen,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { MrtBrandLogo } from "./MrtBrandLogo";
import { toggleLang } from "@/hooks/useApplyProfile";
import { useProfile, useTickets } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FirstTimeTour } from "@/components/FirstTimeTour";
import { useQueueStore } from "@/stores/queueStore";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { LocationProvider } from "@/components/LocationProvider";

interface NavItem {
  to: string;
  icon: typeof Home;
  key: string;
  label?: string;
}
const NAV: NavItem[] = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/search", icon: Search, key: "nav.search" },
  { to: "/map", icon: Map, key: "nav.map" },
  { to: "/tickets", icon: Ticket, key: "nav.tickets" },
  { to: "/queue", icon: Timer, key: "nav.queue" },
  { to: "/wallet", icon: Wallet, key: "nav.wallet" },
  { to: "/trips", icon: Repeat, key: "nav.trips" },
  { to: "/family", icon: Users, key: "nav.family" },
  { to: "/guide", icon: BookOpen, key: "nav.guide" },
  { to: "/help", icon: HelpCircle, key: "nav.help" },
];
const BOTTOM: NavItem[] = [
  { to: "/accessibility", icon: A11y, key: "nav.accessibility" },
  { to: "/data-sources", icon: Database, key: "nav.dataSources" },
  { to: "/policy", icon: ShieldCheck, key: "nav.policy" },
  { to: "/admin-demo", icon: Settings2, key: "nav.adminDemo" },
];

const MOBILE_NAV: NavItem[] = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/search", icon: Search, key: "nav.search" },
  { to: "/wallet", icon: Wallet, key: "nav.wallet" },
  { to: "/tickets", icon: Ticket, key: "nav.tickets" },
  { to: "/queue", icon: Timer, key: "nav.queue" },
];

function DemoBanner() {
  const { t } = useTranslation();
  return (
    <div className="bg-warning/15 text-foreground text-[11px] px-3 py-1.5 border-b border-warning/30 text-center">
      {t("demo.banner")}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const profile = useProfile();
  const tickets = useTickets();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const readyTicket = tickets.find((tk) => tk.status === "ready_to_enter");
  const tick = useQueueStore((s) => s.tick);
  const [realtimeStatus, setRealtimeStatus] = useState<"ok" | "degraded">("ok");

  // Global real-time crowd-density updates (used across all pages)
  useEffect(() => {
    const runTick = () => {
      try {
        tick();
        setRealtimeStatus("ok");
      } catch (error) {
        console.warn("Realtime demo update failed; falling back to cached queue state.", error);
        setRealtimeStatus("degraded");
      }
    };
    const iv = setInterval(runTick, 15000);
    return () => clearInterval(iv);
  }, [tick]);

  const handleLogout = () => {
    storage.logout();
    toast.success("ออกจากระบบแล้ว");
  };

  return (
    <LocationProvider>
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        <FirstTimeTour />
        <DemoBanner />
        {realtimeStatus === "degraded" && (
          <div className="fixed right-3 top-3 z-[900] rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-medium shadow-lg backdrop-blur">
            เชื่อมต่อ realtime ไม่สำเร็จ ใช้ข้อมูลจำลอง
          </div>
        )}
        <div className="flex flex-1 min-h-0">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground">
            <div className="p-4 border-b">
              <MrtBrandLogo />
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {NAV.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "hover:bg-sidebar-accent hover:translate-x-0.5",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary-foreground transition-all duration-300 ease-out",
                        active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
                      )}
                    />
                    <n.icon
                      className={cn(
                        "size-4 transition-transform duration-300 ease-out",
                        active ? "scale-110" : "group-hover:scale-110",
                      )}
                    />{" "}
                    {n.label ?? t(n.key)}
                  </Link>
                );
              })}

              <div className="pt-2 mt-2 border-t space-y-0.5">
                {BOTTOM.map((n) => {
                  const active = pathname.startsWith(n.to);
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 ease-out",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-sidebar-accent hover:translate-x-0.5",
                      )}
                    >
                      <n.icon
                        className={cn(
                          "size-4 transition-transform duration-300",
                          active ? "scale-110" : "group-hover:scale-110",
                        )}
                      />{" "}
                      {n.label ?? t(n.key)}
                    </Link>
                  );
                })}
              </div>
            </nav>
            <div className="p-3 border-t space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={toggleLang}
                aria-label={t("common.language")}
              >
                <Languages className="size-4" />{" "}
                {profile.preferredLanguage === "th" ? "ไทย" : "English"}
              </Button>
              {profile.isAuthenticated ? (
                <>
                  <div className="text-xs text-muted-foreground px-2 truncate">
                    {profile.displayName} · ฿{(profile.walletBalance ?? 0).toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" /> {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <Button asChild variant="default" size="sm" className="w-full justify-start gap-2">
                  <Link to="/auth/login">
                    <LogIn className="size-4" /> {t("nav.login")}
                  </Link>
                </Button>
              )}
            </div>
          </aside>

          {/* Mobile top bar */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-card/85 backdrop-blur-md shadow-sm transition-shadow duration-300">
              <MrtBrandLogo size={30} />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                aria-label={t("common.language")}
              >
                <Languages className="size-4 mr-1" />
                {profile.preferredLanguage === "th" ? "TH" : "EN"}
              </Button>
            </header>

            <main
              key={pathname}
              className="flex-1 min-w-0 overflow-x-hidden pb-20 lg:pb-0 animate-fade-in"
            >
              {children}
            </main>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/85 backdrop-blur-md border-t shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] grid grid-cols-5">
              {MOBILE_NAV.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                const isTicket = n.to === "/tickets" && readyTicket;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] min-h-14 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active ? "text-primary" : "text-muted-foreground",
                      isTicket && "text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        active ? "w-8 opacity-100" : "w-0 opacity-0",
                      )}
                    />
                    <div
                      className={cn(
                        "grid place-items-center size-8 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isTicket && !active && "bg-primary text-primary-foreground",
                        active ? "bg-primary/10 scale-110 -translate-y-0.5" : "scale-100",
                      )}
                    >
                      <n.icon className="size-4" />
                    </div>
                    <span className="truncate max-w-full px-1">{n.label ?? t(n.key)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </LocationProvider>
  );
}
