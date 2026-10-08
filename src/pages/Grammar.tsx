import React, { useMemo, useState } from "react";
import { recordAttempt, useStore, type ItemResult } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import { grammarAccuracy } from "../lib/stats";
import { shuffle } from "../lib/util";
import { AiLabel, Bar, Empty, Icon, toast, useStopwatch } from "../ui/components";
import { LessonPage, MasteryChips, RetestPage } from "./Lesson";
import { conceptEvidence, lessonMode, masteryOf } from "../lib/lessons";

export function GrammarPage({ parts }: { parts: string[] }) {
  usePacksVersion();
  const topics = getContent().grammar;
  if (!topics.length) return <Empty>The Grammar Pack is not on this device. <a href="#/library">Download it</a>.</Empty>;
  if (parts[0] === "mixed") return <Mixed />;
  if (parts[0] === "lesson" && parts[1]) return <LessonPage id={parts[1]} />;
  if (parts[0] === "retest" && parts[1]) return <RetestPage id={parts[1]} />;
  if (parts[0]) {
    const t = topics.find((x: any) => x.id === parts[0]);
    if (!t) return <Empty>Topic not found. <a href="#/grammar">Back</a></Empty>;
    return <Topic t={t} />;
  }
  return <GrammarHome />;
}

function GrammarHome() {
  const s = useStore();
  const topics = getContent().grammar;
  const acc = grammarAccuracy(s).byTopic;
  return (
    <>
      <div className="page-head"><div><h1>Grammar</h1><p className="sub">Lessons, examples and progressive exercises for Band 7+. Each answer explains why the wrong options are wrong and shows a more natural way to write it.</p><div style={{ marginTop: 6 }}><AiLabel /></div></div>
        <div className="row"><a className="btn primary" href="#/grammar/mixed"><Icon name="refresh" />Mixed practice (weak topics first)</a><a className="btn" href="#/ai/generate/grammar"><Icon name="ai" />More via Claude</a></div></div>
      <LessonCards />
      <h2 style={{ marginTop: 18 }}>Train me · topics and exercises</h2>
      <div className="grid g-auto">
        {topics.map((t: any) => {
          const a = acc[t.title];
          const pct = a ? a[0] / a[1] : null;
          return (
            <a key={t.id} className="card stack" href={`#/grammar/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="row between"><h3>{t.title}</h3>{t.generated ? <AiLabel /> : pct != null && <span className={"chip " + (pct >= 0.8 ? "good" : pct >= 0.6 ? "warn" : "bad")}>{Math.round(pct * 100)}%</span>}</div>
              <span className="small muted">{t.summary}</span>
              <Bar value={pct ?? 0} color={pct == null ? undefined : pct >= 0.8 ? "var(--good)" : pct >= 0.6 ? "var(--warn)" : "var(--bad)"} />
              <span className="tiny muted">{a ? `${a[0]}/${a[1]} correct` : `${t.ex.length} exercises · not started`}</span>
            </a>
          );
        })}
      </div>
    </>
  );
}

const TOPIC_LESSONS: Record<string, string[]> = { tenses: ["present-simple-vs-continuous", "past-simple-vs-present-perfect"], "present-perfect": ["past-simple-vs-present-perfect"], articles: ["articles"] };

/** TEACH ME: explanatory lessons (prototype: 3). Each card shows the four mastery stages and what kind of help is needed now. */
function LessonCards() {
  const s = useStore();
  const lessons = getContent().lessons;
  const now = Date.now();
  if (!lessons.length) return <div className="card small muted">Explanatory lessons are not on this device yet: open the <a href="#/library">Offline Library</a> and update the Grammar Pack.</div>;
  return (
    <div className="stack">
      <div className="row between"><h2>Teach me · explanatory lessons</h2><span className="tiny muted">Prototype: 3 lessons. Explain → check → practise → produce → write → test.</span></div>
      <div className="grid g-auto">
        {lessons.map((l) => {
          const p = s.kv.lessonProgress?.[l.id];
          const ev = conceptEvidence(s.errors[l.cat], l.id, now);
          const a = s.skillItems["g:" + l.id]?.prod;
          const mode = lessonMode(p, ev, !!a && a.seen > 0 && a.due <= new Date().toISOString().slice(0, 10), now);
          const m = masteryOf(p, ev);
          return (
            <a key={l.id} className="card stack" href={`#/grammar/lesson/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="row between"><h3>{l.title}</h3><span className="chip accent">{mode.label}</span></div>
              <MasteryChips m={m} />
              <span className="small muted">{mode.why}</span>
              <span className="tiny muted">{l.minutes} min · {l.level}{ev.recent ? ` · ${ev.recent} error${ev.recent > 1 ? "s" : ""} in 14 days` : ""}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Exercises({ list, title, refId }: { list: { t: any; e: any; i: number }[]; title: string; refId: string }) {
  const [ans, setAns] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState(false);
  const secs = useStopwatch(!saved);
  const all = Object.keys(checked).length === list.length;
  const save = async () => {
    setSaved(true);
    const byType: Record<string, [number, number]> = {};
    const items: ItemResult[] = list.map((x, k) => {
      const ok = ans[k] === x.e.a;
      const b = byType[x.t.title] || [0, 0]; byType[x.t.title] = [b[0] + (ok ? 1 : 0), b[1] + 1];
      return { qid: `g:${x.t.id}:${x.i}`, ok, your: ans[k] != null ? x.e.opts[ans[k]] : "", correct: x.e.opts[x.e.a], prompt: x.e.q, qtype: x.t.title, tag: x.t.title, explanation: `${x.e.why} Natural: ${x.e.natural}`, difficulty: `Level ${x.e.lvl}`, skill: "G", ref: x.t.id };
    });
    const correct = items.filter((i) => i.ok).length;
    await recordAttempt({ ts: Date.now(), skill: "G", kind: "practice", ref: refId, title, correct, total: items.length, band: null, secs: Math.round(secs), byType, tags: {} }, items);
    toast(`Saved: ${correct}/${items.length}`);
  };
  return (
    <div className="card stack">
      {list.map((x, k) => {
        const c = checked[k];
        const ok = ans[k] === x.e.a;
        return (
          <div key={k} className={"q" + (c ? (ok ? " ok" : " no") : "")}>
            <span className="qn">{k + 1}</span>
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}><span className="tiny muted">{x.t.title} · level {x.e.lvl}</span></div>
              <div style={{ fontFamily: "var(--display)", fontSize: "1.04rem" }}>{x.e.q}</div>
              <div className="opts">{x.e.opts.map((o: string, j: number) => (
                <label key={j} className={"opt" + (c ? (j === x.e.a ? " right" : ans[k] === j ? " wrong" : "") : ans[k] === j ? " sel" : "")}>
                  <input type="radio" style={{ display: "none" }} disabled={c} checked={ans[k] === j} onChange={() => setAns((a) => ({ ...a, [k]: j }))} />{o}
                </label>))}</div>
              {!c && <button className="btn sm" style={{ marginTop: 6 }} disabled={ans[k] == null} onClick={() => setChecked((o) => ({ ...o, [k]: true }))}>Check</button>}
              {c && <div className="feedback"><div><b style={{ color: ok ? "var(--good)" : "var(--bad)" }}>{ok ? "Correct" : "Wrong"}</b></div>
                {!ok && <div><span className="k">Why is it wrong?</span> {x.e.why}</div>}
                {ok && <div className="small">{x.e.why}</div>}
                <div><span className="k">More natural</span> <i>{x.e.natural}</i></div></div>}
            </div>
          </div>
        );
      })}
      {all && !saved && <button className="btn primary" onClick={save}>Save results</button>}
      {saved && <a className="btn" href="#/grammar">Back to Grammar</a>}
    </div>
  );
}

function Topic({ t }: { t: any }) {
  const list = useMemo(() => t.ex.map((e: any, i: number) => ({ t, e, i })).sort((a: any, b: any) => a.e.lvl - b.e.lvl), [t.id]);
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/grammar">← Grammar</a><h1>{t.title}</h1><p className="sub">{t.summary}</p></div>{t.generated && <AiLabel />}</div>
      {(TOPIC_LESSONS[t.id] || []).length > 0 && (
        <div className="card row between" style={{ borderColor: "var(--accent)" }}>
          <span className="small"><b>Want to understand WHY, not only memorise?</b> This topic has a full explanatory lesson.</span>
          <span className="row">{(TOPIC_LESSONS[t.id] || []).map((id) => <a key={id} className="btn sm primary" href={`#/grammar/lesson/${id}`}>{getContent().lessons.find((x) => x.id === id)?.title || id}</a>)}</span>
        </div>
      )}
      <div className="grid g2">
        <div className="card stack"><h2>Lesson</h2><ul style={{ margin: 0, paddingLeft: 18 }}>{t.rules.map((r: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{r}</li>)}</ul></div>
        <div className="card stack"><h2>Examples</h2>{t.examples.map((e: string, i: number) => <p key={i} style={{ fontFamily: "var(--display)", fontSize: "1.05rem" }}>“{e}”</p>)}</div>
      </div>
      <h2>Exercises (progressive)</h2>
      <Exercises list={list} title={`Grammar: ${t.title}`} refId={t.id} />
    </>
  );
}

function Mixed() {
  const s = useStore();
  const topics = getContent().grammar;
  const list = useMemo(() => {
    const acc = grammarAccuracy(s).byTopic;
    const scored = topics.map((t: any) => ({ t, w: acc[t.title] ? 1 - acc[t.title][0] / acc[t.title][1] + 0.2 : 0.8 })).sort((a: any, b: any) => b.w - a.w);
    const out: any[] = [];
    for (const { t } of scored.slice(0, 5)) {
      const ex = shuffle(t.ex.map((e: any, i: number) => ({ e, i }))).filter(({ i }: any) => !(s.itemStats[`g:${t.id}:${i}`]?.lastOk && s.itemStats[`g:${t.id}:${i}`]?.c >= 2)).slice(0, 2);
      ex.forEach(({ e, i }: any) => out.push({ t, e, i }));
    }
    return shuffle(out).slice(0, 10);
  }, []);
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/grammar">← Grammar</a><h1>Mixed practice</h1><p className="sub">Weak topics appear more often; items you have answered correctly twice are skipped.</p></div></div>
      {list.length ? <Exercises list={list} title="Grammar: mixed" refId="mixed" /> : <Empty>You have mastered every exercise on this device. Import more with Claude.</Empty>}
    </>
  );
}
