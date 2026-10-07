/* Backup: export / validate / merge / replace. Pure local files - nothing is uploaded anywhere. */
import * as db from "./db";
import { getState, loadAll, setKV } from "./store";
import type { StoreName } from "./db";
import { todayKey } from "./util";

export const SCHEMA = 2; // v2 adds errors, reviews, skillItems. Backups from schema 1 still import (missing stores are treated as empty).
export const APP_ID = "IELTS Mastery";
const DEVICE_KV = new Set(["packs", "packIndex", "lastBackup", "swVersion"]); // device-specific, never imported

export interface BackupFile {
  app: string; schema: number; exportedAt: number; includesRecordings: boolean;
  counts: Record<string, number>; checksum: string; data: Record<string, any[]>;
}

async function hash(text: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return "sha256:" + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return "fnv:" + (h >>> 0).toString(16);
  }
}

const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
const dataUrlToBlob = async (u: string) => (await fetch(u)).blob();

export async function buildBackup(includeRecordings: boolean): Promise<{ name: string; text: string; bytes: number }> {
  const data: Record<string, any[]> = {};
  for (const s of db.STORES) {
    let rows = await db.getAll(s);
    if (s === "kv") rows = rows.filter((r) => !DEVICE_KV.has(r.id));
    if (s === "recordings") {
      rows = await Promise.all(rows.map(async (r) => {
        const { blob, ...rest } = r;
        return includeRecordings && blob ? { ...rest, audioData: await blobToDataUrl(blob) } : { ...rest, audioOmitted: !!blob };
      }));
    }
    data[s] = rows;
  }
  const payload = JSON.stringify(data);
  const file: BackupFile = {
    app: APP_ID, schema: SCHEMA, exportedAt: Date.now(), includesRecordings: includeRecordings,
    counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
    checksum: await hash(payload), data,
  };
  const text = JSON.stringify(file);
  return { name: `IELTS-Mastery-Backup-${todayKey()}.json`, text, bytes: text.length };
}

export async function markBackedUp(): Promise<void> { await setKV("lastBackup", Date.now()); }

export interface Validation { ok: boolean; checks: { label: string; ok: boolean; detail: string }[]; file?: BackupFile; total: number; }

export async function validateBackup(text: string): Promise<Validation> {
  const checks: Validation["checks"] = [];
  let f: any;
  try { f = JSON.parse(text); checks.push({ label: "File valid", ok: true, detail: "Readable JSON." }); }
  catch (e: any) { checks.push({ label: "File valid", ok: false, detail: "This is not a valid JSON file (" + (e?.message || "parse error") + ")." }); return { ok: false, checks, total: 0 }; }
  const isApp = f && f.app === APP_ID && f.data && typeof f.data === "object";
  checks.push({ label: "IELTS Mastery backup", ok: !!isApp, detail: isApp ? "Created by IELTS Mastery." : "Missing the IELTS Mastery header - this file was not created by the app." });
  if (!isApp) return { ok: false, checks, total: 0 };
  const compatible = typeof f.schema === "number" && f.schema <= SCHEMA;
  checks.push({ label: "Schema compatible", ok: compatible, detail: compatible ? `Schema v${f.schema} (app supports up to v${SCHEMA}).` : `Schema v${f.schema} is newer than this app (v${SCHEMA}). Update the app first.` });
  let total = 0; const bad: string[] = [];
  for (const [store, rows] of Object.entries<any>(f.data)) {
    if (!(db.STORES as readonly string[]).includes(store)) { bad.push(`unknown section "${store}"`); continue; }
    if (!Array.isArray(rows)) { bad.push(`"${store}" is not a list`); continue; }
    rows.forEach((r: any, i: number) => { if (!r || typeof r.id !== "string") bad.push(`${store}[${i}] has no id`); });
    total += rows.length;
  }
  checks.push({ label: "Records found", ok: total > 0 && !bad.length, detail: bad.length ? bad.slice(0, 4).join("; ") : `${total} records in ${Object.keys(f.data).length} sections.` });
  const sum = await hash(JSON.stringify(f.data));
  const intact = sum === f.checksum || (sum.split(":")[0] !== String(f.checksum).split(":")[0]);
  checks.push({ label: "No corruption detected", ok: intact, detail: intact ? "Checksum matches the content." : "Checksum mismatch - the file was modified or damaged after export." });
  const ok = checks.every((c) => c.ok);
  return { ok, checks, file: f, total };
}

async function prepareRows(store: string, rows: any[]): Promise<any[]> {
  if (store === "kv") rows = rows.filter((r) => !DEVICE_KV.has(r.id));
  if (store !== "recordings") return rows;
  return Promise.all(rows.map(async (r) => {
    const { audioData, audioOmitted, ...rest } = r;
    return audioData ? { ...rest, blob: await dataUrlToBlob(audioData) } : rest;
  }));
}

export interface MergeReport { added: number; updated: number; kept: number; skippedDeleted: number; }

/** Merge: a record is taken from the file only if it is new here or has a newer updatedAt. Deleted records stay deleted. */
export async function mergeBackup(f: BackupFile): Promise<MergeReport> {
  const rep: MergeReport = { added: 0, updated: 0, kept: 0, skippedDeleted: 0 };
  const localTomb: Record<string, number> = getState().kv.tombstones || {};
  const fileTomb: Record<string, number> = (f.data.kv || []).find((r: any) => r.id === "tombstones")?.value || {};
  const tomb: Record<string, number> = { ...fileTomb };
  for (const [k, v] of Object.entries(localTomb)) tomb[k] = Math.max(v, tomb[k] || 0);
  for (const store of db.STORES) {
    const incoming = await prepareRows(store, f.data[store] || []);
    if (!incoming.length) continue;
    const current = new Map((await db.getAll(store)).map((r: any) => [r.id, r]));
    const toPut: any[] = [];
    for (const r of incoming) {
      if (store === "kv" && r.id === "tombstones") continue;
      const t = tomb[`${store}:${r.id}`];
      if (t && t >= (r.updatedAt || 0)) { rep.skippedDeleted++; continue; }
      const cur = current.get(r.id);
      if (!cur) { toPut.push(r); rep.added++; }
      else if ((r.updatedAt || 0) > (cur.updatedAt || 0)) {
        toPut.push(store === "recordings" && !r.blob && cur.blob ? { ...r, blob: cur.blob } : r); rep.updated++;
      } else rep.kept++;
    }
    await db.putMany(store, toPut);
  }
  for (const k of Object.keys(tomb)) {
    const [store, id] = [k.slice(0, k.indexOf(":")), k.slice(k.indexOf(":") + 1)];
    if ((db.STORES as readonly string[]).includes(store)) {
      const cur: any = await db.get(store as StoreName, id);
      if (cur && (cur.updatedAt || 0) <= tomb[k]) await db.del(store as StoreName, id);
    }
  }
  await db.put("kv", { id: "tombstones", value: tomb, updatedAt: Date.now() });
  await loadAll();
  return rep;
}

/** Replace: everything is swapped in one IndexedDB transaction (all-or-nothing), keeping device-specific settings. */
export async function replaceWithBackup(f: BackupFile): Promise<void> {
  const keepKv = (await db.getAll("kv")).filter((r) => DEVICE_KV.has(r.id));
  const data: Record<string, any[]> = {};
  for (const store of db.STORES) data[store] = await prepareRows(store, f.data[store] || []);
  data.kv = [...data.kv, ...keepKv];
  await db.replaceAll(data as any);
  await loadAll();
}

export async function storageBreakdown(): Promise<{ userData: number; recordings: number }> {
  let userData = 0, recordings = 0;
  for (const s of db.STORES) {
    const rows = await db.getAll(s);
    for (const r of rows) {
      if (s === "recordings") { recordings += r.blob?.size || 0; const { blob, ...m } = r; userData += JSON.stringify(m).length; }
      else userData += JSON.stringify(r).length;
    }
  }
  return { userData, recordings };
}
