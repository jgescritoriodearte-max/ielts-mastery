/* IELTS Mastery build: bundles the app, writes offline content packs and the service worker.
   Usage: node build.mjs            -> full build into dist/
          node build.mjs --reindex  -> recompute packs/index.json after audio was generated */
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, "dist");
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const clipId = (text) => { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); } return "c" + (h >>> 0).toString(36); };

function loadEsbuild() {
  try { return require("esbuild"); } catch { /* fall through */ }
  if (process.env.ESBUILD_PATH) return require(process.env.ESBUILD_PATH);
  throw new Error("esbuild not found. Run `npm install` first.");
}

const PACK_INFO = {
  "listening-01": { title: "IELTS Listening Pack 01", kind: "listening", essential: true, description: "4 practice recordings from Beginner to Advanced: form, sentence, table, summary, diagram, multiple choice, matching and short-answer questions." },
  "reading-01": { title: "IELTS Reading Pack 01", kind: "reading", essential: true, description: "3 Academic-style passages (Technology, Business, Education) covering 11 question types." },
  "grammar-01": { title: "IELTS Grammar Pack", kind: "grammar", essential: true, description: "15 grammar topics for Band 7+: lessons, examples and 75 progressive exercises." },
  "vocabulary-01": { title: "IELTS Vocabulary Pack", kind: "vocabulary", essential: true, description: "112 words in 16 IELTS topics with definitions, examples, synonyms, antonyms, collocations, word families and Portuguese." },
  "prompts-01": { title: "Writing & Speaking Pack", kind: "prompts", essential: true, description: "Writing Task 1 (Academic charts and GT letters), 24 Task 2 topics, Speaking Parts 1-3 and shadowing sentences." },
  "mock-01": { title: "IELTS Mock Test 01", kind: "mock", essential: true, description: "Full test with exclusive content: Listening 40 questions, Reading 40 questions, Writing Tasks 1 and 2, Speaking Parts 1-3." },
};

async function writePacks() {
  const imp = (f) => import(pathToFileURL(path.join(ROOT, "content", f)).href);
  const { READING_SETS } = await imp("reading.mjs");
  const { LISTENING_SETS, MAPS } = await imp("listening.mjs");
  const { GRAMMAR } = await imp("grammar.mjs");
  const { VOCAB } = await imp("vocabulary.mjs");
  const P = await imp("prompts.mjs");
  const { MOCKS } = await imp("mocks.mjs");

  const lJob = (s) => ({ id: s.id, voices: s.voices, lines: s.lines });
  const clip = (text, voice = "gb_m") => ({ id: clipId(text), voices: { N: voice }, lines: [["N", text]] });
  const speakingClips = [
    ...Object.values(P.SPEAKING_P1).flat().map((q) => clip(q)),
    ...P.SPEAKING_P2.flatMap((c) => [clip(c.topic), ...c.p3.map((q) => clip(q))]),
    ...Object.values(P.SHADOWING).flat().map((t) => clip(t, "gb_f")),
  ];
  const packs = {
    "listening-01": { data: { sets: LISTENING_SETS.filter((s) => !s.mock), maps: MAPS }, jobs: LISTENING_SETS.filter((s) => !s.mock).map(lJob) },
    "reading-01": { data: { sets: READING_SETS.filter((s) => !s.mock) }, jobs: [] },
    "grammar-01": { data: { topics: GRAMMAR }, jobs: [] },
    "vocabulary-01": { data: { categories: VOCAB }, jobs: [] },
    "prompts-01": { data: { t1a: P.WRITING_T1_ACADEMIC, t1gt: P.WRITING_T1_GT, t2: P.WRITING_T2, p1: P.SPEAKING_P1, p2: P.SPEAKING_P2, shadowing: P.SHADOWING }, jobs: speakingClips },
  };
  for (const m of MOCKS) {
    const n = m.id.split("-")[1];
    const lsets = LISTENING_SETS.filter((s) => s.mock === n), rsets = READING_SETS.filter((s) => s.mock === n);
    const sp = m.speaking;
    packs[m.id] = {
      data: { mock: m, listening: lsets, reading: rsets, maps: MAPS },
      jobs: [...lsets.map(lJob), ...[...sp.p1.questions, sp.p2.topic, ...sp.p3].map((q) => clip(q))],
    };
    if (!PACK_INFO[m.id]) PACK_INFO[m.id] = { title: `IELTS ${m.title}`, kind: "mock", essential: false, description: "Full mock test." };
  }
  // sanity checks: mock content never appears in practice packs
  const practiceIds = new Set([...packs["listening-01"].data.sets, ...packs["reading-01"].data.sets].map((s) => s.id));
  for (const m of MOCKS) for (const id of [...m.listening, ...m.reading]) if (practiceIds.has(id)) throw new Error(`Mock set ${id} is also in a practice pack`);

  for (const [id, p] of Object.entries(packs)) {
    const dir = path.join(DIST, "packs", id);
    fs.mkdirSync(path.join(dir, "audio"), { recursive: true });
    const info = PACK_INFO[id];
    const pack = { id, title: info.title, kind: info.kind, label: "AI-generated IELTS-style practice", data: p.data, audio: {} };
    fs.writeFileSync(path.join(dir, "pack.json"), JSON.stringify(pack));
    fs.writeFileSync(path.join(dir, "jobs.json"), JSON.stringify(p.jobs));
  }
  reindex();
}

/** Scans dist/packs and writes packs/index.json (sizes, files, versions). Run again after audio generation. */
function reindex() {
  const base = path.join(DIST, "packs");
  const out = [];
  for (const id of fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory()).sort()) {
    const dir = path.join(base, id);
    const pack = JSON.parse(fs.readFileSync(path.join(dir, "pack.json"), "utf8"));
    let dropped = 0;
    for (const [job, a] of Object.entries(pack.audio || {})) if (!fs.existsSync(path.join(dir, a.file))) { delete pack.audio[job]; dropped++; }
    if (dropped) { fs.writeFileSync(path.join(dir, "pack.json"), JSON.stringify(pack)); console.log(`${id}: removed ${dropped} reference(s) to missing audio -> device voice fallback`); }
    const audioDir = path.join(dir, "audio");
    const audio = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter((f) => /\.(mp3|ogg|m4a)$/.test(f)).sort() : [];
    const files = ["pack.json", ...audio.map((f) => "audio/" + f)];
    const h = createHash("sha256");
    let bytes = 0, audioBytes = 0;
    for (const f of files) { const b = fs.readFileSync(path.join(dir, f)); h.update(f).update(b); bytes += b.length; if (f.startsWith("audio/")) audioBytes += b.length; }
    const info = PACK_INFO[id] || { title: pack.title, kind: pack.kind, essential: false, description: "" };
    out.push({ id, title: info.title, kind: info.kind, essential: info.essential, description: info.description, label: pack.label, version: h.digest("hex").slice(0, 12), files, bytes, audioBytes, audioFiles: audio.length });
  }
  fs.writeFileSync(path.join(base, "index.json"), JSON.stringify({ generatedAt: new Date().toISOString(), packs: out }, null, 1));
  console.log(`packs: ${out.map((p) => `${p.id}@${p.version} (${(p.bytes / 1024).toFixed(0)} KB, ${p.audioFiles} audio)`).join(", ")}`);
}

async function buildApp() {
  const esbuild = loadEsbuild();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
  const nodePaths = process.env.EXTRA_NODE_PATH ? [process.env.EXTRA_NODE_PATH] : [];
  const js = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/main.tsx")], bundle: true, minify: true, format: "esm", target: ["es2020", "chrome90", "safari15", "firefox90"],
    jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, write: false, nodePaths, legalComments: "none", sourcemap: false,
  });
  const jsBuf = Buffer.from(js.outputFiles[0].contents);
  const css = await esbuild.transform(fs.readFileSync(path.join(ROOT, "src/styles.css"), "utf8"), { loader: "css", minify: true });
  const jsName = `app.${sha(jsBuf).slice(0, 10)}.js`, cssName = `app.${sha(css.code).slice(0, 10)}.css`;
  fs.writeFileSync(path.join(DIST, "assets", jsName), jsBuf);
  fs.writeFileSync(path.join(DIST, "assets", cssName), css.code);
  fs.cpSync(path.join(ROOT, "public"), DIST, { recursive: true });
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace("__CSS__", "assets/" + cssName).replace("__JS__", "assets/" + jsName);
  fs.writeFileSync(path.join(DIST, "index.html"), html);
  fs.writeFileSync(path.join(DIST, ".nojekyll"), "");
  const icons = fs.readdirSync(path.join(DIST, "icons")).map((f) => "icons/" + f);
  const shell = ["./", "index.html", "assets/" + jsName, "assets/" + cssName, "manifest.webmanifest", ...icons];
  const version = sha(shell.map((f) => (f === "./" ? "" : fs.readFileSync(path.join(DIST, f)))).join("|")).slice(0, 12);
  const sw = fs.readFileSync(path.join(ROOT, "scripts/sw.template.js"), "utf8").replace("__VERSION__", version).replace("__SHELL__", JSON.stringify(shell));
  fs.writeFileSync(path.join(DIST, "sw.js"), sw);
  console.log(`app: ${jsName} (${(jsBuf.length / 1024).toFixed(0)} KB), ${cssName}, sw version ${version}`);
}

if (process.argv.includes("--reindex")) reindex();
else { await buildApp(); await writePacks(); }
