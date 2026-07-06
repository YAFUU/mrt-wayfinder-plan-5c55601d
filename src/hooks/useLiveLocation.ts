import { useEffect, useState } from "react";
import { nearestStations } from "@/services/routeService";
import type { MrtStation } from "@/types/mrt";

export interface LiveLocationState {
  status: "idle" | "requesting" | "watching" | "denied" | "unsupported" | "error";
  coords: { lat: number; lng: number } | null;
  accuracy: number | null;
  nearestStation: MrtStation | null;
  distanceMeters: number | null;
  updatedAt: number | null;
  error?: string;
  start: () => void;
  stop: () => void;
}

/** Watches the user's position and computes the nearest MRT station live. */
export function useLiveLocation(autoStart = false): LiveLocationState {
  const [status, setStatus] = useState<LiveLocationState["status"]>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [watchId, setWatchId] = useState<number | null>(null);

  const start = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setUpdatedAt(Date.now());
        setStatus("watching");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    setWatchId(id);
  };

  const stop = () => {
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
  };

  useEffect(() => {
    if (autoStart) start();
    return () => {
      if (watchId != null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearest = coords ? nearestStations(coords, 1)[0] : null;

  return {
    status,
    coords,
    accuracy,
    nearestStation: nearest?.station ?? null,
    distanceMeters: nearest?.meters ?? null,
    updatedAt,
    error,
    start,
    stop,
  };
}
