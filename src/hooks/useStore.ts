import { useEffect, useState } from "react";
import { storage, subscribeStore } from "@/services/storageService";
import type { UserProfile } from "@/types/mrt";

export function useProfile(): UserProfile {
  const [p, setP] = useState<UserProfile>(() => storage.getProfile());
  useEffect(() => subscribeStore(() => setP(storage.getProfile())), []);
  return p;
}

export function useTickets() {
  const [t, setT] = useState(() => storage.listTickets());
  useEffect(() => subscribeStore(() => setT(storage.listTickets())), []);
  return t;
}

export function useSavedTrips() {
  const [t, setT] = useState(() => storage.listSavedTrips());
  useEffect(() => subscribeStore(() => setT(storage.listSavedTrips())), []);
  return t;
}

export function useTransactions() {
  const [t, setT] = useState(() => storage.listTransactions());
  useEffect(() => subscribeStore(() => setT(storage.listTransactions())), []);
  return t;
}

export function useSupportRequests() {
  const [t, setT] = useState(() => storage.listSupport());
  useEffect(() => subscribeStore(() => setT(storage.listSupport())), []);
  return t;
}
