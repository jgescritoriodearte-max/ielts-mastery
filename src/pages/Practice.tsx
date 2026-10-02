import React, { useMemo, useState } from "react";
import { useStore, recordAttempt, type ItemResult } from "../lib/store";
import { findSet, getContent, usePacksVersion } from "../lib/packs";
import type { QSet } from "../lib/types";
import { flatten, normalize, STRATEGY, TAG_LABEL, checkGap } from "../lib/scoring";
import { accuracyByType, tagCounts } from "../lib/stats";
import { QuestionSet } from "../ui/QuestionSet";
import { AiLabel, Empty, HBars, Icon, Seg, toast, useStopwatch } from "../ui/components";
import { speak, ttsSupported } from "../lib/tts";
import { pick, shuffle, uid } from "../lib/util";
import { go } from "../lib/pwa";

const LEVELS = ["Beginner", "Intermediate", "Upper-Intermediate", "Advanced", "IELTS Level"];
const R_CATS = ["Science", "History", "Environment", "Technology", "Society", "Education", "Psychology", "Culture", "Business", "Health", "Art", "Travel", "Geography"];

function bestOf(s: ReturnType<typeof useStore>, id: string) {
  const a = s.attempts.filter((x) => x.ref === id && x.kind !== "mistakes");
  if (!a.length) return null;
  return a.reduce((b, x) => (x.correct / x.total > b.correct / b.total ? x : b));
}

function SetCard({ set, base }: { set: QSet; base: string }) {
  const s = useStore();
  const best = bestOf(s, set.id);
  const n = flatten(set).length;
  const types = [...new Set(set.groups.map((g) => g.qtype))];
  return (
    <div className="card stack">
      <div className="row between"><span className="eyebrow">{set.category} · {set.level}</span>{best ? <span className={"chip " + (best.correct / best.total >= 0.75 ? "good" : "warn")}>Best {best.correct}/{best.total}</span> : <span className="chip">New</span>}</div>
      <h3>{set.title}</h3>
      <div className="row">{types.map((t) => <span key={t} className="chip">{t}</span>)}{set.generated && <AiLabel />}</div>
      <div className="row between" style={{ marginTop: "auto" }}>
        <span className="small muted">{n} questions{set.mins ? ` · ${set.mins} min` : ""}</span>
        <div className="row"><a className="btn sm" href={`#/${base}/${set.id}`}>Practice</a><a className="btn sm primary" href={`#/${base}/${set.id}?exam=1`}>Timed</a></div>
      </div>
    </div>
  );
}

function RunSet({ set, base, query }: { set: QSet; base: string; query: URLSearchParams }) {
  const exam = query.get("exam") === "1";
  const onlyType = query.get("only");
  const oneQ = query.get("q");
  const only = oneQ ? [oneQ] : onlyType ? flatten(set).filter((f) => f.group.qtype === onlyType).map((f) => f.qid) : undefined;
  const limit = exam ? (set.skill === "R" ? (set.mins || 20) * 60 : Math.max(8 * 60, flatten(set).length * 60)) : undefined;
  return (
    <>
      <div className="page-head"><div><a href={`#/${base}`} className="small">← {base === "reading" ? "Reading" : "Listening"}</a><h1>{set.title}</h1>{onlyType && <p className="sub">Focus: {onlyType} only</p>}</div></div>
      <QuestionSet key={set.id + (exam ? "x" : "") + (onlyType || "") + (oneQ || "")} set={set} exam={exam} limitSecs={limit} only={only} />
    </>
  );
}

/* ================= READING ================= */
export function ReadingPage({ parts, query }: { parts: string[]; query: URLSearchParams }) {
  const s = useStore();
  usePacksVersion();
  const c = getContent();
  const [cat, setCat] = useState("All");
  const [lvl, setLvl] = useState("All");
  if (parts[0]) {
    const set = findSet(parts[0]);
    if (!set) return <Empty>This passage is not on this device. <a href="#/library">Open the Offline Library</a> to download it.</Empty>;
    return <RunSet set={set} base="reading" query={query} />;
  }
  const focus = query.get("focus");
  const acc = accuracyByType(s, "R");
  const weakest = Object.entries(acc).filter(([, [, n]]) => n >= 3).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])[0];
  let sets = c.reading;
  if (cat !== "All") sets = sets.filter((x) => x.category === cat);
  if (lvl !== "All") sets = sets.filter((x) => x.level === lvl);
  if (focus) sets = sets.filter((x) => x.groups.some((g) => g.qtype === focus));
  const cats = ["All", ...new Set([...R_CATS, ...c.reading.map((x) => x.category)])];
  return (
    <>
      <div className="page-head"><div><h1>Reading</h1><p className="sub">Academic-style passages with automatic correction, evidence from the text and a strategy for every question type. Mock Test passages are kept separate.</p></div>
        <a className="btn" href="#/ai/generate/reading"><Icon name="ai" />More passages via Claude</a></div>
      {weakest && weakest[1][0] / weakest[1][1] < 0.7 && !focus && (
        <div className="callout warn"><Icon name="flag" /><div style={{ flex: 1 }}>You are making most errors in <b>{weakest[0]}</b> ({weakest[1][0]}/{weakest[1][1]} correct).</div><a className="btn sm" href={`#/reading?focus=${encodeURIComponent(weakest[0])}`}>Focused session</a></div>
      )}
      {focus && (
        <div className="card stack"><div className="row between"><h2>Focus: {focus}</h2><a className="btn sm ghost" href="#/reading">Clear focus</a></div><p>{STRATEGY[focus]}</p>
          <div className="row">{sets.map((x) => <a key={x.id} className="btn sm primary" href={`#/reading/${x.id}?only=${encodeURIComponent(focus)}`}>{x.title}: only {focus}</a>)}</div>
          {!sets.length && <p className="muted">No practice passage on this device has this type. Generate one with Claude.</p>}</div>
      )}
      <div className="row">
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }} aria-label="Category">{cats.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={lvl} onChange={(e) => setLvl(e.target.value)} style={{ width: "auto" }} aria-label="Level">{["All", ...LEVELS].map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      {sets.length ? <div className="grid g-auto">{sets.map((x) => <SetCard key={x.id} set={x} base="reading" />)}</div>
        : <Empty>No passage for this filter on this device. {cat !== "All" && <a href={`#/ai/generate/reading?topic=${encodeURIComponent(cat)}`}>Generate a {cat} passage with Claude</a>}</Empty>}
      <div className="card"><div className="card-head"><h2>Accuracy by question type</h2><span className="small muted">all Reading practice</span></div>
        <HBars rows={Object.entries(acc).map(([t, [x, n]]) => ({ label: t, value: x / n, note: `${x}/${n}`, color: x / n >= 0.75 ? "var(--good)" : x / n >= 0.5 ? "var(--warn)" : "var(--bad)" }))} max={1} fmt={(v) => Math.round(v * 100) + "%"} /></div>
    </>
  );
}

/* ================= LISTENING ================= */
export function ListeningPage({ parts, query }: { parts: string[]; query: URLSearchParams }) {
  const s = useStore();
  usePacksVersion();
  const c = getContent();
  if (parts[0] === "drill") return <Drill tag={parts[1] || "numbers"} />;
  if (parts[0]) {
    const set = findSet(parts[0]);
    if (!set) return <Empty>This recording is not on this device. <a href="#/library">Open the Offline Library</a>.</Empty>;
    return <RunSet set={set} base="listening" query={query} />;
  }
  const tags = tagCounts(s, "L");
  const acc = accuracyByType(s, "L");
  return (
    <>
      <div className="page-head"><div><h1>Listening</h1><p className="sub">Sections with pre-produced audio when downloaded, device voice otherwise. Answers are checked automatically, including spelling and word limits.</p></div>
        <a className="btn" href="#/ai/generate/listening"><Icon name="ai" />More scripts via Claude</a></div>
      {LEVELS.map((l) => {
        const sets = c.listening.filter((x) => x.level === l);
        if (!sets.length) return null;
        return <div key={l} className="stack"><h2>{l}</h2><div className="grid g-auto">{sets.map((x) => <SetCard key={x.id} set={x} base="listening" />)}</div></div>;
      })}
      {!c.listening.length && <Empty>No Listening pack on this device. <a href="#/library">Download Listening Pack 01</a>.</Empty>}
      <div className="grid g2">
        <div className="card stack"><h2>Targeted drills</h2><p className="small muted">Unlimited dictation drills generated on the device. Device Voice — Internet not required.</p>
          <div className="row">{["numbers", "spelling", "distractors", "fast speech", "accents"].map((t) => <a key={t} className="btn sm" href={`#/listening/drill/${encodeURIComponent(t)}`}>{TAG_LABEL[t]}</a>)}</div></div>
        <div className="card"><div className="card-head"><h2>Your error profile</h2></div>
          <HBars rows={Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ label: TAG_LABEL[t] || t, value: n, color: "var(--bad)" }))} /></div>
      </div>
      <div className="card"><div className="card-head"><h2>Accuracy by question type</h2></div>
        <HBars rows={Object.entries(acc).map(([t, [x, n]]) => ({ label: t, value: x / n, note: `${x}/${n}`, color: x / n >= 0.75 ? "var(--good)" : "var(--warn)" }))} max={1} fmt={(v) => Math.round(v * 100) + "%"} /></div>
    </>
  );
}

/* ---------- procedural dictation drills ---------- */
const SURNAMES = ["Whitcombe", "Pennington", "Atherton", "Kowalski", "Fairbairn", "Llewellyn", "Thackeray", "Abernethy", "Ravenscroft", "Higginbotham", "Delacroix", "Montague"];
const STREETS = ["Harbour Road", "Mill Lane", "Queensway", "Elm Grove", "Station Approach", "Kingsley Avenue"];
const SENTENCES = ["The library will be closed for refurbishment until the end of the month.", "Applications must be submitted no later than the fifteenth of June.", "Participants should bring a packed lunch and waterproof clothing.", "The main hall is located on the opposite side of the courtyard.", "Most of the funding comes from private donations rather than the government.", "We recommend booking at least three weeks in advance during the summer.", "The survey was carried out among two hundred and fifty local residents.", "Unfortunately, the guided tour has been cancelled due to bad weather."];
function makeItem(tag: string): { text: string; answer: string[]; hint: string; rate: number; accent?: string } {
  const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  switch (tag) {
    case "spelling": case "names": {
      if (Math.random() < 0.5) { const n = pick(SURNAMES); return { text: `My surname is ${n}. That's ${n.toUpperCase().split("").join(", ")}.`, answer: [n], hint: "Surname", rate: 1 }; }
      const pc = `${pick(["BR", "SW", "NE", "LS", "CB", "OX"])}${r(1, 19)} ${r(1, 9)}${pick(["AB", "JT", "QX", "HW", "DP"])}`;
      return { text: `The postcode is ${pc.split("").map((ch) => (ch === " " ? "," : ch)).join(" ")}.`, answer: [pc], hint: "Postcode", rate: 0.95 };
    }
    case "distractors": {
      const a = r(12, 49), b = a + pick([4, 11, 20, 33]);
      const wrong = r(20, 90), right = wrong + pick([5, 10, 15, -5]);
      const street = pick(STREETS);
      return pick([
        { text: `The meeting starts at ${wrong % 2 ? "half past" : "a quarter past"} two. Oh no, sorry, it's been moved to three o'clock.`, answer: ["3", "3.00", "3:00", "three", "three o'clock", "3 o'clock", "15:00"], hint: "Meeting time", rate: 1 },
        { text: `I live at ${a} ${street}. Actually no, we moved last month. It's ${b} ${street} now.`, answer: [String(b)], hint: `House number (${street})`, rate: 1 },
        { text: `The ticket costs ${wrong} pounds, but with the student discount it's ${right} pounds.`, answer: [String(right)], hint: "Price for students (£)", rate: 1 },
      ]);
    }
    case "fast speech": { const t = pick(SENTENCES); return { text: t, answer: [t], hint: "Write the full sentence", rate: 1.3 }; }
    case "accents": { const t = pick(SENTENCES); return { text: t, answer: [t], hint: "Write the full sentence", rate: 1, accent: pick(["gb", "us", "au", "any"]) }; }
    default: {
      return pick([
        () => { const p = `07${r(100, 999)}${r(100000, 999999)}`; return { text: `My mobile number is ${p.slice(0, 5).split("").map((d) => (d === "0" ? "oh" : d)).join(" ")}, ${p.slice(5).split("").join(" ")}.`, answer: [p], hint: "Phone number", rate: 1 }; },
        () => { const y = r(1890, 2024); return { text: `The building was completed in ${y}.`, answer: [String(y)], hint: "Year", rate: 1 }; },
        () => { const n = pick([13, 14, 15, 16, 17, 18, 19, 30, 40, 50, 60, 70, 80, 90]); return { text: `There are ${n} people in the group.`, answer: [String(n)], hint: "Number of people", rate: 1 }; },
        () => { const pr = `${r(2, 99)}.${pick(["50", "75", "25", "99"])}`; const [a, b] = pr.split("."); return { text: `It costs ${a} pounds ${b}.`, answer: [pr, `£${pr}`], hint: "Price (£)", rate: 1 }; },
        () => { const d = r(1, 28), m = pick(["January", "March", "June", "August", "October", "December"]); return { text: `The course starts on the ${d}${d === 1 || d === 21 ? "st" : d === 2 || d === 22 ? "nd" : d === 3 || d === 23 ? "rd" : "th"} of ${m}.`, answer: [`${d} ${m}`, `${m} ${d}`, `${d}th ${m}`, `${d}st ${m}`, `${d}nd ${m}`, `${d}rd ${m}`], hint: "Date", rate: 1 }; },
      ])();
    }
  }
}

function Drill({ tag }: { tag: string }) {
  const [round, setRound] = useState(0);
  return <DrillRound key={tag + round} tag={tag} next={() => setRound((r) => r + 1)} />;
}

function DrillRound({ tag, next }: { tag: string; next: () => void }) {
  const s = useStore();
  const items = useMemo(() => Array.from({ length: 10 }, () => makeItem(tag)), [tag]);
  const [ans, setAns] = useState<string[]>(Array(10).fill(""));
  const [done, setDone] = useState(false);
  const secs = useStopwatch(!done);
  const sentenceMode = tag === "fast speech" || tag === "accents";
  const check = (i: number) => {
    const it = items[i];
    if (sentenceMode) { const a = normalize(ans[i]).replace(/[^a-z0-9 ]/g, ""), b = normalize(it.answer[0]).replace(/[^a-z0-9 ]/g, ""); const aw = a.split(" "), bw = b.split(" "); const hit = bw.filter((w) => aw.includes(w)).length; return hit / bw.length >= 0.85; }
    return checkGap(ans[i], it.answer).ok || it.answer.some((x) => normalize(x).replace(/\s/g, "") === normalize(ans[i]).replace(/\s/g, ""));
  };
  const finish = async () => {
    setDone(true);
    const res: ItemResult[] = items.map((it, i) => ({ qid: `drill:${tag}:${uid()}`, ok: check(i), your: ans[i], correct: it.answer[0], prompt: `${it.hint} (dictation)`, qtype: "Dictation", tag, explanation: `Audio: "${it.text}"`, difficulty: "Drill", skill: "L", ref: "drill-" + tag }));
    const correct = res.filter((r) => r.ok).length;
    await recordAttempt({ ts: Date.now(), skill: "L", kind: "drill", ref: "drill-" + tag, title: `Drill: ${TAG_LABEL[tag] || tag}`, correct, total: 10, band: null, secs: Math.round(secs), byType: { Dictation: [correct, 10] }, tags: correct < 10 ? { [tag]: 10 - correct } : {} }, res.filter((r) => !r.ok).map((r) => ({ ...r })));
    toast(`Drill saved: ${correct}/10`);
  };
  return (
    <>
      <div className="page-head"><div><a href="#/listening" className="small">← Listening</a><h1>Drill: {TAG_LABEL[tag] || tag}</h1><p className="sub">10 short items. Play each one, then type what you hear. <span className="chip warn">Device Voice — Internet not required</span></p></div>
        <Seg value={tag} options={["numbers", "spelling", "distractors", "fast speech", "accents"].map((t) => ({ v: t, label: TAG_LABEL[t] }))} onChange={(t) => go(`/listening/drill/${encodeURIComponent(t)}`)} /></div>
      {!ttsSupported() && <div className="callout bad">This browser has no speech engine, so drills cannot play.</div>}
      <div className="card stack">
        {items.map((it, i) => {
          const ok = done ? check(i) : null;
          return (
            <div key={i} className={"q" + (done ? (ok ? " ok" : " no") : "")}>
              <span className="qn">{i + 1}</span>
              <div className="stack" style={{ gap: 6 }}>
                <div className="row"><button className="btn sm" onClick={() => speak(it.text, it.accent || s.settings.accent, it.rate)}><Icon name="play" />Play</button><span className="small muted">{it.hint}{it.accent ? ` · accent: ${it.accent}` : ""}</span></div>
                <input type="text" value={ans[i]} disabled={done} onChange={(e) => setAns((a) => a.map((x, j) => (j === i ? e.target.value : x)))} style={{ maxWidth: sentenceMode ? "100%" : 300 }} aria-label={`Answer ${i + 1}`} />
                {done && <div className="feedback"><div><span className="k">Correct</span> <b>{it.answer[0]}</b></div><div className="small muted">Audio: “{it.text}”</div></div>}
              </div>
            </div>
          );
        })}
        {!done ? <button className="btn primary lg" onClick={finish}>Check answers</button> : <button className="btn primary" onClick={next}>New drill</button>}
      </div>
    </>
  );
}
