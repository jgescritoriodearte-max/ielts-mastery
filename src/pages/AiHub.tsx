import React, { useState } from "react";
import { deleteCustomPack, saveCustomPack, useStore } from "../lib/store";
import { buildContent, getContent, usePacksVersion } from "../lib/packs";
import { generatePackPrompt, TUTOR_TEMPLATES, tutorPrompt } from "../lib/prompts";
import { extractJson, validatePack } from "../lib/aiImport";
import { useOnline, go } from "../lib/pwa";
import { uid } from "../lib/util";
import { AiLabel, Empty, Icon, Modal, Seg, toast } from "../ui/components";
import { CopyToClaude } from "../ui/AiFeedback";

const R_TYPES = ["True/False/Not Given", "Yes/No/Not Given", "Matching Headings", "Matching Information", "Matching Features", "Multiple Choice", "Sentence Completion", "Summary Completion", "Note Completion", "Table Completion", "Flow-chart Completion", "Short Answer"];
const L_TYPES = ["Form Completion", "Multiple Choice", "Matching", "Note Completion", "Table Completion", "Sentence Completion", "Summary Completion", "Short Answer"];
const TOPICS: Record<string, string[]> = {
  reading: ["Science", "History", "Environment", "Technology", "Society", "Education", "Psychology", "Culture", "Business", "Health", "Art", "Travel", "Geography"],
  listening: ["Daily life", "Travel", "Education", "Work", "Culture", "Science", "Art", "Health"],
  grammar: ["Tenses", "Articles", "Prepositions", "Conditionals", "Passive", "Relative clauses", "Modal verbs", "Complex sentences", "Linking words", "Subject-verb agreement", "Gerunds", "Infinitives", "Comparatives", "Reported speech"],
  vocabulary: ["Environment", "Education", "Technology", "Health", "Society", "Work", "Economy", "Culture", "Tourism", "Science", "Government", "Crime", "Transportation", "Globalization", "Media", "Art"],
};

export function AiHubPage({ parts }: { parts: string[] }) {
  usePacksVersion();
  const online = useOnline();
  const tab = parts[0] || "tutor";
  return (
    <>
      <div className="page-head"><div><h1>IELTS AI Tutor</h1><p className="sub">Optional. The app never calls an AI service: it prepares structured prompts that you paste into Claude yourself, and validates what you paste back. Without Claude, everything else keeps working.</p></div>
        <Seg value={tab === "generate" ? "generate" : tab} onChange={(v) => go("/ai/" + v)} options={[{ v: "tutor", label: "Ask the tutor" }, { v: "generate", label: "Generate practice" }, { v: "import", label: "Import content" }, { v: "pending", label: "Pending feedback" }]} /></div>
      {!online && <div className="callout warn"><Icon name="wifi" /><span>Internet connection required to use Claude. You can still prepare and copy prompts now and paste them later.</span></div>}
      {tab === "tutor" && <Tutor />}
      {tab === "generate" && <Generate kind={(parts[1] as any) || "reading"} />}
      {tab === "import" && <ImportPack />}
      {tab === "pending" && <Pending />}
    </>
  );
}

function Tutor() {
  const s = useStore();
  const [t, setT] = useState(0);
  const [req, setReq] = useState(TUTOR_TEMPLATES[0].text);
  return (
    <div className="grid g2">
      <div className="card stack">
        <h2>What do you want to ask?</h2>
        <div className="row">{TUTOR_TEMPLATES.map((x, i) => <button key={x.label} className={"btn sm" + (i === t ? " primary" : "")} onClick={() => { setT(i); setReq(x.text); }}>{x.label}</button>)}</div>
        <label className="field">Your request<textarea rows={9} value={req} onChange={(e) => setReq(e.target.value)} /></label>
      </div>
      <div className="card stack">
        <h2>Copy to Claude</h2>
        <p className="small">The prompt adds context about you: exam type, target, current estimates and recent mistakes (no other personal data).</p>
        <CopyToClaude prompt={tutorPrompt(s, getContent(), req)} />
      </div>
    </div>
  );
}

function Generate({ kind }: { kind: "reading" | "listening" | "grammar" | "vocabulary" }) {
  const q = new URLSearchParams(location.hash.split("?")[1] || "");
  const [k, setK] = useState(kind);
  const [topic, setTopic] = useState(q.get("topic") || TOPICS[kind]?.[0] || "");
  const [level, setLevel] = useState("IELTS Level");
  const [types, setTypes] = useState<string[]>([]);
  const [count, setCount] = useState(kind === "vocabulary" ? 15 : 1);
  const list = k === "reading" ? R_TYPES : k === "listening" ? L_TYPES : [];
  return (
    <div className="grid g2">
      <div className="card stack">
        <h2>Generate new practice with Claude</h2>
        <Seg value={k} onChange={(v) => { setK(v); setTopic(TOPICS[v][0]); setTypes([]); setCount(v === "vocabulary" ? 15 : 1); }} options={[{ v: "reading", label: "Reading" }, { v: "listening", label: "Listening" }, { v: "grammar", label: "Grammar" }, { v: "vocabulary", label: "Vocabulary" }]} />
        <div className="grid g2">
          <label className="field">Topic<input type="text" list="topics" value={topic} onChange={(e) => setTopic(e.target.value)} /><datalist id="topics">{TOPICS[k].map((t) => <option key={t} value={t} />)}</datalist></label>
          <label className="field">Level<select value={level} onChange={(e) => setLevel(e.target.value)}>{["Beginner", "Intermediate", "Upper-Intermediate", "Advanced", "IELTS Level"].map((l) => <option key={l}>{l}</option>)}</select></label>
          <label className="field">{k === "vocabulary" ? "Number of words" : k === "grammar" ? "Number of topics" : "Number of sets"}<input type="number" min={1} max={k === "vocabulary" ? 30 : 3} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
        </div>
        {list.length > 0 && <div className="stack"><span className="small" style={{ fontWeight: 600 }}>Question types (optional)</span><div className="row">{list.map((t) => <label key={t} className="check chip"><input type="checkbox" checked={types.includes(t)} onChange={() => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />{t}</label>)}</div></div>}
        {k === "listening" && <p className="small muted">Imported Listening scripts play with the device voice (no pre-produced audio) and are labelled “AI-generated IELTS-style practice”.</p>}
      </div>
      <div className="card stack">
        <h2>1. Copy the prompt</h2>
        <CopyToClaude prompt={generatePackPrompt(k, { topic, level, types, count })} />
        <h2>2. Import Claude's reply</h2>
        <p className="small">Paste the reply in <a href="#/ai/import">Import content</a>. The JSON is checked strictly: answers must match the options and every evidence quote must exist in the text.</p>
      </div>
    </div>
  );
}

function ImportPack() {
  const s = useStore();
  const [text, setText] = useState("");
  const [res, setRes] = useState<ReturnType<typeof validatePack> | null>(null);
  const [perr, setPerr] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const check = () => {
    const { obj, error } = extractJson(text);
    setPerr(error);
    setRes(obj ? validatePack(obj) : null);
  };
  const doImport = async () => {
    if (!res?.ok) return;
    await saveCustomPack({ id: uid("ai-"), updatedAt: Date.now(), title: res.title!, kind: res.kind!, importedAt: Date.now(), data: res.data, label: "AI-generated IELTS-style practice" });
    await buildContent();
    setText(""); setRes(null);
    toast("Pack imported. It is stored on this device and works offline.");
  };
  return (
    <div className="grid g2">
      <div className="card stack">
        <h2>Import a content pack</h2>
        <label className="field">Claude's reply<textarea rows={12} value={text} onChange={(e) => { setText(e.target.value); setRes(null); setPerr(null); }} placeholder='```json {"type":"ielts-mastery-pack", ...} ```' /></label>
        <div className="row"><button className="btn primary" disabled={!text.trim()} onClick={check}>Validate</button>{res?.ok && <button className="btn primary" onClick={doImport}><Icon name="download" />Import {res.count} items</button>}</div>
        {perr && <div className="callout bad">{perr}</div>}
        {res && !res.ok && <div className="callout bad"><div><b>Not imported — {res.errors.length} problem(s).</b> Ask Claude to fix exactly these points and resend the JSON:<ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{res.errors.slice(0, 12).map((e, i) => <li key={i} className="small">{e}</li>)}</ul>{res.errors.length > 12 && <p className="small">…and {res.errors.length - 12} more.</p>}</div></div>}
        {res?.ok && <div className="callout good"><div><b>Valid {res.kind} pack</b> — “{res.title}”, {res.count} items.</div></div>}
        {res && res.warnings.length > 0 && <div className="callout warn"><ul style={{ margin: 0, paddingLeft: 18 }}>{res.warnings.slice(0, 6).map((w, i) => <li key={i} className="small">{w}</li>)}</ul></div>}
      </div>
      <div className="card stack">
        <h2>Imported packs</h2>
        {s.customPacks.length ? s.customPacks.map((p) => (
          <div key={p.id} className="row between" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
            <div><b>{p.title}</b><div className="small muted">{p.kind} · {new Date(p.importedAt).toLocaleDateString("en-GB")}</div><AiLabel /></div>
            <button className="btn sm ghost danger" onClick={() => setDel(p.id)}><Icon name="trash" />Remove</button>
          </div>)) : <Empty>No AI-generated packs yet.</Empty>}
      </div>
      <Modal open={!!del} onClose={() => setDel(null)} title="Remove this pack?"><p>The exercises disappear from the app. Your past results stay in your history.</p>
        <div className="row"><button className="btn danger solid" onClick={async () => { await deleteCustomPack(del!); await buildContent(); setDel(null); }}>Remove</button><button className="btn" onClick={() => setDel(null)}>Cancel</button></div></Modal>
    </div>
  );
}

function Pending() {
  const s = useStore();
  const ws = s.writings.filter((w) => w.status === "submitted" && !w.ai);
  const rs = s.recordings.filter((r) => r.part > 0 && !r.ai);
  return (
    <div className="grid g2">
      <div className="card stack"><h2>Writing without Claude feedback</h2>
        {ws.length ? ws.map((w) => <div key={w.id} className="row between"><span className="small">T{w.task} · {w.promptType} · {new Date(w.submittedAt || w.updatedAt).toLocaleDateString("en-GB")}</span><a className="btn sm" href={`#/writing/${w.id}`}>Open</a></div>) : <Empty>Nothing pending.</Empty>}</div>
      <div className="card stack"><h2>Speaking without Claude feedback</h2>
        {rs.length ? <><p className="small">{rs.length} answers ({rs.filter((r) => r.transcript.trim()).length} with transcript).</p><a className="btn" href="#/speaking/recordings">Open My recordings</a></> : <Empty>Nothing pending.</Empty>}</div>
    </div>
  );
}
