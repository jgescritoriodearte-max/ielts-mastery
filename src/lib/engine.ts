/* Adaptive Engine v2: answers "what is my biggest deficiency right now, and which activity corrects it best?"
   Pure functions over the store state (no React, no IndexedDB), so they are unit-testable.

   THREE DIMENSIONS (requested by the user), combined multiplicatively for each skill area:
     importance  - how much the area matters for the user's goals. Starts from a PRIOR (Writing highest, Grammar and Listening very high,
                   Reading and Speaking maintenance) and relaxes toward neutral as evidence accumulates, so data gradually overrules the prior.
     weakness    - how far the user is from the target / how many recurring errors (0-1).
     recency     - how long since the area was practised or mastery shown (forgetting).
   score = importance x weakness x recency.

   !!! Every number in this file is a PROJECT ESTIMATE (design choice to be calibrated with the user's own data).
   !!! None of them comes from published research. The research only supports the general principles (retrieval, spacing, feedback). */
import type { State } from "./store";
import type { Content } from "./packs";
import type { Skill } from "./types";
import { estimates, grammarAccuracy } from "./stats";
import { catDef, catLabel, catAreas, topicsOfCat } from "./taxonomy";
import { classify, load, mistakeDue } from "./errorbank";
import { isDue, wordProfile } from "./srs";
import { daysBetween, dateFromKey, todayKey } from "./util";

export type CoreArea = "W" | "G" | "L" | "R" | "S";
export const CORE: CoreArea[] = ["W", "G", "L", "R", "S"];
export const AREA_LABEL: Record<CoreArea, string> = { W: "Writing", G: "Grammar", L: "Listening", R: "Reading", S: "Speaking" };

/* PROJECT ESTIMATES: initial importance, from the user's own statement (Writing > Grammar = Listening > Reading = Speaking). */
export const DEFAULT_PRIORS: Record<CoreArea, number> = { W: 1.0, G: 0.85, L: 0.85, R: 0.5, S: 0.5 };
export const PRIOR_LEVELS: { v: number; label: string }[] = [{ v: 1.0, label: "Highest" }, { v: 0.85, label: "Very high" }, { v: 0.65, label: "Medium" }, { v: 0.5, label: "Maintenance" }];
export const NEUTRAL_IMPORTANCE = 0.7;   // ESTIMATE: where a prior drifts as evidence grows
export const MAX_PRIOR_FADE = 0.5;       // ESTIMATE: the prior never fades more than 50% (the user's stated goals still count)
export const EVIDENCE_FOR_FULL_FADE = 60; // ESTIMATE: questions/tasks of evidence (last 60 days) at which the fade is maximal
export const UNKNOWN_WEAKNESS = 0.75;    // ESTIMATE: no data yet = treat as probably weak, so the baseline gets measured
export const UNKNOWN_WEAKNESS_S = 0.6;   // ESTIMATE: Speaking unknown is a bit lower (maintenance by default)
export const WEAKNESS_FLOOR = 0.15;      // ESTIMATE: even a strong area keeps a small share (maintenance)
export const GAP_FULL_BANDS = 1.5;       // ESTIMATE: a gap of 1.5 bands = maximum weakness (same scale the app already used)
export const ERR_BLEND = 0.35;           // ESTIMATE: share of weakness that comes from the Error Bank (the rest from bands/accuracy)
export const ERR_LOAD_FULL = 8;          // ESTIMATE: recency-weighted error count that saturates the error component
export const RECENCY_DAYS_FULL = 10;     // ESTIMATE: days without practice at which the recency factor is maximal
export const RECENCY_MIN = 0.8, RECENCY_MAX = 1.5;
export const MAINTENANCE_SHARE = 0.25;   // ESTIMATE: no core area gets less than 25% of the leader's weight in the daily plan

const DAY = 864e5;
export const priorsOf = (s: State): Record<CoreArea, number> => ({ ...DEFAULT_PRIORS, ...(s.profile.priors || {}) });

export interface AreaScore {
  area: CoreArea; label: string;
  importance: number; prior: number; weakness: number; recency: number; score: number;
  evidence: number; daysSince: number | null; band: number | null; target: number | null;
  reasons: string[];
}

function evidenceAndLast(s: State, area: CoreArea, since: number): { n: number; last: number } {
  let n = 0, last = 0;
  if (area === "L" || area === "R" || area === "G") {
    for (const a of s.attempts) if (a.skill === area && (area !== "G" || true)) { last = Math.max(last, a.ts); if (a.ts >= since) n += a.total; }
  } else if (area === "W") {
    for (const w of s.writings) { const t = w.submittedAt || w.updatedAt; if (w.status === "submitted") { last = Math.max(last, t); if (t >= since) n += w.ai || w.self ? 10 : 5; } }
  } else {
    for (const r of s.recordings) if (r.part > 0) { last = Math.max(last, r.createdAt); if (r.createdAt >= since) n += r.ai || r.self ? 10 : 5; }
  }
  return { n, last };
}

export function errorLoadOf(s: State, area: CoreArea, now: number): number {
  let t = 0;
  for (const st of Object.values(s.errors)) {
    if (!catAreas(st.cat).includes(area)) continue;
    // Count only events that really came from this area (a grammar-topic error is "G"; a writing error is "W"), except for Listening/Reading categories.
    t += load(st, now, area);
  }
  return t;
}

export function areaScores(s: State, now = Date.now()): AreaScore[] {
  const e = estimates(s);
  const priors = priorsOf(s);
  const since = now - 60 * DAY;
  const gAcc = grammarAccuracy(s, now - 30 * DAY).total;
  return CORE.map((area) => {
    const reasons: string[] = [];
    const { n, last } = evidenceAndLast(s, area, since);
    const prior = priors[area];
    const fade = MAX_PRIOR_FADE * Math.min(1, n / EVIDENCE_FOR_FULL_FADE);
    const importance = prior * (1 - fade) + NEUTRAL_IMPORTANCE * fade;
    let band: number | null = null, target: number | null = null, gapW: number | null = null;
    if (area === "G") {
      target = null;
      if (gAcc[1] >= 10) { const acc = gAcc[0] / gAcc[1]; gapW = Math.max(0, Math.min(1, (0.9 - acc) / 0.4)); reasons.push(`Grammar accuracy ${Math.round(acc * 100)}% in the last 30 days.`); }
      else reasons.push("Not enough Grammar data yet (fewer than 10 answers in 30 days).");
    } else {
      const k = area as Skill;
      band = e[k].band; target = s.profile.skillTargets?.[k] ?? s.profile.target;
      if (band != null) { gapW = Math.max(0, Math.min(1, (target - band) / GAP_FULL_BANDS)); reasons.push(band >= target ? `Estimated ${band.toFixed(1)} meets the target ${target.toFixed(1)}.` : `Estimated ${band.toFixed(1)} vs target ${target.toFixed(1)}.`); }
      else reasons.push(area === "W" || area === "S" ? "No assessed task yet." : "No scored attempts yet.");
    }
    const errLoad = errorLoadOf(s, area, now);
    const errN = Math.min(1, errLoad / ERR_LOAD_FULL);
    if (errLoad >= 1) reasons.push(`${errLoad.toFixed(1)} recency-weighted errors in the Error Bank.`);
    const unknown = area === "S" ? UNKNOWN_WEAKNESS_S : UNKNOWN_WEAKNESS;
    // Known level: blend the band/accuracy gap with the Error Bank. Unknown level: errors can only RAISE the "probably weak" baseline
    // (no errors recorded is not evidence of strength when nothing has been measured yet).
    const weakness = gapW == null ? Math.min(1, unknown + (1 - unknown) * ERR_BLEND * errN) : Math.max(WEAKNESS_FLOOR, (1 - ERR_BLEND) * gapW + ERR_BLEND * errN);
    const daysSince = last ? (now - last) / DAY : null;
    const recency = daysSince == null ? RECENCY_MAX : RECENCY_MIN + (RECENCY_MAX - RECENCY_MIN) * Math.min(1, daysSince / RECENCY_DAYS_FULL);
    if (daysSince == null) reasons.push("Never practised."); else if (daysSince >= 5) reasons.push(`Last practised ${Math.round(daysSince)} days ago.`);
    return { area, label: AREA_LABEL[area], importance, prior, weakness, recency, score: importance * weakness * recency, evidence: n, daysSince, band, target, reasons };
  }).sort((a, b) => b.score - a.score);
}

/* ---------------- concrete deficiencies and activities ---------------- */
export interface Deficiency {
  id: string; kind: "skill" | "error" | "production" | "review"; label: string; score: number; area?: CoreArea | "V";
  reasons: string[]; action: string; route: string; mins: number; cat?: string;
}

const importanceOf = (as: AreaScore[], areas: string[]): number => Math.max(0.4, ...as.filter((a) => areas.includes(a.area)).map((a) => a.importance));

export function errorDeficiencies(s: State, as: AreaScore[], now = Date.now()): Deficiency[] {
  const out: Deficiency[] = [];
  for (const st of Object.values(s.errors)) {
    const cls = classify(st, now);
    if (cls.status === "consolidated") continue;
    const L = load(st, now);
    if (L < 0.5) continue;
    const def = catDef(st.cat);
    const imp = importanceOf(as, def.areas);
    const score = imp * (def.sev / 3) * Math.min(1, L / 4) * (cls.recurring ? 1.5 : 1) * (cls.relapsed ? 1.2 : 1);
    const reasons = [`${cls.recent} error${cls.recent === 1 ? "" : "s"} in the last ${30} days (${cls.recurring ? "recurring" : "occasional"}${cls.relapsed ? ", came back after improving" : ""}).`, `${st.streak} correct in a row since the last error.`];
    const hasMistakes = s.mistakes.some((m) => !m.resolved && (m.cat === st.cat));
    out.push({
      id: "err:" + st.cat, kind: "error", label: catLabel(st.cat), score, area: (def.areas.find((a) => a === "W" || a === "G" || a === "L" || a === "R" || a === "S") as CoreArea) || undefined,
      reasons, mins: 10, cat: st.cat,
      action: hasMistakes ? `10-minute drill on "${catLabel(st.cat)}"` : `Production session on "${catLabel(st.cat)}"`,
      route: hasMistakes ? `#/mistakes/practice?cat=${encodeURIComponent(st.cat)}` : `#/produce?cat=${encodeURIComponent(st.cat)}`,
    });
  }
  return out;
}

export function productionDeficiency(s: State, c: Content): Deficiency | null {
  let gap = 0, due = 0;
  for (const v of c.vocab) { const st = s.vocab[v.id]; if (!st) continue; if (wordProfile(st).productionGap) gap++; if (isDue(st)) due++; }
  const parts: Deficiency[] = [];
  if (gap >= 3) parts.push({ id: "prod:gap", kind: "production", label: "Words I recognise but cannot yet produce", score: 0.7 * 0.8 * Math.min(1, gap / 20), area: "V", reasons: [`${gap} words are known on recognition but not produced yet.`], action: "Production Lab: write or say these words", route: "#/produce?focus=vocab", mins: 10 });
  const dueMist = s.mistakes.filter(mistakeDue).length;
  const total = due + dueMist;
  if (total >= 8) parts.push({ id: "rev:due", kind: "review", label: "Reviews due (forgetting)", score: 0.6 * 1.2 * Math.min(1, total / 25), area: "V", reasons: [`${due} word${due === 1 ? "" : "s"} and ${dueMist} mistake${dueMist === 1 ? "" : "s"} are due for a spaced re-check.`], action: "Clear the review queue", route: due ? "#/vocabulary/study/due" : "#/mistakes/practice", mins: 10 });
  return parts.sort((a, b) => b.score - a.score)[0] || null;
}

const SKILL_ROUTE: Record<CoreArea, string> = { W: "#/writing/new/2", G: "#/grammar", L: "#/listening", R: "#/reading", S: "#/speaking" };
const SKILL_ACTION: Record<CoreArea, string> = { W: "Write and review a Task 2 essay, then fix its errors", G: "Grammar practice on your weakest topic", L: "Listening section with review of why you missed answers", R: "Reading passage focused on your weakest question type", S: "Speaking Part 2 + Part 3 practice" };

export interface Diagnosis {
  areas: AreaScore[];
  main: AreaScore;
  /** the single most useful concrete activity right now */
  best: Deficiency;
  /** other candidates, best first */
  others: Deficiency[];
  question: string;
}

/** The answer to: "What is my biggest deficiency right now and which activity is most useful to correct it?" */
export function diagnose(s: State, c: Content, now = Date.now()): Diagnosis {
  const as = areaScores(s, now);
  const main = as[0];
  const cands: Deficiency[] = [...errorDeficiencies(s, as, now)];
  const p = productionDeficiency(s, c); if (p) cands.push(p);
  for (const a of as) cands.push({ id: "skill:" + a.area, kind: "skill", label: `${a.label} practice`, score: a.score * 0.9, area: a.area, reasons: a.reasons, action: SKILL_ACTION[a.area], route: SKILL_ROUTE[a.area], mins: a.area === "W" ? 40 : 20 });
  cands.sort((x, y) => y.score - x.score);
  // Prefer a concrete activity linked to the main deficiency (Writing is served by Grammar/lexis/discourse categories; Listening by its cause categories).
  const related = (d: Deficiency) => d.kind !== "skill" ? (d.cat ? catAreas(d.cat).includes(main.area) : d.area === "V") : d.area === main.area;
  const best = cands.find((d) => d.kind !== "skill" && related(d)) || cands.find((d) => d.kind === "skill" && d.area === main.area) || cands[0];
  return { areas: as, main, best, others: cands.filter((d) => d !== best).slice(0, 5), question: "What is my biggest deficiency right now, and what is the most useful activity to correct it?" };
}

/** Weights per planner area, derived from the engine (replaces the old gap-only weights). */
export function plannerWeights(s: State, now = Date.now()): { w: Record<CoreArea, number>; reasons: Record<string, string> } {
  const as = areaScores(s, now);
  const max = Math.max(...as.map((a) => a.score), 0.01);
  const w = {} as Record<CoreArea, number>; const reasons: Record<string, string> = {};
  for (const a of as) {
    w[a.area] = 0.5 + 3 * Math.max(a.score, MAINTENANCE_SHARE * max) / max;   // 0.5..3.5, same order of magnitude as before
    reasons[a.area] = `${a.label}: priority ${a.score.toFixed(2)} = importance ${a.importance.toFixed(2)} x weakness ${a.weakness.toFixed(2)} x recency ${a.recency.toFixed(2)}. ${a.reasons.join(" ")}`;
  }
  return { w, reasons };
}

export const examDays = (s: State): number | null => { const d = daysBetween(new Date(), dateFromKey(s.profile.examDate || todayKey())); return d >= 0 ? d : null; };
export { topicsOfCat };
