import React, { useState } from "react";
import { setKV, useStore } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import { AREA_NAME, buildWeek, dailyPlan, weekKey, weights, type WeekItem, type WStatus, type Area } from "../lib/planner";
import { HBars, Icon, SKILL_COLOR } from "../ui/components";
import { TodayList } from "./Dashboard";
import { addDays, mondayOf, todayKey } from "../lib/util";

const MODES = [
  { v: "quick", label: "Quick Practice", mins: 10, desc: "5–10 minutes" },
  { v: "daily", label: "Daily Study", mins: 0, desc: "your daily minutes" },
  { v: "intensive", label: "Intensive", mins: 150, desc: "2–3 hours" },
  { v: "weakness", label: "Weakness Training", mins: 60, desc: "only your weak points" },
  { v: "revision", label: "Revision", mins: 40, desc: "review of errors" },
  { v: "speaking", label: "Speaking Practice", mins: 30, desc: "Speaking only" },
  { v: "writing", label: "Writing Lab", mins: 60, desc: "Writing only" },
  { v: "mock", label: "Mock Test", mins: 165, desc: "complete exam" },
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NEXT: Record<WStatus, WStatus> = { planned: "in progress", "in progress": "completed", completed: "skipped", skipped: "planned" };
const ROUTE: Record<Area, string> = { L: "#/listening", R: "#/reading", W: "#/writing", S: "#/speaking", V: "#/vocabulary", G: "#/grammar", X: "#/mistakes/practice", M: "#/mock" };

export function PlanPage() {
  const s = useStore();
  usePacksVersion();
  const c = getContent();
  const [mode, setMode] = useState("daily");
  const m = MODES.find((x) => x.v === mode)!;
  const mins = m.mins || s.profile.minutesDay;
  const tasks = mode === "quick" ? dailyPlan(s, c, 10).slice(0, 2).map((t) => ({ ...t, mins: 5 })) : dailyPlan(s, c, mins, mode);
  const wk = weekKey();
  const week: WeekItem[] = s.kv[wk] || buildWeek(s, c);
  const saveWeek = (w: WeekItem[]) => setKV(wk, w);
  const { w, reasons } = weights(s, c);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const monday = mondayOf();
  const done = week.filter((x) => x.status === "completed").length;
  const skillShare = (["L", "R", "W", "S", "G", "V"] as Area[]).map((k) => ({ label: AREA_NAME[k], value: w[k], color: SKILL_COLOR[k] }));
  const tw = skillShare.reduce((a, x) => a + x.value, 0);

  return (
    <>
      <div className="page-head"><div><h1>Study Plan</h1><p className="sub">Adaptive: weak skills and frequent error types get more time; skills above target get less. Recalculated after every exercise.</p></div></div>
      <div className="card stack">
        <div className="row between"><h2>Study mode</h2><span className="small muted">{m.desc}</span></div>
        <div className="row">{MODES.map((x) => <button key={x.v} className={"btn sm" + (mode === x.v ? " primary" : "")} onClick={() => setMode(x.v)}>{x.label}</button>)}</div>
        <div className="divider" />
        <h3>Today's study — {m.label}</h3>
        <TodayList tasks={tasks} />
      </div>
      <div className="card stack">
        <div className="row between"><div><h2>This week</h2><span className="small muted">Week of {monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {done}/{week.length} completed · click an item to change its status</span></div>
          <button className="btn sm" onClick={() => saveWeek(buildWeek(s, c))}><Icon name="refresh" />Rebuild from latest results</button></div>
        <div className="week">
          {DAYS.map((d, i) => (
            <div key={d} className={"day" + (i === todayIdx ? " today" : "")}>
              <div className="row between"><b className="small">{d}</b><span className="tiny muted">{addDays(monday, i).getDate()}</span></div>
              {week.filter((x) => x.day === i).map((it) => (
                <div key={it.id} className="stack" style={{ gap: 3 }}>
                  <button className={"witem " + (it.status === "completed" ? "completed" : it.status === "skipped" ? "skipped" : it.status === "in progress" ? "inprog" : "")}
                    onClick={() => saveWeek(week.map((x) => (x.id === it.id ? { ...x, status: NEXT[x.status] } : x)))} title="Change status">
                    <span className="st">{it.status}</span><span><span style={{ color: SKILL_COLOR[it.area], fontWeight: 700 }}>{AREA_NAME[it.area]}</span></span><span className="tiny muted">{it.label}</span>
                  </button>
                  {i === todayIdx && it.status !== "completed" && <a className="tiny" href={ROUTE[it.area]}>Open →</a>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="card"><div className="card-head"><h2>Why the plan looks like this</h2><span className="small muted">relative weight of each area</span></div>
        <HBars rows={skillShare.map((x) => ({ ...x, value: x.value / tw }))} max={Math.max(...skillShare.map((x) => x.value / tw))} fmt={(v) => Math.round(v * 100) + "%"} />
        <div className="stack" style={{ marginTop: 12 }}>{Object.entries(reasons).map(([k, r]) => <p key={k} className="small"><b>{AREA_NAME[k as Area]}:</b> {r}</p>)}</div>
        <p className="tiny muted" style={{ marginTop: 8 }}>Today: {todayKey()}</p>
      </div>
    </>
  );
}
