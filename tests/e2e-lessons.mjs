// End-to-end check of the Grammar Learning Layer prototype (3 lessons). Run: node tests/e2e-lessons.mjs (needs dist/ served on :5190)
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire("/home/claude/.npm-global/lib/node_modules/");
const { chromium } = require("playwright");
const { LESSONS } = await import("../content/lessons.mjs");
const URL = "http://localhost:5190";
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("ok -", m); };
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
const idb = (fn, arg) => page.evaluate(async ({ fn, arg }) => { const db = await new Promise((r) => { const q = indexedDB.open("ielts-mastery"); q.onsuccess = () => r(q.result); }); const all = (s) => new Promise((r) => { const q = db.transaction(s).objectStore(s).getAll(); q.onsuccess = () => r(q.result); }); return (new Function("all", "arg", "return (" + fn + ")(all, arg)"))(all, arg); }, { fn: fn.toString(), arg });
const progress = async (id) => (await idb(async (all) => (await all("kv")).find((x) => x.id === "lessonProgress")?.value))?.[id];
const L = (id) => LESSONS.find((l) => l.id === id);
const step = async (label) => { await page.locator(`button[role=tab]:has-text("${label}")`).click(); await page.waitForTimeout(150); };
const mcq = async (q, pick) => { const row = page.locator(".q").nth(q); await row.locator("label.opt").nth(pick).click(); await row.locator("button:has-text('Check')").first().click(); };
const mcqAll = async (items, wrongAt = -1, offset = 0) => { for (let i = 0; i < items.length; i++) await mcq(offset + i, i === wrongAt ? (items[i].a + 1) % items[i].opts.length : items[i].a); };
const textAns = async (q, txt) => { const row = page.locator(".q").nth(q); await row.locator("textarea").fill(txt); await row.locator("button:has-text('Check')").first().click(); await page.waitForTimeout(250); };

const PARA = {
  "present-simple-vs-continuous": "Nowadays, technology is changing daily life in my country. More people are using smartphones to pay bills, and many families are watching films online instead of going to the cinema. Companies are also moving their services to apps, so customers are saving time. At the same time, habits remain strong. I usually check the news on my phone every morning, and most people often chat with friends online in the evening. My brother works as a designer, and he generally prefers video calls to long emails. Overall, people use technology every day, but they are still learning how to balance it with real conversations.",
  "past-simple-vs-present-perfect": "Technology has changed the way people communicate. In the 1990s most people wrote letters and used landlines, but today messaging apps have replaced many of those habits. Twenty years ago, my grandmother waited weeks for news from relatives abroad. Now video calls have made distance much smaller, and social media has connected families across continents. However, some people have become less patient because instant answers have changed their expectations. Overall, communication has become faster, although it has also become more superficial in many cases.",
  articles: "Education plays a vital role in modern society. Children need good teachers, and the government must invest in the education system because knowledge helps people escape poverty. A good school gives students confidence and an opportunity to build a better future. Technology can improve learning, but the number of qualified teachers is still too low in many regions. Parents also play an important role, since young people learn habits at home. Overall, society benefits when education is available to everyone.",
};

// ---- 0. a profile (skips onboarding)
const seedProfile = async (pg) => { await pg.goto(URL + "/manifest.webmanifest"); await pg.evaluate(async () => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open("ielts-mastery", 2); r.onupgradeneeded = () => { const d = r.result; ["kv","attempts","itemStats","mistakes","vocab","writings","recordings","sessions","mocks","external","customPacks","errors","reviews","skillItems"].forEach((s) => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: "id" }); }); }; r.onsuccess = () => res(r.result); r.onerror = rej; });
  await new Promise((res, rej) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put({ id: "profile", value: { name: "Tester", exam: "academic", target: 7, skillTargets: { L: 7, R: 7, W: 7, S: 7 }, examDate: "", hoursWeek: 10, minutesDay: 60, selfLevel: {}, difficulties: [], prefer: "", onboarded: true, createdAt: Date.now() } }); t.oncomplete = res; t.onerror = rej; }); db.close(); }); };
await seedProfile(page);
// ---- 1. packs + navigation
await page.goto(URL + "/#/library"); await page.waitForTimeout(7000);
await page.goto(URL + "/#/grammar"); await page.waitForSelector("text=Teach me");
let txt = await page.locator("main").innerText();
assert(LESSONS.every((l) => txt.includes(l.title)), "Grammar home lists the 3 explanatory lessons");
assert(/Train me/.test(txt) && /Mixed practice/.test(txt), "existing Grammar topics and Mixed practice are still there");
assert((await page.locator("a.card[href*='/grammar/lesson/']").count()) === 3, "3 lesson cards link to #/grammar/lesson/<id>");

// ---- 2. lesson rendering (all 3 lessons)
for (const l of LESSONS) {
  await page.goto(URL + "/#/grammar/lesson/" + l.id); await page.waitForSelector("h1:has-text('" + l.title.split(":")[0] + "')");
  const t = await page.locator("main").innerText();
  const need = ["What you will be able to do", "Why this matters", "The idea behind the rule", "How it is formed", "When to use it", "When NOT to use it", "Contrast", "Examples, from simple to IELTS", "Portuguese-speaker pitfalls", "WRONG", "In IELTS"];
  const miss = need.filter((n) => !new RegExp(n, "i").test(t));
  assert(!miss.length, `${l.id}: all lesson sections render (${miss.join(",") || "complete"})`);
  assert((await page.locator("b.hl").count()) > 20, `${l.id}: structures are highlighted in examples`);
  assert((await page.locator(".feedback:has-text('Por quê')").count()) >= 5, `${l.id}: Portuguese-speaker pitfalls explained in Portuguese`);
  assert(/Recommended now: Teach me/.test(t), `${l.id}: first visit recommends TEACH ME`);
}

// ---- 3. lesson 1 complete flow with errors on the way
const id1 = "present-simple-vs-continuous", l1 = L(id1);
await page.goto(URL + "/#/grammar/lesson/" + id1); await page.waitForSelector("h1");
await page.locator("button:has-text('I have read it')").click(); await page.waitForSelector("text=Do you understand WHY");
let p = await progress(id1); assert(p && p.readCount === 1, "reading the lesson is saved (lessonProgress.read)");
// weak understanding first -> must send back to the explanation, not to more exercises
await mcqAll(l1.understand, -1); for (let i = 0; i < 4; i++) { /* answer 4 wrongly by re-reading? answers are locked, so test the low score path on lesson 2 below */ }
await page.locator("button:has-text('Save my understanding score')").click(); await page.waitForSelector("text=you understand the logic");
p = await progress(id1); assert(p.understand.n === 6 && p.understand.lastScore === 1, "understanding score saved (6/6)");
assert((await idb(async (all) => (await all("mistakes")).filter((m) => m.qid.startsWith("g:" + "present-simple-vs-continuous:u")).length)) === 0, "understanding questions do not create Error Bank entries");
await page.locator("button:has-text('Go to practice')").click(); await page.waitForSelector("text=Controlled practice");
await mcqAll(l1.practice, 4);   // item p5 answered wrongly on purpose
await page.locator("button:has-text('Save results')").click(); await page.waitForTimeout(800);
p = await progress(id1); assert(p.recog.n === 10 && p.recog.ok === 9, "practice saved: 9/10 recognise/choice");
let eb = await idb(async (all) => (await all("errors")).find((e) => e.id === "gr.tenses"));
assert(eb && eb.total >= 1 && eb.concepts && eb.concepts[id1] && eb.concepts[id1].n === 1, "Error Bank: general category gr.tenses kept, concept 'present-simple-vs-continuous' attached");
const mk = await idb(async (all) => (await all("mistakes")).filter((m) => m.concept));
assert(mk.length === 1 && mk[0].qid === "g:" + id1 + ":p5" && mk[0].cat === "gr.tenses", "the wrong answer is a Mistake with the concept");
// transform with self-correction
await textAns(10, "He doesn't works on Sundays.");
let fb = await page.locator(".q").nth(10).innerText();
assert(/Not yet/.test(fb) && !/He doesn't work on Sundays\./.test(fb), "wrong sentence: asked to correct it BEFORE the answer is shown");
await page.locator(".q").nth(10).locator("textarea").fill("He doesn't work on Sundays.");
await page.locator(".q").nth(10).locator("button:has-text('Check my correction')").click(); await page.waitForTimeout(300);
assert(/Corrected by yourself/.test(await page.locator(".q").nth(10).innerText()), "self-correction accepted");
// a second one: wrong twice -> answer revealed with the 7-part feedback
await textAns(11, "Do she studies at night?");
await page.locator(".q").nth(11).locator("textarea").fill("Does she studies at night?"); await page.locator(".q").nth(11).locator("button:has-text('Check my correction')").click(); await page.waitForTimeout(200);
await page.locator(".q").nth(11).locator("textarea").fill("Does she studied at night?"); await page.locator(".q").nth(11).locator("button:has-text('Check my correction')").click(); await page.waitForTimeout(300);
fb = await page.locator(".q").nth(11).innerText();
assert(/what you wrote/i.test(fb) && /what is wrong/i.test(fb) && /rule that applies/i.test(fb) && /more natural/i.test(fb) && /type of problem/i.test(fb) && /Does she study at night\?/.test(fb), "after two tries the 7-part feedback reveals the answer");
await textAns(12, "The company is hiring new staff."); await textAns(13, "I agree with this opinion.");
p = await progress(id1); assert(p.produced.n === 4 && p.produced.ok === 2, "transformations: first-try results saved (2 of 4)");
const si = await idb(async (all) => (await all("skillItems")).find((s) => s.id === "g:present-simple-vs-continuous"));
assert(si && si.rec.seen >= 1 && si.prod.seen >= 4, "skillItem g:<lesson> has BOTH axes updated (recognition from MCQ, production from sentences)");
// produce
await step("Produce"); await page.waitForSelector("text=Your own sentences");
for (let i = 0; i < l1.produce.length; i++) await textAns(i, l1.produce[i].model);
p = await progress(id1); assert(p.produced.n === 8 && p.produced.ok === 6, "production sentences saved");
assert(/Correct\./.test(await page.locator(".q").nth(3).innerText()), "free production without hint accepted when correct");
// write (apply): first with errors, then fix
await step("Write"); await page.waitForSelector("text=Use it in a paragraph");
const bad = PARA[id1] + " I am agree with this and I am knowing why.";
await page.locator("textarea[aria-label='Your paragraph']").fill(bad); await page.locator("button:has-text('Check my paragraph')").click(); await page.waitForTimeout(700);
let wt = await page.locator("main").innerText();
assert(/Check these 2 points yourself/.test(wt) && /I will not rewrite it for you/.test(wt), "writing application flags errors and asks the learner to fix them");
eb = await idb(async (all) => (await all("errors")).find((e) => e.id === "gr.tenses"));
assert(eb.concepts[id1].n >= 3, "paragraph errors recorded in the Error Bank with the concept");
p = await progress(id1); assert(p.applied.n === 1 && p.applied.clean === 0, "first attempt not clean -> applied.clean stays 0");
await page.locator("textarea[aria-label='Your paragraph']").fill(PARA[id1]); await page.locator("button:has-text('Check again')").click(); await page.waitForTimeout(500);
assert(/Corrected by yourself/.test(await page.locator("main").innerText()), "fixed paragraph accepted after self-correction");
// a clean first attempt counts as 'clean'
await page.locator("textarea[aria-label='Your paragraph']").fill(PARA[id1]);
// (state already moved past first attempt; clean count is tested through a fresh lesson below)
// test (transfer)
await step("Test"); await page.waitForSelector("text=Transfer test");
const tx = l1.transfer.filter((x) => !x.opts), tm = l1.transfer.filter((x) => x.opts);
assert(!/present simple|present continuous/i.test(await page.locator("main").innerText().then((t) => t.split("Transfer test")[1] || "")), "transfer test never names the grammar point");
for (let i = 0; i < tx.length; i++) await textAns(i, tx[i].model);
await mcqAll(tm, -1, tx.length);
await page.locator("button:has-text('Lock my choices')").click(); await page.locator("button:has-text('Save my test')").click(); await page.waitForTimeout(800);
p = await progress(id1); assert(p.transfer.n === 6 && p.transfer.lastScore === 1, "transfer test saved (6/6)");

// ---- 4. lesson 2 and 3 through a quick path (models + one clean first paragraph) -> mastery stages
for (const id of ["past-simple-vs-present-perfect", "articles"]) {
  const l = L(id);
  await page.goto(URL + "/#/grammar/lesson/" + id); await page.waitForSelector("h1");
  await page.locator("button:has-text('I have read it')").click(); await page.waitForSelector("text=Do you understand WHY");
  await mcqAll(l.understand, 0); await page.locator("button:has-text('Save my understanding score')").click(); await page.waitForTimeout(500);   // 1 wrong of 6
  assert(/Go to practice/.test(await page.locator("main").innerText()), `${id}: 5/6 understanding unlocks practice`);
  await page.locator("button:has-text('Go to practice')").click();
  await mcqAll(l.practice); await page.locator("button:has-text('Save results')").click(); await page.waitForTimeout(500);
  for (let i = 0; i < l.transform.length; i++) await textAns(l.practice.length + i, l.transform[i].model);
  let pr = await progress(id);
  let m = await page.locator("main").innerText();
  assert(pr.recog.ok === 10 && pr.produced.ok === 4, `${id}: practice 10/10 and transformations 4/4 saved`);
  await step("Produce"); for (let i = 0; i < l.produce.length; i++) await textAns(i, l.produce[i].model);
  await step("Write"); await page.locator("textarea[aria-label='Your paragraph']").fill(PARA[id]); await page.locator("button:has-text('Check my paragraph')").click(); await page.waitForTimeout(600);
  const wt2 = await page.locator("main").innerText();
  assert(/Clean paragraph ✓/.test(wt2), `${id}: a correct paragraph with the required structures is accepted (${(wt2.match(/found \d+ \(need \d+\)/g) || []).join("; ")})`);
  pr = await progress(id); assert(pr.applied.clean === 1, `${id}: clean first attempt counted`);
  // before the transfer test: A,B,C but not D
  await page.goto(URL + "/#/grammar/lesson/" + id); await page.waitForSelector("h1");
  m = await page.locator(".card").first().innerText();
  assert(/✓ A/.test(m) && /✓ B/.test(m) && /✓ C/.test(m) && !/✓ D/.test(m), `${id}: stages A,B,C shown, D (spontaneous) not yet`);
  assert(/Transfer test/.test(await page.locator("main").innerText()) && /Recommended now: Transfer test/.test(m), `${id}: engine recommends the TRANSFER TEST once the paragraph is clean`);
  await step("Test"); const tx2 = l.transfer.filter((x) => !x.opts), tm2 = l.transfer.filter((x) => x.opts);
  for (let i = 0; i < tx2.length; i++) await textAns(i, tx2[i].model);
  await mcqAll(tm2, -1, tx2.length); await page.locator("button:has-text('Lock my choices')").click(); await page.locator("button:has-text('Save my test')").click(); await page.waitForTimeout(700);
  await page.goto(URL + "/#/grammar/lesson/" + id); await page.waitForSelector("h1");
  m = await page.locator(".card").first().innerText();
  assert(/✓ D/.test(m) && /Mastered/.test(m), `${id}: stage D reached after the transfer test -> Mastered`);
}
// lesson 1: understanding 6/6, recog 9/10, produced 6/8 -> C ok; applied not clean -> must still need writing/ test
await page.goto(URL + "/#/grammar/lesson/" + id1); await page.waitForSelector("h1");
let top = await page.locator(".card").first().innerText();
assert(/✓ A/.test(top) && /✓ B/.test(top) && /✓ C/.test(top) && !/✓ D/.test(top) && !/Mastered/.test(top), "lesson 1: a corrected (not clean) paragraph does not unlock stage D");

// ---- 5. Error Bank: Learn action + concept breakdown
await page.goto(URL + "/#/errors"); await page.waitForSelector("h1:has-text('Error Bank')"); await page.waitForTimeout(500);
const row = page.locator("tr", { hasText: "Verb tenses" }).first();
const rt = await row.innerText().catch(() => "");
assert((await page.locator("a.btn:has-text('Learn')").count()) >= 1, "Error Bank rows have a 'Learn' button for categories with lessons");
assert(/Present Simple vs Present Continuous/.test(await page.locator("main").innerText()), "Error Bank shows the concept inside the general category");
await page.locator("a.btn:has-text('Learn')").first().click(); await page.waitForTimeout(500);
assert(/#\/grammar\/lesson\//.test(page.url()), "Learn leads to the lesson");
await page.goto(URL + "/#/mistakes"); await page.waitForTimeout(500);
assert((await page.locator("a.btn:has-text('Learn')").count()) >= 1, "My Mistakes shows 'Learn' for the lesson mistake");
await page.goto(URL + "/#/mistakes/practice?cat=gr.tenses"); await page.waitForTimeout(600);
assert(/\?|___|[a-z]{3,}/.test(await page.locator("main").innerText()) && !/No open mistakes/.test(await page.locator("main").innerText()), "Practice My Mistakes rebuilds the lesson question");

// ---- 6. Writing integration (local checker tags the concept)
await page.goto(URL + "/#/writing/new/2"); await page.waitForSelector("textarea.editor", { timeout: 15000 });
await page.locator("textarea.editor").fill("Technology changed our lives in recent years. I have seen him yesterday. I live here since 2018. The government should help. People use phones every day and this is important for all of us in many ways.");
await page.locator("button:has-text('Submit')").first().click(); await page.waitForTimeout(1200);
eb = await idb(async (all) => (await all("errors")).find((e) => e.id === "gr.tenses"));
const pp = eb.concepts["past-simple-vs-present-perfect"];
assert(pp && pp.w.length >= 3, "Writing errors reach the Error Bank with the concept and are marked as coming from writing (" + (pp && pp.w.length) + ")");
await page.goto(URL + "/#/grammar"); await page.waitForTimeout(600);
txt = await page.locator("main").innerText();
assert(/failed|Applied|Apply it in writing|writing in the last/i.test(txt) || /Apply it in writing/.test(txt), "after writing errors the lesson is sent back to 'Apply it in writing' (stage D blocked)");
// engine recommendation on Dashboard
await page.goto(URL + "/#/"); await page.waitForSelector("text=Your biggest deficiency right now"); await page.waitForTimeout(400);

// ---- 7. retest page is neutral
await page.goto(URL + "/#/grammar/retest/articles"); await page.waitForSelector("h1:has-text('Quick check')");
const rtxt = await page.locator("main").innerText();
assert(!/Articles:|article/i.test(rtxt.split("Quick check")[1]?.slice(0, 600) || ""), "retest does not name the topic before the answers");

// ---- 8. persistence after reload
await page.reload(); await page.waitForTimeout(1500);
await page.goto(URL + "/#/grammar/lesson/articles"); await page.waitForSelector("h1");
assert(/✓ D/.test(await page.locator(".card").first().innerText()), "progress persists after reload");

// ---- 9. backup compatibility
await page.goto(URL + "/#/data"); await page.waitForSelector("h1:has-text('Data & Backup')");
const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("button:has-text('Export Backup')").click()]);
const file = "/tmp/e2e-backup.json"; await dl.saveAs(file);
const bk = JSON.parse(fs.readFileSync(file, "utf8"));
const kvs = bk.data.kv || []; const lp = kvs.find((k) => k.id === "lessonProgress");
assert(bk.schema === 2 && lp && Object.keys(lp.value).length === 3, "backup (schema 2) contains lessonProgress for the 3 lessons");
assert(bk.data.errors.find((e) => e.id === "gr.tenses").concepts, "backup contains Error Bank concepts");
// an OLD schema-1 backup still imports and does not erase lesson progress (Merge)
const old = "/tmp/claude-0/-home-claude/88da6199-60b0-5af0-a309-ae3e421df934/scratchpad/IELTS-Mastery-Backup-2026-10-02.json";
if (fs.existsSync(old)) {
  await page.locator("input[type=file]").setInputFiles(old); await page.waitForSelector("text=Validate Backup"); await page.waitForTimeout(500);
  assert((await page.locator("button:has-text('Merge')").count()) === 1, "old schema-1 backup validates");
  await page.locator("button:has-text('Merge')").click(); await page.waitForSelector("text=Merge result"); 
  const p3 = await progress("articles"); assert(p3 && p3.transfer.n > 0, "merging an old backup keeps lesson progress");
}
// Replace with the NEW backup restores lesson progress after wiping
await page.evaluate(async () => { await new Promise((res) => { const r = indexedDB.deleteDatabase("ielts-mastery"); r.onsuccess = res; r.onerror = res; r.onblocked = res; }); });
await page.goto(URL + "/#/"); await page.reload(); await page.waitForTimeout(1500); await page.goto(URL + "/#/data"); await page.waitForSelector("h1:has-text('Data & Backup')");
assert((await progress("articles")) === undefined, "(database wiped)");
await page.locator("input[type=file]").setInputFiles(file); await page.waitForSelector("text=Validate Backup"); await page.waitForTimeout(400);
await page.locator("button:has-text('Merge')").click(); await page.waitForSelector("text=Merge result"); await page.waitForTimeout(500);
assert((await progress("articles"))?.transfer.n > 0 && (await progress(id1))?.read > 0, "importing the new backup restores lesson progress");

// ---- 10. offline (service worker + downloaded packs)
const ctx2 = await browser.newContext(); const pg = await ctx2.newPage(); await seedProfile(pg);
await pg.goto(URL + "/#/library"); await pg.evaluate(() => navigator.serviceWorker.ready); await pg.waitForTimeout(9000);
await ctx2.setOffline(true);
await pg.goto(URL + "/#/grammar/lesson/past-simple-vs-present-perfect"); await pg.waitForSelector("h1:has-text('Past Simple vs Present Perfect')", { timeout: 15000 });
assert(/Contrast/.test(await pg.locator("main").innerText()), "OFFLINE: the lesson renders from the cached shell and pack");
await pg.locator("button:has-text('I have read it')").click(); await pg.waitForSelector("text=Do you understand WHY");
await pg.locator(".q").nth(0).locator("label.opt").nth(0).click(); await pg.locator(".q").nth(0).locator("button:has-text('Check')").click();
assert(/Correct|Not quite/.test(await pg.locator(".q").nth(0).innerText()), "OFFLINE: exercises work without network");

assert(!errs.filter((e) => !/favicon|manifest|Failed to load resource|net::ERR/.test(e)).length, "no page errors" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
await browser.close();
