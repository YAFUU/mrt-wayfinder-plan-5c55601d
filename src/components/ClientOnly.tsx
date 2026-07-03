import { useEffect, useState, type ReactNode } from "react";

/** Renders children only after client-side mount (Leaflet, geolocation, etc.). */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
