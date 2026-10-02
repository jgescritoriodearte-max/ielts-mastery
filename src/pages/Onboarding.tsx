import React, { useState } from "react";
import { DEFAULT_PROFILE, saveProfile, useStore } from "../lib/store";
import { getContent } from "../lib/packs";
import { dailyPlan } from "../lib/planner";
import { BandSelect, Icon, Seg } from "../ui/components";
import { TodayList } from "./Dashboard";
import { go } from "../lib/pwa";
import type { Profile, Skill } from "../lib/types";
import { SKILL_NAME } from "../lib/types";

const DIFFS = ["Listening: numbers & spelling", "Listening: fast speech", "Reading: True/False/Not Given", "Reading: time pressure", "Writing: grammar", "Writing: ideas & structure", "Speaking: fluency", "Speaking: vocabulary", "Vocabulary in general"];

export function Onboarding() {
  const s = useStore();
  const [step, setStep] = useState(1);
  const [p, setP] = useState<Profile>({ ...DEFAULT_PROFILE, ...s.profile });
  const upd = (x: Partial<Profile>) => setP((o) => ({ ...o, ...x }));
  const steps = ["Which IELTS?", "Target band", "Exam date", "Study time", "Initial assessment", "Your plan"];
  const finish = async (toDiag: boolean) => {
    await saveProfile({ ...p, onboarded: true, createdAt: p.createdAt || Date.now() });
    go(toDiag ? "/mock/diagnostic" : "/");
  };
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px 64px" }} className="stack lg">
      <div className="row"><div className="brand-mark">IM</div><div><b style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>IELTS Mastery</b><div className="small muted">Personal, offline IELTS preparation</div></div></div>
      <div className="row" style={{ gap: 6 }}>{steps.map((t, i) => <span key={t} className={"chip " + (i + 1 === step ? "accent" : i + 1 < step ? "good" : "")}>{i + 1}. {t}</span>)}</div>
      <div className="card pad-lg stack lg">
        {step === 1 && <>
          <h1>Which IELTS are you preparing for?</h1>
          <div className="grid g2">
            {(["academic", "gt"] as const).map((x) => (
              <button key={x} className={"card stack"} style={{ textAlign: "left", cursor: "pointer", borderColor: p.exam === x ? "var(--accent)" : undefined, boxShadow: p.exam === x ? "0 0 0 1px var(--accent)" : undefined }} onClick={() => upd({ exam: x })}>
                <h2>{x === "academic" ? "IELTS Academic" : "IELTS General Training"}</h2>
                <span className="small muted">{x === "academic" ? "University study (e.g. UK master's, Chevening). Task 1 describes charts." : "Work and migration. Task 1 is a letter."}</span>
              </button>
            ))}
          </div>
          <label className="field">Your name<input type="text" value={p.name} onChange={(e) => upd({ name: e.target.value })} /></label>
        </>}
        {step === 2 && <>
          <h1>Target band</h1>
          <label className="field">Overall target<span className="hint">Check the exact requirement of each university.</span><BandSelect value={p.target} allowEmpty={false} min={4} onChange={(v) => { const t = v ?? 7; upd({ target: t, skillTargets: { L: t, R: t, W: t, S: t } }); }} /></label>
          <p className="small muted">Minimum per skill (for courses that require, e.g., 6.5 in Reading and Writing):</p>
          <div className="grid g4">{(["L", "R", "W", "S"] as Skill[]).map((k) => (
            <label key={k} className="field">{SKILL_NAME[k]}<BandSelect value={p.skillTargets[k]} allowEmpty={false} min={4} onChange={(v) => upd({ skillTargets: { ...p.skillTargets, [k]: v ?? p.target } })} /></label>
          ))}</div>
        </>}
        {step === 3 && <>
          <h1>Approximate exam date</h1>
          <label className="field">Exam date<input type="date" value={p.examDate} onChange={(e) => upd({ examDate: e.target.value })} /></label>
        </>}
        {step === 4 && <>
          <h1>Available study time</h1>
          <div className="grid g2">
            <label className="field">Hours per week<input type="number" min={1} max={60} value={p.hoursWeek} onChange={(e) => upd({ hoursWeek: Number(e.target.value) })} /></label>
            <label className="field">Minutes per day<input type="number" min={10} max={300} step={5} value={p.minutesDay} onChange={(e) => upd({ minutesDay: Number(e.target.value) })} /></label>
          </div>
          <label className="field">Preferred skill to study more (optional)
            <select value={p.prefer} onChange={(e) => upd({ prefer: e.target.value })}><option value="">No preference</option>{(["L", "R", "W", "S"] as Skill[]).map((k) => <option key={k} value={k}>{SKILL_NAME[k]}</option>)}</select></label>
          <div className="stack"><span className="small" style={{ fontWeight: 600 }}>Biggest difficulties</span>
            <div className="row">{DIFFS.map((d) => <label key={d} className="check chip" style={{ cursor: "pointer" }}><input type="checkbox" checked={p.difficulties.includes(d)} onChange={() => upd({ difficulties: p.difficulties.includes(d) ? p.difficulties.filter((x) => x !== d) : [...p.difficulties, d] })} />{d}</label>)}</div></div>
        </>}
        {step === 5 && <>
          <h1>Initial assessment</h1>
          <p>If you know your current level (e.g. from an official test or a Cambridge practice test), enter it. Otherwise, take the diagnostic test after this step: about 75 minutes, with Listening, Reading, Writing and Speaking.</p>
          <div className="grid g4">{(["L", "R", "W", "S"] as Skill[]).map((k) => (
            <label key={k} className="field">{SKILL_NAME[k]}<span className="hint">if known</span><BandSelect value={p.selfLevel[k] ?? null} onChange={(v) => { const sl = { ...p.selfLevel }; if (v == null) delete sl[k]; else sl[k] = v; upd({ selfLevel: sl }); }} /></label>
          ))}</div>
          <p className="small muted">Declared levels are used only until the app has its own data, and are always labelled “declared”.</p>
        </>}
        {step === 6 && <>
          <h1>Your personalised plan</h1>
          <p className="muted">Today's suggestion for {p.minutesDay} minutes. The plan adapts automatically as you practise: weak areas get more time, mastered areas get less.</p>
          <TodayList tasks={dailyPlan({ ...s, profile: p }, getContent(), p.minutesDay)} />
          <div className="callout accent"><Icon name="info" /><div className="small">All study features work offline. Install the app (browser menu › Install app / Add to Home screen) and keep the content packs downloaded before going offline.</div></div>
        </>}
        <div className="row between">
          <button className="btn ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button>
          {step < 6 ? <button className="btn primary" onClick={() => setStep(step + 1)}>Continue<Icon name="arrow" /></button> : (
            <div className="row"><button className="btn" onClick={() => finish(false)}>Go to dashboard</button><button className="btn primary" onClick={() => finish(true)}>Start diagnostic test</button></div>
          )}
        </div>
      </div>
      <p className="small muted">Restoring from another device? <a href="#/data">Import a backup</a> instead.</p>
    </div>
  );
}

export { Seg };
