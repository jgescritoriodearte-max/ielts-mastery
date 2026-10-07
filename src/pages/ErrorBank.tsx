import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { classify, load, RECUR_MIN, RECUR_WINDOW_DAYS, CONSOLIDATED_STREAK, QUIET_DAYS, WEAK_STREAK, HALF_LIFE_DAYS } from "../lib/errorbank";
import { catDef, catLabel } from "../lib/taxonomy";
import { fmtDate } from "../lib/util";
import { Empty, HBars } from "../ui/components";

const AREAS: [string, string][] = [["All", "All skills"], ["W", "Writing"], ["G", "Grammar"], ["L", "Listening"], ["R", "Reading"], ["S", "Speaking"], ["V", "Vocabulary"]];
const STATUS_CHIP: Record<string, string> = { weak: "bad", developing: "warn", consolidated: "good" };

/** Error Bank: one row per error CATEGORY (shared by Writing, Grammar, Listening, Reading, Vocabulary and Speaking). */
export function ErrorBankPage() {
  const s = useStore();
  const [area, setArea] = useState("All");
  const [showDone, setShowDone] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const now = Date.now();
  const rows = useMemo(() => Object.values(s.errors).map((st) => {
    const cls = classify(st, now), def = catDef(st.cat);
    const openM = s.mistakes.filter((m) => !m.resolved && m.cat === st.cat).length;
    return { st, cls, def, L: load(st, now), openM };
  }).sort((a, b) => b.L * b.def.sev - a.L * a.def.sev), [s.errors, s.mistakes]);
  const shown = rows.filter((r) => (area === "All" || r.def.areas.includes(area as any)) && (showDone || r.cls.status !== "consolidated"));
  const count = (f: (r: typeof rows[number]) => boolean) => rows.filter(f).length;
  const lis = rows.filter((r) => r.def.id.startsWith("ls.") && r.st.total > 0);
  return (
    <>
      <div className="page-head"><div><h1>Error Bank</h1>
        <p className="sub">Every wrong answer, from every skill, is filed under one error category. The bank tells occasional from recurring errors and shows when one is really fixed. It feeds the review schedule and the study recommendations.</p></div>
        <div className="row"><a className="btn" href="#/mistakes">My Mistakes (individual items)</a><a className="btn primary" href="#/produce">Production Lab</a></div></div>
      <div className="kpis">
        <div className="kpi"><div className="eyebrow">Categories with errors</div><div className="v num">{rows.length}</div></div>
        <div className="kpi"><div className="eyebrow">Weak (recurring)</div><div className="v num" style={{ color: "var(--bad)" }}>{count((r) => r.cls.status === "weak")}</div></div>
        <div className="kpi"><div className="eyebrow">Developing</div><div className="v num">{count((r) => r.cls.status === "developing")}</div></div>
        <div className="kpi"><div className="eyebrow">Consolidated</div><div className="v num" style={{ color: "var(--good)" }}>{count((r) => r.cls.status === "consolidated")}</div></div>
        <div className="kpi"><div className="eyebrow">Came back after improving</div><div className="v num">{count((r) => r.cls.relapsed)}</div></div>
      </div>
      {lis.length > 0 && (
        <div className="card stack"><div className="row between"><h3>Listening: why I miss answers</h3><span className="small muted">recency-weighted</span></div>
          <HBars rows={lis.sort((a, b) => b.L - a.L).slice(0, 8).map((r) => ({ label: r.def.label.replace("Listening: ", ""), value: Math.round(r.L * 10) / 10, color: "var(--L)" }))} fmt={(v) => `${v}`} />
          <p className="tiny muted">Change the cause of a Listening miss in My Mistakes (“why did I miss it?”): the error moves to the right category.</p></div>
      )}
      <div className="card stack">
        <div className="row between"><h2>Categories</h2>
          <div className="row"><select value={area} onChange={(e) => setArea(e.target.value)} style={{ width: "auto" }} aria-label="Skill">{AREAS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <label className="check"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />Show consolidated</label></div></div>
        {shown.length ? <div className="table-wrap"><table className="t"><thead><tr><th>Category</th><th>Status</th><th>Pattern</th><th>{RECUR_WINDOW_DAYS} days</th><th>Total</th><th>Correct in a row</th><th>Last error</th><th /></tr></thead><tbody>
          {shown.map(({ st, cls, def, openM }) => (
            <React.Fragment key={st.id}>
              <tr>
                <td><b>{def.label}</b><div className="tiny muted">{def.group} · {def.areas.join("/")}</div></td>
                <td><span className={"chip " + STATUS_CHIP[cls.status]}>{cls.status}</span></td>
                <td className="small">{cls.recurring ? "recurring" : "occasional"}{cls.relapsed ? " · relapse" : ""}</td>
                <td className="num">{cls.recent}</td><td className="num">{st.total}</td><td className="num">{st.streak}</td>
                <td className="num small">{st.last ? fmtDate(st.last) : "–"}</td>
                <td><div className="row" style={{ gap: 6 }}>
                  {openM > 0 && <a className="btn sm" href={`#/mistakes/practice?cat=${encodeURIComponent(st.cat)}`}>Drill ({openM})</a>}
                  <a className="btn sm primary" href={`#/produce?cat=${encodeURIComponent(st.cat)}`}>Produce</a>
                  {st.ex.length > 0 && <button className="btn sm ghost" onClick={() => setOpen(open === st.id ? null : st.id)}>{open === st.id ? "Hide" : "Examples"}</button>}</div></td>
              </tr>
              {open === st.id && <tr><td colSpan={8}><div className="stack" style={{ gap: 6 }}>{st.ex.slice().reverse().map((e, i) => <div key={i} className="small"><span style={{ color: "var(--bad)" }}>{e.a || "(blank)"}</span>{e.b && <> → <span style={{ color: "var(--good)" }}>{e.b}</span></>}</div>)}</div></td></tr>}
            </React.Fragment>
          ))}
        </tbody></table></div> : <Empty>{rows.length ? "Nothing here with these filters." : "No errors recorded yet. They appear automatically as you practise, write and import feedback."}</Empty>}
      </div>
      <div className="card stack">
        <h3>How the bank decides</h3>
        <p className="small"><b>Recurring</b> = at least {RECUR_MIN} errors in the last {RECUR_WINDOW_DAYS} days. <b>Weak</b> = recurring and fewer than {WEAK_STREAK} correct answers in a row since. <b>Consolidated</b> = {CONSOLIDATED_STREAK} correct in a row and no error for {QUIET_DAYS} days; if the error returns, it is marked as a relapse. Older errors count less (they lose half their weight every {HALF_LIFE_DAYS} days).</p>
        <p className="tiny muted">PROJECT ESTIMATES: these thresholds are design choices, not research results. They are constants in <code>src/lib/errorbank.ts</code> and can be recalibrated with your own data. Only the general principles (retrieval practice, spaced re-checks, feedback) are research-backed.</p>
      </div>
    </>
  );
}
