/* "Copy to Claude": structured prompts. Nothing is sent anywhere by the app - the user copies and pastes. */
import type { State } from "./store";
import type { Content } from "./packs";
import type { Recording, Writing } from "./types";
import { estimates } from "./stats";
import { wordCount } from "./util";

export const CLAUDE_URL = "https://claude.ai/new";
const lang = (s: State) => (s.settings.explainLang === "pt" ? "Brazilian Portuguese" : "English");

const JSON_RULES = `Reply with ONE JSON object only, inside a single \`\`\`json code block. Use plain double quotes, no comments, no trailing commas. Do not add text after the code block.`;

export function writingPrompt(s: State, w: Writing): string {
  const min = w.task === 1 ? 150 : 250;
  const kind = w.task === 1 ? (w.variant === "gt" ? "General Training Writing Task 1 (letter)" : "Academic Writing Task 1") : `${w.variant === "gt" ? "General Training" : "Academic"} Writing Task 2`;
  const c1 = w.task === 1 ? "Task Achievement" : "Task Response";
  return `You are an experienced, strict IELTS Writing examiner. Assess the candidate's response using the public IELTS Writing band descriptors: ${c1}, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy. Be realistic - do not inflate scores. This is IELTS-style ESTIMATED feedback for practice, not an official score.

TASK: ${kind} - ${w.promptType}
QUESTION:
"""
${w.promptText}
"""
MINIMUM LENGTH: ${min} words. CANDIDATE WORD COUNT: ${wordCount(w.text)}. TIME USED: ${Math.round(w.secs / 60)} min (limit ${w.task === 1 ? 20 : 40}).
CANDIDATE'S RESPONSE:
"""
${w.text}
"""

INSTRUCTIONS
1. Band each criterion from 0 to 9 in steps of 0.5, with a 2-3 sentence justification that refers to the descriptors.
2. "overall" = estimated task band (average of the four criteria rounded to the nearest 0.5). Apply descriptor penalties for under-length, off-topic or memorised content.
3. "errors": up to 15 specific problems. "original" must quote the candidate's words EXACTLY. "category" must be one of: grammar, vocabulary, collocation, article, preposition, word repetition, simple sentences, idea development, coherence, linking words, punctuation, spelling, task response. Give "correction" and a short "explanation" of why the correction is better.
4. "vocabulary": up to 8 topic-specific vocabulary recommendations with a short example each.
5. "grammar": up to 5 grammar recommendations.
6. "improvements": up to 5 concrete actions to reach Band 7+.
7. "improved": the candidate's text corrected with minimal changes (keep their ideas and structure).
8. "band7": an approximate Band 7 version of the same answer. "band8": an approximate Band 8 version.
Write justifications, explanations and recommendations in ${lang(s)}. Keep quotes and model texts in English.

${JSON_RULES}
Format:
{"type":"ielts-mastery-feedback","version":1,"skill":"writing","ref":"${w.id}",
 "criteria":{"TA":0,"CC":0,"LR":0,"GRA":0},
 "justification":{"TA":"","CC":"","LR":"","GRA":""},
 "overall":0,
 "summary":"",
 "errors":[{"original":"","category":"","correction":"","explanation":""}],
 "vocabulary":[""],"grammar":[""],"improvements":[""],
 "improved":"","band7":"","band8":""}`;
}

export function speakingPrompt(s: State, recs: Recording[]): string {
  const parts = recs.map((r, i) => `--- Answer ${i + 1} (Part ${r.part}, ${Math.round(r.durSecs)} seconds) ---
QUESTION: ${r.question}
TRANSCRIPT:
"""
${r.transcript.trim() || "(no transcript)"}
"""`).join("\n\n");
  return `You are an experienced IELTS Speaking examiner. Below are TRANSCRIPTS of my spoken answers (typed or produced by speech recognition). Assess them with the public IELTS Speaking band descriptors. This is IELTS-style ESTIMATED feedback, not an official score.

IMPORTANT: You cannot hear the audio. Do NOT give a Pronunciation band: set "P" to null and "pronunciation":"not assessed - transcript only". Base "overall" only on Fluency and Coherence, Lexical Resource and Grammatical Range and Accuracy, and say so in the summary. Transcripts can hide hesitation, so comment on fluency only from what the text shows (fillers, repetitions, self-corrections, answer length).

${parts}

INSTRUCTIONS
1. Band FC, LR and GRA from 0 to 9 in steps of 0.5, with a 2-3 sentence justification each.
2. "overall": average of FC, LR, GRA rounded to the nearest 0.5.
3. "errors": up to 12 items. "original" quotes my exact words; "category" one of: grammar, vocabulary, collocation, fillers, repetition, short answer, idea development, coherence; give "correction" and "explanation".
4. "vocabulary": up to 8 better expressions or useful phrases for these topics.
5. "grammar": up to 4 grammar points to work on.
6. "improvements": up to 5 concrete recommendations.
7. "improved": a better version of my longest answer (natural spoken English, Band 7-8).
Write explanations in ${lang(s)}; keep quotes and model answers in English.

${JSON_RULES}
Format:
{"type":"ielts-mastery-feedback","version":1,"skill":"speaking","ref":"${recs.map((r) => r.id).join(",")}",
 "criteria":{"FC":0,"LR":0,"GRA":0,"P":null},
 "justification":{"FC":"","LR":"","GRA":""},
 "pronunciation":"not assessed - transcript only",
 "overall":0,"summary":"",
 "errors":[{"original":"","category":"","correction":"","explanation":""}],
 "vocabulary":[""],"grammar":[""],"improvements":[""],"improved":""}`;
}

export function tutorContext(s: State, c: Content): string {
  const e = estimates(s);
  const open = s.mistakes.filter((m) => !m.resolved).slice(0, 8);
  const b = (x: number | null) => (x == null ? "unknown" : x.toFixed(1));
  return `CONTEXT ABOUT ME (from my IELTS Mastery app)
- Preparing for: IELTS ${s.profile.exam === "gt" ? "General Training" : "Academic"}; target overall ${s.profile.target}; exam date ${s.profile.examDate || "not set"}.
- Current estimates (IELTS-style, not official): Listening ${b(e.L.band)}, Reading ${b(e.R.band)}, Writing ${b(e.W.band)}, Speaking ${b(e.S.band)}.
- My first language is Portuguese (Brazil).
${open.length ? "- Recent mistakes:\n" + open.map((m) => `  • [${m.qtype}] "${m.prompt.slice(0, 90)}" - I wrote "${m.your}", correct: "${m.correct}"`).join("\n") : ""}
Explain in ${lang(s)} unless I ask otherwise. Do not claim to give official IELTS scores.`;
}

export const TUTOR_TEMPLATES: { label: string; text: string }[] = [
  { label: "Why is this answer wrong?", text: "Why is this answer wrong? Explain the reasoning step by step and give me a rule I can reuse.\n\nQuestion:\nMy answer:\nCorrect answer:" },
  { label: "Why is this Band 6 and not Band 7?", text: "Here is my text. Explain precisely why it would be Band 6 and not Band 7, criterion by criterion, and what I must change.\n\n" },
  { label: "How can I improve this sentence?", text: "How can I improve this sentence? Give 3 versions (Band 6, 7, 8) and explain the differences:\n\n" },
  { label: "Give me another exercise like this", text: "Give me 5 new exercises similar to this one, with answers and explanations at the end:\n\n" },
  { label: "Practise Speaking Part 3 with me", text: "Act as an IELTS examiner and practise Speaking Part 3 with me. Ask one question at a time on the topic below, wait for my answer, then give brief feedback and a follow-up question.\nTopic: " },
  { label: "Correct my essay", text: "Correct my essay. Show each error, the correction and the reason, then give an estimated IELTS-style band per criterion:\n\n" },
  { label: "Vocabulary for a topic", text: "Give me 15 Band 7+ words and collocations for the topic below, with meaning, example sentence and Portuguese translation.\nTopic: " },
  { label: "Test me on a grammar point", text: "Test me on conditionals with 10 questions, one at a time. Correct each answer before the next question." },
  { label: "Give me a Band 7 answer", text: "Give me a Band 7 model answer for this question and highlight the features that make it Band 7:\n\n" },
  { label: "Give me a Band 8 answer", text: "Give me a Band 8 model answer for this question and explain what makes it better than Band 7:\n\n" },
];

export function tutorPrompt(s: State, c: Content, request: string): string {
  return `You are my IELTS tutor.\n\n${tutorContext(s, c)}\n\nMY REQUEST:\n${request}`;
}

/* ---------------- content generation ---------------- */
const READING_TYPES = ["Multiple Choice", "True/False/Not Given", "Yes/No/Not Given", "Matching Headings", "Matching Information", "Matching Features", "Sentence Completion", "Summary Completion", "Note Completion", "Table Completion", "Flow-chart Completion", "Short Answer"];
const LISTENING_TYPES = ["Multiple Choice", "Matching", "Form Completion", "Note Completion", "Table Completion", "Sentence Completion", "Summary Completion", "Short Answer"];

export function generatePackPrompt(kind: "reading" | "listening" | "grammar" | "vocabulary", opts: { topic: string; level: string; types: string[]; count: number }): string {
  const common = `You are writing ORIGINAL IELTS-style practice material for a personal study app. Never copy official IELTS or Cambridge material. The content will be labelled "AI-generated IELTS-style practice". Check every answer carefully: each answer must be unambiguously supported by the text.\n\n${JSON_RULES}\n`;
  if (kind === "reading") return `${common}
Create ${opts.count} Academic Reading passage(s) about "${opts.topic}" at level "${opts.level}" (Beginner, Intermediate, Upper-Intermediate, Advanced or IELTS Level). Each passage: 5-7 paragraphs labelled A, B, C…, 450-750 words in total, 10-14 questions using these question types: ${(opts.types.length ? opts.types : ["True/False/Not Given", "Multiple Choice", "Sentence Completion"]).join(", ")}.

RULES
- "qtype" must be exactly one of: ${READING_TYPES.join(" | ")}.
- Choice types: TRUE/FALSE/NOT GIVEN → options ["TRUE","FALSE","NOT GIVEN"]; YES/NO/NOT GIVEN → ["YES","NO","NOT GIVEN"]; Matching Headings → options like "i  heading text" with "optKey":"roman" and answers "i","ii"…; Matching Information/Features → options like "A  text" with "optKey":"letter" and answers "A","B"…; Multiple Choice → each item has "opts" (4 strings, no letters) and "a" = "A"|"B"|"C"|"D".
- Completion/Short Answer types: give "limit" (max words) and "a" as a list of acceptable answers copied exactly from the passage.
- Every item MUST have "ev": an EXACT quotation (copy-paste) from the passage that proves the answer, and "ex": a short explanation.

Format:
{"type":"ielts-mastery-pack","version":1,"kind":"reading","title":"","sets":[
 {"id":"","title":"","category":"${opts.topic}","level":"${opts.level}","paras":[["A","paragraph text"],["B","…"]],
  "groups":[{"qtype":"True/False/Not Given","instr":"","options":["TRUE","FALSE","NOT GIVEN"],"items":[{"q":"","a":"TRUE","ev":"","ex":""}]},
            {"qtype":"Sentence Completion","instr":"Write NO MORE THAN TWO WORDS from the passage.","limit":2,"items":[{"q":"… ___ …","a":["answer"],"ev":"","ex":""}]}]}]}`;
  if (kind === "listening") return `${common}
Create ${opts.count} Listening script(s) about "${opts.topic}" at level "${opts.level}". Each script: 250-500 words as a list of lines with speaker codes (use "M" for a male voice, "W" for a female voice, "N" for a narrator), and 6-10 questions using: ${(opts.types.length ? opts.types : ["Form Completion", "Multiple Choice"]).join(", ")}. Include realistic IELTS features: spelled names, numbers, and at least two distractors (information that is corrected or rejected).

RULES
- "qtype" must be exactly one of: ${LISTENING_TYPES.join(" | ")}.
- Multiple Choice items have "opts" (3 strings) and "a" = "A"|"B"|"C". Matching groups have "options" like "A  text", "optKey":"letter".
- Completion/Short Answer: "limit" and "a" as a list of acceptable answers.
- Every item has "ev": an EXACT quotation from the script, "ex": explanation, and "tag": one of numbers, names, spelling, distractors, paraphrasing, fast speech, accents, detail.

Format:
{"type":"ielts-mastery-pack","version":1,"kind":"listening","title":"","sets":[
 {"id":"","title":"","category":"${opts.topic}","level":"${opts.level}","voices":{"M":"gb_m","W":"gb_f"},
  "lines":[["W","line text"],["M","line text"]],
  "groups":[{"qtype":"Form Completion","instr":"Write ONE WORD AND/OR A NUMBER.","limit":1,"items":[{"q":"Name: ___","a":["Smith"],"ev":"","ex":"","tag":"spelling"}]}]}]}`;
  if (kind === "grammar") return `${common}
Create ${opts.count} grammar topic(s) for IELTS Band 7 about "${opts.topic}" (level ${opts.level}). Each topic: a short summary, 3-4 rules, 3 examples and 8 multiple-choice exercises in increasing difficulty (lvl 1-3). Each exercise: "q" with ___ for the gap (or a question), "opts" (3 options), "a" = index of the correct option (0, 1 or 2), "why" (why the other options are wrong), "natural" (a natural Band 7+ sentence).

Format:
{"type":"ielts-mastery-pack","version":1,"kind":"grammar","title":"","topics":[
 {"id":"","title":"","summary":"","rules":[""],"examples":[""],"ex":[{"lvl":1,"q":"","opts":["","",""],"a":0,"why":"","natural":""}]}]}`;
  return `${common}
Create ${opts.count} IELTS vocabulary items for the topic "${opts.topic}" (level ${opts.level}). Useful for Writing Task 2 and Speaking.
Each item is an array with exactly 9 strings:
[word, part of speech, definition, example sentence that CONTAINS the word, synonym, antonym (or ""), collocation, word family "form (pos); form (pos)", Portuguese translation].

Format:
{"type":"ielts-mastery-pack","version":1,"kind":"vocabulary","title":"","categories":{"${opts.topic}":[["","","","","","","","",""]]}}`;
}
