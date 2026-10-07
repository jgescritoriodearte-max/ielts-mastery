/* Unit tests for the pure core (no browser). Run: npx tsx tests/core.test.ts */
import assert from "node:assert/strict";
import { stepAxis, blankAxis, stageOf, knowledgeOf, wordProfile, gradeAxis, grade, isDue, status } from "../src/lib/srs";
import { recordError, recordCorrect, classify, load, nextMistakeState } from "../src/lib/errorbank";
import { categorize, catOfAi, catOfLocal, catOfGrammarTopic, topicsOfCat } from "../src/lib/taxonomy";
import { areaScores, diagnose, DEFAULT_PRIORS, plannerWeights } from "../src/lib/engine";

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
console.log(`\n${n} tests passed`);
