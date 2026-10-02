/* IELTS Readiness: an internal indicator, not a prediction or guarantee of an official result. */
import type { State } from "./store";
import type { Content } from "./packs";
import type { Skill } from "./types";
import { estimates, grammarAccuracy, minutesOn, streaks, vocabCounts } from "./stats";
import { addDays, todayKey } from "./util";

export interface Readiness {
  score: number; category: string;
  parts: { key: string; label: string; weight: number; value: number; note: string }[];
}
export const READINESS_NOTE = "Internal indicator calculated from your data in this app. It does not guarantee or predict your official IELTS result.";

export function readiness(s: State, c: Content): Readiness {
  const e = estimates(s);
  const parts: Readiness["parts"] = [];
  const skillVals = (["L", "R", "W", "S"] as Skill[]).map((k) => {
    const b = e[k].band; const t = s.profile.skillTargets?.[k] ?? s.profile.target;
    return b == null ? 0 : Math.max(0, Math.min(1, 1 - Math.max(0, t - b) / 1.5));
  });
  parts.push({ key: "skills", label: "Listening · Reading · Writing · Speaking", weight: 0.5, value: skillVals.reduce((a, b) => a + b, 0) / 4, note: "Distance between each estimated band and its target." });

  const recent = [
    ...s.mocks.filter((m) => Date.now() - m.ts < 45 * 864e5).map((m) => m.overall),
    ...s.external.filter((x) => x.date >= todayKey(addDays(new Date(), -45))).map((x) => x.overall),
  ].filter((x): x is number => x != null);
  const mockVal = recent.length ? recent.reduce((a, o) => a + (o >= s.profile.target ? 1 : o >= s.profile.target - 0.5 ? 0.55 : 0.2), 0) / recent.length * Math.min(1, 0.6 + 0.2 * recent.length) : 0;
  parts.push({ key: "mocks", label: "Recent mock tests", weight: 0.15, value: mockVal, note: recent.length ? `${recent.length} full test(s) in the last 45 days (app + external).` : "No full test in the last 45 days." });

  const days14 = Array.from({ length: 14 }, (_, i) => todayKey(addDays(new Date(), -i))).filter((k) => minutesOn(s, k) >= 10).length;
  parts.push({ key: "consistency", label: "Consistency", weight: 0.15, value: Math.min(1, days14 / 10), note: `${days14} study days in the last 14 (goal: 10+). Current streak ${streaks(s).current}.` });

  const vc = vocabCounts(s, c.vocab.map((v) => v.id));
  const g = grammarAccuracy(s, Date.now() - 30 * 864e5).total;
  const vg = 0.5 * Math.min(1, vc.learned / Math.max(60, c.vocab.length * 0.8)) + 0.5 * (g[1] ? g[0] / g[1] : 0);
  parts.push({ key: "vg", label: "Vocabulary + Grammar", weight: 0.1, value: vg, note: `${vc.learned} words learned; grammar accuracy ${g[1] ? Math.round((100 * g[0]) / g[1]) + "%" : "–"} (30 days).` });

  const timed = s.attempts.filter((a) => a.limitSecs).slice(-10);
  const tm = timed.length ? timed.filter((a) => a.secs <= (a.limitSecs as number) && a.correct / Math.max(1, a.total) >= 0.5).length / timed.length : 0;
  parts.push({ key: "time", label: "Time management", weight: 0.1, value: tm, note: timed.length ? `${timed.length} recent timed sections; finished within time with ≥50% accuracy in ${Math.round(tm * 100)}%.` : "Do timed practice (exam mode) to measure this." });

  const score = Math.round(100 * parts.reduce((a, p) => a + p.weight * p.value, 0));
  const strongMocks = recent.filter((o) => o >= s.profile.target - 0.5).length;
  let category = score < 40 ? "Foundation" : score < 65 ? "Developing" : score < 85 ? "Approaching Target" : "Consistently Near Target";
  if (category === "Consistently Near Target" && strongMocks < 2) category = "Approaching Target";
  return { score, category, parts };
}
