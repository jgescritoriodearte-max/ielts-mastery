/* Error Bank logic (pure functions). One ErrorStat per category (see taxonomy.ts).
   Distinguishes: occasional vs recurring errors; weak / developing / consolidated; relapse after consolidation.
   ALL thresholds below are PROJECT ESTIMATES (design choices to be calibrated with the user's own data), not research results. */
import type { ErrorStat, Mistake } from "./types";
import { catAreas, catDef } from "./taxonomy";
import { addDays, todayKey } from "./util";

export type ErrStatus = "weak" | "developing" | "consolidated";
export const RECUR_WINDOW_DAYS = 30;   // an error is "recurring" if it happened at least RECUR_MIN times in this window
export const RECUR_MIN = 3;
export const CONSOLIDATED_STREAK = 5;  // correct answers in a row in this category...
export const QUIET_DAYS = 14;          // ...and no error for this many days
export const WEAK_STREAK = 3;          // a recurring category stays "weak" until this many correct in a row
export const HALF_LIFE_DAYS = 14;      // recency weighting: an error counts half after this many days
export const MAX_EVENTS = 80;
export const RECHECK_DAYS = [1, 3, 7]; // spaced re-check ladder for an individual mistake (correct answers move up it)

const DAY = 864e5;
export const blankStat = (cat: string, area: string, now: number): ErrorStat => ({
  id: cat, updatedAt: now, cat, area, first: now, last: 0, total: 0, events: [], eventAreas: [], streak: 0, relapses: 0, lastStatus: "developing", src: {}, ex: [],
});

export interface Class { status: ErrStatus; recurring: boolean; recent: number; relapsed: boolean; quietDays: number; }
export function classify(s: ErrorStat, now = Date.now()): Class {
  const recent = s.events.filter((t) => now - t <= RECUR_WINDOW_DAYS * DAY).length;
  const quietDays = s.last ? Math.floor((now - s.last) / DAY) : 999;
  const recurring = recent >= RECUR_MIN || (s.relapses > 0 && recent >= 2);
  let status: ErrStatus = "developing";
  if (s.streak >= CONSOLIDATED_STREAK && quietDays >= QUIET_DAYS) status = "consolidated";
  else if (recurring && s.streak < WEAK_STREAK) status = "weak";
  return { status, recurring, recent, relapsed: s.relapses > 0, quietDays };
}

/** Recency-weighted count of errors (optionally for one skill area). */
export function load(s: ErrorStat, now = Date.now(), area?: string): number {
  let t = 0;
  s.events.forEach((ts, i) => { if (!area || s.eventAreas[i] === area) t += Math.pow(0.5, (now - ts) / DAY / HALF_LIFE_DAYS); });
  return t;
}

/** Records one error. `area` is the skill the answer came from (W, G, L, R, S, V, P). */
export function recordError(prev: ErrorStat | undefined, cat: string, area: string, src: string, now: number, ex?: { a: string; b: string }): ErrorStat {
  const s: ErrorStat = prev ? { ...prev, events: prev.events.slice(), eventAreas: prev.eventAreas.slice(), src: { ...prev.src }, ex: prev.ex.slice() } : blankStat(cat, area, now);
  if (prev && classify(prev, now).status === "consolidated") s.relapses += 1;
  s.events.push(now); s.eventAreas.push(area);
  if (s.events.length > MAX_EVENTS) { s.events.shift(); s.eventAreas.shift(); }
  s.total += 1; s.last = now; s.streak = 0; s.updatedAt = now;
  s.src[src] = (s.src[src] || 0) + 1;
  if (ex && (ex.a || ex.b)) { s.ex.push({ a: ex.a.slice(0, 140), b: ex.b.slice(0, 140) }); if (s.ex.length > 5) s.ex.shift(); }
  s.lastStatus = classify(s, now).status;
  return s;
}

/** A correct answer in a category that already has errors raises its streak. Categories never failed are not tracked (returns undefined). */
export function recordCorrect(prev: ErrorStat | undefined, now: number): ErrorStat | undefined {
  if (!prev) return undefined;
  const s: ErrorStat = { ...prev, streak: prev.streak + 1, updatedAt: now };
  s.lastStatus = classify(s, now).status;
  return s;
}

/** Moves the latest event of a category to another one (the user refined the cause of a Listening miss). */
export function moveEvent(from: ErrorStat | undefined, to: ErrorStat | undefined, cat: string, area: string, now: number, ts: number): { from?: ErrorStat; to: ErrorStat } {
  let f = from;
  if (f) {
    let i = -1, best = Infinity;
    f.events.forEach((t, k) => { const d = Math.abs(t - ts); if (d < best) { best = d; i = k; } });
    if (i >= 0 && best < 5 * 60 * 1000) {
      const ev = f.events.slice(), ea = f.eventAreas.slice(); ev.splice(i, 1); ea.splice(i, 1);
      f = { ...f, events: ev, eventAreas: ea, total: Math.max(0, f.total - 1), updatedAt: now };
    }
  }
  return { from: f, to: recordError(to, cat, area, "refined", ts) };
}

/** Spaced re-check of one mistake: correct moves up the ladder, wrong comes back tomorrow. Resolved after 2 correct (unchanged rule). */
export function nextMistakeState(m: Mistake, ok: boolean, now = new Date()): Pick<Mistake, "reviewOk" | "reviewCount" | "resolved" | "due"> {
  const reviewOk = ok ? m.reviewOk + 1 : 0;
  const step = Math.min(RECHECK_DAYS.length - 1, reviewOk);
  return { reviewOk, reviewCount: m.reviewCount + 1, resolved: ok ? reviewOk >= 2 : false, due: todayKey(addDays(now, ok ? RECHECK_DAYS[step] : 1)) };
}
export const mistakeDue = (m: Mistake): boolean => !m.resolved && (!m.due || m.due <= todayKey());

export const catArea = (cat: string): string => catAreas(cat)[0] || "W";
export const catSeverity = (cat: string): number => catDef(cat).sev;
