import type {
  AuthAccount,
  PaymentTransaction,
  SavedTrip,
  SupportRequest,
  Ticket,
  TicketStatus,
  UserProfile,
  WalletTransaction,
} from "@/types/mrt";

const KEY = "mrt-quickpass:v2";

interface Store {
  profile: UserProfile;
  tickets: Ticket[];
  transactions: PaymentTransaction[];
  savedTrips: SavedTrip[];
  supportRequests: SupportRequest[];
  recentSearches: string[];
  wallet: WalletTransaction[];
  accounts: AuthAccount[];
}

function defaultProfile(): UserProfile {
  return {
    id: "guest-" + Math.random().toString(36).slice(2, 10),
    isGuest: true,
    isAuthenticated: false,
    displayName: "ผู้เยี่ยมชม",
    preferredLanguage: "th",
    fontSize: "normal",
    highContrast: false,
    reduceMotion: false,
    autoBrightnessOnQr: true,
    hasSeenTour: false,
    walletBalance: 0,
    createdAt: new Date().toISOString(),
  };
}

function emptyStore(): Store {
  return {
    profile: defaultProfile(),
    tickets: [],
    transactions: [],
    savedTrips: [],
    supportRequests: [],
    recentSearches: [],
    wallet: [],
    accounts: [],
  };
}

function load(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return { ...emptyStore(), ...parsed, profile: { ...defaultProfile(), ...parsed.profile } };
  } catch {
    const s = emptyStore();
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

function id(prefix: string) {
  return prefix + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Simple non-crypto hash — demo only.
function hashPw(pw: string) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  return "h_" + (h >>> 0).toString(36);
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

  // ==== Wallet ====
  getWalletBalance(): number {
    return state().profile.walletBalance ?? 0;
  },
  listWalletTx(): WalletTransaction[] {
    return [...state().wallet].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  walletTopUp(amount: number, note?: string): WalletTransaction {
    const s = state();
    const bal = (s.profile.walletBalance ?? 0) + amount;
    s.profile.walletBalance = bal;
    const tx: WalletTransaction = {
      id: id("WLT"), userId: s.profile.id, type: "topup", amount, balanceAfter: bal,
      note, createdAt: new Date().toISOString(),
    };
    s.wallet.push(tx);
    save();
    return tx;
  },
  walletSpend(amount: number, note?: string): WalletTransaction | null {
    const s = state();
    const cur = s.profile.walletBalance ?? 0;
    if (cur < amount) return null;
    const bal = cur - amount;
    s.profile.walletBalance = bal;
    const tx: WalletTransaction = {
      id: id("WLT"), userId: s.profile.id, type: "spend", amount, balanceAfter: bal,
      note, createdAt: new Date().toISOString(),
    };
    s.wallet.push(tx);
    save();
    return tx;
  },

  // ==== Auth (demo only, localStorage) ====
  register(email: string, password: string, displayName: string): { ok: boolean; error?: string } {
    const s = state();
    const norm = email.trim().toLowerCase();
    if (s.accounts.some((a) => a.email === norm)) return { ok: false, error: "อีเมลนี้ถูกใช้แล้ว" };
    const acc: AuthAccount = { email: norm, passwordHash: hashPw(password), displayName, createdAt: new Date().toISOString() };
    s.accounts.push(acc);
    s.profile = {
      ...s.profile,
      isGuest: false,
      isAuthenticated: true,
      email: norm,
      displayName,
    };
    save();
    return { ok: true };
  },
  login(email: string, password: string): { ok: boolean; error?: string } {
    const s = state();
    const norm = email.trim().toLowerCase();
    const acc = s.accounts.find((a) => a.email === norm);
    if (!acc || acc.passwordHash !== hashPw(password)) return { ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    s.profile = {
      ...s.profile,
      isGuest: false,
      isAuthenticated: true,
      email: norm,
      displayName: acc.displayName,
    };
    save();
    return { ok: true };
  },
  accountExists(email: string): boolean {
    const norm = email.trim().toLowerCase();
    return state().accounts.some((a) => a.email === norm);
  },
  resetPassword(email: string, newPassword: string): { ok: boolean; error?: string } {
    const s = state();
    const norm = email.trim().toLowerCase();
    const acc = s.accounts.find((a) => a.email === norm);
    if (!acc) return { ok: false, error: "ไม่พบบัญชีนี้ในระบบ" };
    acc.passwordHash = hashPw(newPassword);
    save();
    return { ok: true };
  },
  logout() {
    const s = state();
    s.profile = {
      ...s.profile,
      isGuest: true,
      isAuthenticated: false,
      email: undefined,
      displayName: "ผู้เยี่ยมชม",
    };
    save();
  },

  reset() {
    cache = emptyStore();
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
