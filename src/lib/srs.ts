/* Local spaced repetition (SM-2 style). States: New → Learning → Review → Mastered. */
import type { VocabState } from "./types";
import { addDays, todayKey } from "./util";

export type Grade = 0 | 1 | 2 | 3; // again, hard, good, easy
export type WordStatus = "New" | "Learning" | "Review" | "Mastered";

export const blank = (id: string): VocabState => ({
  id, updatedAt: 0, reps: 0, interval: 0, ease: 2.5, due: todayKey(), lapses: 0, seen: 0, ok: 0, bad: 0, lastTs: 0,
});

export function grade(prev: VocabState | undefined, id: string, g: Grade): VocabState {
  const v = { ...(prev || blank(id)) };
  v.seen += 1;
  v.lastTs = Date.now();
  if (!v.first) v.first = v.lastTs;
  if (g === 0) {
    v.reps = 0; v.interval = 0; v.lapses += 1; v.bad += 1; v.ease = Math.max(1.3, v.ease - 0.2);
  } else {
    v.ok += 1;
    if (g === 1) { v.interval = Math.max(1, Math.round(v.interval * 1.2)); v.ease = Math.max(1.3, v.ease - 0.15); }
    else if (g === 2) v.interval = v.reps === 0 ? 1 : v.reps === 1 ? 3 : Math.round(v.interval * v.ease);
    else { v.interval = v.reps === 0 ? 3 : Math.round(Math.max(1, v.interval) * v.ease * 1.3); v.ease += 0.15; }
    v.reps += 1;
  }
  v.due = todayKey(addDays(new Date(), v.interval));
  v.updatedAt = Date.now();
  return v;
}

export function status(v?: VocabState): WordStatus {
  if (!v || v.seen === 0) return "New";
  if (v.interval >= 21) return "Mastered";
  if (v.interval >= 3) return "Review";
  return "Learning";
}

export const isDue = (v?: VocabState): boolean => !!v && v.seen > 0 && v.due <= todayKey();
export const repeatedlyMissed = (v?: VocabState): boolean => !!v && v.bad >= 3 && v.bad > v.ok;
