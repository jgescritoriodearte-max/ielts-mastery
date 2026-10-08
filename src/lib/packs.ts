/* Offline content packs. Each pack lives in its own Cache Storage bucket ("pack-<id>@<version>"),
   which the service worker never deletes during app updates. Custom (AI-imported) packs live in IndexedDB. */
import { useSyncExternalStore } from "react";
import { getState, setKV, subscribe as subStore } from "./store";
import type { Group, QSet } from "./types";
import type { Lesson } from "./lessons";

export interface PackEntry {
  id: string; title: string; kind: string; version: string; essential: boolean;
  files: string[]; bytes: number; audioBytes: number; audioFiles: number; label: string; description: string;
}
export interface PackMeta { version: string; bytes: number; audioBytes: number; downloadedAt: number; files: number; }

const BASE = "packs/";
const PREFIX = "pack-";
let index: PackEntry[] = [];
let indexSource: "network" | "saved" | "none" = "none";
const loaded = new Map<string, any>();
let version = 0;
const subs = new Set<() => void>();
const bump = () => { version++; subs.forEach((f) => f()); };
export const usePacksVersion = () => useSyncExternalStore((f) => { subs.add(f); const u = subStore(f); return () => { subs.delete(f); u(); }; }, () => version + getState().customPacks.length * 1e6, () => 0);

export const getIndex = () => index;
export const getIndexSource = () => indexSource;
export const packMeta = (): Record<string, PackMeta> => getState().kv.packs || {};
export const isDownloaded = (id: string) => !!packMeta()[id];
const hasCaches = () => typeof caches !== "undefined";

export async function refreshIndex(): Promise<void> {
  try {
    const r = await fetch(BASE + "index.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    index = j.packs || [];
    indexSource = "network";
    await setKV("packIndex", index);
  } catch {
    const saved = getState().kv.packIndex;
    index = saved || [];
    indexSource = saved ? "saved" : "none";
  }
  bump();
}

export async function verifyCaches(): Promise<void> {
  if (!hasCaches()) return;
  const meta = { ...packMeta() };
  const names = await caches.keys();
  let changed = false;
  for (const id of Object.keys(meta)) {
    if (!names.some((n) => n.startsWith(PREFIX + id + "@"))) { delete meta[id]; changed = true; }
  }
  if (changed) await setKV("packs", meta);
}

export async function downloadPack(p: PackEntry, onProgress?: (done: number, total: number) => void): Promise<void> {
  if (!hasCaches()) throw new Error("This browser does not support offline storage (Cache API).");
  const name = `${PREFIX}${p.id}@${p.version}`;
  const cache = await caches.open(name);
  let done = 0;
  try {
    for (const f of p.files) {
      const url = new URL(BASE + p.id + "/" + f, location.href).href;
      const r = await fetch(url, { cache: "reload" });
      if (!r.ok) throw new Error(`Could not download ${f} (${r.status})`);
      await cache.put(url, r);
      onProgress?.(++done, p.files.length);
    }
  } catch (e) {
    await caches.delete(name);
    throw e;
  }
  for (const n of await caches.keys()) if (n.startsWith(PREFIX + p.id + "@") && n !== name) await caches.delete(n);
  loaded.delete(p.id);
  await setKV("packs", { ...packMeta(), [p.id]: { version: p.version, bytes: p.bytes, audioBytes: p.audioBytes, downloadedAt: Date.now(), files: p.files.length } });
  bump();
}

export async function removePack(id: string): Promise<void> {
  if (hasCaches()) for (const n of await caches.keys()) if (n.startsWith(PREFIX + id + "@")) await caches.delete(n);
  const meta = { ...packMeta() }; delete meta[id];
  loaded.delete(id);
  await setKV("packs", meta);
  bump();
}

export async function removeAllPacks(): Promise<void> {
  for (const id of Object.keys(packMeta())) await removePack(id);
}

async function fetchPackFile(id: string, file: string): Promise<Response | null> {
  const url = new URL(BASE + id + "/" + file, location.href).href;
  if (hasCaches()) {
    const hit = await caches.match(url);
    if (hit) return hit;
  }
  try { const r = await fetch(url); return r.ok ? r : null; } catch { return null; }
}

export async function loadPack(id: string): Promise<any | null> {
  if (loaded.has(id)) return loaded.get(id);
  const r = await fetchPackFile(id, "pack.json");
  if (!r) return null;
  try { const j = await r.json(); loaded.set(id, j); return j; } catch { return null; }
}

const audioUrls = new Map<string, string>();
export async function audioUrl(packId: string, file: string): Promise<string | null> {
  const k = packId + "/" + file;
  if (audioUrls.has(k)) return audioUrls.get(k)!;
  const r = await fetchPackFile(packId, file);
  if (!r) return null;
  const u = URL.createObjectURL(await r.blob());
  audioUrls.set(k, u);
  return u;
}

/* ---------------- Content registry ---------------- */
export interface Content {
  listening: QSet[]; reading: QSet[];
  grammar: any[]; lessons: Lesson[]; vocab: { id: string; cat: string; w: string[]; custom?: boolean }[];
  prompts: any | null; mocks: any[]; mockSets: Record<string, QSet>; paraphrase: any[];
  audio: Record<string, { pack: string; file: string; dur: number; marks: number[] }>;
  maps: Record<string, any>;
  missing: string[];
}
let content: Content = { listening: [], reading: [], grammar: [], lessons: [], vocab: [], prompts: null, mocks: [], mockSets: {}, paraphrase: [], audio: {}, maps: {}, missing: [] };
export const getContent = () => content;

/* Difficulty levels: Level 1 (≈5.5) … Level 5 (7.5+). Older sets used descriptive names; they are mapped here. */
export const LEVELS = ["Level 1 · 5.5", "Level 2 · 6.0", "Level 3 · 6.5", "Level 4 · 7.0", "Level 5 · 7.5+"];
const OLD_BAND: Record<string, number> = { Beginner: 5.5, Intermediate: 6, "Upper-Intermediate": 6.5, Advanced: 7, "IELTS Level": 7 };
const BAND_LEVEL: Record<string, string> = { "5.5": LEVELS[0], "6": LEVELS[1], "6.5": LEVELS[2], "7": LEVELS[3], "7.5": LEVELS[4] };
export const bandOfSet = (s: { band?: number; level?: string }): number => s.band ?? OLD_BAND[s.level || ""] ?? 6.5;
const tagSets = (sets: any[], skill: "L" | "R", packId: string, generated = false): QSet[] =>
  sets.map((s) => { const band = bandOfSet(s); return { ...s, band, level: BAND_LEVEL[String(band)] || s.level, skill, packId, generated, groups: s.groups as Group[] }; });

export async function buildContent(): Promise<void> {
  const c: Content = { listening: [], reading: [], grammar: [], lessons: [], vocab: [], prompts: null, mocks: [], mockSets: {}, paraphrase: [], audio: {}, maps: {}, missing: [] };
  const ids = index.length ? index.map((p) => p.id) : Object.keys(packMeta());
  for (const id of ids) {
    const p = await loadPack(id);
    if (!p) { c.missing.push(id); continue; }
    for (const [job, a] of Object.entries<any>(p.audio || {})) c.audio[job] = { pack: id, ...a };
    Object.assign(c.maps, p.data?.maps || {});
    const gen = /AI-generated/i.test(p.label || "");
    if (p.kind === "listening") c.listening.push(...tagSets(p.data.sets, "L", id, gen));
    else if (p.kind === "reading") c.reading.push(...tagSets(p.data.sets, "R", id, gen));
    else if (p.kind === "grammar") { c.grammar.push(...p.data.topics); c.lessons.push(...(p.data.lessons || [])); }
    else if (p.kind === "vocabulary") for (const [cat, words] of Object.entries<any[]>(p.data.categories)) words.forEach((w) => c.vocab.push({ id: `${cat}:${w[0]}`, cat, w }));
    else if (p.kind === "prompts") c.prompts = p.data;
    else if (p.kind === "paraphrase") c.paraphrase.push(...(p.data.items || []));
    else if (p.kind === "mock") {
      c.mocks.push({ ...p.data.mock, packId: id });
      tagSets(p.data.listening, "L", id, gen).forEach((s) => (c.mockSets[s.id] = s));
      tagSets(p.data.reading, "R", id, gen).forEach((s) => (c.mockSets[s.id] = s));
    }
  }
  for (const cp of getState().customPacks) {
    const d = cp.data;
    if (cp.kind === "reading") c.reading.push(...tagSets(d.sets, "R", cp.id, true));
    else if (cp.kind === "listening") c.listening.push(...tagSets(d.sets, "L", cp.id, true));
    else if (cp.kind === "grammar") c.grammar.push(...d.topics.map((t: any) => ({ ...t, generated: true })));
    else if (cp.kind === "vocabulary") for (const [cat, words] of Object.entries<any[]>(d.categories)) words.forEach((w) => c.vocab.push({ id: `${cat}:${w[0]}`, cat, w, custom: true }));
  }
  content = c;
  bump();
}

export function findSet(id: string): QSet | undefined {
  return content.reading.find((s) => s.id === id) || content.listening.find((s) => s.id === id) || content.mockSets[id];
}

export async function cacheUsage(): Promise<{ app: number; packs: number; audio: number }> {
  let app = 0, packs = 0, audio = 0;
  if (!hasCaches()) return { app, packs, audio };
  for (const n of await caches.keys()) {
    const c = await caches.open(n);
    for (const req of await c.keys()) {
      const r = await c.match(req);
      if (!r) continue;
      let size = Number(r.headers.get("content-length") || 0);
      if (!size) { try { size = (await r.clone().blob()).size; } catch { size = 0; } }
      if (n.startsWith(PREFIX)) { if (/\.(mp3|ogg|m4a|wav|opus)$/i.test(req.url)) audio += size; else packs += size; }
      else app += size;
    }
  }
  return { app, packs, audio };
}
