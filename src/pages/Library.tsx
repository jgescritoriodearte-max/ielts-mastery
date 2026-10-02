import React, { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { buildContent, cacheUsage, downloadPack, getIndex, getIndexSource, packMeta, refreshIndex, removeAllPacks, removePack, usePacksVersion, type PackEntry } from "../lib/packs";
import { storageBreakdown } from "../lib/backup";
import { checkForUpdate, applyUpdate, isStandalone, promptInstall, useOnline, usePwa } from "../lib/pwa";
import { offlineVoiceCount, ttsSupported } from "../lib/tts";
import { fmtBytes, fmtDate } from "../lib/util";
import { AiLabel, Empty, Icon, Modal, toast } from "../ui/components";
import { requestPersistence } from "../lib/db";

export function LibraryPage() {
  const s = useStore();
  usePacksVersion();
  const online = useOnline();
  const pwa = usePwa();
  const idx = getIndex();
  const meta = packMeta();
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState<{ app: number; packs: number; audio: number; user: number; rec: number; quota?: number; used?: number } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [voices, setVoices] = useState(0);
  const refreshUsage = async () => {
    const c = await cacheUsage(); const b = await storageBreakdown();
    let quota, used; try { const e = await navigator.storage.estimate(); quota = e.quota; used = e.usage; } catch { /* ignore */ }
    setUsage({ ...c, user: b.userData, rec: b.recordings, quota, used });
  };
  useEffect(() => { refreshUsage(); setVoices(offlineVoiceCount()); const t = setTimeout(() => setVoices(offlineVoiceCount()), 1500); return () => clearTimeout(t); }, [Object.keys(meta).join()]);

  const dl = async (p: PackEntry) => {
    setBusy((b) => ({ ...b, [p.id]: "0%" }));
    try { await downloadPack(p, (d, t) => setBusy((b) => ({ ...b, [p.id]: Math.round((100 * d) / t) + "%" }))); await buildContent(); toast(`${p.title} is available offline.`); }
    catch (e: any) { toast(`Download failed: ${e?.message || e}. Your existing content was kept.`); }
    setBusy((b) => { const n = { ...b }; delete n[p.id]; return n; });
  };
  const rm = async (p: PackEntry) => { await removePack(p.id); await buildContent(); toast(`${p.title} removed. Your progress is kept.`); };
  const essentialsOk = idx.filter((p) => p.essential).every((p) => meta[p.id]);
  const checks = [
    { ok: pwa.swActive, label: "Offline engine (service worker) active", fix: "Reload the app once while online." },
    { ok: essentialsOk && idx.length > 0, label: "All essential packs downloaded", fix: "Download the packs below while online." },
    { ok: s.kv.persisted === true, label: "Persistent storage granted", fix: "Install the app; browsers usually grant it to installed apps." },
    { ok: !ttsSupported() ? false : voices > 0, label: "Offline English voice on this device", fix: "Only needed for items without pre-produced audio. Android: Settings › Text-to-speech › install English." },
    { ok: isStandalone(), label: "Installed as an app", fix: "Use the browser menu › Install app / Add to Home screen." },
  ];
  return (
    <>
      <div className="page-head"><div><h1>Offline Library</h1><p className="sub">Download content while you have internet; afterwards it works without connection. Removing or updating a pack never touches your progress.</p></div>
        <div className="row">{pwa.canInstall && <button className="btn primary" onClick={promptInstall}><Icon name="download" />Install app</button>}
          <button className="btn" disabled={!online} onClick={async () => { await refreshIndex(); const u = await checkForUpdate(); toast(u ? "A new version is ready." : "You have the latest version."); }}><Icon name="refresh" />Check for updates</button>
          {pwa.updateReady && <button className="btn primary" onClick={applyUpdate}>Install update</button>}</div></div>

      <div className="card stack">
        <h2>Offline readiness</h2>
        {checks.map((c) => <div key={c.label} className="row" style={{ alignItems: "flex-start" }}><span style={{ color: c.ok ? "var(--good)" : "var(--warn)", fontWeight: 700, width: 18 }}>{c.ok ? "✓" : "!"}</span><div style={{ flex: 1 }}><b className="small">{c.label}</b>{!c.ok && <div className="tiny muted">{c.fix}</div>}</div></div>)}
        {s.kv.persisted !== true && <button className="btn sm" style={{ alignSelf: "flex-start" }} onClick={async () => { const r = await requestPersistence(); toast(r ? "Persistent storage granted." : "The browser did not grant persistent storage. Keep regular backups."); }}>Request persistent storage</button>}
      </div>

      <div className="card stack">
        <div className="row between"><h2>Content packs</h2><span className="small muted">{getIndexSource() === "network" ? "Catalogue up to date" : getIndexSource() === "saved" ? "Offline — showing the saved catalogue" : "Catalogue unavailable offline"}</span></div>
        {idx.length ? idx.map((p) => {
          const m = meta[p.id];
          const outdated = m && m.version !== p.version;
          return (
            <div key={p.id} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "10px 0", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="row" style={{ gap: 8 }}><b>{p.title}</b>{m ? <span className="chip good">Downloaded ✓</span> : <span className="chip">Not downloaded</span>}{outdated && <span className="chip warn">Update available</span>}{p.essential && <span className="chip accent">essential</span>}{/AI-generated/i.test(p.label || "") && <AiLabel />}</div>
                <div className="small muted">{p.description}</div>
                <div className="tiny muted">{fmtBytes(p.bytes)}{p.kind === "listening" || p.kind === "mock" || p.kind === "prompts" ? ` · ${p.audioFiles ? `${p.audioFiles} pre-produced audio files (${fmtBytes(p.audioBytes)})` : "no pre-produced audio yet — Device Voice is used"}` : ""}{m ? ` · downloaded ${fmtDate(m.downloadedAt)}` : ""}</div>
              </div>
              <div className="row">
                {busy[p.id] ? <span className="chip accent">Downloading {busy[p.id]}</span> : <>
                  {!m && <button className="btn sm primary" disabled={!online} onClick={() => dl(p)}><Icon name="download" />Download</button>}
                  {outdated && <button className="btn sm primary" disabled={!online} onClick={() => dl(p)}><Icon name="refresh" />Update</button>}
                  {m && <button className="btn sm ghost danger" onClick={() => rm(p)}><Icon name="trash" />Remove</button>}
                </>}
              </div>
            </div>);
        }) : <Empty>No catalogue on this device yet. Connect to the internet once to load it.</Empty>}
        {!online && <p className="small muted">Downloads need internet. Everything already downloaded keeps working.</p>}
        {s.customPacks.length > 0 && <><h3 style={{ marginTop: 10 }}>AI-generated packs (stored with your data)</h3>{s.customPacks.map((p) => <div key={p.id} className="row between"><span>{p.title} <span className="small muted">· {p.kind}</span></span><AiLabel /></div>)}</>}
      </div>

      <div className="card stack">
        <h2>Storage</h2>
        {usage ? <div className="table-wrap"><table className="t"><tbody>
          <tr><td>Application</td><td className="num">{fmtBytes(usage.app)}</td></tr>
          <tr><td>Content packs (text)</td><td className="num">{fmtBytes(usage.packs)}</td></tr>
          <tr><td>Audio (pre-produced)</td><td className="num">{fmtBytes(usage.audio)}</td></tr>
          <tr><td>User data (progress, essays, settings)</td><td className="num">{fmtBytes(usage.user)}</td></tr>
          <tr><td>My recordings</td><td className="num">{fmtBytes(usage.rec)}</td></tr>
          <tr><th>Total</th><th className="num">{fmtBytes(usage.app + usage.packs + usage.audio + usage.user + usage.rec)}</th></tr>
          {usage.quota ? <tr><td className="small muted">Browser quota for this app</td><td className="num small muted">{fmtBytes(usage.used || 0)} used of {fmtBytes(usage.quota)}</td></tr> : null}
        </tbody></table></div> : <p className="muted">Calculating…</p>}
        <div className="row"><button className="btn danger" onClick={() => setConfirm(true)}><Icon name="trash" />Clear downloaded content</button><span className="small muted">Removes packs and audio only. Progress, essays and recordings are kept.</span></div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Clear downloaded content?">
        <p>All content packs and audio files are removed from this device. Your progress, essays, recordings and settings are <b>not</b> affected. You will need internet to download the packs again.</p>
        <div className="row"><button className="btn danger solid" onClick={async () => { await removeAllPacks(); await buildContent(); setConfirm(false); refreshUsage(); toast("Downloaded content cleared."); }}>Clear content</button><button className="btn" onClick={() => setConfirm(false)}>Cancel</button></div>
      </Modal>
    </>
  );
}
