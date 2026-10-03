import React, { useEffect, useRef, useState } from "react";
import { BAND_SCALE, DISCLAIMER, fmtBand } from "../lib/bands";
import { fmtClock, fmtShort } from "../lib/util";

/* ---------- icons (inline, offline) ---------- */
const P: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  plan: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 12h3M8 16h6",
  listen: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1zM20 14h-3v6h2a1 1 0 0 0 1-1z",
  read: "M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z",
  write: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  speak: "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  vocab: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6",
  grammar: "M5 6h14M5 12h9M5 18h12",
  mock: "M9 3h6M10 3v3M14 3v3M5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM9 12l2 2 4-4",
  mistakes: "M12 4l9 16H3zM12 10v4M12 17v.5",
  progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  ai: "M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z",
  library: "M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-1 2.5 15.5-3.5 1z",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.6-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.6 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 .3 1.8",
  bank: "M3 6h18M3 12h18M3 18h12",
  menu: "M4 6h16M4 12h16M4 18h16",
  play: "M7 4l13 8-13 8z", pause: "M7 4h4v16H7zM13 4h4v16h-4z", stop: "M6 6h12v12H6z",
  rec: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z", check: "M5 12l5 5 9-10", x: "M6 6l12 12M18 6L6 18",
  copy: "M8 8h11v13H8zM5 16V3h11", ext: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  download: "M12 4v12M6 11l6 6 6-6M4 20h16", upload: "M12 20V8M6 13l6-6 6 6M4 4h16", trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7", clock: "M12 7v5l3 2M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5", wifi: "M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01",
  star: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  para: "M4 7h9M4 12h16M4 17h9M16 5l3 2-3 2M16 15l3 2-3 2", book: "M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z",
  arrow: "M5 12h14M13 6l6 6-6 6", back: "M19 12H5M11 18l-6-6 6-6", info: "M12 8v.5M11 12h1v5h1M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z",
};
export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.info} />
    </svg>
  );
}

/* ---------- small pieces ---------- */
export const SKILL_COLOR: Record<string, string> = { L: "var(--L)", R: "var(--R)", W: "var(--W)", S: "var(--S)", G: "var(--G)", V: "var(--V)", X: "var(--bad)", M: "var(--gold)" };

export function Disclaimer({ text = DISCLAIMER }: { text?: string }) { return <p className="disclaimer">{text}</p>; }
export function AiLabel() { return <span className="chip ai">AI-generated IELTS-style practice</span>; }
export function Empty({ children }: { children: React.ReactNode }) { return <div className="empty">{children}</div>; }
export function Bar({ value, color }: { value: number; color?: string }) {
  return <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: color }} /></div>;
}

export function BandRuler({ band, target, color = "var(--accent)" }: { band: number | null; target: number; color?: string }) {
  const pct = (b: number) => `${(b / 9) * 100}%`;
  return (
    <div className="ruler" role="img" aria-label={`Band ${fmtBand(band)} of 9, target ${target}`}>
      <div className="track" />
      {band != null && <div className="fill" style={{ width: pct(band), background: color }} />}
      <div className="target" style={{ left: pct(target) }} title={`Target ${target}`} />
      {band != null && <div className="knob" style={{ left: pct(band), background: color }} />}
      {[0, 3, 4, 5, 6, 7, 8, 9].map((t) => <span key={t} className="tick" style={{ left: pct(t) }}>{t}</span>)}
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return <div className="seg" role="tablist">{options.map((o) => <button key={o.v} role="tab" aria-selected={value === o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.label}</button>)}</div>;
}

export function BandSelect({ value, onChange, allowEmpty = true, min = 0 }: { value: number | null | undefined; onChange: (v: number | null) => void; allowEmpty?: boolean; min?: number }) {
  return (
    <select value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}>
      {allowEmpty && <option value="">–</option>}
      {BAND_SCALE.filter((b) => b >= min).map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
    </select>
  );
}

/* ---------- toasts & modal ---------- */
type ToastFn = (msg: string) => void;
let pushToast: ToastFn = () => undefined;
export const toast = (msg: string) => pushToast(msg);
export function Toasts() {
  const [list, setList] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    pushToast = (msg) => { const id = Date.now() + Math.random(); setList((l) => [...l, { id, msg }]); setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3600); };
  }, []);
  return <div className="toast-wrap" aria-live="polite">{list.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}</div>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between"><h2>{title}</h2><button className="btn ghost icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        {children}
      </div>
    </div>
  );
}

/* ---------- timers ---------- */
export function useStopwatch(running: boolean) {
  const [secs, setSecs] = useState(0);
  const base = useRef<number>(Date.now());
  const acc = useRef(0);
  useEffect(() => {
    if (!running) { acc.current = secs; return; }
    base.current = Date.now();
    const id = setInterval(() => setSecs(acc.current + (Date.now() - base.current) / 1000), 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return secs;
}

export function Countdown({ secs, limit, label }: { secs: number; limit?: number; label?: string }) {
  const left = limit ? limit - secs : secs;
  const low = !!limit && left <= 300;
  return <span className={"timer" + (low ? " low" : "")} title={label}>{limit ? (left < 0 ? "+" + fmtClock(-left) : fmtClock(left)) : fmtClock(secs)}</span>;
}

/* ---------- charts (SVG, offline) ---------- */
export interface Series { name: string; color: string; points: { x: number; y: number; ext?: boolean }[]; dashed?: boolean; }
export function LineChart({ series, yMin, yMax, height = 220, yLabel, target, fmtY = (v) => String(v) }: {
  series: Series[]; yMin?: number; yMax?: number; height?: number; yLabel?: string; target?: number; fmtY?: (v: number) => string;
}) {
  const W = 640, H = height, L = 40, R = 12, T = 12, B = 26;
  const all = series.flatMap((s) => s.points);
  if (!all.length) return <Empty>No data yet for this period.</Empty>;
  let x0 = Math.min(...all.map((p) => p.x)), x1 = Math.max(...all.map((p) => p.x));
  if (x0 === x1) { x0 -= 864e5; x1 += 864e5; }
  const ys = all.map((p) => p.y).concat(target != null ? [target] : []);
  const dataLo = Math.floor(Math.min(...ys)), dataHi = Math.ceil(Math.max(...ys) || 1);
  const lo = Math.min(yMin ?? dataLo, dataLo), hi = Math.max(yMax ?? dataHi, dataHi);
  const short = x1 - x0 < 2.5 * 864e5;
  const fx = (x: number) => (short ? new Date(x).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : fmtShort(x));
  const sx = (x: number) => L + ((x - x0) / (x1 - x0)) * (W - L - R);
  const sy = (y: number) => T + (1 - (y - lo) / (hi - lo || 1)) * (H - T - B);
  const steps = 4;
  const yt = Array.from({ length: steps + 1 }, (_, i) => lo + ((hi - lo) * i) / steps);
  const xt = Array.from({ length: 4 }, (_, i) => x0 + ((x1 - x0) * i) / 3);
  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={yLabel || "chart"}>
        <g className="grid">{yt.map((y, i) => <line key={i} x1={L} x2={W - R} y1={sy(y)} y2={sy(y)} />)}</g>
        {yt.map((y, i) => <text key={i} x={L - 6} y={sy(y) + 4} textAnchor="end">{fmtY(Math.round(y * 10) / 10)}</text>)}
        {xt.map((x, i) => <text key={i} x={sx(x)} y={H - 6} textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"}>{fx(x)}</text>)}
        {target != null && <><line x1={L} x2={W - R} y1={sy(target)} y2={sy(target)} stroke="var(--gold)" strokeDasharray="5 4" strokeWidth={1.5} /><text x={W - R} y={sy(target) - 5} textAnchor="end" style={{ fill: "var(--gold)" }}>target {target}</text></>}
        {series.map((s) => {
          const pts = s.points.slice().sort((a, b) => a.x - b.x);
          const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
          const last = pts[pts.length - 1];
          return (
            <g key={s.name}>
              {pts.length > 1 && <path d={`${d} L${sx(last.x)},${sy(lo)} L${sx(pts[0].x)},${sy(lo)} Z`} fill={s.color} opacity={series.length === 1 ? 0.08 : 0} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? "4 4" : undefined} />
              {pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={p.ext ? 4.5 : i === pts.length - 1 ? 4 : 2.5} fill={p.ext ? "var(--surface)" : s.color} stroke={s.color} strokeWidth={p.ext ? 2 : 0} />)}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && <div className="legend">{series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>}
    </div>
  );
}

export function HBars({ rows, max, fmt = (v) => String(v), color = "var(--accent)" }: { rows: { label: string; value: number; color?: string; note?: string }[]; max?: number; fmt?: (v: number) => string; color?: string }) {
  if (!rows.length) return <Empty>No data yet.</Empty>;
  const m = max ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="stack" style={{ gap: 8 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,2fr) 64px", gap: 10, alignItems: "center" }}>
          <span className="small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.label}>{r.label}</span>
          <Bar value={r.value / m} color={r.color || color} />
          <span className="small num" style={{ textAlign: "right" }}>{fmt(r.value)}{r.note ? <span className="muted"> {r.note}</span> : null}</span>
        </div>
      ))}
    </div>
  );
}

export function ColumnChart({ data, height = 160, color = "var(--accent)", fmt = (v: number) => String(Math.round(v)) }: { data: { label: string; value: number }[]; height?: number; color?: string; fmt?: (v: number) => string }) {
  const W = 640, H = height, B = 22, T = 14;
  if (!data.length) return <Empty>No data yet.</Empty>;
  const m = Math.max(...data.map((d) => d.value), 1);
  const bw = (W - 20) / data.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="column chart">
      {data.map((d, i) => {
        const h = ((H - B - T) * d.value) / m;
        const x = 10 + i * bw + bw * 0.15;
        return (
          <g key={i}>
            <rect x={x} y={H - B - h} width={bw * 0.7} height={Math.max(h, d.value ? 1.5 : 0)} rx={3} fill={color} opacity={0.85} />
            {d.value > 0 && data.length <= 16 && <text x={x + bw * 0.35} y={H - B - h - 4} textAnchor="middle">{fmt(d.value)}</text>}
            {(data.length <= 16 || i % Math.ceil(data.length / 10) === 0) && <text x={x + bw * 0.35} y={H - 6} textAnchor="middle">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}
