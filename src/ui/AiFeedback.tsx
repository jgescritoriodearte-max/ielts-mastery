import React, { useState } from "react";
import type { AiFeedback as FB, Criteria } from "../lib/types";
import { extractJson, validateFeedback } from "../lib/aiImport";
import { fmtBand, WRITING_CRITERIA, SPEAKING_CRITERIA, criteriaBand } from "../lib/bands";
import { copyText } from "../lib/util";
import { CLAUDE_URL } from "../lib/prompts";
import { BandSelect, Disclaimer, Icon, Seg, toast } from "./components";

export function CopyToClaude({ prompt, label = "Copy prompt", note }: { prompt: string; label?: string; note?: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="stack">
      <div className="row">
        <button className="btn primary" onClick={async () => { const ok = await copyText(prompt); setCopied(ok); toast(ok ? "Prompt copied. Open Claude and paste the prompt." : "Copy failed - open the prompt and copy it manually."); if (!ok) setShow(true); }}><Icon name="copy" />{label}</button>
        <a className="btn" href={CLAUDE_URL} target="_blank" rel="noreferrer"><Icon name="ext" />Open Claude</a>
        <button className="btn ghost sm" onClick={() => setShow((x) => !x)}>{show ? "Hide prompt" : "View prompt"}</button>
      </div>
      {copied && <p className="small muted">Open Claude and paste the prompt. Then copy Claude's whole reply and paste it below in <b>Import AI Feedback</b>.</p>}
      {note && <p className="tiny muted">{note}</p>}
      <p className="tiny muted">Internet connection required for Claude. Nothing is sent by this app: you choose what to paste.</p>
      {show && <pre className="prompt">{prompt}</pre>}
    </div>
  );
}

export function ImportFeedback({ skill, onImport }: { skill: "writing" | "speaking"; onImport: (fb: FB) => void }) {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const run = () => {
    const { obj, error } = extractJson(text);
    if (error) { setErrors([error]); setWarnings([]); return; }
    const v = validateFeedback(obj, skill);
    setErrors(v.errors); setWarnings(v.warnings);
    if (v.ok && v.fb) { onImport(v.fb); setText(""); toast("Feedback imported and saved."); }
  };
  return (
    <div className="stack">
      <label className="field">Import AI Feedback<span className="hint">Paste Claude's full reply (with the ```json block).</span>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder='```json {"type":"ielts-mastery-feedback", ...} ```' /></label>
      <div className="row"><button className="btn primary" disabled={!text.trim()} onClick={run}><Icon name="upload" />Validate and import</button></div>
      {errors.length > 0 && <div className="callout bad"><div><b>Not imported.</b> Fix the following and paste again:<ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div></div>}
      {warnings.length > 0 && <div className="callout warn"><div><ul style={{ margin: 0, paddingLeft: 18 }}>{warnings.map((e, i) => <li key={i}>{e}</li>)}</ul></div></div>}
    </div>
  );
}

export function SelfAssessment({ task, value, onSave, skill }: { task: 1 | 2; value?: Criteria; onSave: (c: Criteria) => void; skill: "writing" | "speaking" }) {
  const crit = skill === "writing" ? WRITING_CRITERIA(task) : SPEAKING_CRITERIA;
  const [c, setC] = useState<Criteria>(value || {});
  const band = criteriaBand(crit.map((k) => c[k.key]));
  return (
    <div className="stack">
      <p className="small muted">Before consulting Claude, rate yourself honestly (1–9). Later the app compares your self-assessment with the imported feedback.</p>
      <div className="grid g2">{crit.map((k) => (
        <label key={k.key} className="field">{k.label}<BandSelect value={c[k.key] ?? null} min={1} onChange={(v) => setC((o) => ({ ...o, [k.key]: v }))} /></label>
      ))}</div>
      <div className="row between"><span className="small">Self-assessed band: <b>{fmtBand(band)}</b></span><button className="btn" onClick={() => { onSave(c); toast("Self-assessment saved."); }}>Save self-assessment</button></div>
    </div>
  );
}

export function FeedbackView({ fb, self, original, skill, task = 2 }: { fb: FB; self?: Criteria; original: string; skill: "writing" | "speaking"; task?: 1 | 2 }) {
  const crit = skill === "writing" ? WRITING_CRITERIA(task) : SPEAKING_CRITERIA;
  const [tab, setTab] = useState<"mine" | "improved" | "b7" | "b8">("mine");
  const cats: Record<string, number> = {};
  fb.errors.forEach((e) => (cats[e.category] = (cats[e.category] || 0) + 1));
  const versions = { mine: original, improved: fb.improved || "", b7: fb.band7 || "", b8: fb.band8 || "" };
  return (
    <div className="stack lg">
      <div className="row between"><h2>IELTS-style estimated feedback</h2><span className="chip ai">Imported from Claude · {new Date(fb.importedAt).toLocaleDateString("en-GB")}</span></div>
      <div className="score-hero"><div><div className="eyebrow">Estimated {skill === "writing" ? "task" : "speaking"} band</div><div className="band-big">{fmtBand(fb.overall)}</div></div>
        {self && criteriaBand(Object.values(self)) != null && <div><div className="eyebrow">Your self-assessment</div><div className="band-mid">{fmtBand(criteriaBand(Object.values(self)))}</div></div>}</div>
      <div>
        <div className="crit"><span className="eyebrow">Criterion</span><span className="eyebrow">You</span><span className="eyebrow">Claude</span></div>
        {crit.map((k) => {
          const a = self?.[k.key], b = fb.criteria[k.key];
          const diff = a != null && b != null ? (a as number) - (b as number) : null;
          return <div key={k.key} className="crit"><span>{k.label}</span><span className="num">{fmtBand(a as number)}</span>
            <span className="num">{k.key === "P" && b == null ? <span className="chip warn">not assessed</span> : fmtBand(b as number)}{diff != null && Math.abs(diff) >= 1 && <span className={"chip " + (diff > 0 ? "warn" : "good")} style={{ marginLeft: 6 }}>{diff > 0 ? "you over-rated" : "you under-rated"}</span>}</span></div>;
        })}
        {skill === "speaking" && <p className="small muted" style={{ marginTop: 6 }}>Pronunciation: {fb.pronunciation || "not assessed - transcript only"}. The band is based on the other three criteria.</p>}
      </div>
      {fb.summary && <div className="callout" style={{ whiteSpace: "pre-wrap" }}>{fb.summary}</div>}
      {Object.keys(cats).length > 0 && <div className="row">{Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k} className="chip bad">{k}: {n}</span>)}</div>}
      {fb.errors.length > 0 && <div className="stack"><h3>Corrections</h3>{fb.errors.map((e, i) => (
        <div key={i} className="err"><div><span className="eyebrow">{e.category}</span></div><div>Your sentence: <s>{e.original}</s></div><div>Correction: <ins>{e.correction}</ins></div>{e.explanation && <div className="small muted">{e.explanation}</div>}</div>
      ))}</div>}
      <div className="grid g3">
        {fb.vocabulary.length > 0 && <div className="card flat"><h3>Vocabulary</h3><ul className="small" style={{ paddingLeft: 18 }}>{fb.vocabulary.map((v, i) => <li key={i}>{v}</li>)}</ul></div>}
        {fb.grammar.length > 0 && <div className="card flat"><h3>Grammar</h3><ul className="small" style={{ paddingLeft: 18 }}>{fb.grammar.map((v, i) => <li key={i}>{v}</li>)}</ul></div>}
        {fb.improvements.length > 0 && <div className="card flat"><h3>To reach Band 7+</h3><ul className="small" style={{ paddingLeft: 18 }}>{fb.improvements.map((v, i) => <li key={i}>{v}</li>)}</ul></div>}
      </div>
      {(fb.improved || fb.band7 || fb.band8) && <div className="stack"><h3>Improve to Band 7+</h3>
        <Seg value={tab} onChange={setTab} options={[{ v: "mine", label: "My version" }, ...(fb.improved ? [{ v: "improved" as const, label: "Corrected" }] : []), ...(fb.band7 ? [{ v: "b7" as const, label: "≈ Band 7" }] : []), ...(fb.band8 ? [{ v: "b8" as const, label: "≈ Band 8" }] : [])]} />
        <div className="model">{versions[tab]}</div>
        <p className="tiny muted">Compare the versions sentence by sentence: look at linking, precision of vocabulary and complex structures. The explanations above say why each change is better.</p></div>}
      <Disclaimer text="IELTS-style estimated feedback - not an official IELTS score." />
    </div>
  );
}
