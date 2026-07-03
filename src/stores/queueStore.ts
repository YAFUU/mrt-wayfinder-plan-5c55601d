import { create } from "zustand";
import { INITIAL_QUEUE } from "@/data/network";
import type { QueueDemo } from "@/types/mrt";

interface QueueState {
  items: QueueDemo[];
  history: Record<string, Array<{ t: number; wait: number }>>;
  updateStation: (stationId: string, patch: Partial<QueueDemo>) => void;
  reset: () => void;
  tick: () => void;
}

const buildHistory = (items: QueueDemo[]) => {
  const now = Date.now();
  const h: QueueState["history"] = {};
  for (const it of items) {
    const arr: Array<{ t: number; wait: number }> = [];
    for (let i = 11; i >= 0; i--) {
      arr.push({
        t: now - i * 5 * 60_000,
        wait: Math.max(1, it.estimatedWaitMinutes + Math.round((Math.random() - 0.5) * 4)),
      });
    }
    h[it.stationId] = arr;
  }
  return h;
};

export const useQueueStore = create<QueueState>((set) => ({
  items: INITIAL_QUEUE,
  history: buildHistory(INITIAL_QUEUE),
  updateStation: (stationId, patch) =>
    set((s) => {
      const items = s.items.map((it) =>
        it.stationId === stationId
          ? { ...it, ...patch, updatedAt: new Date().toISOString() }
          : it,
      );
      const target = items.find((i) => i.stationId === stationId);
      const history = { ...s.history };
      if (target) {
        const prev = history[stationId] ?? [];
        history[stationId] = [...prev.slice(-11), { t: Date.now(), wait: target.estimatedWaitMinutes }];
      }
      return { items, history };
    }),
  reset: () =>
    set(() => ({
      items: INITIAL_QUEUE.map((x) => ({ ...x, updatedAt: new Date().toISOString() })),
      history: buildHistory(INITIAL_QUEUE),
    })),
  tick: () =>
    set((s) => {
      const items = s.items.map((it) => {
        const delta = it.trend === "up" ? 1 : it.trend === "down" ? -1 : 0;
        const wait = Math.max(0, Math.min(20, it.estimatedWaitMinutes + delta));
        const status: QueueDemo["queueStatus"] =
          wait <= 2 ? "low" : wait <= 6 ? "medium" : wait <= 12 ? "high" : "very_high";
        return { ...it, estimatedWaitMinutes: wait, queueStatus: status, updatedAt: new Date().toISOString() };
      });
      const history = { ...s.history };
      for (const it of items) {
        const prev = history[it.stationId] ?? [];
        history[it.stationId] = [...prev.slice(-11), { t: Date.now(), wait: it.estimatedWaitMinutes }];
      }
      return { items, history };
    }),
}));
