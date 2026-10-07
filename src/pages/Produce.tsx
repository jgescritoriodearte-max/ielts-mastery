import React, { useMemo, useRef, useState } from "react";
import { recordAttempt, reviewSkillItem, reviewVocab, useStore, type ItemResult } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import { diagnose } from "../lib/engine";
import { catDef, catLabel, catOfGrammarTopic, topicsOfCat } from "../lib/taxonomy";
import { mistakeDue } from "../lib/errorbank";
import { isDue, isDueAxis, wordProfile, type Grade } from "../lib/srs";
import { normalize } from "../lib/scoring";
import { shuffle } from "../lib/util";
import type { Mistake } from "../lib/types";
import { Empty, toast, useStopwatch } from "../ui/components";

/* Production Lab. The learner PRODUCES language (types a word, rewrites a faulty sentence, writes a sentence with a structure) instead of picking an option.
   Every result goes to (a) the production axis of the SRS, and (b) the Error Bank, so the app can tell "I recognise it" from "I can use it".
   All checking is local and honest: exact matches are checked automatically; free sentences are self-judged against a model (no pretend AI marking). */

type VocabTask = { kind: "vocab"; id: string; word: string; pos: string; def: string; pt: string; ex: string; coll: string };
type FixTask = { kind: "fix"; m: Mistake };
type GramTask = { kind: "gram"; topic: string; title: string; mode: "correct" | "write"; q: string; wrong: string; natural: string; rule: string; why: string };
type Task = VocabTask | FixTask | GramTask;

function vocabTasks(s: ReturnType<typeof useStore>, n: number, onlyGap: boolean): VocabTask[] {
  const all = getContent().vocab;
  const rank = (id: string) => { const v = s.vocab[id]; const p = wordProfile(v); return (p.productionGap ? 4 : 0) + (isDueAxis(v, "prod") ? 3 : 0) + (isDue(v) ? 1 : 0) + Math.random(); };
  const cand = all.filter((v) => { const st = s.vocab[v.id]; return st && st.seen > 0 && (!onlyGap || wordProfile(st).productionGap || isDueAxis(st, "prod")); });
  const pool = cand.length >= Math.min(n, 3) ? cand : all.filter((v) => s.vocab[v.id]?.seen);
  return pool.sort((a, b) => rank(b.id) - rank(a.id)).slice(0, n).map((v) => ({ kind: "vocab" as const, id: v.id, word: v.w[0], pos: v.w[1], def: v.w[2], ex: v.w[3], coll: v.w[6], pt: v.w[8] }));
}

function fixTasks(s: ReturnType<typeof useStore>, cat: string, n: number): FixTask[] {
  return s.mistakes.filter((m) => !m.resolved && m.correct && m.prompt && (!cat || m.cat === cat) && m.skill !== "L" && m.skill !== "R" && m.skill !== "V" && m.skill !== "G")
    .sort((a, b) => Number(mistakeDue(b)) - Number(mistakeDue(a)) || a.reviewCount - b.reviewCount).slice(0, n).map((m) => ({ kind: "fix" as const, m }));
}

function gramTasks(s: ReturnType<typeof useStore>, cat: string, n: number): GramTask[] {
  const topics = getContent().grammar;
  let ids = cat ? topicsOfCat(cat) : [];
  if (!ids.length) {
    // no category given (or no topic practises it): pick topics whose production axis is weakest / due / never produced
    ids = topics.map((t: any) => t.id).sort((a: string, b: string) => {
      const sa = s.skillItems["g:" + a], sb = s.skillItems["g:" + b];
      const f = (x: typeof sa) => (!x || x.prod.seen === 0 ? 2 : x.prod.due <= new Date().toISOString().slice(0, 10) ? 3 : 0) + Math.random();
      return f(sb) - f(sa);
    });
  }
  const out: GramTask[] = [];
  for (const id of ids) {
    const t = topics.find((x: any) => x.id === id);
    if (!t || !t.ex?.length) continue;
    const e: any = shuffle<any>(t.ex.filter((x: any) => x.natural && x.q?.includes("___")))[0];
    if (!e) continue;
    const wrongIdx = (e.opts as string[]).findIndex((_: string, j: number) => j !== e.a);
    out.push({ kind: "gram", topic: t.id, title: t.title, mode: out.length % 2 === 0 ? "correct" : "write", q: e.q, wrong: String(e.q).replace("___", e.opts[wrongIdx]), natural: e.natural, rule: (t.rules && t.rules[0]) || t.summary || "", why: e.why || "" });
    if (out.length >= n) break;
  }
  return out;
}

export function ProducePage({ query }: { query: URLSearchParams }) {
  usePacksVersion();
  const s = useStore();
  const cat = query.get("cat") || "";
  const focus = query.get("focus") || "";
  const c = getContent();
  const plan = useMemo(() => {
    let cc = cat, title = "";
    let tasks: Task[] = [];
    if (focus === "vocab") { title = "Words I recognise but cannot yet produce"; tasks = vocabTasks(s, 8, true); }
    else if (cc) {
      title = catLabel(cc);
      const d = catDef(cc);
      const lex = cc.startsWith("lx.") || cc.startsWith("vb.");
      tasks = [...fixTasks(s, cc, 4), ...gramTasks(s, cc, 3), ...(lex ? vocabTasks(s, 4, true) : [])];
      if (!tasks.length && !d.areas.length) tasks = [];
    } else {
      const dg = diagnose(s, c);
      cc = dg.best.cat || "";
      title = "Today's production session";
      tasks = [...vocabTasks(s, 3, true), ...fixTasks(s, cc, 3), ...gramTasks(s, cc, 2)];
    }
    return { title, tasks: tasks.slice(0, 10) };
  }, [cat, focus, c.vocab.length, c.grammar.length]);
  const [i, setI] = useState(0);
  const [res, setRes] = useState<{ ok: number; n: number }>({ ok: 0, n: 0 });
  const fixItems = useRef<ItemResult[]>([]);
  const saved = useRef(false);
  const secs = useStopwatch(i < plan.tasks.length);

  const finish = async (final = res) => {
    if (saved.current) return; saved.current = true;
    if (final.n) await recordAttempt({ ts: Date.now(), skill: "V", kind: "drill", ref: "production", title: "Production Lab", correct: final.ok, total: final.n, band: null, secs: Math.round(secs), byType: { Production: [final.ok, final.n] }, tags: {}, category: plan.title }, fixItems.current);
  };
  const next = async (ok: boolean) => {
    const r = { ok: res.ok + (ok ? 1 : 0), n: res.n + 1 };
    setRes(r); setI(i + 1);
    if (i + 1 >= plan.tasks.length) await finish(r);
  };

  const head = <div className="page-head"><div><a className="small" href="#/errors">← Error Bank</a><h1>Production Lab</h1><p className="sub">{plan.title}. You produce the language yourself; the result updates the production schedule and the Error Bank.</p></div>{plan.tasks.length > 0 && i < plan.tasks.length && <span className="chip">{i + 1}/{plan.tasks.length}</span>}</div>;
  if (!plan.tasks.length) return <>{head}<Empty>There is nothing to produce yet for this focus. Study a few words or practise some questions first, then come back. <a href="#/vocabulary">Vocabulary</a></Empty></>;
  if (i >= plan.tasks.length) return <>{head}<div className="card stack"><h2>Session complete</h2><p>{res.ok}/{res.n} produced correctly. Each result was filed on the production schedule of the word or structure, and any error went to the Error Bank.</p><div className="row"><a className="btn primary" href="#/errors">Error Bank</a><a className="btn" href="#/">Dashboard</a></div></div></>;
  const t = plan.tasks[i];
  return (
    <>
      {head}
      {t.kind === "vocab" && <VocabTaskView key={i} t={t} onDone={next} />}
      {t.kind === "fix" && <FixTaskView key={i} t={t} onDone={(ok, your) => { fixItems.current.push({ qid: t.m.qid, ok, your, correct: t.m.correct, prompt: t.m.prompt, qtype: t.m.qtype, tag: t.m.tag, explanation: t.m.explanation, difficulty: t.m.difficulty, skill: t.m.skill, ref: t.m.ref, cat: t.m.cat, axis: "prod", src: "production" }); next(ok); }} />}
      {t.kind === "gram" && <GramTaskView key={i} t={t} onDone={next} />}
      {i + 1 < plan.tasks.length && res.n > 0 && <div className="row"><button className="btn sm ghost" onClick={async () => { await finish(); toast("Saved."); setI(plan.tasks.length); }}>Finish session now</button></div>}
    </>
  );
}

/* ---------- vocabulary: recall the word from its meaning, then use it in your own sentence ---------- */
function VocabTaskView({ t, onDone }: { t: VocabTask; onDone: (ok: boolean) => void }) {
  const [word, setWord] = useState(""); const [sent, setSent] = useState(""); const [stage, setStage] = useState<0 | 1 | 2>(0);
  const t0 = useRef(Date.now()); const ms = useRef(0);
  const typedOk = normalize(word) === normalize(t.word);
  const rate = async (self: "yes" | "partly" | "no") => {
    // The final grade is the weaker of the two parts: recalling the word, and using it correctly in a sentence.
    const g: Grade = !typedOk || self === "no" ? 0 : self === "partly" ? 1 : 2;
    await reviewVocab(t.id, "prod", g, { task: "production", ms: ms.current, cat: "vb.production", ex: { a: word || "(blank)", b: t.word } });
    onDone(g > 0);
  };
  return (
    <div className="card stack">
      <span className="eyebrow">Vocabulary · production</span>
      <h2>{t.def}</h2>
      <p className="small muted">{t.pos}{t.pt ? ` · PT: ${t.pt}` : ""}{t.coll ? ` · collocation hint: ${t.coll.replace(new RegExp(t.word, "i"), "_____")}` : ""}</p>
      {stage === 0 && <><label className="field">Which word is it?<input type="text" className="gap-input" value={word} onChange={(e) => setWord(e.target.value)} autoFocus /></label>
        <button className="btn primary" onClick={() => { ms.current = Date.now() - t0.current; setStage(1); }}>Check</button></>}
      {stage >= 1 && <>
        <div className={"callout " + (typedOk ? "accent" : "warn")}>{typedOk ? "Correct: " : "The word is: "}<b>{t.word}</b></div>
        <label className="field">Now use it in a sentence of your own<textarea rows={2} value={sent} disabled={stage === 2} onChange={(e) => setSent(e.target.value)} placeholder={`Write one sentence with “${t.word}”…`} /></label>
        {stage === 1 && <button className="btn primary" disabled={sent.trim().split(/\s+/).length < 4} onClick={() => setStage(2)}>Compare with the example</button>}
      </>}
      {stage === 2 && <>
        <div className="feedback"><div><span className="k">Example</span> “{t.ex}”</div></div>
        <div className="row"><span className="small">Was your sentence correct and natural?</span>
          <button className="btn sm primary" onClick={() => rate("yes")}>Yes</button><button className="btn sm" onClick={() => rate("partly")}>Partly</button><button className="btn sm danger" onClick={() => rate("no")}>No</button></div>
      </>}
    </div>
  );
}

/* ---------- Error Bank item: rewrite the faulty sentence correctly ---------- */
function FixTaskView({ t, onDone }: { t: FixTask; onDone: (ok: boolean, your: string) => void }) {
  const [txt, setTxt] = useState(""); const [shown, setShown] = useState(false);
  const exact = normalize(txt) === normalize(t.m.correct);
  return (
    <div className="card stack">
      <span className="eyebrow">{t.m.cat ? catLabel(t.m.cat) : "Error"} · rewrite</span>
      <h2 style={{ fontFamily: "var(--display)", fontWeight: 500 }}>“{t.m.prompt}”</h2>
      <p className="small muted">This sentence contains an error you made before. Rewrite it correctly.</p>
      <textarea rows={2} value={txt} disabled={shown} onChange={(e) => setTxt(e.target.value)} autoFocus />
      {!shown ? <button className="btn primary" disabled={!txt.trim()} onClick={() => setShown(true)}>Compare with the correction</button> : <>
        <div className="feedback"><div><span className="k">Correction</span> <ins>{t.m.correct}</ins></div>{t.m.explanation && <div className="small">{t.m.explanation}</div>}</div>
        {exact ? <button className="btn primary" onClick={() => onDone(true, txt)}>Exact match · continue</button>
          : <div className="row"><span className="small">Not identical. Is yours also correct?</span><button className="btn sm primary" onClick={() => onDone(true, txt)}>Yes</button><button className="btn sm danger" onClick={() => onDone(false, txt)}>No</button></div>}
      </>}
    </div>
  );
}

/* ---------- grammar: correct an error, or produce a sentence with the structure ---------- */
function GramTaskView({ t, onDone }: { t: GramTask; onDone: (ok: boolean) => void }) {
  const [txt, setTxt] = useState(""); const [shown, setShown] = useState(false);
  const t0 = useRef(Date.now());
  const cat = catOfGrammarTopic(t.topic);
  const exact = t.mode === "correct" && normalize(txt) === normalize(t.natural);
  const rate = async (g: Grade) => {
    await reviewSkillItem("g:" + t.topic, "prod", g, { task: "production", ms: Date.now() - t0.current, cat, label: t.topic, ex: { a: txt.slice(0, 140), b: t.natural } });
    onDone(g > 0);
  };
  return (
    <div className="card stack">
      <span className="eyebrow">Grammar · {t.title} · {t.mode === "correct" ? "correct the error" : "use the structure"}</span>
      {t.mode === "correct"
        ? <><h2 style={{ fontFamily: "var(--display)", fontWeight: 500 }}>“{t.wrong}”</h2><p className="small muted">This sentence has a grammar error. Rewrite it correctly.</p></>
        : <><h2>Write a sentence of your own</h2><p className="small muted">Use: <b>{t.rule}</b></p></>}
      <textarea rows={2} value={txt} disabled={shown} onChange={(e) => setTxt(e.target.value)} autoFocus />
      {!shown ? <button className="btn primary" disabled={txt.trim().split(/\s+/).length < 3} onClick={() => setShown(true)}>Compare with a model</button> : <>
        <div className="feedback"><div><span className="k">Model</span> <ins>{t.natural}</ins></div>{t.why && <div className="small">{t.why}</div>}</div>
        {exact ? <button className="btn primary" onClick={() => rate(2)}>Exact match · continue</button>
          : <div className="row"><span className="small">{t.mode === "correct" ? "Is your version also correct?" : "Did you use the structure correctly?"}</span>
            <button className="btn sm primary" onClick={() => rate(2)}>Yes</button><button className="btn sm" onClick={() => rate(1)}>Partly</button><button className="btn sm danger" onClick={() => rate(0)}>No</button></div>}
      </>}
    </div>
  );
}
