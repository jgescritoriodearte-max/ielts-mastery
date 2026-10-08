# Grammar Learning Layer (Phase 0 prototype: 3 lessons)

TEACH (explanatory lesson) → TRAIN (practice, production) → TEST (writing application, transfer).
Lessons: `present-simple-vs-continuous`, `past-simple-vs-present-perfect`, `articles`. Nothing else was added to the curriculum.

## Where things live
| What | File |
|---|---|
| Lesson content (schema = `Lesson` in `src/lib/lessons.ts`) | `content/lessons/<id>.mjs`, listed in `content/lessons.mjs`, shipped in pack `grammar-01` as `data.lessons` |
| Pure logic: `evalSpec`, mastery A–D, `lessonMode` (teach/reteach/practise/apply/test/retest/done) | `src/lib/lessons.ts` |
| Concepts (lesson id = optional refinement of an Error Bank category), `learnTarget` | `src/lib/concepts.ts` |
| Persistence (`kv.lessonProgress`, answer recording) | `src/lib/lessonStore.ts` |
| UI | `src/pages/Lesson.tsx`, `src/pages/Grammar.tsx` (cards, routes `lesson/<id>`, `retest/<id>`) |
| Error Bank / Mistakes "Learn" | `src/pages/ErrorBank.tsx`, `src/pages/Mistakes.tsx` |
| Engine routing and spaced retest | `src/lib/engine.ts` (`lessonForCat`, `lessonRetests`, optional `lessons` argument) |
| Writing integration | `src/lib/localWriting.ts` (rules carry a `concept`), `src/pages/Writing.tsx` |

## Data (all additive and optional)
* `ErrorStat.concepts?[conceptId] = { n, last, ev[], w[], streak }` (`w` = events that came from writing sources).
* `Mistake.concept?`, `ItemResult.concept?`.
* `kv.lessonProgress[lessonId]` = read / understand / recog / produced / applied / transfer tallies.
* Skill item `g:<lessonId>` uses the existing two axes (rec from multiple choice, prod from sentences).
* The general category (e.g. `gr.tenses`) is always kept; the concept only refines it.

## Mastery (thresholds are PROJECT ESTIMATES)
A Recognise ≥75% of the last 8 multiple-choice answers (≥6 answered) · B Understand ≥70% in the understanding check ·
C Produce ≥70% of the last 8 free-text answers (≥4) · D Spontaneous: transfer test ≥70% AND ≥1 clean paragraph on the first attempt AND <2 writing errors on the concept in 30 days.
Multiple choice alone (A, B) can never give "Mastered".

## Limits
Free-text checking is rule-based (regular expressions written per item). It can miss errors or flag correct text; the UI says so and always shows a model answer for comparison.
