/* Adaptive planner and recommendations - local rules only (no AI needed). */
import type { State } from "./store";
import type { Content } from "./packs";
import type { Skill } from "./types";
import { accuracyByType, estimates, grammarAccuracy, tagCounts, vocabCounts } from "./stats";
import { addDays, dateFromKey, daysBetween, mondayOf, todayKey } from "./util";
import { TAG_LABEL } from "./scoring";

export type Area = Skill | "V" | "G" | "X" | "M"; // X = review mistakes, M = mock
export const AREA_NAME: Record<Area, string> = { L: "Listening", R: "Reading", W: "Writing", S: "Speaking", V: "Vocabulary", G: "Grammar", X: "Review mistakes", M: "Mock test" };

export interface PlanTask { id: string; area: Area; mins: number; title: string; why: string; route: string; }
export interface Rec { level: "high" | "medium" | "info"; text: string; action: string; route: string; }

export function weights(s: State, c: Content): { w: Record<Area, number>; reasons: Record<string, string> } {
  const e = estimates(s);
  const w: Record<Area, number> = { L: 1, R: 1, W: 1, S: 1, V: 0.6, G: 0.6, X: 0, M: 0 };
  const reasons: Record<string, string> = {};
  for (const k of ["L", "R", "W", "S"] as Skill[]) {
    const t = s.profile.skillTargets?.[k] ?? s.profile.target;
    const b = e[k].band;
    if (b == null) { w[k] = 2; reasons[k] = "No score yet - this builds your baseline."; continue; }
    const gap = Math.max(0, t - b);
    w[k] = 1 + 2 * gap;
    if (gap > 0) reasons[k] = `Estimated ${b.toFixed(1)} vs target ${t.toFixed(1)} (gap ${gap.toFixed(1)}).`;
    if (b >= t + 0.5) { w[k] *= 0.6; reasons[k] = `Above target (${b.toFixed(1)}) - maintenance only.`; }
  }
  const acc = accuracyByType(s, "R", Date.now() - 30 * 864e5);
  const tf = ["True/False/Not Given", "Yes/No/Not Given"].reduce((n, t) => n + ((acc[t]?.[1] || 0) - (acc[t]?.[0] || 0)), 0);
  if (tf > 3) { w.R += 1; reasons.R = (reasons.R ? reasons.R + " " : "") + `${tf} recent True/False/Not Given errors.`; }
  const g = grammarAccuracy(s, Date.now() - 30 * 864e5).total;
  if (g[1] >= 10 && g[0] / g[1] < 0.6) { w.G += 1.5; reasons.G = `Grammar accuracy ${Math.round((100 * g[0]) / g[1])}% (below 60%).`; }
  const lastAi = s.writings.filter((x) => x.ai?.overall != null).sort((a, b) => (b.ai!.importedAt) - (a.ai!.importedAt))[0];
  if (lastAi && (lastAi.ai!.overall as number) < 6.5) { w.W += 1.5; reasons.W = `Last imported Writing feedback: ${lastAi.ai!.overall}.`; }
  const vc = vocabCounts(s, c.vocab.map((v) => v.id));
  if (vc.due > 0) { w.V += Math.min(1.5, vc.due / 20); reasons.V = `${vc.due} words due for review.`; }
  if (s.profile.prefer && w[s.profile.prefer as Area] != null) w[s.profile.prefer as Area] += 0.3;
  return { w, reasons };
}

const ROUTE: Record<Area, string> = { L: "#/listening", R: "#/reading", W: "#/writing", S: "#/speaking", V: "#/vocabulary", G: "#/grammar", X: "#/mistakes/practice", M: "#/mock" };

export function weakestReadingType(s: State): string | null {
  const acc = accuracyByType(s, "R");
  let worst: string | null = null, wv = 1;
  for (const [t, [c, n]] of Object.entries(acc)) if (n >= 3 && c / n < wv) { wv = c / n; worst = t; }
  return wv < 0.75 ? worst : null;
}

export function dailyPlan(s: State, c: Content, minutes = s.profile.minutesDay || 60, mode: string = "daily"): PlanTask[] {
  const { w, reasons } = weights(s, c);
  const tasks: PlanTask[] = [];
  const vc = vocabCounts(s, c.vocab.map((v) => v.id));
  const openMistakes = s.mistakes.filter((m) => !m.resolved).length;
  let left = minutes;
  const add = (area: Area, mins: number, title: string, why: string, route = ROUTE[area]) => {
    tasks.push({ id: `${area}-${tasks.length}`, area, mins, title, why, route }); left -= mins;
  };
  const dow = (new Date().getDay() + 6) % 7;
  if (mode === "revision") {
    add("X", Math.min(minutes, 30), "Practice My Mistakes", `${openMistakes} open mistakes.`);
    if (left >= 10) add("V", Math.min(left, 15), "Vocabulary review", vc.due ? `${vc.due} words due.` : "Keep words active.", "#/vocabulary/study/due");
    if (left >= 10) add("G", left, "Grammar: weakest topic", "Consolidate rules behind your errors.");
    return tasks;
  }
  if (mode === "speaking") { add("S", Math.max(15, Math.round(minutes * 0.8)), "Speaking Part 1-3 simulation", "Speaking Practice mode.", "#/speaking"); if (left >= 5) add("S", left, "Shadowing", "Pronunciation and fluency.", "#/speaking/shadowing"); return tasks; }
  if (mode === "writing") { add("W", Math.max(20, minutes), minutes >= 60 ? "Task 1 + Task 2" : minutes >= 40 ? "Writing Task 2" : "Writing Task 1", "Writing Lab mode.", "#/writing"); return tasks; }
  if (mode === "mock") { add("M", minutes, "Full mock test", "Exam conditions."); return tasks; }

  if (vc.due > 0) add("V", Math.min(15, 5 + Math.ceil(vc.due / 4)), "Vocabulary review (spaced repetition)", `${vc.due} words due today.`, "#/vocabulary/study/due");
  else if (minutes >= 45) add("V", 10, "Learn new words", "Build topic vocabulary for Writing and Speaking.", "#/vocabulary/study/new");
  if (openMistakes >= 5 && minutes >= 30) add("X", 10, "Practice My Mistakes", `${openMistakes} open mistakes waiting.`);

  const core: Area[] = mode === "weakness" ? (["L", "R", "W", "S", "G"] as Area[]).sort((a, b) => w[b] - w[a]).slice(0, 2) : ["L", "R", "W", "S", "G"];
  const total = core.reduce((a, k) => a + w[k], 0);
  const alloc = core.map((k) => ({ k, m: Math.round(((left * w[k]) / total) / 5) * 5 })).sort((a, b) => w[b.k] - w[a.k]);
  let budget = left;
  for (const { k } of alloc) {
    let m = alloc.find((x) => x.k === k)!.m;
    if (k === "W") { const wDay = dow === 2 || dow === 5 || w.W >= 2.5; if (m < 20 && !wDay) continue; m = m >= 40 || (wDay && budget >= 40) ? 40 : 20; }
    if (k === "S" && m < 10) continue;
    if (m < 10) continue;
    m = Math.min(m, budget);
    if (m < 10) break;
    const rt = k === "R" ? weakestReadingType(s) : null;
    const title = k === "W" ? (m >= 40 ? "Writing Task 2 (40 min)" : "Writing Task 1 (20 min)")
      : k === "S" ? "Speaking Part 2 + Part 3" : k === "R" ? (rt ? `Reading: ${rt} focus` : "Reading passage") : k === "L" ? "Listening section" : "Grammar practice";
    const route = k === "W" ? `#/writing/new/${m >= 40 ? 2 : 1}` : k === "R" && rt ? `#/reading?focus=${encodeURIComponent(rt)}` : ROUTE[k];
    tasks.push({ id: `${k}-${tasks.length}`, area: k, mins: m, title, why: reasons[k] || "Balanced practice.", route });
    budget -= m;
  }
  if (budget >= 10 && tasks.length) tasks[tasks.length - 1].mins += budget;
  return tasks;
}

/** Minutes of real activity per area today (from saved results). */
export function doneToday(s: State): Record<Area, number> {
  const k = todayKey();
  const out: Record<Area, number> = { L: 0, R: 0, W: 0, S: 0, V: 0, G: 0, X: 0, M: 0 };
  for (const a of s.attempts) if (todayKey(new Date(a.ts)) === k) {
    const area: Area = a.kind === "mistakes" ? "X" : a.kind === "mock" ? "M" : (a.skill as Area);
    out[area] += a.secs / 60;
  }
  for (const w of s.writings) if (todayKey(new Date(w.updatedAt)) === k) out.W += w.secs / 60;
  for (const r of s.recordings) if (todayKey(new Date(r.createdAt)) === k) out.S += (r.part === 2 ? 3 : 1.5) + r.durSecs / 60;
  return out;
}

/* ---------------- Weekly plan ---------------- */
export type WStatus = "planned" | "in progress" | "completed" | "skipped";
export interface WeekItem { id: string; day: number; area: Area; label: string; status: WStatus; }

export function buildWeek(s: State, c: Content): WeekItem[] {
  const { w } = weights(s, c);
  const tpl: Area[][] = [["L", "V"], ["R", "G"], ["W"], ["S", "V"], ["L", "R"], ["M"], ["X", "G"]];
  const skills: Area[] = ["L", "R", "W", "S"];
  const strongest = skills.slice().sort((a, b) => w[a] - w[b])[0];
  const weakest = skills.slice().sort((a, b) => w[b] - w[a])[0];
  const days = tpl.map((d) => d.slice());
  if (w[strongest] < w[weakest] - 0.75) days[4] = days[4].map((a) => (a === strongest ? weakest : a));
  if (weakest === "W" || weakest === "S") days[0].push(weakest);
  const daysLeft = daysBetween(new Date(), dateFromKey(s.profile.examDate || todayKey(addDays(new Date(), 90))));
  if (daysLeft > 60) days[5] = ["L", "R", "W"];
  const LABEL: Record<Area, string> = { L: "Listening section", R: "Reading passage", W: "Writing task", S: "Speaking parts 1-3", V: "Vocabulary review", G: "Grammar topic", X: "Review mistakes", M: "Full mock test" };
  const out: WeekItem[] = [];
  days.forEach((d, i) => d.forEach((a, j) => out.push({ id: `${i}-${j}-${a}`, day: i, area: a, label: LABEL[a], status: "planned" })));
  return out;
}
export const weekKey = (d = new Date()) => "week:" + todayKey(mondayOf(d));

/* ---------------- Intelligent review ---------------- */
export function recommendations(s: State, c: Content): Rec[] {
  const out: Rec[] = [];
  const e = estimates(s);
  const ai = s.writings.filter((w) => w.ai?.criteria?.GRA != null).sort((a, b) => b.ai!.importedAt - a.ai!.importedAt).slice(0, 3);
  if (ai.length === 3 && ai.every((w) => (w.ai!.criteria.GRA as number) < 6.5))
    out.push({ level: "high", text: "Your Writing grammar score has stayed below 6.5 in the last 3 imported evaluations.", action: "Do a 20-minute session on complex sentences and articles.", route: "#/grammar/complex" });
  const acc = accuracyByType(s, "R");
  for (const t of ["True/False/Not Given", "Yes/No/Not Given", "Matching Headings"]) {
    const a = acc[t]; if (a && a[1] >= 6 && a[0] / a[1] < 0.6)
      out.push({ level: "high", text: `You are getting ${Math.round((100 * a[0]) / a[1])}% right in ${t}.`, action: `Do a focused ${t} session and read the strategy first.`, route: `#/reading?focus=${encodeURIComponent(t)}` });
  }
  const tags = Object.entries(tagCounts(s, "L")).filter(([k]) => k !== "no answer").sort((a, b) => b[1] - a[1]);
  if (tags[0] && tags[0][1] >= 3)
    out.push({ level: "medium", text: `Most of your Listening errors are about ${TAG_LABEL[tags[0][0]] || tags[0][0]} (${tags[0][1]} errors).`, action: "Do a 10-minute targeted dictation drill.", route: `#/listening/drill/${encodeURIComponent(tags[0][0])}` });
  const g = grammarAccuracy(s).byTopic;
  const weakG = Object.entries(g).filter(([, [x, n]]) => n >= 5 && x / n < 0.6).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])[0];
  if (weakG) out.push({ level: "medium", text: `Grammar - ${weakG[0]}: ${Math.round((100 * weakG[1][0]) / weakG[1][1])}% accuracy.`, action: "Review the lesson and redo the exercises.", route: `#/grammar/${c.grammar.find((t) => t.title === weakG[0])?.id || ""}` });
  const vc = vocabCounts(s, c.vocab.map((v) => v.id));
  if (vc.due >= 15) out.push({ level: "medium", text: `${vc.due} words are due for review.`, action: "Clear your review queue before learning new words.", route: "#/vocabulary/study/due" });
  const lastW = s.writings.filter((w) => w.status === "submitted").sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))[0];
  if (!lastW || Date.now() - (lastW.submittedAt || 0) > 5 * 864e5) out.push({ level: "medium", text: lastW ? "You have not submitted an essay for more than 5 days." : "You have not written any essay yet.", action: "Write one Task 2 essay (40 min).", route: "#/writing/new/2" });
  const daysLeft = daysBetween(new Date(), dateFromKey(s.profile.examDate || todayKey()));
  if (daysLeft >= 0 && daysLeft <= 45 && !s.mocks.some((m) => Date.now() - m.ts < 14 * 864e5))
    out.push({ level: "high", text: `${daysLeft} days to your exam and no mock test in the last 2 weeks.`, action: "Book 3 hours this weekend for Mock Test 01.", route: "#/mock" });
  if (e.S.band == null && s.recordings.length === 0) out.push({ level: "info", text: "There is no Speaking data yet.", action: "Record a Part 2 answer and assess it.", route: "#/speaking" });
  return out;
}
