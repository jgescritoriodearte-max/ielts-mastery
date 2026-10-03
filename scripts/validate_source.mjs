/* Source-level content validator. Usage:
     node scripts/validate_source.mjs <reading|listening|mock|grammar|vocab|paraphrase|prompts> <file.mjs> [--quiet]
   Exits 1 when any ERROR is found. See content/CONTENT_SPEC.md. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const [kind, file] = process.argv.slice(2);
if (!kind || !file) { console.error("usage: node scripts/validate_source.mjs <kind> <file>"); process.exit(2); }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [], warns = [];
const E = (m) => errors.push(m), W = (m) => warns.push(m);

const BANDS = [5.5, 6, 6.5, 7, 7.5];
const VOICES = new Set(["gb_m", "gb_f", "gb_m2", "sc_f", "us_f", "us_m"]);
const TAGS = new Set(["numbers", "names", "spelling", "distractors", "paraphrasing", "fast speech", "accents", "detail", "prediction"]);
const R_TYPES = new Set(["True/False/Not Given", "Yes/No/Not Given", "Multiple Choice", "Matching Headings", "Matching Information", "Matching Features",
  "Sentence Completion", "Summary Completion", "Note Completion", "Flow-chart Completion", "Short Answer", "Table Completion"]);
const L_TYPES = new Set(["Form Completion", "Note Completion", "Table Completion", "Flow-chart Completion", "Sentence Completion", "Summary Completion",
  "Short Answer", "Multiple Choice", "Matching", "Map Labelling"]);
const GAP_NEEDS_BLANK = new Set(["Sentence Completion", "Summary Completion", "Note Completion", "Flow-chart Completion", "Form Completion"]);
const R_CATS = new Set(["Science", "History", "Archaeology", "Technology", "Environment", "Psychology", "Education", "Culture", "Economics", "Society",
  "Heritage", "Urban planning", "Art", "Health", "Climate", "Business", "Biology", "Geography", "Transport", "Language"]);

const words = (t) => (String(t).match(/[A-Za-z0-9'’-]+/g) || []).length;
const normalize = (s) => String(s ?? "").toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ").replace(/^[\s.,;:!?"']+|[\s.,;:!?"']+$/g, "").trim();
const countAnswerWords = (s) => (normalize(s).match(/[a-z0-9'’-]+/gi) || []).filter((t) => !/\d/.test(t)).length;

const mod = await import(pathToFileURL(path.resolve(file)).href + "?t=" + Date.now());

const LEN = { 5.5: [450, 600], 6: [550, 700], 6.5: [650, 800], 7: [750, 900], 7.5: [850, 1000] };
const L_LEN = { 1: [500, 750], 2: [550, 800], 3: [600, 850], 4: [650, 900] };
const seenIds = new Set();

function checkSet(s, skill, maps, mockNo) {
  const id = s?.id || "(no id)";
  if (!s.id) E(`set without id`);
  if (seenIds.has(s.id)) E(`${id}: duplicate id`); seenIds.add(s.id);
  for (const f of ["title", "category"]) if (!s[f]) E(`${id}: missing ${f}`);
  if (!BANDS.includes(s.band)) E(`${id}: band must be one of ${BANDS.join(", ")} (got ${s.band})`);
  if (mockNo) { if (s.mock !== mockNo) E(`${id}: mock must be "${mockNo}"`); }
  else if (s.mock !== null) E(`${id}: practice sets need mock:null`);
  if (!Array.isArray(s.groups) || !s.groups.length) { E(`${id}: no groups`); return; }
  let text = "", segments = [];
  if (skill === "R") {
    if (!R_CATS.has(s.category)) W(`${id}: unusual category "${s.category}"`);
    if (!Array.isArray(s.paras) || s.paras.length < 4) E(`${id}: needs >= 4 paragraphs`);
    (s.paras || []).forEach(([l, t], i) => { if (l !== "ABCDEFGHIJKL"[i]) E(`${id}: paragraph ${i + 1} label should be ${"ABCDEFGHIJKL"[i]}`); });
    segments = (s.paras || []).map((p) => p[1]);
    text = segments.join(" ");
    const n = words(text);
    const [lo, hi] = mockNo ? [750, 950] : LEN[s.band] || [400, 1000];
    if (n < lo - 40 || n > hi + 60) E(`${id}: passage has ${n} words (expected ${lo}-${hi})`);
    else if (n < lo || n > hi) W(`${id}: passage has ${n} words (target ${lo}-${hi})`);
    if (!s.mins) E(`${id}: missing mins`);
    if (mockNo && ![1, 2, 3].includes(s.part)) E(`${id}: mock passage needs part 1-3`);
  } else {
    if (![1, 2, 3, 4].includes(s.part)) E(`${id}: part must be 1-4`);
    if (!Array.isArray(s.lines) || s.lines.length < 6) E(`${id}: needs lines`);
    const speakers = new Set((s.lines || []).map((l) => l[0]));
    for (const sp of speakers) { if (!s.voices?.[sp]) E(`${id}: speaker ${sp} has no voice`); }
    for (const v of Object.values(s.voices || {})) if (!VOICES.has(v)) E(`${id}: voice ${v} not allowed`);
    segments = (s.lines || []).map((l) => l[1]);
    text = segments.join(" ");
    const n = words(text);
    const [lo, hi] = L_LEN[s.part] || [450, 950];
    if (n < lo - 60 || n > hi + 120) E(`${id}: script has ${n} words (expected ${lo}-${hi})`);
    else if (n < lo || n > hi) W(`${id}: script has ${n} words (target ${lo}-${hi})`);
  }
  const lower = text.toLowerCase();
  let qn = 0;
  s.groups.forEach((g, gi) => {
    const gid = `${id}#g${gi + 1}`;
    const types = skill === "R" ? R_TYPES : L_TYPES;
    if (!types.has(g.qtype)) E(`${gid}: qtype "${g.qtype}" not allowed for ${skill === "R" ? "Reading" : "Listening"}`);
    if (!g.instr) E(`${gid}: missing instr`);
    if (!Array.isArray(g.items) || !g.items.length) { E(`${gid}: no items`); return; }
    const choiceGroup = !!g.options;
    if (/Not Given/.test(g.qtype)) {
      const vals = new Set(g.items.map((it) => it.a));
      if (g.items.length >= 4 && vals.size < 3) E(`${gid}: use all three answers (${[...vals].join(",")})`);
    }
    if (g.qtype === "Matching Headings") {
      if (g.optKey !== "roman") E(`${gid}: Matching Headings needs optKey:"roman"`);
      if ((g.options || []).length < g.items.length + 2) E(`${gid}: provide at least 2 more headings than items`);
    }
    if ((g.qtype === "Matching Features" || g.qtype === "Matching") && g.optKey !== "letter") E(`${gid}: needs optKey:"letter"`);
    if (g.qtype === "Map Labelling") {
      if (!g.map || !maps?.[g.map]) E(`${gid}: map "${g.map}" not found in MAPS`);
      else {
        const labels = new Set(maps[g.map].rooms.filter((r) => !r.fixed).map((r) => r.label));
        for (const o of g.options || []) if (!labels.has(o)) E(`${gid}: option ${o} is not an unlabelled room on the map`);
      }
    }
    if (g.table) {
      const marks = g.table.rows.flat().join(" ").match(/\[(\d+)\]/g) || [];
      if (marks.length !== g.items.length) E(`${gid}: table has ${marks.length} gap marks but ${g.items.length} items`);
    }
    g.items.forEach((it, ii) => {
      qn++;
      const q = `${gid}:q${ii + 1}`;
      if (!it.q) E(`${q}: missing q`);
      if (!it.ex || it.ex.length < 20) E(`${q}: explanation missing or too short`);
      if (!it.ev) E(`${q}: missing ev`);
      else if (!segments.some((t) => t.includes(it.ev))) E(`${q}: ev is not an exact substring of one ${skill === "R" ? "paragraph" : "line"}: "${String(it.ev).slice(0, 70)}"`);
      if (skill === "L" && !TAGS.has(it.tag)) E(`${q}: tag "${it.tag}" not allowed`);
      const isChoice = !!(it.opts || choiceGroup);
      if (isChoice) {
        const keys = it.opts ? it.opts.map((_, k) => "ABCDEFGH"[k]) : g.options.map((o) => (g.optKey ? o.trim().split(/\s+/)[0] : o));
        if (typeof it.a !== "string" || !keys.includes(it.a)) E(`${q}: answer ${JSON.stringify(it.a)} not among ${keys.join(",")}`);
        if (it.opts && g.qtype === "Multiple Choice" && it.opts.length < 3) E(`${q}: Multiple Choice needs >= 3 options`);
      } else {
        if (!Array.isArray(it.a) || !it.a.length) { E(`${q}: gap answer must be a non-empty array`); return; }
        if (!g.limit) E(`${gid}: completion group needs limit`);
        const first = String(it.a[0]);
        if (g.limit && countAnswerWords(first) > g.limit) E(`${q}: answer "${first}" exceeds word limit ${g.limit}`);
        if (GAP_NEEDS_BLANK.has(g.qtype) && !String(it.q).includes("___")) E(`${q}: question needs ___ for the gap`);
        const hit = it.a.some((a) => lower.includes(normalize(a)));
        if (!hit) {
          if (skill === "R") E(`${q}: none of the accepted answers ${JSON.stringify(it.a)} appears in the passage`);
          else if (!/\d/.test(first)) E(`${q}: none of the accepted answers ${JSON.stringify(it.a)} is heard in the script`);
        }
        if (skill === "R" && !normalize(it.ev).includes(normalize(it.a.find((a) => lower.includes(normalize(a))) || "~"))) W(`${q}: evidence does not contain the answer word(s)`);
      }
    });
  });
  if (skill === "R") {
    if (mockNo) { if (qn < 13 || qn > 14) E(`${id}: mock passage needs 13 or 14 questions (has ${qn})`); }
    else if (qn < 10 || qn > 14) E(`${id}: needs 10-14 questions (has ${qn})`);
  } else if (mockNo ? qn !== 10 : qn < 8 || qn > 12) E(`${id}: needs ${mockNo ? "exactly 10" : "8-12"} questions (has ${qn})`);
  return qn;
}

function checkChart(c, id) {
  if (!c || !c.kind) return E(`${id}: missing chart`);
  const k = c.kind;
  if (k === "line") { if (!c.xLabels?.length || !c.series?.length || !c.unit) E(`${id}: line needs unit, xLabels, series`); c.series?.forEach((s) => s.values?.length !== c.xLabels?.length && E(`${id}: series ${s.name} length mismatch`)); }
  else if (k === "bar") { if (!c.categories?.length || !c.series?.length || !c.unit) E(`${id}: bar needs unit, categories, series`); c.series?.forEach((s) => s.values?.length !== c.categories?.length && E(`${id}: series ${s.name} length mismatch`)); }
  else if (k === "pie") c.pies?.forEach((p) => { const t = p.slices.reduce((a, s) => a + s.value, 0); if (Math.abs(t - 100) > 1) E(`${id}: pie ${p.title} sums to ${t}`); });
  else if (k === "table") { if (!c.head?.length || !c.rows?.length) E(`${id}: table needs head, rows`); c.rows?.forEach((r) => r.length !== c.head.length && E(`${id}: table row length mismatch`)); }
  else if (k === "process") { if (!(c.steps?.length >= 5)) E(`${id}: process needs >= 5 steps`); }
  else if (k === "map") { if (c.maps?.length !== 2) E(`${id}: map needs 2 maps (before/after)`); c.maps?.forEach((m) => m.features.forEach((f) => (f.x + f.w > 262 || f.y + f.h > 202) && E(`${id}: map feature "${f.label}" outside 260x200`))); }
  else if (k === "multi") c.charts?.forEach((x, i) => checkChart(x, `${id}.${i}`));
  else E(`${id}: unknown chart kind ${k}`);
}

const existingWords = () => {
  const f = path.join(ROOT, "content", "_existing_words.txt");
  return fs.existsSync(f) ? new Set(fs.readFileSync(f, "utf8").split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean)) : new Set();
};

if (kind === "reading" || kind === "listening") {
  const sets = mod.SETS;
  if (!Array.isArray(sets)) E("file must export SETS = [...]");
  else { let total = 0; for (const s of sets) total += checkSet(s, kind === "reading" ? "R" : "L", mod.MAPS || {}, null) || 0; console.log(`${sets.length} sets, ${total} questions`); }
} else if (kind === "mock") {
  const m = mod.MOCK;
  if (!m) E("file must export MOCK");
  else {
    const no = (m.id || "").split("-")[1];
    if (!/^mock-\d\d$/.test(m.id || "")) E(`MOCK.id must look like mock-02`);
    if (m.listening?.length !== 4) E("mock needs 4 listening sets");
    if (m.reading?.length !== 3) E("mock needs 3 reading sets");
    let l = 0, r = 0;
    (m.listening || []).forEach((s, i) => { l += checkSet(s, "L", mod.MAPS || {}, no) || 0; if (s.part !== i + 1) E(`${s.id}: listening part should be ${i + 1}`); if (s.id !== `M${no}L${i + 1}`) E(`${s.id}: id should be M${no}L${i + 1}`); });
    (m.reading || []).forEach((s, i) => { r += checkSet(s, "R", mod.MAPS || {}, no) || 0; if (s.id !== `M${no}R${i + 1}`) E(`${s.id}: id should be M${no}R${i + 1}`); });
    if (l !== 40) E(`listening has ${l} questions (need 40)`);
    if (r !== 40) E(`reading has ${r} questions (need 40)`);
    const types = new Set((m.reading || []).flatMap((s) => s.groups.map((g) => g.qtype)));
    if (types.size < 6) E(`reading uses only ${types.size} question types (need >= 6)`);
    const w = m.writing || {};
    if (!w.t1Academic?.prompt || !w.t1GT?.prompt || !w.t2?.prompt) E("writing needs t1Academic, t1GT and t2 prompts");
    if (w.t1Academic) checkChart(w.t1Academic.chart, w.t1Academic.id || "t1Academic");
    const sp = m.speaking || {};
    if (!(sp.p1?.questions?.length >= 4) || !sp.p2?.topic || !(sp.p2?.points?.length >= 3) || !(sp.p3?.length >= 4)) E("speaking needs p1 (4 q), p2 card, p3 (4 q)");
    console.log(`mock ${m.id}: listening ${l} q, reading ${r} q, ${types.size} reading types`);
  }
} else if (kind === "grammar") {
  const all = [];
  for (const [topic, list] of Object.entries(mod.GRAMMAR_EXTRA || {})) list.forEach((e, i) => all.push([`${topic}#${i + 1}`, e]));
  for (const t of mod.NEW_TOPICS || []) {
    if (!t.id || !t.title || !t.summary || !(t.rules?.length >= 3) || !(t.examples?.length >= 2)) E(`topic ${t.id}: needs id, title, summary, >=3 rules, >=2 examples`);
    (t.ex || []).forEach((e, i) => all.push([`${t.id}#${i + 1}`, e]));
  }
  const qs = new Set();
  for (const [id, e] of all) {
    if (!(e.opts?.length >= 3 && e.opts.length <= 4)) E(`${id}: needs 3-4 opts`);
    if (!(Number.isInteger(e.a) && e.a >= 0 && e.a < (e.opts?.length || 0))) E(`${id}: bad answer index`);
    if (![1, 2, 3].includes(e.lvl)) E(`${id}: lvl 1-3`);
    if (!["A2", "B1", "B2", "C1"].includes(e.cefr)) E(`${id}: cefr A2|B1|B2|C1`);
    if (!e.why || e.why.length < 25 || !e.natural) E(`${id}: why/natural missing`);
    if (!/___/.test(e.q) && !/\?\s*$/.test(e.q)) E(`${id}: q needs ___ or must be a question`);
    if (new Set(e.opts || []).size !== (e.opts || []).length) E(`${id}: duplicate options`);
    const k = normalize(e.q); if (qs.has(k)) E(`${id}: duplicate question`); qs.add(k);
  }
  console.log(`${all.length} grammar exercises`);
} else if (kind === "vocab") {
  const ex = existingWords(); const seen = new Set(); let n = 0;
  for (const [cat, list] of Object.entries(mod.VOCAB_EXTRA || {})) for (const w of list) {
    n++;
    const id = `${cat}:${w[0]}`;
    if (w.length !== 10) { E(`${id}: needs 10 fields (has ${w.length})`); continue; }
    const k = String(w[0]).toLowerCase().trim();
    if (seen.has(k)) E(`${id}: duplicate word in this file`); seen.add(k);
    if (ex.has(k)) E(`${id}: word already exists in the app`);
    if (!["n", "v", "adj", "adv", "phr", "conj", "prep"].includes(w[1])) E(`${id}: bad part of speech ${w[1]}`);
    if (!["B1", "B2", "C1", "C2"].includes(w[9])) E(`${id}: bad level ${w[9]}`);
    for (const i of [2, 3, 4, 6, 8]) if (!w[i]) E(`${id}: field ${i} empty`);
    const stem = k.split(" ")[0].replace(/(e|y|ies|es|s|ed|ing)$/,"").slice(0, Math.max(4, Math.min(6, k.length - 2)));
    if (!String(w[3]).toLowerCase().includes(stem)) W(`${id}: example may not contain the word`);
  }
  console.log(`${n} words`);
} else if (kind === "paraphrase") {
  const list = mod.PARAPHRASE || []; const ids = new Set();
  for (const p of list) {
    const id = p.id || "(no id)";
    if (ids.has(id)) E(`${id}: duplicate id`); ids.add(id);
    if (!["synonym", "grammar", "active-passive", "noun-verb", "structure", "reporting", "academic"].includes(p.type)) E(`${id}: bad type ${p.type}`);
    if (!BANDS.includes(p.band)) E(`${id}: bad band`);
    if (!p.original || !p.q || !p.model || !p.why) E(`${id}: missing original/q/model/why`);
    if (p.task === "choose") { if (p.opts?.length !== 4 || !(p.a >= 0 && p.a < 4)) E(`${id}: choose needs 4 opts and index a`); }
    else if (p.task === "complete") { if ((p.q.match(/___/g) || []).length !== 1) E(`${id}: complete needs exactly one ___`); if (!Array.isArray(p.a) || !p.a.length || p.a.some((x) => countAnswerWords(x) > 4)) E(`${id}: complete needs array answers of <= 4 words`); }
    else E(`${id}: task must be choose|complete`);
  }
  console.log(`${list.length} paraphrasing items`);
} else if (kind === "prompts") {
  const ids = new Set();
  const T1T = ["Line graph", "Bar chart", "Pie chart", "Table", "Process", "Map", "Mixed charts"];
  const T2T = ["Opinion essay", "Discussion essay", "Advantages/Disadvantages", "Problem/Solution", "Two-part question", "Positive/Negative development"];
  for (const t of mod.WRITING_T1_EXTRA || []) { if (ids.has(t.id)) E(`${t.id}: duplicate`); ids.add(t.id); if (!T1T.includes(t.type)) E(`${t.id}: bad type`); if (!t.prompt || !t.title) E(`${t.id}: prompt/title`); checkChart(t.chart, t.id); }
  for (const t of mod.WRITING_T2_EXTRA || []) { if (ids.has(t.id)) E(`${t.id}: duplicate`); ids.add(t.id); if (!T2T.includes(t.type)) E(`${t.id}: bad type ${t.type}`); if (!t.prompt || t.prompt.length < 60) E(`${t.id}: prompt too short`); }
  for (const [topic, qs] of Object.entries(mod.SPEAKING_P1_EXTRA || {})) if (qs.length < 4) E(`P1 ${topic}: needs 4 questions`);
  for (const c of mod.SPEAKING_P2_EXTRA || []) { if (ids.has(c.id)) E(`${c.id}: duplicate`); ids.add(c.id); if (!/^Describe/.test(c.topic) || c.points?.length < 3 || c.p3?.length < 3) E(`${c.id}: card needs Describe topic, points, >=3 p3`); }
  console.log(`T1 ${(mod.WRITING_T1_EXTRA || []).length}, T2 ${(mod.WRITING_T2_EXTRA || []).length}, P1 topics ${Object.keys(mod.SPEAKING_P1_EXTRA || {}).length}, P2 cards ${(mod.SPEAKING_P2_EXTRA || []).length}`);
} else { console.error("unknown kind"); process.exit(2); }

if (!process.argv.includes("--quiet")) warns.forEach((w) => console.log("WARN ", w));
errors.forEach((e) => console.log("ERROR", e));
console.log(errors.length ? `FAILED: ${errors.length} error(s), ${warns.length} warning(s)` : `OK (${warns.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
