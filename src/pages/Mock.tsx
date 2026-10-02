import React, { useEffect, useMemo, useState } from "react";
import { deleteExternal, getState, recordAttempt, saveExternal, saveMock, saveWriting, setKV, useStore } from "../lib/store";
import { findSet, getContent, usePacksVersion } from "../lib/packs";
import type { MockResult, QSet, Skill, Writing } from "../lib/types";
import { SKILL_NAME } from "../lib/types";
import { bandFromRaw, criteriaBand, fmtBand, overallBand, roundBand, writingBand, DISCLAIMER } from "../lib/bands";
import type { SetResult } from "../lib/scoring";
import { flatten } from "../lib/scoring";
import { QuestionSet } from "../ui/QuestionSet";
import { BandSelect, Countdown, Disclaimer, Empty, HBars, Icon, Modal, toast, useStopwatch } from "../ui/components";
import { RecordAnswer } from "./Speaking";
import { TaskChart } from "../ui/Diagrams";
import { newWriting } from "./Writing";
import { go } from "../lib/pwa";
import { fmtClock, fmtDate, todayKey, uid, wordCount } from "../lib/util";
import { estimates } from "../lib/stats";

const LIMITS = { L: 40 * 60, R: 60 * 60, W: 60 * 60, S: 14 * 60 };

export function MockPage({ parts }: { parts: string[] }) {
  usePacksVersion();
  if (parts[0] === "run" && parts[1]) return <MockRunner mockId={parts[1]} />;
  if (parts[0] === "result" && parts[1]) return <MockReport id={parts[1]} />;
  if (parts[0] === "diagnostic") return <Diagnostic />;
  return <MockHome />;
}

function setExam(on: boolean) { window.dispatchEvent(new CustomEvent("exam-mode", { detail: on })); }

/* ================= HOME ================= */
function MockHome() {
  const s = useStore();
  const mocks = getContent().mocks;
  return (
    <>
      <div className="page-head"><div><h1>Mock Tests</h1><p className="sub">Full IELTS-style tests with content that never appears in practice. Listening and Reading are scored automatically; Writing and Speaking need your self-assessment or imported Claude feedback.</p></div>
        <a className="btn" href="#/mock/diagnostic"><Icon name="flag" />Diagnostic test</a></div>
      <div className="grid g-auto">
        {mocks.map((m: any) => {
          const runs = s.mocks.filter((r) => r.mockId === m.id);
          const prog = s.kv["mockRun:" + m.id];
          return (
            <div key={m.id} className="card stack">
              <div className="row between"><h2>{m.title}</h2>{runs.length ? <span className="chip good">taken ×{runs.length}</span> : <span className="chip">new</span>}</div>
              <p className="small muted">Listening 40 questions (≈40 min) · Reading 40 questions (60 min) · Writing Task 1 + Task 2 (60 min) · Speaking Parts 1–3 (≈14 min)</p>
              <div className="row">{prog ? <a className="btn primary" href={`#/mock/run/${m.id}`}>Resume (step {prog.step + 1})</a> : <a className="btn primary" href={`#/mock/run/${m.id}`}>Start</a>}</div>
            </div>
          );
        })}
        {!mocks.length && <Empty>Mock Test 01 is not on this device. <a href="#/library">Download it in the Offline Library</a>.</Empty>}
      </div>
      <div className="card stack">
        <h2>Results</h2>
        {s.mocks.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Test</th><th>L</th><th>R</th><th>W</th><th>S</th><th>Overall</th><th /></tr></thead><tbody>
          {s.mocks.slice().reverse().map((m) => { const live = liveBands(m); return <tr key={m.id}><td className="num">{fmtDate(m.ts)}</td><td>{m.title}{m.examMode ? " · exam mode" : ""}</td>{(["L", "R", "W", "S"] as Skill[]).map((k) => <td key={k} className="num">{fmtBand(live[k])}</td>)}<td className="num"><b>{fmtBand(live.overall)}</b></td><td><a className="btn sm" href={`#/mock/result/${m.id}`}>Report</a></td></tr>; })}
        </tbody></table></div> : <Empty>No mock test taken yet.</Empty>}
      </div>
      <External />
    </>
  );
}

function External() {
  const s = useStore();
  const [f, setF] = useState({ name: "", date: todayKey(), L: null as number | null, R: null as number | null, W: null as number | null, S: null as number | null, overall: null as number | null });
  const [del, setDel] = useState<string | null>(null);
  const calc = overallBand([f.L, f.R, f.W, f.S]);
  const save = async () => {
    if (!f.name.trim()) { toast("Give the test a name (e.g. Cambridge 18 Test 2)."); return; }
    if ([f.L, f.R, f.W, f.S, f.overall].every((x) => x == null)) { toast("Enter at least one score."); return; }
    await saveExternal({ id: uid("x-"), updatedAt: Date.now(), name: f.name.trim(), date: f.date, L: f.L, R: f.R, W: f.W, S: f.S, overall: f.overall ?? calc });
    setF({ ...f, name: "", L: null, R: null, W: null, S: null, overall: null });
    toast("External test saved.");
  };
  const [raw, setRaw] = useState<{ skill: "L" | "R"; n: string }>({ skill: "L", n: "" });
  return (
    <div className="card stack">
      <div className="row between"><h2>External Test Results</h2><span className="chip gold">External Test</span></div>
      <p className="small muted">Record results from Cambridge practice tests, British Council tests or an official exam. They appear in your charts marked “External Test” and are never mixed with the app's own estimates.</p>
      <div className="grid g4">
        <label className="field span2">Test name<input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Cambridge IELTS 19 – Test 1" /></label>
        <label className="field">Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label className="field">Overall<span className="hint">{calc != null ? `calculated: ${calc}` : "optional"}</span><BandSelect value={f.overall} onChange={(v) => setF({ ...f, overall: v })} /></label>
        {(["L", "R", "W", "S"] as Skill[]).map((k) => <label key={k} className="field">{SKILL_NAME[k]}<BandSelect value={f[k]} onChange={(v) => setF({ ...f, [k]: v })} /></label>)}
      </div>
      <div className="row between">
        <div className="row small"><span>Raw score converter:</span><select value={raw.skill} onChange={(e) => setRaw({ ...raw, skill: e.target.value as any })} style={{ width: "auto" }}><option value="L">Listening</option><option value="R">Reading ({s.profile.exam === "gt" ? "GT" : "Academic"})</option></select>
          <input type="number" min={0} max={40} value={raw.n} onChange={(e) => setRaw({ ...raw, n: e.target.value })} style={{ width: 80 }} placeholder="/40" />
          {raw.n !== "" && <b>≈ {bandFromRaw(Number(raw.n), raw.skill, s.profile.exam)}</b>}</div>
        <button className="btn primary" onClick={save}>Save result</button>
      </div>
      {s.external.length > 0 && <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Test</th><th>L</th><th>R</th><th>W</th><th>S</th><th>Overall</th><th /></tr></thead><tbody>
        {s.external.slice().reverse().map((x) => <tr key={x.id}><td className="num">{fmtDate(x.date)}</td><td>{x.name} <span className="chip gold">External Test</span></td>{(["L", "R", "W", "S"] as Skill[]).map((k) => <td key={k} className="num">{fmtBand(x[k])}</td>)}<td className="num"><b>{fmtBand(x.overall)}</b></td><td><button className="btn sm ghost icon-btn" onClick={() => setDel(x.id)} aria-label="Delete"><Icon name="trash" /></button></td></tr>)}
      </tbody></table></div>}
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete this external result?"><div className="row"><button className="btn danger solid" onClick={async () => { await deleteExternal(del!); setDel(null); }}>Delete</button><button className="btn" onClick={() => setDel(null)}>Cancel</button></div></Modal>
    </div>
  );
}

/* ================= live bands for a mock (W/S filled in later) ================= */
export function liveBands(m: MockResult): Record<Skill, number | null> & { overall: number | null } {
  const s = getState();
  const ws = s.writings.filter((w) => m.detail.writingIds.includes(w.id));
  const bandOf = (w: Writing) => w.ai?.overall ?? criteriaBand(Object.values(w.self || {}));
  const t1 = ws.find((w) => w.task === 1), t2 = ws.find((w) => w.task === 2);
  const W = m.W ?? writingBand(t1 ? bandOf(t1) : null, t2 ? bandOf(t2) : null);
  const rs = s.recordings.filter((r) => m.detail.recordingIds.includes(r.id)).map((r) => r.ai?.overall ?? criteriaBand(Object.values(r.self || {}))).filter((x): x is number => x != null);
  const S = m.S ?? (rs.length ? roundBand(rs.reduce((a, b) => a + b, 0) / rs.length) : null);
  return { L: m.L, R: m.R, W, S, overall: overallBand([m.L, m.R, W, S]) };
}

/* ================= RUNNER ================= */
interface RunState { step: number; startedAt: number; res: Record<string, { correct: number; total: number; byType: Record<string, [number, number]>; secs: number }>; time: Record<string, number>; writingIds: string[]; recordingIds: string[]; examMode: boolean; }

function MockRunner({ mockId }: { mockId: string }) {
  const s = useStore();
  const m = getContent().mocks.find((x: any) => x.id === mockId);
  const key = "mockRun:" + mockId;
  const [run, setRun] = useState<RunState | null>(s.kv[key] || null);
  useEffect(() => () => setExam(false), []);
  useEffect(() => { if (run && run.step > 0 && run.examMode) setExam(true); }, [run?.step]);
  if (!m) return <Empty>This mock test is not on this device. <a href="#/library">Offline Library</a></Empty>;
  const lSets: QSet[] = m.listening.map((id: string) => findSet(id)).filter(Boolean);
  const rSets: QSet[] = m.reading.map((id: string) => findSet(id)).filter(Boolean);
  const persist = async (r: RunState | null) => { setRun(r); await setKV(key, r); };
  const steps = ["intro", "L", "R", "W", "S", "done"];
  if (!run || run.step === 0) return (
    <div className="card pad-lg stack lg" style={{ maxWidth: 760 }}>
      <a className="small" href="#/mock">← Mock Tests</a>
      <h1>{m.title}</h1>
      <p>The test runs in four parts, in the official order. Your progress is saved after each part, so you can stop between parts and resume later.</p>
      <ul><li>Listening — 4 sections, 40 questions. Each recording plays once in exam mode.</li><li>Reading — 3 passages, 40 questions, 60 minutes.</li><li>Writing — Task 1 (20 min) and Task 2 (40 min).</li><li>Speaking — Part 1, Part 2 (1 min preparation, 2 min talk), Part 3. Recorded on this device.</li></ul>
      <label className="check"><input type="checkbox" checked={run?.examMode ?? s.settings.examMode} onChange={(e) => setRun({ ...(run || blankRun(s.settings.examMode)), examMode: e.target.checked })} /><b>REAL IELTS SIMULATION</b> — minimal interface, no hints, no feedback until the end, real timers with automatic submission.</label>
      <div className="callout"><Icon name="info" /><span className="small">{DISCLAIMER} Writing and Speaking bands appear after you self-assess them or import Claude feedback.</span></div>
      <div className="row"><button className="btn primary lg" onClick={() => persist({ ...(run || blankRun(s.settings.examMode)), step: 1, startedAt: Date.now() })}>Begin Listening</button></div>
    </div>
  );
  const part = steps[run.step];
  const header = (label: string, limit: number) => <div className="row between"><div><span className="eyebrow">{m.title} · part {run.step} of 4</span><h1>{label}</h1></div><PartTimer limit={limit} exam={run.examMode} /></div>;

  if (part === "L" || part === "R") {
    const sets = part === "L" ? lSets : rSets;
    return <SectionPart key={part} sets={sets} part={part} run={run} header={header(part === "L" ? "Listening" : "Reading", LIMITS[part])} limit={LIMITS[part]}
      onDone={async (res, secs) => { await persist({ ...run, res: { ...run.res, ...res }, time: { ...run.time, [part]: secs }, step: run.step + 1 }); window.scrollTo(0, 0); }} />;
  }
  if (part === "W") return <WritingPart m={m} run={run} header={header("Writing", LIMITS.W)} onDone={async (ids, secs) => { await persist({ ...run, writingIds: ids, time: { ...run.time, W: secs }, step: run.step + 1 }); window.scrollTo(0, 0); }} />;
  if (part === "S") return <SpeakingPart m={m} run={run} header={header("Speaking", LIMITS.S)} onDone={async (ids, secs) => {
    const final = { ...run, recordingIds: ids, time: { ...run.time, S: secs } };
    const res = await finishMock(m, final, lSets, rSets);
    await persist(null);
    setExam(false);
    go(`/mock/result/${res.id}`);
  }} />;
  return null;
}
const blankRun = (exam: boolean): RunState => ({ step: 0, startedAt: Date.now(), res: {}, time: {}, writingIds: [], recordingIds: [], examMode: exam });

function PartTimer({ limit, exam }: { limit: number; exam: boolean }) {
  const secs = useStopwatch(true);
  return <div className="row"><Countdown secs={secs} limit={limit} />{exam && <span className="chip gold">Exam mode</span>}</div>;
}

function SectionPart({ sets, part, run, header, limit, onDone }: { sets: QSet[]; part: "L" | "R"; run: RunState; header: React.ReactNode; limit: number; onDone: (res: RunState["res"], secs: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [res, setRes] = useState<RunState["res"]>({});
  const secs = useStopwatch(true);
  const [forced, setForced] = useState(false);
  useEffect(() => { if (run.examMode && secs >= limit && !forced) { setForced(true); toast("Time is up for this part."); } }, [secs >= limit]);
  const set = sets[idx];
  const next = (r: SetResult, sSecs: number) => {
    const n = { ...res, [set.id]: { correct: r.correct, total: r.total, byType: r.byType, secs: Math.round(sSecs) } };
    setRes(n);
    if (idx + 1 < sets.length && !forced) setIdx(idx + 1);
    else onDone(addMissing(n, sets), Math.round(secs));
  };
  if (forced && !res[set.id]) {
    return <div className="stack lg">{header}<div className="callout warn">Time is up. Unanswered sections score zero.</div><button className="btn primary" onClick={() => onDone(addMissing(res, sets), Math.round(secs))}>Continue</button></div>;
  }
  return (
    <div className="stack lg">
      {header}
      <div className="row">{sets.map((x, i) => <span key={x.id} className={"chip " + (i === idx ? "accent" : res[x.id] ? "good" : "")}>{part === "L" ? "Section" : "Passage"} {i + 1}</span>)}</div>
      <QuestionSet key={set.id} set={set} exam={run.examMode} embedded kind="section" limitSecs={undefined}
        submitLabel={idx + 1 < sets.length ? `Submit and go to ${part === "L" ? "section" : "passage"} ${idx + 2}` : "Submit and finish this part"} onSubmitted={next} />
    </div>
  );
}
function addMissing(res: RunState["res"], sets: QSet[]): RunState["res"] {
  const out = { ...res };
  for (const s of sets) if (!out[s.id]) { const n = flatten(s).length; out[s.id] = { correct: 0, total: n, byType: {}, secs: 0 }; }
  return out;
}

function WritingPart({ m, run, header, onDone }: { m: any; run: RunState; header: React.ReactNode; onDone: (ids: string[], secs: number) => void }) {
  const s = useStore();
  const t1p = s.profile.exam === "gt" ? m.writing.t1GT : m.writing.t1Academic;
  const [ids, setIds] = useState<string[]>(run.writingIds);
  const [task, setTask] = useState<1 | 2>(1);
  const secs = useStopwatch(true);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (ids.length) return;
    const w1 = newWriting(t1p, 1, s.profile.exam, m.id), w2 = newWriting(m.writing.t2, 2, s.profile.exam, m.id);
    Promise.all([saveWriting(w1), saveWriting(w2)]).then(() => setIds([w1.id, w2.id]));
  }, []);
  useEffect(() => { if (run.examMode && secs >= LIMITS.W) finish(); }, [secs >= LIMITS.W]);
  const ws = ids.map((id) => s.writings.find((w) => w.id === id)).filter(Boolean) as Writing[];
  const cur = ws.find((w) => w.task === task);
  const finish = async () => {
    for (const w of getState().writings.filter((x) => ids.includes(x.id))) await saveWriting({ ...w, status: "submitted", submittedAt: Date.now() });
    onDone(ids, Math.round(secs));
  };
  if (!cur) return <p className="muted">Preparing…</p>;
  return (
    <div className="stack lg">
      {header}
      <div className="row"><button className={"btn" + (task === 1 ? " primary" : "")} onClick={() => setTask(1)}>Task 1 · {wordCount(ws.find((w) => w.task === 1)?.text || "")} words</button><button className={"btn" + (task === 2 ? " primary" : "")} onClick={() => setTask(2)}>Task 2 · {wordCount(ws.find((w) => w.task === 2)?.text || "")} words</button><span className="small muted">Suggested: 20 min for Task 1, 40 min for Task 2.</span></div>
      <div className="ex-layout">
        <div className="card passage stack"><p style={{ whiteSpace: "pre-wrap", fontFamily: "var(--body)" }}>{cur.promptText}</p>{task === 1 && t1p.chart && <TaskChart chart={t1p.chart} />}</div>
        <MockEditor key={cur.id} w={cur} />
      </div>
      <div className="row"><button className="btn primary lg" onClick={() => setConfirm(true)}>Finish Writing</button></div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Finish the Writing test?"><p>Both texts will be submitted. You cannot edit them afterwards.</p><div className="row"><button className="btn primary" onClick={finish}>Submit both</button><button className="btn" onClick={() => setConfirm(false)}>Keep writing</button></div></Modal>
    </div>
  );
}
function MockEditor({ w }: { w: Writing }) {
  const [t, setT] = useState(w.text);
  useEffect(() => { const id = setTimeout(() => { const cur = getState().writings.find((x) => x.id === w.id); if (cur && cur.status === "draft" && cur.text !== t) saveWriting({ ...cur, text: t }); }, 600); return () => clearTimeout(id); }, [t]);
  return <div className="stack"><textarea className="editor" value={t} onChange={(e) => setT(e.target.value)} spellCheck={false} aria-label={`Task ${w.task} answer`} /><span className="wc muted">{wordCount(t)} words · saved on this device</span></div>;
}

function SpeakingPart({ m, run, header, onDone }: { m: any; run: RunState; header: React.ReactNode; onDone: (ids: string[], secs: number) => void }) {
  const sp = m.speaking;
  const qs: { part: 1 | 2 | 3; q: string; max: number }[] = [
    ...sp.p1.questions.map((q: string) => ({ part: 1 as const, q, max: 45 })),
    { part: 2, q: sp.p2.topic, max: 120 },
    ...sp.p3.map((q: string) => ({ part: 3 as const, q, max: 75 })),
  ];
  const [i, setI] = useState(0);
  const [ids, setIds] = useState<string[]>(run.recordingIds);
  const [prep, setPrep] = useState(false);
  const [prepDone, setPrepDone] = useState(false);
  const secs = useStopwatch(true);
  const cur = qs[i];
  useEffect(() => { if (!prep) return; const t = setTimeout(() => { setPrep(false); setPrepDone(true); }, 60000); return () => clearTimeout(t); }, [prep]);
  return (
    <div className="stack lg">
      {header}
      <div className="row"><span className="chip accent">Part {cur.part}</span><span className="small muted">Question {i + 1} of {qs.length}</span></div>
      <div className="card stack">
        {cur.part === 2 ? (
          <>
            <div className="callout accent" style={{ flexDirection: "column", alignItems: "stretch" }}><b>{sp.p2.topic}</b><span className="small">You should say:</span><ul style={{ margin: 0, paddingLeft: 18 }}>{sp.p2.points.map((p: string) => <li key={p}>{p}</li>)}</ul></div>
            {!prepDone && !prep && <button className="btn primary" onClick={() => setPrep(true)}>Start 1-minute preparation</button>}
            {prep && <PrepTimer />}
            {prepDone && <RecordAnswer key={"p2"} part={2} topic={"mock:" + m.id} question={sp.p2.topic} maxSecs={120} autoStart mockId={m.id} onSaved={(r) => setIds((x) => [...x, r.id])} />}
          </>
        ) : (
          <>
            <b style={{ fontFamily: "var(--display)", fontSize: "1.15rem" }}>{cur.q}</b>
            <RecordAnswer key={i} part={cur.part} topic={"mock:" + m.id} question={cur.q} maxSecs={cur.max} mockId={m.id} onSaved={(r) => setIds((x) => [...x, r.id])} />
          </>
        )}
      </div>
      <div className="row">{i + 1 < qs.length ? <button className="btn primary" onClick={() => setI(i + 1)}>Next question</button> : <button className="btn primary lg" onClick={() => onDone(ids, Math.round(secs))}>Finish the mock test</button>}</div>
    </div>
  );
}
function PrepTimer() { const s = useStopwatch(true); return <span className="timer">Preparation {fmtClock(Math.max(0, 60 - s))}</span>; }

async function finishMock(m: any, run: RunState, lSets: QSet[], rSets: QSet[]): Promise<MockResult> {
  const sum = (sets: QSet[]) => sets.reduce((a, x) => a + (run.res[x.id]?.correct || 0), 0);
  const tot = (sets: QSet[]) => sets.reduce((a, x) => a + (run.res[x.id]?.total || 0), 0);
  const lc = sum(lSets), rc = sum(rSets);
  const exam = getState().profile.exam;
  const L = tot(lSets) ? bandFromRaw((lc / tot(lSets)) * 40, "L", exam) : null;
  const R = tot(rSets) ? bandFromRaw((rc / tot(rSets)) * 40, "R", exam) : null;
  const byType: Record<string, [number, number]> = {};
  for (const [id, r] of Object.entries(run.res)) {
    const sk = lSets.some((x) => x.id === id) ? "Listening" : "Reading";
    for (const [t, [c, n]] of Object.entries(r.byType)) { const k = `${sk} · ${t}`; const o = byType[k] || [0, 0]; byType[k] = [o[0] + c, o[1] + n]; }
  }
  const res: MockResult = {
    id: uid("mk-"), updatedAt: Date.now(), ts: Date.now(), mockId: m.id, title: m.title, L, R, W: null, S: null, overall: null,
    detail: { lCorrect: lc, rCorrect: rc, timeUsed: run.time, timeLimit: LIMITS, byType, writingIds: run.writingIds, recordingIds: run.recordingIds }, examMode: run.examMode,
  };
  await saveMock(res);
  await recordAttempt({ ts: Date.now(), skill: "L", kind: "mock", ref: m.id + ":L", title: m.title + " – Listening", correct: lc, total: tot(lSets), band: L, secs: run.time.L || 0, limitSecs: LIMITS.L, byType: {}, tags: {}, mockId: res.id }, []);
  await recordAttempt({ ts: Date.now() + 1, skill: "R", kind: "mock", ref: m.id + ":R", title: m.title + " – Reading", correct: rc, total: tot(rSets), band: R, secs: run.time.R || 0, limitSecs: LIMITS.R, byType: {}, tags: {}, mockId: res.id }, []);
  return res;
}

/* ================= REPORT ================= */
function MockReport({ id }: { id: string }) {
  const s = useStore();
  const m = s.mocks.find((x) => x.id === id);
  if (!m) return <Empty>Report not found.</Empty>;
  const b = liveBands(m);
  const prev = s.mocks.filter((x) => x.ts < m.ts).slice(-1)[0];
  const pb = prev ? liveBands(prev) : null;
  const types = Object.entries(m.detail.byType).map(([t, [c, n]]) => ({ t, c, n, p: c / n })).sort((a, b) => a.p - b.p);
  const ws = s.writings.filter((w) => m.detail.writingIds.includes(w.id));
  const rs = s.recordings.filter((r) => m.detail.recordingIds.includes(r.id));
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/mock">← Mock Tests</a><p className="eyebrow">Full IELTS score report</p><h1>{m.title}</h1><p className="sub">{fmtDate(m.ts)}{m.examMode ? " · Real exam mode" : ""}</p></div></div>
      <div className="card raised pad-lg stack">
        <div className="kpis">
          {(["L", "R", "W", "S"] as Skill[]).map((k) => <div key={k} className="kpi"><div className="eyebrow">{SKILL_NAME[k]}</div><div className="v">{fmtBand(b[k])}</div><div className="s">{k === "L" ? `${m.detail.lCorrect}/40` : k === "R" ? `${m.detail.rCorrect}/40` : b[k] == null ? "pending assessment" : ""}{pb && pb[k] != null && b[k] != null ? ` · ${(b[k]! - pb[k]!) >= 0 ? "+" : ""}${(b[k]! - pb[k]!).toFixed(1)} vs previous` : ""}</div></div>)}
          <div className="kpi" style={{ borderColor: "var(--gold)" }}><div className="eyebrow">Overall estimated band</div><div className="v">{fmtBand(b.overall)}</div><div className="s">{b.overall == null ? "needs Writing and Speaking bands" : pb?.overall != null ? `previous ${fmtBand(pb.overall)}` : ""}</div></div>
        </div>
        <Disclaimer />
      </div>
      <div className="grid g2">
        <div className="card stack"><h2>Time management</h2>
          {(["L", "R", "W", "S"] as Skill[]).map((k) => { const u = m.detail.timeUsed[k] || 0, l = m.detail.timeLimit[k] || 1; return <div key={k} className="row between"><span>{SKILL_NAME[k]}</span><span className={"num " + (u > l ? "" : "muted")} style={{ color: u > l ? "var(--bad)" : undefined }}>{fmtClock(u)} / {fmtClock(l)}</span></div>; })}
        </div>
        <div className="card stack"><h2>Accuracy by question type</h2>
          <HBars rows={types.map((x) => ({ label: x.t, value: x.p, note: `${x.c}/${x.n}`, color: x.p >= 0.75 ? "var(--good)" : x.p >= 0.5 ? "var(--warn)" : "var(--bad)" }))} max={1} fmt={(v) => Math.round(v * 100) + "%"} />
        </div>
        <div className="card stack"><h2>Weakest question types</h2>{types.slice(0, 3).map((x) => <p key={x.t}>{x.t}: <b>{x.c}/{x.n}</b></p>)}</div>
        <div className="card stack"><h2>Strongest areas</h2>{types.slice(-3).reverse().map((x) => <p key={x.t}>{x.t}: <b>{x.c}/{x.n}</b></p>)}</div>
      </div>
      <div className="card stack"><h2>Complete the Writing and Speaking assessment</h2>
        <p className="small muted">Open each task, self-assess on the IELTS criteria and (optionally) import Claude feedback. The report updates automatically.</p>
        {ws.map((w) => <div key={w.id} className="row between"><span>Writing Task {w.task} · {wordCount(w.text)} words</span><span className="num">{fmtBand(w.ai?.overall ?? criteriaBand(Object.values(w.self || {})))}</span><a className="btn sm" href={`#/writing/${w.id}`}>Assess</a></div>)}
        <div className="row between"><span>Speaking · {rs.length} recorded answers</span><a className="btn sm" href="#/speaking/recordings">Assess recordings</a></div>
      </div>
    </>
  );
}

/* ================= DIAGNOSTIC ================= */
function Diagnostic() {
  const s = useStore();
  const c = getContent();
  const lSet = c.listening.find((x) => x.id === "L7") || c.listening.find((x) => !x.generated);
  const rSet = c.reading.find((x) => x.id === "R6") || c.reading.find((x) => !x.generated);
  const [step, setStep] = useState(0);
  const [lr, setLr] = useState<{ L?: number | null; R?: number | null }>({});
  const [g, setG] = useState<number[]>([]);
  const gItems = useMemo(() => c.grammar.flatMap((t: any) => t.ex.filter((e: any) => e.lvl === 2).slice(0, 1).map((e: any) => ({ t, e }))).slice(0, 10), [c.grammar.length]);
  const [gDone, setGDone] = useState(false);
  if (!lSet || !rSet) return <Empty>The diagnostic needs Listening Pack 01 and Reading Pack 01. <a href="#/library">Offline Library</a></Empty>;
  const steps = ["Start", "Listening", "Reading", "Grammar", "Writing & Speaking", "Report"];
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/mock">← Mock Tests</a><h1>Diagnostic test</h1><p className="sub">About 60–75 minutes. Gives a first estimate per skill, then the plan adapts to it.</p></div></div>
      <div className="row">{steps.map((x, i) => <span key={x} className={"chip " + (i === step ? "accent" : i < step ? "good" : "")}>{x}</span>)}</div>
      {step === 0 && <div className="card stack"><p>The diagnostic uses one Listening section, one Reading passage, 10 grammar questions, one Writing Task 2 and one Speaking Part 2. Writing and Speaking are estimated through your self-assessment (or Claude feedback, if you import it later).</p><button className="btn primary" onClick={() => setStep(1)}>Start with Listening</button></div>}
      {step === 1 && <QuestionSet set={lSet} kind="diagnostic" exam onSubmitted={(r) => { setLr((x) => ({ ...x, L: r.band })); }} />}
      {step === 1 && lr.L !== undefined && <button className="btn primary" onClick={() => setStep(2)}>Continue to Reading</button>}
      {step === 2 && <QuestionSet set={rSet} kind="diagnostic" limitSecs={20 * 60} onSubmitted={(r) => setLr((x) => ({ ...x, R: r.band }))} />}
      {step === 2 && lr.R !== undefined && <button className="btn primary" onClick={() => setStep(3)}>Continue to Grammar</button>}
      {step === 3 && (
        <div className="card stack">
          {gItems.map((x: any, i: number) => (
            <div key={i} className={"q" + (gDone ? (g[i] === x.e.a ? " ok" : " no") : "")}><span className="qn">{i + 1}</span><div><div>{x.e.q}</div>
              <div className="opts inline">{x.e.opts.map((o: string, j: number) => <label key={j} className={"opt" + (gDone ? (j === x.e.a ? " right" : g[i] === j ? " wrong" : "") : g[i] === j ? " sel" : "")}><input type="radio" style={{ display: "none" }} disabled={gDone} checked={g[i] === j} onChange={() => setG((a) => { const n = a.slice(); n[i] = j; return n; })} />{o}</label>)}</div>
              {gDone && g[i] !== x.e.a && <div className="feedback small">{x.e.why}</div>}</div></div>
          ))}
          {!gDone ? <button className="btn primary" onClick={async () => {
            setGDone(true);
            const byType: Record<string, [number, number]> = {};
            const items = gItems.map((x: any, i: number) => { const ok = g[i] === x.e.a; const b = byType[x.t.title] || [0, 0]; byType[x.t.title] = [b[0] + (ok ? 1 : 0), b[1] + 1]; return { qid: `g:${x.t.id}:${x.t.ex.indexOf(x.e)}`, ok, your: g[i] != null ? x.e.opts[g[i]] : "", correct: x.e.opts[x.e.a], prompt: x.e.q, qtype: x.t.title, tag: x.t.title, explanation: x.e.why, difficulty: "Level 2", skill: "G" as const, ref: x.t.id }; });
            await recordAttempt({ ts: Date.now(), skill: "G", kind: "diagnostic", ref: "diagnostic", title: "Diagnostic grammar", correct: items.filter((i: any) => i.ok).length, total: items.length, band: null, secs: 300, byType, tags: {} }, items);
          }}>Check grammar</button> : <button className="btn primary" onClick={() => setStep(4)}>Continue</button>}
        </div>
      )}
      {step === 4 && (
        <div className="grid g2">
          <div className="card stack"><h2>Writing Task 2</h2><p className="small">Write one Task 2 essay (40 minutes), submit it, and complete the Self Assessment. Then come back here.</p><a className="btn primary" href="#/writing/new/2" target="_self">Open a Task 2 prompt</a></div>
          <div className="card stack"><h2>Speaking Part 2</h2><p className="small">Record one cue card answer and self-assess it in My recordings.</p><a className="btn primary" href="#/speaking/2">Open Part 2</a></div>
          <div className="span2 row"><button className="btn primary" onClick={() => setStep(5)}>See my diagnostic report</button></div>
        </div>
      )}
      {step === 5 && <DiagReport />}
    </>
  );
}

function DiagReport() {
  const s = useStore();
  const e = estimates(s);
  const days = Math.max(0, Math.round((new Date(s.profile.examDate).getTime() - Date.now()) / 864e5));
  const hoursLeft = Math.round((days / 7) * s.profile.hoursWeek);
  const rows = (["L", "R", "W", "S"] as Skill[]).map((k) => ({ k, b: e[k].band, t: s.profile.skillTargets?.[k] ?? s.profile.target, src: e[k].source }));
  const known = rows.filter((r) => r.b != null).sort((a, b) => (b.b! - b.t) - (a.b! - a.t));
  const totalGap = rows.reduce((a, r) => a + Math.max(0, r.t - (r.b ?? r.t - 1)), 0);
  const recHours = Math.min(25, Math.max(s.profile.hoursWeek, Math.round(6 + totalGap * 3)));
  return (
    <div className="stack lg">
      <div className="card raised pad-lg stack"><p className="eyebrow">Your IELTS diagnostic report</p>
        <div className="kpis">{rows.map((r) => <div key={r.k} className="kpi"><div className="eyebrow">{SKILL_NAME[r.k]}</div><div className="v">{fmtBand(r.b)}</div><div className="s">target {r.t}{r.src && r.src !== "app" ? ` · ${r.src}` : ""}</div></div>)}<div className="kpi"><div className="eyebrow">Overall</div><div className="v">{fmtBand(e.overall)}</div></div></div>
        <Disclaimer text={`${DISCLAIMER} A diagnostic uses few questions, so treat these bands as a starting point.`} /></div>
      <div className="grid g3">
        <div className="card stack"><h3>Strengths</h3>{known.slice(0, 2).map((r) => <p key={r.k}>{SKILL_NAME[r.k]} ({fmtBand(r.b)})</p>)}{!known.length && <p className="muted">Not enough data.</p>}</div>
        <div className="card stack"><h3>Weaknesses</h3>{known.slice(-2).reverse().filter((r) => r.b! < r.t).map((r) => <p key={r.k}>{SKILL_NAME[r.k]}: {fmtBand(r.b)} vs {r.t}</p>)}{rows.filter((r) => r.b == null).map((r) => <p key={r.k} className="muted">{SKILL_NAME[r.k]}: not assessed yet</p>)}</div>
        <div className="card stack"><h3>Priority areas</h3>{rows.filter((r) => r.b == null || r.b < r.t).sort((a, b) => (b.t - (b.b ?? 0)) - (a.t - (a.b ?? 0))).slice(0, 3).map((r) => <p key={r.k}>{SKILL_NAME[r.k]}</p>)}</div>
      </div>
      <div className="card stack"><h3>Training path</h3>
        <p>You have <b>{days} days</b> until {fmtDate(s.profile.examDate)}. At {s.profile.hoursWeek} h/week that is about <b>{hoursLeft} study hours</b>.</p>
        <p>Recommended weekly hours: <b>{recHours} h</b>{recHours > s.profile.hoursWeek ? " — more than you planned; consider increasing your study time or adjusting the exam date." : "."} This is a rule of the app (more hours for larger gaps), not an official guideline.</p>
        <p className="small muted">Path: weeks 1–4 build accuracy on your weakest question types and grammar; then add timed sections; in the last 3–4 weeks, one full mock per week.</p>
        <div className="row"><a className="btn primary" href="#/plan">Open my adaptive plan</a></div>
      </div>
    </div>
  );
}
