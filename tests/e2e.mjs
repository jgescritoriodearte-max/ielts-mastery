// End-to-end check of the integrated P0 core, incl. upgrade from a LEGACY (schema 1) database. Run: node tests/e2e.mjs (needs dist/ served on :5190)
import { createRequire } from "node:module";
const require = createRequire("/home/claude/.npm-global/lib/node_modules/");
const { chromium } = require("playwright");
const URL = "http://localhost:5190";
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("ok -", m); };
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ serviceWorkers: "block" });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });

// 1. Build a LEGACY schema-1 database (old stores only, old-shaped records without any new field).
await page.goto(URL + "/manifest.webmanifest");
await page.evaluate(async () => {
  await new Promise((res, rej) => { const r = indexedDB.deleteDatabase("ielts-mastery"); r.onsuccess = res; r.onerror = rej; r.onblocked = res; });
  const old = ["kv","attempts","itemStats","mistakes","vocab","writings","recordings","sessions","mocks","external","customPacks"];
  const db = await new Promise((res, rej) => { const r = indexedDB.open("ielts-mastery", 1); r.onupgradeneeded = () => old.forEach((s) => r.result.createObjectStore(s, { keyPath: "id" })); r.onsuccess = () => res(r.result); r.onerror = rej; });
  const put = (s, v) => new Promise((res, rej) => { const t = db.transaction(s, "readwrite"); t.objectStore(s).put(v); t.oncomplete = res; t.onerror = rej; });
  const now = Date.now(), D = 864e5;
  await put("kv", { id: "profile", value: { name: "Legacy", exam: "academic", target: 7, skillTargets: { L: 7, R: 7, W: 7, S: 7 }, examDate: "", hoursWeek: 10, minutesDay: 60, selfLevel: {}, difficulties: [], prefer: "", onboarded: true, createdAt: now } });
  const mk = (id, skill, qid, tag, qtype, ts) => ({ id, updatedAt: ts, ts, skill, ref: "x", qid, qtype, tag, difficulty: "", prompt: "p " + id, your: "a", correct: "b", explanation: "e", resolved: false, reviewOk: 0, reviewCount: 0 });
  await put("mistakes", mk("m1", "L", "q1", "numbers", "Form completion", now - 3 * D));
  await put("mistakes", mk("m2", "L", "q2", "distractors", "MCQ", now - 2 * D));
  for (let i = 0; i < 3; i++) await put("mistakes", mk("g" + i, "G", "g:conditionals:" + i, "", "Grammar exercise", now - i * D));
  await put("vocab", { id: "legacy-word", updatedAt: now, reps: 2, interval: 3, ease: 2.5, due: "2000-01-01", lapses: 0, seen: 2, ok: 2, bad: 0, lastTs: now });
  db.close();
});

// 2. Open the app: upgrade 1 -> 2 and migration must keep everything and backfill the Error Bank.
await page.goto(URL + "/#/errors"); await page.waitForSelector("h1:has-text('Error Bank')", { timeout: 20000 });
await page.waitForTimeout(1500);
let txt = await page.locator("main").innerText();
assert(/Listening: I did not know|numbers, dates and names/i.test(txt), "legacy Listening 'numbers' mistake appears as a Listening category");
assert(/distractor/i.test(txt), "legacy 'distractors' tag maps to the distractor cause");
assert(/Conditionals/i.test(txt), "legacy Grammar mistakes appear under Conditionals");
const snap = await page.evaluate(async () => { const db = await new Promise((r) => { const q = indexedDB.open("ielts-mastery"); q.onsuccess = () => r(q.result); }); const all = (s) => new Promise((r) => { const q = db.transaction(s).objectStore(s).getAll(); q.onsuccess = () => r(q.result); }); return { v: db.version, m: await all("mistakes"), e: await all("errors"), vocab: await all("vocab") }; });
assert(snap.v === 2, "database upgraded to version 2");
assert(snap.m.length === 5 && snap.m.every((m) => m.cat), "all 5 legacy mistakes kept and categorised");
assert(snap.vocab[0].id === "legacy-word" && snap.vocab[0].reps === 2, "legacy vocabulary record untouched");
const cond = snap.e.find((e) => e.id === "gr.conditionals"); assert(cond && cond.total === 3 && cond.events.length === 3, "Error Bank rebuilt with timestamps (3 conditionals events)");
assert(cond && /recurring|weak/.test(await page.locator("tr", { hasText: "Conditionals" }).first().innerText()), "3 errors in 30 days = recurring/weak");

// 3. Dashboard: engine diagnosis, Writing first by prior.
await page.goto(URL + "/#/"); await page.waitForSelector("text=Your biggest deficiency right now"); await page.locator("summary:has-text('Why?')").click();
const rows = await page.locator("details table tbody tr td:first-child").allInnerTexts();
assert(rows[0] === "Writing", "engine ranks Writing first from the profile prior (got " + rows.join(",") + ")");
assert((await page.locator("text=PROJECT ESTIMATES").count()) > 0, "dashboard labels the weights as project estimates");

// 4. Refine a Listening cause -> event moves between categories.
await page.goto(URL + "/#/mistakes"); await page.waitForSelector("h1:has-text('My Mistakes')");
const sel = page.locator("select[aria-label='Why did I miss it?']").first();
await sel.selectOption("ls.connected"); await page.waitForTimeout(500);
await page.goto(URL + "/#/errors"); await page.waitForTimeout(800);
txt = await page.locator("main").innerText();
assert(/connected speech/i.test(txt), "refined cause 'connected speech' now exists as its own Error Bank category");

// 5. Vocabulary: typed quiz updates the PRODUCTION axis, multiple choice the RECOGNITION axis.
await page.goto(URL + "/#/library"); await page.waitForTimeout(6000);
await page.goto(URL + "/#/vocabulary/quiz/blank/All"); await page.waitForSelector(".gap-input", { timeout: 20000 });
const inputs = page.locator(".gap-input"); const n = await inputs.count(); for (let i = 0; i < n; i++) await inputs.nth(i).fill("zzz");
await page.click("button:has-text('Check answers')"); await page.waitForTimeout(1500);
const v1 = await page.evaluate(async () => { const db = await new Promise((r) => { const q = indexedDB.open("ielts-mastery"); q.onsuccess = () => r(q.result); }); const all = (s) => new Promise((r) => { const q = db.transaction(s).objectStore(s).getAll(); q.onsuccess = () => r(q.result); }); return { vocab: await all("vocab"), e: await all("errors"), rev: await all("reviews") }; });
const withProd = v1.vocab.filter((v) => v.prod && v.prod.seen > 0);
assert(withProd.length >= 1 && withProd.every((v) => v.reps === 0 && v.seen === 0 || v.prod.seen === 1), "typed quiz wrote to the production axis (" + withProd.length + " words)");
assert(v1.e.some((e) => e.id === "vb.production"), "failed typed answers filed under 'could not produce the word'");
assert(v1.rev.filter((r) => r.axis === "prod").length >= 1, "review log records the axis");

// 6. Production Lab: run a session and check data flows to SRS + Error Bank + reviews.
await page.goto(URL + "/#/produce?cat=gr.conditionals"); await page.waitForTimeout(1000);
txt = await page.locator("main").innerText();
assert(/Production Lab/.test(txt), "Production Lab opens for a category");
if (await page.locator("textarea").count()) {
  for (let step = 0; step < 6; step++) {
    const ta = page.locator("textarea").first(); if (!(await ta.count()) || !(await ta.isEnabled().catch(() => false))) break;
    await ta.fill("If I had more time I would study every day for the exam");
    await page.locator("button:has-text('Compare')").first().click();
    const no = page.locator("button:has-text('No')").first(); if (await no.count()) await no.click(); else { const c = page.locator("button:has-text('continue')").first(); if (await c.count()) await c.click(); else break; }
    await page.waitForTimeout(300);
  }
}
await page.waitForTimeout(800);
const v2 = await page.evaluate(async () => { const db = await new Promise((r) => { const q = indexedDB.open("ielts-mastery"); q.onsuccess = () => r(q.result); }); const all = (s) => new Promise((r) => { const q = db.transaction(s).objectStore(s).getAll(); q.onsuccess = () => r(q.result); }); return { si: await all("skillItems"), rev: await all("reviews"), att: await all("attempts") }; });
assert(v2.si.some((x) => x.id === "g:conditionals" && x.prod.seen > 0), "grammar production recorded on skillItem g:conditionals.prod");
assert(v2.rev.some((r) => r.task === "production"), "production reviews logged");

// 7. Settings priors -> engine reacts.
await page.goto(URL + "/#/settings"); await page.waitForSelector("text=Study priorities");
const selects = page.locator("select").filter({ has: page.locator("option:has-text('Maintenance')") });
await selects.nth(0).selectOption("0.5");   // Writing -> Maintenance
await page.waitForTimeout(400); await page.goto(URL + "/#/"); await page.waitForSelector("text=Your biggest deficiency right now"); await page.locator("summary:has-text('Why?')").click();
const rows2 = await page.locator("details table tbody tr td:first-child").allInnerTexts();
assert(rows2[0] !== "Writing", "lowering Writing prior changes the ranking (top now " + rows2[0] + ")");

// 8. Backup export contains the new stores.
await page.goto(URL + "/#/data"); await page.waitForSelector("h1:has-text('Data')");
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("button:has-text('Export')").catch(() => page.click("text=Export backup"))]);
const fs = await import("node:fs"); const body = fs.readFileSync(await dl.path(), "utf8"); const j = JSON.parse(body);
assert(j.schema === 2 && j.data.errors?.length > 0 && j.data.reviews?.length > 0 && j.data.skillItems?.length > 0, "backup (schema 2) includes errors, reviews, skillItems");
assert(errs.filter((e) => !/favicon|Failed to load resource/.test(e)).length === 0, "no page errors" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
await browser.close();
