/* In-memory mirror of IndexedDB + actions. Every mutation is written to IndexedDB immediately. */
import { useSyncExternalStore } from "react";
import * as db from "./db";
import type {
  Attempt, CustomPack, ExternalResult, ItemStat, Mistake, MockResult, Profile, Recording,
  Session, Settings, VocabState, Writing, AnySkill,
} from "./types";
import { todayKey, uid } from "./util";

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
  sessions: {}, mocks: [], external: [], customPacks: [],
};
const listeners = new Set<() => void>();
const emit = () => { state = { ...state }; listeners.forEach((l) => l()); };
export const getState = () => state;
export const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export function useStore(): State { return useSyncExternalStore(subscribe, getState, getState); }

const byId = <T extends { id: string }>(arr: T[]) => Object.fromEntries(arr.map((r) => [r.id, r])) as Record<string, T>;

export async function loadAll(): Promise<void> {
  try {
    const [kv, attempts, itemStats, mistakes, vocab, writings, recordings, sessions, mocks, external, customPacks] =
      await Promise.all([
        db.getAll("kv"), db.getAll<Attempt>("attempts"), db.getAll<ItemStat>("itemStats"), db.getAll<Mistake>("mistakes"),
        db.getAll<VocabState>("vocab"), db.getAll<Writing>("writings"), db.getAll<Recording>("recordings"),
        db.getAll<Session>("sessions"), db.getAll<MockResult>("mocks"), db.getAll<ExternalResult>("external"),
        db.getAll<CustomPack>("customPacks"),
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
      customPacks,
    };
  } catch (e: any) {
    state = { ...state, ready: true, error: String(e?.message || e) };
  }
  emit();
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
}

export async function recordAttempt(a: Omit<Attempt, "id" | "updatedAt">, items: ItemResult[]): Promise<Attempt> {
  const att: Attempt = { ...a, id: uid("a-"), updatedAt: Date.now() };
  state.attempts = [...state.attempts, att];
  const now = Date.now();
  const statUpd: ItemStat[] = [];
  const mistakeUpd: Mistake[] = [];
  const mistakes = state.mistakes.slice();
  for (const r of items) {
    const prev = state.itemStats[r.qid] || { id: r.qid, c: 0, w: 0, last: 0, lastOk: false, updatedAt: 0 };
    const s: ItemStat = { id: r.qid, c: prev.c + (r.ok ? 1 : 0), w: prev.w + (r.ok ? 0 : 1), last: now, lastOk: r.ok, updatedAt: now };
    state.itemStats[r.qid] = s;
    statUpd.push(s);
    const openIdx = mistakes.findIndex((m) => m.qid === r.qid && !m.resolved);
    if (!r.ok) {
      if (openIdx >= 0) {
        const m = { ...mistakes[openIdx], ts: now, your: r.your, reviewOk: 0, reviewCount: mistakes[openIdx].reviewCount + 1, updatedAt: now };
        mistakes[openIdx] = m; mistakeUpd.push(m);
      } else {
        const m: Mistake = {
          id: uid("m-"), updatedAt: now, ts: now, skill: r.skill, ref: r.ref, qid: r.qid, qtype: r.qtype, tag: r.tag,
          difficulty: r.difficulty, prompt: r.prompt, your: r.your || "(blank)", correct: r.correct,
          explanation: r.explanation, resolved: false, reviewOk: 0, reviewCount: 0,
        };
        mistakes.unshift(m); mistakeUpd.push(m);
      }
    } else if (openIdx >= 0) {
      const old = mistakes[openIdx];
      const reviewOk = old.reviewOk + 1;
      const m = { ...old, reviewOk, reviewCount: old.reviewCount + 1, resolved: reviewOk >= 2, updatedAt: now };
      mistakes[openIdx] = m; mistakeUpd.push(m);
    }
  }
  state.itemStats = { ...state.itemStats };
  state.mistakes = mistakes;
  emit();
  await db.put("attempts", att);
  await db.putMany("itemStats", statUpd);
  await db.putMany("mistakes", mistakeUpd);
  await logStudy(a.secs / 60, items.length);
  return att;
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
