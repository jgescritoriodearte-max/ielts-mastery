import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadAll, getState } from "./lib/store";
import { buildContent, downloadPack, getIndex, isDownloaded, packMeta, refreshIndex, verifyCaches } from "./lib/packs";
import { registerSW } from "./lib/pwa";
import { requestPersistence } from "./lib/db";
import { setKV } from "./lib/store";
import { applyTheme } from "./lib/theme";


async function autoDownload() {
  const s = getState();
  if (!navigator.onLine || !s.settings.autoDownload) return;
  let changed = false;
  for (const p of getIndex()) {
    const m = packMeta()[p.id];
    if ((p.essential && !isDownloaded(p.id)) || (m && m.version !== p.version)) {
      try { await downloadPack(p); changed = true; } catch { /* retry next time */ }
    }
  }
  if (changed) await buildContent();
}

async function boot() {
  registerSW();
  await loadAll();
  applyTheme();
  await refreshIndex();
  await verifyCaches();
  await buildContent();
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
  document.getElementById("splash")?.remove();
  const persisted = await requestPersistence();
  await setKV("persisted", persisted);
  autoDownload();
  window.addEventListener("online", () => { refreshIndex().then(autoDownload); });
}

boot().catch((e) => {
  const el = document.getElementById("splash");
  if (el) el.innerHTML = `<div style="max-width:420px;padding:24px;text-align:center"><h2>IELTS Mastery could not start</h2><p>${String(e?.message || e)}</p><p>Your data is stored in this browser and has not been deleted. Try reloading.</p></div>`;
});

