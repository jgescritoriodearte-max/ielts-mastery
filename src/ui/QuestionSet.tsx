import React, { useEffect, useMemo, useRef, useState } from "react";
import type { QSet } from "../lib/types";
import { choicesFor, flatten, gradeSet, isChoice, STRATEGY, TAG_LABEL, type SetResult } from "../lib/scoring";
import { fmtBand, DISCLAIMER } from "../lib/bands";
import { getState, recordAttempt, useStore } from "../lib/store";
import { audioUrl, getContent } from "../lib/packs";
import { LinePlayer, offlineVoiceCount, ttsSupported } from "../lib/tts";
import { AiLabel, Countdown, Disclaimer, Icon, Seg, toast, useStopwatch } from "./components";
import { Diagram, MapPlan } from "./Diagrams";
import { copyText, fmtClock } from "../lib/util";
import { CLAUDE_URL, tutorPrompt } from "../lib/prompts";

/* ---------- audio: pre-produced file first, device voice as labelled fallback ---------- */
export function AudioPanel({ set, exam, onStarted, onLine }: { set: QSet; exam: boolean; onStarted?: () => void; onLine?: (i: number) => void }) {
  const s = useStore();
  const meta = getContent().audio[set.id];
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "playing" | "paused" | "ended">("idle");
  const [prog, setProg] = useState(0);
  const [accent, setAccent] = useState<string>(s.settings.accent);
  const [rate, setRate] = useState<number>(s.settings.ttsRate);
  const el = useRef<HTMLAudioElement | null>(null);
  const tts = useRef<LinePlayer | null>(null);
  const lines = set.lines || [];
  useEffect(() => { let alive = true; if (meta) audioUrl(meta.pack, meta.file).then((u) => alive && setUrl(u)); return () => { alive = false; }; }, [meta?.file]);
  useEffect(() => () => { tts.current?.stop(); el.current?.pause(); }, []);
  const usingFile = !!(meta && url);
  const playedOnce = state === "ended";

  const start = () => {
    onStarted?.();
    if (usingFile && el.current) { el.current.playbackRate = exam ? 1 : rate; el.current.play(); setState("playing"); return; }
    if (!ttsSupported()) { toast("This browser has no speech engine. Open the transcript instead."); return; }
    if (!tts.current) tts.current = new LinePlayer(lines, { accent, rate: exam ? 1 : rate, onLine: (i) => { setProg(i / lines.length); onLine?.(i); }, onEnd: () => { setState("ended"); setProg(1); } });
    tts.current.play(state === "paused" ? tts.current.index : 0);
    setState("playing");
  };
  const pause = () => { if (usingFile) el.current?.pause(); else tts.current?.pause(); setState("paused"); };
  const restart = () => { tts.current?.stop(); tts.current = null; if (el.current) { el.current.currentTime = 0; } setState("idle"); setProg(0); };

  return (
    <div className="card player">
      <div className="row between">
        <div className="row">
          {usingFile ? <span className="chip accent">Pre-produced audio · synthetic neural voice</span> : <span className="chip warn">Device Voice — Internet not required</span>}
          {set.generated && <AiLabel />}
        </div>
        {!exam && !usingFile && (
          <div className="row">
            <select value={accent} onChange={(e) => { setAccent(e.target.value); restart(); }} aria-label="Accent" style={{ width: "auto" }}>
              <option value="gb">British</option><option value="us">American</option><option value="au">Australian</option><option value="any">Mixed</option>
            </select>
            <select value={rate} onChange={(e) => { setRate(Number(e.target.value)); restart(); }} aria-label="Speed" style={{ width: "auto" }}>
              <option value={0.85}>Slower</option><option value={1}>Normal</option><option value={1.15}>Fast</option><option value={1.3}>Very fast</option>
            </select>
          </div>
        )}
      </div>
      {usingFile && <audio ref={el} src={url!} preload="auto" onTimeUpdate={(e) => { const a = e.currentTarget; setProg(a.duration ? a.currentTime / a.duration : 0); const marks = meta!.marks || []; let i = 0; while (i + 1 < marks.length && marks[i + 1] <= a.currentTime) i++; onLine?.(i); }} onEnded={() => setState("ended")} />}
      <div className="wave"><i style={{ width: `${prog * 100}%` }} /></div>
      <div className="row">
        {state !== "playing" && !(exam && playedOnce) && <button className="btn primary" onClick={start}><Icon name="play" />{state === "paused" ? "Resume" : state === "ended" ? "Play again" : "Play"}</button>}
        {state === "playing" && !exam && <button className="btn" onClick={pause}><Icon name="pause" />Pause</button>}
        {state === "playing" && exam && <span className="small muted">Playing — in exam mode the recording is heard once, without pausing.</span>}
        {!exam && state !== "idle" && <button className="btn ghost" onClick={restart}><Icon name="refresh" />Restart</button>}
        {usingFile && meta?.dur ? <span className="small muted num">{fmtClock(meta.dur)}</span> : null}
      </div>
      {!usingFile && ttsSupported() && offlineVoiceCount() === 0 && <p className="small muted">No offline English voice found on this device. Install an English voice (Android: Settings › Text-to-speech) so device audio works without internet.</p>}
      {!usingFile && <p className="tiny muted">Pre-produced audio for this exercise is not available on this device yet. The device voice reads the script instead.</p>}
    </div>
  );
}

/* ---------- evidence highlight ---------- */
function highlight(text: string, evs: { ev: string; ok: boolean; n: number }[]): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let rest = text, key = 0;
  const found = evs.map((e) => ({ ...e, i: text.indexOf(e.ev) })).filter((e) => e.i >= 0).sort((a, b) => a.i - b.i);
  let cursor = 0;
  for (const e of found) {
    if (e.i < cursor) continue;
    parts.push(text.slice(cursor, e.i));
    parts.push(<mark key={key++} className={"ev" + (e.ok ? "" : " miss")} title={`Question ${e.n}`}>{e.ev}<sup className="num"> {e.n}</sup></mark>);
    cursor = e.i + e.ev.length;
  }
  parts.push(text.slice(cursor));
  rest = "";
  return <>{parts}{rest}</>;
}

/* ---------- the question set ---------- */
export interface QSProps {
  set: QSet; exam?: boolean; only?: string[]; limitSecs?: number; kind?: "practice" | "diagnostic" | "mock" | "mistakes" | "section";
  embedded?: boolean; onSubmitted?: (r: SetResult, secs: number) => void; submitLabel?: string; autoSave?: boolean;
}

export function QuestionSet({ set, exam = false, only, limitSecs, kind = "practice", embedded, onSubmitted, submitLabel, autoSave = true }: QSProps) {
  const s = useStore();
  const flat = useMemo(() => flatten(set).filter((f) => !only || only.includes(f.qid)), [set.id, only?.join()]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SetResult | null>(null);
  const [running, setRunning] = useState(set.skill === "R");
  const secs = useStopwatch(running && !result);
  const [line, setLine] = useState(-1);
  const [showT, setShowT] = useState(false);
  const submittedRef = useRef(false);
  const isL = set.skill === "L";

  const submit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const r = gradeSet(set, answers, s.profile.exam, only ? new Set(only) : undefined);
    setResult(r);
    setRunning(false);
    if (autoSave) {
      await recordAttempt({
        ts: Date.now(), skill: set.skill, kind, ref: set.id, title: set.title, correct: r.correct, total: r.total,
        band: kind === "mistakes" || kind === "section" ? null : r.band, secs: Math.round(secs), limitSecs, byType: r.byType, tags: r.tags,
        level: set.level, category: set.category,
      }, r.items);
    }
    onSubmitted?.(r, secs);
    if (!embedded) window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => { if (limitSecs && exam && secs >= limitSecs && !result) { toast("Time is up — answers submitted."); submit(); } }, [secs >= (limitSecs || Infinity)]);

  const resById = Object.fromEntries((result?.items || []).map((i) => [i.qid, i]));
  const evs = result ? result.items.map((i) => ({ ev: flat.find((f) => f.qid === i.qid)?.item.ev || "", ok: i.ok, n: i.n })).filter((e) => e.ev) : [];
  const showFeedback = !!result && !(exam && embedded);
  const maps = getContent().maps || {};

  const askClaude = async () => {
    const wrong = (result?.items || []).filter((i) => !i.ok).slice(0, 8);
    const text = tutorPrompt(getState(), getContent(), `Explain why my answers were wrong in this ${isL ? "Listening" : "Reading"} exercise ("${set.title}") and give me a strategy for each question type.\n\n` +
      wrong.map((w) => `Q${w.n} [${w.qtype}] ${w.prompt}\nMy answer: ${w.your || "(blank)"} — Correct: ${w.correct}\nEvidence: "${flat.find((f) => f.qid === w.qid)?.item.ev || ""}"`).join("\n\n"));
    if (await copyText(text)) toast("Prompt copied. Open Claude and paste it."); else toast("Copy failed — select the text manually.");
  };

  const groupsShown = set.groups.map((g, gi) => ({ g, gi, items: flat.filter((f) => f.qid.split(":")[1] === String(gi)) })).filter((x) => x.items.length);

  const questions = (
    <div className="stack lg">
      {groupsShown.map(({ g, gi, items }) => (
        <div key={gi} className="card qgroup">
          <div className="row between"><h3>{g.qtype}</h3><span className="small muted num">Questions {items[0].n}–{items[items.length - 1].n}</span></div>
          <div className="instr">{g.instr}</div>
          {g.diagram && <Diagram id={g.diagram} />}
          {g.map && maps[g.map] && <MapPlan map={maps[g.map]} />}
          {g.table && <div className="table-wrap"><table className="t"><thead><tr>{g.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{g.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c.replace(/\[(\d)\]/g, (_, d) => `(${items[Number(d) - 1]?.n ?? d})`)}</td>)}</tr>)}</tbody></table></div>}
          {g.options && !g.items[0].opts && (g.optKey === "roman" || g.optKey === "letter") && (
            <div className="callout" style={{ flexDirection: "column", gap: 3 }}>{g.options.map((o) => <span key={o} className="small">{o}</span>)}</div>
          )}
          {items.map((f) => {
            const r = resById[f.qid];
            const choices = isChoice(f.group, f.item) ? choicesFor(f.group, f.item) : null;
            const v = answers[f.qid] || "";
            const set1 = (val: string) => !result && setAnswers((a) => ({ ...a, [f.qid]: val }));
            const compact = choices && (g.optKey === "roman" || g.optKey === "letter" || /Not Given/.test(g.qtype) || g.qtype === "Map Labelling");
            const correctLabel = Array.isArray(f.item.a) ? f.item.a.join(" / ") : f.item.a;
            return (
              <div key={f.qid} className={"q" + (showFeedback ? (r?.ok ? " ok" : " no") : "")}>
                <span className="qn">{f.n}</span>
                <div style={{ minWidth: 0 }}>
                  <div>{f.item.q.split("___").map((part, i, arr) => <React.Fragment key={i}>{part}{i < arr.length - 1 && <span className="muted"> ______ </span>}</React.Fragment>)}</div>
                  {choices ? (
                    <div className={"opts" + (compact ? " inline" : "")}>
                      {choices.map((c) => {
                        const cls = showFeedback ? (c.key.toUpperCase() === String(f.item.a).toUpperCase() ? " right" : v === c.key ? " wrong" : "") : v === c.key ? " sel" : "";
                        return (
                          <label key={c.key} className={"opt" + cls}>
                            <input type="radio" name={f.qid} value={c.key} checked={v === c.key} disabled={!!result} onChange={() => set1(c.key)} style={{ display: "none" }} />
                            <b>{compact ? c.key : c.key}</b>{!compact && <span>{c.label}</span>}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <input type="text" className="gap-input" value={v} disabled={!!result} onChange={(e) => set1(e.target.value)} aria-label={`Answer ${f.n}`} autoComplete="off" spellCheck={false} />
                  )}
                  {showFeedback && r && (
                    <div className="feedback">
                      <div><span className="k">Your answer</span> <b>{r.your || "(blank)"}</b> · <span className="k">Correct</span> <b style={{ color: "var(--good)" }}>{correctLabel}</b>{!r.ok && r.tag && <span className="chip bad" style={{ marginLeft: 8 }}>{TAG_LABEL[r.tag] || r.tag}</span>}</div>
                      {f.item.ex && <div>{f.item.ex}</div>}
                      {f.item.ev && <div><span className="k">Evidence</span> “{f.item.ev}”</div>}
                      {!r.ok && <div className="small muted"><span className="k">Strategy</span> {f.item.strat || STRATEGY[g.qtype] || ""}</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {!result && (
        <div className="row">
          <button className="btn primary lg" onClick={submit}><Icon name="check" />{submitLabel || "Submit answers"}</button>
          <span className="small muted">{Object.values(answers).filter(Boolean).length}/{flat.length} answered</span>
        </div>
      )}
    </div>
  );

  const summary = result && !(exam && embedded) && (
    <div className="card raised">
      <div className="score-hero">
        <div><div className="eyebrow">Score</div><div className="band-big num">{result.correct}/{result.total}</div></div>
        {kind !== "mistakes" && <div><div className="eyebrow">Estimated band</div><div className="band-big">{fmtBand(result.band)}</div></div>}
        <div><div className="eyebrow">Time</div><div className="band-mid num">{fmtClock(secs)}</div>{limitSecs ? <div className="tiny muted">limit {fmtClock(limitSecs)}</div> : null}</div>
        <div style={{ flex: 1, minWidth: 220 }} className="stack">
          {Object.keys(result.tags).length > 0 && <p><b>You had difficulty mainly with:</b> {Object.entries(result.tags).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${TAG_LABEL[t] || t} (${n})`).join(", ")}.</p>}
          <div className="row">{Object.entries(result.byType).map(([t, [c, n]]) => <span key={t} className={"chip " + (c / n >= 0.75 ? "good" : c / n >= 0.5 ? "warn" : "bad")}>{t} {c}/{n}</span>)}</div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {result.correct < result.total && <button className="btn" onClick={askClaude}><Icon name="copy" />Copy to Claude: explain my mistakes</button>}
        {result.correct < result.total && <a className="btn ghost" href={CLAUDE_URL} target="_blank" rel="noreferrer"><Icon name="ext" />Open Claude</a>}
        {isL && <button className="btn ghost" onClick={() => setShowT((x) => !x)}>{showT ? "Hide" : "Show"} transcript</button>}
        {isL && Object.keys(result.tags).length > 0 && <a className="btn ghost" href={`#/listening/drill/${encodeURIComponent(Object.entries(result.tags).sort((a, b) => b[1] - a[1])[0][0])}`}>Targeted drill</a>}
      </div>
      {kind !== "mistakes" && result.total < 20 && <p className="tiny muted" style={{ marginTop: 8 }}>Short set: the band is a rough estimate scaled from {result.total} questions. {DISCLAIMER}</p>}
    </div>
  );

  const transcript = isL && (showT || (!result && !exam && false)) && (
    <div className="card transcript">
      <h3 style={{ marginBottom: 8 }}>Transcript</h3>
      {(set.lines || []).map(([sp, t], i) => <p key={i} className={i === line ? "cur" : ""}><span className="sp">{sp}</span>{result ? highlight(t, evs) : t}</p>)}
    </div>
  );

  return (
    <div className="stack lg">
      {!embedded && (
        <div className="row between">
          <div className="row"><span className="chip">{set.level}</span><span className="chip">{set.category}</span>{set.generated && <AiLabel />}{exam && <span className="chip gold">Exam mode</span>}</div>
          {!result && (limitSecs ? <Countdown secs={secs} limit={limitSecs} /> : <Countdown secs={secs} />)}
        </div>
      )}
      {summary}
      {isL ? (
        <>
          {!result && <AudioPanel set={set} exam={exam} onStarted={() => setRunning(true)} onLine={setLine} />}
          {transcript}
          {questions}
        </>
      ) : (
        <div className="ex-layout">
          <div className="card passage">
            <h2>{set.title}</h2>
            {(set.paras || []).map(([l, t]) => <p key={l}><span className="pl">{l}</span>{result ? highlight(t, evs) : t}</p>)}
          </div>
          {questions}
        </div>
      )}
    </div>
  );
}

export { Seg, Disclaimer };
