/* Local spaced repetition (SM-2 style), now with TWO AXES per item:
     rec  = recognition (can I understand / pick it?)      -> legacy top-level fields of VocabState (no migration)
     prod = production  (can I write / say it myself?)     -> VocabState.prod
   Interval rules are the SAME as before (SM-2 style). New: response-time tracking, a streak, an exam-date cap, and stage/knowledge labels.
   Everything marked ESTIMATE below is a PROJECT DESIGN CHOICE, not a research result. */
import type { AxisState, VocabState } from "./types";
import { addDays, dateFromKey, daysBetween, todayKey } from "./util";

export type Grade = 0 | 1 | 2 | 3; // again, hard, good, easy
export type WordStatus = "New" | "Learning" | "Review" | "Mastered";   // legacy labels (recognition axis), kept for the UI
export type Axis = "rec" | "prod";
export type Stage = "new" | "learning" | "consolidated";
export type Knowledge = "none" | "acquired" | "automated";

/* ESTIMATES (project design) */
export const CONSOLIDATED_DAYS = 21;      // interval needed to call an item consolidated (same threshold the app already used for "Mastered")
export const CONSOLIDATED_STREAK = 3;     // and at least this many correct answers in a row
export const AUTO_MS: Record<Axis, number> = { rec: 4000, prod: 12000 };  // average response time at/below which a consolidated item counts as "automated"
export const EMA_ALPHA = 0.35;            // weight of the newest response time in the moving average
export const EXAM_CAP_DIVISOR = 3;        // ESTIMATE: an interval may not exceed (days to exam / 3), so every item is seen again before the exam

export const blankAxis = (): AxisState => ({ reps: 0, interval: 0, ease: 2.5, due: todayKey(), lapses: 0, seen: 0, ok: 0, bad: 0, lastTs: 0, streak: 0, emaMs: 0 });

export const blank = (id: string): VocabState => ({
  id, updatedAt: 0, reps: 0, interval: 0, ease: 2.5, due: todayKey(), lapses: 0, seen: 0, ok: 0, bad: 0, lastTs: 0, streak: 0, emaMs: 0,
});

/** One SM-2 step on a single axis. Same interval arithmetic as the original grade(); adds timing, streak and the exam cap. */
export function stepAxis(prev: AxisState | undefined, g: Grade, ms = 0, daysToExam?: number | null): AxisState {
  const v: AxisState = { ...(prev || blankAxis()) };
  v.seen += 1;
  v.lastTs = Date.now();
  if (ms > 0) v.emaMs = v.emaMs > 0 ? Math.round(v.emaMs * (1 - EMA_ALPHA) + ms * EMA_ALPHA) : Math.round(ms);
  if (g === 0) {
    v.reps = 0; v.interval = 0; v.lapses += 1; v.bad += 1; v.ease = Math.max(1.3, v.ease - 0.2); v.streak = 0;
  } else {
    v.ok += 1; v.streak = (v.streak || 0) + 1;
    if (g === 1) { v.interval = Math.max(1, Math.round(v.interval * 1.2)); v.ease = Math.max(1.3, v.ease - 0.15); }
    else if (g === 2) v.interval = v.reps === 0 ? 1 : v.reps === 1 ? 3 : Math.round(v.interval * v.ease);
    else { v.interval = v.reps === 0 ? 3 : Math.round(Math.max(1, v.interval) * v.ease * 1.3); v.ease += 0.15; }
    v.reps += 1;
  }
  if (daysToExam != null && daysToExam > 0) v.interval = Math.min(v.interval, Math.max(1, Math.floor(daysToExam / EXAM_CAP_DIVISOR)));
  v.due = todayKey(addDays(new Date(), v.interval));
  return v;
}

/** View the recognition axis of a word as an AxisState, and write it back. */
export const recAxis = (v?: VocabState): AxisState | undefined => v && ({ reps: v.reps, interval: v.interval, ease: v.ease, due: v.due, lapses: v.lapses, seen: v.seen, ok: v.ok, bad: v.bad, lastTs: v.lastTs, streak: v.streak || 0, emaMs: v.emaMs || 0 });
export const axisOf = (v: VocabState | undefined, axis: Axis): AxisState | undefined => (axis === "rec" ? recAxis(v) : v?.prod);

/** Grades one axis of a word. Recognition keeps writing to the legacy top-level fields, production to `prod`. */
export function gradeAxis(prev: VocabState | undefined, id: string, axis: Axis, g: Grade, ms = 0, daysToExam?: number | null): VocabState {
  const v = { ...(prev || blank(id)) };
  const a = stepAxis(axisOf(prev, axis), g, ms, daysToExam);
  if (axis === "rec") {
    Object.assign(v, { reps: a.reps, interval: a.interval, ease: a.ease, due: a.due, lapses: a.lapses, seen: a.seen, ok: a.ok, bad: a.bad, lastTs: a.lastTs, streak: a.streak, emaMs: a.emaMs });
    if (!v.first) v.first = a.lastTs;
  } else v.prod = a;
  v.updatedAt = Date.now();
  return v;
}

/** Backward-compatible: grades the recognition axis (this is what flashcards and multiple-choice quizzes call). */
export const grade = (prev: VocabState | undefined, id: string, g: Grade, ms = 0, daysToExam?: number | null): VocabState => gradeAxis(prev, id, "rec", g, ms, daysToExam);

export const daysToExamOf = (examDate?: string): number | null => {
  if (!examDate) return null;
  const d = daysBetween(new Date(), dateFromKey(examDate));
  return d > 0 ? d : null;
};

/* ---------------- stages and knowledge states ---------------- */
export const stageOf = (a?: AxisState): Stage => {
  if (!a || a.seen === 0) return "new";
  return a.interval >= CONSOLIDATED_DAYS && a.streak >= CONSOLIDATED_STREAK ? "consolidated" : "learning";
};
/** none = never answered correctly yet; acquired = answers correctly; automated = consolidated AND answered fast enough (needs timing data). */
export const knowledgeOf = (a: AxisState | undefined, axis: Axis): Knowledge => {
  if (!a || a.seen === 0 || a.ok === 0) return "none";
  if (stageOf(a) === "consolidated" && a.emaMs > 0 && a.emaMs <= AUTO_MS[axis]) return "automated";
  return a.streak >= 1 ? "acquired" : "none";
};

export interface WordProfile { rec: Stage; prod: Stage; recK: Knowledge; prodK: Knowledge; productionGap: boolean; }
/** Production gap = I recognise it (seen and mostly right on the recognition axis) but I do not yet produce it. */
export function wordProfile(v?: VocabState): WordProfile {
  const r = recAxis(v), p = v?.prod;
  const recognised = !!r && r.seen > 0 && r.ok > 0 && r.ok >= r.bad;
  const prodWeak = !p || p.seen === 0 || p.bad > p.ok || (stageOf(p) === "learning" && p.streak === 0);
  return { rec: stageOf(r), prod: stageOf(p), recK: knowledgeOf(r, "rec"), prodK: knowledgeOf(p, "prod"), productionGap: recognised && prodWeak };
}

/* ---------------- legacy helpers (unchanged behaviour on the recognition axis) ---------------- */
export function status(v?: VocabState): WordStatus {
  if (!v || v.seen === 0) return "New";
  if (v.interval >= 21) return "Mastered";
  if (v.interval >= 3) return "Review";
  return "Learning";
}
const dueAxis = (a?: AxisState) => !!a && a.seen > 0 && a.due <= todayKey();
/** A word is due when EITHER axis is due. */
export const isDue = (v?: VocabState): boolean => !!v && (dueAxis(recAxis(v)) || dueAxis(v.prod));
export const isDueAxis = (v: VocabState | undefined, axis: Axis): boolean => dueAxis(axisOf(v, axis));
export const repeatedlyMissed = (v?: VocabState): boolean => !!v && ((v.bad >= 3 && v.bad > v.ok) || (!!v.prod && v.prod.bad >= 3 && v.prod.bad > v.prod.ok));
