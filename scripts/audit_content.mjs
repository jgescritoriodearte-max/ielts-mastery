/* Content audit: run after `npm run build` (and after audio generation). Exits 1 on any error.
   node scripts/audit_content.mjs [distDir] */
import fs from "node:fs";
import path from "node:path";
const dist = path.resolve(process.argv[2] || "dist");
const errors = [], warns = [];
const idx = JSON.parse(fs.readFileSync(path.join(dist, "packs/index.json"), "utf8"));
const setIds = new Map(), vocabIds = new Set(), grammarIds = new Set();
const LEVELS = new Set(["Beginner", "Intermediate", "Upper-Intermediate", "Advanced", "IELTS Level"]);
for (const entry of idx.packs) {
  const dir = path.join(dist, "packs", entry.id);
  for (const f of entry.files) if (!fs.existsSync(path.join(dir, f))) errors.push(`${entry.id}: listed file missing ${f}`);
  let p;
  try { p = JSON.parse(fs.readFileSync(path.join(dir, "pack.json"), "utf8")); } catch (e) { errors.push(`${entry.id}: invalid JSON ${e.message}`); continue; }
  for (const [job, a] of Object.entries(p.audio || {})) if (!fs.existsSync(path.join(dir, a.file))) errors.push(`${entry.id}: audio ${job} -> missing ${a.file}`);
  const sets = [...(p.data.sets || []), ...(p.data.listening || []), ...(p.data.reading || [])];
  for (const s of sets) {
    if (setIds.has(s.id)) errors.push(`duplicate set id ${s.id} (${setIds.get(s.id)} & ${entry.id})`); setIds.set(s.id, entry.id);
    if (!LEVELS.has(s.level)) errors.push(`${s.id}: bad level ${s.level}`);
    if (!s.category) errors.push(`${s.id}: no category`);
    const text = (s.paras || s.lines || []).map((x) => x[1]).join(" ");
    s.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
      const q = `${s.id}:${gi}:${ii}`;
      if (it.a == null || it.a === "" || (Array.isArray(it.a) && !it.a.length)) errors.push(`${q}: no answer`);
      if (!it.ex) errors.push(`${q}: no explanation`);
      if (!it.ev || !text.includes(it.ev)) errors.push(`${q}: evidence not in text`);
      const keys = it.opts ? it.opts.map((_, k) => "ABCDEFGH"[k]) : g.options ? g.options.map((o) => (g.optKey ? o.trim().split(/\s+/)[0] : o)) : null;
      if (keys && !keys.includes(String(it.a))) errors.push(`${q}: answer ${it.a} not among options`);
    }));
    if (s.lines && !p.audio?.[s.id]) warns.push(`${s.id}: no pre-produced audio (device voice fallback)`);
  }
  for (const [cat, list] of Object.entries(p.data.categories || {})) for (const w of list) { const id = `${cat}:${w[0]}`; if (vocabIds.has(id)) errors.push(`duplicate word ${id}`); vocabIds.add(id); if (w.length !== 9) errors.push(`word ${id}: ${w.length} fields`); }
  for (const t of p.data.topics || []) { if (grammarIds.has(t.id)) errors.push(`duplicate grammar ${t.id}`); grammarIds.add(t.id); t.ex.forEach((e, i) => { if (!(e.a >= 0 && e.a < e.opts.length)) errors.push(`grammar ${t.id}#${i}: bad answer index`); if (!e.why || !e.natural) errors.push(`grammar ${t.id}#${i}: missing explanation`); }); }
  if (p.label !== "AI-generated IELTS-style practice") errors.push(`${entry.id}: label is "${p.label}"`);
}
console.log(`sets ${setIds.size}, words ${vocabIds.size}, grammar topics ${grammarIds.size}`);
warns.forEach((w) => console.log("WARN", w));
errors.forEach((e) => console.log("ERROR", e));
console.log(errors.length ? `FAILED: ${errors.length} error(s)` : "CONTENT OK");
process.exit(errors.length ? 1 : 0);
