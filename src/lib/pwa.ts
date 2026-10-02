/* Service worker registration, update flow, install prompt and online status. */
import { useEffect, useState, useSyncExternalStore } from "react";

let waiting: ServiceWorker | null = null;
let registration: ServiceWorkerRegistration | null = null;
let installEvt: any = null;
const subs = new Set<() => void>();
let snap = { updateReady: false, canInstall: false, swActive: false };
const emit = () => { snap = { updateReady: !!waiting, canInstall: !!installEvt, swActive: !!navigator.serviceWorker?.controller }; subs.forEach((f) => f()); };
export const usePwa = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => snap, () => snap);

export async function registerSW(): Promise<void> {
  window.addEventListener("beforeinstallprompt", (e: any) => { e.preventDefault(); installEvt = e; emit(); });
  window.addEventListener("appinstalled", () => { installEvt = null; emit(); });
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return;
  try {
    registration = await navigator.serviceWorker.register("sw.js", { scope: "./", updateViaCache: "none" });
    const track = (sw: ServiceWorker | null) => {
      if (!sw) return;
      sw.addEventListener("statechange", () => { if (sw.state === "installed" && navigator.serviceWorker.controller) { waiting = sw; emit(); } if (sw.state === "activated") emit(); });
    };
    if (registration.waiting && navigator.serviceWorker.controller) { waiting = registration.waiting; emit(); }
    track(registration.installing);
    registration.addEventListener("updatefound", () => track(registration!.installing));
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      if (sessionStorage.getItem("im-update") === "1") { reloaded = true; sessionStorage.removeItem("im-update"); location.reload(); } else emit();
    });
    const check = () => { if (navigator.onLine) registration?.update().catch(() => undefined); };
    window.addEventListener("online", check);
    setInterval(check, 60 * 60 * 1000);
    emit();
  } catch { /* offline first load or unsupported: the app still works from memory */ }
}

export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  try { await registration.update(); } catch { return false; }
  await new Promise((r) => setTimeout(r, 1500));
  return !!(registration.waiting || waiting);
}

/** Activates the new version. User data (IndexedDB) and offline packs (pack-* caches) are untouched by updates. */
export function applyUpdate(): void {
  const w = waiting || registration?.waiting;
  if (!w) { location.reload(); return; }
  sessionStorage.setItem("im-update", "1");
  w.postMessage({ type: "SKIP_WAITING" });
  setTimeout(() => location.reload(), 4000);
}

export async function promptInstall(): Promise<boolean> {
  if (!installEvt) return false;
  installEvt.prompt();
  const r = await installEvt.userChoice.catch(() => null);
  installEvt = null; emit();
  return r?.outcome === "accepted";
}

export const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;

export function useOnline(): boolean {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener("online", a); window.addEventListener("offline", b);
    return () => { window.removeEventListener("online", a); window.removeEventListener("offline", b); };
  }, []);
  return on;
}

export function useRoute(): { parts: string[]; query: URLSearchParams; path: string } {
  const get = () => location.hash.replace(/^#\/?/, "");
  const [h, setH] = useState(get());
  useEffect(() => { const f = () => { setH(get()); window.scrollTo(0, 0); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const [path, qs] = h.split("?");
  return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs || ""), path };
}
export const go = (to: string) => { location.hash = to.startsWith("#") ? to : "#" + to; };
