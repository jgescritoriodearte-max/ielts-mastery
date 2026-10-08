/* Specific grammar CONCEPTS (one per explanatory lesson). The Error Bank keeps its general categories (e.g. gr.tenses);
   a concept is an optional refinement stored next to the category, so the app can tell
   "weak with verb tenses in general" from "weak at telling Past Simple from Present Perfect".
   Dependency-free on purpose (used by store, engine, taxonomy-level code and the lesson pages). */
export const CONCEPTS: Record<string, { cat: string; title: string }> = {
  "present-simple-vs-continuous": { cat: "gr.tenses", title: "Present Simple vs Present Continuous" },
  "past-simple-vs-present-perfect": { cat: "gr.tenses", title: "Past Simple vs Present Perfect" },
  articles: { cat: "gr.articles", title: "Articles: a / an / the / zero article" },
};
export const isConcept = (id: string | undefined | null): id is string => !!id && Object.prototype.hasOwnProperty.call(CONCEPTS, id);

/** Lesson items use qids like "g:<lessonId>:p3" (practice), ":u2" (understanding), ":pr1" (production), ":t4" (transfer). */
export function conceptOfQid(qid: string): string | undefined {
  const m = String(qid || "").match(/^g:([^:]+):/);
  if (!m) return undefined;
  const id = ALIAS[m[1]] || m[1];
  return isConcept(id) ? id : undefined;
}
/** Older grammar topics whose exercises already teach one concept (so their errors also feed the lesson). */
const ALIAS: Record<string, string> = { "present-perfect": "past-simple-vs-present-perfect" };

/** Best-effort concept from free text (an AI feedback category or a note). Returns undefined when it is not clear. */
export function conceptOfText(text: string): string | undefined {
  const t = String(text || "").toLowerCase();
  if (/present perfect|past simple.*perfect|perfect.*past simple|since\b.*\bfor\b/.test(t)) return "past-simple-vs-present-perfect";
  if (/present continuous|present progressive|stative|simple.*continuous|continuous.*simple/.test(t)) return "present-simple-vs-continuous";
  if (/\barticle|determiner/.test(t)) return "articles";
  return undefined;
}

/** Which lesson explains this mistake? The concept first; otherwise the only lesson of its category (never a guess between two). */
export function learnTarget(m: { concept?: string; qid: string; tag?: string; explanation?: string; cat?: string; skill?: string }, available: { id: string; cat: string }[]): string | undefined {
  const has = (id?: string) => !!id && available.some((l) => l.id === id);
  const c = m.concept || conceptOfQid(m.qid) || (m.skill === "W" || m.skill === "S" ? conceptOfText(`${m.tag || ""} ${m.explanation || ""}`) : undefined);
  if (has(c)) return c;
  const sameCat = available.filter((l) => l.cat === m.cat);
  return sameCat.length === 1 ? sameCat[0].id : undefined;
}
