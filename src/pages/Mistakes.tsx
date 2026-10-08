import { learnTarget } from "../lib/concepts";
import React, { useMemo, useState } from "react";
import { recordAttempt, setMistakeCategory, setMistakeResolved, useStore, type ItemResult } from "../lib/store";
import { catLabel, LISTENING_CAUSES } from "../lib/taxonomy";
import { mistakeDue } from "../lib/errorbank";
import { findSet, getContent, usePacksVersion } from "../lib/packs";
import type { Mistake } from "../lib/types";
import { SKILL_NAME } from "../lib/types";
import { checkGap, choicesFor, flatten, isChoice, normalize, TAG_LABEL } from "../lib/scoring";
import { speak } from "../lib/tts";
import { fmtDate, shuffle } from "../lib/util";
import { Empty, HBars, Icon, toast, useStopwatch } from "../ui/components";

const SK = ["All", "R", "L", "W", "G", "V", "S"];

export function MistakesPage({ parts, query }: { parts: string[]; query?: URLSearchParams }) {
  usePacksVersion();
  if (parts[0] === "practice") return <PracticeMistakes cat={query?.get("cat") || ""} />;
  return <MistakesHome />;
}

function MistakesHome() {
  const s = useStore();
  const [skill, setSkill] = useState("All");
  const [show, setShow] = useState<"open" | "resolved" | "all">("open");
  const open = s.mistakes.filter((m) => !m.resolved);
  const bySkill: Record<string, number> = {};
  open.forEach((m) => (bySkill[m.skill] = (bySkill[m.skill] || 0) + 1));
  const groups: Record<string, Record<string, number>> = {};
  for (const m of open) {
    const k = m.skill === "L" ? (TAG_LABEL[m.tag] || m.tag || m.qtype) : m.skill === "R" ? m.qtype : m.skill === "W" ? m.tag || m.qtype : m.qtype;
    groups[m.skill] = groups[m.skill] || {};
    groups[m.skill][k] = (groups[m.skill][k] || 0) + 1;
  }
  const list = s.mistakes.filter((m) => (skill === "All" || m.skill === skill) && (show === "all" || (show === "open" ? !m.resolved : m.resolved)));
  return (
    <>
      <div className="page-head"><div><h1>My Mistakes</h1><p className="sub">Every wrong answer is recorded automatically. A mistake is resolved after you get it right twice in “Practice My Mistakes”.</p></div>
        <div className="row"><a className="btn" href="#/errors">Error Bank (by category)</a><a className={"btn primary" + (open.length ? "" : " disabled")} href="#/mistakes/practice"><Icon name="refresh" />Practice My Mistakes ({open.length})</a></div></div>
      <div className="kpis">{["R", "L", "W", "G", "V", "S"].map((k) => <div key={k} className="kpi"><div className="eyebrow">{SKILL_NAME[k as "R"]}</div><div className="v num">{bySkill[k] || 0}</div><div className="s">open errors</div></div>)}</div>
      <div className="grid g2">
        {["R", "L", "W", "G"].filter((k) => groups[k]).map((k) => (
          <div key={k} className="card"><div className="card-head"><h3>{SKILL_NAME[k as "R"]}</h3><span className="small muted">by error type</span></div>
            <HBars rows={Object.entries(groups[k]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => ({ label: t, value: n, color: "var(--bad)" }))} fmt={(v) => `${v} error${v > 1 ? "s" : ""}`} /></div>
        ))}
      </div>
      <div className="card stack">
        <div className="row between"><h2>Error log</h2>
          <div className="row"><select value={skill} onChange={(e) => setSkill(e.target.value)} style={{ width: "auto" }} aria-label="Skill">{SK.map((k) => <option key={k} value={k}>{k === "All" ? "All skills" : SKILL_NAME[k as "R"]}</option>)}</select>
            <select value={show} onChange={(e) => setShow(e.target.value as any)} style={{ width: "auto" }} aria-label="Status"><option value="open">Open</option><option value="resolved">Resolved</option><option value="all">All</option></select></div></div>
        {list.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Skill</th><th>Question</th><th>My answer</th><th>Correct</th><th>Error category</th><th>Difficulty</th><th /></tr></thead><tbody>
          {list.slice(0, 200).map((m) => <tr key={m.id}><td className="num small">{fmtDate(m.ts)}</td><td>{SKILL_NAME[m.skill]}</td><td className="small" style={{ maxWidth: 300 }}>{m.prompt}</td><td className="small" style={{ color: "var(--bad)" }}>{m.your}</td><td className="small" style={{ color: "var(--good)" }}>{m.correct}</td><td>{m.skill === "L" && !m.resolved
              ? <select value={m.cat || "ls.other"} onChange={(e) => setMistakeCategory(m.id, e.target.value)} aria-label="Why did I miss it?" style={{ width: "auto", maxWidth: 220 }}>{[...new Set([m.cat || "ls.other", ...LISTENING_CAUSES])].map((c) => <option key={c} value={c}>{catLabel(c).replace("Listening: ", "")}</option>)}</select>
              : <span className="chip">{m.cat ? catLabel(m.cat) : TAG_LABEL[m.tag] || m.tag || m.qtype}</span>}</td><td className="small">{m.difficulty}</td>
            <td><div className="row" style={{ gap: 6 }}>{(() => { const lid = learnTarget(m, getContent().lessons); return lid ? <a className="btn sm primary" href={`#/grammar/lesson/${lid}`}>Learn</a> : null; })()}<button className="btn sm ghost" onClick={() => setMistakeResolved(m.id, !m.resolved)}>{m.resolved ? "Reopen" : "Resolve"}</button></div></td></tr>)}
        </tbody></table></div> : <Empty>{show === "open" ? "No open mistakes. Keep practising!" : "Nothing here."}</Empty>}
      </div>
    </>
  );
}

/* ---------- Practice My Mistakes: rebuilds each original question ---------- */
interface PQ { m: Mistake; kind: "choice" | "gap" | "self"; prompt: string; context?: string; choices?: { key: string; label: string }[]; answer: string | string[]; limit?: number; audio?: string; }

function buildPQ(m: Mistake, vocab: any[], grammar: any[]): PQ | null {
  if (m.skill === "R" || m.skill === "L") {
    const set = findSet(m.ref);
    const f = set ? flatten(set).find((x) => x.qid === m.qid) : undefined;
    if (set && f) {
      let context = "";
      if (set.skill === "R" && f.item.ev) context = (set.paras || []).find(([, t]) => t.includes(f.item.ev!))?.[1] || "";
      const audio = set.skill === "L" && f.item.ev ? (set.lines || []).find(([, t]) => t.includes(f.item.ev!))?.[1] : undefined;
      return isChoice(f.group, f.item)
        ? { m, kind: "choice", prompt: `[${f.group.qtype}] ${f.item.q}`, context, audio, choices: choicesFor(f.group, f.item), answer: String(f.item.a) }
        : { m, kind: "gap", prompt: `[${f.group.qtype}] ${f.item.q}`, context, audio, answer: f.item.a, limit: f.group.limit };
    }
    if (m.ref.startsWith("drill-")) { const audio = (m.explanation.match(/Audio: "(.+)"/) || [])[1]; return { m, kind: "gap", prompt: m.prompt, audio, answer: [m.correct] }; }
    return null;
  }
  if (m.skill === "G") {
    const [, tid, i] = m.qid.split(":");
    const t = grammar.find((x) => x.id === tid); let e = t?.ex[Number(i)];
    if (!e) {   // a question from an explanatory lesson (qid g:<lessonId>:<itemId>)
      const li = getContent().lessons.find((x) => x.id === tid)?.practice.concat(getContent().lessons.find((x) => x.id === tid)?.transfer.filter((x: any) => x.opts) as any || []).find((x: any) => x.id === i);
      e = li ? { q: li.q, opts: li.opts, a: li.a } : undefined;
    }
    if (!e) return null;
    return { m, kind: "choice", prompt: e.q, choices: e.opts.map((o: string, j: number) => ({ key: String(j), label: o })), answer: String(e.a) };
  }
  if (m.skill === "V") {
    const v = vocab.find((x) => x.id === m.ref);
    if (!v) return null;
    const opts = shuffle([v.w[0], ...shuffle(vocab.filter((x) => x.id !== v.id)).slice(0, 3).map((x) => x.w[0])]);
    return { m, kind: "choice", prompt: `Which word means: “${v.w[2]}”?`, choices: opts.map((o) => ({ key: o, label: o })), answer: v.w[0] };
  }
  return { m, kind: "self", prompt: m.prompt, answer: m.correct };
}

function PracticeMistakes({ cat }: { cat: string }) {
  const s = useStore();
  const c = getContent();
  const qs = useMemo(() => {
    // Spaced re-check: mistakes that are due come first; an optional ?cat= focuses one Error Bank category.
    const open = s.mistakes.filter((m) => !m.resolved && (!cat || m.cat === cat)).sort((a, b) => Number(mistakeDue(b)) - Number(mistakeDue(a)) || a.reviewCount - b.reviewCount || b.ts - a.ts);
    return open.map((m) => buildPQ(m, c.vocab, c.grammar)).filter(Boolean).slice(0, 12) as PQ[];
  }, []);
  const [ans, setAns] = useState<Record<number, string>>({});
  const [selfOk, setSelfOk] = useState<Record<number, boolean>>({});
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);
  const secs = useStopwatch(!done);
  if (!qs.length) return <><div className="page-head"><div><a className="small" href="#/mistakes">← My Mistakes</a><h1>Practice My Mistakes</h1></div></div><Empty>No open mistakes to practise. Great work.</Empty></>;
  const isOk = (q: PQ, i: number) => q.kind === "self" ? !!selfOk[i] : q.kind === "choice" ? (ans[i] || "").toUpperCase() === String(q.answer).toUpperCase() : checkGap(ans[i] || "", q.answer, q.limit).ok;
  const finish = async () => {
    setDone(true);
    const items: ItemResult[] = qs.map((q, i) => ({ qid: q.m.qid, ok: isOk(q, i), your: ans[i] || (q.kind === "self" ? (selfOk[i] ? "(self: correct)" : "(self: wrong)") : ""), correct: Array.isArray(q.answer) ? q.answer[0] : q.answer, prompt: q.m.prompt, qtype: q.m.qtype, tag: q.m.tag, explanation: q.m.explanation, difficulty: q.m.difficulty, skill: q.m.skill, ref: q.m.ref, cat: q.m.cat, axis: q.kind === "choice" ? "rec" as const : "prod" as const }));
    const correct = items.filter((x) => x.ok).length;
    await recordAttempt({ ts: Date.now(), skill: "R", kind: "mistakes", ref: "mistakes", title: "Practice My Mistakes", correct, total: items.length, band: null, secs: Math.round(secs), byType: {}, tags: {} }, items);
    toast(`${correct}/${items.length} correct. Mistakes answered correctly twice are resolved.`);
  };
  return (
    <>
      <div className="page-head"><div><a className="small" href="#/mistakes">← My Mistakes</a><h1>Practice My Mistakes{cat ? ` · ${catLabel(cat)}` : ""}</h1><p className="sub">{qs.length} questions rebuilt from your previous errors. Get each one right twice to resolve it. Correct answers come back after 1, 3 and 7 days.</p></div></div>
      <div className="card stack">
        {qs.map((q, i) => {
          const ok = done ? isOk(q, i) : null;
          return (
            <div key={q.m.id} className={"q" + (done ? (ok ? " ok" : " no") : "")}>
              <span className="qn">{i + 1}</span>
              <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                <div className="row" style={{ gap: 6 }}><span className="chip">{SKILL_NAME[q.m.skill]}</span><span className="chip bad">{q.m.cat ? catLabel(q.m.cat) : TAG_LABEL[q.m.tag] || q.m.tag}</span>{q.m.reviewOk > 0 && <span className="chip good">1/2 correct</span>}</div>
                {q.context && <details><summary className="small">Show the paragraph</summary><p className="small" style={{ fontFamily: "var(--display)" }}>{q.context}</p></details>}
                {q.audio && <div><button className="btn sm" onClick={() => speak(q.audio!, s.settings.accent, 1)}><Icon name="play" />Play the relevant part</button> <span className="tiny muted">Device voice</span></div>}
                <div>{q.prompt}</div>
                {q.kind === "choice" && <div className="opts inline">{q.choices!.map((c) => <label key={c.key} className={"opt" + (done ? (c.key.toUpperCase() === String(q.answer).toUpperCase() ? " right" : ans[i] === c.key ? " wrong" : "") : ans[i] === c.key ? " sel" : "")}><input type="radio" style={{ display: "none" }} disabled={done} checked={ans[i] === c.key} onChange={() => setAns((a) => ({ ...a, [i]: c.key }))} />{c.label}</label>)}</div>}
                {q.kind === "gap" && <input type="text" className="gap-input" value={ans[i] || ""} disabled={done} onChange={(e) => setAns((a) => ({ ...a, [i]: e.target.value }))} />}
                {q.kind === "self" && <>
                  <textarea rows={2} placeholder="Rewrite the sentence correctly…" value={ans[i] || ""} disabled={done} onChange={(e) => setAns((a) => ({ ...a, [i]: e.target.value }))} />
                  {!reveal[i] ? <button className="btn sm" onClick={() => setReveal((r) => ({ ...r, [i]: true }))}>Compare with the correction</button> :
                    <div className="feedback"><div><span className="k">Correction</span> <ins>{q.m.correct}</ins></div><div className="small">{q.m.explanation}</div>
                      {!done && <div className="row"><span className="small">Was yours correct?</span><button className={"btn sm" + (selfOk[i] === true ? " primary" : "")} onClick={() => setSelfOk((o) => ({ ...o, [i]: true }))}>Yes</button><button className={"btn sm" + (selfOk[i] === false ? " primary" : "")} onClick={() => setSelfOk((o) => ({ ...o, [i]: false }))}>No</button></div>}</div>}
                </>}
                {done && q.kind !== "self" && <div className="feedback"><div><span className="k">Correct</span> <b>{q.kind === "choice" && q.m.skill === "G" ? q.choices![Number(q.answer)].label : Array.isArray(q.answer) ? q.answer.join(" / ") : q.answer}</b></div>{q.m.explanation && <div className="small">{q.m.explanation}</div>}</div>}
              </div>
            </div>
          );
        })}
        {!done ? <button className="btn primary lg" onClick={finish}>Check answers</button> : <a className="btn primary" href="#/mistakes">Back to My Mistakes</a>}
      </div>
    </>
  );
}

/* ================= QUESTION BANK ================= */
export function BankPage() {
  const s = useStore();
  usePacksVersion();
  const c = getContent();
  const [f, setF] = useState({ skill: "All", diff: "All", topic: "All", type: "All", status: "All" });
  const rows = useMemo(() => {
    const out: { qid: string; skill: string; diff: string; topic: string; type: string; text: string; href: string; gen?: boolean }[] = [];
    for (const set of [...c.reading, ...c.listening]) for (const q of flatten(set)) out.push({ qid: q.qid, skill: set.skill === "R" ? "Reading" : "Listening", diff: set.level, topic: set.category, type: q.group.qtype, text: q.item.q, href: `#/${set.skill === "R" ? "reading" : "listening"}/${set.id}?q=${encodeURIComponent(q.qid)}`, gen: set.generated });
    for (const t of c.grammar) t.ex.forEach((e: any, i: number) => out.push({ qid: `g:${t.id}:${i}`, skill: "Grammar", diff: `Level ${e.lvl}`, topic: t.title, type: "Grammar exercise", text: e.q, href: `#/grammar/${t.id}` }));
    return out;
  }, [c.reading.length, c.listening.length, c.grammar.length]);
  const mistakeIds = new Set(s.mistakes.map((m) => m.qid));
  const st = (qid: string) => { const x = s.itemStats[qid]; return !x ? "Unanswered" : x.lastOk ? "Completed" : "Incorrect"; };
  const shown = rows.filter((r) => (f.skill === "All" || r.skill === f.skill) && (f.diff === "All" || r.diff === f.diff) && (f.topic === "All" || r.topic === f.topic) && (f.type === "All" || r.type === f.type) &&
    (f.status === "All" || (f.status === "Previous mistakes" ? mistakeIds.has(r.qid) : st(r.qid) === f.status)));
  const opt = (k: keyof typeof rows[number]) => ["All", ...new Set(rows.filter((r) => f.skill === "All" || r.skill === f.skill).map((r) => String(r[k])))];
  return (
    <>
      <div className="page-head"><div><h1>Question Bank</h1><p className="sub">{rows.length} practice questions on this device (Mock Test content is excluded to keep it unseen).</p></div></div>
      <div className="card row">
        {(["skill", "diff", "topic", "type"] as const).map((k) => <label key={k} className="field" style={{ minWidth: 150, flex: 1 }}>{k === "diff" ? "Difficulty" : k[0].toUpperCase() + k.slice(1)}<select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value, ...(k === "skill" ? { topic: "All", type: "All", diff: "All" } : {}) })}>{opt(k).map((o) => <option key={o}>{o}</option>)}</select></label>)}
        <label className="field" style={{ minWidth: 150, flex: 1 }}>Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["All", "Unanswered", "Incorrect", "Completed", "Previous mistakes"].map((o) => <option key={o}>{o}</option>)}</select></label>
      </div>
      <div className="card table-wrap"><table className="t"><thead><tr><th>Skill</th><th>Type</th><th>Question</th><th>Topic</th><th>Difficulty</th><th>Status</th><th /></tr></thead><tbody>
        {shown.slice(0, 300).map((r) => { const x = st(r.qid); return <tr key={r.qid}><td>{r.skill}</td><td className="small">{r.type}</td><td className="small" style={{ maxWidth: 360 }}>{r.text}</td><td className="small">{r.topic}{r.gen ? " · AI" : ""}</td><td className="small">{r.diff}</td><td><span className={"chip " + (x === "Completed" ? "good" : x === "Incorrect" ? "bad" : "")}>{x}</span></td><td><a className="btn sm" href={r.href}>Open</a></td></tr>; })}
      </tbody></table>{!shown.length && <Empty>No questions match these filters.</Empty>}</div>
    </>
  );
}

export { normalize };
