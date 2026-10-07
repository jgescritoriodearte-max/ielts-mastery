/* In-memory mirror of IndexedDB + actions. Every mutation is written to IndexedDB immediately. */
import { useSyncExternalStore } from "react";
import * as db from "./db";
import type {
  AiFeedback, Attempt, CustomPack, ErrorStat, ExternalResult, ItemStat, Mistake, MockResult, Profile, Recording, Review,
  Session, Settings, SkillItem, VocabState, Writing, AnySkill,
} from "./types";
import { todayKey, uid } from "./util";
import { categorize, catAreas, catOfAi, catOfGrammarTopic, catOfLocal, catLabel } from "./taxonomy";
import { moveEvent, nextMistakeState, recordCorrect, recordError } from "./errorbank";
import { blankAxis, daysToExamOf, gradeAxis, stepAxis, type Axis, type Grade } from "./srs";

export interface State {
  ready: boolean;
  error: string | null;
  profile: Profile;
  settings: Settings;
  kv: Record<string, any>;
  attempts: Attempt[];
  itemStats: Record<string, ItemStat>;
  mistakes: Mistake[];
  vocab: Record<string, VocabState>;
  writings: Writing[];
  recordings: Recording[];
  sessions: Record<string, Session>;
  mocks: MockResult[];
  external: ExternalResult[];
  customPacks: CustomPack[];
  errors: Record<string, ErrorStat>;   // Error Bank (one record per category)
  reviews: Review[];                   // append-only review log
  skillItems: Record<string, SkillItem>; // grammar structures (two axes)
}

export const DEFAULT_PROFILE: Profile = {
  name: "Josimar", exam: "academic", target: 7,
  skillTargets: { L: 7, R: 7, W: 7, S: 7 },
  examDate: "2027-01-16", hoursWeek: 10, minutesDay: 90,
  selfLevel: {}, difficulties: [], prefer: "", onboarded: false, createdAt: Date.now(),
};
export const DEFAULT_SETTINGS: Settings = {
  accent: "gb", ttsRate: 1, theme: "system", explainLang: "pt",
  backupReminderDays: 7, autoDownload: true, examMode: true,
};

let state: State = {
  ready: false, error: null, profile: DEFAULT_PROFILE, settings: DEFAULT_SETTINGS, kv: {},
  attempts: [], itemStats: {}, mistakes: [], vocab: {}, writings: [], recordings: [],
  sessions: {}, mocks: [], external: [], customPacks: [], errors: {}, reviews: [], skillItems: {},
};
const listeners = new Set<() => void>();
const emit = () => { state = { ...state }; listeners.forEach((l) => l()); };
export const getState = () => state;
export const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export function useStore(): State { return useSyncExternalStore(subscribe, getState, getState); }

const byId = <T extends { id: string }>(arr: T[]) => Object.fromEntries(arr.map((r) => [r.id, r])) as Record<string, T>;

export async function loadAll(): Promise<void> {
  try {
    const [kv, attempts, itemStats, mistakes, vocab, writings, recordings, sessions, mocks, external, customPacks, errors, reviews, skillItems] =
      await Promise.all([
        db.getAll("kv"), db.getAll<Attempt>("attempts"), db.getAll<ItemStat>("itemStats"), db.getAll<Mistake>("mistakes"),
        db.getAll<VocabState>("vocab"), db.getAll<Writing>("writings"), db.getAll<Recording>("recordings"),
        db.getAll<Session>("sessions"), db.getAll<MockResult>("mocks"), db.getAll<ExternalResult>("external"),
        db.getAll<CustomPack>("customPacks"), db.getAll<ErrorStat>("errors"), db.getAll<Review>("reviews"), db.getAll<SkillItem>("skillItems"),
      ]);
    const kvMap: Record<string, any> = {};
    for (const r of kv) kvMap[r.id] = r.value;
    state = {
      ready: true, error: null,
      profile: { ...DEFAULT_PROFILE, ...(kvMap.profile || {}) },
      settings: { ...DEFAULT_SETTINGS, ...(kvMap.settings || {}) },
      kv: kvMap,
      attempts: attempts.sort((a, b) => a.ts - b.ts),
      itemStats: byId(itemStats),
      mistakes: mistakes.sort((a, b) => b.ts - a.ts),
      vocab: byId(vocab),
      writings: writings.sort((a, b) => b.updatedAt - a.updatedAt),
      recordings: recordings.map((r) => ({ ...r, blob: undefined })).sort((a, b) => b.createdAt - a.createdAt),
      sessions: byId(sessions),
      mocks: mocks.sort((a, b) => a.ts - b.ts),
      external: external.sort((a, b) => a.date.localeCompare(b.date)),
      customPacks, errors: byId(errors), reviews: reviews.sort((a, b) => a.ts - b.ts), skillItems: byId(skillItems),
    };
  } catch (e: any) {
    state = { ...state, ready: true, error: String(e?.message || e) };
  }
  emit();
  if (!state.error) await migrateCore().catch(() => undefined);
}

/* ---------------- tombstones (so that Merge does not resurrect deleted records) ---------------- */
async function tombstone(store: string, id: string) {
  const t = { ...(state.kv.tombstones || {}) };
  t[`${store}:${id}`] = Date.now();
  await setKV("tombstones", t);
}

/* ---------------- KV ---------------- */
export async function setKV(key: string, value: any): Promise<void> {
  state.kv = { ...state.kv, [key]: value };
  if (key === "profile") state.profile = value;
  if (key === "settings") state.settings = value;
  emit();
  await db.put("kv", { id: key, value, updatedAt: Date.now() });
}
export const saveProfile = (p: Partial<typeof state.profile>) => setKV("profile", { ...state.profile, ...p });
export const saveSettings = (s: Partial<typeof state.settings>) => setKV("settings", { ...state.settings, ...s });

/* ---------------- study time ---------------- */
export function deviceId(): string {
  try {
    let d = localStorage.getItem("im-device");
    if (!d) { d = uid("d"); localStorage.setItem("im-device", d); }
    return d;
  } catch { return "dev"; }
}

/** Sessions are stored per day AND per device ("YYYY-MM-DD|device") so that merging backups from two devices adds up correctly. */
export async function logStudy(minutes: number, items = 0): Promise<void> {
  if (minutes <= 0 && items <= 0) return;
  const k = todayKey() + "|" + deviceId();
  const cur = state.sessions[k] || { id: k, minutes: 0, items: 0, updatedAt: 0 };
  const next: Session = { id: k, minutes: Math.round((cur.minutes + minutes) * 10) / 10, items: cur.items + items, updatedAt: Date.now() };
  state.sessions = { ...state.sessions, [k]: next };
  emit();
  await db.put("sessions", next);
}

/* ---------------- attempts, item stats, mistakes ---------------- */
export interface ItemResult {
  qid: string; ok: boolean; your: string; correct: string; prompt: string; qtype: string;
  tag: string; explanation: string; difficulty: string; skill: AnySkill; ref: string;
  cat?: string;            // taxonomy category; derived automatically when absent (see taxonomy.categorize)
  axis?: Axis;             // which SRS axis this answer exercises (rec = recognise, prod = produce), when known
  ms?: number;             // response time in ms, when measured
  src?: string;            // origin label stored with the error (quiz, production, mistakes...)
}

/* ---------------- Error Bank + review log helpers (all writes go through here) ---------------- */
let pendingErrors: Record<string, ErrorStat> = {};
function stageError(next: ErrorStat | undefined) { if (next) { state.errors = { ...state.errors, [next.id]: next }; pendingErrors[next.id] = next; } }
async function flushErrors() { const l = Object.values(pendingErrors); pendingErrors = {}; await db.putMany("errors", l); }
const newReview = (r: Omit<Review, "id" | "updatedAt">): Review => ({ ...r, id: uid("r-"), updatedAt: r.ts });
async function flushReviews(rs: Review[]) { if (!rs.length) return; state.reviews = [...state.reviews, ...rs]; await db.putMany("reviews", rs); }

/** Registers an error or a correct answer in the Error Bank. */
function noteResult(cat: string, area: string, ok: boolean, src: string, now: number, ex?: { a: string; b: string }) {
  const prev = state.errors[cat];
  if (!ok) stageError(recordError(prev, cat, area, src, now, ex));
  else stageError(recordCorrect(prev, now));
}

export async function recordAttempt(a: Omit<Attempt, "id" | "updatedAt">, items: ItemResult[]): Promise<Attempt> {
  const att: Attempt = { ...a, id: uid("a-"), updatedAt: Date.now() };
  state.attempts = [...state.attempts, att];
  const now = Date.now();
  const statUpd: ItemStat[] = [];
  const mistakeUpd: Mistake[] = [];
  const reviews: Review[] = [];
  const mistakes = state.mistakes.slice();
  const topicRes: Record<string, [number, number]> = {};
  for (const r of items) {
    const cat = categorize(r);
    const prev = state.itemStats[r.qid] || { id: r.qid, c: 0, w: 0, last: 0, lastOk: false, updatedAt: 0 };
    const s: ItemStat = { id: r.qid, c: prev.c + (r.ok ? 1 : 0), w: prev.w + (r.ok ? 0 : 1), last: now, lastOk: r.ok, updatedAt: now };
    state.itemStats[r.qid] = s;
    statUpd.push(s);
    const openIdx = mistakes.findIndex((m) => m.qid === r.qid && !m.resolved);
    const src = r.src || (a.kind === "mistakes" ? "mistakes" : "quiz");
    if (!r.ok) {
      if (openIdx >= 0) {
        const old = mistakes[openIdx];
        const m = { ...old, ts: now, your: r.your, ...nextMistakeState(old, false), cat: old.cat || cat, updatedAt: now };
        mistakes[openIdx] = m; mistakeUpd.push(m);
      } else {
        const m: Mistake = {
          id: uid("m-"), updatedAt: now, ts: now, skill: r.skill, ref: r.ref, qid: r.qid, qtype: r.qtype, tag: r.tag,
          difficulty: r.difficulty, prompt: r.prompt, your: r.your || "(blank)", correct: r.correct,
          explanation: r.explanation, resolved: false, reviewOk: 0, reviewCount: 0, cat, src,
          due: nextMistakeState({ reviewOk: 0, reviewCount: 0 } as Mistake, false).due,
          ...(r.skill === "L" ? { cause: cat } : {}),
        };
        mistakes.unshift(m); mistakeUpd.push(m);
      }
      noteResult(cat, r.skill, false, src, now, { a: String(r.your || "").slice(0, 140), b: String(Array.isArray(r.correct) ? r.correct[0] : r.correct || "").slice(0, 140) });
    } else {
      if (openIdx >= 0) {
        const old = mistakes[openIdx];
        const m = { ...old, ...nextMistakeState(old, true), updatedAt: now };
        mistakes[openIdx] = m; mistakeUpd.push(m);
      }
      noteResult(openIdx >= 0 ? (mistakes[openIdx].cat || cat) : cat, r.skill, true, src, now);
    }
    if (r.axis) reviews.push(newReview({ ts: now, item: r.qid, kind: "mistake", axis: r.axis, task: src, ok: r.ok, grade: r.ok ? 2 : 0, ms: r.ms || 0, cat }));
    if (r.skill === "G") { const m = r.qid.match(/^g:([^:]+):/); if (m) { const o = topicRes[m[1]] || [0, 0]; topicRes[m[1]] = [o[0] + (r.ok ? 1 : 0), o[1] + 1]; } }
  }
  state.itemStats = { ...state.itemStats };
  state.mistakes = mistakes;
  emit();
  await db.put("attempts", att);
  await db.putMany("itemStats", statUpd);
  await db.putMany("mistakes", mistakeUpd);
  await flushErrors();
  await flushReviews(reviews);
  for (const [topic, [ok, n]] of Object.entries(topicRes)) {
    // One review per topic per attempt (not per question), so intervals do not explode after a 15-question set. ESTIMATE: >=80% = good, >=60% = hard.
    const ratio = ok / n; const g: Grade = ratio >= 0.8 ? 2 : ratio >= 0.6 ? 1 : 0;
    await reviewSkillItem("g:" + topic, "rec", g, { task: "grammar-quiz", cat: catOfGrammarTopic(topic), label: topic, noError: true });
  }
  await logStudy(a.secs / 60, items.length);
  return att;
}

/** Grades one axis of a vocabulary word, logs the review and feeds the Error Bank (when `cat` is given). */
export async function reviewVocab(id: string, axis: Axis, g: Grade, o: { task: string; ms?: number; cat?: string; ex?: { a: string; b: string } }): Promise<void> {
  const now = Date.now();
  const next = gradeAxis(state.vocab[id], id, axis, g, o.ms || 0, daysToExamOf(state.profile.examDate));
  state.vocab = { ...state.vocab, [id]: next };
  if (o.cat) noteResult(o.cat, "V", g > 0, o.task, now, g === 0 ? o.ex : undefined);
  emit();
  await db.put("vocab", next);
  await flushErrors();
  await flushReviews([newReview({ ts: now, item: id, kind: "vocab", axis, task: o.task, ok: g > 0, grade: g, ms: o.ms || 0, cat: o.cat })]);
}

/** Grades one axis of a grammar structure (SkillItem "g:<topic>"). */
export async function reviewSkillItem(id: string, axis: Axis, g: Grade, o: { task: string; ms?: number; cat: string; label: string; noError?: boolean; ex?: { a: string; b: string }; usedInWriting?: boolean }): Promise<void> {
  const now = Date.now();
  const prev = state.skillItems[id] || { id, updatedAt: 0, kind: "grammar" as const, cat: o.cat, label: o.label, rec: blankAxis(), prod: blankAxis(), writing: { uses: 0, errors: 0, last: 0 } };
  const next: SkillItem = { ...prev, [axis]: stepAxis(prev[axis], g, o.ms || 0, daysToExamOf(state.profile.examDate)), updatedAt: now };
  if (o.usedInWriting) next.writing = { uses: prev.writing.uses + 1, errors: prev.writing.errors + (g === 0 ? 1 : 0), last: now };
  state.skillItems = { ...state.skillItems, [id]: next };
  if (!o.noError) noteResult(o.cat, "G", g > 0, o.task, now, g === 0 ? o.ex : undefined);
  emit();
  await db.put("skillItems", next);
  await flushErrors();
  await flushReviews([newReview({ ts: now, item: id, kind: "skill", axis, task: o.task, ok: g > 0, grade: g, ms: o.ms || 0, cat: o.cat })]);
}

/** Turns feedback items (imported Claude feedback or the local checker) into practice items AND Error Bank events. Idempotent by qid. */
export async function addFeedbackMistakes(origin: { skill: "W" | "S"; id: string; label: string }, list: { original: string; correction: string; explanation?: string; cat: string; raw?: string }[], src: string): Promise<number> {
  const now = Date.now();
  const have = new Set(state.mistakes.map((m) => m.qid));
  const recs: Mistake[] = [];
  list.forEach((e, i) => {
    const qid = `${src}:${origin.id}:${i}`;
    if (have.has(qid) || !e.original) return;
    recs.push({ id: uid("m-"), updatedAt: now, ts: now, skill: origin.skill, ref: origin.id, qid, qtype: catLabel(e.cat), tag: e.raw || e.cat, difficulty: "", prompt: e.original, your: e.original, correct: e.correction || "", explanation: e.explanation || "", resolved: false, reviewOk: 0, reviewCount: 0, cat: e.cat, src, due: todayKey() });
    noteResult(e.cat, origin.skill, false, src, now, { a: e.original, b: e.correction || "" });
  });
  if (!recs.length) return 0;
  state.mistakes = [...recs, ...state.mistakes];
  emit();
  await db.putMany("mistakes", recs);
  await flushErrors();
  return recs.length;
}
export const addAiFeedbackMistakes = (skill: "W" | "S", id: string, label: string, fb: AiFeedback) =>
  addFeedbackMistakes({ skill, id, label }, fb.errors.map((e) => ({ original: e.original, correction: e.correction, explanation: e.explanation, cat: catOfAi(e.category, skill), raw: e.category })), skill === "W" ? "ai-writing" : "ai-speaking");

/** The user refines WHY a Listening answer was missed (or any category): moves the error between categories. */
export async function setMistakeCategory(id: string, cat: string): Promise<void> {
  const m = state.mistakes.find((x) => x.id === id);
  if (!m || m.cat === cat) return;
  const now = Date.now();
  const from = m.cat || categorize(m);
  const r = moveEvent(state.errors[from], state.errors[cat], cat, m.skill, now, m.ts);
  if (r.from) stageError(r.from);
  stageError(r.to);
  const n: Mistake = { ...m, cat, cause: m.skill === "L" ? cat : m.cause, updatedAt: now };
  state.mistakes = state.mistakes.map((x) => (x.id === id ? n : x));
  emit();
  await db.put("mistakes", n);
  await flushErrors();
}

/** One-time upgrade: gives existing mistakes a category and builds the Error Bank from data the user already has. Safe to re-run. */
async function migrateCore(): Promise<void> {
  if (state.kv.coreMigrated === 1) return;
  const now = Date.now();
  const fixed: Mistake[] = [];
  for (const m of state.mistakes) {
    if (m.cat) continue;
    const cat = categorize(m);
    const n: Mistake = { ...m, cat, src: m.src || "legacy", due: m.due || todayKey(), ...(m.skill === "L" ? { cause: cat } : {}), updatedAt: Math.max(m.updatedAt, 1) };
    fixed.push(n);
  }
  if (fixed.length) {
    const byId = new Map(fixed.map((m) => [m.id, m]));
    state.mistakes = state.mistakes.map((m) => byId.get(m.id) || m);
    // Error Bank from history: one event per past mistake at its original timestamp, in chronological order.
    for (const m of [...fixed].sort((a, b) => a.ts - b.ts)) stageError(recordError(state.errors[m.cat!], m.cat!, m.skill, "legacy", m.ts));
    await db.putMany("mistakes", fixed);
    await flushErrors();
  }
  for (const w of state.writings) if (w.ai?.errors?.length && !state.mistakes.some((m) => m.ref === w.id)) await addAiFeedbackMistakes("W", w.id, w.promptType, w.ai);
  for (const r of state.recordings) if (r.ai?.errors?.length && r.part > 0 && !state.mistakes.some((m) => m.ref === r.id)) await addAiFeedbackMistakes("S", r.id, r.topic, r.ai);
  await setKV("coreMigrated", 1);
  emit();
}

export async function addMistakes(list: Omit<Mistake, "id" | "updatedAt">[]): Promise<void> {
  const now = Date.now();
  const recs: Mistake[] = list.map((m) => ({ ...m, id: uid("m-"), updatedAt: now }));
  state.mistakes = [...recs, ...state.mistakes];
  emit();
  await db.putMany("mistakes", recs);
}

export async function setMistakeResolved(id: string, resolved: boolean): Promise<void> {
  const m = state.mistakes.find((x) => x.id === id);
  if (!m) return;
  const n = { ...m, resolved, updatedAt: Date.now() };
  state.mistakes = state.mistakes.map((x) => (x.id === id ? n : x));
  emit();
  await db.put("mistakes", n);
}

export async function deleteAttempt(id: string): Promise<void> {
  state.attempts = state.attempts.filter((a) => a.id !== id);
  emit();
  await db.del("attempts", id);
  await tombstone("attempts", id);
}

/* ---------------- vocabulary SRS ---------------- */
export async function saveVocab(v: VocabState): Promise<void> {
  state.vocab = { ...state.vocab, [v.id]: v };
  emit();
  await db.put("vocab", v);
}

/* ---------------- writing ---------------- */
export async function saveWriting(w: Writing): Promise<void> {
  const n = { ...w, updatedAt: Date.now() };
  const exists = state.writings.some((x) => x.id === w.id);
  state.writings = exists ? state.writings.map((x) => (x.id === w.id ? n : x)) : [n, ...state.writings];
  emit();
  await db.put("writings", n);
}
export async function deleteWriting(id: string): Promise<void> {
  state.writings = state.writings.filter((x) => x.id !== id);
  emit();
  await db.del("writings", id);
  await tombstone("writings", id);
}

/* ---------------- recordings (blob kept only in IndexedDB) ---------------- */
export async function saveRecording(r: Recording): Promise<void> {
  const n = { ...r, updatedAt: Date.now() };
  if (r.blob) await db.put("recordings", n);
  else {
    const full = await db.get<Recording>("recordings", r.id);
    await db.put("recordings", { ...n, blob: full?.blob });
  }
  const meta = { ...n, blob: undefined };
  const exists = state.recordings.some((x) => x.id === r.id);
  state.recordings = exists ? state.recordings.map((x) => (x.id === r.id ? meta : x)) : [meta, ...state.recordings];
  emit();
}
export async function getRecordingBlob(id: string): Promise<Blob | undefined> {
  const r = await db.get<Recording>("recordings", id);
  return r?.blob;
}
export async function deleteRecording(id: string): Promise<void> {
  state.recordings = state.recordings.filter((x) => x.id !== id);
  emit();
  await db.del("recordings", id);
  await tombstone("recordings", id);
}

/* ---------------- mocks / external ---------------- */
export async function saveMock(m: MockResult): Promise<void> {
  const n = { ...m, updatedAt: Date.now() };
  const exists = state.mocks.some((x) => x.id === m.id);
  state.mocks = exists ? state.mocks.map((x) => (x.id === m.id ? n : x)) : [...state.mocks, n];
  emit();
  await db.put("mocks", n);
}
export async function saveExternal(e: ExternalResult): Promise<void> {
  const n = { ...e, updatedAt: Date.now() };
  const exists = state.external.some((x) => x.id === e.id);
  state.external = (exists ? state.external.map((x) => (x.id === e.id ? n : x)) : [...state.external, n]).sort((a, b) => a.date.localeCompare(b.date));
  emit();
  await db.put("external", n);
}
export async function deleteExternal(id: string): Promise<void> {
  state.external = state.external.filter((x) => x.id !== id);
  emit();
  await db.del("external", id);
  await tombstone("external", id);
}

/* ---------------- custom (AI-imported) packs ---------------- */
export async function saveCustomPack(p: CustomPack): Promise<void> {
  state.customPacks = [...state.customPacks.filter((x) => x.id !== p.id), p];
  emit();
  await db.put("customPacks", p);
}
export async function deleteCustomPack(id: string): Promise<void> {
  state.customPacks = state.customPacks.filter((x) => x.id !== id);
  emit();
  await db.del("customPacks", id);
  await tombstone("customPacks", id);
}

/* ---------------- reset ---------------- */
/** Deletes all user data. Device-level records (downloaded-pack registry) are kept so offline content stays usable. */
export async function resetAllData(): Promise<void> {
  const keep = (await db.getAll("kv")).filter((r) => ["packs", "packIndex", "persisted"].includes(r.id));
  for (const s of db.STORES) await db.clearStore(s);
  await db.putMany("kv", keep);
  await loadAll();
}
