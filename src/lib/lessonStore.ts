/* Persistence for the Grammar Learning Layer. Everything lives in kv.lessonProgress (additive; already part of backups).
   Recording rules:
   - MCQ answers (practice, transfer) go through recordAttempt: itemStats, Mistakes, Error Bank (with the lesson concept) and the recognition axis of g:<lessonId>.
   - Free-text answers feed the PRODUCTION axis of g:<lessonId> and, when wrong, the Error Bank (with the concept) like the Production Lab does.
   - Understanding-check answers only update lesson progress: a wrong "why" answer means "explain again", not "a sentence error". */
import { getState, reviewSkillItem, setKV, addFeedbackMistakes } from "./store";
import { blankProgress, type LessonProgress } from "./lessons";
import { CONCEPTS } from "./concepts";

export const progressOf = (id: string): LessonProgress | undefined => (getState().kv.lessonProgress || {})[id];
export const allProgress = (): Record<string, LessonProgress> => (getState().kv.lessonProgress || {}) as Record<string, LessonProgress>;

let queue: Promise<void> = Promise.resolve();
/** Serialised read-modify-write of one lesson's progress. */
export function updateProgress(id: string, fn: (p: LessonProgress) => LessonProgress): Promise<void> {
  queue = queue.then(async () => {
    const all = { ...allProgress() };
    all[id] = fn(all[id] || blankProgress());
    await setKV("lessonProgress", all);
  }).catch(() => {});
  return queue;
}

/** One free-text answer: production axis + Error Bank (when wrong). grade: 0 wrong, 1 corrected after a hint, 2 right first time. */
export async function recordTextAnswer(lessonId: string, grade: 0 | 1 | 2, ms: number, ex: { a: string; b: string }, task: string): Promise<void> {
  const c = CONCEPTS[lessonId];
  await reviewSkillItem("g:" + lessonId, "prod", grade, { task, ms, cat: c.cat, label: lessonId, ex: grade === 0 ? ex : undefined, concept: lessonId });
}

/** Errors found in a writing application: Error Bank events with the concept, one Mistake per issue (idempotent by attempt id). */
export async function recordApplyErrors(lessonId: string, title: string, found: { original: string; correction: string; explanation: string }[]): Promise<number> {
  if (!found.length) return 0;
  const c = CONCEPTS[lessonId];
  return addFeedbackMistakes({ skill: "W", id: `lesson-${lessonId}-${Date.now()}`, label: title }, found.map((f) => ({ ...f, cat: c.cat, raw: title, concept: lessonId })), "lesson-apply");
}
