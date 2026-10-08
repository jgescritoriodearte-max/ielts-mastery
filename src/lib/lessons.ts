/* Grammar Learning Layer: pure logic (no React, no IndexedDB), so it is unit-testable.
   A lesson = TEACH (explanation) + TRAIN (guided practice, production) + TEST (writing application, transfer).
   Progress is stored in kv.lessonProgress (additive, optional; the backup already includes kv).

   MASTERY (4 stages, requested by the user). Multiple choice alone can never reach "mastered":
     A Recognise   - picks the right form in controlled choice items.
     B Understand  - explains WHY (reasoning questions about the rule, not about the answer).
     C Produce     - writes correct sentences of its own (free text, checked by the rules of the lesson).
     D Spontaneous - uses the structure in a writing task whose required structures are not named in the instructions
                     of the transfer test, and does it correctly, with no recent writing errors on this concept.
   All thresholds below are PROJECT ESTIMATES (design choices to be calibrated with the user's data). */

export interface TextSpec { accept?: string[]; must?: string[]; mustNot?: { re: string; why: string }[] }
export type Verdict = "ok" | "wrong" | "unsure";
export interface SpecResult { verdict: Verdict; missing: string[]; hits: { re: string; why: string }[] }

const rx = (s: string) => new RegExp(s, "i");
const norm = (t: string) => String(t || "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();

/** Checks a free-text answer with regular expressions written by the lesson author.
    accept: any ONE of these full-answer patterns = ok (used for transformations with one right answer).
    must: ALL must match. mustNot: any match = wrong (with the reason shown to the learner).
    "unsure" = too short to judge, never counted as correct. */
export function evalSpec(text: string, spec: TextSpec): SpecResult {
  const t = norm(text);
  const res: SpecResult = { verdict: "unsure", missing: [], hits: [] };
  if (t.split(" ").filter(Boolean).length < 2) return res;
  for (const m of spec.mustNot || []) if (rx(m.re).test(t)) res.hits.push({ re: m.re, why: m.why });
  if (spec.accept?.length) {
    const okAny = spec.accept.some((a) => rx(a).test(t));
    if (!okAny) res.missing.push("the expected form");
  }
  for (const m of spec.must || []) if (!rx(m).test(t)) res.missing.push(m);
  res.verdict = res.hits.length || res.missing.length ? "wrong" : "ok";
  return res;
}

/* ---------------- lesson content types (data lives in the grammar pack) ---------------- */
export interface Mcq { id: string; q: string; opts: string[]; a: number; why: string; natural?: string }
export interface TextItem { id: string; q: string; spec: TextSpec; model: string; why: string; hint?: string; stage: "transform" | "guided" | "produce" }
export interface Lesson {
  id: string; title: string; cat: string; minutes: number; level: string;
  objective: string; why: { k: string; t: string }[];
  concept: { intro: string; points: string[] };
  formation: { title: string; rows: [string, string][] }[];
  whenUse: { rule: string; ex: string }[]; whenNot: { rule: string; ex: string }[];
  contrast: { a: string; b: string; rows: { ctx: string; a: string; b: string; diff: string }[] };
  examples: { a1: string[]; b1: string[]; natural: string[]; ielts: string[] };
  pitfalls: { say: string; wrong: string; right: string; pt: string }[];
  errors: { wrong: string; right: string; why: string }[];
  ielts: { t1: string[]; t2: string[]; speaking: string[]; tip: string };
  understand: Mcq[];
  practice: (Mcq & { stage: "recognise" | "choice" })[];
  transform: TextItem[];
  produce: TextItem[];
  apply: { prompt: string; min: number; max: number; mustUse: { label: string; re: string; min: number }[]; mustNot: { re: string; why: string }[] };
  transfer: (Mcq | (TextItem & { opts?: undefined }))[];
}

/* ---------------- progress ---------------- */
export interface Tally { n: number; ok: number; last: number; hist: number[] }   // hist = last results (1/0), newest last
export interface LessonProgress {
  startedAt: number; read: number; readCount: number;
  understand: Tally & { lastScore: number };      // lastScore = share correct in the last full attempt of the understanding check
  recog: Tally;                                    // MCQ practice (recognise/choice)
  produced: Tally;                                 // free-text items (transform/guided/produce)
  applied: { n: number; last: number; clean: number; used: number };   // writing application attempts / clean ones
  transfer: Tally & { lastScore: number };
}
export const HIST_MAX = 8;
export const blankTally = (): Tally => ({ n: 0, ok: 0, last: 0, hist: [] });
export const blankProgress = (now = Date.now()): LessonProgress => ({
  startedAt: now, read: 0, readCount: 0,
  understand: { ...blankTally(), lastScore: 0 }, recog: blankTally(), produced: blankTally(),
  applied: { n: 0, last: 0, clean: 0, used: 0 }, transfer: { ...blankTally(), lastScore: 0 },
});
const bump = <T extends Tally>(t: T, ok: boolean, now: number): T => ({ ...t, n: t.n + 1, ok: t.ok + (ok ? 1 : 0), last: now, hist: [...t.hist, ok ? 1 : 0].slice(-HIST_MAX) });

/** Pure reducers: each returns a NEW progress object. */
export const P = {
  read: (p: LessonProgress, now: number): LessonProgress => ({ ...p, read: now, readCount: p.readCount + 1 }),
  recog: (p: LessonProgress, ok: boolean, now: number): LessonProgress => ({ ...p, recog: bump(p.recog, ok, now) }),
  produced: (p: LessonProgress, ok: boolean, now: number): LessonProgress => ({ ...p, produced: bump(p.produced, ok, now) }),
  understand: (p: LessonProgress, correct: number, total: number, now: number): LessonProgress => {
    let u = p.understand; for (let i = 0; i < total; i++) u = bump(u, i < correct, now);
    return { ...p, understand: { ...u, lastScore: total ? correct / total : 0, last: now } };
  },
  transfer: (p: LessonProgress, correct: number, total: number, now: number): LessonProgress => {
    let u = p.transfer; for (let i = 0; i < total; i++) u = bump(u, i < correct, now);
    return { ...p, transfer: { ...u, lastScore: total ? correct / total : 0, last: now } };
  },
  applied: (p: LessonProgress, clean: boolean, used: boolean, now: number): LessonProgress => ({ ...p, applied: { n: p.applied.n + 1, last: now, clean: p.applied.clean + (clean ? 1 : 0), used: p.applied.used + (used ? 1 : 0) } }),
};

/* ---------------- thresholds (PROJECT ESTIMATES) ---------------- */
export const A_MIN_ITEMS = 6, A_MIN_RATE = 0.75;           // recognise: >=75% over the last 8 MCQ answers, at least 6 answered
export const B_MIN_SCORE = 0.7;                            // understand: >=70% in the last understanding check
export const C_MIN_ITEMS = 4, C_MIN_RATE = 0.7;            // produce: >=70% over the last 8 free-text answers, at least 4
export const D_MIN_TRANSFER = 0.7;                         // spontaneous: transfer test >=70% ...
export const WRITING_ERR_WINDOW_DAYS = 30, WRITING_ERR_LIMIT = 2;   // ... and fewer than 2 writing errors on this concept in 30 days
export const RECENT_ERR_DAYS = 14, RECENT_ERR_LIMIT = 3;   // 3+ errors on the concept in 14 days = the concept is actively failing

const rate = (t: Tally) => (t.hist.length ? t.hist.reduce((a, b) => a + b, 0) / t.hist.length : 0);

export interface ConceptEvidence { recent: number; writing: number; total: number; streak: number }
export const NO_EVIDENCE: ConceptEvidence = { recent: 0, writing: 0, total: 0, streak: 0 };

/** Evidence from the Error Bank for one concept (events are timestamps; w = events that came from writing). */
export function conceptEvidence(stat: { concepts?: Record<string, { n: number; ev: number[]; w: number[]; streak: number }> } | undefined, id: string, now: number): ConceptEvidence {
  const c = stat?.concepts?.[id]; if (!c) return NO_EVIDENCE;
  const DAY = 864e5;
  return { recent: c.ev.filter((t) => now - t <= RECENT_ERR_DAYS * DAY).length, writing: (c.w || []).filter((t) => now - t <= WRITING_ERR_WINDOW_DAYS * DAY).length, total: c.n, streak: c.streak };
}

export interface Mastery { A: boolean; B: boolean; C: boolean; D: boolean; stages: number; mastered: boolean; label: string }
export function masteryOf(p: LessonProgress | undefined, ev: ConceptEvidence = NO_EVIDENCE): Mastery {
  if (!p) return { A: false, B: false, C: false, D: false, stages: 0, mastered: false, label: "Not started" };
  const A = p.recog.n >= A_MIN_ITEMS && rate(p.recog) >= A_MIN_RATE;
  const B = p.understand.n > 0 && p.understand.lastScore >= B_MIN_SCORE;
  const C = p.produced.n >= C_MIN_ITEMS && rate(p.produced) >= C_MIN_RATE;
  const D = p.transfer.n > 0 && p.transfer.lastScore >= D_MIN_TRANSFER && p.applied.clean > 0 && ev.writing < WRITING_ERR_LIMIT;
  const stages = [A, B, C, D].filter(Boolean).length;
  const mastered = A && B && C && D;       // MCQ alone (A, B) can never give "mastered"
  const label = mastered ? "Mastered" : D ? "Using it spontaneously" : C ? "Can produce it" : B ? "Understands it" : A ? "Recognises it" : p.read ? "Read the lesson" : "Not started";
  return { A, B, C, D, stages, mastered, label };
}

/* ---------------- the teach / reteach / practise / apply / test decision ---------------- */
export type LessonModeId = "teach" | "reteach" | "practise" | "apply" | "test" | "retest" | "done";
export interface LessonMode { mode: LessonModeId; step: "teach" | "check" | "practise" | "produce" | "write" | "test"; label: string; why: string }

/** Decides WHICH kind of help is needed (not just "more exercises"):
    never read + errors             -> TEACH me
    read, cannot explain the reason -> EXPLAIN AGAIN (reteach)
    understands, cannot produce     -> controlled PRACTICE
    produces, fails in writing      -> WRITING APPLICATION
    performs well                   -> reduce support, TEST transfer; then scheduled RETEST. */
export function lessonMode(p: LessonProgress | undefined, ev: ConceptEvidence = NO_EVIDENCE, retestDue = false, now = Date.now()): LessonMode {
  const failing = ev.recent >= RECENT_ERR_LIMIT;
  if (!p || !p.read) return { mode: "teach", step: "teach", label: "Teach me", why: failing ? `You made ${ev.recent} errors on this in the last ${RECENT_ERR_DAYS} days and have not had the lesson yet: understanding comes before more exercises.` : "You have not studied this lesson yet." };
  const m = masteryOf(p, ev);
  if (p.understand.n === 0) return { mode: "teach", step: "check", label: "Check understanding", why: "You read the lesson; now show that you understand WHY, not only the answers." };
  if (!m.B) return { mode: "reteach", step: "teach", label: "Explain it again", why: `You could explain ${Math.round(p.understand.lastScore * 100)}% of the reasoning (needs ${Math.round(B_MIN_SCORE * 100)}%). More exercises would only train guessing: read the lesson again, focusing on the contrast.` };
  if (!m.A || !m.C) {
    const why = !m.A ? "You understand the rule but do not choose the right form reliably yet: controlled practice." : "You can choose the right form but your own sentences are not reliable yet: guided production.";
    return { mode: "practise", step: m.A ? "produce" : "practise", label: "Controlled practice", why };
  }
  if (ev.writing >= WRITING_ERR_LIMIT) return { mode: "apply", step: "write", label: "Apply it in writing", why: `You produce this correctly in isolation but it failed ${ev.writing} times in real writing in the last ${WRITING_ERR_WINDOW_DAYS} days: write a short text and check it against the rule.` };
  if (p.applied.clean === 0) return { mode: "apply", step: "write", label: "Apply it in writing", why: "You produce it correctly in isolation. Next: use it in a short paragraph, where nobody tells you which form to pick." };
  if (!m.D) return { mode: "test", step: "test", label: "Transfer test", why: "Support is now reduced: a mixed test with no topic name, so you must decide the structure yourself." };
  if (failing) return { mode: "practise", step: "practise", label: "Controlled practice", why: `Mastered on paper, but ${ev.recent} new errors in ${RECENT_ERR_DAYS} days: a short refresher.` };
  if (retestDue) return { mode: "retest", step: "test", label: "Retest", why: "Spaced retrieval is due: the same concept returns in a new context, without its name." };
  return { mode: "done", step: "test", label: "Maintained", why: "All four stages are shown. The concept comes back by spaced retest." };
}

/** Priority of a lesson for the adaptive engine (0..1); used by errorDeficiencies. */
export function lessonNeed(mode: LessonModeId): number {
  return { teach: 1, reteach: 0.95, practise: 0.8, apply: 0.85, test: 0.6, retest: 0.5, done: 0 }[mode];
}

export const STEP_ORDER: LessonMode["step"][] = ["teach", "check", "practise", "produce", "write", "test"];
export const STEP_LABEL: Record<LessonMode["step"], string> = { teach: "1 · Teach", check: "2 · Check", practise: "3 · Practise", produce: "4 · Produce", write: "5 · Write", test: "6 · Test" };

/** Highlights **bold** markers in lesson text. Returns segments so the UI can render without dangerouslySetInnerHTML. */
export function segments(text: string): { t: string; b: boolean }[] {
  return String(text || "").split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((s) => (s.startsWith("**") ? { t: s.slice(2, -2), b: true } : { t: s, b: false }));
}
