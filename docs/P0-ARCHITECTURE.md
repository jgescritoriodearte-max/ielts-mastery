# IELTS Mastery 2.0 — P0 core: architecture and database changes

Four P0 pieces implemented as ONE integrated core: **Error Bank**, **two-axis SRS (recognition / production)**, **production tasks (Production Lab)**, **Adaptive Engine v2**.
Everything is local (IndexedDB), offline, no paid dependency. Backup tag before the work: `v2-baseline`.

## 1. Data flow (how the four pieces talk)

```
 any answer / feedback                     taxonomy.ts  (ONE vocabulary of ~50 error categories: gr.* lx.* dc.* ls.* vb.* sp.* rd:* )
 ──────────────────────                     ▲
 quiz, grammar, listening, reading,         │ categorize()
 vocab, mistakes practice,  ───────────►  store.recordAttempt / reviewVocab / reviewSkillItem / addFeedbackMistakes
 Claude feedback import, local essay            │
 checker, Production Lab                        ├─► errors      (Error Bank: one ErrorStat per category, timestamped events)
                                                ├─► mistakes    (individual items, spaced re-check 1/3/7 days, + cat, cause, src, due)
                                                ├─► vocab       (rec axis = legacy fields, prod axis = vocab.prod)
                                                ├─► skillItems  (grammar structures: rec axis + prod axis + writing usage)
                                                └─► reviews     (append-only log: item, axis, task, ok, grade, ms, cat)
 engine.ts (pure) reads errors + vocab + skillItems + attempts + profile ─► diagnose(): biggest deficiency + most useful activity
 planner.ts / Dashboard / Production Lab / Error Bank page consume engine.ts
```
- Error Bank → SRS: a failed category creates due mistakes (re-check ladder) and a Production Lab session for that category.
- Production tasks → Error Bank: every failed production (word, rewrite, grammar sentence) files an event; every success raises the category's streak.
- Production → SRS: typed/produced answers update the **production** axis; picking/flipping updates the **recognition** axis. A word is *due* when either axis is due.
- Engine → everything: weights the daily plan and chooses the activity (route) that corrects the main deficiency.

## 2. Database changes (IndexedDB `ielts-mastery`, version 1 → 2, backup schema 1 → 2)
Additive only. No existing record is rewritten except that old mistakes get `cat/src/due` (and Listening `cause`) once, by `migrateCore()` (flag `kv.coreMigrated`).

| Store (new) | Key | Content |
|---|---|---|
| `errors` | category id | `ErrorStat`: `cat, area, first, last, total, events[] (timestamps, max 80), eventAreas[], streak, relapses, lastStatus, src{}, ex[] (last 5 examples)` |
| `reviews` | id | `Review`: `ts, item, kind(vocab/skill/mistake), axis(rec/prod), task, ok, grade, ms, cat` (append-only log; basis for future calibration) |
| `skillItems` | `g:<topic>` | `SkillItem`: grammar structure with `rec`, `prod` (AxisState) and `writing {uses, errors, last}` |

Changed records (all new fields optional): `Mistake` + `cat, cause, due, src`; `VocabState` + `streak, emaMs, prod` (production AxisState); `Profile` + `priors`; `Writing` + reserved `versions` (not used yet; P1).
`AxisState = {reps, interval, ease, due, lapses, seen, ok, bad, lastTs, streak, emaMs}`.
Backups iterate all stores, so the new ones are included; schema-1 backups still import (missing stores = empty).

## 3. Components
- **taxonomy.ts** — categories incl. the 21 Writing dimensions the user listed and the Listening causes (didn't know the word / knew it but missed it in connected speech / heard but didn't understand / fell for the distractor / lost concentration / numbers / speed / accent / reduced forms / prediction / paraphrase / lost the next answers). `categorize()` maps any source to a category.
- **srs.ts** — SM-2-style steps per axis (recognition arithmetic identical to the old `grade()`); response-time EMA; streak; exam-date cap; `stageOf` (new/learning/consolidated); `knowledgeOf` (none/acquired/automated); `wordProfile().productionGap` (recognised but not produced).
- **errorbank.ts** — `classify()`: occasional vs recurring; weak / developing / consolidated; relapse; recency-weighted `load()`.
- **engine.ts** — `areaScores` (importance × weakness × recency per Writing/Grammar/Listening/Reading/Speaking), `errorDeficiencies`, `productionDeficiency`, `diagnose()`, `plannerWeights()`.
- **Pages** — `ErrorBank.tsx` (#/errors), `Produce.tsx` (#/produce[?cat=|?focus=vocab]); integrations in Vocabulary, Mistakes (?cat=, Listening cause selector), Writing/Speaking (feedback → Error Bank), Settings (priors), Dashboard (diagnosis), planner (engine weights + deficiency task).

## 4. How the engine decides
`score(area) = importance × weakness × recency`
- importance: user prior (Writing 1.0, Grammar 0.85, Listening 0.85, Reading 0.5, Speaking 0.5; editable in Settings) drifting toward 0.7 as evidence (last 60 days) grows, at most 50%.
- weakness: gap to target band (or Grammar accuracy) blended 65/35 with the recency-weighted Error Bank load; unknown level = "probably weak" baseline (0.75; Speaking 0.6) that errors can only raise; floor 0.15.
- recency: 0.8 → 1.5 as days since last practice go 0 → 10 (never practised = 1.5).
Concrete deficiencies (error categories, production gap, reviews due) are scored `importance × severity × load × recurring/relapse boosts`; `diagnose().best` is the highest concrete deficiency tied to the main area, else the main area's skill session. Daily-plan weights = engine scores with a 25% maintenance floor.

## 5. PROJECT ESTIMATES (not research results)
All numbers: priors and levels; NEUTRAL_IMPORTANCE .7; MAX_PRIOR_FADE .5; EVIDENCE_FOR_FULL_FADE 60; UNKNOWN_WEAKNESS .75/.6; WEAKNESS_FLOOR .15; GAP_FULL_BANDS 1.5; ERR_BLEND .35; ERR_LOAD_FULL 8; RECENCY .8–1.5 over 10 days; MAINTENANCE_SHARE .25; error thresholds (recurring = 3 in 30 days; consolidated = 5 correct + 14 quiet days; weak until 3 correct; half-life 14 days; re-check 1/3/7 days); severities per category; SRS: consolidated = interval ≥21 d + streak ≥3; automated = EMA ≤ 4 s (recognition) / 12 s (production); exam cap = days/3; grammar-topic grade thresholds (≥80% good, ≥60% hard).
Research-backed ONLY at the level of principles: retrieval practice, spaced re-testing, corrective feedback. The constants are in the files named above and should be recalibrated with the `reviews` log.

## 6. Tests
- `npx tsx tests/core.test.ts` — 14 unit tests of the pure modules.
- `node tests/e2e.mjs` (serve `dist/` on :5190) — Playwright: builds a legacy schema-1 DB, checks upgrade + migration, dashboard diagnosis, cause refinement, vocab axes, Production Lab, priors, backup content, no page errors.
- `npm run audit` — content audit (unchanged).

## 7. Known limitations
See the delivery report: self-judged free sentences, no Writing rewrite/compare yet, `writing.uses` counts failures only, thresholds uncalibrated, Listening cause is user-confirmed, etc.
