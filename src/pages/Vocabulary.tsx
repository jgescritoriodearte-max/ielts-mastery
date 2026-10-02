import React, { useMemo, useState } from "react";
import { recordAttempt, saveVocab, useStore, type ItemResult } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import { grade, isDue, repeatedlyMissed, status, type Grade } from "../lib/srs";
import { vocabCounts } from "../lib/stats";
import { normalize } from "../lib/scoring";
import { pick, shuffle } from "../lib/util";
import { go } from "../lib/pwa";
import { AiLabel, Bar, Empty, Icon, toast, useStopwatch } from "../ui/components";
import { speak } from "../lib/tts";

type W = { id: string; cat: string; w: string[]; custom?: boolean };
const MODES = [
  { v: "mc", label: "Multiple choice" }, { v: "blank", label: "Fill in the blanks" }, { v: "syn", label: "Synonyms" },
  { v: "ant", label: "Antonyms" }, { v: "coll", label: "Collocations" }, { v: "form", label: "Word formation" },
];

export function VocabularyPage({ parts }: { parts: string[] }) {
  usePacksVersion();
  if (parts[0] === "study") return <Flashcards scope={parts[1] || "due"} />;
  if (parts[0] === "quiz") return <Quiz mode={parts[1] || "mc"} cat={parts[2] || "All"} />;
  if (parts[0] === "cat") return <CategoryList cat={parts[1]} />;
  return <VocabHome />;
}

function VocabHome() {
  const s = useStore();
  const all = getContent().vocab;
  const vc = vocabCounts(s, all.map((v) => v.id));
  const cats = [...new Set(all.map((v) => v.cat))];
  const [qcat, setQcat] = useState("All");
  if (!all.length) return <Empty>The Vocabulary Pack is not on this device. <a href="#/library">Download it</a>.</Empty>;
  return (
    <>
      <div className="page-head"><div><h1>Vocabulary</h1><p className="sub">IELTS topic vocabulary with local spaced repetition: New → Learning → Review → Mastered. Review dates are calculated on the device.</p><div style={{ marginTop: 6 }}><AiLabel /></div></div>
        <a className="btn" href="#/ai/generate/vocabulary"><Icon name="ai" />More words via Claude</a></div>
      <div className="kpis">
        <div className="kpi"><div className="eyebrow">Due for review today</div><div className="v num">{vc.due}</div><a className="small" href="#/vocabulary/study/due">Review now →</a></div>
        <div className="kpi"><div className="eyebrow">New</div><div className="v num">{vc.New}</div><a className="small" href="#/vocabulary/study/new">Learn 10 →</a></div>
        <div className="kpi"><div className="eyebrow">Learning</div><div className="v num">{vc.Learning}</div></div>
        <div className="kpi"><div className="eyebrow">Review</div><div className="v num">{vc.Review}</div></div>
        <div className="kpi"><div className="eyebrow">Mastered</div><div className="v num">{vc.Mastered}</div></div>
        <div className="kpi"><div className="eyebrow">Repeatedly missed</div><div className="v num" style={{ color: vc.missed ? "var(--bad)" : undefined }}>{vc.missed}</div></div>
      </div>
      <div className="card stack">
        <div className="row between"><h2>Practice</h2><select value={qcat} onChange={(e) => setQcat(e.target.value)} style={{ width: "auto" }} aria-label="Category"><option>All</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="row"><a className="btn primary" href="#/vocabulary/study/due"><Icon name="vocab" />Flashcards: words due today</a>{MODES.map((m) => <a key={m.v} className="btn" href={`#/vocabulary/quiz/${m.v}/${encodeURIComponent(qcat)}`}>{m.label}</a>)}</div>
        <p className="small muted">Every answer updates the review schedule: correct answers push the next review further away; wrong answers bring the word back tomorrow.</p>
      </div>
      <div className="grid g-auto">
        {cats.map((c) => {
          const ws = all.filter((v) => v.cat === c);
          const learned = ws.filter((v) => status(s.vocab[v.id]) !== "New").length;
          const due = ws.filter((v) => isDue(s.vocab[v.id])).length;
          return (
            <div key={c} className="card stack">
              <div className="row between"><h3>{c}</h3>{ws.some((w) => w.custom) && <AiLabel />}</div>
              <Bar value={learned / ws.length} color="var(--V)" />
              <span className="small muted">{learned}/{ws.length} learned{due ? ` · ${due} due` : ""}</span>
              <div className="row"><a className="btn sm" href={`#/vocabulary/study/${encodeURIComponent(c)}`}>Study</a><a className="btn sm ghost" href={`#/vocabulary/cat/${encodeURIComponent(c)}`}>Word list</a></div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function CategoryList({ cat }: { cat: string }) {
  const s = useStore();
  const ws = getContent().vocab.filter((v) => v.cat === cat);
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/vocabulary">← Vocabulary</a><h1>{cat}</h1></div><a className="btn primary" href={`#/vocabulary/study/${encodeURIComponent(cat)}`}>Study this topic</a></div>
      <div className="card table-wrap"><table className="t"><thead><tr><th>Word</th><th>Meaning</th><th>Collocation</th><th>Status</th><th>Next review</th></tr></thead><tbody>
        {ws.map((v) => { const st = s.vocab[v.id]; return <tr key={v.id}><td><b>{v.w[0]}</b> <span className="muted small">{v.w[1]}</span><div className="tiny muted">{v.w[8]}</div></td><td className="small">{v.w[2]}</td><td className="small">{v.w[6]}</td><td><span className={"chip " + (status(st) === "Mastered" ? "good" : repeatedlyMissed(st) ? "bad" : "")}>{status(st)}</span></td><td className="num small">{st?.seen ? st.due : "–"}</td></tr>; })}
      </tbody></table></div>
    </>
  );
}

function pickWords(s: ReturnType<typeof useStore>, all: W[], scope: string, n: number): W[] {
  if (scope === "due") {
    const due = all.filter((v) => isDue(s.vocab[v.id])).sort((a, b) => (s.vocab[a.id].due < s.vocab[b.id].due ? -1 : 1));
    return due.slice(0, 30);
  }
  if (scope === "new") return all.filter((v) => !s.vocab[v.id]?.seen).slice(0, n);
  const inCat = all.filter((v) => v.cat === scope);
  const due = inCat.filter((v) => isDue(s.vocab[v.id]));
  const fresh = inCat.filter((v) => !s.vocab[v.id]?.seen);
  const rest = inCat.filter((v) => !due.includes(v) && !fresh.includes(v));
  return [...due, ...fresh, ...shuffle(rest)].slice(0, n);
}

function Flashcards({ scope }: { scope: string }) {
  const s = useStore();
  const all = getContent().vocab;
  const deck = useMemo(() => pickWords(s, all, scope, 10), [scope, all.length]);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [res, setRes] = useState<{ ok: number; n: number }>({ ok: 0, n: 0 });
  const secs = useStopwatch(i < deck.length);
  if (!deck.length) return <><div className="page-head"><div><a className="small" href="#/vocabulary">← Vocabulary</a><h1>Flashcards</h1></div></div><Empty>{scope === "due" ? "No words are due today. Learn new words or take a quiz." : "No words to study here."} <a href="#/vocabulary/study/new">Learn new words</a></Empty></>;
  const finish = async (final: { ok: number; n: number }) => {
    await recordAttempt({ ts: Date.now(), skill: "V", kind: "practice", ref: "flashcards", title: "Flashcards", correct: final.ok, total: final.n, band: null, secs: Math.round(secs), byType: { Flashcards: [final.ok, final.n] }, tags: {} }, []);
  };
  if (i >= deck.length) return (
    <><div className="page-head"><div><a className="small" href="#/vocabulary">← Vocabulary</a><h1>Session complete</h1></div></div>
      <div className="card stack"><p>You reviewed {res.n} words and knew {res.ok}. The next review dates have been scheduled on this device.</p><div className="row"><a className="btn primary" href="#/vocabulary">Back to Vocabulary</a><a className="btn" href="#/vocabulary/quiz/blank/All">Fill-in-the-blanks quiz</a></div></div></>
  );
  const v = deck[i];
  const [word, pos, def, ex, syn, ant, coll, fam, pt] = v.w;
  const rate = async (g: Grade) => {
    await saveVocab(grade(s.vocab[v.id], v.id, g));
    const next = { ok: res.ok + (g > 0 ? 1 : 0), n: res.n + 1 };
    setRes(next); setFlip(false);
    if (i + 1 >= deck.length) await finish(next);
    setI(i + 1);
  };
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/vocabulary">← Vocabulary</a><h1>Flashcards {scope === "due" ? "· due today" : scope === "new" ? "· new words" : "· " + scope}</h1></div><span className="chip">{i + 1}/{deck.length}</span></div>
      <div className="card raised flash" onClick={() => setFlip(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setFlip(true); }}>
        <span className="eyebrow">{v.cat} · {status(s.vocab[v.id])}</span>
        <span className="word">{word}</span><span className="muted">{pos}</span>
        {!flip ? <span className="small muted">Think of the meaning, then tap to reveal.</span> : (
          <div className="stack" style={{ maxWidth: 560 }}>
            <p><b>{def}</b></p><p style={{ fontFamily: "var(--display)" }}>“{ex}”</p>
            <p className="small">Synonym: <b>{syn || "–"}</b>{ant ? <> · Antonym: <b>{ant}</b></> : null} · Collocation: <b>{coll}</b></p>
            {fam && <p className="small muted">Word family: {fam}</p>}<p className="small muted">PT: {pt}</p>
          </div>
        )}
      </div>
      <div className="row"><button className="btn ghost sm" onClick={() => speak(word, s.settings.accent, 0.9)}><Icon name="play" />Pronounce</button></div>
      {flip && <div className="grade-row">
        <button className="btn danger" onClick={() => rate(0)}>Again</button><button className="btn" onClick={() => rate(1)}>Hard</button>
        <button className="btn primary" onClick={() => rate(2)}>Good</button><button className="btn" onClick={() => rate(3)}>Easy</button></div>}
    </>
  );
}

interface QQ { v: W; prompt: string; opts?: string[]; answer: string; accept?: string[]; }
function buildQuiz(mode: string, words: W[], pool: W[]): QQ[] {
  const qs: QQ[] = [];
  for (const v of words) {
    const [word, , def, ex, syn, ant, coll, fam] = v.w;
    const distract = (f: (x: W) => string) => shuffle(pool.filter((x) => x.id !== v.id && f(x)).map(f)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
    if (mode === "mc") qs.push({ v, prompt: `Which word means: “${def}”?`, opts: shuffle([word, ...distract((x) => x.w[0])]), answer: word });
    else if (mode === "blank") {
      const re = new RegExp(word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
      if (!re.test(ex)) continue;
      qs.push({ v, prompt: ex.replace(re, "______"), answer: word, accept: [word] });
    } else if (mode === "syn" && syn) qs.push({ v, prompt: `Choose a synonym of “${word}”.`, opts: shuffle([syn, ...distract((x) => x.w[4])]), answer: syn });
    else if (mode === "ant" && ant) qs.push({ v, prompt: `Choose the antonym of “${word}”.`, opts: shuffle([ant, ...distract((x) => x.w[5])]), answer: ant });
    else if (mode === "coll" && coll) {
      const re = new RegExp(word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
      if (re.test(coll)) qs.push({ v, prompt: `Complete the collocation: “${coll.replace(re, "______")}”`, opts: shuffle([word, ...distract((x) => x.w[0])]), answer: word });
      else qs.push({ v, prompt: `Which collocation is natural with “${word}”?`, opts: shuffle([coll, ...distract((x) => x.w[6])]), answer: coll });
    } else if (mode === "form" && fam) {
      const forms = fam.split(";").map((f) => f.trim()).filter(Boolean).map((f) => { const m = f.match(/^(.+?)\s*\((.+)\)$/); return m ? { form: m[1].trim(), pos: m[2] } : null; }).filter(Boolean) as { form: string; pos: string }[];
      const f = forms.find((x) => x.form.toLowerCase() !== word.toLowerCase() && /^(n|v|adj|adv)/.test(x.pos));
      if (f) qs.push({ v, prompt: `Write the ${f.pos === "n" ? "noun" : f.pos === "v" ? "verb" : f.pos === "adj" ? "adjective" : f.pos === "adv" ? "adverb" : f.pos} form related to “${word}”.`, answer: f.form, accept: forms.filter((x) => x.pos === f.pos).map((x) => x.form) });
    }
  }
  return qs.slice(0, 10);
}

function Quiz({ mode, cat }: { mode: string; cat: string }) {
  const s = useStore();
  const all = getContent().vocab;
  const pool = cat === "All" ? all : all.filter((v) => v.cat === cat);
  const qs = useMemo(() => {
    const weighted = shuffle(pool).sort((a, b) => {
      const sa = s.vocab[a.id], sb = s.vocab[b.id];
      const wa = (isDue(sa) ? 3 : 0) + (repeatedlyMissed(sa) ? 3 : 0) + (status(sa) === "Mastered" ? -2 : 0) + Math.random();
      const wb = (isDue(sb) ? 3 : 0) + (repeatedlyMissed(sb) ? 3 : 0) + (status(sb) === "Mastered" ? -2 : 0) + Math.random();
      return wb - wa;
    });
    return buildQuiz(mode, weighted, all);
  }, [mode, cat]);
  const [ans, setAns] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const secs = useStopwatch(!done);
  const label = MODES.find((m) => m.v === mode)?.label || mode;
  const ok = (q: QQ, a: string) => !!a && (normalize(a) === normalize(q.answer) || (q.accept || []).some((x) => normalize(x) === normalize(a)));
  const submit = async () => {
    setDone(true);
    const items: ItemResult[] = [];
    let correct = 0;
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i], good = ok(q, ans[i] || "");
      if (good) correct++;
      await saveVocab(grade(getStateVocab(q.v.id), q.v.id, good ? 2 : 0));
      items.push({ qid: `v:${mode}:${q.v.id}`, ok: good, your: ans[i] || "", correct: q.answer, prompt: q.prompt, qtype: label, tag: q.v.cat, explanation: `${q.v.w[0]} (${q.v.w[1]}): ${q.v.w[2]}. Example: ${q.v.w[3]}`, difficulty: "Vocabulary", skill: "V", ref: q.v.id });
    }
    await recordAttempt({ ts: Date.now(), skill: "V", kind: "practice", ref: "quiz-" + mode, title: `Vocabulary: ${label}`, correct, total: qs.length, band: null, secs: Math.round(secs), byType: { [label]: [correct, qs.length] }, tags: {}, category: cat }, items);
    toast(`${correct}/${qs.length} correct — schedule updated.`);
  };
  const getStateVocab = (id: string) => s.vocab[id];
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/vocabulary">← Vocabulary</a><h1>{label}</h1><p className="sub">{cat === "All" ? "All topics" : cat} · words due or often missed come first.</p></div>
        <select value={mode} onChange={(e) => go(`/vocabulary/quiz/${e.target.value}/${encodeURIComponent(cat)}`)} style={{ width: "auto" }}>{MODES.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}</select></div>
      {!qs.length ? <Empty>Not enough words for this exercise in this topic.</Empty> : (
        <div className="card stack">
          {qs.map((q, i) => {
            const good = done ? ok(q, ans[i] || "") : null;
            return (
              <div key={i} className={"q" + (done ? (good ? " ok" : " no") : "")}>
                <span className="qn">{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div>{q.prompt}</div>
                  {q.opts ? <div className="opts">{q.opts.map((o) => <label key={o} className={"opt" + (done ? (o === q.answer ? " right" : ans[i] === o ? " wrong" : "") : ans[i] === o ? " sel" : "")}><input type="radio" style={{ display: "none" }} disabled={done} checked={ans[i] === o} onChange={() => setAns((a) => { const n = a.slice(); n[i] = o; return n; })} />{o}</label>)}</div>
                    : <input type="text" className="gap-input" value={ans[i] || ""} disabled={done} onChange={(e) => setAns((a) => { const n = a.slice(); n[i] = e.target.value; return n; })} />}
                  {done && <div className="feedback"><div><span className="k">Answer</span> <b>{q.answer}</b></div><div className="small">{q.v.w[0]}: {q.v.w[2]} — “{q.v.w[3]}”</div></div>}
                </div>
              </div>
            );
          })}
          {!done ? <button className="btn primary lg" onClick={submit}>Check answers</button> : <div className="row"><a className="btn primary" href="#/vocabulary">Done</a><button className="btn" onClick={() => location.reload()}>New quiz</button></div>}
        </div>
      )}
    </>
  );
}

export { pick };
