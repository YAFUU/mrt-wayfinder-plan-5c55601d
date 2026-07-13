import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoutePreference } from "@/services/routeService";

interface TripState {
  originId: string | null;
  destinationId: string | null;
  preference: RoutePreference;
  passengers: number;
  setOrigin: (id: string | null) => void;
  setDestination: (id: string | null) => void;
  swap: () => void;
  setPreference: (p: RoutePreference) => void;
  setPassengers: (n: number) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      originId: null,
      destinationId: null,
      preference: "fastest",
      passengers: 1,
      setOrigin: (id) => set({ originId: id }),
      setDestination: (id) => set({ destinationId: id }),
      swap: () => set((s) => ({ originId: s.destinationId, destinationId: s.originId })),
      setPreference: (preference) => set({ preference }),
      setPassengers: (passengers) => set({ passengers: Math.min(6, Math.max(1, passengers)) }),
      reset: () => set({ originId: null, destinationId: null, passengers: 1 }),
    }),
    { name: "mrt-trip" },
  ),
);
