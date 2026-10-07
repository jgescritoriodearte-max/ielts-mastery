/* IndexedDB wrapper. All user data lives here (never localStorage). */
export const DB_NAME = "ielts-mastery";
export const DB_VERSION = 2; // v2 adds errors, reviews, skillItems (additive; no existing record is changed)
export const STORES = [
  "kv", "attempts", "itemStats", "mistakes", "vocab", "writings",
  "recordings", "sessions", "mocks", "external", "customPacks",
  "errors", "reviews", "skillItems",
] as const;
export type StoreName = (typeof STORES)[number];

let dbp: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (!("indexedDB" in self)) { reject(new Error("IndexedDB not supported")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbp = null; };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("Database blocked by another tab"));
  });
  return dbp;
}

function wrap<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}

export async function getAll<T = any>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  return wrap(db.transaction(store, "readonly").objectStore(store).getAll()) as Promise<T[]>;
}

export async function get<T = any>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await openDB();
  return wrap(db.transaction(store, "readonly").objectStore(store).get(id)) as Promise<T | undefined>;
}

export async function put(store: StoreName, rec: any): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(rec);
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
}

export async function putMany(store: StoreName, recs: any[]): Promise<void> {
  if (!recs.length) return;
  const db = await openDB();
  const tx = db.transaction(store, "readwrite");
  const os = tx.objectStore(store);
  for (const r of recs) os.put(r);
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
}

export async function del(store: StoreName, id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(id);
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}

export async function clearStore(store: StoreName): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).clear();
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}

/** Atomic replace of several stores in one transaction (used by Backup Replace). */
export async function replaceAll(data: Partial<Record<StoreName, any[]>>): Promise<void> {
  const db = await openDB();
  const names = Object.keys(data) as StoreName[];
  const tx = db.transaction(names, "readwrite");
  for (const n of names) {
    const os = tx.objectStore(n);
    os.clear();
    for (const r of data[n] || []) os.put(r);
  }
  await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error("aborted")); });
}

export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (!navigator.storage || !navigator.storage.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}

export async function isPersisted(): Promise<boolean | null> {
  try { return navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null; } catch { return null; }
}
