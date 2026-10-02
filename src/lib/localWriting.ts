/* Offline writing checks. These are rule-based hints, NOT a band score. */
export interface WIssue { cat: string; text: string; fix: string; match?: string; }
export interface WReport {
  words: number; paragraphs: number; sentences: number; avgLen: number; longSentences: number; shortSentences: number;
  linkers: string[]; linkerCount: number; repeated: [string, number][]; issues: WIssue[]; checklist: { label: string; ok: boolean }[];
}

const LINKERS = ["however", "moreover", "furthermore", "in addition", "therefore", "consequently", "as a result", "on the other hand", "in contrast", "nevertheless", "although", "even though", "whereas", "while", "despite", "in spite of", "for example", "for instance", "such as", "in conclusion", "to conclude", "overall", "firstly", "secondly", "finally", "because", "since", "which", "who", "unless", "provided that", "not only", "this means", "as a consequence", "in particular", "similarly", "likewise"];

/* Common errors for Portuguese-speaking learners (pattern → explanation → better). */
const RULES: [RegExp, string, string, string][] = [
  [/\binformations\b/gi, "Countable/uncountable", "'Information' is uncountable.", "information / pieces of information"],
  [/\badvices\b/gi, "Countable/uncountable", "'Advice' is uncountable.", "advice / pieces of advice"],
  [/\bknowledges\b/gi, "Countable/uncountable", "'Knowledge' is uncountable.", "knowledge"],
  [/\bequipments\b/gi, "Countable/uncountable", "'Equipment' is uncountable.", "equipment"],
  [/\bpeople is\b/gi, "Subject-verb agreement", "'People' is plural.", "people are"],
  [/\bpeople has\b/gi, "Subject-verb agreement", "'People' is plural.", "people have"],
  [/\bthe number of [a-z]+ are\b/gi, "Subject-verb agreement", "'The number of' takes a singular verb.", "the number of … is"],
  [/\bmore (easy|cheap|fast|big|high|low|small|large|hard)\b/gi, "Comparatives", "Short adjectives take -er.", "easier / cheaper / faster…"],
  [/\bmore (better|worse|easier|cheaper|higher|lower)\b/gi, "Comparatives", "Double comparative.", "better / worse…"],
  [/\bdepends? of\b/gi, "Prepositions", "'Depend on', not 'depend of'.", "depend on"],
  [/\bdiscuss about\b/gi, "Prepositions", "'Discuss' takes a direct object.", "discuss (something)"],
  [/\bexplain me\b/gi, "Verb patterns", "'Explain' needs 'to' before the person.", "explain to me"],
  [/\bmake a research\b/gi, "Collocations", "'Research' is uncountable and collocates with 'do/conduct'.", "do / conduct research"],
  [/\bmake a (question|party)\b/gi, "Collocations", "Use 'ask a question' / 'have a party'.", "ask a question / have a party"],
  [/\bsince \d+ (years|months|days)\b/gi, "Prepositions", "Use 'for' with a period of time.", "for 5 years"],
  [/\baccording with\b/gi, "Prepositions", "'According to'.", "according to"],
  [/\bin the other hand\b/gi, "Linking words", "Fixed phrase: 'on the other hand'.", "on the other hand"],
  [/\b(the )?(society|nature|education|technology) (is|has|plays)\b/gi, "Articles", "Check articles: general ideas take no article ('Society is…', 'Education plays…').", "Education plays / Society is"],
  [/\bthe most of\b/gi, "Determiners", "'Most of the' or 'most' + noun.", "most people / most of the people"],
  [/\bin the nowadays\b|\bnowadays days\b/gi, "Vocabulary", "Use 'nowadays' alone.", "nowadays"],
  [/\bactually\b/gi, "False friend (check)", "'Actually' means 'in fact', not 'currently' (atualmente).", "currently / nowadays (if you mean 'atualmente')"],
  [/\beventually\b/gi, "False friend (check)", "'Eventually' means 'in the end', not 'occasionally' (eventualmente).", "occasionally / sometimes (if you mean 'eventualmente')"],
  [/\bpretend to\b/gi, "False friend (check)", "'Pretend' means 'fingir'. For 'pretender' use 'intend'.", "intend to / plan to"],
  [/\bfor (study|learn|improve|buy|get)\b/gi, "Infinitive of purpose", "Purpose = to + verb.", "to study / to improve…"],
  [/\bit'?s mean\b/gi, "Grammar", "'It means', not 'it's mean'.", "it means"],
  [/\b(don't|doesn't|can't|won't|isn't|aren't|it's|I'm|they're|we're|didn't|wouldn't|shouldn't)\b/g, "Register", "Avoid contractions in Academic Writing and formal letters.", "do not / cannot / it is…"],
  [/\b(gonna|wanna|kinda|stuff|things like that|a lot of things)\b/gi, "Register", "Informal or vague expression.", "a range of / various / numerous"],
  [/(^|[.!?]\s+)(and|but|so)\b/gi, "Sentence structure", "Avoid starting sentences with 'And/But/So' in formal writing.", "Moreover / However / Therefore"],
  [/\bi\b/g, "Capitalisation", "The pronoun 'I' is always capital.", "I"],
];

export function analyseWriting(text: string, task: 1 | 2, register: "formal" | "informal" = "formal"): WReport {
  const clean = text.replace(/\r/g, "");
  const words = (clean.match(/[A-Za-z0-9'’-]+/g) || []).length;
  const paragraphs = clean.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 20).length;
  const sentList = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 2);
  const lens = sentList.map((s) => s.split(/\s+/).length);
  const avgLen = lens.length ? Math.round((lens.reduce((a, b) => a + b, 0) / lens.length) * 10) / 10 : 0;
  const low = " " + clean.toLowerCase() + " ";
  const linkers = LINKERS.filter((l) => new RegExp(`\\b${l}\\b`).test(low));
  const linkerCount = LINKERS.reduce((n, l) => n + (low.match(new RegExp(`\\b${l}\\b`, "g")) || []).length, 0);
  const STOP = new Set("the a an and or but to of in on at for is are was were be been it this that these those with as by from their there they them which who will would can could should may might also more most such than then very have has had not do does did its into about many some other people what when where while because".split(" "));
  const freq: Record<string, number> = {};
  for (const w of clean.toLowerCase().match(/[a-z']+/g) || []) if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  const repeated = Object.entries(freq).filter(([, n]) => n >= (words > 200 ? 5 : 4)).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const issues: WIssue[] = [];
  for (const [re, cat, why, fix] of RULES) {
    if (register === "informal" && (cat === "Register" || cat === "Sentence structure")) continue;
    if (cat === "Capitalisation") { const m = clean.match(/(^|\s)i(\s|'|,)/g); if (m) issues.push({ cat, text: `${m.length}× lowercase "i".`, fix, match: "i" }); continue; }
    const m = clean.match(re);
    if (m) issues.push({ cat, text: `${why} Found: "${[...new Set(m.map((x) => x.trim()))].slice(0, 3).join('", "')}"`, fix, match: m[0] });
  }
  const min = task === 1 ? 150 : 250;
  if (words < min) issues.unshift({ cat: "Task length", text: `${words} words - below the minimum of ${min}. Under-length answers lose marks in Task ${task === 1 ? "Achievement" : "Response"}.`, fix: `Write at least ${min + 10} words.` });
  const long = lens.filter((l) => l > 40).length;
  const short = lens.filter((l) => l < 8).length;
  if (long) issues.push({ cat: "Sentence structure", text: `${long} very long sentence(s) (over 40 words) - risk of run-on errors.`, fix: "Split into two sentences or use a relative clause." });
  if (lens.length >= 6 && short / lens.length > 0.35) issues.push({ cat: "Simple sentences", text: "Many short, simple sentences.", fix: "Combine ideas with although, which, because, while." });
  if (linkers.length < 4) issues.push({ cat: "Linking words", text: `Only ${linkers.length} different linking words.`, fix: "Use a range: however, as a result, for instance, whereas, which." });
  if (words && linkerCount / Math.max(1, sentList.length) > 1.3) issues.push({ cat: "Linking words", text: "Very frequent linking words - may look mechanical.", fix: "Not every sentence needs a linker; use referencing (this, such, these measures)." });
  repeated.slice(0, 3).forEach(([w, n]) => issues.push({ cat: "Word repetition", text: `"${w}" used ${n} times.`, fix: "Use synonyms or pronouns." }));
  const expectedParas = task === 1 ? 3 : 4;
  const checklist = [
    { label: `At least ${min} words`, ok: words >= min },
    { label: `${expectedParas}+ clear paragraphs`, ok: paragraphs >= expectedParas },
    { label: task === 1 ? "Overview sentence (Overall, …)" : "Clear position stated", ok: task === 1 ? /\b(overall|in general|it is clear that|it is evident)\b/i.test(clean) : /\b(i (strongly )?(believe|agree|disagree|think)|in my (view|opinion)|this essay will argue)\b/i.test(clean) },
    { label: "Range of linking words (4+)", ok: linkers.length >= 4 },
    { label: "Complex sentences (although, which, whereas…)", ok: /\b(although|whereas|which|who|while|unless|even though)\b/i.test(clean) },
    { label: task === 1 ? "Data / figures mentioned" : "Conclusion paragraph", ok: task === 1 ? /\d/.test(clean) || register !== "formal" : /\b(in conclusion|to conclude|to sum up|overall)\b/i.test(clean) },
  ];
  return { words, paragraphs, sentences: sentList.length, avgLen, longSentences: long, shortSentences: short, linkers, linkerCount, repeated, issues, checklist };
}
