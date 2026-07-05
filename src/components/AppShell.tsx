import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Home, Search, Map, Ticket, Timer, Repeat, Users, HelpCircle,
  Accessibility as A11y, Database, Settings2, Languages,
} from "lucide-react";
import type { ReactNode } from "react";
import { MrtBrandLogo } from "./MrtBrandLogo";
import { toggleLang } from "@/hooks/useApplyProfile";
import { useProfile, useTickets } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem { to: string; icon: typeof Home; key: string; }
const NAV: NavItem[] = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/search", icon: Search, key: "nav.search" },
  { to: "/map", icon: Map, key: "nav.map" },
  { to: "/tickets", icon: Ticket, key: "nav.tickets" },
  { to: "/queue", icon: Timer, key: "nav.queue" },
  { to: "/trips", icon: Repeat, key: "nav.trips" },
  { to: "/family", icon: Users, key: "nav.family" },
  { to: "/help", icon: HelpCircle, key: "nav.help" },
];
const BOTTOM: NavItem[] = [
  { to: "/accessibility", icon: A11y, key: "nav.accessibility" },
  { to: "/data-sources", icon: Database, key: "nav.dataSources" },
  { to: "/admin-demo", icon: Settings2, key: "nav.adminDemo" },
];

const MOBILE_NAV: NavItem[] = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/search", icon: Search, key: "nav.search" },
  { to: "/tickets", icon: Ticket, key: "nav.tickets" },
  { to: "/queue", icon: Timer, key: "nav.queue" },
  { to: "/accessibility", icon: A11y, key: "nav.accessibility" },
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

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <DemoBanner />
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground">
          <div className="p-4 border-b"><MrtBrandLogo /></div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "hover:bg-sidebar-accent hover:translate-x-0.5"
                )}>
                  <span className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary-foreground transition-all duration-300 ease-out",
                    active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
                  )} />
                  <n.icon className={cn("size-4 transition-transform duration-300 ease-out", active ? "scale-110" : "group-hover:scale-110")} /> {t(n.key)}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t space-y-0.5">
              {BOTTOM.map((n) => {
                const active = pathname.startsWith(n.to);
                return (
                  <Link key={n.to} to={n.to} className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 ease-out",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-sidebar-accent hover:translate-x-0.5"
                  )}>
                    <n.icon className={cn("size-4 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} /> {t(n.key)}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="p-3 border-t space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={toggleLang} aria-label={t("common.language")}>
              <Languages className="size-4" /> {profile.preferredLanguage === "th" ? "ไทย" : "English"}
            </Button>
            <div className="text-xs text-muted-foreground px-2">
              {profile.displayName} · Guest
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-card/85 backdrop-blur-md shadow-sm transition-shadow duration-300">
            <MrtBrandLogo size={30} />
            <Button variant="ghost" size="sm" onClick={toggleLang} aria-label={t("common.language")}>
              <Languages className="size-4 mr-1" />
              {profile.preferredLanguage === "th" ? "TH" : "EN"}
            </Button>
          </header>

          <main key={pathname} className="flex-1 min-w-0 overflow-x-hidden pb-20 lg:pb-0 animate-fade-in">
            {children}
          </main>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/85 backdrop-blur-md border-t shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] grid grid-cols-5">
            {MOBILE_NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              const isTicket = n.to === "/tickets" && readyTicket;
              return (
                <Link key={n.to} to={n.to} className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] min-h-14 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  active ? "text-primary" : "text-muted-foreground",
                  isTicket && "text-primary"
                )}>
                  <span className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active ? "w-8 opacity-100" : "w-0 opacity-0"
                  )} />
                  <div className={cn(
                    "grid place-items-center size-8 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isTicket && !active && "bg-primary text-primary-foreground",
                    active ? "bg-primary/10 scale-110 -translate-y-0.5" : "scale-100"
                  )}>
                    <n.icon className="size-4" />
                  </div>
                  <span className="truncate max-w-full px-1">{t(n.key)}</span>
                </Link>
              );
            })}

          </nav>
        </div>
      </div>
    </div>
  );
}
