import React, { useMemo, useRef, useState } from "react";
import { getContent, usePacksVersion } from "../lib/packs";
import { getState, recordAttempt, useStore, type ItemResult } from "../lib/store";
import { reviewSkillItem } from "../lib/store";
import { Bar, Empty, Icon, toast } from "../ui/components";
import { analyseWriting } from "../lib/localWriting";
import { catLabel } from "../lib/taxonomy";
import { conceptEvidence, evalSpec, lessonMode, masteryOf, P, segments, STEP_LABEL, STEP_ORDER, type Lesson, type LessonMode, type Mcq, type SpecResult, type TextItem } from "../lib/lessons";
import { progressOf, recordApplyErrors, recordTextAnswer, updateProgress } from "../lib/lessonStore";
import { shuffle } from "../lib/util";

type Step = LessonMode["step"];

/** **bold** markers become <b>. */
export function Rich({ text }: { text: string }) {
  return <>{segments(text).map((p, i) => (p.b ? <b key={i} className="hl">{p.t}</b> : <React.Fragment key={i}>{p.t}</React.Fragment>))}</>;
}

const prodDue = (id: string) => { const a = getState().skillItems["g:" + id]?.prod; return !!a && a.seen > 0 && a.due <= new Date().toISOString().slice(0, 10); };

export function LessonPage({ id }: { id: string }) {
  usePacksVersion();
  const l = getContent().lessons.find((x) => x.id === id);
  if (!l) return <Empty>This lesson is not on this device yet. Open the <a href="#/library">Offline Library</a> and update the Grammar Pack, then come back. <a href="#/grammar">Back to Grammar</a></Empty>;
  return <LessonView key={id} l={l} />;
}

function LessonView({ l }: { l: Lesson }) {
  const s = useStore();
  const now = Date.now();
  const prog = s.kv.lessonProgress?.[l.id];
  const ev = conceptEvidence(s.errors[l.cat], l.id, now);
  const mode = lessonMode(prog, ev, prodDue(l.id), now);
  const m = masteryOf(prog, ev);
  const fromHash = (location.hash.match(/[?&]step=(\w+)/) || [])[1] as Step | undefined;
  const [step, setStep] = useState<Step>(fromHash && STEP_ORDER.includes(fromHash) ? fromHash : mode.step);
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/grammar">← Grammar</a><h1>{l.title}</h1><p className="sub">{l.minutes} min · {l.level} · English lesson with Portuguese support where it helps</p></div></div>
      <div className="card stack">
        <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
          <MasteryChips m={m} />
          <span className="small muted">{m.label}</span>
        </div>
        <div className="small"><b>Recommended now: {mode.label}.</b> {mode.why}</div>
        <div className="seg" role="tablist" style={{ flexWrap: "wrap" }}>
          {STEP_ORDER.map((st) => <button key={st} role="tab" aria-selected={step === st} className={step === st ? "on" : ""} onClick={() => setStep(st)}>{STEP_LABEL[st]}{mode.step === st ? " ★" : ""}</button>)}
        </div>
        <div className="tiny muted">Teach → Check (do you understand WHY?) → Practise → Produce (your own sentences) → Write (a paragraph) → Test (no topic name). Multiple choice alone never counts as mastery.</div>
      </div>
      {step === "teach" && <Teach l={l} onRead={async () => { await updateProgress(l.id, (p) => P.read(p, Date.now())); setStep("check"); }} />}
      {step === "check" && <Check l={l} onRetaught={() => setStep("teach")} onNext={() => setStep("practise")} />}
      {step === "practise" && <Practise l={l} goProduce={() => setStep("produce")} />}
      {step === "produce" && <Produce l={l} goWrite={() => setStep("write")} />}
      {step === "write" && <Apply l={l} goTest={() => setStep("test")} />}
      {step === "test" && <Transfer l={l} />}
    </>
  );
}

export function MasteryChips({ m }: { m: ReturnType<typeof masteryOf> }) {
  const chip = (on: boolean, k: string, label: string) => <span className={"chip " + (on ? "good" : "")} title={label}>{on ? "✓ " : ""}{k} {label}</span>;
  return <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{chip(m.A, "A", "Recognise")}{chip(m.B, "B", "Understand")}{chip(m.C, "C", "Produce")}{chip(m.D, "D", "Use spontaneously")}</div>;
}

/* ---------------- TEACH ---------------- */
function Sec({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) { return <div className="card stack" id={id}><h2>{title}</h2>{children}</div>; }
const ExList = ({ list }: { list: string[] }) => <ul style={{ margin: 0, paddingLeft: 18 }}>{list.map((e, i) => <li key={i} style={{ marginBottom: 5, fontFamily: "var(--display)", fontSize: "1.02rem" }}><Rich text={e} /></li>)}</ul>;

function Teach({ l, onRead }: { l: Lesson; onRead: () => void }) {
  return (
    <>
      <Sec title="1 · What you will be able to do"><p><Rich text={l.objective} /></p></Sec>
      <Sec title="2 · Why this matters"><div className="grid g2">{l.why.map((w, i) => <div key={i} className="stack" style={{ gap: 3 }}><span className="eyebrow">{w.k}</span><span className="small"><Rich text={w.t} /></span></div>)}</div></Sec>
      <Sec title="3 · The idea behind the rule">
        <p><Rich text={l.concept.intro} /></p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>{l.concept.points.map((p, i) => <li key={i} style={{ marginBottom: 7 }}><Rich text={p} /></li>)}</ul>
      </Sec>
      <Sec title="4 · How it is formed">
        <div className="grid g2">{l.formation.map((f, i) => (
          <div key={i} className="stack"><h3>{f.title}</h3>
            <div className="table-wrap"><table className="t"><tbody>{f.rows.map(([k, v], j) => <tr key={j}><td style={{ whiteSpace: "nowrap" }}><b>{k}</b></td><td><Rich text={v} /></td></tr>)}</tbody></table></div></div>
        ))}</div>
      </Sec>
      <div className="grid g2">
        <Sec title="5 · When to use it"><ul style={{ margin: 0, paddingLeft: 18 }}>{l.whenUse.map((w, i) => <li key={i} style={{ marginBottom: 7 }}>{w.rule}<div className="small" style={{ fontFamily: "var(--display)" }}><Rich text={w.ex} /></div></li>)}</ul></Sec>
        <Sec title="6 · When NOT to use it"><ul style={{ margin: 0, paddingLeft: 18 }}>{l.whenNot.map((w, i) => <li key={i} style={{ marginBottom: 7 }}>{w.rule}<div className="small" style={{ fontFamily: "var(--display)" }}><Rich text={w.ex} /></div></li>)}</ul></Sec>
      </div>
      <Sec title={`7 · Contrast: ${l.contrast.a} vs ${l.contrast.b}`} id="contrast">
        <p className="small muted">Changing the structure changes the meaning. Read the last column: it is the real lesson.</p>
        <div className="table-wrap"><table className="t"><thead><tr><th>Situation</th><th>{l.contrast.a}</th><th>{l.contrast.b}</th><th>What changes</th></tr></thead><tbody>
          {l.contrast.rows.map((r, i) => <tr key={i}><td className="small"><b>{r.ctx}</b></td><td><Rich text={r.a} /></td><td><Rich text={r.b} /></td><td className="small"><Rich text={r.diff} /></td></tr>)}
        </tbody></table></div>
      </Sec>
      <Sec title="8 · Examples, from simple to IELTS">
        <div className="grid g2">
          <div className="stack"><span className="eyebrow">Simple (A1–B1)</span><ExList list={l.examples.a1} /></div>
          <div className="stack"><span className="eyebrow">Intermediate</span><ExList list={l.examples.b1} /></div>
          <div className="stack"><span className="eyebrow">Natural English</span><ExList list={l.examples.natural} /></div>
          <div className="stack"><span className="eyebrow">IELTS style</span><ExList list={l.examples.ielts} /></div>
        </div>
      </Sec>
      <Sec title="9 · Portuguese-speaker pitfalls (Armadilhas para falantes de português)">
        {l.pitfalls.map((p, i) => (
          <div key={i} className="feedback" style={{ marginTop: 0 }}>
            <div><span className="k">O que você diria em português</span> <i>{p.say}</i></div>
            <div><span className="k" style={{ color: "var(--bad)" }}>Wrong</span> {p.wrong}</div>
            <div><span className="k" style={{ color: "var(--good)" }}>Correct</span> <Rich text={p.right} /></div>
            <div className="small"><span className="k">Por quê</span> {p.pt}</div>
          </div>
        ))}
      </Sec>
      <Sec title="10 · Common errors: WRONG → CORRECT → WHY">
        {l.errors.map((e, i) => (
          <div key={i} className="feedback" style={{ marginTop: 0 }}>
            <div><span className="k" style={{ color: "var(--bad)" }}>Wrong</span> {e.wrong}</div>
            <div><span className="k" style={{ color: "var(--good)" }}>Correct</span> <Rich text={e.right} /></div>
            <div className="small"><span className="k">Why</span> {e.why}</div>
          </div>
        ))}
      </Sec>
      <Sec title="11 · In IELTS">
        <div className="grid g2">
          <div className="stack"><span className="eyebrow">Writing Task 1</span><ExList list={l.ielts.t1} /></div>
          <div className="stack"><span className="eyebrow">Writing Task 2</span><ExList list={l.ielts.t2} /></div>
          <div className="stack"><span className="eyebrow">Speaking</span><ExList list={l.ielts.speaking} /></div>
        </div>
        <p className="small"><b>Remember:</b> {l.ielts.tip}</p>
      </Sec>
      <div className="card row between">
        <span className="small muted">Next you will be asked to explain WHY, not to guess the answer.</span>
        <button className="btn primary" onClick={onRead}><Icon name="check" />I have read it — check my understanding</button>
      </div>
    </>
  );
}

/* ---------------- generic multiple choice block ---------------- */
interface McqResult { item: Mcq; pick: number; ok: boolean }
function McqBlock({ items, label, onDone, doneLabel, hideWhy }: { items: Mcq[]; label?: (it: Mcq, i: number) => string; onDone: (r: McqResult[]) => void | Promise<void>; doneLabel: string; hideWhy?: boolean }) {
  const [ans, setAns] = useState<Record<number, number>>({});
  const [chk, setChk] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const all = items.every((_, i) => chk[i]);
  return (
    <div className="card stack">
      {items.map((it, i) => {
        const c = chk[i]; const ok = ans[i] === it.a;
        return (
          <div key={it.id} className={"q" + (c ? (ok ? " ok" : " no") : "")}>
            <span className="qn">{i + 1}</span>
            <div style={{ minWidth: 0 }}>
              {label && <div className="tiny muted">{label(it, i)}</div>}
              <div style={{ fontFamily: "var(--display)", fontSize: "1.04rem" }}>{it.q}</div>
              <div className="opts">{it.opts.map((o, j) => (
                <label key={j} className={"opt" + (c ? (j === it.a ? " right" : ans[i] === j ? " wrong" : "") : ans[i] === j ? " sel" : "")}>
                  <input type="radio" style={{ display: "none" }} disabled={c} checked={ans[i] === j} onChange={() => setAns((a) => ({ ...a, [i]: j }))} />{o}
                </label>))}</div>
              {!c && <button className="btn sm" style={{ marginTop: 6 }} disabled={ans[i] == null} onClick={() => setChk((o) => ({ ...o, [i]: true }))}>Check</button>}
              {c && <div className="feedback"><div><b style={{ color: ok ? "var(--good)" : "var(--bad)" }}>{ok ? "Correct" : "Not quite"}</b></div>
                {!hideWhy && <div className="small"><span className="k">{ok ? "Because" : "Why"}</span> {it.why}</div>}
                {!hideWhy && it.natural && <div className="small"><span className="k">Natural</span> <i>{it.natural}</i></div>}</div>}
            </div>
          </div>
        );
      })}
      {all && <button className="btn primary" disabled={busy} onClick={async () => { setBusy(true); await onDone(items.map((it, i) => ({ item: it, pick: ans[i], ok: ans[i] === it.a }))); }}>{doneLabel}</button>}
    </div>
  );
}

const toItemResult = (l: Lesson, r: McqResult, qtype: string): ItemResult => ({
  qid: `g:${l.id}:${r.item.id}`, ok: r.ok, your: r.item.opts[r.pick] ?? "", correct: r.item.opts[r.item.a], prompt: r.item.q, qtype, tag: l.title,
  explanation: `${r.item.why}${r.item.natural ? " Natural: " + r.item.natural : ""}`, difficulty: qtype, skill: "G", ref: l.id,
});

/* ---------------- CHECK (understanding) ---------------- */
function Check({ l, onRetaught, onNext }: { l: Lesson; onRetaught: () => void; onNext: () => void }) {
  const [res, setRes] = useState<{ n: number; total: number } | null>(null);
  return (
    <>
      <div className="card"><h2>Do you understand WHY?</h2><p className="small muted">These questions are about the reasoning, not about spotting an answer. They do not create Error Bank entries: a wrong answer here means “explain it again”, not “you made a sentence error”.</p></div>
      <McqBlock items={l.understand} label={() => "Understanding"} doneLabel="Save my understanding score" onDone={async (r) => {
        const n = r.filter((x) => x.ok).length;
        await updateProgress(l.id, (p) => P.understand(p, n, r.length, Date.now()));
        setRes({ n, total: r.length }); toast(`Understanding: ${n}/${r.length}`);
      }} />
      {res && (res.n / res.total >= 0.7
        ? <div className="card stack"><b style={{ color: "var(--good)" }}>{res.n}/{res.total}: you understand the logic.</b><span className="small">Next: controlled practice.</span><button className="btn primary" onClick={onNext}>Go to practice</button></div>
        : <div className="card stack"><b style={{ color: "var(--bad)" }}>{res.n}/{res.total}: more exercises would not fix this yet.</b><span className="small">You need the explanation again, especially the contrast section. Read it, then repeat this check.</span><button className="btn primary" onClick={onRetaught}>Read the explanation again</button></div>)}
    </>
  );
}

/* ---------------- text answers with self-correction ---------------- */
function Feedback7({ l, item, txt, res }: { l: Lesson; item: TextItem; txt: string; res: SpecResult | null }) {
  const wrong = res?.hits.length ? res.hits.map((h) => h.why).join(" ") : "Your sentence does not have the form the task asks for." + (item.hint ? ` (${item.hint})` : " Compare it with the model below.");
  return (
    <div className="feedback">
      <div><span className="k">What you wrote</span> <span style={{ color: "var(--bad)" }}>{txt || "(blank)"}</span></div>
      <div><span className="k">What is wrong</span> {wrong}</div>
      <div><span className="k">Why</span> {item.why}</div>
      <div><span className="k">Rule that applies</span> {l.title} — see section “Contrast” in the lesson</div>
      <div><span className="k">More natural</span> <i style={{ color: "var(--good)" }}>{item.model}</i></div>
      <div><span className="k">Type of problem</span> Grammar ({catLabel(l.cat)}), not vocabulary or spelling</div>
    </div>
  );
}

function TextBlock({ l, item, task, onFirst, neutral }: { l: Lesson; item: TextItem; task: string; onFirst?: (ok: boolean) => void; neutral?: boolean }) {
  const [txt, setTxt] = useState("");
  const [phase, setPhase] = useState<"write" | "fix" | "done" | "shown">("write");
  const [first, setFirst] = useState<boolean | null>(null);
  const [tries, setTries] = useState(0);
  const [res, setRes] = useState<SpecResult | null>(null);
  const [short, setShort] = useState(false);
  const t0 = useRef(Date.now());
  const locked = phase === "done" || phase === "shown";
  const check = async () => {
    const r = evalSpec(txt, item.spec); setRes(r); setShort(r.verdict === "unsure");
    if (r.verdict === "unsure") return;
    const ms = Date.now() - t0.current;
    if (phase === "write") {
      const ok = r.verdict === "ok"; setFirst(ok); onFirst?.(ok);
      await recordTextAnswer(l.id, ok ? 2 : 0, ms, { a: txt.slice(0, 140), b: item.model }, task);
      setPhase(ok ? "done" : "fix");
    } else if (phase === "fix") {
      if (r.verdict === "ok") { await recordTextAnswer(l.id, 1, ms, { a: txt, b: item.model }, task + "-corrected"); setPhase("done"); }
      else { const n = tries + 1; setTries(n); if (n >= 2) setPhase("shown"); }
    }
  };
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: "1.04rem" }}>{item.q}</div>
      {item.hint && !neutral && phase === "write" && <div className="tiny muted">Hint: {item.hint}</div>}
      <textarea rows={2} value={txt} disabled={locked} onChange={(e) => setTxt(e.target.value)} placeholder="Type your sentence…" aria-label="Your answer" />
      {short && <div className="small" style={{ color: "var(--warn)" }}>Write a complete sentence first (at least two words).</div>}
      {!locked && <div className="row"><button className="btn sm primary" disabled={!txt.trim()} onClick={check}>{phase === "fix" ? "Check my correction" : "Check"}</button>
        {phase === "fix" && <button className="btn sm ghost" onClick={() => setPhase("shown")}>Show the answer</button>}</div>}
      {phase === "fix" && (
        <div className="feedback"><div><b style={{ color: "var(--bad)" }}>Not yet.</b> You try first: what needs to change?</div>
          {res?.hits.map((h, i) => <div key={i} className="small"><span className="k">Clue</span> {h.why}</div>)}
          {!res?.hits.length && <div className="small"><span className="k">Clue</span> {item.hint || "Compare your sentence with the rule in the lesson."}</div>}
          <div className="tiny muted">Edit your sentence above and check again. The correct version stays hidden until you try{tries ? ` (attempt ${tries + 1})` : ""}.</div></div>
      )}
      {phase === "done" && (
        <div className="feedback"><div><b style={{ color: "var(--good)" }}>{first ? "Correct." : "Corrected by yourself ✓"}</b></div>
          <div className="small"><span className="k">Why</span> {item.why}</div>
          <div className="small"><span className="k">Model</span> <i>{item.model}</i></div>
          <div className="tiny muted">The automatic check is rule-based. Compare your sentence with the model to be sure it says the same thing.</div></div>
      )}
      {phase === "shown" && <Feedback7 l={l} item={item} txt={txt} res={res} />}
    </div>
  );
}

/* ---------------- PRACTISE ---------------- */
function Practise({ l, goProduce }: { l: Lesson; goProduce: () => void }) {
  const [saved, setSaved] = useState(false);
  const [tdone, setTdone] = useState(0);
  const items = l.practice;
  return (
    <>
      <div className="card"><h2>Controlled practice</h2><p className="small muted">Part A recognises and chooses the right form (the explanation appears after each answer). Part B changes sentences yourself. If you get one wrong you will be asked to fix it before seeing the answer.</p></div>
      <h3 style={{ margin: "4px 0" }}>Part A · Recognise and choose</h3>
      <McqBlock items={items} label={(it) => (it as any).stage === "recognise" ? "Recognise the correct sentence" : "Controlled choice"} doneLabel={saved ? "Saved" : "Save results"} onDone={async (r) => {
        if (saved) return;
        const byType: Record<string, [number, number]> = { [l.title]: [r.filter((x) => x.ok).length, r.length] };
        await recordAttempt({ ts: Date.now(), skill: "G", kind: "practice", ref: l.id, title: `Lesson: ${l.title}`, correct: r.filter((x) => x.ok).length, total: r.length, band: null, secs: 0, byType, tags: {} }, r.map((x) => toItemResult(l, x, "Lesson practice")));
        await updateProgress(l.id, (p) => r.reduce((acc, x) => P.recog(acc, x.ok, Date.now()), p));
        setSaved(true); toast(`Saved: ${r.filter((x) => x.ok).length}/${r.length}`);
      }} />
      <h3 style={{ margin: "10px 0 4px" }}>Part B · Transform sentences</h3>
      <div className="card stack">
        {l.transform.map((it, i) => (
          <div key={it.id} className={"q"}><span className="qn">{i + 1}</span>
            <TextBlock l={l} item={it} task="lesson-transform" onFirst={async (ok) => { await updateProgress(l.id, (p) => P.produced(p, ok, Date.now())); setTdone((n) => n + 1); }} /></div>
        ))}
      </div>
      <div className="card row between"><span className="small muted">{tdone}/{l.transform.length} transformations attempted</span><button className="btn primary" onClick={goProduce}>Next: write your own sentences</button></div>
    </>
  );
}

/* ---------------- PRODUCE ---------------- */
function Produce({ l, goWrite }: { l: Lesson; goWrite: () => void }) {
  const [done, setDone] = useState(0);
  return (
    <>
      <div className="card"><h2>Your own sentences</h2><p className="small muted">First with a hint, then without. Free production is what moves you from stage A–B to stage C (Produce). If a sentence is wrong, fix it yourself before the answer is shown.</p></div>
      <div className="card stack">
        {l.produce.map((it, i) => (
          <div key={it.id} className="q"><span className="qn">{i + 1}</span>
            <div style={{ minWidth: 0 }}><div className="tiny muted">{it.stage === "guided" ? "Guided production" : "Free production"}</div>
              <TextBlock l={l} item={it} task="lesson-produce" neutral={it.stage === "produce"} onFirst={async (ok) => { await updateProgress(l.id, (p) => P.produced(p, ok, Date.now())); setDone((n) => n + 1); }} /></div></div>
        ))}
      </div>
      <div className="card row between"><span className="small muted">{done}/{l.produce.length} sentences attempted</span><button className="btn primary" onClick={goWrite}>Next: use it in a paragraph</button></div>
    </>
  );
}

/* ---------------- WRITE (application) ---------------- */
interface Hit { why: string; match: string }
function applyCheck(l: Lesson, text: string) {
  const words = (text.match(/[A-Za-z0-9'’-]+/g) || []).length;
  const uses = l.apply.mustUse.map((u) => ({ label: u.label, min: u.min, n: (text.match(new RegExp(u.re, "gi")) || []).length }));
  const hits: Hit[] = [];
  const seen = new Set<string>();
  const add = (why: string, match: string) => { const k = match.trim().toLowerCase(); if (seen.has(k)) return; seen.add(k); hits.push({ why, match: match.trim() }); };
  for (const m of l.apply.mustNot) for (const x of text.match(new RegExp(m.re, "gi")) || []) add(m.why, x);
  for (const i of analyseWriting(text, 2).issues) if (i.concept === l.id) add(i.text.replace(/ Found: ".*$/, ""), i.match || "");
  const usedAll = uses.every((u) => u.n >= u.min);
  const lenOk = words >= Math.floor(l.apply.min * 0.9) && words <= Math.ceil(l.apply.max * 1.15);
  return { words, uses, hits, usedAll, lenOk, clean: hits.length === 0 && usedAll && lenOk };
}

function Apply({ l, goTest }: { l: Lesson; goTest: () => void }) {
  const [txt, setTxt] = useState("");
  const [rep, setRep] = useState<ReturnType<typeof applyCheck> | null>(null);
  const [firstDone, setFirstDone] = useState(false);
  const [corrected, setCorrected] = useState(false);
  const words = (txt.match(/[A-Za-z0-9'’-]+/g) || []).length;
  const check = async () => {
    const r = applyCheck(l, txt);
    if (r.words < Math.floor(l.apply.min * 0.8)) { toast(`Write at least about ${l.apply.min} words (you have ${r.words}).`); return; }
    setRep(r);
    if (!firstDone) {
      setFirstDone(true);
      await updateProgress(l.id, (p) => P.applied(p, r.clean, r.usedAll, Date.now()));
      await recordApplyErrors(l.id, l.title, r.hits.map((h) => ({ original: h.match, correction: "(see the lesson)", explanation: h.why })));
      await reviewSkillItem("g:" + l.id, "prod", r.clean ? 2 : 0, { task: "lesson-apply", cat: l.cat, label: l.id, noError: true, concept: l.id });
    } else if (r.clean && !corrected) {
      setCorrected(true);
      await reviewSkillItem("g:" + l.id, "prod", 1, { task: "lesson-apply-corrected", cat: l.cat, label: l.id, noError: true, concept: l.id });
    }
  };
  return (
    <>
      <div className="card stack"><h2>Use it in a paragraph</h2><p><Rich text={l.apply.prompt} /></p>
        <div className="small muted">Required: {l.apply.mustUse.map((u) => `${u.label} ×${u.min}`).join(" · ")}</div></div>
      <div className="card stack">
        <textarea rows={11} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Write your paragraph here…" aria-label="Your paragraph" />
        <div className="row between"><span className={"small " + (words >= l.apply.min && words <= l.apply.max ? "" : "muted")}>{words} words (target {l.apply.min}–{l.apply.max})</span>
          <button className="btn primary" disabled={!txt.trim()} onClick={check}>{firstDone ? "Check again" : "Check my paragraph"}</button></div>
      </div>
      {rep && (
        <div className="card stack">
          <h3>Structure checklist</h3>
          {rep.uses.map((u, i) => <div key={i} className="small">{u.n >= u.min ? <span style={{ color: "var(--good)" }}>✓</span> : <span style={{ color: "var(--bad)" }}>✗</span>} {u.label}: found {u.n} (need {u.min})</div>)}
          <div className="small">{rep.lenOk ? <span style={{ color: "var(--good)" }}>✓</span> : <span style={{ color: "var(--bad)" }}>✗</span>} Length {rep.words} words (target {l.apply.min}–{l.apply.max})</div>
          {rep.hits.length > 0 ? (
            <div className="feedback"><div><b style={{ color: "var(--bad)" }}>Check these {rep.hits.length} point{rep.hits.length > 1 ? "s" : ""} yourself.</b></div>
              {rep.hits.map((h, i) => <div key={i} className="small"><span className="k">“{h.match}”</span> {h.why}</div>)}
              <div className="tiny muted">I will not rewrite it for you. Fix the sentences above and press “Check again”. The checks are rule-based hints and can be wrong: if a flag does not apply to your sentence, explain to yourself why it is correct.</div></div>
          ) : rep.usedAll && rep.lenOk
            ? <div className="feedback"><b style={{ color: "var(--good)" }}>{corrected ? "Corrected by yourself ✓" : "Clean paragraph ✓"}</b><span className="small">No known errors on this concept were found, and you used the required structures. The Error Bank has recorded your result.</span></div>
            : <div className="feedback"><b style={{ color: "var(--warn)" }}>Almost: complete the checklist above.</b></div>}
          <div className="row"><button className="btn primary" onClick={goTest}>Next: transfer test</button></div>
        </div>
      )}
    </>
  );
}

/* ---------------- TEST (transfer; topic not named) ---------------- */
type TItem = Mcq | (TextItem & { opts?: undefined });
const isText = (t: TItem): t is TextItem & { opts?: undefined } => !("opts" in t) || !(t as any).opts;

function Transfer({ l }: { l: Lesson }) { return <TransferRun l={l} items={l.transfer as TItem[]} retest={false} />; }

export function TransferRun({ l, items, retest }: { l: Lesson; items: TItem[]; retest: boolean }) {
  const [textRes, setTextRes] = useState<Record<string, boolean>>({});
  const [mcq, setMcq] = useState<McqResult[] | null>(null);
  const [final, setFinal] = useState<{ n: number; total: number } | null>(null);
  const mcqItems = items.filter((x): x is Mcq => !isText(x));
  const textItems = items.filter(isText);
  const textDone = Object.keys(textRes).length === textItems.length;
  const finish = async (m: McqResult[]) => {
    if (final) return;
    const n = m.filter((x) => x.ok).length + Object.values(textRes).filter(Boolean).length; const total = mcqItems.length + textItems.length;
    if (m.length) await recordAttempt({ ts: Date.now(), skill: "G", kind: "practice", ref: l.id, title: `Transfer: ${l.title}`, correct: m.filter((x) => x.ok).length, total: m.length, band: null, secs: 0, byType: { [l.title]: [m.filter((x) => x.ok).length, m.length] }, tags: {} }, m.map((x) => toItemResult(l, x, "Transfer test")));
    await updateProgress(l.id, (p) => P.transfer(p, n, total, Date.now()));
    if (retest) await reviewSkillItem("g:" + l.id, "prod", n / total >= 0.8 ? 2 : n / total >= 0.6 ? 1 : 0, { task: "lesson-retest", cat: l.cat, label: l.id, noError: true, concept: l.id });
    setFinal({ n, total });
  };
  return (
    <>
      <div className="card"><h2>{retest ? "Quick check" : "Transfer test"}</h2>
        <p className="small muted">{retest ? "Some sentences from earlier work come back in new situations. Nothing tells you which grammar point is tested." : "Support is reduced: the questions do NOT name the grammar point. Decide the structure yourself, as you would in an essay or in the Speaking test."}</p></div>
      {textItems.length > 0 && (
        <div className="card stack"><h3>Write your answer</h3>
          {textItems.map((it, i) => <div key={it.id} className="q"><span className="qn">{i + 1}</span><TextBlock l={l} item={it} task={retest ? "lesson-retest" : "lesson-transfer"} neutral onFirst={(ok) => setTextRes((r) => ({ ...r, [it.id]: ok }))} /></div>)}</div>
      )}
      {mcqItems.length > 0 && <McqBlock items={mcqItems} label={() => "Choose"} doneLabel="Lock my choices" onDone={(m) => { setMcq(m); }} />}
      {(mcq || !mcqItems.length) && textDone && !final && <div className="card"><button className="btn primary" onClick={() => finish(mcq || [])}>Save my test</button></div>}
      {(mcq || !mcqItems.length) && !textDone && !final && <div className="card small muted">Finish the written answers above, then save the test.</div>}
      {final && (
        <div className="card stack">
          <b style={{ color: final.n / final.total >= 0.7 ? "var(--good)" : "var(--bad)" }}>{final.n}/{final.total}</b>
          <Bar value={final.n / final.total} color={final.n / final.total >= 0.7 ? "var(--good)" : "var(--warn)"} />
          <span className="small">{retest ? `This was “${l.title}”. ` : ""}{final.n / final.total >= 0.7 ? "Good transfer: you chose the structure without being told the topic. Stage D also needs a clean paragraph and no recent writing errors." : "You did not carry the rule over yet. Go back to the explanation (contrast section) before more practice."}</span>
          <div className="row"><a className="btn" href={`#/grammar/lesson/${l.id}`}>Open the lesson</a><a className="btn" href="#/grammar">Back to Grammar</a></div>
        </div>
      )}
    </>
  );
}

/* ---------------- RETEST page (neutral title) ---------------- */
export function RetestPage({ id }: { id: string }) {
  usePacksVersion();
  const l = getContent().lessons.find((x) => x.id === id);
  const items = useMemo(() => {
    if (!l) return [];
    const extra = shuffle(l.practice.filter((p) => p.stage === "choice")).slice(0, 3);
    return shuffle([...(l.transfer as TItem[]), ...extra]) as TItem[];
  }, [id]);
  if (!l) return <Empty>Lesson not found. <a href="#/grammar">Back</a></Empty>;
  return <><div className="page-head"><div><a className="small" href="#/grammar">← Grammar</a><h1>Quick check</h1><p className="sub">Spaced retrieval: new situations, no topic name.</p></div></div><TransferRun l={l} items={items} retest /></>;
}
