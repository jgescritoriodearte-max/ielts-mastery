import React from "react";
import { saveProfile, saveSettings, useStore } from "../lib/store";
import { applyTheme } from "../lib/theme";
import { BandSelect, Seg } from "../ui/components";
import { SKILL_NAME, type Skill } from "../lib/types";
import { speak } from "../lib/tts";
import { AREA_LABEL, CORE, DEFAULT_PRIORS, PRIOR_LEVELS, priorsOf } from "../lib/engine";

export function SettingsPage() {
  const s = useStore();
  const p = s.profile, st = s.settings;
  return (
    <>
      <div className="page-head"><div><h1>Settings</h1><p className="sub">Changes are saved immediately on this device.</p></div><a className="btn" href="#/onboarding">Run setup again</a></div>
      <div className="grid g2">
        <div className="card stack">
          <h2>Profile & goal</h2>
          <label className="field">Name<input type="text" value={p.name} onChange={(e) => saveProfile({ name: e.target.value })} /></label>
          <label className="field">Exam<Seg value={p.exam} onChange={(v) => saveProfile({ exam: v })} options={[{ v: "academic", label: "Academic" }, { v: "gt", label: "General Training" }]} /></label>
          <div className="grid g2">
            <label className="field">Overall target<BandSelect value={p.target} allowEmpty={false} min={4} onChange={(v) => saveProfile({ target: v ?? 7 })} /></label>
            <label className="field">Exam date<input type="date" value={p.examDate} onChange={(e) => saveProfile({ examDate: e.target.value })} /></label>
          </div>
          <div className="grid g4">{(["L", "R", "W", "S"] as Skill[]).map((k) => <label key={k} className="field">{SKILL_NAME[k]} target<BandSelect value={p.skillTargets[k]} allowEmpty={false} min={4} onChange={(v) => saveProfile({ skillTargets: { ...p.skillTargets, [k]: v ?? p.target } })} /></label>)}</div>
          <div className="grid g2">
            <label className="field">Hours per week<input type="number" min={1} max={60} value={p.hoursWeek} onChange={(e) => saveProfile({ hoursWeek: Number(e.target.value) })} /></label>
            <label className="field">Minutes per day<input type="number" min={10} max={300} step={5} value={p.minutesDay} onChange={(e) => saveProfile({ minutesDay: Number(e.target.value) })} /></label>
          </div>
          <h3>Study priorities</h3>
          <p className="small muted">Starting importance of each area for the adaptive engine. It is only a starting point: as the app collects real results, the data gradually overrules these choices (and the next biggest weakness rises when one improves). Project estimates, not research results.</p>
          <div className="grid g2">{CORE.map((k) => <label key={k} className="field">{AREA_LABEL[k]}<select value={String(priorsOf(s)[k])} onChange={(e) => saveProfile({ priors: { ...(p.priors || {}), [k]: Number(e.target.value) } })}>{PRIOR_LEVELS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}</select></label>)}</div>
          <button className="btn sm ghost" style={{ alignSelf: "flex-start" }} onClick={() => saveProfile({ priors: { ...DEFAULT_PRIORS } })}>Reset to my profile (Writing → Grammar/Listening → Reading/Speaking)</button>
        </div>
        <div className="stack lg">
          <div className="card stack">
            <h2>Audio</h2>
            <label className="field">Device voice accent<span className="hint">Used when pre-produced audio is not available, and for drills.</span>
              <select value={st.accent} onChange={(e) => saveSettings({ accent: e.target.value as any })}><option value="gb">British</option><option value="us">American</option><option value="au">Australian</option><option value="any">Any English voice</option></select></label>
            <label className="field">Device voice speed<select value={st.ttsRate} onChange={(e) => saveSettings({ ttsRate: Number(e.target.value) })}><option value={0.85}>Slower</option><option value={1}>Normal</option><option value={1.15}>Fast</option></select></label>
            <button className="btn sm" style={{ alignSelf: "flex-start" }} onClick={() => speak("This is the device voice used when no pre-produced audio is available.", st.accent, st.ttsRate)}>Test device voice</button>
          </div>
          <div className="card stack">
            <h2>App</h2>
            <label className="field">Theme<Seg value={st.theme} onChange={async (v) => { await saveSettings({ theme: v }); applyTheme(); }} options={[{ v: "system", label: "System" }, { v: "light", label: "Light" }, { v: "dark", label: "Dark" }]} /></label>
            <label className="field">Language of explanations in Claude prompts<select value={st.explainLang} onChange={(e) => saveSettings({ explainLang: e.target.value as any })}><option value="pt">Português (Brasil)</option><option value="en">English</option></select></label>
            <label className="field">Backup reminder every<select value={st.backupReminderDays} onChange={(e) => saveSettings({ backupReminderDays: Number(e.target.value) })}>{[3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} days</option>)}</select></label>
            <label className="check"><input type="checkbox" checked={st.autoDownload} onChange={(e) => saveSettings({ autoDownload: e.target.checked })} />Download essential packs and updates automatically when online</label>
            <label className="check"><input type="checkbox" checked={st.examMode} onChange={(e) => saveSettings({ examMode: e.target.checked })} />Start mock tests in Real IELTS Simulation mode</label>
          </div>
        </div>
      </div>
      <div className="card stack">
        <h2>About</h2>
        <h3>Privacy</h3>
        <p className="small"><b>Your study data is stored locally on this device. Nothing is uploaded automatically.</b> Essays, recordings, results, vocabulary, mistakes and your profile stay in this browser (IndexedDB). The app only downloads its own content packs from the site it was installed from.</p>
        <p className="small">Claude is an external service. “Copy to Claude” only copies text to your clipboard; content reaches Claude only if you decide to paste it there yourself. The optional live transcription in Speaking uses the browser's own speech service (in Chrome this sends audio to Google) and runs only when you tick that option.</p>
        <h3>About & IELTS disclaimer</h3>
        <p className="small">IELTS Mastery is a personal study tool. It is not affiliated with, endorsed by or connected to IELTS, the British Council, IDP or Cambridge University Press & Assessment, and it does not provide official IELTS assessment. All exercises are AI-generated IELTS-style practice written with Claude for this app, not official IELTS material. Every score in the app is an estimate based on IELTS-style criteria, not an official IELTS score.</p>
      </div>
    </>
  );
}
