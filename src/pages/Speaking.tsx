import React, { useEffect, useRef, useState } from "react";
import { addAiFeedbackMistakes, deleteRecording, getRecordingBlob, getState, logStudy, saveRecording, useStore } from "../lib/store";
const getStateRec = (id: string) => getState().recordings.find((x) => x.id === id);
import { audioUrl, getContent, usePacksVersion } from "../lib/packs";
import type { Recording } from "../lib/types";
import { Recorder, analyseTranscript, recordingSupported, startDictation, sttSupported } from "../lib/recorder";
import { speak, stopSpeaking } from "../lib/tts";
import { speakingPrompt } from "../lib/prompts";
import { criteriaBand, fmtBand } from "../lib/bands";
import { clipId, downloadFile, fmtClock, pick, uid } from "../lib/util";
import { useOnline, go } from "../lib/pwa";
import { Empty, Icon, Modal, Seg, toast } from "../ui/components";
import { CopyToClaude, FeedbackView, ImportFeedback, SelfAssessment } from "../ui/AiFeedback";

/* ---------- examiner voice: pre-produced clip if available, else device voice ---------- */
export async function playExaminer(text: string, accent: string): Promise<"file" | "device"> {
  const meta = getContent().audio[clipId(text)];
  if (meta) {
    const u = await audioUrl(meta.pack, meta.file);
    if (u) { stopSpeaking(); const a = new Audio(u); await a.play().catch(() => undefined); return "file"; }
  }
  speak(text, accent, 0.95);
  return "device";
}

function useCountdown(secs: number, running: boolean, onEnd?: () => void) {
  const [left, setLeft] = useState(secs);
  const end = useRef(onEnd); end.current = onEnd;
  useEffect(() => { setLeft(secs); }, [secs]);
  useEffect(() => {
    if (!running) return;
    const t0 = Date.now(), start = left;
    const id = setInterval(() => { const l = Math.max(0, start - (Date.now() - t0) / 1000); setLeft(l); if (l <= 0) { clearInterval(id); end.current?.(); } }, 250);
    return () => clearInterval(id);
  }, [running]);
  return left;
}

/* ---------- one recorded answer ---------- */
export function RecordAnswer({ part, topic, question, maxSecs, autoStart, onSaved, mockId }: { part: 1 | 2 | 3; topic: string; question: string; maxSecs?: number; autoStart?: boolean; onSaved?: (r: Recording) => void; mockId?: string }) {
  const s = useStore();
  const online = useOnline();
  const rec = useRef<Recorder | null>(null);
  const stopDict = useRef<() => void>(() => undefined);
  const [state, setState] = useState<"idle" | "rec" | "saved">("idle");
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  const [live, setLive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [saved, setSaved] = useState<Recording | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const finalRef = useRef("");
  useEffect(() => { if (state !== "rec") return; const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, [state]);
  const elapsed = state === "rec" ? (now - t0) / 1000 : 0;
  useEffect(() => { if (maxSecs && state === "rec" && elapsed >= maxSecs) stop(); }, [elapsed >= (maxSecs || Infinity)]);
  useEffect(() => { if (autoStart) start(); return () => { rec.current?.cancel(); stopDict.current(); }; }, []);

  const start = async () => {
    setErr("");
    if (!recordingSupported()) { setErr("Recording is not supported in this browser. Type your answer in the transcript box instead."); return; }
    try {
      rec.current = new Recorder();
      await rec.current.start();
      setT0(Date.now()); setNow(Date.now()); setState("rec");
      if (live && online && sttSupported()) {
        finalRef.current = "";
        stopDict.current = startDictation((f, i) => { finalRef.current = f; setTranscript(f + (i ? " " + i : "")); }, (e) => { if (e) setErr(e); });
      }
    } catch (e: any) { setErr(e?.name === "NotAllowedError" ? "Microphone permission was denied. Allow the microphone in the browser settings." : "Could not start recording: " + (e?.message || e)); }
  };
  const stop = async () => {
    if (!rec.current?.active) return;
    stopDict.current();
    const r = await rec.current.stop();
    const recd: Recording = { id: uid("r-"), updatedAt: Date.now(), createdAt: Date.now(), part, topic, question, durSecs: r.durSecs, mime: r.mime, blob: r.blob, size: r.blob.size, transcript: (finalRef.current || transcript).trim(), mockId };
    await saveRecording(recd);
    await logStudy(r.durSecs / 60 + 1, 1);
    setSaved({ ...recd, blob: undefined });
    setUrl(URL.createObjectURL(r.blob));
    setState("saved");
    onSaved?.(recd);
  };
  const saveTranscript = async () => { if (saved) { const cur = getStateRec(saved.id) || saved; await saveRecording({ ...cur, transcript }); setSaved({ ...cur, transcript }); toast("Transcript saved."); } };
  const typedOnly = async () => {
    const recd: Recording = { id: uid("r-"), updatedAt: Date.now(), createdAt: Date.now(), part, topic, question, durSecs: 0, mime: "", size: 0, transcript, mockId };
    await saveRecording(recd); setSaved(recd); setState("saved"); onSaved?.(recd);
  };
  const an = saved && transcript ? analyseTranscript(transcript, saved.durSecs, part) : null;
  return (
    <div className="stack">
      <div className="row">
        {state === "idle" && <button className="btn primary" onClick={start}><Icon name="rec" />Record answer</button>}
        {state === "rec" && <><button className="btn danger solid" onClick={stop}><Icon name="stop" />Stop</button><span className="timer low">● {fmtClock(elapsed)}{maxSecs ? ` / ${fmtClock(maxSecs)}` : ""}</span></>}
        {state === "saved" && url && <audio controls src={url} style={{ maxWidth: "100%" }} />}
        {state === "saved" && <span className="chip good">Saved on this device</span>}
        {state === "idle" && sttSupported() && <label className="check small"><input type="checkbox" checked={live} disabled={!online} onChange={(e) => setLive(e.target.checked)} />Transcribe while recording {online ? "(free browser feature, uses internet)" : "— Internet connection required"}</label>}
      </div>
      {err && <div className="callout bad small">{err}</div>}
      {(state === "saved" || state === "idle") && (
        <label className="field">My Transcript<span className="hint">Type what you said (or correct the automatic transcript). Used for local analysis and for Copy to Claude.</span>
          <textarea rows={4} value={transcript} onChange={(e) => setTranscript(e.target.value)} /></label>
      )}
      {state === "saved" && <div className="row"><button className="btn sm" onClick={saveTranscript}>Save transcript</button></div>}
      {state === "idle" && transcript.trim() && <button className="btn sm" onClick={typedOnly}>Save typed answer without audio</button>}
      {an && <div className="callout" style={{ flexDirection: "column", alignItems: "stretch" }}><b className="small">Local analysis (offline)</b><span className="small">{an.words} words{an.wpm ? ` · ${an.wpm} words/min` : ""}{Object.keys(an.fillers).length ? ` · fillers: ${Object.entries(an.fillers).map(([f, n]) => `${f} ×${n}`).join(", ")}` : ""}</span>{an.issues.map((i, k) => <span key={k} className="small">• {i}</span>)}</div>}
    </div>
  );
}

const PARTS = [{ v: "1", label: "Part 1" }, { v: "2", label: "Part 2" }, { v: "3", label: "Part 3" }, { v: "shadowing", label: "Shadowing" }, { v: "recordings", label: "My recordings" }];

export function SpeakingPage({ parts }: { parts: string[] }) {
  usePacksVersion();
  const tab = parts[0] || "2";
  return (
    <>
      <div className="page-head"><div><h1>Speaking Lab</h1><p className="sub">Recordings stay on this device (offline). Pronunciation is never scored automatically: the app does not analyse audio.</p><div style={{ marginTop: 6 }}><span className="chip ai">AI-generated IELTS-style practice</span></div></div>
        <Seg value={tab} onChange={(v) => go(`/speaking/${v}`)} options={PARTS} /></div>
      {!recordingSupported() && <div className="callout warn">This browser cannot record audio. You can still practise with timers and type your answers.</div>}
      {tab === "1" && <Part1 />}
      {tab === "2" && <Part2 />}
      {tab === "3" && <Part3 />}
      {tab === "shadowing" && <Shadowing />}
      {tab === "recordings" && <Recordings />}
    </>
  );
}

function Examiner({ q }: { q: string }) {
  const s = useStore();
  const [show, setShow] = useState(false);
  const [src, setSrc] = useState<"file" | "device" | null>(null);
  return (
    <div className="row">
      <button className="btn" onClick={async () => setSrc(await playExaminer(q, s.settings.accent))}><Icon name="play" />Examiner asks</button>
      <button className="btn ghost sm" onClick={() => setShow((x) => !x)}>{show ? "Hide" : "Show"} question</button>
      {src === "device" && <span className="chip warn">Device Voice — Internet not required</span>}
      {show && <b style={{ flexBasis: "100%" }}>{q}</b>}
    </div>
  );
}

function Part1() {
  const p1: Record<string, string[]> = getContent().prompts?.p1 || {};
  const topics = Object.keys(p1);
  const [topic, setTopic] = useState(topics[0] || "");
  const [i, setI] = useState(0);
  if (!topics.length) return <Empty>Speaking prompts are not on this device.</Empty>;
  const qs = p1[topic] || [];
  return (
    <div className="card stack lg">
      <div className="row between"><h2>Part 1 — Introduction and interview</h2><select value={topic} onChange={(e) => { setTopic(e.target.value); setI(0); }} style={{ width: "auto" }}>{topics.map((t) => <option key={t}>{t}</option>)}</select></div>
      <p className="small muted">4–5 minutes in the real test. Answer in 2–3 sentences: direct answer, reason, short example.</p>
      <div className="row"><span className="chip">Question {i + 1} of {qs.length}</span></div>
      <Examiner key={topic + i} q={qs[i]} />
      <RecordAnswer key={topic + i + "r"} part={1} topic={topic} question={qs[i]} maxSecs={60} />
      <div className="row"><button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button><button className="btn primary" disabled={i >= qs.length - 1} onClick={() => setI(i + 1)}>Next question</button></div>
    </div>
  );
}

function Part2() {
  const cards: any[] = getContent().prompts?.p2 || [];
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"card" | "prep" | "talk" | "done">("card");
  const [notes, setNotes] = useState("");
  const prepLeft = useCountdown(60, phase === "prep", () => setPhase("talk"));
  if (!cards.length) return <Empty>Speaking prompts are not on this device.</Empty>;
  const c = cards[idx];
  return (
    <div className="grid g2">
      <div className="card stack">
        <div className="row between"><h2>Part 2 — Cue card</h2><button className="btn sm ghost" onClick={() => { setIdx((idx + 1) % cards.length); setPhase("card"); setNotes(""); }}>Another card</button></div>
        <div className="callout accent" style={{ flexDirection: "column", alignItems: "stretch" }}><b style={{ fontFamily: "var(--display)", fontSize: "1.15rem" }}>{c.topic}</b><span className="small">You should say:</span><ul style={{ margin: 0, paddingLeft: 18 }}>{c.points.map((p: string) => <li key={p}>{p}</li>)}</ul></div>
        {phase === "card" && <button className="btn primary lg" onClick={() => setPhase("prep")}><Icon name="clock" />Start 1-minute preparation</button>}
        {phase === "prep" && <div className="row"><span className={"timer" + (prepLeft < 10 ? " low" : "")}>Preparation {fmtClock(prepLeft)}</span><button className="btn sm" onClick={() => setPhase("talk")}>Skip to speaking</button></div>}
        {(phase === "prep" || phase === "talk") && <label className="field">Notes<textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key words only…" /></label>}
      </div>
      <div className="card stack">
        <h2>Speak for up to 2 minutes</h2>
        {phase === "talk" || phase === "done" ? <RecordAnswer key={c.id} part={2} topic={c.id} question={c.topic} maxSecs={120} autoStart onSaved={() => setPhase("done")} /> : <p className="muted">Recording starts automatically when the preparation minute ends.</p>}
        {phase === "done" && <a className="btn" href={`#/speaking/3?card=${c.id}`} onClick={(e) => { e.preventDefault(); sessionStorage.setItem("p3card", c.id); go("/speaking/3"); }}>Continue to Part 3 →</a>}
      </div>
    </div>
  );
}

function Part3() {
  const cards: any[] = getContent().prompts?.p2 || [];
  const [cid, setCid] = useState(sessionStorage.getItem("p3card") || cards[0]?.id);
  const [i, setI] = useState(0);
  const c = cards.find((x) => x.id === cid) || cards[0];
  if (!c) return <Empty>Speaking prompts are not on this device.</Empty>;
  const qs: string[] = c.p3;
  return (
    <div className="card stack lg">
      <div className="row between"><h2>Part 3 — Discussion</h2><select value={c.id} onChange={(e) => { setCid(e.target.value); setI(0); }} style={{ width: "auto", maxWidth: "100%" }}>{cards.map((x) => <option key={x.id} value={x.id}>{x.topic}</option>)}</select></div>
      <p className="small muted">Abstract questions linked to Part 2. Give opinions, reasons, comparisons and examples (aim for 45–60 seconds each).</p>
      <span className="chip">Question {i + 1} of {qs.length}</span>
      <Examiner key={c.id + i} q={qs[i]} />
      <RecordAnswer key={c.id + i + "r"} part={3} topic={c.id} question={qs[i]} maxSecs={90} />
      <div className="row"><button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button><button className="btn primary" disabled={i >= qs.length - 1} onClick={() => setI(i + 1)}>Next question</button></div>
    </div>
  );
}

function Shadowing() {
  const s = useStore();
  const sh: Record<string, string[]> = getContent().prompts?.shadowing || {};
  const cats = Object.keys(sh);
  const [cat, setCat] = useState(cats[0] || "");
  const [i, setI] = useState(0);
  const [mine, setMine] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const rec = useRef<Recorder | null>(null);
  const [src, setSrc] = useState<"file" | "device" | null>(null);
  if (!cats.length) return <Empty>Shadowing sentences are not on this device.</Empty>;
  const line = sh[cat][i];
  const listen = async () => setSrc(await playExaminer(line, s.settings.accent));
  const toggleRec = async () => {
    if (!recordingSupported()) { toast("Recording is not supported here."); return; }
    if (!recording) { rec.current = new Recorder(); try { await rec.current.start(); setRecording(true); } catch { toast("Microphone not available."); } return; }
    const r = await rec.current!.stop(); setRecording(false);
    setMine(URL.createObjectURL(r.blob));
    await saveRecording({ id: uid("r-"), updatedAt: Date.now(), createdAt: Date.now(), part: 0, topic: "shadowing:" + cat, question: line, durSecs: r.durSecs, mime: r.mime, blob: r.blob, size: r.blob.size, transcript: line });
    await logStudy(1, 1);
  };
  const compare = async () => { await listen(); setTimeout(() => { if (mine) new Audio(mine).play(); }, 400 + line.split(" ").length * 420); };
  return (
    <div className="card stack lg">
      <div className="row between"><h2>Shadowing</h2><Seg value={cat} onChange={(v) => { setCat(v); setI(0); setMine(null); }} options={cats.map((c) => ({ v: c, label: c }))} /></div>
      <p className="small muted">1. Listen · 2. Repeat at the same speed and rhythm · 3. Record · 4. Compare. Focus on stress, linking and intonation.</p>
      <div className="callout accent" style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>{line}</div>
      <div className="row">
        <button className="btn" onClick={listen}><Icon name="play" />Listen</button>
        <button className={"btn " + (recording ? "danger solid" : "primary")} onClick={toggleRec}><Icon name={recording ? "stop" : "rec"} />{recording ? "Stop" : "Record"}</button>
        {mine && <button className="btn" onClick={() => new Audio(mine).play()}><Icon name="play" />My version</button>}
        {mine && <button className="btn" onClick={compare}>Compare</button>}
        {src === "device" && <span className="chip warn">Device Voice — Internet not required</span>}
      </div>
      <div className="row"><button className="btn ghost" disabled={i === 0} onClick={() => { setI(i - 1); setMine(null); }}>Previous</button><span className="small muted">{i + 1}/{sh[cat].length}</span><button className="btn ghost" disabled={i >= sh[cat].length - 1} onClick={() => { setI(i + 1); setMine(null); }}>Next</button></div>
    </div>
  );
}

function Recordings() {
  const s = useStore();
  const list = s.recordings.filter((r) => r.part > 0);
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState<Recording | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const chosen = list.filter((r) => sel.includes(r.id));
  const play = async (r: Recording) => { const b = await getRecordingBlob(r.id); if (b) new Audio(URL.createObjectURL(b)).play(); else toast("No audio stored for this answer."); };
  const exportRec = async (r: Recording) => { const b = await getRecordingBlob(r.id); if (b) downloadFile(`IELTS-Speaking-Part${r.part}-${new Date(r.createdAt).toISOString().slice(0, 10)}.${r.mime.includes("mp4") ? "m4a" : r.mime.includes("ogg") ? "ogg" : "webm"}`, b); };
  return (
    <div className="stack lg">
      <div className="card stack">
        <div className="row between"><h2>My recordings</h2><span className="small muted">{list.length} answers · {(list.reduce((a, r) => a + r.size, 0) / 1048576).toFixed(1)} MB</span></div>
        {list.length ? <div className="table-wrap"><table className="t"><thead><tr><th /><th>Date</th><th>Part</th><th>Question</th><th>Length</th><th>Band</th><th /></tr></thead><tbody>
          {list.map((r) => <tr key={r.id}>
            <td><input type="checkbox" checked={sel.includes(r.id)} onChange={() => setSel((x) => (x.includes(r.id) ? x.filter((y) => y !== r.id) : [...x, r.id]))} aria-label="Select" /></td>
            <td className="num">{new Date(r.createdAt).toLocaleDateString("en-GB")}</td><td>{r.part}{r.mockId ? " · mock" : ""}</td>
            <td className="small" style={{ maxWidth: 320 }}>{r.question}</td><td className="num">{fmtClock(r.durSecs)}</td>
            <td className="num">{r.ai ? fmtBand(r.ai.overall) : fmtBand(criteriaBand(Object.values(r.self || {})))}</td>
            <td><div className="row" style={{ flexWrap: "nowrap" }}>{r.size > 0 && <button className="btn sm ghost icon-btn" title="Play" onClick={() => play(r)}><Icon name="play" /></button>}<button className="btn sm" onClick={() => setOpen(r)}>Open</button>{r.size > 0 && <button className="btn sm ghost icon-btn" title="Export audio" onClick={() => exportRec(r)}><Icon name="download" /></button>}<button className="btn sm ghost icon-btn" title="Delete" onClick={() => setConfirm(r.id)}><Icon name="trash" /></button></div></td>
          </tr>)}</tbody></table></div> : <Empty>No recordings yet. Answer a Part 1, 2 or 3 question.</Empty>}
      </div>
      {chosen.length > 0 && (
        <div className="card stack"><h2>Copy to Claude — {chosen.length} answer(s)</h2>
          {chosen.some((r) => !r.transcript.trim()) && <div className="callout warn small">Some selected answers have no transcript. Claude can only assess text: add transcripts first.</div>}
          <CopyToClaude prompt={speakingPrompt(s, chosen)} label="Copy speaking evaluation prompt" note="Pronunciation cannot be assessed from a transcript; the prompt tells Claude to leave it unscored." />
          <ImportFeedback skill="speaking" onImport={async (fb) => { for (const r of chosen) { await saveRecording({ ...r, ai: fb }); await addAiFeedbackMistakes("S", r.id, r.topic, fb); } setSel([]); }} />
        </div>
      )}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `Part ${open.part} answer` : ""} wide>
        {open && <RecordingDetail r={s.recordings.find((x) => x.id === open.id) || open} />}
      </Modal>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete this recording?">
        <p>The audio and transcript are removed from this device permanently.</p>
        <div className="row"><button className="btn danger solid" onClick={async () => { await deleteRecording(confirm!); setConfirm(null); }}>Delete</button><button className="btn" onClick={() => setConfirm(null)}>Cancel</button></div>
      </Modal>
    </div>
  );
}

function RecordingDetail({ r }: { r: Recording }) {
  const [t, setT] = useState(r.transcript);
  const an = t ? analyseTranscript(t, r.durSecs, r.part) : null;
  return (
    <div className="stack lg">
      <b>{r.question}</b>
      <label className="field">My Transcript<textarea rows={5} value={t} onChange={(e) => setT(e.target.value)} /></label>
      <div className="row"><button className="btn sm" onClick={() => saveRecording({ ...(getStateRec(r.id) || r), transcript: t }).then(() => toast("Saved."))}>Save transcript</button></div>
      {an && <div className="small">{an.issues.map((i, k) => <div key={k}>• {i}</div>)}</div>}
      <h3>Self Assessment</h3>
      <SelfAssessment task={2} skill="speaking" value={r.self} onSave={(c) => saveRecording({ ...(getStateRec(r.id) || r), self: c })} />
      {r.ai && <FeedbackView fb={r.ai} self={r.self} original={t} skill="speaking" />}
    </div>
  );
}

export { pick };
