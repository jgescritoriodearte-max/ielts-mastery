/* Unit tests for the pure core (no browser). Run: npx tsx tests/core.test.ts */
import assert from "node:assert/strict";
import { stepAxis, blankAxis, stageOf, knowledgeOf, wordProfile, gradeAxis, grade, isDue, status } from "../src/lib/srs";
import { recordError, recordCorrect, classify, load, nextMistakeState } from "../src/lib/errorbank";
import { categorize, catOfAi, catOfLocal, catOfGrammarTopic, topicsOfCat } from "../src/lib/taxonomy";
import { areaScores, diagnose, DEFAULT_PRIORS, plannerWeights, errorDeficiencies } from "../src/lib/engine";
import { conceptOfQid, conceptOfText, learnTarget } from "../src/lib/concepts";
import { evalSpec, masteryOf, lessonMode, blankProgress, P, conceptEvidence, segments } from "../src/lib/lessons";
import { analyseWriting } from "../src/lib/localWriting";
import { LESSONS } from "../content/lessons.mjs";

let n = 0; const t = (name: string, f: () => void) => { f(); n++; console.log("ok -", name); };
const DAY = 864e5;

t("SRS recognition axis keeps the legacy interval arithmetic", () => {
  let v = grade(undefined, "w", 2); assert.equal(v.interval, 1);
  v = grade(v, "w", 2); assert.equal(v.interval, 3);
  v = grade(v, "w", 0); assert.equal(v.interval, 0); assert.equal(v.lapses, 1);
  assert.equal(status(v), "Learning");
});
t("two axes are independent", () => {
  let v = gradeAxis(undefined, "w", "rec", 2); v = gradeAxis(v, "w", "rec", 2);
  assert.equal(v.prod, undefined);
  v = gradeAxis(v, "w", "prod", 0);
  assert.equal(v.reps, 2); assert.equal(v.prod!.reps, 0); assert.equal(v.prod!.lapses, 1);
  assert.equal(wordProfile(v).productionGap, true);   // recognised but cannot produce
});
t("production gap disappears when production is learned", () => {
  let v = gradeAxis(undefined, "w", "rec", 2);
  for (let i = 0; i < 3; i++) v = gradeAxis(v, "w", "prod", 2);
  assert.equal(wordProfile(v).productionGap, false);
});
t("due when either axis is due", () => {
  let v = gradeAxis(undefined, "w", "rec", 3); v = gradeAxis(v, "w", "rec", 3);   // rec pushed far away
  assert.equal(isDue(v), false);
  v = gradeAxis(v, "w", "prod", 0);   // prod due today
  assert.equal(isDue(v), true);
});
t("stage and knowledge: new -> learning -> consolidated; acquired vs automated needs speed", () => {
  assert.equal(stageOf(undefined), "new");
  let a = blankAxis();
  for (let i = 0; i < 6; i++) a = stepAxis(a, 3, 2000);
  assert.equal(stageOf(a), "consolidated"); assert.equal(knowledgeOf(a, "rec"), "automated");
  let b = blankAxis(); for (let i = 0; i < 6; i++) b = stepAxis(b, 3, 20000);
  assert.equal(knowledgeOf(b, "rec"), "acquired");   // slow answers: acquired, not automated
  assert.equal(knowledgeOf(blankAxis(), "rec"), "none");
});
t("exam date caps the interval", () => {
  let a = blankAxis(); for (let i = 0; i < 6; i++) a = stepAxis(a, 3, 0, 30);
  assert.ok(a.interval <= 10);
});
t("Error Bank: occasional vs recurring vs weak vs consolidated vs relapse", () => {
  const now = Date.now();
  let s = recordError(undefined, "gr.articles", "W", "x", now - 40 * DAY);
  assert.equal(classify(s, now).recurring, false);
  for (let i = 0; i < 3; i++) s = recordError(s, "gr.articles", "W", "x", now - (5 - i) * DAY);
  assert.equal(classify(s, now).recurring, true); assert.equal(classify(s, now).status, "weak");
  for (let i = 0; i < 3; i++) s = recordCorrect(s, now)!;
  assert.equal(classify(s, now).status, "developing");
  // consolidated needs 5 correct AND 14 quiet days
  let c = recordError(undefined, "gr.tenses", "G", "x", now - 20 * DAY);
  for (let i = 0; i < 5; i++) c = recordCorrect(c, now)!;
  assert.equal(classify(c, now).status, "consolidated");
  const r = recordError(c, "gr.tenses", "G", "x", now);
  assert.equal(r.relapses, 1); assert.equal(r.streak, 0);
});
t("recency weighting: old errors count less", () => {
  const now = Date.now();
  const old = recordError(undefined, "c", "W", "x", now - 28 * DAY), fresh = recordError(undefined, "c", "W", "x", now);
  assert.ok(load(fresh, now) > 3 * load(old, now));
});
t("mistake re-check ladder 1/3/7 days; resolved after 2 correct", () => {
  const m: any = { reviewOk: 0, reviewCount: 0 };
  const a = nextMistakeState(m, true); assert.equal(a.resolved, false);
  const b = nextMistakeState({ ...m, ...a } as any, true); assert.equal(b.resolved, true);
  assert.equal(nextMistakeState(m, false).reviewOk, 0);
});
t("taxonomy: sources map to shared categories", () => {
  assert.equal(categorize({ skill: "L", qid: "q", qtype: "", tag: "numbers", ref: "" }), "ls.numbers");
  assert.equal(categorize({ skill: "G", qid: "g:conditionals:3", qtype: "", tag: "", ref: "" }), "gr.conditionals");
  assert.equal(categorize({ skill: "V", qid: "v:blank:x", qtype: "", tag: "", ref: "" }), "vb.production");
  assert.equal(categorize({ skill: "V", qid: "v:mc:x", qtype: "", tag: "", ref: "" }), "vb.recognition");
  assert.equal(categorize({ skill: "R", qid: "q", qtype: "Matching Headings", tag: "", ref: "" }), "rd:Matching Headings");
  assert.equal(catOfAi("Subject-verb agreement"), "gr.sva"); assert.equal(catOfLocal("Articles"), "gr.articles");
  assert.equal(catOfAi("Lexical Resource: collocation"), "lx.collocation");
  assert.ok(topicsOfCat("gr.tenses").includes("present-perfect")); assert.equal(catOfGrammarTopic("hedging"), "lx.register");
});
const baseState = (over: any = {}): any => ({ profile: { target: 7, skillTargets: { L: 7, R: 7, W: 7, S: 7 }, examDate: "", priors: undefined }, attempts: [], writings: [], recordings: [], mocks: [], external: [], vocab: {}, mistakes: [], errors: {}, reviews: [], skillItems: {}, itemStats: {}, kv: {}, sessions: {}, ...over });
t("engine with no data starts from the profile priors: Writing first, Speaking/Reading last", () => {
  const as = areaScores(baseState());
  assert.equal(as[0].area, "W"); assert.ok(["R", "S"].includes(as[as.length - 1].area));
  assert.ok(as.find((a) => a.area === "G")!.score > as.find((a) => a.area === "R")!.score);
});
t("engine is dynamic: errors in Reading and none in Writing raise Reading", () => {
  const now = Date.now(); let st: any = undefined;
  for (let i = 0; i < 10; i++) st = recordError(st, "rd:Matching Headings", "R", "quiz", now - i * 3600e3);
  const before = areaScores(baseState()).find((a) => a.area === "R")!.score;
  const after = areaScores(baseState({ errors: { "rd:Matching Headings": st } })).find((a) => a.area === "R")!.score;
  assert.ok(after > before);
});
t("engine: strong evidence of high Writing band lowers its weight", () => {
  const mk = (b: number) => baseState({ writings: Array.from({ length: 6 }, (_, i) => ({ status: "submitted", task: 2, submittedAt: Date.now() - i * DAY, updatedAt: Date.now(), ai: { overall: b, criteria: { TR: b, CC: b, LR: b, GRA: b }, importedAt: Date.now() } })) });
  const weak = areaScores(mk(5.5)).find((a) => a.area === "W")!, strong = areaScores(mk(7.5)).find((a) => a.area === "W")!;
  assert.ok(strong.weakness < weak.weakness);
});
t("diagnose returns one concrete activity and a route; weights keep a maintenance floor", () => {
  const d = diagnose(baseState(), { vocab: [], grammar: [] } as any);
  assert.ok(d.best.route.startsWith("#/")); assert.ok(d.question.length > 10);
  const { w } = plannerWeights(baseState()); for (const k of Object.keys(DEFAULT_PRIORS)) assert.ok((w as any)[k] >= 0.5 + 3 * 0.25 - 1e-9);
});

/* ===================== Grammar Learning Layer ===================== */
const LES: any[] = LESSONS as any;
t("concepts: qid -> concept, alias and text heuristics", () => {
  assert.equal(conceptOfQid("g:past-simple-vs-present-perfect:p3"), "past-simple-vs-present-perfect");
  assert.equal(conceptOfQid("g:articles:4"), "articles");
  assert.equal(conceptOfQid("g:present-perfect:2"), "past-simple-vs-present-perfect");   // older topic feeds the lesson
  assert.equal(conceptOfQid("g:tenses:2"), undefined); assert.equal(conceptOfQid("L:abc"), undefined);
  assert.equal(conceptOfText("Present perfect vs past simple"), "past-simple-vs-present-perfect");
  assert.equal(conceptOfText("Missing article"), "articles");
  assert.equal(catOfGrammarTopic("past-simple-vs-present-perfect"), "gr.tenses");
});
t("Error Bank keeps the general category and refines it with a concept (optional field)", () => {
  const now = Date.now();
  let st = recordError(undefined, "gr.tenses", "G", "quiz", now);           // old call shape still works
  assert.equal(st.concepts, undefined);
  st = recordError(st, "gr.tenses", "W", "local-writing", now, undefined, "past-simple-vs-present-perfect");
  st = recordError(st, "gr.tenses", "G", "lesson", now, undefined, "past-simple-vs-present-perfect");
  const c = st.concepts!["past-simple-vs-present-perfect"];
  assert.equal(c.n, 2); assert.equal(c.w.length, 1); assert.equal(st.total, 3); assert.equal(c.streak, 0);
  st = recordCorrect(st, now, "past-simple-vs-present-perfect"); st = recordCorrect(st, now, "past-simple-vs-present-perfect");
  assert.equal(st.concepts!["past-simple-vs-present-perfect"].streak, 2);
  const ev = conceptEvidence(st, "past-simple-vs-present-perfect", now);
  assert.equal(ev.recent, 2); assert.equal(ev.writing, 1);
});
t("evalSpec: accept / must / mustNot / too short", () => {
  assert.equal(evalSpec("He doesn't work on Sundays.", { must: ["\\b(does not|doesn't) work\\b"], mustNot: [{ re: "\\bworks\\b", why: "x" }] }).verdict, "ok");
  const r = evalSpec("He doesn't works on Sundays.", { must: ["\\b(does not|doesn't) work\\b"], mustNot: [{ re: "\\bworks\\b", why: "no -s" }] });
  assert.equal(r.verdict, "wrong"); assert.equal(r.hits[0].why, "no -s");
  assert.equal(evalSpec("Does she study at night?", { accept: ["^does she study at night\\?*$"] }).verdict, "ok");
  assert.equal(evalSpec("ok", { must: ["x"] }).verdict, "unsure");
  assert.deepEqual(segments("a **b** c").map((x) => x.b), [false, true, false]);
});
t("lesson content integrity: structure, answer keys, regexes", () => {
  assert.equal(LES.length, 3);
  for (const l of LES) {
    for (const k of ["objective", "why", "concept", "formation", "whenUse", "whenNot", "contrast", "examples", "pitfalls", "errors", "ielts", "understand", "practice", "transform", "produce", "apply", "transfer"]) assert.ok(l[k], `${l.id}.${k}`);
    assert.ok(l.pitfalls.length >= 5 && l.errors.length >= 6 && l.contrast.rows.length >= 5 && l.whenNot.length >= 4, l.id);
    for (const q of [...l.understand, ...l.practice, ...l.transfer.filter((x: any) => x.opts)]) { assert.ok(q.opts.length >= 2 && q.a >= 0 && q.a < q.opts.length && q.why, `${l.id}:${q.id}`); }
    for (const it of [...l.transform, ...l.produce, ...l.transfer.filter((x: any) => !x.opts)]) {
      const re = [...(it.spec.accept || []), ...(it.spec.must || []), ...(it.spec.mustNot || []).map((m: any) => m.re)]; re.forEach((r: string) => new RegExp(r, "i"));
      assert.equal(evalSpec(it.model, it.spec).verdict, "ok", `${l.id}:${it.id} model must pass its own spec`);
    }
    for (const u of l.apply.mustUse) new RegExp(u.re, "gi"); for (const m of l.apply.mustNot) new RegExp(m.re, "gi");
    assert.equal(new Set(l.practice.map((p: any) => p.id)).size, l.practice.length);
    assert.ok(l.practice.filter((p: any) => p.stage === "recognise").length >= 3 && l.practice.filter((p: any) => p.stage === "choice").length >= 5);
    assert.ok(l.transfer.some((x: any) => !x.opts) && l.transfer.some((x: any) => x.opts), "transfer mixes MCQ and free text");
  }
});
t("lesson content: known wrong sentences are caught, right ones accepted", () => {
  const L = (id: string) => LES.find((l: any) => l.id === id);
  const get = (id: string, sec: string, iid: string) => L(id)[sec].find((x: any) => x.id === iid);
  const v = (id: string, sec: string, iid: string, txt: string) => evalSpec(txt, get(id, sec, iid).spec).verdict;
  assert.equal(v("present-simple-vs-continuous", "transform", "r1", "He doesn't works on Sundays."), "wrong");
  assert.equal(v("present-simple-vs-continuous", "transform", "r4", "I am agree with this opinion."), "wrong");
  assert.equal(v("present-simple-vs-continuous", "produce", "s4", "I am knowing the answer and wanting a coffee."), "wrong");
  assert.equal(v("past-simple-vs-present-perfect", "transform", "r3", "I have visited Rome in 2019."), "wrong");
  assert.equal(v("past-simple-vs-present-perfect", "transform", "r2", "Technology changed our lives in recent years."), "wrong");
  assert.equal(v("past-simple-vs-present-perfect", "produce", "s3", "I live here since 2018 for study."), "wrong");
  assert.equal(v("past-simple-vs-present-perfect", "transform", "r1", "I have lived here since 2018."), "ok");
  assert.equal(v("articles", "transform", "r1", "She is engineer."), "wrong");
  assert.equal(v("articles", "transform", "r2", "I need an advice."), "wrong");
  assert.equal(v("articles", "produce", "s4", "The education is very important."), "wrong");
  assert.equal(v("articles", "produce", "s4", "Education is very important."), "ok");
});
t("writing checker tags concepts and avoids the old article false positive", () => {
  const bad = analyseWriting("Technology changed our lives in recent years. I have seen him yesterday. I am knowing it. The education is important. He is doctor. I live here since 2018.", 2).issues;
  const cs = new Set(bad.map((i) => i.concept).filter(Boolean));
  assert.ok(cs.has("past-simple-vs-present-perfect") && cs.has("present-simple-vs-continuous") && cs.has("articles"));
  const good = analyseWriting("Education plays a vital role. Technology has changed our lives in recent years. She is an engineer. I have lived here since 2018.", 2).issues;
  assert.equal(good.filter((i) => i.concept).length, 0);
});
t("mastery: multiple choice alone can never be 'mastered'", () => {
  const now = Date.now(); let p = blankProgress(now);
  p = P.read(p, now); p = P.understand(p, 6, 6, now);
  for (let i = 0; i < 8; i++) p = P.recog(p, true, now);
  let m = masteryOf(p); assert.ok(m.A && m.B && !m.C && !m.D && !m.mastered);
  for (let i = 0; i < 5; i++) p = P.produced(p, true, now);
  p = P.transfer(p, 6, 6, now);
  m = masteryOf(p); assert.ok(m.A && m.B && m.C && !m.D, "transfer without a clean paragraph is not stage D");
  p = P.applied(p, true, true, now);
  m = masteryOf(p); assert.ok(m.mastered && m.stages === 4);
  assert.ok(!masteryOf(p, { recent: 0, writing: 2, total: 2, streak: 0 }).D, "recent errors in real writing block stage D");
});
t("lessonMode: teach / reteach / practise / apply / test / retest / done", () => {
  const now = Date.now(); const ev0 = { recent: 0, writing: 0, total: 0, streak: 0 };
  assert.equal(lessonMode(undefined, { recent: 4, writing: 1, total: 4, streak: 0 }).mode, "teach");
  let p = P.read(blankProgress(now), now);
  assert.equal(lessonMode(p).step, "check");
  p = P.understand(p, 2, 6, now); assert.equal(lessonMode(p).mode, "reteach");           // cannot explain the reason -> explain again
  p = P.understand(p, 6, 6, now); assert.equal(lessonMode(p).mode, "practise");          // understands, cannot recognise/produce -> controlled practice
  for (let i = 0; i < 8; i++) { p = P.recog(p, true, now); p = P.produced(p, true, now); }
  assert.equal(lessonMode(p).mode, "apply");                                             // produces in isolation, never applied in a paragraph
  assert.equal(lessonMode(p, { recent: 1, writing: 3, total: 3, streak: 0 }).mode, "apply");   // fails in writing -> writing application
  p = P.applied(p, true, true, now); assert.equal(lessonMode(p).mode, "test");           // performing well -> reduce support, test transfer
  p = P.transfer(p, 6, 6, now); assert.equal(lessonMode(p, ev0).mode, "done");
  assert.equal(lessonMode(p, ev0, true).mode, "retest");
});
t("engine: errors concentrated on a concept route to the lesson (explanation), not to more drills", () => {
  const now = Date.now(); const cat = "gr.tenses"; let st: any;
  for (let i = 0; i < 4; i++) st = recordError(st, cat, "W", "local-writing", now - i * 1000, undefined, "past-simple-vs-present-perfect");
  const s = baseState({ errors: { [cat]: st }, mistakes: [{ resolved: false, cat }] });
  const lessons = LES.map((l: any) => ({ id: l.id, cat: l.cat, title: l.title, minutes: l.minutes }));
  const d1 = errorDeficiencies(s, areaScores(s, now), now, lessons as any).find((x) => x.cat === cat)!;
  assert.equal(d1.mode, "teach"); assert.ok(d1.route.includes("lesson/past-simple-vs-present-perfect")); assert.ok(d1.action.startsWith("Learn"));
  // same errors, but the learner read the lesson and cannot explain it -> reteach
  let p = P.understand(P.read(blankProgress(now), now), 1, 6, now);
  const s2 = baseState({ errors: { [cat]: st }, mistakes: [], kv: { lessonProgress: { "past-simple-vs-present-perfect": p } } });
  assert.equal(errorDeficiencies(s2, areaScores(s2, now), now, lessons as any).find((x) => x.cat === cat)!.mode, "reteach");
  // without lessons the engine behaves exactly as before
  assert.ok(!errorDeficiencies(s, areaScores(s, now), now).find((x) => x.cat === cat)!.mode);
});
t("Learn button target: concept first, otherwise the only lesson of the category", () => {
  const av = [{ id: "present-simple-vs-continuous", cat: "gr.tenses" }, { id: "past-simple-vs-present-perfect", cat: "gr.tenses" }, { id: "articles", cat: "gr.articles" }];
  assert.equal(learnTarget({ qid: "x", cat: "gr.tenses", concept: "past-simple-vs-present-perfect" }, av), "past-simple-vs-present-perfect");
  assert.equal(learnTarget({ qid: "local-writing:w1:0", cat: "gr.articles" }, av), "articles");
  assert.equal(learnTarget({ qid: "local-writing:w1:0", cat: "gr.tenses" }, av), undefined);   // two lessons share the category: never guess
  assert.equal(learnTarget({ qid: "g:tenses:2", cat: "gr.tenses", skill: "G" }, av), undefined);
});

console.log(`\n${n} tests passed`);
