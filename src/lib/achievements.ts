import type { State } from "./store";
import type { Content } from "./packs";
import { criteriaBand } from "./bands";
import { streaks, vocabCounts } from "./stats";

export interface Achievement { id: string; title: string; desc: string; done: boolean; progress: string; }

const firstBand = (s: State, min: number): boolean =>
  s.attempts.some((a) => a.band != null && a.band >= min && a.total >= 10 && a.kind !== "mistakes") ||
  s.mocks.some((m) => (m.overall ?? 0) >= min) ||
  s.writings.some((w) => (w.ai?.overall ?? 0) >= min) ||
  s.recordings.some((r) => (r.ai?.overall ?? 0) >= min);

function improved(list: number[]): boolean {
  if (list.length < 2) return false;
  return list[list.length - 1] - list[0] >= 0.5;
}

export function achievements(s: State, c: Content): Achievement[] {
  const st = streaks(s);
  const vc = vocabCounts(s, c.vocab.map((v) => v.id));
  const ex = s.attempts.length;
  const wb = s.writings.filter((w) => w.status === "submitted").sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0)).map((w) => w.ai?.overall ?? criteriaBand(Object.values(w.self || {}))).filter((x): x is number => x != null);
  const sb = s.recordings.filter((r) => r.part > 0).sort((a, b) => a.createdAt - b.createdAt).map((r) => r.ai?.overall ?? criteriaBand(Object.values(r.self || {}))).filter((x): x is number => x != null);
  const resolved = s.mistakes.filter((m) => m.resolved).length;
  return [
    { id: "diag", title: "Baseline Set", desc: "Complete the diagnostic test", done: s.attempts.some((a) => a.kind === "diagnostic"), progress: "" },
    { id: "mock1", title: "First Mock Test", desc: "Finish a full mock test", done: s.mocks.length > 0, progress: `${s.mocks.length}/1` },
    { id: "s7", title: "7-Day Streak", desc: "Study 7 days in a row", done: st.longest >= 7, progress: `${Math.min(st.longest, 7)}/7` },
    { id: "s30", title: "30-Day Streak", desc: "Study 30 days in a row", done: st.longest >= 30, progress: `${Math.min(st.longest, 30)}/30` },
    { id: "b7", title: "First Band 7", desc: "Score 7.0+ on a full set, mock or evaluated task", done: firstBand(s, 7), progress: "" },
    { id: "b75", title: "First Band 7.5", desc: "Score 7.5+ on a full set, mock or evaluated task", done: firstBand(s, 7.5), progress: "" },
    { id: "v100", title: "100 Vocabulary Words", desc: "Learn 100 words", done: vc.learned >= 100, progress: `${Math.min(vc.learned, 100)}/100` },
    { id: "v500", title: "500 Vocabulary Words", desc: "Learn 500 words (import more word packs)", done: vc.learned >= 500, progress: `${Math.min(vc.learned, 500)}/500` },
    { id: "e100", title: "100 Exercises", desc: "Complete 100 exercises", done: ex >= 100, progress: `${Math.min(ex, 100)}/100` },
    { id: "wimp", title: "Writing Improved", desc: "Raise your Writing band by 0.5+", done: improved(wb), progress: wb.length ? `${wb[0]} → ${wb[wb.length - 1]}` : "" },
    { id: "simp", title: "Speaking Improved", desc: "Raise your Speaking band by 0.5+", done: improved(sb), progress: sb.length ? `${sb[0]} → ${sb[sb.length - 1]}` : "" },
    { id: "m25", title: "Mistake Slayer", desc: "Resolve 25 mistakes", done: resolved >= 25, progress: `${Math.min(resolved, 25)}/25` },
  ];
}
