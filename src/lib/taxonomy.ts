/* Error taxonomy: ONE vocabulary of error categories shared by Writing, Grammar, Listening, Reading, Vocabulary and Speaking.
   Every wrong answer / feedback item is mapped to a category id; the Error Bank, the SRS and the adaptive engine all speak this language.
   PROJECT DESIGN: the list of categories follows the diagnostic dimensions the user asked for (Writing: grammar accuracy, lexis, discourse;
   Listening: cause of the miss). Severity values are project estimates, not research findings. */
import type { AnySkill } from "./types";

export interface CatDef { id: string; label: string; group: string; areas: AnySkill[]; sev: 1 | 2 | 3; }

const C = (id: string, label: string, group: string, areas: AnySkill[], sev: 1 | 2 | 3 = 2): CatDef => ({ id, label, group, areas, sev });
const WG: AnySkill[] = ["W", "G"];

export const GROUP = { acc: "Grammar accuracy", struct: "Grammar structures", lex: "Vocabulary & lexis", disc: "Discourse & task", lis: "Listening: why I missed it", read: "Reading", voc: "Vocabulary memory", sp: "Speaking" } as const;

export const CATS: CatDef[] = [
  C("gr.articles", "Articles and determiners", GROUP.acc, WG), C("gr.prepositions", "Prepositions", GROUP.acc, WG),
  C("gr.tenses", "Verb tenses", GROUP.acc, WG, 3), C("gr.sva", "Subject-verb agreement", GROUP.acc, WG, 3),
  C("gr.wordorder", "Word order", GROUP.acc, WG), C("gr.countable", "Countable / uncountable nouns", GROUP.acc, WG),
  C("gr.punctuation", "Punctuation", GROUP.acc, WG, 1), C("gr.sentence", "Sentence structure (fragments, run-ons)", GROUP.acc, WG, 3),
  C("gr.complex", "Complex sentences", GROUP.acc, WG, 3), C("gr.range", "Grammatical range (too many simple sentences)", GROUP.acc, ["W", "S"]),
  C("gr.other", "Other grammar", GROUP.acc, WG),
  C("gr.passive", "Passive voice", GROUP.struct, WG), C("gr.conditionals", "Conditionals", GROUP.struct, WG, 3),
  C("gr.relative", "Relative clauses", GROUP.struct, WG), C("gr.modals", "Modal verbs", GROUP.struct, WG),
  C("gr.verbpatterns", "Verb patterns (gerund / infinitive)", GROUP.struct, WG), C("gr.comparatives", "Comparatives and superlatives", GROUP.struct, WG),
  C("gr.reported", "Reported speech", GROUP.struct, WG),
  C("lx.vocab", "Wrong or imprecise word", GROUP.lex, ["W", "S", "V"]), C("lx.collocation", "Collocations", GROUP.lex, ["W", "S", "V"]),
  C("lx.range", "Lexical range", GROUP.lex, ["W", "S"]), C("lx.wordform", "Word form", GROUP.lex, ["W", "G", "V"]),
  C("lx.spelling", "Spelling", GROUP.lex, ["W", "V", "L"], 1), C("lx.register", "Academic language / register", GROUP.lex, ["W", "S"]),
  C("lx.repetition", "Word repetition", GROUP.lex, ["W", "S"], 1),
  C("dc.coherence", "Coherence", GROUP.disc, ["W", "S"]), C("dc.cohesion", "Cohesion and linking words", GROUP.disc, ["W", "G", "S"]),
  C("dc.paragraph", "Paragraph development", GROUP.disc, ["W"]), C("dc.argument", "Argument development", GROUP.disc, ["W", "S"], 3),
  C("dc.task", "Task response", GROUP.disc, ["W"], 3), C("dc.paraphrase", "Paraphrasing", GROUP.disc, ["W", "R", "L", "P"]),
  C("ls.vocab", "Listening: I did not know the vocabulary", GROUP.lis, ["L"]), C("ls.connected", "Listening: I knew the word but missed it in connected speech", GROUP.lis, ["L"], 3),
  C("ls.meaning", "Listening: I heard the words but did not understand the meaning", GROUP.lis, ["L"]), C("ls.distractor", "Listening: I understood but fell for the distractor", GROUP.lis, ["L"]),
  C("ls.concentration", "Listening: I lost concentration", GROUP.lis, ["L"]), C("ls.numbers", "Listening: numbers, dates and names", GROUP.lis, ["L"]),
  C("ls.speed", "Listening: speech too fast", GROUP.lis, ["L"]), C("ls.accent", "Listening: unfamiliar accent", GROUP.lis, ["L"]),
  C("ls.reduced", "Listening: reduced forms", GROUP.lis, ["L"]), C("ls.prediction", "Listening: did not predict the answer type", GROUP.lis, ["L"], 1),
  C("ls.paraphrase", "Listening: did not recognise the paraphrase", GROUP.lis, ["L"]), C("ls.pronunciation", "Listening: my own pronunciation of the word", GROUP.lis, ["L", "S"]),
  C("ls.lostafter", "Listening: lost the next answers after missing one word", GROUP.lis, ["L"], 3), C("ls.detail", "Listening: missed detail", GROUP.lis, ["L"]),
  C("ls.other", "Listening: cause not yet identified", GROUP.lis, ["L"], 1),
  C("vb.recognition", "Vocabulary: could not recognise the word", GROUP.voc, ["V"]), C("vb.production", "Vocabulary: could not produce the word", GROUP.voc, ["V"]),
  C("sp.fillers", "Speaking: fillers and hesitation", GROUP.sp, ["S"], 1), C("sp.shortanswer", "Speaking: answers too short", GROUP.sp, ["S"]),
  C("sp.repetition", "Speaking: repeating ideas or words", GROUP.sp, ["S"], 1), C("sp.pronunciation", "Speaking: pronunciation", GROUP.sp, ["S"]),
];
const BY_ID: Record<string, CatDef> = Object.fromEntries(CATS.map((c) => [c.id, c]));

/** Dynamic ids exist for question types (rd:<type>), grammar topics without a mapping (gt:<id>) and unknown sources (oth:<skill>). */
export function catDef(id: string): CatDef {
  if (BY_ID[id]) return BY_ID[id];
  if (id.startsWith("rd:")) return C(id, "Reading: " + id.slice(3), GROUP.read, ["R"]);
  if (id.startsWith("gt:")) return C(id, "Grammar: " + id.slice(3), GROUP.struct, WG);
  return C(id, id.replace(/^oth:/, "Other: "), "Other", ["W"], 1);
}
export const catLabel = (id: string) => catDef(id).label;
export const catAreas = (id: string) => catDef(id).areas;

/* ---- mappers ---- */
const TOPIC: Record<string, string> = {
  tenses: "gr.tenses", "present-perfect": "gr.tenses", articles: "gr.articles", prepositions: "gr.prepositions", conditionals: "gr.conditionals",
  passive: "gr.passive", relative: "gr.relative", modals: "gr.modals", complex: "gr.complex", linking: "dc.cohesion", sva: "gr.sva",
  gerunds: "gr.verbpatterns", infinitives: "gr.verbpatterns", comparatives: "gr.comparatives", reported: "gr.reported", punctuation: "gr.punctuation",
  "word-formation": "lx.wordform", conjunctions: "gr.complex", quantifiers: "gr.countable", nominalisation: "lx.register", hedging: "lx.register",
  "parallel-structure": "gr.sentence", "participle-clauses": "gr.complex",
};
export const catOfGrammarTopic = (topicId: string): string => TOPIC[topicId] || "gt:" + topicId;
/** Grammar topic ids that practise a category (reverse of the map above). */
export const topicsOfCat = (cat: string): string[] => Object.entries(TOPIC).filter(([, c]) => c === cat).map(([t]) => t);

const AI: [RegExp, string][] = [
  [/article|determiner/, "gr.articles"], [/preposition/, "gr.prepositions"], [/tense/, "gr.tenses"], [/agreement|subject.?verb/, "gr.sva"],
  [/word order/, "gr.wordorder"], [/countable|uncountable/, "gr.countable"], [/punctuat|capital/, "gr.punctuation"],
  [/simple sentence|range of (sentence|structure)|grammatical range/, "gr.range"], [/complex|subordinat|clause/, "gr.complex"],
  [/sentence structure|fragment|run.?on/, "gr.sentence"], [/collocation/, "lx.collocation"], [/word form|word class/, "lx.wordform"],
  [/spell/, "lx.spelling"], [/repetition of word|word repetition|repeat/, "lx.repetition"], [/register|academic|formal|informal/, "lx.register"],
  [/lexical range|vocabulary range|limited vocab/, "lx.range"], [/vocab|word choice|lexical/, "lx.vocab"], [/paraphras/, "dc.paraphrase"],
  [/link|cohesi|connector|transition/, "dc.cohesion"], [/coheren/, "dc.coherence"], [/paragraph/, "dc.paragraph"],
  [/idea|argument|development|support|example/, "dc.argument"], [/task response|task achievement|off.?topic|overview/, "dc.task"],
  [/filler|hesitat/, "sp.fillers"], [/short answer/, "sp.shortanswer"], [/pronunc/, "sp.pronunciation"], [/grammar/, "gr.other"],
];
export function catOfAi(raw: string, skill: "W" | "S" = "W"): string {
  const t = String(raw || "").toLowerCase();
  if (skill === "S" && /repetit/.test(t)) return "sp.repetition";
  for (const [re, c] of AI) if (re.test(t)) return c;
  return "oth:" + (t || "other").slice(0, 24);
}
const LOCAL: Record<string, string> = {
  Articles: "gr.articles", Determiners: "gr.articles", Prepositions: "gr.prepositions", "Countable/uncountable": "gr.countable", "Subject-verb agreement": "gr.sva",
  Comparatives: "gr.comparatives", Collocations: "lx.collocation", Vocabulary: "lx.vocab", "Verb patterns": "gr.verbpatterns", "Infinitive of purpose": "gr.verbpatterns",
  "Sentence structure": "gr.sentence", "Linking words": "dc.cohesion", Register: "lx.register", Grammar: "gr.other", Capitalisation: "gr.punctuation",
};
export const catOfLocal = (c: string): string => LOCAL[c] || catOfAi(c);

const LTAG: Record<string, string> = {
  numbers: "ls.numbers", names: "ls.numbers", spelling: "lx.spelling", distractors: "ls.distractor", paraphrasing: "ls.paraphrase",
  "fast speech": "ls.speed", accents: "ls.accent", detail: "ls.detail", "no answer": "ls.concentration", "word limit": "ls.other",
};
export const catOfListeningTag = (tag: string): string => LTAG[tag] || "ls.other";
/** Listening causes the user can choose after a miss (they refine the automatic guess from the question tag). */
export const LISTENING_CAUSES = ["ls.vocab", "ls.connected", "ls.meaning", "ls.distractor", "ls.concentration", "ls.numbers", "ls.speed", "ls.accent", "ls.reduced", "ls.prediction", "ls.paraphrase", "ls.lostafter"];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface CatInput { skill: AnySkill; qid: string; qtype: string; tag: string; ref: string; cat?: string; }
/** The single entry point that turns any wrong/correct answer into an error category. */
export function categorize(r: CatInput): string {
  if (r.cat) return r.cat;
  if (r.skill === "L") return catOfListeningTag(r.tag);
  if (r.skill === "R") return "rd:" + (r.qtype || "Reading");
  if (r.skill === "G") { const m = r.qid.match(/^g:([^:]+):/); return catOfGrammarTopic(m ? m[1] : r.ref); }
  if (r.skill === "V") {
    const m = r.qid.match(/^v[pc]?:([^:]+):/); const mode = m ? m[1] : "";
    if (mode === "blank" || mode === "produce" || mode === "cloze" || mode === "sentence") return "vb.production";
    if (mode === "form") return "lx.wordform";
    if (mode === "coll") return "lx.collocation";
    return "vb.recognition";
  }
  if (r.skill === "P") return "dc.paraphrase";
  if (r.skill === "W" || r.skill === "S") return catOfAi(r.tag || r.qtype, r.skill);
  return "oth:" + slug(r.qtype || r.skill);
}
