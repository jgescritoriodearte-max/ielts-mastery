/* Band conversion. Raw-score tables are the widely published approximate conversions;
   official conversions vary slightly from test to test. Every value shown in the app is an ESTIMATE. */
import type { Skill } from "./types";

export const BAND_SCALE = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
export const DISCLAIMER = "Estimated IELTS-style score — not an official IELTS score.";

type Row = [number, number]; // [minimum raw score, band]
const LISTENING: Row[] = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
const READING_AC: Row[] = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
const READING_GT: Row[] = [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [3, 2], [1, 1], [0, 0]];

export function bandFromRaw(raw: number, skill: "L" | "R", exam: "academic" | "gt" = "academic"): number {
  const table = skill === "L" ? LISTENING : exam === "gt" ? READING_GT : READING_AC;
  const r = Math.max(0, Math.min(40, Math.round(raw)));
  for (const [min, band] of table) if (r >= min) return band;
  return 0;
}

/** Converts a result on a set of any length to an estimated band by scaling to 40 questions. */
export function bandFromScore(correct: number, total: number, skill: "L" | "R", exam: "academic" | "gt" = "academic"): number | null {
  if (!total) return null;
  return bandFromRaw((correct / total) * 40, skill, exam);
}

/** Official rounding: averages ending in .25 round up to .5 and .75 round up to the next whole band. */
export function roundBand(x: number): number {
  return Math.round(x * 2 + 1e-9) / 2;
}

export function overallBand(bands: (number | null | undefined)[]): number | null {
  if (bands.length !== 4 || bands.some((b) => b == null || isNaN(b as number))) return null;
  return roundBand((bands as number[]).reduce((a, b) => a + b, 0) / 4);
}

/** Writing: Task 2 counts twice as much as Task 1. */
export function writingBand(t1: number | null, t2: number | null): number | null {
  if (t1 == null && t2 == null) return null;
  if (t1 == null) return t2;
  if (t2 == null) return t1;
  return roundBand((t1 + 2 * t2) / 3);
}

/** Average of criteria, rounded to the nearest half band. */
export function criteriaBand(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => typeof x === "number" && !isNaN(x));
  if (!v.length) return null;
  return roundBand(v.reduce((a, b) => a + b, 0) / v.length);
}

export const fmtBand = (b: number | null | undefined): string => (b == null ? "–" : b.toFixed(1));

export const bandColor = (b: number | null | undefined, target: number): string => {
  if (b == null) return "var(--muted)";
  if (b >= target) return "var(--good)";
  if (b >= target - 0.5) return "var(--warn)";
  return "var(--bad)";
};

export const WRITING_CRITERIA = (task: 1 | 2) => [
  { key: "TA", label: task === 1 ? "Task Achievement" : "Task Response" },
  { key: "CC", label: "Coherence and Cohesion" },
  { key: "LR", label: "Lexical Resource" },
  { key: "GRA", label: "Grammatical Range and Accuracy" },
];
export const SPEAKING_CRITERIA = [
  { key: "FC", label: "Fluency and Coherence" },
  { key: "LR", label: "Lexical Resource" },
  { key: "GRA", label: "Grammatical Range and Accuracy" },
  { key: "P", label: "Pronunciation" },
];

export const SKILL_LIST: Skill[] = ["L", "R", "W", "S"];
