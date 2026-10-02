export const uid = (p = ""): string =>
  p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const todayKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const dateFromKey = (k: string): Date => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const daysBetween = (a: Date, b: Date): number =>
  Math.round((dateFromKey(todayKey(b)).getTime() - dateFromKey(todayKey(a)).getTime()) / 86400000);

export const mondayOf = (d: Date = new Date()): Date => {
  const x = dateFromKey(todayKey(d));
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - dow);
  return x;
};

export const fmtDate = (ts: number | string | Date): string => {
  const d = ts instanceof Date ? ts : typeof ts === "string" ? dateFromKey(ts) : new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtShort = (ts: number | string): string => {
  const d = typeof ts === "string" ? dateFromKey(ts) : new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export const fmtMins = (mins: number): string => {
  const m = Math.round(mins);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
};

export const fmtClock = (secs: number): string => {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtBytes = (b: number): string => {
  if (!b) return "0 KB";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 10240 ? 1 : 0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0);
export const avg = (a: number[]): number => (a.length ? sum(a) / a.length : 0);

export const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function downloadFile(name: string, data: string | Blob, type = "application/json"): void {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export const wordCount = (t: string): number => (t.trim().match(/[A-Za-z0-9'’-]+/g) || []).length;

/** Deterministic id for audio clips (same algorithm in build.mjs). */
export function clipId(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return "c" + (h >>> 0).toString(36);
}
