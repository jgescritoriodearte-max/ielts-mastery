/* Paraphrasing Trainer and Cambridge Book Tracker. */
import React, { useMemo, useState } from "react";
import { getState, recordAttempt, saveExternal, useStore, type ItemResult } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import { checkGap } from "../lib/scoring";
import { bandFromRaw, fmtBand, overallBand } from "../lib/bands";
import { AiLabel, Empty, HBars, Icon, toast, useStopwatch } from "../ui/components";
import { fmtDate, shuffle, todayKey, uid } from "../lib/util";
import type { ExternalResult, Skill } from "../lib/types";

/* ======================= PARAPHRASING ======================= */
const P_TYPES: Record<string, string> = {
  synonym: "Synonym substitution", grammar: "Grammatical transformation", "active-passive": "Active ↔ passive",
  "noun-verb": "Noun ↔ verb", structure: "Sentence structure", reporting: "Reporting verbs", academic: "Academic reformulation",
};
interface PItem { id: string; type: string; band: number; original: string; task: "choose" | "complete"; q: string; opts?: string[]; a: number | string[]; model: string; why: string }

function pAccuracy(s: ReturnType<typeof useStore>) {
  const out: Record<string, [number, number]> = {};
  for (const a of s.attempts) if (a.skill === "P") for (const [t, [c, n]] of Object.entries(a.byType || {})) { const o = out[t] || [0, 0]; out[t] = [o[0] + c, o[1] + n]; }
  return out;
}

export function ParaphrasePage({ parts }: { parts: string[] }) {
  const s = useStore();
  usePacksVersion();
  const items = getContent().paraphrase as PItem[];
  if (parts[0] === "session") return <PRounds key={parts.join("/")} type={parts[1] || "mixed"} />;
  const acc = pAccuracy(s);
  const counts: Record<string, number> = {};
  items.forEach((i) => (counts[i.type] = (counts[i.type] || 0) + 1));
  const weakest = Object.entries(acc).filter(([, [, n]]) => n >= 4).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])[0];
  return (
    <>
      <div className="page-head"><div><h1>Paraphrasing Trainer</h1><p className="sub">Paraphrase is what IELTS really tests: Reading and Listening questions never use the words of the text, and Writing/Speaking reward flexible language. Sessions of 10 items, corrected on the device.</p></div></div>
      {!items.length && <Empty>The Paraphrasing pack is not on this device yet. <a href="#/library">Open the Offline Library</a> while online.</Empty>}
      {items.length > 0 && (
        <>
          {weakest && weakest[1][0] / weakest[1][1] < 0.7 && <div className="callout warn"><Icon name="flag" /><div style={{ flex: 1 }}>Your weakest technique is <b>{weakest[0]}</b> ({weakest[1][0]}/{weakest[1][1]} correct).</div><a className="btn sm" href={`#/paraphrase/session/${Object.keys(P_TYPES).find((k) => P_TYPES[k] === weakest[0]) || "mixed"}`}>Practise it</a></div>}
          <div className="card stack">
            <div className="row between"><h2>Start a session</h2><a className="btn primary" href="#/paraphrase/session/mixed"><Icon name="play" />Mixed session (10)</a></div>
            <div className="row">{Object.entries(P_TYPES).filter(([k]) => counts[k]).map(([k, label]) => <a key={k} className="btn sm" href={`#/paraphrase/session/${k}`}>{label} <span className="muted">({counts[k]})</span></a>)}</div>
            <div className="row"><AiLabel /></div>
          </div>
          <div className="card"><div className="card-head"><h2>Accuracy by technique</h2></div>
            {Object.keys(acc).length ? <HBars rows={Object.entries(acc).map(([t, [c, n]]) => ({ label: t, value: c / n, note: `${c}/${n}`, color: c / n >= 0.75 ? "var(--good)" : c / n >= 0.5 ? "var(--warn)" : "var(--bad)" }))} max={1} fmt={(v) => Math.round(v * 100) + "%"} />
              : <p className="muted small">No sessions yet.</p>}</div>
          <div className="card stack"><h2>How to use paraphrase in the test</h2>
            <ul className="small" style={{ margin: 0 }}>
              <li><b>Reading/Listening:</b> before looking for an answer, predict 2-3 ways the key idea could be expressed ("rose sharply" → "a dramatic increase", "climbed steeply").</li>
              <li><b>Writing Task 1:</b> never copy the prompt; change both words and structure in your introduction.</li>
              <li><b>Writing Task 2 / Speaking:</b> restate the question in your own words and avoid repeating the same noun — use pronouns, synonyms and noun ↔ verb changes.</li>
              <li><b>Check meaning, not only words:</b> quantity (some/most), certainty (may/will), time and cause-effect must stay the same.</li>
            </ul></div>
        </>
      )}
    </>
  );
}

function PRounds({ type }: { type: string }) {
  const [round, setRound] = useState(0);
  return <PSession key={round} type={type} again={() => { setRound((r) => r + 1); window.scrollTo(0, 0); }} />;
}

function PSession({ type, again }: { type: string; again: () => void }) {
  const s = useStore();
  const all = getContent().paraphrase as PItem[];
  const items = useMemo(() => {
    const pool = all.filter((i) => type === "mixed" || i.type === type);
    const st = getState().itemStats;
    const weight = (i: PItem) => { const x = st["pp:" + i.id]; return !x ? 1 : x.lastOk ? 3 : 0; }; // unseen and wrong first
    return shuffle(pool).sort((a, b) => weight(a) - weight(b)).slice(0, 10);
  }, [type]);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const secs = useStopwatch(!done);
  const ok = (i: PItem) => i.task === "choose" ? ans[i.id] === String(i.a) : checkGap(ans[i.id] || "", i.a as string[]).ok;
  const finish = async () => {
    setDone(true);
    const byType: Record<string, [number, number]> = {};
    const res: ItemResult[] = items.map((i) => {
      const good = ok(i); const k = P_TYPES[i.type] || i.type; const o = byType[k] || [0, 0]; byType[k] = [o[0] + (good ? 1 : 0), o[1] + 1];
      return { qid: "pp:" + i.id, ok: good, your: i.task === "choose" ? (i.opts?.[Number(ans[i.id])] ?? "") : ans[i.id] || "", correct: i.task === "choose" ? i.opts![i.a as number] : (i.a as string[])[0],
        prompt: `${i.original} → ${i.q}`, qtype: k, tag: k, explanation: i.why, difficulty: String(i.band), skill: "P", ref: "paraphrase" };
    });
    const correct = res.filter((r) => r.ok).length;
    const tags: Record<string, number> = {};
    res.filter((r) => !r.ok).forEach((r) => (tags[r.qtype] = (tags[r.qtype] || 0) + 1));
    await recordAttempt({ ts: Date.now(), skill: "P", kind: "practice", ref: "paraphrase", title: `Paraphrasing: ${type === "mixed" ? "mixed" : P_TYPES[type] || type}`, correct, total: res.length, band: null, secs: Math.round(secs), byType, tags }, res);
    toast(`Saved: ${correct}/${res.length}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (!items.length) return <Empty>No items for this technique on this device. <a href="#/paraphrase">Back</a></Empty>;
  const score = done ? items.filter(ok).length : 0;
  return (
    <>
      <div className="page-head"><div><a href="#/paraphrase" className="small">← Paraphrasing</a><h1>{type === "mixed" ? "Mixed session" : P_TYPES[type]}</h1><p className="sub">Keep the meaning, change the words and/or the structure.</p></div>
        {done && <div className="band-mid num">{score}/{items.length}</div>}</div>
      <div className="stack lg">
        {items.map((i, n) => {
          const good = done ? ok(i) : null;
          return (
            <div key={i.id} className={"card q" + (done ? (good ? " ok" : " no") : "")}>
              <span className="qn">{n + 1}</span>
              <div className="stack" style={{ gap: 8, minWidth: 0 }}>
                <div className="row"><span className="chip">{P_TYPES[i.type] || i.type}</span><span className="chip">≈ {i.band.toFixed(1)}</span></div>
                <div><span className="k small muted">Original</span><div><b>{i.original}</b></div></div>
                <div>{i.q}</div>
                {i.task === "choose" ? (
                  <div className="opts">{i.opts!.map((o, k) => {
                    const cls = done ? (k === i.a ? " right" : ans[i.id] === String(k) ? " wrong" : "") : ans[i.id] === String(k) ? " sel" : "";
                    return <label key={k} className={"opt" + cls}><input type="radio" name={i.id} checked={ans[i.id] === String(k)} disabled={done} onChange={() => setAns((a) => ({ ...a, [i.id]: String(k) }))} style={{ display: "none" }} /><b>{"ABCD"[k]}</b><span>{o}</span></label>;
                  })}</div>
                ) : (
                  <input type="text" className="gap-input" value={ans[i.id] || ""} disabled={done} onChange={(e) => setAns((a) => ({ ...a, [i.id]: e.target.value }))} aria-label={`Answer ${n + 1}`} autoComplete="off" spellCheck={false} style={{ maxWidth: 360 }} />
                )}
                {done && <div className="feedback">
                  {i.task === "complete" && <div><span className="k">Accepted</span> <b style={{ color: "var(--good)" }}>{(i.a as string[]).join(" / ")}</b></div>}
                  <div><span className="k">Model</span> {i.model}</div>
                  <div className="small">{i.why}</div>
                </div>}
              </div>
            </div>
          );
        })}
        {!done ? <button className="btn primary lg" onClick={finish}><Icon name="check" />Check answers</button>
          : <div className="row"><button className="btn primary" onClick={again}>New session</button><a className="btn" href="#/paraphrase">Back</a></div>}
      </div>
    </>
  );
}

/* ======================= CAMBRIDGE BOOK TRACKER ======================= */
const BOOKS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const HALF = ["", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

export function CambridgePage() {
  const s = useStore();
  const cam = s.external.filter((x) => x.source === "Cambridge" || /^Cambridge/i.test(x.name));
  const [f, setF] = useState({ book: 17, test: 1, date: todayKey(), lRaw: "", rRaw: "", W: "", S: "", notes: "" });
  const existing = cam.find((x) => x.book === f.book && x.test === f.test);
  const num = (v: string) => (v === "" ? null : Number(v));
  const lRaw = num(f.lRaw), rRaw = num(f.rRaw);
  const L = lRaw == null ? null : bandFromRaw(lRaw, "L"), R = rRaw == null ? null : bandFromRaw(rRaw, "R", "academic");
  const W = num(f.W), S = num(f.S);
  const valid = (lRaw == null || (lRaw >= 0 && lRaw <= 40)) && (rRaw == null || (rRaw >= 0 && rRaw <= 40)) && (lRaw != null || rRaw != null || W != null || S != null);
  const load = (x: ExternalResult) => setF({ book: x.book || 17, test: x.test || 1, date: x.date, lRaw: x.lRaw != null ? String(x.lRaw) : "", rRaw: x.rRaw != null ? String(x.rRaw) : "", W: x.W != null ? x.W.toFixed(1) : "", S: x.S != null ? x.S.toFixed(1) : "", notes: x.notes || "" });
  const save = async () => {
    const rec: ExternalResult = {
      id: existing?.id || uid("x-"), updatedAt: Date.now(), name: `Cambridge ${f.book} Test ${f.test}`, date: f.date, source: "Cambridge", book: f.book, test: f.test,
      lRaw, rRaw, L, R, W, S, overall: overallBand([L, R, W, S]), notes: f.notes.trim(),
    };
    await saveExternal(rec);
    toast(existing ? "Result updated." : "Result saved. Real test results now take priority in your band estimate.");
  };
  const sorted = cam.slice().sort((a, b) => a.date.localeCompare(b.date));
  const trend = (k: "lRaw" | "rRaw") => { const v = sorted.map((x) => x[k]).filter((x): x is number => x != null); if (v.length < 2) return null; const a = v.slice(0, Math.min(3, v.length)), b = v.slice(-Math.min(3, v.length)); return { first: a.reduce((x, y) => x + y, 0) / a.length, last: b.reduce((x, y) => x + y, 0) / b.length, n: v.length }; };
  const tL = trend("lRaw"), tR = trend("rRaw");
  return (
    <>
      <div className="page-head"><div><h1>Cambridge Book Tracker</h1><p className="sub">Record your scores from the official Cambridge IELTS Academic books. Real test results <b>take priority</b> over the app's practice estimates for 60 days. No questions from the books are stored here — only your scores.</p></div></div>
      <div className="grid g2">
        <div className="card stack">
          <h2>{existing ? "Update result" : "Add a result"}</h2>
          <div className="row">
            <label className="field">Book<select value={f.book} onChange={(e) => setF({ ...f, book: Number(e.target.value) })}>{BOOKS.map((b) => <option key={b} value={b}>Cambridge {b}</option>)}</select></label>
            <label className="field">Test<select value={f.test} onChange={(e) => setF({ ...f, test: Number(e.target.value) })}>{[1, 2, 3, 4].map((t) => <option key={t} value={t}>Test {t}</option>)}</select></label>
            <label className="field">Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          </div>
          <div className="row">
            <label className="field">Listening /40<input type="number" min={0} max={40} value={f.lRaw} onChange={(e) => setF({ ...f, lRaw: e.target.value })} style={{ width: 90 }} /></label>
            <label className="field">Reading /40<input type="number" min={0} max={40} value={f.rRaw} onChange={(e) => setF({ ...f, rRaw: e.target.value })} style={{ width: 90 }} /></label>
            <label className="field">Writing band<select value={f.W} onChange={(e) => setF({ ...f, W: e.target.value })}>{HALF.map((b) => <option key={b} value={b}>{b || "–"}</option>)}</select></label>
            <label className="field">Speaking band<select value={f.S} onChange={(e) => setF({ ...f, S: e.target.value })}>{HALF.map((b) => <option key={b} value={b}>{b || "–"}</option>)}</select></label>
          </div>
          <label className="field">Notes<input type="text" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="e.g. ran out of time in Passage 3; Writing marked by a teacher" /></label>
          <div className="row"><span className="small">Bands: L <b>{fmtBand(L)}</b> · R <b>{fmtBand(R)}</b> · W <b>{fmtBand(W)}</b> · S <b>{fmtBand(S)}</b> · Overall <b>{fmtBand(overallBand([L, R, W, S]))}</b></span></div>
          <div className="row"><button className="btn primary" disabled={!valid} onClick={save}><Icon name="check" />{existing ? "Update" : "Save result"}</button></div>
          <p className="tiny muted">Listening/Reading bands use the commonly published conversion tables; official tables vary slightly between tests. Writing/Speaking: enter a band only if it was marked by a teacher, examiner or a detailed Claude evaluation.</p>
        </div>
        <div className="card stack">
          <h2>Your progress</h2>
          {!cam.length ? <p className="muted">No Cambridge results yet. Do one full test under exam conditions and record it here.</p> : (
            <>
              {tL && <p>Listening: average <b>{tL.first.toFixed(1)}</b> → <b>{tL.last.toFixed(1)}</b>/40 ({tL.last - tL.first >= 0 ? "+" : ""}{(tL.last - tL.first).toFixed(1)}) over {tL.n} tests.</p>}
              {tR && <p>Reading: average <b>{tR.first.toFixed(1)}</b> → <b>{tR.last.toFixed(1)}</b>/40 ({tR.last - tR.first >= 0 ? "+" : ""}{(tR.last - tR.first).toFixed(1)}) over {tR.n} tests.</p>}
              <p className="small muted">Band 7.0 needs about <b>30/40</b> in Listening and <b>30/40</b> in Academic Reading (approximate).</p>
            </>
          )}
          <div className="table-wrap"><table className="t"><thead><tr><th>Book</th>{[1, 2, 3, 4].map((t) => <th key={t}>Test {t}</th>)}</tr></thead><tbody>
            {BOOKS.map((b) => (
              <tr key={b}><td>Cambridge {b}</td>{[1, 2, 3, 4].map((t) => { const x = cam.find((c) => c.book === b && c.test === t); return <td key={t} className="num" style={{ cursor: "pointer" }} onClick={() => (x ? load(x) : setF({ ...f, book: b, test: t, lRaw: "", rRaw: "", W: "", S: "", notes: "" }))}>{x ? <span className="small">L {x.lRaw ?? "–"} · R {x.rRaw ?? "–"}</span> : <span className="muted">·</span>}</td>; })}</tr>
            ))}
          </tbody></table></div>
        </div>
      </div>
      {sorted.length > 0 && <div className="card"><div className="card-head"><h2>History</h2></div><div className="table-wrap"><table className="t"><thead><tr><th>Date</th><th>Test</th><th>L raw</th><th>R raw</th>{(["L", "R", "W", "S"] as Skill[]).map((k) => <th key={k}>{k}</th>)}<th>Overall</th><th>Notes</th></tr></thead><tbody>
        {sorted.slice().reverse().map((x) => <tr key={x.id} onClick={() => load(x)} style={{ cursor: "pointer" }}><td className="num">{fmtDate(x.date)}</td><td>{x.name}</td><td className="num">{x.lRaw ?? "–"}</td><td className="num">{x.rRaw ?? "–"}</td>{(["L", "R", "W", "S"] as Skill[]).map((k) => <td key={k} className="num">{fmtBand(x[k])}</td>)}<td className="num"><b>{fmtBand(x.overall)}</b></td><td className="small">{x.notes}</td></tr>)}
      </tbody></table></div></div>}
    </>
  );
}
