import type {
  PaymentTransaction,
  SavedTrip,
  SupportRequest,
  Ticket,
  TicketStatus,
  UserProfile,
} from "@/types/mrt";

const KEY = "mrt-quickpass:v1";

interface Store {
  profile: UserProfile;
  tickets: Ticket[];
  transactions: PaymentTransaction[];
  savedTrips: SavedTrip[];
  supportRequests: SupportRequest[];
  recentSearches: string[];
}

function defaultProfile(): UserProfile {
  return {
    id: "guest-" + Math.random().toString(36).slice(2, 10),
    isGuest: true,
    displayName: "ผู้เยี่ยมชม",
    preferredLanguage: "th",
    fontSize: "normal",
    highContrast: false,
    reduceMotion: false,
    autoBrightnessOnQr: true,
    createdAt: new Date().toISOString(),
  };
}

function load(): Store {
  if (typeof window === "undefined") {
    return {
      profile: defaultProfile(),
      tickets: [],
      transactions: [],
      savedTrips: [],
      supportRequests: [],
      recentSearches: [],
    };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) throw new Error("empty");
    return JSON.parse(raw) as Store;
  } catch {
    const s: Store = {
      profile: defaultProfile(),
      tickets: [],
      transactions: [],
      savedTrips: [],
      supportRequests: [],
      recentSearches: [],
    };
    persist(s);
    return s;
  }
}

function persist(s: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("mrt:store-update"));
}

let cache: Store | null = null;
function state(): Store {
  if (!cache) cache = load();
  return cache;
}

function save() {
  if (cache) persist(cache);
}

export const storage = {
  getProfile(): UserProfile {
    return state().profile;
  },
  updateProfile(patch: Partial<UserProfile>) {
    state().profile = { ...state().profile, ...patch };
    save();
    return state().profile;
  },
  listTickets(): Ticket[] {
    return [...state().tickets].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  getTicket(id: string): Ticket | null {
    return state().tickets.find((t) => t.id === id) ?? null;
  },
  createTicket(t: Ticket) {
    state().tickets.push(t);
    save();
    return t;
  },
  updateTicket(id: string, patch: Partial<Ticket>) {
    const t = state().tickets.find((x) => x.id === id);
    if (!t) return null;
    Object.assign(t, patch, { updatedAt: new Date().toISOString() });
    save();
    return t;
  },
  setTicketStatus(id: string, status: TicketStatus) {
    return this.updateTicket(id, { status });
  },
  listTransactions() {
    return [...state().transactions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  getTransaction(id: string) {
    return state().transactions.find((t) => t.id === id) ?? null;
  },
  createTransaction(t: PaymentTransaction) {
    state().transactions.push(t);
    save();
    return t;
  },
  updateTransaction(id: string, patch: Partial<PaymentTransaction>) {
    const t = state().transactions.find((x) => x.id === id);
    if (!t) return null;
    Object.assign(t, patch, { updatedAt: new Date().toISOString() });
    save();
    return t;
  },
  listSavedTrips() {
    return [...state().savedTrips].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },
  addSavedTrip(t: SavedTrip) {
    state().savedTrips.push(t);
    save();
    return t;
  },
  removeSavedTrip(id: string) {
    state().savedTrips = state().savedTrips.filter((t) => t.id !== id);
    save();
  },
  listSupport() {
    return [...state().supportRequests].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  addSupport(r: SupportRequest) {
    state().supportRequests.push(r);
    save();
    return r;
  },
  addRecentSearch(term: string) {
    const s = state();
    s.recentSearches = [term, ...s.recentSearches.filter((x) => x !== term)].slice(0, 8);
    save();
  },
  getRecentSearches() {
    return state().recentSearches;
  },
  reset() {
    cache = {
      profile: defaultProfile(),
      tickets: [],
      transactions: [],
      savedTrips: [],
      supportRequests: [],
      recentSearches: [],
    };
    save();
  },
};

/** Subscribe to changes (returns unsubscribe fn). */
export function subscribeStore(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("mrt:store-update", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("mrt:store-update", handler);
    window.removeEventListener("storage", handler);
  };
}
