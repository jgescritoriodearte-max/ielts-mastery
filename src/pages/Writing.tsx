import React, { useEffect, useMemo, useRef, useState } from "react";
import { addMistakes, deleteWriting, getState, saveWriting, useStore } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import type { Writing } from "../lib/types";
import { analyseWriting } from "../lib/localWriting";
import { writingPrompt } from "../lib/prompts";
import { criteriaBand, fmtBand } from "../lib/bands";
import { downloadFile, fmtClock, pick, uid, wordCount, slug } from "../lib/util";
import { go } from "../lib/pwa";
import { Countdown, Empty, Icon, Modal, Seg, toast, useStopwatch } from "../ui/components";
import { TaskChart } from "../ui/Diagrams";
import { CopyToClaude, FeedbackView, ImportFeedback, SelfAssessment } from "../ui/AiFeedback";

export function allPrompts() {
  const p = getContent().prompts || { t1a: [], t1gt: [], t2: [] };
  return { t1a: p.t1a || [], t1gt: p.t1gt || [], t2: p.t2 || [] };
}

export function newWriting(prompt: any, task: 1 | 2, variant: "academic" | "gt", mockId?: string): Writing {
  return {
    id: uid("w-"), updatedAt: Date.now(), createdAt: Date.now(), task, variant, promptId: prompt.id, promptType: prompt.type,
    promptText: prompt.prompt, text: "", secs: 0, status: "draft", mockId,
  };
}

export function WritingPage({ parts }: { parts: string[] }) {
  const s = useStore();
  usePacksVersion();
  if (parts[0] === "new" || parts[0] === "start") return <Creator key={parts.join("/")} parts={parts} />;
  if (parts[0]) {
    const w = s.writings.find((x) => x.id === parts[0]);
    if (!w) return <Empty>This text was not found. <a href="#/writing">Back to Writing</a></Empty>;
    return <Editor key={w.id} w={w} />;
  }
  return <WritingHome />;
}

/** Picks the prompt ONCE and creates a single draft (guarded against re-renders). */
function Creator({ parts }: { parts: string[] }) {
  const s = useStore();
  const done = useRef(false);
  const prompt = useMemo(() => {
    const P = allPrompts();
    const variant = s.profile.exam;
    const task = parts[0] === "new" ? (Number(parts[1]) as 1 | 2) : null;
    const pid = parts[0] === "start" ? parts[1] : null;
    const all = [...P.t1a.map((x: any) => ({ ...x, task: 1, variant: "academic" })), ...P.t1gt.map((x: any) => ({ ...x, task: 1, variant: "gt" })), ...P.t2.map((x: any) => ({ ...x, task: 2, variant }))];
    let pr = pid ? all.find((x) => x.id === pid) : null;
    if (!pr && task) {
      const pool = all.filter((x) => x.task === task && (task === 2 || x.variant === variant));
      const used = new Set(s.writings.map((w) => w.promptId));
      const fresh = pool.filter((x) => !used.has(x.id));
      pr = pool.length ? pick(fresh.length ? fresh : pool) : null;
    }
    return pr;
  }, []);
  useEffect(() => {
    if (!prompt || done.current) return;
    done.current = true;
    const w = newWriting(prompt, prompt.task, prompt.variant);
    saveWriting(w).then(() => go(`/writing/${w.id}`));
  }, []);
  if (!prompt) return <Empty>Writing prompts are not on this device. <a href="#/library">Open the Offline Library</a>.</Empty>;
  return <p className="muted">Preparing your task…</p>;
}

function WritingHome() {
  const s = useStore();
  const P = allPrompts();
  const [tab, setTab] = useState<"t2" | "t1">("t2");
  const [type, setType] = useState("All");
  const t1 = s.profile.exam === "gt" ? P.t1gt : P.t1a;
  const list = tab === "t2" ? P.t2 : t1;
  const types: string[] = ["All", ...new Set<string>(list.map((x: any) => x.type as string))];
  const shown = type === "All" ? list : list.filter((x: any) => x.type === type);
  const drafts = s.writings.filter((w) => w.status === "draft" && !w.mockId);
  const subs = s.writings.filter((w) => w.status === "submitted");
  return (
    <>
      <div className="page-head"><div><h1>Writing Lab</h1><p className="sub">Write in the app (saved automatically, offline). Get local checks immediately, assess yourself on the four criteria, and optionally import Claude's feedback.</p></div>
        <div className="row"><a className="btn" href="#/writing/new/1">Random Task 1</a><a className="btn primary" href="#/writing/new/2">Random Task 2</a></div></div>
      {drafts.length > 0 && <div className="card stack"><h2>Continue writing</h2>{drafts.map((w) => (
        <div key={w.id} className="row between" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}><b>Task {w.task} · {w.promptType}</b><div className="small muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.promptText.split("\n")[0]}</div></div>
          <span className="small num muted">{wordCount(w.text)} words</span><a className="btn sm primary" href={`#/writing/${w.id}`}>Continue</a>{wordCount(w.text) === 0 && <button className="btn sm ghost icon-btn" aria-label="Discard empty draft" title="Discard empty draft" onClick={() => deleteWriting(w.id)}><Icon name="trash" /></button>}</div>))}</div>}
      <div className="card stack">
        <div className="row between"><h2>Topic bank</h2><Seg value={tab} onChange={(v) => { setTab(v); setType("All"); }} options={[{ v: "t2", label: "Task 2" }, { v: "t1", label: s.profile.exam === "gt" ? "Task 1 (letters)" : "Task 1 (Academic)" }]} /></div>
        <div className="row">{types.map((t) => <button key={t} className={"btn sm" + (t === type ? " primary" : "")} onClick={() => setType(t)}>{t}</button>)}</div>
        <div className="stack">{shown.map((p: any) => {
          const done = s.writings.filter((w) => w.promptId === p.id && w.status === "submitted");
          return (
            <div key={p.id} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "8px 0", alignItems: "flex-start" }}>
              <span className="chip">{p.type}</span>
              <span style={{ flex: 1, minWidth: 0 }} className="small">{p.title ? <b>{p.title}. </b> : null}{p.prompt.split("\n")[0]}</span>
              {done.length > 0 && <span className="chip good">done ×{done.length}</span>}
              <a className="btn sm" href={`#/writing/start/${p.id}`}>Write</a>
            </div>);
        })}</div>
        <p className="tiny muted"><span className="chip ai">AI-generated IELTS-style practice</span> Prompts written for this app (not official IELTS material). Chart figures are illustrative practice data.</p>
      </div>
      <div className="card stack"><h2>Submitted</h2>
        {subs.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Task</th><th>Words</th><th>Self</th><th>Claude</th><th /></tr></thead><tbody>
          {subs.map((w) => <tr key={w.id}><td className="num">{new Date(w.submittedAt || w.updatedAt).toLocaleDateString("en-GB")}</td><td>T{w.task} · {w.promptType}{w.mockId ? " · mock" : ""}</td><td className="num">{wordCount(w.text)}</td><td className="num">{fmtBand(criteriaBand(Object.values(w.self || {})))}</td><td className="num">{w.ai ? fmtBand(w.ai.overall) : <span className="muted">–</span>}</td><td><a className="btn sm" href={`#/writing/${w.id}`}>Open</a></td></tr>)}
        </tbody></table></div> : <Empty>No submitted texts yet.</Empty>}
      </div>
    </>
  );
}

function Editor({ w }: { w: Writing }) {
  const [text, setText] = useState(w.text);
  const submitted = w.status === "submitted";
  const secs = useStopwatch(!submitted);
  const base = useRef(w.secs);
  const limit = w.task === 1 ? 20 * 60 : 40 * 60;
  const [confirmDel, setConfirmDel] = useState(false);
  const chart = useMemo(() => {
    const p = getContent().prompts;
    const all = [...(p?.t1a || []), ...(getContent().mocks.map((m: any) => m.writing?.t1Academic).filter(Boolean))];
    return all.find((x: any) => x.id === w.promptId)?.chart;
  }, [w.promptId]);
  const words = wordCount(text);
  const latest = useRef({ text, secs: 0 });
  latest.current = { text, secs: base.current + secs };
  /* Autosave only while the record is still a draft (always re-read the latest record from the store). */
  const saveDraft = (t: string, sc: number) => {
    const cur = getState().writings.find((x) => x.id === w.id);
    if (!cur || cur.status !== "draft") return;
    if (cur.text === t && Math.abs(cur.secs - sc) < 5) return;
    saveWriting({ ...cur, text: t, secs: Math.round(sc) });
  };
  useEffect(() => {
    if (submitted) return;
    const t = setTimeout(() => saveDraft(text, base.current + secs), 700);
    return () => clearTimeout(t);
  }, [text]);
  useEffect(() => () => saveDraft(latest.current.text, latest.current.secs), []);
  const report = useMemo(() => analyseWriting(text, w.task, /informal/i.test(w.promptType) ? "informal" : "formal"), [submitted ? text : ""]);
  const submit = async () => {
    if (words < 20) { toast("Write at least a few sentences before submitting."); return; }
    const cur = getState().writings.find((x) => x.id === w.id) || w;
    await saveWriting({ ...cur, text, secs: Math.round(base.current + secs), status: "submitted", submittedAt: Date.now() });
    toast("Submitted. Local checks are ready.");
  };
  const exportTxt = () => downloadFile(`IELTS-Writing-Task${w.task}-${slug(w.promptType)}-${new Date().toISOString().slice(0, 10)}.txt`, `${w.promptText}\n\n----\n\n${text}\n\n(${words} words)`, "text/plain");
  const minW = w.task === 1 ? 150 : 250;
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/writing">← Writing Lab</a><h1>Task {w.task}: {w.promptType}</h1></div>
        <div className="row">{!submitted && <Countdown secs={base.current + secs} limit={limit} label="Suggested time" />}<button className="btn sm ghost" onClick={exportTxt}><Icon name="download" />Export</button><button className="btn sm ghost danger" onClick={() => setConfirmDel(true)}><Icon name="trash" />Delete</button></div></div>
      <div className="ex-layout">
        <div className="card passage stack">
          <div className="eyebrow">{w.variant === "gt" ? "General Training" : "Academic"} · Writing Task {w.task}{w.mockId ? " · Mock test" : ""}</div>
          <p style={{ whiteSpace: "pre-wrap", fontFamily: "var(--body)", fontSize: ".98rem" }}>{w.promptText}</p>
          {chart && <TaskChart chart={chart} />}
          <p className="tiny muted">Write at least {minW} words. Suggested time: {w.task === 1 ? 20 : 40} minutes.</p>
        </div>
        <div className="stack">
          <textarea className="editor" value={text} readOnly={submitted} onChange={(e) => setText(e.target.value)} placeholder="Start writing here. Your text is saved automatically on this device." aria-label="Your answer" spellCheck={false} />
          <div className="row between"><span className={"wc " + (words < minW ? "muted" : "")} style={{ color: words >= minW ? "var(--good)" : undefined }}>{words} / {minW} words</span>
            {!submitted ? <div className="row"><span className="tiny muted">Saved automatically</span><button className="btn primary" onClick={submit}><Icon name="check" />Submit</button></div>
              : <button className="btn" onClick={async () => { const n = { ...w, id: uid("w-"), createdAt: Date.now(), status: "draft" as const, ai: undefined, self: undefined, submittedAt: undefined, secs: 0 }; await saveWriting(n); go(`/writing/${n.id}`); }}>Rewrite as new draft</button>}
          </div>
        </div>
      </div>
      {submitted && <AfterSubmit w={w} report={report} />}
      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete this text?">
        <p>This permanently removes the text{w.ai ? " and its imported feedback" : ""} from this device.</p>
        <div className="row"><button className="btn danger solid" onClick={async () => { await deleteWriting(w.id); go("/writing"); }}>Delete</button><button className="btn" onClick={() => setConfirmDel(false)}>Cancel</button></div>
      </Modal>
    </>
  );
}

function AfterSubmit({ w, report }: { w: Writing; report: ReturnType<typeof analyseWriting> }) {
  const s = useStore();
  const prompt = writingPrompt(s, w);
  return (
    <div className="grid g2">
      <div className="card stack">
        <div className="row between"><h2>Local checks</h2><span className="chip">offline · not a band score</span></div>
        <div className="kpis">
          <div className="kpi"><div className="eyebrow">Words</div><div className="v num">{report.words}</div></div>
          <div className="kpi"><div className="eyebrow">Paragraphs</div><div className="v num">{report.paragraphs}</div></div>
          <div className="kpi"><div className="eyebrow">Avg sentence</div><div className="v num">{report.avgLen}</div><div className="s">words</div></div>
          <div className="kpi"><div className="eyebrow">Time</div><div className="v num">{fmtClock(w.secs)}</div></div>
        </div>
        <div className="stack" style={{ gap: 4 }}>{report.checklist.map((c) => <span key={c.label} className="small"><span style={{ color: c.ok ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{c.ok ? "✓" : "✗"}</span> {c.label}</span>)}</div>
        {report.linkers.length > 0 && <p className="small"><b>Linking words used:</b> {report.linkers.join(", ")}</p>}
        <div className="stack">{report.issues.map((i, k) => <div key={k} className="err" style={{ borderLeftColor: "var(--warn)" }}><span className="eyebrow">{i.cat}</span><span>{i.text}</span><span className="small">Better: <ins>{i.fix}</ins></span></div>)}
          {!report.issues.length && <p className="small muted">No rule-based issues found. That does not mean the text is error-free.</p>}</div>
      </div>
      <div className="stack lg">
        <div className="card stack"><h2>Self Assessment</h2>
          <SelfAssessment task={w.task} skill="writing" value={w.self} onSave={(c) => saveWriting({ ...(getState().writings.find((x) => x.id === w.id) || w), self: c })} /></div>
        <div className="card stack"><h2>Copy to Claude <span className="chip ai" style={{ marginLeft: 6 }}>optional</span></h2>
          <p className="small">One prompt returns: the four criteria, estimated band, specific errors with corrections, vocabulary and grammar recommendations, and <b>Improve to Band 7+</b> (corrected, Band 7 and Band 8 versions).</p>
          <CopyToClaude prompt={prompt} label="Copy evaluation prompt" />
          <ImportFeedback skill="writing" onImport={async (fb) => {
            await saveWriting({ ...(getState().writings.find((x) => x.id === w.id) || w), ai: fb });
            await addMistakes(fb.errors.slice(0, 15).map((e) => ({ ts: Date.now(), skill: "W", ref: w.id, qid: `w:${w.id}:${e.original.slice(0, 40)}`, qtype: e.category, tag: e.category, difficulty: `Task ${w.task}`, prompt: e.original, your: e.original, correct: e.correction, explanation: e.explanation || "", resolved: false, reviewOk: 0, reviewCount: 0 })));
          }} /></div>
      </div>
      {w.ai && <div className="card span2"><FeedbackView fb={w.ai} self={w.self} original={w.text} skill="writing" task={w.task} /></div>}
    </div>
  );
}
