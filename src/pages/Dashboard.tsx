import React from "react";
import { useStore, setKV } from "../lib/store";
import { getContent, usePacksVersion } from "../lib/packs";
import { estimates, SOURCE_LABEL, streaks, vocabCounts } from "../lib/stats";
import { AREA_NAME, dailyPlan, doneToday, recommendations, type PlanTask } from "../lib/planner";
import { readiness, READINESS_NOTE } from "../lib/readiness";
import { BandRuler, Disclaimer, Icon, SKILL_COLOR, Bar } from "../ui/components";
import { fmtBand } from "../lib/bands";
import { daysBetween, dateFromKey, fmtMins, todayKey } from "../lib/util";
import { SKILL_NAME, type Skill } from "../lib/types";

export function TodayList({ tasks, compact }: { tasks: PlanTask[]; compact?: boolean }) {
  const s = useStore();
  const done = doneToday(s);
  const manual: string[] = s.kv["done:" + todayKey()] || [];
  const used: Record<string, number> = { ...done };
  const isDone = (t: PlanTask) => {
    if (manual.includes(t.id)) return true;
    if ((used[t.area] || 0) >= t.mins * 0.8) { used[t.area] -= t.mins; return true; }
    return false;
  };
  const toggle = (t: PlanTask) => setKV("done:" + todayKey(), manual.includes(t.id) ? manual.filter((x) => x !== t.id) : [...manual, t.id]);
  const total = tasks.reduce((a, t) => a + t.mins, 0);
  return (
    <div>
      {tasks.map((t) => {
        const d = isDone(t);
        return (
          <div key={t.id} className={"task" + (d ? " done" : "")}>
            <button className={"tick" + (d ? " done" : "")} onClick={() => toggle(t)} aria-label={d ? "Mark not done" : "Mark done"}>{d && <Icon name="check" size={14} />}</button>
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}><span className="dot" style={{ width: 8, height: 8, borderRadius: 4, background: SKILL_COLOR[t.area] }} /><span className="title">{AREA_NAME[t.area]} — {t.mins} min</span></div>
              {!compact && <div className="small muted">{t.title}. {t.why}</div>}
            </div>
            <a className="btn sm" href={t.route}>Start</a>
          </div>
        );
      })}
      <div className="row between" style={{ marginTop: 10 }}><span className="small muted">Total</span><b className="num">{fmtMins(total)}</b></div>
    </div>
  );
}

export function Dashboard() {
  const s = useStore();
  usePacksVersion();
  const c = getContent();
  const e = estimates(s);
  const st = streaks(s);
  const tasks = dailyPlan(s, c);
  const recs = recommendations(s, c);
  const rd = readiness(s, c);
  const vc = vocabCounts(s, c.vocab.map((v) => v.id));
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const days = s.profile.examDate ? daysBetween(new Date(), dateFromKey(s.profile.examDate)) : null;
  const skillPart = rd.parts.find((p) => p.key === "skills")!;
  const pendingAi = s.writings.filter((w) => w.status === "submitted" && !w.ai).length + s.recordings.filter((r) => r.part > 0 && !r.ai && r.transcript.trim()).length;
  const anyKnown = (["L", "R", "W", "S"] as Skill[]).some((k) => e[k].band != null);
  const weakest = (["L", "R", "W", "S"] as Skill[]).map((k) => ({ k, gap: e[k].band == null ? (anyKnown ? -9 : 0) : (s.profile.skillTargets?.[k] ?? s.profile.target) - (e[k].band as number), known: e[k].band != null })).sort((a, b) => b.gap - a.gap)[0];
  const ext = s.external.length;
  const ROUTE_OF: Record<string, string> = { L: "#/listening", R: "#/reading", W: "#/writing", S: "#/speaking" };
  const mainRec = recs.find((r) => r.route.startsWith(ROUTE_OF[weakest.k])) || recs[0];
  const otherRecs = recs.filter((r) => r !== mainRec);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">IELTS Master Dashboard</p>
          <h1>{greet}, {s.profile.name || "there"}.</h1>
          <p className="sub">IELTS {s.profile.exam === "gt" ? "General Training" : "Academic"} · target band {s.profile.target.toFixed(1)}{days != null && days >= 0 ? ` · ${days} days to your exam (${dateFromKey(s.profile.examDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})` : ""}</p>
        </div>
        {!s.attempts.some((a) => a.kind === "diagnostic") && <a className="btn primary" href="#/mock/diagnostic"><Icon name="flag" />Take the diagnostic test</a>}
      </div>

      <div className="grid g3">
        <div className="card raised pad-lg span2 stack">
          <div className="row between">
            <div><div className="eyebrow">Current overall (estimated)</div><div className="row" style={{ alignItems: "baseline", gap: 14 }}><span className="band-big">{fmtBand(e.overall)}</span><span className="muted">→ target <b style={{ color: "var(--gold)" }}>{s.profile.target.toFixed(1)}</b>{e.overall != null && <> · gap {Math.max(0, s.profile.target - e.overall).toFixed(1)}</>}</span></div></div>
            <div style={{ minWidth: 160 }}><div className="eyebrow">Progress to target</div><div className="band-mid num">{Math.round(skillPart.value * 100)}%</div><Bar value={skillPart.value} /></div>
          </div>
          {e.overall == null && <p className="small muted">The overall band appears once all four skills have data. Missing: {(["L", "R", "W", "S"] as Skill[]).filter((k) => e[k].band == null).map((k) => SKILL_NAME[k]).join(", ")}.</p>}
          <div className="divider" />
          <h3>Skill performance</h3>
          {(["L", "R", "W", "S"] as Skill[]).map((k) => (
            <div key={k} className="skill-row">
              <span className="name"><span style={{ width: 9, height: 9, borderRadius: 3, background: SKILL_COLOR[k], display: "inline-block" }} />{SKILL_NAME[k]}</span>
              <div><BandRuler band={e[k].band} target={s.profile.skillTargets?.[k] ?? s.profile.target} color={SKILL_COLOR[k]} />
                <div className="tiny muted">{e[k].source ? SOURCE_LABEL[e[k].source!] + (e[k].source === "app" ? ` · ${e[k].n} questions` : e[k].n ? ` · ${e[k].n} tasks` : "") : k === "W" || k === "S" ? "Submit a task and self-assess or import Claude feedback" : "Complete at least 10 questions"}</div></div>
              <span className="val">{fmtBand(e[k].band)}</span>
            </div>
          ))}
          <Disclaimer />
        </div>

        <div className="stack lg">
          <div className="card stack">
            <div className="row between"><h3>Today's study</h3><a className="small" href="#/plan">Plan</a></div>
            <TodayList tasks={tasks} compact />
          </div>
          <div className="card stack">
            <div className="eyebrow">IELTS Readiness</div>
            <div className="row" style={{ alignItems: "baseline" }}><span className="band-mid num">{rd.score}%</span><span className="chip accent">{rd.category}</span></div>
            <Bar value={rd.score / 100} color="var(--gold)" />
            <p className="tiny muted">{READINESS_NOTE}</p>
          </div>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="eyebrow">Study streak</div><div className="v num">{st.current} {st.current === 1 ? "day" : "days"}</div><div className="s">Longest {st.longest} · {st.daysThisMonth} days this month</div></div>
        <div className="kpi"><div className="eyebrow">Study hours</div><div className="v num">{(st.totalMin / 60).toFixed(1)} h</div><div className="s">Today {fmtMins(st.todayMin)}</div></div>
        <div className="kpi"><div className="eyebrow">Exercises completed</div><div className="v num">{s.attempts.length}</div><div className="s">{s.attempts.reduce((a, x) => a + x.total, 0)} questions answered</div></div>
        <div className="kpi"><div className="eyebrow">Mock tests</div><div className="v num">{s.mocks.length}</div><div className="s">{ext ? `+ ${ext} external test${ext > 1 ? "s" : ""}` : "App mock tests"}</div></div>
        <div className="kpi"><div className="eyebrow">Vocabulary</div><div className="v num">{vc.learned}</div><div className="s">{vc.due} due today · {vc.Mastered} mastered</div></div>
      </div>

      <div className="grid g2">
        <div className="card stack">
          <div className="eyebrow">Your biggest weakness</div>
          {weakest.known ? <h2>{SKILL_NAME[weakest.k]} — {fmtBand(e[weakest.k].band)} vs {(s.profile.skillTargets?.[weakest.k] ?? s.profile.target).toFixed(1)}</h2> : <h2>{SKILL_NAME[weakest.k]} — no data yet</h2>}
          {mainRec ? <><p>{mainRec.text}</p><div className="callout accent"><Icon name="arrow" /><div style={{ flex: 1 }}><b>Recommended session:</b> {mainRec.action}</div><a className="btn sm primary" href={mainRec.route}>Start</a></div></>
            : <p className="muted">Practise for a few days and the app will detect patterns in your errors.</p>}
        </div>
        <div className="card stack">
          <div className="row between"><h3>You should study this</h3><span className="small muted">from your results</span></div>
          {otherRecs.slice(0, 4).map((r, i) => (
            <div key={i} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
              <span className={"chip " + (r.level === "high" ? "bad" : r.level === "medium" ? "warn" : "")}>{r.level === "high" ? "Priority" : r.level === "medium" ? "Next" : "Tip"}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div className="small">{r.text}</div><a className="small" href={r.route}>{r.action}</a></div>
            </div>
          ))}
          {otherRecs.length === 0 && <p className="small muted">No other alerts right now.</p>}
          {pendingAi > 0 && <div className="callout"><Icon name="ai" /><div style={{ flex: 1 }} className="small">{pendingAi} task(s) can get optional Claude feedback when you are online.</div><a className="btn sm" href="#/ai">Open</a></div>}
        </div>
      </div>
    </>
  );
}
