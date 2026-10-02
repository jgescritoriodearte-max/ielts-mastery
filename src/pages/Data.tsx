import React, { useEffect, useRef, useState } from "react";
import { resetAllData, useStore } from "../lib/store";
import { buildBackup, markBackedUp, mergeBackup, replaceWithBackup, storageBreakdown, validateBackup, type BackupFile, type MergeReport, type Validation } from "../lib/backup";
import { buildContent } from "../lib/packs";
import { downloadFile, fmtBytes, fmtDate } from "../lib/util";
import { Icon, Modal, toast } from "../ui/components";
import { go } from "../lib/pwa";

export function DataPage() {
  const s = useStore();
  const [incRec, setIncRec] = useState(false);
  const [size, setSize] = useState<{ userData: number; recordings: number } | null>(null);
  const [val, setVal] = useState<Validation | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<MergeReport | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { storageBreakdown().then(setSize); }, [s.attempts.length, s.writings.length, s.recordings.length]);
  const last = s.kv.lastBackup as number | undefined;

  const exportNow = async () => {
    setBusy(true);
    try { const b = await buildBackup(incRec); downloadFile(b.name, b.text); await markBackedUp(); toast(`Backup exported: ${b.name} (${fmtBytes(b.bytes)})`); }
    catch (e: any) { toast("Export failed: " + (e?.message || e)); }
    setBusy(false);
  };
  const onFile = async (f: File | undefined) => {
    setReport(null); setVal(null);
    if (!f) return;
    setFileName(f.name);
    setVal(await validateBackup(await f.text()));
  };
  const merge = async () => {
    if (!val?.file) return;
    setBusy(true);
    try { const r = await mergeBackup(val.file); await buildContent(); setReport(r); toast("Merge complete."); } catch (e: any) { toast("Merge failed - nothing was lost: " + (e?.message || e)); }
    setBusy(false);
  };
  const replace = async () => {
    if (!val?.file) return;
    setBusy(true);
    try {
      const safety = await buildBackup(false);
      downloadFile(safety.name.replace("Backup", "Safety-Backup-before-Replace"), safety.text);
      await replaceWithBackup(val.file as BackupFile);
      await buildContent();
      setReplaceOpen(false); setTyped("");
      toast("Data replaced from backup. A safety copy of the previous data was downloaded.");
    } catch (e: any) { toast("Replace failed - your previous data is unchanged: " + (e?.message || e)); }
    setBusy(false);
  };

  return (
    <>
      <div className="page-head"><div><h1>Data & Backup</h1><p className="sub">Your study data is stored locally on this device. Nothing is uploaded automatically. Export a backup file regularly and import it on another device (computer ↔ phone).</p></div></div>
      <div className="kpis">
        <div className="kpi"><div className="eyebrow">Last backup</div><div className="v">{last ? fmtDate(last) : "Never"}</div><div className="s">{last ? `${Math.floor((Date.now() - last) / 864e5)} days ago` : "Export one now"}</div></div>
        <div className="kpi"><div className="eyebrow">Data stored locally</div><div className="v num">{size ? fmtBytes(size.userData + size.recordings) : "…"}</div><div className="s">{size ? `recordings ${fmtBytes(size.recordings)}` : ""}</div></div>
        <div className="kpi"><div className="eyebrow">Records</div><div className="v num">{s.attempts.length + s.writings.length + s.recordings.length + s.mistakes.length}</div><div className="s">exercises, essays, recordings, errors</div></div>
      </div>
      <div className="grid g2">
        <div className="card stack">
          <h2>Export Backup</h2>
          <p className="small">Creates <b>IELTS-Mastery-Backup-{new Date().toISOString().slice(0, 10)}.json</b> with progress, scores, errors, vocabulary, completed exercises, history, essays, settings and mock results. The file stays with you; nothing is uploaded.</p>
          <label className="check"><input type="checkbox" checked={incRec} onChange={(e) => setIncRec(e.target.checked)} />Include Speaking audio recordings ({size ? fmtBytes(size.recordings) : "…"}, makes the file larger)</label>
          <button className="btn primary" disabled={busy} onClick={exportNow}><Icon name="download" />Export Backup</button>
        </div>
        <div className="card stack">
          <h2>Import Backup</h2>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={(e) => onFile(e.target.files?.[0])} hidden />
          <div className="row"><button className="btn" onClick={() => fileRef.current?.click()}><Icon name="upload" />Choose backup file</button>{fileName && <span className="small muted">{fileName}</span>}</div>
          {val && <div className="stack" style={{ gap: 4 }}>
            <b className="small">Validate Backup</b>
            {val.checks.map((c) => <div key={c.label} className="row small" style={{ alignItems: "flex-start" }}><span style={{ color: c.ok ? "var(--good)" : "var(--bad)", fontWeight: 700, width: 16 }}>{c.ok ? "✓" : "✗"}</span><span><b>{c.label}</b> — {c.detail}</span></div>)}
            {val.file && <p className="tiny muted">Exported {fmtDate(val.file.exportedAt)} · {val.file.includesRecordings ? "with" : "without"} audio recordings</p>}
          </div>}
          {val?.ok && <div className="row">
            <button className="btn primary" disabled={busy} onClick={merge}>Merge</button>
            <button className="btn danger" disabled={busy} onClick={() => setReplaceOpen(true)}>Replace…</button>
          </div>}
          {val && !val.ok && <div className="callout bad small">This file cannot be imported. Nothing was changed.</div>}
          {report && <div className="callout good small">Merge result: {report.added} added, {report.updated} updated (newer in the file), {report.kept} kept (newer or equal here), {report.skippedDeleted} skipped because you deleted them.</div>}
          <p className="tiny muted"><b>Merge</b> keeps the most recent version of each record (by timestamp) and adds new ones; nothing is overwritten blindly. <b>Replace</b> swaps all data for the file's content in one step.</p>
        </div>
      </div>
      <div className="card stack">
        <h2>Reset Data</h2>
        <p className="small">Deletes all progress, essays, recordings and settings from this browser. Downloaded content packs are kept.</p>
        <button className="btn danger" style={{ alignSelf: "flex-start" }} onClick={() => setResetOpen(true)}><Icon name="trash" />Reset Data</button>
      </div>

      <Modal open={replaceOpen} onClose={() => { setReplaceOpen(false); setTyped(""); }} title="Replace all data?">
        <p>All data on this device will be replaced by the backup from {val?.file ? fmtDate(val.file.exportedAt) : ""} ({val?.total} records). A safety copy of your current data is downloaded first.</p>
        <label className="field">Type REPLACE to confirm<input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} /></label>
        <div className="row"><button className="btn danger solid" disabled={typed !== "REPLACE" || busy} onClick={replace}>Replace data</button><button className="btn" onClick={() => { setReplaceOpen(false); setTyped(""); }}>Cancel</button></div>
      </Modal>
      <Modal open={resetOpen} onClose={() => { setResetOpen(false); setTyped(""); }} title="Are you sure?">
        <p><b>Are you sure? This will permanently delete your local IELTS data.</b> Export a backup first if you might need it.</p>
        <label className="field">Type DELETE to confirm<input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} /></label>
        <div className="row"><button className="btn danger solid" disabled={typed !== "DELETE"} onClick={async () => { await resetAllData(); setResetOpen(false); setTyped(""); toast("Local data deleted."); go("/"); }}>Delete everything</button><button className="btn" onClick={() => { setResetOpen(false); setTyped(""); }}>Cancel</button></div>
      </Modal>
    </>
  );
}
