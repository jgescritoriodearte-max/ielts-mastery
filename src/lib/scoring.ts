/* Local, automatic correction for objective questions. */
import type { FlatQ, Group, Item, QSet } from "./types";
import type { ItemResult } from "./store";
import { bandFromScore } from "./bands";

export const STRATEGY: Record<string, string> = {
  "True/False/Not Given": "Find the part of the text about the topic, then ask: does the text say the same thing (TRUE), the opposite (FALSE), or nothing about this exact point (NOT GIVEN)? Watch extreme words such as 'only', 'always', 'all'.",
  "Yes/No/Not Given": "These test the writer's opinions. Look for opinion language (In my view, surprisingly, I would argue). NOT GIVEN = the writer does not express a view on this point.",
  "Matching Headings": "Read each paragraph's first and last sentences for the main idea. Headings that match a single detail are usually traps.",
  "Matching Information": "Information can be anywhere in a paragraph and some paragraphs may be used twice. Scan for the specific type of information (a reason, an example, a description).",
  "Matching Features": "Scan for each name/category first, then read around it and match by paraphrase, not by identical words.",
  "Matching": "Read the options before listening. Answers usually come in the order of the questions; the options do not.",
  "Multiple Choice": "Underline key words in the question, find the matching section, and eliminate options that are true but do not answer the question.",
  "Sentence Completion": "Predict the type of word (noun, verb, number). Copy words exactly from the text and respect the word limit.",
  "Summary Completion": "Read the whole summary first; use grammar around each gap to predict the word form. Answers usually follow the text order.",
  "Note Completion": "Notes follow the order of the text. Use headings in the notes to find your place quickly.",
  "Table Completion": "Read across rows and down columns to understand what each gap needs before you look in the text.",
  "Flow-chart Completion": "The flow-chart follows a process in order. Identify where each stage is described.",
  "Diagram Label Completion": "Locate the description of the object and follow it part by part; labels often appear in the order the text describes them.",
  "Short Answer": "Use words from the text/recording and respect the word limit exactly.",
  "Form Completion": "Predict the type of information (name, number, date). Listen for corrections: the final version is the answer.",
  "Map Labelling": "Find the starting point (entrance) and follow directions: on your left/right, opposite, behind, at the far end.",
};

export const normalize = (s: string): string =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[£$€]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?"']+|[\s.,;:!?"']+$/g, "")
    .trim();

const compact = (s: string) => normalize(s).replace(/[\s\-.,:/]/g, "");

/** Words for word-limit checks: tokens containing digits are numbers and do not count as words. */
export const countWords = (s: string): number => (normalize(s).match(/[a-z0-9'’-]+/gi) || []).filter((t) => !/\d/.test(t)).length;

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

export interface Check { ok: boolean; reason: string; }

export function checkGap(user: string, answers: string | string[], limit?: number): Check {
  const u = normalize(user);
  if (!u) return { ok: false, reason: "No answer" };
  const list = Array.isArray(answers) ? answers : [answers];
  if (limit && countWords(u) > limit && !list.some((a) => normalize(a) === u)) return { ok: false, reason: "Word limit exceeded" };
  for (const a of list) {
    if (normalize(a) === u) return { ok: true, reason: "" };
    const ca = compact(a);
    if (/^[a-z0-9]+$/.test(ca) && /\d/.test(ca) && ca === compact(u)) return { ok: true, reason: "" };
  }
  const near = list.some((a) => { const n = normalize(a); return n.length > 3 && levenshtein(n, u) <= 2; });
  return { ok: false, reason: near ? "Spelling" : "Wrong detail" };
}

export const optionKey = (opt: string, idx: number, g: Group): string => {
  if (g.optKey === "roman") return opt.trim().split(/\s+/)[0];
  if (g.optKey === "letter") return opt.trim().split(/\s+/)[0];
  return opt;
};

export function choicesFor(g: Group, it: Item): { key: string; label: string }[] {
  if (it.opts) return it.opts.map((o, i) => ({ key: "ABCDEFGH"[i], label: o }));
  return (g.options || []).map((o, i) => ({ key: optionKey(o, i, g), label: o }));
}

export const isChoice = (g: Group, it: Item): boolean => !!(it.opts || g.options);

export function flatten(set: QSet): FlatQ[] {
  const out: FlatQ[] = [];
  let n = 1;
  set.groups.forEach((g, gi) => g.items.forEach((item, ii) => {
    out.push({ qid: `${set.id}:${gi}:${ii}`, setId: set.id, skill: set.skill, n: n++, group: g, item });
  }));
  return out;
}

function readingTag(qtype: string, your: string, correct: string, reason: string): string {
  const y = your.toUpperCase(), c = correct.toUpperCase();
  if (/Not Given/.test(qtype)) {
    if (!your) return "No answer";
    if (c === "NOT GIVEN") return "Over-inference (NOT GIVEN marked as " + y + ")";
    if (y === "NOT GIVEN") return "Missed paraphrase/contradiction";
    return "TRUE/FALSE reversed";
  }
  if (reason) return reason;
  if (/Heading/.test(qtype)) return "Detail chosen instead of main idea";
  return "Wrong option";
}

export interface SetResult {
  correct: number; total: number; band: number | null;
  items: (ItemResult & { n: number; check: Check })[];
  byType: Record<string, [number, number]>;
  tags: Record<string, number>;
}

export function gradeSet(set: QSet, answers: Record<string, string>, exam: "academic" | "gt" = "academic", only?: Set<string>): SetResult {
  const flat = flatten(set).filter((f) => !only || only.has(f.qid));
  const byType: Record<string, [number, number]> = {};
  const tags: Record<string, number> = {};
  let correct = 0;
  const items = flat.map((f) => {
    const your = (answers[f.qid] || "").trim();
    let check: Check;
    const correctStr = Array.isArray(f.item.a) ? f.item.a[0] : f.item.a;
    if (isChoice(f.group, f.item)) {
      const ok = !!your && your.toUpperCase() === String(f.item.a).toUpperCase();
      check = { ok, reason: your ? "" : "No answer" };
    } else check = checkGap(your, f.item.a, f.group.limit);
    if (check.ok) correct++;
    const t = byType[f.group.qtype] || [0, 0];
    byType[f.group.qtype] = [t[0] + (check.ok ? 1 : 0), t[1] + 1];
    let tag = "";
    if (!check.ok) {
      if (set.skill === "L") tag = check.reason === "Spelling" ? "spelling" : check.reason === "No answer" ? "no answer" : check.reason === "Word limit exceeded" ? "word limit" : (f.item.tag || "detail");
      else tag = readingTag(f.group.qtype, your, correctStr, check.reason === "Wrong detail" ? "" : check.reason);
      tags[tag] = (tags[tag] || 0) + 1;
    }
    return {
      n: f.n, check, qid: f.qid, ok: check.ok, your, correct: correctStr, prompt: f.item.q,
      qtype: f.group.qtype, tag, explanation: f.item.ex || "", difficulty: set.level,
      skill: set.skill, ref: set.id,
    };
  });
  return { correct, total: flat.length, band: bandFromScore(correct, flat.length, set.skill, exam), items, byType, tags };
}

export const TAG_LABEL: Record<string, string> = {
  numbers: "Numbers", names: "Names", spelling: "Spelling", distractors: "Distractors",
  paraphrasing: "Paraphrasing", "fast speech": "Fast speech", accents: "Different accents",
  detail: "Missed detail", "no answer": "No answer", "word limit": "Word limit",
};
