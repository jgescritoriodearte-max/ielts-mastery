/* Derived statistics: skill estimates, streaks, accuracy. Pure functions over the store state. */
import type { State } from "./store";
import type { Attempt, Skill } from "./types";
import { criteriaBand, overallBand, roundBand, writingBand } from "./bands";
import { addDays, dateFromKey, todayKey } from "./util";
import { status } from "./srs";

export type Source = "app" | "ai" | "self" | "declared" | null;
export interface Estimate { band: number | null; source: Source; n: number; }

const SCORED = new Set(["practice", "diagnostic", "mock"]);

export function lrEstimate(attempts: Attempt[], skill: "L" | "R", upTo = Infinity): Estimate {
  const list = attempts.filter((a) => a.skill === skill && SCORED.has(a.kind) && a.band != null && a.ts <= upTo).sort((a, b) => b.ts - a.ts);
  let q = 0, w = 0, acc = 0, i = 0;
  for (const a of list) {
    if (q >= 80) break;
    const weight = a.total * Math.pow(0.85, i++);
    acc += (a.band as number) * weight; w += weight; q += a.total;
  }
  if (q < 10 || !w) return { band: null, source: null, n: q };
  return { band: roundBand(acc / w), source: "app", n: q };
}

export function writingEstimate(s: State, upTo = Infinity): Estimate {
  const subs = s.writings.filter((w) => w.status === "submitted" && (w.submittedAt || 0) <= upTo);
  const bandOf = (w: (typeof subs)[number]) => (w.ai?.overall ?? criteriaBand(Object.values(w.self || {})));
  const pickTask = (t: 1 | 2) => subs.filter((w) => w.task === t && bandOf(w) != null).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)).slice(0, 3);
  const t1 = pickTask(1), t2 = pickTask(2);
  if (!t1.length && !t2.length) return { band: null, source: null, n: 0 };
  const avg = (l: typeof t1) => (l.length ? roundBand(l.reduce((x, w) => x + (bandOf(w) as number), 0) / l.length) : null);
  const ai = [...t1, ...t2].some((w) => w.ai?.overall != null);
  return { band: writingBand(avg(t1), avg(t2)), source: ai ? "ai" : "self", n: t1.length + t2.length };
}

export function speakingEstimate(s: State, upTo = Infinity): Estimate {
  const recs = s.recordings.filter((r) => r.part > 0 && r.createdAt <= upTo)
    .map((r) => ({ r, b: r.ai?.overall ?? criteriaBand(Object.values(r.self || {})) }))
    .filter((x) => x.b != null).sort((a, b) => b.r.createdAt - a.r.createdAt).slice(0, 4);
  if (!recs.length) return { band: null, source: null, n: 0 };
  const ai = recs.some((x) => x.r.ai?.overall != null);
  return { band: roundBand(recs.reduce((a, x) => a + (x.b as number), 0) / recs.length), source: ai ? "ai" : "self", n: recs.length };
}

export function estimates(s: State): Record<Skill, Estimate> & { overall: number | null; complete: boolean } {
  const e: Record<Skill, Estimate> = {
    L: lrEstimate(s.attempts, "L"), R: lrEstimate(s.attempts, "R"), W: writingEstimate(s), S: speakingEstimate(s),
  };
  (["L", "R", "W", "S"] as Skill[]).forEach((k) => {
    if (e[k].band == null && s.profile.selfLevel?.[k] != null) e[k] = { band: s.profile.selfLevel[k] as number, source: "declared", n: 0 };
  });
  const overall = overallBand([e.L.band, e.R.band, e.W.band, e.S.band]);
  return { ...e, overall, complete: overall != null };
}

export const SOURCE_LABEL: Record<string, string> = {
  app: "from your answers", ai: "from imported Claude feedback", self: "self-assessed", declared: "your declared level",
};

/* ---- time series for charts ---- */
export interface Pt { ts: number; v: number; ext?: boolean; }
export function skillSeries(s: State, skill: Skill): Pt[] {
  if (skill === "L" || skill === "R") {
    const pts: Pt[] = [];
    for (const a of s.attempts.filter((x) => x.skill === skill && SCORED.has(x.kind))) {
      const e = lrEstimate(s.attempts, skill, a.ts);
      if (e.band != null) pts.push({ ts: a.ts, v: e.band });
    }
    return pts;
  }
  if (skill === "W") return s.writings.filter((w) => w.status === "submitted").map((w) => ({ ts: w.submittedAt || w.updatedAt, v: (w.ai?.overall ?? criteriaBand(Object.values(w.self || {}))) as number })).filter((p) => p.v != null).sort((a, b) => a.ts - b.ts);
  return s.recordings.filter((r) => r.part > 0).map((r) => ({ ts: r.createdAt, v: (r.ai?.overall ?? criteriaBand(Object.values(r.self || {}))) as number })).filter((p) => p.v != null).sort((a, b) => a.ts - b.ts);
}

export function overallSeries(s: State): Pt[] {
  const times = new Set<number>();
  s.attempts.forEach((a) => times.add(a.ts));
  s.writings.forEach((w) => w.submittedAt && times.add(w.submittedAt));
  s.recordings.forEach((r) => times.add(r.createdAt));
  const out: Pt[] = [];
  for (const t of [...times].sort((a, b) => a - b)) {
    const b = overallBand([lrEstimate(s.attempts, "L", t).band, lrEstimate(s.attempts, "R", t).band, writingEstimate(s, t).band, speakingEstimate(s, t).band]);
    if (b != null) out.push({ ts: t, v: b });
  }
  return out;
}

/* ---- accuracy ---- */
export function accuracyByType(s: State, skill?: "L" | "R", sinceTs = 0): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const a of s.attempts) {
    if (a.ts < sinceTs) continue;
    if (skill ? a.skill !== skill : !(a.skill === "L" || a.skill === "R")) continue;
    for (const [t, [c, n]] of Object.entries(a.byType || {})) {
      const k = skill ? t : `${a.skill === "L" ? "Listening" : "Reading"} · ${t}`;
      const o = out[k] || [0, 0]; out[k] = [o[0] + c, o[1] + n];
    }
  }
  return out;
}

export function tagCounts(s: State, skill: "L" | "R", sinceTs = 0): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of s.attempts) if (a.skill === skill && a.ts >= sinceTs) for (const [t, n] of Object.entries(a.tags || {})) out[t] = (out[t] || 0) + n;
  return out;
}

export function grammarAccuracy(s: State, sinceTs = 0): { byTopic: Record<string, [number, number]>; total: [number, number] } {
  const byTopic: Record<string, [number, number]> = {};
  let c = 0, n = 0;
  for (const a of s.attempts) if (a.skill === "G" && a.ts >= sinceTs) {
    for (const [t, [x, y]] of Object.entries(a.byType || {})) { const o = byTopic[t] || [0, 0]; byTopic[t] = [o[0] + x, o[1] + y]; }
    c += a.correct; n += a.total;
  }
  return { byTopic, total: [c, n] };
}

export function vocabCounts(s: State, allIds: string[]) {
  const c = { New: 0, Learning: 0, Review: 0, Mastered: 0, due: 0, missed: 0, learned: 0 };
  const today = todayKey();
  for (const id of allIds) {
    const v = s.vocab[id];
    const st = status(v);
    c[st]++;
    if (v && v.seen > 0 && v.due <= today) c.due++;
    if (v && v.bad >= 3 && v.bad > v.ok) c.missed++;
    if (st !== "New") c.learned++;
  }
  return c;
}

/* ---- streaks & time ---- */
export function dayTotals(s: State): Record<string, { minutes: number; items: number }> {
  const out: Record<string, { minutes: number; items: number }> = {};
  for (const x of Object.values(s.sessions)) {
    const d = x.id.slice(0, 10);
    const o = out[d] || { minutes: 0, items: 0 };
    out[d] = { minutes: o.minutes + x.minutes, items: o.items + x.items };
  }
  return out;
}
let _dtCache: { ref: unknown; v: Record<string, { minutes: number; items: number }> } | null = null;
const totals = (s: State) => { if (!_dtCache || _dtCache.ref !== s.sessions) _dtCache = { ref: s.sessions, v: dayTotals(s) }; return _dtCache.v; };
export const minutesOn = (s: State, k: string) => totals(s)[k]?.minutes || 0;
const activeDay = (s: State, k: string) => { const x = totals(s)[k]; return !!x && (x.minutes >= 5 || x.items > 0); };

export function streaks(s: State) {
  const today = new Date();
  let cur = 0;
  let d = activeDay(s, todayKey(today)) ? today : addDays(today, -1);
  while (activeDay(s, todayKey(d))) { cur++; d = addDays(d, -1); }
  const keys = Object.keys(totals(s)).filter((k) => activeDay(s, k)).sort();
  let longest = 0, run = 0, prev: string | null = null;
  for (const k of keys) {
    run = prev && todayKey(addDays(dateFromKey(prev), 1)) === k ? run + 1 : 1;
    longest = Math.max(longest, run); prev = k;
  }
  const month = todayKey(today).slice(0, 7);
  const daysThisMonth = keys.filter((k) => k.startsWith(month)).length;
  const totalMin = Object.values(s.sessions).reduce((a, x) => a + x.minutes, 0);
  const todayMin = minutesOn(s, todayKey());
  return { current: cur, longest: Math.max(longest, cur), daysThisMonth, totalMin, todayMin };
}

export function minutesSince(s: State, days: number): number {
  const from = todayKey(addDays(new Date(), -days + 1));
  return Object.entries(totals(s)).filter(([k]) => k >= from).reduce((a, [, x]) => a + x.minutes, 0);
}
