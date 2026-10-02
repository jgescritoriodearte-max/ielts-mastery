import React from "react";

/* Diagrams drawn in SVG so they work offline and in both themes. */
export function Diagram({ id }: { id: string }) {
  if (id === "rfid") return (
    <svg viewBox="0 0 420 170" className="chart" role="img" aria-label="RFID tag and reader diagram">
      <rect x="20" y="40" width="170" height="100" rx="10" fill="var(--surface-2)" stroke="var(--line-2)" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={34 + i * 8} y={54 + i * 8} width={142 - i * 16} height={72 - i * 16} rx="6" fill="none" stroke="var(--R)" strokeWidth="2" />)}
      <rect x="92" y="80" width="26" height="20" rx="3" fill="var(--ink-2)" />
      <text x="105" y="160" textAnchor="middle">RFID tag</text>
      <rect x="320" y="55" width="80" height="70" rx="8" fill="var(--surface-2)" stroke="var(--line-2)" />
      <text x="360" y="95" textAnchor="middle">reader</text>
      {[0, 1, 2].map((i) => <path key={i} d={`M${300 - i * 18},70 q-12,20 0,40`} fill="none" stroke="var(--gold)" strokeWidth="2" />)}
      <line x1="118" y1="90" x2="150" y2="20" stroke="var(--muted)" /><circle cx="150" cy="18" r="10" fill="var(--accent)" /><text x="150" y="22" textAnchor="middle" style={{ fill: "var(--accent-ink)", fontWeight: 700 }}>1</text>
      <line x1="40" y1="60" x2="30" y2="20" stroke="var(--muted)" /><circle cx="30" cy="18" r="10" fill="var(--accent)" /><text x="30" y="22" textAnchor="middle" style={{ fill: "var(--accent-ink)", fontWeight: 700 }}>2</text>
      <line x1="270" y1="90" x2="250" y2="20" stroke="var(--muted)" /><circle cx="250" cy="18" r="10" fill="var(--accent)" /><text x="250" y="22" textAnchor="middle" style={{ fill: "var(--accent-ink)", fontWeight: 700 }}>3</text>
    </svg>
  );
  if (id === "still") return (
    <svg viewBox="0 0 420 200" className="chart" role="img" aria-label="Solar still cross-section">
      <rect x="0" y="70" width="420" height="130" fill="color-mix(in srgb, var(--W) 18%, var(--surface-2))" />
      <path d="M70 70 Q210 210 350 70 Z" fill="var(--surface)" stroke="var(--line-2)" />
      <path d="M60 70 L210 120 L360 70" fill="none" stroke="var(--L)" strokeWidth="3" />
      <circle cx="210" cy="114" r="9" fill="var(--ink-2)" />
      <rect x="192" y="140" width="36" height="22" rx="3" fill="none" stroke="var(--ink-2)" strokeWidth="2.5" />
      <circle cx="40" cy="40" r="16" fill="var(--gold)" opacity=".8" /><text x="40" y="18" textAnchor="middle">sun</text>
      <line x1="120" y1="88" x2="110" y2="30" stroke="var(--muted)" /><circle cx="110" cy="26" r="10" fill="var(--accent)" /><text x="110" y="30" textAnchor="middle" style={{ fill: "var(--accent-ink)", fontWeight: 700 }}>1</text>
      <line x1="216" y1="108" x2="260" y2="30" stroke="var(--muted)" /><circle cx="262" cy="26" r="10" fill="var(--accent)" /><text x="262" y="30" textAnchor="middle" style={{ fill: "var(--accent-ink)", fontWeight: 700 }}>2</text>
      <line x1="228" y1="152" x2="320" y2="170" stroke="var(--muted)" /><circle cx="330" cy="172" r="10" fill="var(--accent)" /><text x="330" y="176" textAnchor="middle" style={{ fill: "var(--accent-ink)", fontWeight: 700 }}>3</text>
    </svg>
  );
  return null;
}

export interface MapDef { w: number; h: number; title: string; rooms: { x: number; y: number; w: number; h: number; label: string; fixed?: boolean }[]; entrance: { x: number; y: number; label: string } }
export function MapPlan({ map }: { map: MapDef }) {
  return (
    <svg viewBox={`0 0 ${map.w} ${map.h + 10}`} className="chart" role="img" aria-label={map.title} style={{ maxWidth: 460 }}>
      {map.rooms.map((r) => (
        <g key={r.label}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="6" fill={r.fixed ? "var(--surface-3)" : "var(--surface-2)"} stroke="var(--line-2)" />
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 5} textAnchor="middle" style={{ fontSize: r.fixed ? 11 : 18, fontWeight: 700, fill: r.fixed ? "var(--muted)" : "var(--ink)" }}>{r.label}</text>
        </g>
      ))}
      <path d={`M${map.entrance.x - 14},${map.entrance.y - 14} L${map.entrance.x},${map.entrance.y - 2} L${map.entrance.x + 14},${map.entrance.y - 14}`} fill="none" stroke="var(--gold)" strokeWidth="3" />
      <text x={map.entrance.x} y={map.entrance.y + 10} textAnchor="middle">{map.entrance.label}</text>
    </svg>
  );
}

/* ---------- Writing Task 1 visuals ---------- */
const PAL = ["var(--L)", "var(--W)", "var(--R)", "var(--S)", "var(--gold)", "var(--G)"];
export function TaskChart({ chart }: { chart: any }) {
  if (!chart) return null;
  if (chart.kind === "multi") return <div className="stack lg">{chart.charts.map((c: any, i: number) => <TaskChart key={i} chart={c} />)}</div>;
  if (chart.kind === "table") return (
    <div className="table-wrap"><table className="t"><thead><tr>{chart.head.map((h: string) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{chart.rows.map((r: string[], i: number) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? "num" : ""}>{c}</td>)}</tr>)}</tbody></table></div>
  );
  if (chart.kind === "process") return (
    <ol className="stack" style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
      {chart.steps.map((s: string, i: number) => (
        <li key={i} className="row" style={{ gap: 10, alignItems: "center" }}>
          <span className="qn">{i + 1}</span><span style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface-2)" }}>{s}</span>
        </li>
      ))}
    </ol>
  );
  if (chart.kind === "map") return (
    <div className="grid g2">{chart.maps.map((m: any) => (
      <div key={m.title}><div className="eyebrow" style={{ marginBottom: 6 }}>{m.title}</div>
        <svg viewBox="0 0 260 200" className="chart">{m.features.map((f: any, i: number) => (
          <g key={i}><rect x={f.x} y={f.y} width={f.w} height={f.h} rx="5" fill={f.road ? "var(--surface-3)" : "var(--surface-2)"} stroke="var(--line-2)" />
            <text x={f.x + f.w / 2} y={f.y + f.h / 2 + 4} textAnchor="middle" style={{ fill: "var(--ink-2)", fontSize: 10 }}>{f.label}</text></g>))}</svg>
      </div>))}</div>
  );
  if (chart.kind === "pie") return (
    <div className="grid g2">{chart.pies.map((p: any) => {
      const total = p.slices.reduce((a: number, s: any) => a + s.value, 0);
      let a0 = -Math.PI / 2;
      return (
        <div key={p.title} className="stack" style={{ alignItems: "center" }}>
          <div className="eyebrow">{p.title}</div>
          <svg viewBox="0 0 200 200" width="180">
            {p.slices.map((s: any, i: number) => {
              const a1 = a0 + (s.value / total) * Math.PI * 2;
              const large = a1 - a0 > Math.PI ? 1 : 0;
              const d = `M100,100 L${100 + 90 * Math.cos(a0)},${100 + 90 * Math.sin(a0)} A90,90 0 ${large} 1 ${100 + 90 * Math.cos(a1)},${100 + 90 * Math.sin(a1)} Z`;
              const mid = (a0 + a1) / 2; a0 = a1;
              return <g key={i}><path d={d} fill={PAL[i % PAL.length]} stroke="var(--surface)" strokeWidth="2" /><text x={100 + 58 * Math.cos(mid)} y={100 + 58 * Math.sin(mid) + 4} textAnchor="middle" style={{ fill: "#fff", fontWeight: 700 }}>{s.value}%</text></g>;
            })}
          </svg>
          <div className="legend">{p.slices.map((s: any, i: number) => <span key={i}><i style={{ background: PAL[i % PAL.length] }} />{s.label}</span>)}</div>
        </div>
      );
    })}</div>
  );
  const W = 560, H = 240, L = 44, B = 30, T = 12, R = 10;
  const vals = chart.series.flatMap((s: any) => s.values) as number[];
  const max = Math.ceil(Math.max(...vals) / 10) * 10 || 10;
  const sy = (v: number) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  if (chart.kind === "line") {
    const n = chart.xLabels.length;
    const sx = (i: number) => L + (i / (n - 1)) * (W - L - R);
    return (
      <div><svg viewBox={`0 0 ${W} ${H}`} className="chart">
        <g className="grid">{ticks.map((t) => <line key={t} x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} />)}</g>
        {ticks.map((t) => <text key={t} x={L - 6} y={sy(t) + 4} textAnchor="end">{t}</text>)}
        {chart.xLabels.map((x: string, i: number) => <text key={x} x={sx(i)} y={H - 8} textAnchor="middle">{x}</text>)}
        {chart.series.map((s: any, si: number) => <g key={s.name}><path d={s.values.map((v: number, i: number) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ")} fill="none" stroke={PAL[si]} strokeWidth="2.5" />{s.values.map((v: number, i: number) => <circle key={i} cx={sx(i)} cy={sy(v)} r="3.5" fill={PAL[si]} />)}</g>)}
      </svg><div className="legend">{chart.series.map((s: any, i: number) => <span key={s.name}><i style={{ background: PAL[i] }} />{s.name}</span>)}<span className="muted">Unit: {chart.unit}</span></div></div>
    );
  }
  const cats = chart.categories as string[];
  const gw = (W - L - R) / cats.length;
  const bw = (gw * 0.7) / chart.series.length;
  return (
    <div><svg viewBox={`0 0 ${W} ${H}`} className="chart">
      <g className="grid">{ticks.map((t) => <line key={t} x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} />)}</g>
      {ticks.map((t) => <text key={t} x={L - 6} y={sy(t) + 4} textAnchor="end">{t}</text>)}
      {cats.map((c, ci) => <g key={c}>
        {chart.series.map((s: any, si: number) => { const x = L + ci * gw + gw * 0.15 + si * bw; return <rect key={si} x={x} y={sy(s.values[ci])} width={bw - 2} height={H - B - sy(s.values[ci])} rx="2" fill={PAL[si]} />; })}
        <text x={L + ci * gw + gw / 2} y={H - 8} textAnchor="middle">{c}</text></g>)}
    </svg><div className="legend">{chart.series.map((s: any, i: number) => <span key={s.name}><i style={{ background: PAL[i] }} />{s.name}</span>)}<span className="muted">Unit: {chart.unit}</span></div></div>
  );
}
