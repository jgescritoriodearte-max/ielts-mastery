import React, { useState } from "react";
import { useStore } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import { dayTotals, estimates, grammarAccuracy, overallSeries, skillSeries, streaks, SOURCE_LABEL } from "../lib/stats";
import { readiness, READINESS_NOTE } from "../lib/readiness";
import { achievements } from "../lib/achievements";
import { liveBands } from "./Mock";
import { Bar, ColumnChart, Disclaimer, Empty, LineChart, Seg, SKILL_COLOR, type Series } from "../ui/components";
import { fmtBand } from "../lib/bands";
import { addDays, dateFromKey, fmtMins, mondayOf, todayKey } from "../lib/util";
import { SKILL_NAME, type Skill } from "../lib/types";

type Range = "week" | "month" | "all";

export function ProgressPage() {
  const s = useStore();
  usePacksVersion();
  const c = getContent();
  const [range, setRange] = useState<Range>("month");
  const since = range === "week" ? Date.now() - 7 * 864e5 : range === "month" ? Date.now() - 30 * 864e5 : 0;
  const cut = (pts: { x: number; y: number; ext?: boolean }[]) => pts.filter((p) => p.x >= since);
  const e = estimates(s);
  const ext = s.external;
  const extPts = (k: Skill | "overall") => ext.filter((x) => x[k] != null).map((x) => ({ x: dateFromKey(x.date).getTime() + 12 * 3600e3, y: x[k] as number, ext: true }));

  const overall: Series[] = [
    { name: "Overall (app estimate)", color: "var(--accent)", points: cut(overallSeries(s).map((p) => ({ x: p.ts, y: p.v }))) },
    ...(ext.length ? [{ name: "External Test", color: "var(--gold)", points: cut(extPts("overall")), dashed: true }] : []),
  ];
  const skills: Series[] = (["L", "R", "W", "S"] as Skill[]).map((k) => ({ name: SKILL_NAME[k], color: SKILL_COLOR[k], points: cut([...skillSeries(s, k).map((p) => ({ x: p.ts, y: p.v })), ...extPts(k)]) }));

  // daily series
  const nDays = range === "week" ? 7 : range === "month" ? 30 : Math.max(30, Math.min(365, Object.keys(dayTotals(s)).length ? Math.ceil((Date.now() - dateFromKey(Object.keys(dayTotals(s)).sort()[0]).getTime()) / 864e5) + 1 : 30));
  const days = Array.from({ length: nDays }, (_, i) => todayKey(addDays(new Date(), i - nDays + 1)));
  const totals = dayTotals(s);
  const weekly = range === "all" && nDays > 60;
  const bucket = (k: string) => (weekly ? todayKey(mondayOf(dateFromKey(k))) : k);
  const agg = (f: (k: string) => number) => { const m: Record<string, number> = {}; for (const d of days) m[bucket(d)] = (m[bucket(d)] || 0) + f(d); return Object.entries(m).map(([k, v]) => ({ label: weekly ? dateFromKey(k).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : String(dateFromKey(k).getDate()), value: v })); };
  const hours = agg((d) => (totals[d]?.minutes || 0) / 60);
  const exercises = agg((d) => s.attempts.filter((a) => todayKey(new Date(a.ts)) === d).length);
  const accPts = (skill: string) => {
    const m: Record<string, [number, number]> = {};
    for (const a of s.attempts) if (a.skill === skill && a.ts >= since && a.kind !== "mistakes") { const d = todayKey(new Date(a.ts)); const o = m[d] || [0, 0]; m[d] = [o[0] + a.correct, o[1] + a.total]; }
    return Object.entries(m).map(([d, [x, n]]) => ({ x: dateFromKey(d).getTime() + 12 * 3600e3, y: Math.round((100 * x) / n) }));
  };
  const accuracy: Series[] = [{ name: "Listening", color: "var(--L)", points: accPts("L") }, { name: "Reading", color: "var(--R)", points: accPts("R") }, { name: "Grammar", color: "var(--G)", points: accPts("G") }, { name: "Vocabulary", color: "var(--V)", points: accPts("V") }].filter((x) => x.points.length);
  const firsts = Object.values(s.vocab).map((v) => v.first || v.lastTs).filter(Boolean).sort((a, b) => a - b);
  const vocabGrowth = firsts.map((t, i) => ({ x: t, y: i + 1 })).filter((p, i, a) => i === a.length - 1 || todayKey(new Date(p.x)) !== todayKey(new Date(a[i + 1].x)));
  const st = streaks(s);
  const rd = readiness(s, c);
  const ach = achievements(s, c);
  const g = grammarAccuracy(s, since).total;

  // heatmap: last 20 weeks
  const start = addDays(mondayOf(), -19 * 7);
  const heat = Array.from({ length: 20 * 7 }, (_, i) => { const d = todayKey(addDays(start, i)); const m = totals[d]?.minutes || 0; return { d, m, future: d > todayKey() }; });

  return (
    <>
      <div className="page-head"><div><h1>Progress</h1><p className="sub">Everything is calculated on this device. External tests appear as hollow gold markers.</p></div>
        <Seg value={range} onChange={setRange} options={[{ v: "week", label: "Week" }, { v: "month", label: "Month" }, { v: "all", label: "All time" }]} /></div>

      <div className="grid g2">
        <div className="card stack">
          <div className="card-head"><h2>Target tracker</h2><span className="small muted">overall</span></div>
          <div className="row" style={{ gap: 28 }}>
            <div><div className="eyebrow">Current</div><div className="band-mid">{fmtBand(e.overall)}</div></div>
            <div><div className="eyebrow">Target</div><div className="band-mid" style={{ color: "var(--gold)" }}>{s.profile.target.toFixed(1)}</div></div>
            <div><div className="eyebrow">Gap</div><div className="band-mid">{e.overall == null ? "–" : Math.max(0, s.profile.target - e.overall).toFixed(1)}</div></div>
          </div>
          {(["L", "R", "W", "S"] as Skill[]).map((k) => { const t = s.profile.skillTargets?.[k] ?? s.profile.target; const b = e[k].band; return (
            <p key={k} className="small">{b == null ? <><b>{SKILL_NAME[k]}</b>: no estimate yet.</> : b >= t ? <><b>{SKILL_NAME[k]}</b> {fmtBand(b)} — at or above its target ({t}).</> : <><b>{SKILL_NAME[k]}</b> {fmtBand(b)} needs <b>+{(t - b).toFixed(1)}</b> to reach {t}.</>} <span className="muted">{e[k].source ? `(${SOURCE_LABEL[e[k].source!]})` : ""}</span></p>); })}
          <Disclaimer />
        </div>
        <div className="card stack">
          <div className="card-head"><h2>IELTS Readiness</h2><span className="chip accent">{rd.category}</span></div>
          <div className="band-mid num">{rd.score}%</div>
          {rd.parts.map((p) => <div key={p.key} className="stack" style={{ gap: 3 }}><div className="row between small"><span>{p.label} <span className="muted">({Math.round(p.weight * 100)}%)</span></span><span className="num">{Math.round(p.value * 100)}%</span></div><Bar value={p.value} color="var(--gold)" /><span className="tiny muted">{p.note}</span></div>)}
          <p className="tiny muted">{READINESS_NOTE} Categories: Foundation · Developing · Approaching Target · Consistently Near Target.</p>
        </div>
      </div>

      <div className="card"><div className="card-head"><h2>Overall band evolution</h2></div><LineChart series={overall} yMin={3} yMax={9} target={s.profile.target} /></div>
      <div className="card"><div className="card-head"><h2>Listening · Reading · Writing · Speaking</h2></div><LineChart series={skills} yMin={3} yMax={9} target={s.profile.target} /></div>
      <div className="grid g2">
        <div className="card"><div className="card-head"><h2>Study hours</h2><span className="small muted">total {(st.totalMin / 60).toFixed(1)} h{weekly ? " · per week" : " · per day"}</span></div><ColumnChart data={hours} fmt={(v) => v.toFixed(1)} /></div>
        <div className="card"><div className="card-head"><h2>Exercises completed</h2><span className="small muted">{s.attempts.length} in total</span></div><ColumnChart data={exercises} color="var(--R)" /></div>
        <div className="card"><div className="card-head"><h2>Accuracy</h2><span className="small muted">% correct per day</span></div><LineChart series={accuracy} yMin={0} yMax={100} fmtY={(v) => v + "%"} /></div>
        <div className="card"><div className="card-head"><h2>Vocabulary growth</h2><span className="small muted">words studied</span></div><LineChart series={[{ name: "Words", color: "var(--V)", points: vocabGrowth }]} yMin={0} /></div>
        <div className="card stack"><div className="card-head"><h2>Grammar accuracy</h2></div><div className="band-mid num">{g[1] ? Math.round((100 * g[0]) / g[1]) + "%" : "–"}</div><span className="small muted">{g[0]}/{g[1]} correct in this period</span></div>
        <div className="card stack"><div className="card-head"><h2>Mock tests</h2><span className="small muted">{s.mocks.length} app · {ext.length} external</span></div>
          {s.mocks.length + ext.length ? <div className="table-wrap"><table className="t"><tbody>
            {s.mocks.map((m) => <tr key={m.id}><td className="small">{new Date(m.ts).toLocaleDateString("en-GB")}</td><td>{m.title}</td><td className="num"><b>{fmtBand(liveBands(m).overall)}</b></td></tr>)}
            {ext.map((x) => <tr key={x.id}><td className="small">{dateFromKey(x.date).toLocaleDateString("en-GB")}</td><td>{x.name} <span className="chip gold">External Test</span></td><td className="num"><b>{fmtBand(x.overall)}</b></td></tr>)}
          </tbody></table></div> : <Empty>No tests yet.</Empty>}</div>
      </div>

      <div className="card stack">
        <div className="card-head"><h2>Study streak</h2><span className="small muted">last 20 weeks</span></div>
        <div className="kpis">
          <div className="kpi"><div className="eyebrow">Current streak</div><div className="v num">{st.current} d</div></div>
          <div className="kpi"><div className="eyebrow">Longest streak</div><div className="v num">{st.longest} d</div></div>
          <div className="kpi"><div className="eyebrow">Study days this month</div><div className="v num">{st.daysThisMonth}</div></div>
          <div className="kpi"><div className="eyebrow">Hours studied</div><div className="v num">{(st.totalMin / 60).toFixed(1)}</div></div>
          <div className="kpi"><div className="eyebrow">Exercises</div><div className="v num">{s.attempts.length}</div></div>
        </div>
        <div className="heat" role="img" aria-label="Study calendar">{heat.map((h) => <i key={h.d} title={`${h.d}: ${fmtMins(h.m)}`} className={h.future ? "" : h.m >= 60 ? "l3" : h.m >= 25 ? "l2" : h.m >= 5 ? "l1" : ""} style={h.future ? { opacity: 0.3 } : undefined} />)}</div>
        <p className="tiny muted">A day counts for the streak with at least 5 minutes of study or one completed exercise.</p>
      </div>

      <div className="card stack"><div className="card-head"><h2>Achievements</h2><span className="small muted">{ach.filter((a) => a.done).length}/{ach.length}</span></div>
        <div className="grid g-auto">{ach.map((a) => <div key={a.id} className={"ach" + (a.done ? " done" : "")}><div className="medal">{a.done ? "★" : "☆"}</div><div><b>{a.title}</b><div className="small muted">{a.desc}</div>{a.progress && <div className="tiny num muted">{a.progress}</div>}</div></div>)}</div></div>
    </>
  );
}
